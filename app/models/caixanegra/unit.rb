# frozen_string_literal: true

module Caixanegra
  class Unit
    attr_reader :oid

    def initialize(oid, inputs = {}, mappings = {}, carry_over = {}, storage = {})
      @oid = oid
      @mappings = mappings
      @inputs = inputs
      @carry_over = carry_over.with_indifferent_access
      @storage = storage.with_indifferent_access
      set_mapping_defaults
    end

    def current_carry_over
      @carry_over.dup
    end

    def current_storage
      @storage.dup
    end

    def carry_over(value)
      @carry_over.merge!(value) if value.is_a? Hash
    end

    def persist(value)
      @storage.merge!(value) if value.is_a? Hash
    end

    def exit_through(exit_id)
      {
        exit_through: exit_id,
        carry_over: @carry_over
      }
    end

    def exit_and_return
      {
        carry_over: @carry_over
      }
    end

    def flow
      exit_through exits.first
    end

    def input(id)
      input_metadata = @mappings[id]
      input_value = case input_metadata&.[](:type)
                    when 'storage'
                      @storage[id]
                    when 'carryover'
                      @carry_over[id]
                    when 'user'
                      input_metadata[:value]
                    end

      if input_value.present?
        result = input_value.dup
        input_value.to_s.scan(Regexp.new(/%(.*?)%/)) do |match|
          match = match[0]
          result.gsub!("%#{match}%", @carry_over[match] || '')
        end
        input_value.to_s.scan(Regexp.new(/@(.*?)@/)) do |match|
          match = match[0]
          result.gsub!("@#{match}@", @storage[match] || '')
        end

        input_value = result
      end

      input_value.presence || @inputs[id][:default]
    rescue StandardError
      raise(UnitIOException.new, "Unable to fetch input '#{id}'")
    end

    def scope
      self.class.scope
    end

    def unit_name
      self.class.unit_name
    end

    def description
      self.class.description
    end

    def inputs
      self.class.inputs || []
    end

    def exits
      self.class.exits || []
    end

    def set
      self.class.set || []
    end

    def color
      self.class.color
    end

    private

    def set_mapping_defaults
      (self.class.inputs || {}).each do |key, data|
        next if @mappings.key? key

        @mappings[key] = { type: 'carryover' }
        @mappings[key][:value] = data[:default] if data[:default].present?
      end
    end

    class << self
      attr_reader(
        :unit_name,
        :description,
        :inputs,
        :exits,
        :assignments,
        :type,
        :scope,
        :color
      )

      @type = :passthrough

      def configure_scope(value)
        @scope = value
      end

      def configure_name(value)
        @unit_name = value
      end

      def configure_description(value)
        @description = value
      end

      def configure_type(value)
        @type = value
      end

      def configure_exits(exits)
        @exits = exits
      end

      def configure_inputs(inputs)
        @inputs = inputs
      end

      def configure_assignments(assignments)
        @assignments = assignments
      end

      def configure_color(color)
        @color = color
      end
    end
  end
end
