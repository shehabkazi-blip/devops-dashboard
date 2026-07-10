const express = require('express');
const Repo = require('../models/Repo');
const HealthCheck = require('../models/HealthCheck');
const { parseGithubUrl } = require('../services/githubService');
const { pingRepo } = require('../services/healthCheckService');

const router = express.Router();

// GET /api/repos - list all monitored repos with a quick uptime summary
router.get('/', async (req, res) => {
  try {
    const repos = await Repo.find().sort({ createdAt: -1 }).lean();

    const withStats = await Promise.all(
      repos.map(async (repo) => {
        const recentChecks = await HealthCheck.find({ repo: repo._id })
          .sort({ checkedAt: -1 })
          .limit(50)
          .lean();

        const upCount = recentChecks.filter((c) => c.status === 'up').length;
        const uptimePct = recentChecks.length ? Math.round((upCount / recentChecks.length) * 1000) / 10 : null;
        const latest = recentChecks[0] || null;

        return { ...repo, uptimePct, latest };
      })
    );

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repos - register a new repo to monitor + deploy
router.post('/', async (req, res) => {
  try {
    const { name, githubUrl, healthCheckUrl, workflowFile, branch } = req.body;

    if (!githubUrl || !healthCheckUrl) {
      return res.status(400).json({ error: 'githubUrl and healthCheckUrl are required' });
    }

    const { owner, repo } = parseGithubUrl(githubUrl);

    const newRepo = await Repo.create({
      name: name || repo,
      githubUrl,
      owner,
      repo,
      healthCheckUrl,
      workflowFile: workflowFile || 'deploy.yml',
      branch: branch || 'main'
    });

    // Fire an immediate health check so the dashboard has data right away
    pingRepo(newRepo).catch((e) => console.error('[health] initial ping failed', e.message));

    res.status(201).json(newRepo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/repos/:id
router.delete('/:id', async (req, res) => {
  try {
    await Repo.findByIdAndDelete(req.params.id);
    await HealthCheck.deleteMany({ repo: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repos/:id/ping - trigger an ad-hoc health check right now
router.post('/:id/ping', async (req, res) => {
  try {
    const repo = await Repo.findById(req.params.id);
    if (!repo) return res.status(404).json({ error: 'Repo not found' });
    const result = await pingRepo(repo);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
