module CaixanegraUnit
  class StringFeeder < Caixanegra::Unit
    configure_name "String Feeder"
    configure_description "Feeds units with strings"

    configure_type :feeder
    configure_inputs %i[string]

    def flow
      carry_over(output: input(:string))
      exit_through :output
    end
  end
end
