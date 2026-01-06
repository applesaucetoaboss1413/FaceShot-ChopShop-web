/**
 * API Service Layer for FaceShot-ChopShop
 * 
 * Uses relative URLs in production so the frontend can communicate 
 * with the Render backend at the same origin.
 */

const isDevelopment = import.meta.env.DEV;

// In development, proxy through Vite or use localhost
// In production, use relative URLs (same origin as Render deployment)
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000' 
  : '';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: string;
}

interface Job {
  id: string;
  userId: string;
  type: 'face-swap' | 'avatar' | 'image-to-video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl: string;
  outputUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface ProcessJobPayload {
  type: 'face-swap' | 'avatar' | 'image-to-video';
  sourceImage: string; // base64 or URL
  targetImage?: string; // for face-swap
  options?: Record<string, unknown>;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload extends LoginPayload {
  name?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  stripePriceId: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(payload: LoginPayload): Promise<ApiResponse<{ token: string; user: User }>> {
    const result = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async signup(payload: SignupPayload): Promise<ApiResponse<{ token: string; user: User }>> {
    const result = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me');
  }

  // Job/Processing endpoints
  async processJob(payload: ProcessJobPayload): Promise<ApiResponse<Job>> {
    return this.request<Job>('/api/web/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getJobStatus(jobId: string): Promise<ApiResponse<Job>> {
    return this.request<Job>(`/api/web/jobs/${jobId}`);
  }

  async getJobHistory(): Promise<ApiResponse<Job[]>> {
    return this.request<Job[]>('/api/web/jobs');
  }

  // Credits & Payments
  async getCredits(): Promise<ApiResponse<{ credits: number }>> {
    return this.request<{ credits: number }>('/api/user/credits');
  }

  async getPricingPlans(): Promise<ApiResponse<PricingPlan[]>> {
    return this.request<PricingPlan[]>('/api/pricing');
  }

  async createCheckoutSession(planId: string): Promise<ApiResponse<{ url: string }>> {
    return this.request<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  // Stats (public)
  async getStats(): Promise<ApiResponse<{ totalCreations: number; totalUsers: number }>> {
    return this.request<{ totalCreations: number; totalUsers: number }>('/api/stats');
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { User, Job, ProcessJobPayload, LoginPayload, SignupPayload, PricingPlan, ApiResponse };
