# frozen_string_literal: true

module Caixanegra
  class Unit
    attr_reader :oid, :storage

    def initialize(oid, inputs = {}, mappings = {}, carry_over = {}, storage = {})
      @oid = oid
      @mappings = mappings
      @inputs = inputs
      @carry_over = carry_over
      @storage = storage
      set_mapping_defaults
    end

    def current_carry_over
      @carry_over.dup
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

    def flow
      exit_through exits.first
    end

    def input(id)
      input_metadata = @mappings[id]
      value_as_pointer = input_metadata[:value] || id
      input_value = case input_metadata&.[](:type)
                    when 'storage'
                      @storage.dig(*value_as_pointer.to_s.split('.').map(&:to_sym))
                    when 'carryover'
                      @carry_over.dig(*value_as_pointer.to_s.split('.').map(&:to_sym))
                    when 'user'
                      input_metadata[:value]
                    end

      input_value.presence || @inputs[id][:default]
    end

    def name
      self.class.name
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

    private

    def set_mapping_defaults
      (self.class.inputs || {}).each do |key, data|
        next if @mappings.key? key

        @mappings[key] = { type: 'carryover' }
        @mappings[key][:value] = data[:default] if data[:default].present?
      end
    end

    class << self
      attr_reader :name, :description, :inputs, :exits, :type

      @type = :passthrough

      def configure_name(value)
        @name = value
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
    end
  end
end
