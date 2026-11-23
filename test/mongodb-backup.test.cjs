const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '..', 'bin', 'mongodb-backup.sh');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mongodb-backup-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  const backups = path.join(root, 'backups');
  fs.mkdirSync(bin);
  fs.mkdirSync(backups);
  fs.writeFileSync(path.join(bin, 'mongodump'), `#!/bin/bash
for arg in "$@"; do
  case "$arg" in --archive=*) archive=\${arg#--archive=} ;; esac
done
printf 'archive' > "$archive"
exit "\${MOCK_EXIT:-0}"
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, BACKUP_DIR: backups,
    MONGO_BACKUP_URI: 'mongodb://example', MONGO_BACKUP_RETENTION_DAYS: '30',
    MONGO_BACKUP_HOUR_UTC: '2', MONGO_BACKUP_MINUTE_UTC: '0' };
  return { backups, env };
}

function run(env, mode = 'once') {
  return spawnSync('bash', [script, mode], { env, encoding: 'utf8' });
}

test('successful backup creates archive and removes expired archives', (t) => {
  const { backups, env } = fixture(t);
  const old = path.join(backups, 'mongodb-old.archive.gz');
  const unrelated = path.join(backups, 'other.archive.gz');
  fs.writeFileSync(old, 'old');
  fs.writeFileSync(unrelated, 'other');
  const aged = new Date(Date.now() - 32 * 86400 * 1000);
  fs.utimesSync(old, aged, aged);
  fs.utimesSync(unrelated, aged, aged);
  const result = run(env);
  assert.equal(result.status, 0, result.stderr);
  const files = fs.readdirSync(backups);
  assert.equal(files.filter((f) => /^mongodb-.*\.archive\.gz$/.test(f)).length, 1);
  assert.equal(fs.existsSync(old), false);
  assert.equal(fs.existsSync(unrelated), true);
});

test('failed backup removes temporary file and keeps existing archives', (t) => {
  const { backups, env } = fixture(t);
  const old = path.join(backups, 'mongodb-old.archive.gz');
  fs.writeFileSync(old, 'old');
  const aged = new Date(Date.now() - 32 * 86400 * 1000);
  fs.utimesSync(old, aged, aged);
  const result = run({ ...env, MOCK_EXIT: '1' });
  assert.notEqual(result.status, 0);
  assert.deepEqual(fs.readdirSync(backups), ['mongodb-old.archive.gz']);
});

test('invalid schedule and retention values fail before dumping', (t) => {
  const { backups, env } = fixture(t);
  for (const values of [{ MONGO_BACKUP_HOUR_UTC: '24' },
    { MONGO_BACKUP_MINUTE_UTC: '-1' }, { MONGO_BACKUP_RETENTION_DAYS: '0' }]) {
    assert.notEqual(run({ ...env, ...values }).status, 0);
  }
  assert.deepEqual(fs.readdirSync(backups), []);
});