import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const packagePaths = [
  'packages/core/package.json',
  'packages/adapters/package.json',
  'packages/scorers/package.json',
  'packages/cost/package.json',
  'packages/regression/package.json',
  'packages/cli/package.json',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const pkgPath of packagePaths) {
  const raw = await readFile(join(root, pkgPath), 'utf-8');
  const pkg = JSON.parse(raw);

  assert(pkg.main, `${pkg.name}: missing main`);
  assert(pkg.module, `${pkg.name}: missing module`);
  assert(pkg.types, `${pkg.name}: missing types`);
  assert(pkg.exports?.['.']?.import, `${pkg.name}: missing exports.import`);
  assert(pkg.exports?.['.']?.require, `${pkg.name}: missing exports.require`);
  assert(pkg.exports?.['.']?.types, `${pkg.name}: missing exports.types`);
  assert(Array.isArray(pkg.files) && pkg.files.includes('dist'), `${pkg.name}: files must include dist`);
}

const tempDir = await mkdtemp(join(tmpdir(), 'aegis-install-smoke-'));
try {
  execSync('npm pack --workspaces --json', { cwd: root, stdio: 'pipe' });
  execSync('npm init -y', { cwd: tempDir, stdio: 'ignore' });

  const installCmd = [
    'npm install',
    `${root}/packages/core`,
    `${root}/packages/adapters`,
    `${root}/packages/scorers`,
    `${root}/packages/cost`,
    `${root}/packages/regression`,
    `${root}/packages/cli`,
  ].join(' ');

  execSync(installCmd, { cwd: tempDir, stdio: 'pipe' });
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

process.stdout.write('Package verification passed.\n');
