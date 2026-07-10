const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
    triggeredBy: { type: String, default: 'dashboard' },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'success', 'failure', 'unknown'],
      default: 'queued'
    },
    githubRunId: { type: String, default: null },
    githubRunUrl: { type: String, default: null },
    message: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deployment', DeploymentSchema);
