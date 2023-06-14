# frozen_string_literal: true

module Caixanegra
  module Api
    module Designer
      class FlowsController < ::Caixanegra::ApiController
        before_action :set_flow, only: %i[show debug_run]

        def show
          render json: @flow
        end

        def update
          Caixanegra::Manager.set(params[:id], JSON.parse(request.body.read))

          head :ok
        end

        def debug_run
          execution = Caixanegra::Executor.new(
            initial_carryover: initial_carryover,
            flow_definition: @flow,
            debug_mode: true
          ).run

          render json: { result: execution[:result], debug: execution[:debug] }
        end

        private

        def initial_carryover
          JSON.parse(request.body.read)
        rescue StandardError
          {}
        end

        def set_flow
          @flow = Caixanegra::Manager.get(params[:id])
        end
      end
    end
  end
end
