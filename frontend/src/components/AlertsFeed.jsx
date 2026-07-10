import React from 'react';

export default function AlertsFeed({ alerts }) {
  if (!alerts.length) {
    return <div className="empty-state">No alerts yet. This feed fires when a health check fails or recovers.</div>;
  }

  return (
    <div className="alert-feed">
      {alerts.map((a) => (
        <div key={a._id} className={`alert-item ${a.type}`}>
          <span>{a.type === 'down' ? '🔴' : '🟢'}</span>
          <div style={{ flex: 1 }}>
            <strong>{a.repo?.name || 'Unknown project'}</strong> — {a.message}
            {a.channels?.length > 0 && (
              <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 2 }}>
                sent via {a.channels.join(', ')}
              </div>
            )}
          </div>
          <div className="alert-time">{new Date(a.sentAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
