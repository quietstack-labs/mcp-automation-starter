import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreLead, draftOutreach, toCsv, triageLeads } from '../src/tools.js';
import { handle } from '../src/server.js';

test('scoreLead: hot business lead', () => {
  const r = scoreLead({ email: 'cto@acme.co.kr', company: 'Acme', employees: 250, message: '예산 확보, urgent demo please' });
  assert.equal(r.tier, 'hot');
  assert.ok(r.score >= 70);
});

test('scoreLead: cold free-mail lead', () => {
  assert.equal(scoreLead({ email: 'kim@gmail.com' }).tier, 'cold');
});

test('draftOutreach: ko and en', () => {
  assert.match(draftOutreach({ name: '김대표', company: '에이컴', lang: 'ko' }).subject, /에이컴/);
  assert.match(draftOutreach({ company: 'Acme' }).body, /Acme/);
});

test('toCsv escapes commas and quotes', () => {
  assert.equal(toCsv({ rows: [{ a: 'x,y', b: 'say "hi"' }] }).csv, 'a,b\n"x,y","say ""hi"""');
});

test('triageLeads sorts by score', () => {
  const r = triageLeads({ leads: [{ email: 'a@gmail.com' }, { email: 'b@corp.com', company: 'Corp', employees: 500 }] });
  assert.equal(r.leads[0].email, 'b@corp.com');
});

test('MCP: initialize, tools/list, tools/call, errors', () => {
  assert.equal(handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }).result.serverInfo.name, 'mcp-automation-starter');
  assert.equal(handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal(handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' }).result.tools.length, 4);
  const call = handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'score_lead', arguments: { email: 'x@corp.io' } } });
  assert.equal(call.result.isError, false);
  assert.equal(handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } }).error.code, -32602);
  assert.equal(handle({ jsonrpc: '2.0', id: 5, method: 'bogus' }).error.code, -32601);
});
