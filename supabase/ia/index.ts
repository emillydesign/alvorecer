// IAlvorecer · função "ia": o site conversa com o Gemini por aqui, sem cada pessoa precisar de chave.
// Usa vários modelos grátis em sequência (cada um tem a própria cota): quando um lota, passa para o próximo.
// Economia: limite diário por pessoa + aulas prontas compartilhadas (cada aula é criada uma vez só).
import { createClient } from 'npm:@supabase/supabase-js@2';

const LIMITE = Number(Deno.env.get('LIMITE_DIARIO') || '120'); // usos de IA por pessoa por dia
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'x-ia-uso',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const raw = (t: string, status: number, extra: Record<string, string> = {}) => new Response(t, { status, headers: { ...cors, ...extra, 'Content-Type': 'application/json' } });

// ---- fila de modelos ----
let cacheNomes: { t: number; nomes: string[] } | null = null;
async function nomesModelos(key: string) {
  if (cacheNomes && Date.now() - cacheNomes.t < 6 * 3600e3) return cacheNomes.nomes;
  const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
  const j = await r.json();
  const nomes = (j.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m: any) => m.name.replace('models/', ''));
  cacheNomes = { t: Date.now(), nomes };
  return nomes;
}
const ver = (n: string) => parseFloat((n.match(/-(\d+(\.\d+)?)/) || [])[1] || '0');
const pref = (a: string, b: string) => (ver(b) - ver(a)) || (Number(/preview/.test(a)) - Number(/preview/.test(b)));
function filas(nomes: string[]) {
  const ok = (n: string) => !/(image|tts|audio|live|embedding|exp|thinking|robotics|transcribe|e2b|e4b|banana)/.test(n);
  const lite = nomes.filter((n) => /flash-lite/.test(n) && ok(n)).sort(pref);
  const gemma = nomes.filter((n) => /^gemma-4/.test(n) && ok(n)).sort((a, b) => (Number(/31b/.test(b)) - Number(/31b/.test(a))) || pref(a, b));
  const flash = nomes.filter((n) => /flash/.test(n) && !/lite/.test(n) && ok(n)).sort(pref);
  return { full: [...lite, ...gemma, ...flash], fast: [...gemma, ...lite, ...flash], image: [...lite, ...flash, ...gemma] };
}
// Gemma não aceita "instrução de sistema" nem "modo JSON": junta tudo na mensagem
function adaptar(model: string, body: any) {
  if (!/^gemma/.test(model)) return body;
  const b = JSON.parse(JSON.stringify(body));
  const sys = (b.systemInstruction?.parts || []).map((p: any) => p.text).join('\n'); delete b.systemInstruction;
  const querJson = b.generationConfig?.responseMimeType === 'application/json';
  if (b.generationConfig) { delete b.generationConfig.responseMimeType; delete b.generationConfig.thinkingConfig; }
  const pos = querJson ? '\n\nIMPORTANTE: responda APENAS com um JSON válido, sem nenhum texto antes ou depois e sem ```.' : '';
  const users = b.contents.filter((c: any) => c.role === 'user');
  const first = users[0], last = users[users.length - 1];
  const tp = first?.parts?.find((p: any) => typeof p.text === 'string');
  const pre = sys ? `INSTRUÇÕES (siga sempre):\n${sys}\n\n---\n\n` : '';
  if (tp) tp.text = pre + tp.text + (first === last ? pos : ''); else if (first) first.parts.unshift({ text: pre });
  if (last && last !== first) { const lp = last.parts.find((p: any) => typeof p.text === 'string'); if (lp) lp.text += pos; }
  return b;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const pub = createClient(url, (Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!);
    const { data: { user } } = await pub.auth.getUser(token);
    if (!user) return json({ error: { message: 'Entre na sua conta para usar o IAlvorecer.' } }, 401);
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ error: { message: 'O IAlvorecer ainda não foi ligado (falta GEMINI_API_KEY no Supabase).' } }, 503);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { op, model, body, cache } = await req.json();
    if (op === 'models') {
      const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
      return raw(await r.text(), r.status);
    }
    // aula pronta compartilhada? então não gasta nada
    const chave = typeof cache === 'string' && cache.length < 200 ? cache : null;
    if (chave) {
      const { data } = await admin.from('licoes_publicas').select('resposta').eq('chave', chave).maybeSingle();
      if (data?.resposta) return raw(data.resposta, 200);
    }
    // limite diário por pessoa (dia de Brasília)
    let usados = 0;
    try {
      const { data: n } = await admin.rpc('contar_uso_ia', { uid: user.id, d: new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) });
      usados = typeof n === 'number' ? n : 0;
      if (typeof n === 'number' && n > LIMITE) return json({ error: { message: `IAlvorecer: você usou os ${LIMITE} usos de IA de hoje (é o que dá para oferecer de graça para todo mundo). Amanhã libera de novo! Se quiser usar mais, conecte a sua própria IA (grátis) na página inicial ou em Ajustes.` } }, 429);
    } catch (_) { /* se o contador falhar, não bloqueia */ }
    // escolhe a fila e tenta modelo por modelo até um responder
    const f = filas(await nomesModelos(key));
    const tipo = model === 'auto-image' ? 'image' : model === 'auto-fast' ? 'fast' : 'full';
    const lista = /^auto-/.test(model || '') ? f[tipo] : [model, ...f[tipo]].filter(Boolean);
    let r: Response | null = null, text = '';
    for (const m of (lista.length ? lista : ['gemini-flash-lite-latest'])) {
      r = await fetch(`${BASE}/models/${m}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(adaptar(m, body)) });
      text = await r.text();
      if (![429, 404, 503].includes(r.status) && !(r.status === 400 && /^gemma/.test(m))) break;
    }
    if (r!.ok && chave) await admin.from('licoes_publicas').upsert({ chave, resposta: text });
    return raw(text, r!.status, usados ? { 'x-ia-uso': String(Math.min(usados, LIMITE)) } : {});
  } catch (e) {
    return json({ error: { message: String(e) } }, 500);
  }
});
