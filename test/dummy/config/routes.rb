Rails.application.routes.draw do
  mount Caixanegra::Engine, at: "/caixanegra"

  get '/', to: 'home#index'
end
