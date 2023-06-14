$LOAD_PATH.push File.expand_path('lib', __dir__)

require 'caixanegra/version'

Gem::Specification.new do |spec|
  spec.name        = 'caixanegra'
  spec.version     = Caixanegra::VERSION
  spec.authors     = ['sergiorribeiro']
  spec.email       = ['sergio.r.ribeiro@live.com']
  spec.homepage    = 'https://github.com/sergiorribeiro/caixanegra/wiki'
  spec.summary     = 'Unopinionated flow oriented blackbox designer, executor and debugger'
  spec.description = 'An unopinionated, flow oriented blackbox designer and executor to interface your service classes'
  spec.license     = 'MIT'
  spec.files = Dir[
    '{app,config,db,lib}/**/*',
    'MIT-LICENSE',
    'Rakefile',
    'README.md'
  ]

  spec.add_dependency 'rails', '>= 6.0.4'
  spec.add_dependency 'sassc-rails'

  spec.required_ruby_version = '>= 2.7.5'
end
