#!/usr/bin/env node
// Minimal, dependency-free MCP server over stdio (JSON-RPC 2.0, newline-delimited).
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { TOOLS } from './tools.js';

export const SERVER_INFO = { name: 'mcp-automation-starter', version: '1.0.0' };
const PROTOCOL = '2025-06-18';

export function handle(msg) {
  const { id, method, params = {} } = msg || {};
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  if (id === undefined) return null; // notification, e.g. notifications/initialized
  switch (method) {
    case 'initialize':
      return ok({ protocolVersion: params.protocolVersion || PROTOCOL, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
    case 'ping':
      return ok({});
    case 'tools/list':
      return ok({ tools: TOOLS.map(({ run, ...t }) => t) });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return err(-32602, `Unknown tool: ${params.name}`);
      try {
        const out = tool.run(params.arguments || {});
        return ok({ content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: false });
      } catch (e) {
        return ok({ content: [{ type: 'text', text: String(e?.message || e) }], isError: true });
      }
    }
    default:
      return err(-32601, `Method not found: ${method}`);
  }
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isMain) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let res;
    try { res = handle(JSON.parse(line)); } catch { res = { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }; }
    if (res) process.stdout.write(JSON.stringify(res) + '\n');
  });
}
