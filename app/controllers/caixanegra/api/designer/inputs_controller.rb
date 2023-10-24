module Caixanegra
  module API
    module Designer
      class InputsController < ::Caixanegra::APIController
        def evaluate_regex
          full_match = sample.match(Regexp.new(expression, Regexp::IGNORECASE))
          direct = { "_full": full_match.to_s, "_expression": expression }
          captures = {}

          (full_match&.captures || []).each_with_index do |capture, index|
            captures["c#{index}"] = capture
          end
          named_captures = full_match&.named_captures || {}

          render json: direct.merge(captures).merge(named_captures).symbolize_keys
        rescue RegexpError
          head 422
        end

        private

        def expression
          @expression ||= params[:expression]
        end

        def sample
          @sample ||= params[:sample]
        end
      end
    end
  end
end
