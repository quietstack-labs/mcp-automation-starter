# MCP Automation Starter

Zero-dependency **Model Context Protocol (MCP) server** that plugs B2B lead-handling automation straight into Claude Desktop, Claude Code, Cursor or any MCP client. Node 18+, no `npm install`, one file to extend.

## Tools included
| Tool | What it does |
|---|---|
| `score_lead` | Scores an inbound lead 0–100 (business domain, size, intent words EN/KO) → hot / warm / cold |
| `triage_leads` | Scores and sorts a whole batch, highest first |
| `draft_outreach` | Personalized cold/follow-up email in English or Korean |
| `to_csv` | Turns results into CSV for HubSpot / Sheets / Notion import |

## Run
```bash
npm test          # 7 unit + end-to-end stdio tests
npm start         # MCP server on stdio
```

## Connect to Claude Desktop / Claude Code
```json
{ "mcpServers": { "automation": { "command": "node", "args": ["/ABSOLUTE/PATH/src/server.js"] } } }
```
Claude Code: `claude mcp add automation -- node /ABSOLUTE/PATH/src/server.js`

Then ask: *"Triage these 40 leads, draft Korean outreach for the hot ones, and give me a CSV."*

## Extend for a client (typical 2-week engagement)
Add an object to `TOOLS` in `src/tools.js` with `name`, `description`, `inputSchema`, `run`. Common client add-ons: Gmail/Slack send, Google Sheets write, CRM sync, invoice OCR, Notion/Jira ticket creation.

## License
MIT for buyers. See `OFFER.md` for done-for-you service.
