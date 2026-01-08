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

// Stats Schema
const statsSchema = new mongoose.Schema({
  total_users: { type: Number, default: 0 },
  total_jobs: { type: Number, default: 0 },
  videos: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

// Indexes for performance (only for fields not already declared as unique in schema)
jobSchema.index({ user_id: 1, created_at: -1 });
jobSchema.index({ status: 1 });
jobSchema.index({ a2e_task_id: 1 });
purchaseSchema.index({ user_id: 1, created_at: -1 });

// Models
const User = mongoose.model('User', userSchema);
const UserCredits = mongoose.model('UserCredits', userCreditsSchema);
const Job = mongoose.model('Job', jobSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Stats = mongoose.model('Stats', statsSchema);

module.exports = {
  User,
  UserCredits,
  Job,
  Purchase,
  Stats
};
