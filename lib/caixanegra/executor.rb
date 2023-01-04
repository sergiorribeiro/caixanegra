# frozen_string_literal: true

module Caixanegra
  class Executor
    def initialize(params)
      @initial_carryover = params[:initial_carryover] || {}
      @flow = (params[:flow_definition] || {}).deep_symbolize_keys
      @unit_scope = params[:unit_scope]
      @debug_mode = params[:debug_mode] == true
      @execution = { history: [], steps: [] }
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
      log_console_entry "Started"
      set_start_unit
      format_result(flow_through)
    rescue Caixanegra::UnitScopedException => e
      log_step_exception(e)
      format_result(e.message)
    rescue => e
      format_result(e.message)
    end

    def log_console_entry(message)
      return unless @debug_mode

      @execution[:history] << {
        timestamp: Time.current.to_i,
        message: message
      }
    end

    def log_new_step
      return unless @debug_mode

      @execution[:steps] << {
        oid: @step_unit.oid,
        in: {
          timestamp: Time.current.to_i,
          carry_over: @step_unit.current_carry_over
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
        process_feeders
        result = begin
          @step_unit.flow
        rescue => e
          exception = Caixanegra::UnitScopedException.new(e)
          exception.set_backtrace(e.backtrace)
          raise exception
        end
        next_unit = next_unit(result)
        log_step_result(result, next_unit)
        @step_unit = next_unit
        log_new_step
      end

      @step_unit.flow[:carry_over]
    end

    def map_carry_over(result)
      mapped_carry_over = {}
      exit_name = result[:exit_through]
      carry_over = result[:carry_over].deep_symbolize_keys
      metadata = unit_metadata(@step_unit.oid)
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      (exit_metadata[:mappings] || []).each do |mapping|
        mapped_carry_over[mapping[:as].to_sym] = carry_over.dig(
          *(mapping[:use] || '').split('.').map(&:to_sym)
        )
      end

      mapped_carry_over
    end

    def next_unit(result)
      exit_name = result[:exit_through]
      metadata = unit_metadata(@step_unit.oid)
      log_console_entry "Next unit found through '#{exit_name}': '#{@step_unit.oid}'"
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      unit(exit_metadata[:target], map_carry_over(result), @step_unit.storage)
    end

    def process_feeders
      carry_over = {}
      @flow[:units].filter do |unit|
        unit[:type] == 'feeder' && (unit[:exits] || []).any? { |ex| ex[:target] == @step_unit.oid }
      end.each do |feeder|
        feeder_instance = unit_instance(feeder)
        log_console_entry "Flowing feeder '#{feeder_instance.oid}'"
        result = feeder_instance.flow
        carry_over.merge! map_carry_over(feeder_instance.oid, result)
      end
      @step_unit.carry_over(carry_over)
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

    def unit(oid, carry_over = {}, storage = {})
      unit_instance(unit_metadata(oid), carry_over, storage)
    end

    def unit_instance(unit_data, carry_over = {}, storage = {})
      mappings = unit_data[:mappings] || {}
      unit_class = scoped_units[unit_data[:class].to_sym]
      inputs = unit_class.inputs
      unit_class.new(unit_data[:oid], inputs, mappings, carry_over, storage)
    end

    def scoped_units
      @scoped_units ||= begin
        base_units = Caixanegra.units.reject { |_, v| v.is_a? Hash }
        scope_units = Caixanegra.units[@unit_scope] if @unit_scope.present?

        base_units.merge(scope_units || {})
      end
    end
  end
end
