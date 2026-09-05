import { readdir, readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const [owner, repo] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;
if (!owner || !repo || !token) {
  console.error('usage: GITHUB_TOKEN=... node scripts/github-push.mjs <owner> <repo>');
  process.exit(1);
}

const api = `https://api.github.com/repos/${owner}/${repo}`;
const gh = async (method, path, body) => {
  const res = await fetch(`${api}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'codex',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
};

const walk = async (root, skip = new Set()) => {
  const files = {};
  const rec = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(root, full).replaceAll('\\', '/');
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        await rec(full);
      } else if (entry.isFile()) {
        if (rel === 'entries.json') continue;
        files[rel] = await readFile(full);
      }
    }
  };
  await rec(root);
  return files;
};

const pushBranch = async (branch, message, files) => {
  console.log(`pushing ${branch} (${Object.keys(files).length} files)...`);
  let existing = false;
  try {
    await gh('GET', `git/ref/heads/${branch}`);
    existing = true;
  } catch {
    existing = false;
  }
  const entries = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await gh('POST', 'git/blobs', {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    entries.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  if (process.env.DUMP_ENTRIES) {
    writeFileSync('entries.json', JSON.stringify({ branch, entries }, null, 2));
  }
  const tree = await gh('POST', 'git/trees', { tree: entries });
  const commit = await gh('POST', 'git/commits', {
    message,
    tree: tree.sha,
    parents: [],
  });
  if (existing) {
    await gh('PATCH', `git/refs/heads/${branch}`, { sha: commit.sha, force: true });
  } else {
    await gh('POST', 'git/refs', { ref: `refs/heads/${branch}`, sha: commit.sha });
  }
  console.log(`  ok ${branch} -> ${commit.sha}`);
};

const root = join(fileURLToPath(import.meta.url), '..', '..');
const source = await walk(root, new Set(['.git', 'node_modules', 'dist']));
// Git Data create-tree 对 .github/workflows 保留目录有限制，改用 Contents API 单独提交
const workflowPath = '.github/workflows/deploy.yml';
const workflowContent = source[workflowPath];
delete source[workflowPath];
await pushBranch('main', 'init: GKD 开屏广告自动屏蔽规则生成器', source);

if (workflowContent) {
  const res = await fetch(`${api}/contents/${workflowPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'codex',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'ci: add GitHub Pages deploy workflow',
      content: workflowContent.toString('base64'),
      branch: 'main',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`PUT contents workflow -> ${res.status} ${JSON.stringify(data)}`);
  console.log('  ok workflow added');
}

const dist = await walk(join(root, 'dist'));
await pushBranch('gh-pages', 'deploy: static site', dist);

console.log('done');
