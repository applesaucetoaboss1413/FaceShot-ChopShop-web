/**
 * API Service Layer for FaceShot-ChopShop
 *
 * Uses relative URLs in production so the frontend can communicate
 * with the Render backend at the same origin.
 *
 * BUG #5 FIX: Includes currency detection and sends with all API requests
 */

import { getUserCurrency } from './currency';

export function resolveCurrency(): string {
  const raw = typeof getUserCurrency === "function" ? getUserCurrency() : undefined;
  const normalized =
    typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return normalized || "USD"; // default presentment currency
}

const isDevelopment = import.meta.env.DEV;

// In development, proxy through Vite or use localhost
// In production, use relative URLs (same origin as Render deployment)
const API_BASE_URL = isDevelopment
  ? 'http://localhost:3000'
  : '';

let tokenUpdatePromise: Promise<void> | null = null;

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

interface SKU {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  vectorId: string;
  vectorName: string;
  vectorCode: string;
  baseCredits: number;
  basePriceUsd: string;
  basePriceCents: number;
  defaultFlags: string[];
  description: string;
}

interface PricingQuote {
  skuCode: string;
  skuName: string;
  quantity: number;
  appliedFlags: string[];
  customerPriceCents: number;
  customerPriceUsd: string;
  internalCostCents: number;
  internalCostUsd: string;
  marginPercent: string;
  totalSeconds: number;
  secondsFromPlan: number;
  overageSeconds: number;
  overageCostCents: number;
  overageCostUsd: string;
  remainingPlanSeconds: number;
}

interface Flag {
  id: string;
  code: string;
  label: string;
  priceMultiplier: number;
  priceAddFlatUsd: string;
  priceAddFlatCents: number;
  description: string;
}

interface AccountPlan {
  hasPlan: boolean;
  plan?: {
    id: string;
    code: string;
    name: string;
    monthlyPriceUsd: string;
    includedSeconds: number;
    overageRatePerSecondUsd: string;
    description: string;
  };
  subscription?: {
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    status: string;
  };
  usage?: {
    periodStart: string;
    periodEnd: string;
    secondsUsed: number;
    remainingSeconds: number;
    usagePercent: number;
  };
}

interface Order {
  id: number;
  skuCode: string;
  skuName: string;
  skuDescription: string;
  quantity: number;
  appliedFlags: string[];
  customerPriceCents: number;
  customerPriceUsd: string;
  internalCostCents: number;
  marginPercent: number;
  totalSeconds: number;
  overageSeconds: number;
  status: string;
  createdAt: string;
}

interface CreateOrderPayload {
  sku_code: string;
  quantity: number;
  flags: string[];
}

// Enhanced API Types
interface SKUConfig {
  id: number;
  sku_code: string;
  config_version: number;
  active: number;
  created_at: string;
  updated_at: string;
  steps: SKUToolStep[];
  customer_options: CustomerOption[];
}

interface SKUToolStep {
  id: number;
  config_id: number;
  step_order: number;
  step_name: string;
  a2e_endpoint: string | null;
  http_method: string;
  required: number;
  condition_expression: any;
  params_template: Record<string, any>;
  timeout_seconds: number;
  retry_enabled: number;
  retry_max_attempts: number;
  retry_backoff_ms: number;
  created_at: string;
}

interface CustomerOption {
  id: number;
  config_id: number;
  option_key: string;
  option_label: string;
  option_type: 'text' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'file' | 'textarea';
  option_values: { value: string; label: string }[] | null;
  default_value: string | null;
  required: number;
  validation_rules: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowedTypes?: string[];
    maxSize?: number;
  } | null;
  help_text: string | null;
  display_order: number;
  created_at: string;
}

interface AdvancedJob {
  job_id: number;
  order_id: number;
  sku_code: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  customer_inputs: Record<string, any>;
  total_steps: number;
  completed_steps: number;
  result_data: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface JobStep {
  id: number;
  job_id: number;
  step_order: number;
  step_name: string;
  a2e_endpoint: string | null;
  a2e_task_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  input_params: Record<string, any>;
  output_data: any;
  error_message: string | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface A2EAvatar {
  avatar_id: string;
  name: string;
  preview_image_url: string;
  gender: string;
  age_range: string;
}

interface A2EVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_url: string | null;
  is_custom: boolean;
}

interface BackendPricingPlan {
  id: string | number;
  code: string;
  name: string;
  monthly_price_usd?: string | number;
  monthly_price_cents?: number;
  included_seconds?: number;
  description?: string;
}

interface BackendSKU {
  id: string | number;
  code: string;
  name: string;
  vector_id?: string;
  vector_name?: string;
  vector_code?: string;
  base_credits: number;
  base_price_usd: string;
  base_price_cents: number;
  default_flags: string[];
  description: string;
}

interface BackendFlag {
  id: string | number;
  code: string;
  label: string;
  priceMultiplier: number;
  price_add_flat_usd: string;
  price_add_flat_cents: number;
  description: string;
}

interface BackendPricingQuote {
  sku_code: string;
  sku_name: string;
  quantity: number;
  applied_flags: string[];
  customer_price_cents: number;
  customer_price_usd: string;
  internal_cost_cents: number;
  internal_cost_usd: string;
  margin_percent: string;
  total_seconds: number;
  seconds_from_plan?: number;
  overage_seconds?: number;
  overage_cost_cents?: number;
  overage_cost_usd?: string;
  remaining_plan_seconds?: number;
}

interface BackendAccountPlan {
  has_plan: boolean;
  plan?: {
    id: string | number;
    code: string;
    name: string;
    monthly_price_usd: string;
    included_seconds: number;
    overage_rate_per_second_usd: string;
    description?: string;
  };
  subscription?: {
    start_date: string;
    end_date: string;
    auto_renew: boolean;
    status: string;
  };
  usage?: {
    period_start: string;
    period_end: string;
    seconds_used: number;
    remaining_seconds: number;
    usage_percent: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  async setToken(token: string | null): Promise<void> {
    const update = async () => {
      this.token = token;
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    };

    if (tokenUpdatePromise) {
      tokenUpdatePromise = tokenUpdatePromise.then(() => update());
    } else {
      tokenUpdatePromise = update();
    }

    await tokenUpdatePromise;
    tokenUpdatePromise = null;
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

    const currency = resolveCurrency();

    const headers: HeadersInit = {
      'x-currency': currency,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Guard JSON parsing of body so it never touches FormData and only runs when appropriate
    let body = options.body;
    if (
      body &&
      typeof body === "string" &&
      (method === "POST" || method === "PUT" || method === "PATCH")
    ) {
      try {
        const bodyObj = JSON.parse(body);
        // keep existing mutation logic here
        body = JSON.stringify(bodyObj);
      } catch {
        // leave body as-is if parsing fails
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body,
      });
      console.log('[ApiClient] Response received', { endpoint, method, status: response.status, currency });
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
      await this.setToken(result.data.token);
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
      await this.setToken(result.data.token);
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

    const result = await this.request<{ plans: BackendPricingPlan[] }>('/api/plans');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to load pricing plans',
      };
    }

    const plans = Array.isArray(result.data.plans) ? result.data.plans : [];

    const normalized: PricingPlan[] = plans.map((plan: BackendPricingPlan) => ({
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

  // SKUs
  async getSKUs(vectorId?: string): Promise<ApiResponse<SKU[]>> {
    const params = vectorId ? `?vector_id=${vectorId}` : '';
    const result = await this.request<{ skus: any[] }>(`/api/skus${params}`);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to load SKUs',
      };
    }

    const skus: SKU[] = (result.data.skus || [])
      .filter((sku: any) => sku && sku.id && sku.code && sku.name)
      .map((sku: any) => ({
        id: sku.id,
        code: sku.code,
        name: sku.name,
        price: sku.price ?? 0,
        currency: (sku.currency || resolveCurrency()).toUpperCase(),
        vectorId: String(sku.vector_id || ''),
        vectorName: String(sku.vector_name || ''),
        vectorCode: String(sku.vector_code || ''),
        baseCredits: Number(sku.base_credits) || 0,
        basePriceUsd: String(sku.base_price_usd || '0.00'),
        basePriceCents: Number(sku.base_price_cents) || 0,
        defaultFlags: Array.isArray(sku.default_flags) ? sku.default_flags : [],
        description: String(sku.description || ''),
      }));

    return {
      success: true,
      data: skus,
    };
  }

  // Flags
  async getFlags(): Promise<ApiResponse<Flag[]>> {
    const result = await this.request<{ flags: any[] }>('/api/flags');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to load flags',
      };
    }

    const flags: Flag[] = (result.data.flags || []).map((flag: BackendFlag) => ({
      id: String(flag.id),
      code: String(flag.code),
      label: String(flag.label),
      priceMultiplier: Number(flag.price_multiplier) || 1.0,
      priceAddFlatUsd: String(flag.price_add_flat_usd || '0.00'),
      priceAddFlatCents: Number(flag.price_add_flat_cents) || 0,
      description: String(flag.description || ''),
    }));

    return {
      success: true,
      data: flags,
    };
  }

  // Pricing Quote
  async getPricingQuote(
    skuCode: string,
    quantity: number = 1,
    flags: string[] = []
  ): Promise<ApiResponse<PricingQuote>> {
    const result = await this.request<{ quote: BackendPricingQuote }>('/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify({ sku_code: skuCode, quantity, flags, currency: resolveCurrency() }),
    });

    if (!result.success || !result.data?.quote) {
      return {
        success: false,
        error: result.error || 'Failed to get pricing quote',
      };
    }

    const q: BackendPricingQuote = result.data.quote;
    const quote: PricingQuote = {
      skuCode: String(q.sku_code),
      skuName: String(q.sku_name),
      quantity: Number(q.quantity),
      appliedFlags: Array.isArray(q.applied_flags) ? q.applied_flags : [],
      customerPriceCents: Number(q.customer_price_cents),
      customerPriceUsd: String(q.customer_price_usd),
      internalCostCents: Number(q.internal_cost_cents),
      internalCostUsd: String(q.internal_cost_usd),
      marginPercent: String(q.margin_percent),
      totalSeconds: Number(q.total_seconds),
      secondsFromPlan: Number(q.seconds_from_plan || 0),
      overageSeconds: Number(q.overage_seconds || 0),
      overageCostCents: Number(q.overage_cost_cents || 0),
      overageCostUsd: String(q.overage_cost_usd || '0.00'),
      remainingPlanSeconds: Number(q.remaining_plan_seconds || 0),
    };

    return {
      success: true,
      data: quote,
    };
  }

  // Account Plan Info
  async getAccountPlan(): Promise<ApiResponse<AccountPlan>> {
    const result = await this.request<BackendAccountPlan>('/api/account/plan');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to load account plan',
      };
    }

    const data: BackendAccountPlan = result.data;

    if (!data.has_plan) {
      return {
        success: true,
        data: { hasPlan: false },
      };
    }

    const accountPlan: AccountPlan = {
      hasPlan: true,
      plan: data.plan ? {
        id: String(data.plan.id),
        code: String(data.plan.code),
        name: String(data.plan.name),
        monthlyPriceUsd: String(data.plan.monthly_price_usd),
        includedSeconds: Number(data.plan.included_seconds),
        overageRatePerSecondUsd: String(data.plan.overage_rate_per_second_usd),
        description: String(data.plan.description || ''),
      } : undefined,
      subscription: data.subscription ? {
        startDate: String(data.subscription.start_date),
        endDate: String(data.subscription.end_date),
        autoRenew: Boolean(data.subscription.auto_renew),
        status: String(data.subscription.status),
      } : undefined,
      usage: data.usage ? {
        periodStart: String(data.usage.period_start),
        periodEnd: String(data.usage.period_end),
        secondsUsed: Number(data.usage.seconds_used),
        remainingSeconds: Number(data.usage.remaining_seconds),
        usagePercent: Number(data.usage.usage_percent),
      } : undefined,
    };

    return {
      success: true,
      data: accountPlan,
    };
  }

  // Orders
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<{ order_id: number; quote: PricingQuote; status: string; message: string }>> {
    return this.request<{ order_id: number; quote: PricingQuote; status: string; message: string }>('/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({ ...payload, currency: resolveCurrency() }),
    });
  }

  async getOrders(limit: number = 20, offset: number = 0): Promise<ApiResponse<{ orders: Order[] }>> {
    return this.request<{ orders: Order[] }>(`/api/orders?limit=${limit}&offset=${offset}`);
  }

  async getOrder(orderId: number): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/api/orders/${orderId}`);
  }

  // Stats (public)
  async getStats(): Promise<ApiResponse<{ videos: number; paying_users: number; total_users: number }>> {
    return this.request<{ videos: number; paying_users: number; total_users: number }>('/stats');
  }

  // Enhanced API - SKU Tool Configurations
  async getSKUConfig(skuCode: string): Promise<ApiResponse<SKUConfig>> {
    return this.request<SKUConfig>(`/api/skus/${skuCode}/config`);
  }

  async validateCustomerInputs(skuCode: string, inputs: Record<string, any>): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> {
    return this.request<{ valid: boolean; errors: string[] }>(`/api/skus/${skuCode}/validate`, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  }

  // Enhanced API - Advanced Job Processing
  async createAdvancedJob(skuCode: string, customerInputs: Record<string, any>): Promise<ApiResponse<AdvancedJob>> {
    return this.request<AdvancedJob>('/api/jobs/create-advanced', {
      method: 'POST',
      body: JSON.stringify({ sku_code: skuCode, customer_inputs: customerInputs }),
    });
  }

  async getAdvancedJobStatus(jobId: number): Promise<ApiResponse<AdvancedJob>> {
    return this.request<AdvancedJob>(`/api/jobs/${jobId}/status`);
  }

  async getJobSteps(jobId: number): Promise<ApiResponse<{ steps: JobStep[] }>> {
    return this.request<{ steps: JobStep[] }>(`/api/jobs/${jobId}/steps`);
  }

  // Enhanced API - Media Upload
  async uploadMedia(file: File, type: string = 'general'): Promise<ApiResponse<{ url: string; cloudinary_id: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request<{ url: string; cloudinary_id: string }>('/api/upload/media', {
      method: 'POST',
      body: formData,
      headers: {
        'x-currency': resolveCurrency(),
      },
    });
  }

  // Enhanced API - A2E Resources
  async getAvatars(): Promise<ApiResponse<{ avatars: A2EAvatar[] }>> {
    return this.request<{ avatars: A2EAvatar[] }>('/api/a2e/avatars');
  }

  async getVoices(): Promise<ApiResponse<{ voices: A2EVoice[] }>> {
    return this.request<{ voices: A2EVoice[] }>('/api/a2e/voices');
  }

  async getUserVoices(): Promise<ApiResponse<{ voices: A2EVoice[] }>> {
    return this.request<{ voices: A2EVoice[] }>('/api/a2e/user-voices');
  }

  async getA2ECredits(): Promise<ApiResponse<{ balance: number }>> {
    return this.request<{ balance: number }>('/api/a2e/credits');
  }

  // Enhanced API - Health & Monitoring
  async getA2EHealth(): Promise<ApiResponse<{ status: string; response_time_ms: number }>> {
    return this.request<{ status: string; response_time_ms: number }>('/api/health/a2e');
  }
}

export const api = new ApiClient(API_BASE_URL);
export type {
  User,
  Job,
  ProcessJobPayload,
  LoginPayload,
  SignupPayload,
  PricingPlan,
  SKU,
  PricingQuote,
  Flag,
  AccountPlan,
  Order,
  CreateOrderPayload,
  ApiResponse,
  // Enhanced API Types
  SKUConfig,
  SKUToolStep,
  CustomerOption,
  AdvancedJob,
  JobStep,
  A2EAvatar,
  A2EVoice
};
