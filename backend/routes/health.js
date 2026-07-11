const express = require('express');
const HealthCheck = require('../models/HealthCheck');

const router = express.Router();

// মনিটরিং টুল বা হার্টবিট চেক করার জন্য নতুন এন্ডপয়েন্ট
router.get('/', (req, res) => {
  res.status(200).send('OK');
});

// GET /api/health/:repoId?limit=100 - latency/uptime time series for charts
router.get('/:repoId', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const checks = await HealthCheck.find({ repo: req.params.repoId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean();

    // Return oldest -> newest for natural left-to-right chart rendering
    res.json(checks.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
