Caixanegra::Engine.routes.draw do
  get '/design/:id', to: 'designer#index'

  namespace :api, constraints: { format: :json } do
    namespace :designer do
      resources :units, only: %i[index]
      resources :flows, only: %i[show update]
    end
  end
end
