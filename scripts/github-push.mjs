import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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

/** 用 curl 更新引用（Node fetch 对该端点偶发 404，curl 更稳定） */
const curlRef = (method, path, body, validate = true) => {
  const args = [
    '-sS',
    '--ssl-no-revoke',
    '-X',
    method,
    '-H',
    `Authorization: Bearer ${token}`,
    '-H',
    'User-Agent: codex',
    '-H',
    'Content-Type: application/json',
  ];
  if (body) args.push('-d', JSON.stringify(body));
  args.push(`${api}/${path}`);
  const out = execFileSync('curl.exe', args, { encoding: 'utf8' });
  const data = JSON.parse(out || '{}');
  if (validate && !data.ref && !data.sha) {
    throw new Error(`${method} ${path} -> ${JSON.stringify(data)}`);
  }
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
        if (rel === 'entries.json' || rel === 'last-commit.txt') continue;
        files[rel] = await readFile(full);
      }
    }
  };
  await rec(root);
  return files;
};

const pushBranch = async (branch, message, files, extraTrees = []) => {
  console.log(`pushing ${branch} (${Object.keys(files).length} files)...`);
  let existing = false;
  let baseTree = null;
  let parentSha = null;
  try {
    const ref = await gh('GET', `git/ref/heads/${branch}`);
    existing = true;
    parentSha = ref.object.sha;
    const head = await gh('GET', `git/commits/${parentSha}`);
    baseTree = head.tree.sha;
  } catch {
    existing = false;
  }
  if (existing && process.env.FORCE_DELETE) {
    curlRef('DELETE', `git/refs/heads/${branch}`, null, false);
    existing = false;
    baseTree = null;
    parentSha = null;
  }
  const entries = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await gh('POST', 'git/blobs', {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    entries.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  entries.push(...extraTrees);
  const treeBody = baseTree ? { base_tree: baseTree, tree: entries } : { tree: entries };
  const tree = await gh('POST', 'git/trees', treeBody);
  const commit = await gh('POST', 'git/commits', {
    message,
    tree: tree.sha,
    parents: parentSha ? [parentSha] : [],
  });
  if (existing) {
    curlRef('PATCH', `git/refs/heads/${branch}`, { sha: commit.sha, force: false });
  } else {
    curlRef('POST', 'git/refs', { ref: `refs/heads/${branch}`, sha: commit.sha });
  }
  console.log(`  ok ${branch} -> ${commit.sha}`);
};

// GitHub 的 Git Data / Contents API 都不能直接写保留路径 .github/workflows，
// 这里用“子树”方式把它作为 .github 下的 tree 条目并入 main。
const buildWorkflowTree = async (content) => {
  const blob = await gh('POST', 'git/blobs', { content: content.toString('base64'), encoding: 'base64' });
  const workflows = await gh('POST', 'git/trees', {
    tree: [{ path: 'deploy.yml', mode: '100644', type: 'blob', sha: blob.sha }],
  });
  const dotGithub = await gh('POST', 'git/trees', {
    tree: [{ path: 'workflows', mode: '040000', type: 'tree', sha: workflows.sha }],
  });
  return { path: '.github', mode: '040000', type: 'tree', sha: dotGithub.sha };
};

const root = join(fileURLToPath(import.meta.url), '..', '..');
const source = await walk(root, new Set(['.git', 'node_modules', 'dist']));
const workflowPath = '.github/workflows/deploy.yml';
const workflowContent = source[workflowPath];
delete source[workflowPath];
const extraTrees =
  !process.env.NO_WORKFLOW && workflowContent ? [await buildWorkflowTree(workflowContent)] : [];
const mainBranch = process.env.MAIN_BRANCH || 'main';
if (!process.env.GH_ONLY || process.env.GH_ONLY === 'main') {
  await pushBranch(mainBranch, 'init: GKD 开屏广告自动屏蔽规则生成器', source, extraTrees);
}

const dist = await walk(join(root, 'dist'));
if (!process.env.GH_ONLY || process.env.GH_ONLY === 'gh-pages') {
  await pushBranch('gh-pages', 'deploy: static site', dist);
}

console.log('done');
