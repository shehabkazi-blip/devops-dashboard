const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function githubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set in the environment');
  }
  return axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    timeout: 10000
  });
}

/**
 * Parse "https://github.com/owner/repo" (with or without .git) into { owner, repo }
 */
function parseGithubUrl(url) {
  const match = url
    .trim()
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .match(/github\.com[/:]([^/]+)\/([^/]+)$/i);

  if (!match) throw new Error(`Could not parse a GitHub owner/repo from URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

/**
 * Trigger a workflow_dispatch event on GitHub Actions - this is the CI/CD pipeline trigger.
 * Requires the target workflow to declare `on: workflow_dispatch:` in its YAML.
 */
async function triggerWorkflow({ owner, repo, workflowFile, branch }) {
  const client = githubClient();
  await client.post(
    `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
    { ref: branch || 'main' }
  );
}

/**
 * Fetch the most recent workflow run for a repo/workflow so we can report status back
 * to the dashboard (queued / in_progress / success / failure).
 */
async function getLatestRun({ owner, repo, workflowFile }) {
  const client = githubClient();
  const { data } = await client.get(
    `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs`,
    { params: { per_page: 1 } }
  );
  const run = data.workflow_runs?.[0];
  if (!run) return null;

  return {
    id: run.id,
    htmlUrl: run.html_url,
    status: run.status, // queued | in_progress | completed
    conclusion: run.conclusion // success | failure | null
  };
}

module.exports = { parseGithubUrl, triggerWorkflow, getLatestRun };
