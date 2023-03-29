# frozen_string_literal: true

module Caixanegra
  self.mattr_accessor :units
  self.mattr_accessor :redis
  self.units = []

  def self.setup(&block)
    yield self
  end

  class Engine < ::Rails::Engine
    isolate_namespace Caixanegra

    initializer 'caixanegra.assets.precompile' do |app|
      app.config.assets.precompile += %w[
        caixanegra/api.js
        caixanegra/caixanegra.js
        caixanegra/designer.js
        caixanegra/sabertooth.js
        caixanegra/application.css
      ]
    end
  end
end
