const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

test('catalogue retrieval and authenticated owner-only review lifecycle', { timeout: 30000 }, async () => {
  const proc = spawn(process.execPath, ['index.js'], { env: { ...process.env, PORT: '5000' } });
  try {
    await new Promise((resolve, reject) => {
      proc.stdout.on('data', d => { if (String(d).includes('Server is running')) resolve(); });
      proc.once('error', reject);
      proc.once('exit', code => reject(new Error('Server exited: ' + code)));
    });
    const call = async (path, method = 'GET', body, cookie) => {
      const res = await fetch('http://127.0.0.1:5000' + path, {
        method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000)
      });
      return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
    };
    // The starter currently listens on 5000; use its existing port until PORT is implemented.
    const all = await call('/');
    assert.equal(all.status, 200);
    assert.equal(Object.keys(all.body).length, 10);
    assert.equal((await call('/isbn/1')).body.title, 'Things Fall Apart');
    assert.equal(Object.keys((await call('/author/Unknown')).body).length, 4);
    assert.equal((await call('/title/Things%20Fall%20Apart')).body['1'].author, 'Chinua Achebe');
    assert.equal((await call('/isbn/999')).status, 404);
    assert.equal((await call('/review/1')).status, 200);
    assert.equal((await call('/register', 'POST', {})).status, 400);
    for (const username of ['reader_one', 'reader_two']) {
      assert.equal((await call('/register', 'POST', { username, password: 'demo-pass-2026' })).status, 201);
    }
    assert.equal((await call('/register', 'POST', { username: 'reader_one', password: 'duplicate' })).status, 409);
    assert.equal((await call('/customer/login', 'POST', { username: 'reader_one', password: 'wrong' })).status, 401);
    const first = await call('/customer/login', 'POST', { username: 'reader_one', password: 'demo-pass-2026' });
    const second = await call('/customer/login', 'POST', { username: 'reader_two', password: 'demo-pass-2026' });
    assert.equal(first.status, 200);
    assert.equal((await call('/customer/auth/review/1?review=test', 'PUT')).status, 401);
    assert.equal((await call('/customer/auth/review/1?review=First', 'PUT', undefined, first.cookie)).status, 200);
    assert.equal((await call('/customer/auth/review/1?review=Updated', 'PUT', undefined, first.cookie)).body.reviews.reader_one, 'Updated');
    await call('/customer/auth/review/1?review=Other', 'PUT', undefined, second.cookie);
    const removed = await call('/customer/auth/review/1', 'DELETE', undefined, first.cookie);
    assert.equal(removed.status, 200);
    assert.equal(removed.body.reviews.reader_one, undefined);
    assert.equal(removed.body.reviews.reader_two, 'Other');
    assert.equal((await call('/customer/auth/review/1', 'DELETE', undefined, first.cookie)).status, 404);
    assert.equal((await call('/customer/auth/review/999?review=test', 'PUT', undefined, second.cookie)).status, 404);
  } finally { proc.kill(); }
});

