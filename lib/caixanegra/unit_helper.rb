module Caixanegra
  class UnitHelper
    class << self
      def scoped_units(scope)
        units = {}

        scopes = (scope || "").split(",").map(&:to_sym)
        Caixanegra.units.each do |unit|
          if unit.scope.nil? || unit.scope.any? { |checking_scope| scopes.include?(checking_scope) }
            units[unit.name.demodulize.underscore.to_sym] = unit
          end
        end

        units
      end

      def all_units
        units = {}

        Caixanegra.units.each do |unit|
          units[unit.name.demodulize.underscore.to_sym] = unit
        end

        units
      end
    end
  end
end