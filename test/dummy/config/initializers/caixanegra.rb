Caixanegra.setup do |config|
  config.units = {
    start: CaixanegraUnit::Start,
    string_feeder: CaixanegraUnit::StringFeeder,
    terminate: CaixanegraUnit::Terminate,
    uppercase: CaixanegraUnit::Uppercase,
  }
end