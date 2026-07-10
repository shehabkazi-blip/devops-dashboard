import React, { useEffect, useState, useCallback } from 'react';
import RepoForm from './components/RepoForm.jsx';
import RepoCard from './components/RepoCard.jsx';
import HealthChart from './components/HealthChart.jsx';
import AlertsFeed from './components/AlertsFeed.jsx';
import DeploymentStatus from './components/DeploymentStatus.jsx';
import {
  getRepos,
  deleteRepo,
  getHealthHistory,
  triggerDeployment,
  getDeployments,
  getAlerts
} from './api/api.js';

const POLL_MS = 15000;

export default function App() {
  const [repos, setRepos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deployingId, setDeployingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshRepos = useCallback(async () => {
    try {
      const data = await getRepos();
      setRepos(data);
      setSelected((cur) => {
        if (!cur) return cur;
        return data.find((r) => r._id === cur._id) || cur;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      setAlerts(await getAlerts());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refreshRepos();
    refreshAlerts();
    const id = setInterval(() => {
      refreshRepos();
      refreshAlerts();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refreshRepos, refreshAlerts]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    const load = async () => {
      const [h, d] = await Promise.all([
        getHealthHistory(selected._id, 60),
        getDeployments(selected._id)
      ]);
      if (!cancelled) {
        setHistory(h);
        setDeployments(d);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selected?._id]);

  const handleDeploy = async (repo) => {
    setDeployingId(repo._id);
    try {
      await triggerDeployment(repo._id);
      if (selected?._id === repo._id) {
        setDeployments(await getDeployments(repo._id));
      }
    } catch (e) {
      alert(`Deploy trigger failed: ${e.response?.data?.error || e.message}`);
    } finally {
      setDeployingId(null);
    }
  };

  const handleDelete = async (repo) => {
    if (!confirm(`Remove "${repo.name}" from monitoring?`)) return;
    await deleteRepo(repo._id);
    if (selected?._id === repo._id) setSelected(null);
    refreshRepos();
  };

  const totalUp = repos.filter((r) => r.latest?.status === 'up').length;
  const totalDown = repos.filter((r) => r.latest?.status === 'down').length;
  const avgLatency =
    repos.filter((r) => r.latest?.latencyMs != null).length > 0
      ? Math.round(
          repos.reduce((sum, r) => sum + (r.latest?.latencyMs || 0), 0) /
            repos.filter((r) => r.latest?.latencyMs != null).length
        )
      : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            run<span>book</span>
          </div>
          <div className="brand-sub">deployment &amp; health monitor</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add project
        </button>
      </header>

      <main className="main">
        <div className="summary-strip">
          <div className="summary-card">
            <div className="summary-label">Monitored projects</div>
            <div className="summary-value">{repos.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Healthy</div>
            <div className="summary-value up">{totalUp}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Down</div>
            <div className="summary-value down">{totalDown}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg latency</div>
            <div className="summary-value">{avgLatency != null ? `${avgLatency}ms` : '—'}</div>
          </div>
        </div>

        <div className="section-title">
          <h2>Projects</h2>
        </div>

        {loading ? (
          <div className="empty-state">Loading projects…</div>
        ) : repos.length === 0 ? (
          <div className="empty-state">
            No projects yet. Add a GitHub repo and its deployed health-check URL to start monitoring.
          </div>
        ) : (
          <div className="repo-grid">
            {repos.map((repo) => (
              <RepoCard
                key={repo._id}
                repo={repo}
                selected={selected?._id === repo._id}
                onSelect={setSelected}
                onDeploy={handleDeploy}
                onDelete={handleDelete}
                deploying={deployingId === repo._id}
              />
            ))}
          </div>
        )}

        {selected && (
          <div className="detail-panel">
            <div className="detail-head">
              <h2 className="display" style={{ fontSize: 20 }}>
                {selected.name}
              </h2>
              <a href={selected.githubUrl} target="_blank" rel="noreferrer">
                {selected.githubUrl}
              </a>
            </div>

            {history.length === 0 ? (
              <div className="empty-state">No health check data yet for this project.</div>
            ) : (
              <HealthChart history={history} />
            )}

            <div className="section-title" style={{ marginTop: 28 }}>
              <h2>Deployment history</h2>
            </div>
            <DeploymentStatus deployments={deployments} />
          </div>
        )}

        <div className="section-title">
          <h2>Alert feed</h2>
        </div>
        <AlertsFeed alerts={alerts} />
      </main>

      {showForm && (
        <RepoForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refreshRepos();
          }}
        />
      )}
    </div>
  );
}
