Caixanegra::Engine.routes.draw do
  get '/', to: 'overview#index'
  get '/:id/design', to: 'designer#index'

  namespace :api, constraints: { format: :json } do
    namespace :designer do
      resources :units, only: %i[index]
      resources :flows, only: %i[show]
    end
  end
end
