const mongoose = require('mongoose');

const HealthCheckSchema = new mongoose.Schema({
  repo: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
  status: { type: String, enum: ['up', 'down'], required: true },
  statusCode: { type: Number, default: null },
  latencyMs: { type: Number, default: null },
  error: { type: String, default: null },
  checkedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient time-series queries per repo
HealthCheckSchema.index({ repo: 1, checkedAt: -1 });

module.exports = mongoose.model('HealthCheck', HealthCheckSchema);
