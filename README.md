# Runbook — Automated Deployment & Health Monitoring Dashboard

A MERN-stack **DevOps internal tool** that manages the lifecycle of your other
projects: it triggers CI/CD deployments via the GitHub Actions API, runs a
scheduled health-check microservice against each deployed app, stores
uptime/latency time series in MongoDB, visualizes them with Recharts, and
fires Discord/email alerts when something goes down. The whole stack is
containerized with Docker and orchestrated with docker-compose.

## Architecture

```
┌─────────────┐      REST/JSON      ┌──────────────────┐      workflow_dispatch      ┌────────────────┐
│  React SPA  │ ──────────────────► │  Express API      │ ───────────────────────────► │ GitHub Actions │
│  (nginx)    │ ◄────────────────── │  (Node.js)         │ ◄─────────────────────────── │  (your repos)  │
└─────────────┘                      │                    │      run status polling
                                      │  node-cron sweep   │
                                      │  every N minutes   │──► GET each repo's health URL
                                      │                    │
                                      │  Alert engine       │──► Discord webhook / Nodemailer
                                      └─────────┬──────────┘
                                                 │
                                          ┌──────▼───────┐
                                          │   MongoDB     │
                                          │ repos, checks,│
                                          │ deployments,  │
                                          │ alerts        │
                                          └───────────────┘
```

**Collections:** `repos` (monitored project + GitHub metadata),
`healthchecks` (time-series latency/status per ping), `deployments`
(CI/CD trigger history), `alerts` (fired down/recovered notifications).

## Features

- **CI/CD trigger** — the backend calls GitHub's `workflow_dispatch` REST
  endpoint to kick off a deploy for any registered repo, then polls the
  latest run's status.
- **Health-check microservice** — a `node-cron` job pings every active
  project's health URL on a schedule, records status code + latency in
  MongoDB, and tracks consecutive failures per project.
- **Dashboard** — React + Recharts show uptime %, a latency trend area
  chart, and an uptime "pulse" bar per check.
- **Alerting** — after N consecutive failed pings (configurable), an alert
  fires to a Discord webhook and/or email via Nodemailer, and is logged to
  the Alert feed. A "recovered" alert fires when the service comes back.
- **Dockerized** — separate Dockerfiles for frontend (nginx-served static
  build) and backend (Node), plus `docker-compose.yml` wiring in MongoDB.

## Project layout

```
devops-dashboard/
├── backend/                  Express API + cron + services
│   ├── config/db.js
│   ├── models/                Repo, HealthCheck, Deployment, Alert
│   ├── routes/                repos, deployments, health, alerts
│   ├── services/              githubService, healthCheckService, alertService
│   ├── server.js
│   └── Dockerfile
├── frontend/                 React (Vite) dashboard
│   ├── src/
│   │   ├── components/        RepoCard, RepoForm, HealthChart, AlertsFeed, DeploymentStatus
│   │   ├── api/api.js
│   │   └── App.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── sample-workflow/          Drop-in .github/workflows/deploy.yml for your MERN repos
└── docker-compose.yml
```

## Setup

### 1. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Fill in:
- `GITHUB_TOKEN` — a fine-grained PAT with **Actions: Read and write** on
  the repos you want to deploy.
- `DISCORD_WEBHOOK_URL` and/or `SMTP_*` / `ALERT_EMAIL_TO` — at least one
  alert channel.
- `HEALTH_CHECK_CRON` — how often to ping (default every 5 minutes).

### 2. Add the workflow to your MERN repos

Copy `sample-workflow/.github/workflows/deploy.yml` into each project you
want to deploy from the dashboard, and adjust the `Deploy` step to match
your actual host (Render deploy hook, Railway, Docker registry push, etc).
The key requirement is the `workflow_dispatch:` trigger.

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/status
- MongoDB: localhost:27017

### 4. Run locally without Docker (development)

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

### 5. Add a project in the dashboard

Click **+ Add project** and provide:
- **GitHub repository URL** — e.g. `https://github.com/you/your-mern-app`
- **Deployed app health URL** — a publicly reachable endpoint that returns
  `200` when healthy (e.g. `https://your-app.onrender.com/health`)
- **Workflow file** and **branch** — matches the file you added in step 2

The dashboard immediately runs a health check, then keeps pinging on the
configured cron schedule. Click **⚡ Deploy** to trigger a real GitHub
Actions run, and click into a project card to see its latency/uptime
charts, deployment history, and run link.

## API reference

| Method | Route                              | Description                          |
|--------|-------------------------------------|---------------------------------------|
| GET    | `/api/repos`                        | List monitored repos + uptime summary |
| POST   | `/api/repos`                        | Register a repo                       |
| DELETE | `/api/repos/:id`                    | Remove a repo                         |
| POST   | `/api/repos/:id/ping`               | Ad-hoc health check                   |
| POST   | `/api/deployments/:repoId/trigger`  | Trigger `workflow_dispatch`           |
| GET    | `/api/deployments/:repoId`          | Deployment history                    |
| GET    | `/api/deployments/:repoId/status/latest` | Latest GitHub Actions run status |
| GET    | `/api/health/:repoId?limit=100`     | Latency/uptime time series            |
| GET    | `/api/alerts?repoId=...`            | Alert feed                            |
