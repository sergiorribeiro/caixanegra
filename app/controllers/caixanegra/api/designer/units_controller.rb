module Caixanegra
  module Api
    module Designer
      class UnitsController < ::Caixanegra::ApiController
        def index
          @units = Caixanegra.units

          render json: @units
        end
      end
    end
  end
end
