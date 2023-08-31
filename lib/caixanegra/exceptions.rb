# frozen_string_literal: true

module Caixanegra
  class UnitScopedException < StandardError
    attr_reader :unit

    def initialize(exception, unit)
      @unit = unit
      super(exception.message)
    end
  end

  class UnitIOException < StandardError
    attr_reader :unit

    def initialize(unit)
      @unit = unit
      super
    end
  end

  class ContinuityException < StandardError; end
end
