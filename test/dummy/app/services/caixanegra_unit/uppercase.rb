module CaixanegraUnit
  class Uppercase < Caixanegra::Unit
    configure_name "Uppercase"
    configure_description "Uppercases input"

    configure_inputs %i[input]
    configure_exits %i[output]

    def flow
      subject = input(:input)
      carry_over(output: subject.upcase)
      exit_through :output
    end
  end
end
