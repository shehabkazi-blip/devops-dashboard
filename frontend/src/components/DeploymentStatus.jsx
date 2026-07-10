import React from 'react';

export default function DeploymentStatus({ deployments }) {
  if (!deployments.length) {
    return <div className="empty-state">No deployments triggered yet. Hit "Deploy" on a project card.</div>;
  }

  return (
    <div className="alert-feed">
      {deployments.map((d) => (
        <div key={d._id} className="alert-item">
          <span className={`status-pill ${d.status}`}>{d.status.replace('_', ' ')}</span>
          <div style={{ flex: 1 }}>
            {d.message}
            {d.githubRunUrl && (
              <div style={{ marginTop: 4 }}>
                <a href={d.githubRunUrl} target="_blank" rel="noreferrer">
                  View workflow run →
                </a>
              </div>
            )}
          </div>
          <div className="alert-time">{new Date(d.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
