require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startHealthCheckScheduler } = require('./services/healthCheckService');

const reposRouter = require('./routes/repos');
const deploymentsRouter = require('./routes/deployments');
const healthRouter = require('./routes/health');
const alertsRouter = require('./routes/alerts');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ ok: true, service: 'devops-dashboard-api', time: new Date().toISOString() });
});

app.use('/api/repos', reposRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/health', healthRouter);
app.use('/api/alerts', alertsRouter);

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startHealthCheckScheduler();
  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
});
