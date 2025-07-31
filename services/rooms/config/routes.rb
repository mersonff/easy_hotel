Rails.application.routes.draw do
  # Health check
  get '/health', to: proc { [200, {}, [{ status: 'OK', service: 'Rooms Service', version: '1.0.0', timestamp: Time.current.iso8601 }.to_json]] }
  
  # API routes
  namespace :api do
    resources :rooms, only: [:index, :show, :create, :update, :destroy] do
      member do
        post :maintenance
      end
    end
    
    get 'rooms/availability', to: 'rooms#availability'
  end
  
  # Root route
  root 'application#index'
end
