require "caixanegra"

class HomeController < ApplicationController
  def index
    @result = Caixanegra::Executor.new("flow_x").run
  end
end
