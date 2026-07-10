const mongoose = require('mongoose');

const RepoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    githubUrl: { type: String, required: true, trim: true },
    // owner/repo, parsed from githubUrl, used for GitHub Actions API calls
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    // workflow file to dispatch, e.g. deploy.yml
    workflowFile: { type: String, default: 'deploy.yml' },
    branch: { type: String, default: 'main' },
    // publicly reachable URL of the deployed app, used for health pings
    healthCheckUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Repo', RepoSchema);
