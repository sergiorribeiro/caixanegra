# frozen_string_literal: true

module Caixanegra
  class DesignerController < ApplicationController
    def index
      @mounted_path = Caixanegra::Engine.routes.find_script_name({})
    end
  end
end
