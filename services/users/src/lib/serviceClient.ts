import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ServiceClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export interface ServiceResponse<T = any> {
  data: T;
  status: number;
  success: boolean;
  error?: string;
}

export class ServiceClient {
  private client: AxiosInstance;
  private apiKey: string;
  private retries: number;

  constructor(config: ServiceClientConfig) {
    this.apiKey = config.apiKey;
    this.retries = config.retries || 3;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'User-Agent': 'EasyHotel-ServiceClient/1.0'
      }
    });

    // Interceptor para retry automático
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config } = error;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry >= this.retries) {
          return Promise.reject(error);
        }

        config.retry += 1;
        
        // Delay exponencial
        const delay = Math.pow(2, config.retry) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.client(config);
      }
    );

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 [ServiceClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ [ServiceClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ [ServiceClient] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ [ServiceClient] ${error.response?.status || 'NETWORK'} ${error.config?.url}:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  // Método genérico para requisições
  async request<T = any>(config: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error: any) {
      return {
        data: null as any,
        status: error.response?.status || 500,
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Métodos HTTP específicos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  // Método para health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success && response.status === 200;
    } catch {
      return false;
    }
  }
}

// Clientes específicos para cada serviço
export class ReservationsClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.RESERVATIONS_SERVICE_URL || 'http://reservations-service:3001',
      apiKey: process.env.RESERVATIONS_API_KEY || 'reservations-secret-key'
    });
  }

  // Métodos específicos do serviço de reservas
  async createReservation(data: any) {
    return this.post('/reservations', data);
  }

  async getReservation(id: string) {
    return this.get(`/reservations/${id}`);
  }

  async updateReservation(id: string, data: any) {
    return this.put(`/reservations/${id}`, data);
  }

  async cancelReservation(id: string) {
    return this.delete(`/reservations/${id}`);
  }
}

export class RoomsClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.ROOMS_SERVICE_URL || 'http://rooms-service:3002',
      apiKey: process.env.ROOMS_API_KEY || 'rooms-secret-key'
    });
  }

  // Métodos específicos do serviço de quartos
  async getRooms() {
    return this.get('/rooms');
  }

  async getRoom(id: string) {
    return this.get(`/rooms/${id}`);
  }

  async createRoom(data: any) {
    return this.post('/rooms', data);
  }

  async updateRoom(id: string, data: any) {
    return this.put(`/rooms/${id}`, data);
  }
}

export class PaymentsClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:3004',
      apiKey: process.env.PAYMENTS_API_KEY || 'payments-secret-key'
    });
  }

  // Métodos específicos do serviço de pagamentos
  async createPayment(data: any) {
    return this.post('/payments', data);
  }

  async getPayment(id: string) {
    return this.get(`/payments/${id}`);
  }

  async processPayment(data: any) {
    return this.post('/payments/process', data);
  }
}

export class NotificationsClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
      apiKey: process.env.NOTIFICATIONS_API_KEY || 'notifications-secret-key'
    });
  }

  // Métodos específicos do serviço de notificações
  async sendEmail(data: any) {
    return this.post('/notifications/email', data);
  }

  async sendSMS(data: any) {
    return this.post('/notifications/sms', data);
  }

  async sendPushNotification(data: any) {
    return this.post('/notifications/push', data);
  }
}

// Instâncias singleton dos clientes
export const reservationsClient = new ReservationsClient();
export const roomsClient = new RoomsClient();
export const paymentsClient = new PaymentsClient();
export const notificationsClient = new NotificationsClient(); 