const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// User Credits Schema
const userCreditsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

// Jobs Schema
const jobSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // faceswap, img2vid, etc.
  status: { type: String, default: 'pending' }, // pending, processing, completed, failed
  source_url: { type: String },
  target_url: { type: String },
  result_url: { type: String },
  a2e_task_id: { type: String },
  options: { type: mongoose.Schema.Types.Mixed, default: {} },
  credits_used: { type: Number, default: 0 },
  error: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  completed_at: { type: Date }
});

// Purchases Schema
const purchaseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripe_payment_id: { type: String, required: true },
  amount_cents: { type: Number, required: true },
  credits_purchased: { type: Number, required: true },
  status: { type: String, default: 'completed' },
  created_at: { type: Date, default: Date.now }
});

// Processed Events Schema (for webhook idempotency)
const processedEventSchema = new mongoose.Schema({
  event_id: { type: String, required: true, unique: true },
  event_type: { type: String, required: true },
  processed_at: { type: Date, default: Date.now },
  status: { type: String, default: 'processed' } // processed, failed
});

// Vectors Schema
const vectorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Plans Schema
const planSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  monthly_price_cents: { type: Number, required: true },
  included_seconds: { type: Number, required: true },
  overage_rate_per_second_cents: { type: Number, required: true },
  description: { type: String },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// SKUs Schema
const skuSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  vector_id: { type: String, ref: 'Vector' },
  base_credits: { type: Number, required: true },
  base_price_cents: { type: Number, required: true },
  default_flags: { type: [String], default: [] },
  description: { type: String },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// Flags Schema
const flagSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  price_multiplier: { type: Number, default: 1.0 },
  price_add_flat_cents: { type: Number, default: 0 },
  description: { type: String },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// User Plans Schema
const userPlanSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  auto_renew: { type: Boolean, default: true },
  stripe_subscription_id: { type: String },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now }
});

// Plan Usage Schema
const planUsageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: String, required: true },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  seconds_used: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Orders Schema
const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sku_code: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  applied_flags: { type: [String], default: [] },
  customer_price_cents: { type: Number, required: true },
  internal_cost_cents: { type: Number, required: true },
  margin_percent: { type: Number, required: true },
  total_seconds: { type: Number, required: true },
  overage_seconds: { type: Number, default: 0 },
  stripe_payment_intent_id: { type: String },
  currency: { type: String, default: 'usd' },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

// Analytics Events Schema
const analyticsEventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

// Miniapp Creations Schema
const miniappCreationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  url: { type: String },
  created_at: { type: Date, default: Date.now }
});

// SKU Tool Configs Schema
const skuToolConfigSchema = new mongoose.Schema({
  sku_code: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// SKU Tool Steps Schema
const skuToolStepSchema = new mongoose.Schema({
  config_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuToolConfig', required: true },
  step_order: { type: Number, required: true },
  step_name: { type: String },
  a2e_endpoint: { type: String },
  http_method: { type: String, default: 'POST' },
  required: { type: Boolean, default: false },
  condition_expression: { type: mongoose.Schema.Types.Mixed },
  params_template: { type: mongoose.Schema.Types.Mixed, default: {} },
  timeout_seconds: { type: Number, default: 300 },
  retry_enabled: { type: Boolean, default: true },
  retry_max_attempts: { type: Number, default: 3 },
  retry_backoff_ms: { type: Number, default: 1000 },
  created_at: { type: Date, default: Date.now }
});

// SKU Customer Options Schema
const skuCustomerOptionSchema = new mongoose.Schema({
  config_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuToolConfig', required: true },
  option_key: { type: String, required: true },
  option_label: { type: String, required: true },
  option_type: { type: String, required: true },
  option_values: { type: mongoose.Schema.Types.Mixed },
  default_value: { type: mongoose.Schema.Types.Mixed },
  required: { type: Boolean, default: false },
  validation_rules: { type: mongoose.Schema.Types.Mixed },
  help_text: { type: String },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// Job Steps Schema
const jobStepSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  step_order: { type: Number, required: true },
  tool_type: { type: String, required: true },
  status: { type: String, default: 'pending' },
  task_id: { type: String },
  input_data: { type: mongoose.Schema.Types.Mixed },
  output_data: { type: mongoose.Schema.Types.Mixed },
  error_message: { type: String },
  started_at: { type: Date },
  completed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// A2E API Calls Schema
const a2eApiCallSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  request_data: { type: mongoose.Schema.Types.Mixed },
  response_data: { type: mongoose.Schema.Types.Mixed },
  response_time_ms: { type: Number },
  success: { type: Boolean, required: true },
  error_message: { type: String },
  credits_used: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// Error Logs Schema
const errorLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  stack_trace: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

// A2E Health Checks Schema
const a2eHealthCheckSchema = new mongoose.Schema({
  endpoint_type: { type: String, required: true },
  response_time_ms: { type: Number },
  success: { type: Boolean, required: true },
  credits_remaining: { type: Number },
  error_message: { type: String },
  created_at: { type: Date, default: Date.now }
});

// System Health Metrics Schema
const systemHealthMetricSchema = new mongoose.Schema({
  metric_name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Schema Migrations Schema
const schemaMigrationSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  applied_at: { type: Date, default: Date.now }
});

// Stats Schema
const statsSchema = new mongoose.Schema({
  total_users: { type: Number, default: 0 },
  total_jobs: { type: Number, default: 0 },
  videos: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

// Indexes for performance
jobSchema.index({ user_id: 1, created_at: -1 });
jobSchema.index({ status: 1 });
jobSchema.index({ a2e_task_id: 1 });
purchaseSchema.index({ user_id: 1, created_at: -1 });
userPlanSchema.index({ user_id: 1 });
planUsageSchema.index({ user_id: 1, period_start: 1, period_end: 1 });
orderSchema.index({ user_id: 1 });
skuToolStepSchema.index({ config_id: 1, step_order: 1 });
skuCustomerOptionSchema.index({ config_id: 1 });
jobStepSchema.index({ job_id: 1, step_order: 1 });
analyticsEventSchema.index({ type: 1, created_at: -1 });
analyticsEventSchema.index({ user_id: 1, created_at: -1 });

// Models
const User = mongoose.model('User', userSchema);
const UserCredits = mongoose.model('UserCredits', userCreditsSchema);
const Job = mongoose.model('Job', jobSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);
const Vector = mongoose.model('Vector', vectorSchema);
const Plan = mongoose.model('Plan', planSchema);
const Sku = mongoose.model('Sku', skuSchema);
const Flag = mongoose.model('Flag', flagSchema);
const UserPlan = mongoose.model('UserPlan', userPlanSchema);
const PlanUsage = mongoose.model('PlanUsage', planUsageSchema);
const Order = mongoose.model('Order', orderSchema);
const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
const MiniappCreation = mongoose.model('MiniappCreation', miniappCreationSchema);
const SkuToolConfig = mongoose.model('SkuToolConfig', skuToolConfigSchema);
const SkuToolStep = mongoose.model('SkuToolStep', skuToolStepSchema);
const SkuCustomerOption = mongoose.model('SkuCustomerOption', skuCustomerOptionSchema);
const JobStep = mongoose.model('JobStep', jobStepSchema);
const A2eApiCall = mongoose.model('A2eApiCall', a2eApiCallSchema);
const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);
const A2eHealthCheck = mongoose.model('A2eHealthCheck', a2eHealthCheckSchema);
const SystemHealthMetric = mongoose.model('SystemHealthMetric', systemHealthMetricSchema);
const SchemaMigration = mongoose.model('SchemaMigration', schemaMigrationSchema);
const Stats = mongoose.model('Stats', statsSchema);

module.exports = {
  User,
  UserCredits,
  Job,
  Purchase,
  ProcessedEvent,
  Vector,
  Plan,
  Sku,
  Flag,
  UserPlan,
  PlanUsage,
  Order,
  AnalyticsEvent,
  MiniappCreation,
  SkuToolConfig,
  SkuToolStep,
  SkuCustomerOption,
  JobStep,
  A2eApiCall,
  ErrorLog,
  A2eHealthCheck,
  SystemHealthMetric,
  SchemaMigration,
  Stats
};
