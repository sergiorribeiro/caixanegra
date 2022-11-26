module Caixanegra
  module Api
    module Designer
      class FlowsController < ::Caixanegra::ApiController
        before_action :set_flow

        def show
          render json: @flow
        end

        private

        def set_flow
          #Caixanegra.redis GET FLOW
          @flow = Flow.find(params[:id])
        end
      end
    end
  end
end
