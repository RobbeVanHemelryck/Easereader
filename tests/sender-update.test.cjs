const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('editing a sender preserves its password unless a replacement is provided', { timeout: 15000 }, async (t) => {
  const configDir = await mkdtemp(path.join(os.tmpdir(), 'easereader-sender-test-'));
  const port = await availablePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, CONFIG_DIR: configDir, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
    await rm(configDir, { recursive: true, force: true });
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 10000);
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Server exited with ${code}`)); });
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Easereader API running')) { clearTimeout(timeout); resolve(); }
    });
  });

  const base = `http://127.0.0.1:${port}/api/senders`;
  const send = async (url, method, body) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  const sender = await send(base, 'POST', {
    user: 'reader@example.test', host: 'smtp.example.test', port: 587,
    secure: false, password: 'original-test-password',
  });
  const savedPassword = async () => JSON.parse(await readFile(path.join(configDir, 'senders.json'), 'utf8'))[0].password;

  for (const password of [undefined, '', '••••••']) {
    await send(`${base}/${sender.id}`, 'PUT', { host: 'updated.example.test', password });
    assert.equal(await savedPassword(), 'original-test-password');
  }
  await send(`${base}/${sender.id}`, 'PUT', { password: 'replacement-test-password' });
  assert.equal(await savedPassword(), 'replacement-test-password');
});
