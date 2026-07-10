import React from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RepoCard({ repo, selected, onSelect, onDeploy, onDelete, deploying }) {
  const status = repo.latest?.status || 'unknown';

  return (
    <div className={`repo-card${selected ? ' selected' : ''}`} onClick={() => onSelect(repo)}>
      <div className="repo-card-head">
        <div className="repo-name">{repo.name}</div>
        <div className={`led ${status}`} title={status} />
      </div>

      <div className="repo-meta">{repo.healthCheckUrl}</div>

      <div className="repo-stats-row">
        <div>
          <span className="repo-stat-label">Uptime (last 50)</span>
          {repo.uptimePct != null ? `${repo.uptimePct}%` : '—'}
        </div>
        <div>
          <span className="repo-stat-label">Latency</span>
          {repo.latest?.latencyMs != null ? `${repo.latest.latencyMs}ms` : '—'}
        </div>
        <div>
          <span className="repo-stat-label">Last check</span>
          {timeAgo(repo.latest?.checkedAt)}
        </div>
      </div>

      <div className="repo-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary" onClick={() => onDeploy(repo)} disabled={deploying}>
          {deploying ? 'Deploying…' : '⚡ Deploy'}
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(repo)}>
          Remove
        </button>
      </div>
    </div>
  );
}
