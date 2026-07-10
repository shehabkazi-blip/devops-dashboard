import React, { useState } from 'react';
import { createRepo } from '../api/api.js';

export default function RepoForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    githubUrl: '',
    healthCheckUrl: '',
    workflowFile: 'deploy.yml',
    branch: 'main'
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.githubUrl || !form.healthCheckUrl) {
      setError('GitHub URL and health check URL are required.');
      return;
    }

    setSubmitting(true);
    try {
      const repo = await createRepo(form);
      onCreated(repo);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add a project to monitor</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Project name</label>
            <input placeholder="e.g. task-tracker-api" value={form.name} onChange={update('name')} />
          </div>
          <div className="field">
            <label>GitHub repository URL</label>
            <input
              placeholder="https://github.com/you/your-mern-app"
              value={form.githubUrl}
              onChange={update('githubUrl')}
            />
          </div>
          <div className="field">
            <label>Deployed app health URL</label>
            <input
              placeholder="https://your-app.onrender.com/health"
              value={form.healthCheckUrl}
              onChange={update('healthCheckUrl')}
            />
          </div>
          <div className="field">
            <label>Workflow file</label>
            <input value={form.workflowFile} onChange={update('workflowFile')} />
          </div>
          <div className="field">
            <label>Branch</label>
            <input value={form.branch} onChange={update('branch')} />
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
