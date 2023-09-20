module Caixanegra
  class UnitHelper
    class << self
      def scoped_units(scope)
        units = {}

        scopes = (scope || "").split(",").map(&:to_sym)
        Caixanegra.units.each do |unit|
          unit_scope = unit.is_a?(Array) ? unit[0].scope : unit.scope
          if unit_scope.nil? || unit_scope.any? { |checking_scope| scopes.include?(checking_scope) }
            if unit.is_a? Array
              units[unit[1]] = unit[0]
            else
              units[unit.name.demodulize.underscore.to_sym] = unit
            end
          end
        end

        units
      end

      def all_units
        units = {}

        Caixanegra.units.each do |unit|
          if unit.is_a? Array
            units[unit[1]] = unit[0]
          else
            units[unit.name.demodulize.underscore.to_sym] = unit
          end
        end

        units
      end
    end
  end
end
