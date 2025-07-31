class ApplicationController < ActionController::API
  def index
    render json: {
      message: 'Easy Hotel - Rooms Service',
      version: '1.0.0'
    }
  end
end
