const express = require('express');
const Repo = require('../models/Repo');
const Deployment = require('../models/Deployment');
const { triggerWorkflow, getLatestRun } = require('../services/githubService');

const router = express.Router();

// GET /api/deployments/:repoId - deployment history for a repo
router.get('/:repoId', async (req, res) => {
  try {
    const deployments = await Deployment.find({ repo: req.params.repoId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deployments/:repoId/trigger - trigger GitHub Actions workflow_dispatch
router.post('/:repoId/trigger', async (req, res) => {
  try {
    const repo = await Repo.findById(req.params.repoId);
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const deployment = await Deployment.create({
      repo: repo._id,
      status: 'queued',
      message: `Dispatched workflow "${repo.workflowFile}" on branch "${repo.branch}"`
    });

    try {
      await triggerWorkflow({
        owner: repo.owner,
        repo: repo.repo,
        workflowFile: repo.workflowFile,
        branch: repo.branch
      });
    } catch (ghErr) {
      deployment.status = 'failure';
      deployment.message = `Failed to trigger workflow: ${ghErr.response?.data?.message || ghErr.message}`;
      await deployment.save();
      return res.status(502).json(deployment);
    }

    res.status(202).json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deployments/:repoId/status - poll GitHub for the latest run and sync it locally
router.get('/:repoId/status/latest', async (req, res) => {
  try {
    const repo = await Repo.findById(req.params.repoId);
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const run = await getLatestRun({
      owner: repo.owner,
      repo: repo.repo,
      workflowFile: repo.workflowFile
    });

    if (!run) return res.json(null);

    const status =
      run.status === 'completed' ? (run.conclusion === 'success' ? 'success' : 'failure') : run.status;

    // Sync the most recent local deployment record for this repo with GitHub's real status
    const lastDeployment = await Deployment.findOne({ repo: repo._id }).sort({ createdAt: -1 });
    if (lastDeployment && !lastDeployment.githubRunId) {
      lastDeployment.githubRunId = String(run.id);
      lastDeployment.githubRunUrl = run.htmlUrl;
      lastDeployment.status = status;
      await lastDeployment.save();
    }

    res.json({ ...run, resolvedStatus: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
