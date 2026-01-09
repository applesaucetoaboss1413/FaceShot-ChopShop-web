const mongoose = require('mongoose');
const { User, UserCredits, Job, Purchase, Stats } = require('./models');

/**
 * Database helper functions
 * Provides MongoDB operations that match SQLite API for easy migration
 */

class DatabaseHelper {
  constructor() {
    this.connected = false;
  }

  // Connect to MongoDB
  async connect(uri) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      this.connected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Initialize stats if not exists
      const stats = await Stats.findOne();
      if (!stats) {
        await Stats.create({ total_users: 0, total_jobs: 0, videos: 0 });
      }
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  // User operations
  async createUser(email, passwordHash) {
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash
    });
    
    // Initialize credits
    await UserCredits.create({
      user_id: user._id,
      balance: 0
    });
    
    // Update stats
    await Stats.updateOne({}, { $inc: { total_users: 1 } });
    
    return {
      id: user._id.toString(),
      email: user.email,
      created_at: user.created_at
    };
  }

  async getUserByEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      created_at: user.created_at
    };
  }

  // Credits operations
  async getCredits(userId) {
    let credits = await UserCredits.findOne({ user_id: userId });
    
    if (!credits) {
      credits = await UserCredits.create({
        user_id: userId,
        balance: 0
      });
    }
    
    return {
      user_id: userId,
      balance: credits.balance
    };
  }

  async addCredits(userId, amount) {
    let credits = await UserCredits.findOne({ user_id: userId });
    
    if (!credits) {
      credits = await UserCredits.create({
        user_id: userId,
        balance: amount
      });
    } else {
      credits.balance += amount;
      credits.updated_at = new Date();
      await credits.save();
    }
    
    return credits.balance;
  }

  async deductCredits(userId, amount) {
    const credits = await UserCredits.findOne({ user_id: userId });
    
    if (!credits || credits.balance < amount) {
      throw new Error('insufficient_credits');
    }
    
    credits.balance -= amount;
    credits.updated_at = new Date();
    await credits.save();
    
    return credits.balance;
  }

  // Job operations
  async createJob(userId, type, sourceUrl, options = {}) {
    const job = await Job.create({
      user_id: userId,
      type,
      source_url: sourceUrl,
      status: 'pending',
      options
    });
    
    // Update stats
    await Stats.updateOne({}, { $inc: { total_jobs: 1 } });
    
    return {
      id: job._id.toString(),
      user_id: userId,
      type: job.type,
      status: job.status,
      source_url: job.source_url,
      created_at: job.created_at
    };
  }

  async updateJob(jobId, updates) {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    
    Object.assign(job, updates);
    job.updated_at = new Date();
    
    if (updates.status === 'completed') {
      job.completed_at = new Date();
      
      // Update video stats if it's a video creation job
      if (['img2vid', 'avatar_video', 'talking_photo', 'talking_video'].includes(job.type)) {
        await Stats.updateOne({}, { $inc: { videos: 1 } });
      }
    }
    
    await job.save();
    
    return {
      id: job._id.toString(),
      status: job.status,
      result_url: job.result_url,
      error: job.error
    };
  }

  async getJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) return null;
    
    return {
      id: job._id.toString(),
      user_id: job.user_id.toString(),
      type: job.type,
      status: job.status,
      source_url: job.source_url,
      target_url: job.target_url,
      result_url: job.result_url,
      a2e_task_id: job.a2e_task_id,
      options: job.options,
      credits_used: job.credits_used,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
      completed_at: job.completed_at
    };
  }

  async getUserJobs(userId, limit = 50) {
    const jobs = await Job.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit);
    
    return jobs.map(job => ({
      id: job._id.toString(),
      type: job.type,
      status: job.status,
      result_url: job.result_url,
      created_at: job.created_at,
      url: job.result_url // Alias for compatibility
    }));
  }

  async getPendingJobs() {
    const jobs = await Job.find({ 
      status: { $in: ['pending', 'processing'] },
      a2e_task_id: { $exists: true, $ne: null }
    }).limit(100);
    
    return jobs.map(job => ({
      id: job._id.toString(),
      type: job.type,
      a2e_task_id: job.a2e_task_id,
      status: job.status
    }));
  }

  // Purchase operations
  async createPurchase(userId, stripePaymentId, amountCents, creditsPurchased) {
    const purchase = await Purchase.create({
      user_id: userId,
      stripe_payment_id: stripePaymentId,
      amount_cents: amountCents,
      credits_purchased: creditsPurchased,
      status: 'completed'
    });
    
    return {
      id: purchase._id.toString(),
      user_id: userId,
      amount_cents: amountCents,
      credits_purchased: creditsPurchased
    };
  }

  // Stats operations
  async getStats() {
    const stats = await Stats.findOne();
    if (!stats) {
      return { total_users: 0, total_jobs: 0, videos: 0 };
    }
    
    return {
      total_users: stats.total_users,
      total_jobs: stats.total_jobs,
      videos: stats.videos
    };
  }

  // Transaction helper (MongoDB doesn't need explicit transactions for single operations)
  transaction(fn) {
    return fn;
  }

  // Prepare statement helper (for compatibility with SQLite API)
  prepare(query) {
    // This is a compatibility layer - MongoDB operations are async
    return {
      get: async (...args) => {
        throw new Error('Use async methods instead of prepare().get()');
      },
      all: async (...args) => {
        throw new Error('Use async methods instead of prepare().all()');
      },
      run: async (...args) => {
        throw new Error('Use async methods instead of prepare().run()');
      }
    };
  }
}

module.exports = new DatabaseHelper();
