# frozen_string_literal: true

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
          @units ||= ::Caixanegra::UnitHelper.scoped_units(unit_scope).map do |k, v|
            base = {
              scope: v.scope,
              title: v.unit_name,
              type: v.type,
              description: v.description,
              class: k,
              exits: v.exits&.map { |e| { name: e } },
              inputs: v.inputs,
              assignments: v.assignments,
              color: v.color
            }

            base[:set] = v.set if base[:set]

            base
          end
        end
      end
    end
  end
end
