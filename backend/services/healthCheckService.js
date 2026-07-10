const axios = require('axios');
const cron = require('node-cron');
const Repo = require('../models/Repo');
const HealthCheck = require('../models/HealthCheck');
const { fireAlert } = require('./alertService');

// Tracks consecutive-failure counts per repo in-memory so we don't spam alerts
// on every single failed ping. Resets to 0 on the next success.
const consecutiveFailures = new Map();

const FAILURE_THRESHOLD = Number(process.env.ALERT_FAILURE_THRESHOLD || 1);

async function pingRepo(repo) {
  const start = Date.now();
  let result;

  try {
    const res = await axios.get(repo.healthCheckUrl, {
      timeout: 8000,
      validateStatus: () => true // we want to inspect the status ourselves
    });
    const latencyMs = Date.now() - start;
    const isUp = res.status >= 200 && res.status < 400;

    result = {
      repo: repo._id,
      status: isUp ? 'up' : 'down',
      statusCode: res.status,
      latencyMs,
      error: isUp ? null : `Unexpected status code ${res.status}`
    };
  } catch (err) {
    result = {
      repo: repo._id,
      status: 'down',
      statusCode: null,
      latencyMs: Date.now() - start,
      error: err.code || err.message
    };
  }

  await HealthCheck.create(result);
  await evaluateAlertState(repo, result);
  return result;
}

async function evaluateAlertState(repo, result) {
  const key = String(repo._id);
  const priorFailures = consecutiveFailures.get(key) || 0;

  if (result.status === 'down') {
    const newCount = priorFailures + 1;
    consecutiveFailures.set(key, newCount);

    if (newCount === FAILURE_THRESHOLD) {
      await fireAlert({
        repo,
        type: 'down',
        message: `Health check failed (${result.error || 'status ' + result.statusCode}). Latency: ${result.latencyMs}ms.`
      });
    }
  } else if (priorFailures >= FAILURE_THRESHOLD) {
    // Was down, now recovered
    consecutiveFailures.set(key, 0);
    await fireAlert({
      repo,
      type: 'recovered',
      message: `Service responded with ${result.statusCode} again after ${priorFailures} failed check(s). Latency: ${result.latencyMs}ms.`
    });
  } else {
    consecutiveFailures.set(key, 0);
  }
}

async function runHealthSweep() {
  const repos = await Repo.find({ isActive: true });
  await Promise.all(repos.map((repo) => pingRepo(repo).catch((e) => console.error('[health] ping error', e.message))));
}

function startHealthCheckScheduler() {
  const cronExpr = process.env.HEALTH_CHECK_CRON || '*/5 * * * *';
  console.log(`[health] scheduler starting with cron "${cronExpr}"`);

  cron.schedule(cronExpr, () => {
    runHealthSweep().catch((e) => console.error('[health] sweep error', e.message));
  });

  // Run once immediately on boot so the dashboard has data right away
  runHealthSweep().catch((e) => console.error('[health] initial sweep error', e.message));
}

module.exports = { startHealthCheckScheduler, runHealthSweep, pingRepo };
