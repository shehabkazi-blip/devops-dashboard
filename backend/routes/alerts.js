const express = require('express');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/alerts?repoId=... - recent alert feed, optionally scoped to a repo
router.get('/', async (req, res) => {
  try {
    const filter = req.query.repoId ? { repo: req.query.repoId } : {};
    const alerts = await Alert.find(filter)
      .sort({ sentAt: -1 })
      .limit(50)
      .populate('repo', 'name githubUrl healthCheckUrl');
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
