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
  code: string;
  name: string;
  monthlyPriceUsd: number;
  includedSeconds: number;
  description: string;
}

type BackendPlan = {
  id: unknown;
  code: unknown;
  name: unknown;
  monthly_price_usd?: unknown;
  monthly_price_cents?: unknown;
  included_seconds?: unknown;
  description?: unknown;
};

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
    const method = options.method || 'GET';
    console.log('[ApiClient] Request start', { endpoint, method });

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
      console.log('[ApiClient] Response received', { endpoint, method, status: response.status });
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
      console.error('[ApiClient] Request error', { endpoint, method, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(payload: LoginPayload): Promise<ApiResponse<{ token: string; user: User }>> {
    console.log('[AuthApi] Login start', { email: payload.email });
    const result = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
      console.log('[AuthApi] Login success, token stored');
    } else {
      console.warn('[AuthApi] Login failed', { error: result.error });
    }

    return result;
  }

  async signup(payload: SignupPayload): Promise<ApiResponse<{ token: string; user: User }>> {
    console.log('[AuthApi] Signup start', { email: payload.email });
    const result = await this.request<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
      console.log('[AuthApi] Signup success, token stored');
    } else {
      console.warn('[AuthApi] Signup failed', { error: result.error });
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
    return this.request<Job>(`/api/web/status?id=${jobId}`);
  }

  async getJobHistory(): Promise<ApiResponse<Job[]>> {
    return this.request<Job[]>('/api/web/creations');
  }

  // Credits & Payments
  async getCredits(): Promise<ApiResponse<{ balance: number }>> {
    return this.request<{ balance: number }>('/api/web/credits');
  }

  async getPricingPlans(): Promise<ApiResponse<PricingPlan[]>> {
    const result = await this.request<{ plans: BackendPlan[] }>('/api/plans');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to load pricing plans',
      };
    }

    const plans = Array.isArray(result.data.plans) ? result.data.plans : [];

    const normalized: PricingPlan[] = plans.map((plan) => ({
      id: String(plan.id),
      code: String(plan.code),
      name: String(plan.name),
      monthlyPriceUsd: plan.monthly_price_usd
        ? parseFloat(String(plan.monthly_price_usd))
        : plan.monthly_price_cents
        ? Number(plan.monthly_price_cents) / 100
        : 0,
      includedSeconds: Number(plan.included_seconds) || 0,
      description: String(plan.description || ''),
    }));

    return {
      success: true,
      data: normalized,
    };
  }

  async createCheckoutSession(planId: string): Promise<ApiResponse<{ url: string }>> {
    const result = await this.request<{ session_url: string; session_id: string }>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Unable to start subscription checkout',
      };
    }

    return {
      success: true,
      data: { url: result.data.session_url },
    };
  }

  // Stats (public)
  async getStats(): Promise<ApiResponse<{ videos: number; paying_users: number; total_users: number }>> {
    return this.request<{ videos: number; paying_users: number; total_users: number }>('/stats');
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { User, Job, ProcessJobPayload, LoginPayload, SignupPayload, PricingPlan, ApiResponse };
