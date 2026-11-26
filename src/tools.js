// Business tools exposed over MCP. Pure functions: easy to test and to extend per client.
const FREE_MAIL = new Set(['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'yahoo.com', 'outlook.com', 'hotmail.com']);
const INTENT_WORDS = ['budget', 'urgent', 'asap', 'contract', 'quote', 'pricing', 'demo', '견적', '예산', '도입', '계약', '긴급'];

export function scoreLead({ email = '', company = '', message = '', employees = 0 } = {}) {
  let score = 0;
  const reasons = [];
  const domain = String(email).split('@')[1]?.toLowerCase() || '';
  if (domain && !FREE_MAIL.has(domain)) { score += 30; reasons.push('business email domain'); }
  if (company) { score += 10; reasons.push('company provided'); }
  const n = Number(employees) || 0;
  if (n >= 200) { score += 30; reasons.push('200+ employees'); }
  else if (n >= 20) { score += 20; reasons.push('20-199 employees'); }
  const text = String(message).toLowerCase();
  const hits = INTENT_WORDS.filter((w) => text.includes(w));
  if (hits.length) { score += Math.min(30, hits.length * 10); reasons.push(`intent keywords: ${hits.join(', ')}`); }
  score = Math.min(100, score);
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return { score, tier, reasons };
}

export function draftOutreach({ name = 'there', company = 'your team', pain = 'repetitive manual work', lang = 'en', offer = 'a 2-week AI automation pilot' } = {}) {
  if (lang === 'ko') {
    return {
      subject: `${company} 반복 업무 자동화 제안`,
      body: `${name}님 안녕하세요.\n\n${company}에서 겪고 계신 "${pain}" 문제를 AI 워크플로 자동화로 줄여드릴 수 있어 연락드립니다.\n` +
        `${offer} 형태로 2주 안에 실제 동작하는 자동화를 납품하며, 효과가 없으면 비용을 받지 않습니다.\n\n15분 통화 가능하신 시간 알려주시겠어요?`,
    };
  }
  return {
    subject: `Cutting ${pain} at ${company}`,
    body: `Hi ${name},\n\nI help teams like ${company} remove "${pain}" with AI workflow automation (MCP + LLM agents wired into your existing tools).\n` +
      `I offer ${offer}: a working automation delivered in 14 days, or you pay nothing.\n\nOpen to a 15-minute call this week?`,
  };
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv({ rows = [] } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return { csv: '' };
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))];
  return { csv: lines.join('\n') };
}

export function triageLeads({ leads = [] } = {}) {
  const scored = leads.map((l) => ({ ...l, ...scoreLead(l) })).sort((a, b) => b.score - a.score);
  return {
    leads: scored.map(({ reasons, ...r }) => ({ ...r, reasons: reasons.join('; ') })),
    hot: scored.filter((l) => l.tier === 'hot').length,
  };
}

const obj = (properties, required = []) => ({ type: 'object', properties, required });
const str = { type: 'string' };

export const TOOLS = [
  { name: 'score_lead', description: 'Score one inbound B2B lead 0-100 and assign hot/warm/cold tier.',
    inputSchema: obj({ email: str, company: str, message: str, employees: { type: 'number' } }, ['email']), run: scoreLead },
  { name: 'triage_leads', description: 'Score and sort a batch of leads, highest first.',
    inputSchema: obj({ leads: { type: 'array', items: { type: 'object' } } }, ['leads']), run: triageLeads },
  { name: 'draft_outreach', description: 'Draft a personalized outreach email (lang: en or ko).',
    inputSchema: obj({ name: str, company: str, pain: str, lang: { type: 'string', enum: ['en', 'ko'] }, offer: str }), run: draftOutreach },
  { name: 'to_csv', description: 'Convert an array of row objects to CSV for CRM/Sheets import.',
    inputSchema: obj({ rows: { type: 'array', items: { type: 'object' } } }, ['rows']), run: toCsv },
];
