module CaixanegraUnit
  class Start < Caixanegra::Unit
    configure_name "Start"
    configure_description "Standard flow starting point"

    configure_type :starter
    configure_exits %i[exit]
  end
end
