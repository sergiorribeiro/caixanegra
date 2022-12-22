module Caixanegra
  class Executor
    def initialize(initial_carryover, flow_definition, unit_scope = nil)
      @initial_carryover = initial_carryover
      @flow = flow_definition
      @unit_scope = unit_scope
    end

    def run
      step_unit = start_unit
      step_unit.carry_over(@initial_carryover)

      while step_unit.exits.size.nonzero?
        feeders_carry_over = process_feeders(step_unit)
        step_unit.carry_over(feeders_carry_over)
        result = step_unit.flow
        carry_over = map_carry_over(step_unit.oid, result)
        step_unit = next_unit(step_unit, result[:exit_through], carry_over)
      end

      step_unit.flow[:carry_over]
    end

    private

    def map_carry_over(oid, result)
      mapped_carry_over = {}
      exit_name = result[:exit_through]
      carry_over = result[:carry_over]
      metadata = unit_metadata(oid)
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      (exit_metadata[:mappings] || []).each do |mapping|
        mapped_carry_over[mapping[:as].to_sym] = carry_over[*mapping[:use].split(".").map(&:to_sym)]
      end

      mapped_carry_over
    end

    def next_unit(current_unit, exit_name, carry_over)
      metadata = unit_metadata(current_unit.oid)
      exit_metadata = metadata[:exits].find { |ex| ex[:name] == exit_name.to_s }
      unit(exit_metadata[:target], carry_over, current_unit.storage)
    end

    def process_feeders(step_unit)
      carry_over = {}
      flow[:units].filter do |unit|
        unit[:type] == "feeder" && (unit[:exits] || []).any? { |ex| ex[:target] == step_unit.oid }
      end.each do |feeder|
        feeder_instance = unit_instance(feeder)
        result = feeder_instance.flow
        carry_over.merge! map_carry_over(feeder_instance.oid, result)
      end
      carry_over
    end

    def unit_metadata(oid)
      flow[:units].find { |u| u[:oid] == oid }
    end

    def start_unit
      unit(flow[:entrypoint])
    end

    def unit(oid, carry_over = {}, storage = {})
      unit_instance(unit_metadata(oid), carry_over, storage)
    end

    def unit_instance(unit_data, carry_over = {}, storage = {})
      mappings = unit_data[:mappings] || {}
      unit_class = scoped_units[unit_data[:unit].to_sym]
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
