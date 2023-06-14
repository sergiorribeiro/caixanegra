module Caixanegra
  class UnitHelper
    class << self
      def scoped_units(scope)
        all_units = {}
        all_units = all_units.merge(Caixanegra.units.reject { |_, v| v.is_a? Hash })

        (scope || "").split(",").each do |current_scope|
          all_units = all_units.merge(Caixanegra.units[current_scope.to_sym])
        end

        all_units
      end

      def all_units
        all_units = {}

        Caixanegra.units.each do |k, v|
          if v.is_a? Hash
            v.each do |ik, iv|
              all_units[ik] = iv
            end
          else
            all_units[k] = v
          end
        end

        all_units
      end
    end
  end
end