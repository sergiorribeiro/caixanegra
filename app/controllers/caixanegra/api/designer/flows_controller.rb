module Caixanegra
  module API
    module Designer
      class FlowsController < ::Caixanegra::APIController
        before_action :set_flow, only: %i[show]

        def show
          render json: @flow
        end

        def update
          Caixanegra::Manager.set(params[:id], JSON.parse(request.body.read))

          head :ok
        end

        private

        def set_flow
          @flow = Caixanegra::Manager.get(params[:id])
        end
      end
    end
  end
end
