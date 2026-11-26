// End-to-end: spawn the real stdio server and speak MCP to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('stdio server answers initialize + tools/call', async () => {
  const p = spawn(process.execPath, [fileURLToPath(new URL('../src/server.js', import.meta.url))]);
  const lines = [];
  let buf = '';
  const done = new Promise((resolve) => p.stdout.on('data', (d) => {
    buf += d;
    const parts = buf.split('\n');
    buf = parts.pop();
    lines.push(...parts.filter(Boolean));
    if (lines.length >= 2) resolve();
  }));
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }) + '\n');
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'draft_outreach', arguments: { company: 'Acme', lang: 'ko' } } }) + '\n');
  await done;
  p.kill();
  const [init, call] = lines.map((l) => JSON.parse(l));
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.match(call.result.structuredContent.subject, /Acme/);
});
