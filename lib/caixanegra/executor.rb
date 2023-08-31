# frozen_string_literal: true

module Caixanegra
  class Executor
    def initialize(params)
      @initial_carryover = params[:initial_carryover] || {}
      @flow = (params[:flow_definition] || {}).deep_symbolize_keys
      @debug_mode = params[:debug_mode] == true
      @execution = { history: [], steps: [] }
      @storage = {}
    end

    def run
      run_and_report_result
    end

    private

    def format_result(result)
      return result unless @debug_mode

      {
        result: result,
        debug: @execution
      }
    end

    def run_and_report_result
      log_console_entry 'Started'
      set_start_unit
      format_result(flow_through)
    rescue Caixanegra::UnitScopedException, Caixanegra::UnitIOException => e
      log_step_exception(e)
      log_console_entry("Unit '#{e.unit.oid}' error: #{e.message}")
      format_result(e.message)
    rescue => e
      log_console_entry("Error: #{e.message}")
      format_result(e.message)
    end

    def log_console_entry(message)
      return unless @debug_mode

      @execution[:history] << {
        timestamp: Time.current.to_i,
        message: message
      }
    end

    def log_new_step(target_unit = @step_unit)
      return unless @debug_mode

      @execution[:steps] << {
        oid: target_unit.oid,
        in: {
          timestamp: Time.current.to_i,
          carry_over: target_unit.current_carry_over,
          storage: target_unit.current_storage
        }
      }
    end

    def log_feeder_step(result, feeder)
      return unless @debug_mode

      {
        oid: feeder.oid,
        in: {
          timestamp: Time.current.to_i,
          carry_over: feeder.current_carry_over,
          storage: feeder.current_storage
        },
        out: {
          timestamp: Time.current.to_i,
          result: result,
          target_unit: @step_unit&.oid
        }
      }
    end

    def log_step_exception(exception)
      return unless @debug_mode

      @execution[:steps].last[:exception] = {
        timestamp: Time.current.to_i,
        message: exception.message,
        backtrace: exception.backtrace
      }
    end

    def log_step_result(result, next_unit)
      return unless @debug_mode

      @execution[:steps].last[:out] = {
        timestamp: Time.current.to_i,
        result: result,
        target_unit: next_unit&.oid
      }
    end

    def flow_through
      while @step_unit.exits.size.nonzero?
        feeder_steps = process_feeders
        result = begin
          log_console_entry("Flowing #{@step_unit.oid}")
          result = @step_unit.flow
          @storage.merge! @step_unit.current_storage
          result
        rescue => e
          exception = Caixanegra::UnitScopedException.new(e, @step_unit)
          exception.set_backtrace(e.backtrace)
          raise exception
        end
        next_unit = next_unit(result)
        raise(ContinuityException.new, "Unable to choose a valid exit") if next_unit.nil?

        log_step_result(result, next_unit)
        @execution[:steps] += feeder_steps
        @step_unit = next_unit
        log_new_step
      end

      log_console_entry("Reached terminator #{@step_unit.oid}")

      @step_unit.flow[:carry_over]
    end

    def map_carry_over(result, target_step: @step_unit)
      mapped_carry_over = {}
      exit_name = result[:exit_through]
      carry_over = result[:carry_over].deep_symbolize_keys
      metadata = unit_metadata(target_step.oid)
      mapped_carry_over.merge!(carry_over) if metadata[:type] == 'passthrough'
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      (exit_metadata[:mappings] || []).each do |mapping|
        next if mapping[:use].blank? || mapping[:as].blank?

        mapped_carry_over[mapping[:as].to_sym] = carry_over.dig(
          *(mapping[:use] || '').split('.').map(&:to_sym)
        )
      end

      mapped_carry_over
    end

    def next_unit(result)
      return nil if result.nil?

      exit_name = result[:exit_through]
      metadata = unit_metadata(@step_unit.oid)
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      next_unit = unit(exit_metadata[:target], map_carry_over(result))
      log_console_entry "Next unit found through '#{exit_name}': '#{next_unit.oid}'"

      next_unit
    end

    def process_feeders
      feeder_hits = []
      carry_over = {}
      @flow[:units].filter do |unit|
        unit[:type] == 'feeder' && (unit[:exits] || []).any? { |ex| ex[:target] == @step_unit.oid }
      end.each do |feeder|
        feeder_instance = unit_instance(feeder)
        log_console_entry "Flowing feeder '#{feeder_instance.oid}'"
        result = feeder_instance.flow
        carry_over.merge! map_carry_over(result, target_step: feeder_instance)
        feeder_hits << log_feeder_step(result, feeder_instance)
      end
      @step_unit.carry_over(carry_over)

      feeder_hits
    end

    def unit_metadata(oid)
      @flow[:units].find { |u| u[:oid] == oid }
    end

    def set_start_unit
      @step_unit = unit(@flow[:entrypoint])
      log_console_entry "Start unit set: #{@step_unit&.oid || 'none'}"
      @step_unit.carry_over(@initial_carryover)
      log_new_step
    end

    def unit(oid, carry_over = {})
      unit_instance(unit_metadata(oid), carry_over)
    end

    def unit_instance(unit_data, carry_over = {})
      mappings = unit_data[:mappings] || {}
      unit_class = scoped_units[unit_data[:class].to_sym]
      inputs = unit_class.inputs
      unit_class.new(unit_data[:oid], inputs, mappings, carry_over, @storage)
    rescue
      log_console_entry "Unable to load unit instance of type '#{unit_data[:class]}'"
      nil
    end

    def scoped_units
      @scoped_units ||= UnitHelper.all_units
    end
  end
end
