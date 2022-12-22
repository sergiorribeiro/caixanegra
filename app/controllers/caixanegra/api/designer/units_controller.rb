module Caixanegra
  module API
    module Designer
      class UnitsController < ::Caixanegra::APIController
        def index
          render json: units
        end

        private

        def unit_scope
          params[:scope].presence || nil
        end

        def units
          @units ||= begin
            base_units = Caixanegra.units.reject { |_, v| v.is_a? Hash }
            scope_units = Caixanegra.units[unit_scope] if unit_scope.present?
            all_units = base_units.merge(scope_units || {})

            all_units.map do |k, v|
              {
                title: v.name,
                type: v.type,
                description: v.description,
                class: k,
                exits: v.exits&.map { |e| { name: e } },
                inputs: v.inputs
              }
            end
          end
        end
      end
    end
  end
end
