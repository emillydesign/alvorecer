// Camada de dados. Tudo fica no repositório PRIVADO de dados no GitHub (alvorecer-dados).
// Neste aparelho só fica guardado o "token" de acesso (como um login).
import { ym, today, uid } from './util.js';

const API = 'https://api.github.com';
const b64enc = s => { const b = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); };
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));
const encPath = p => p.split('/').map(encodeURIComponent).join('/');

export function defaultState(catalog) {
  const courses = {};
  for (const l of catalog.languages) if (l.id === 'en') courses['lang:' + l.id] = { level: l.start, cycle: 1, plans: {}, done: {}, levels: {} };
  return {
    version: 1,
    profile: { name: '', area: '' },
    plan: { main: 'en', second: '', secondDays: [] },
    courses,
    streak: { count: 0, best: 0, last: null },
    stats: { lessons: 0, conversations: 0, reviews: 0, tests: 0, minutes: 0 },
    created: today()
  };
}

class Base {
  constructor() { this.config = {}; this.state = null; this.srs = []; this.months = {}; this.timers = {}; }
  // eventos do histórico, 1 arquivo por mês
  async month(m) {
    if (!this.months[m]) this.months[m] = (await this.read(`history/${m}.json`)) || [];
    return this.months[m];
  }
  async addEvent(ev) {
    const e = { id: uid(), date: today(), ts: new Date().toISOString(), ...ev };
    const m = e.date.slice(0, 7);
    const list = await this.month(m);
    list.push(e);
    this.saveSoon(`history/${m}.json`, () => this.months[m], 300);
    return e;
  }
  saveState() { this.saveSoon('state.json', () => this.state); }
  saveSrs() { this.saveSoon('srs.json', () => this.srs); }
  saveConfig() { this.saveSoon('config.json', () => this.config, 100); }
  saveSoon(path, getter, ms = 1200) {
    clearTimeout(this.timers[path]?.t);
    const t = setTimeout(() => { delete this.timers[path]; this.write(path, getter()); }, ms);
    this.timers[path] = { t, getter };
  }
  async flush() {
    const pend = Object.entries(this.timers);
    for (const [path, { t, getter }] of pend) { clearTimeout(t); delete this.timers[path]; this.write(path, getter()); }
    await this.queue;
  }
  async getLesson(course, id) { return this.read(`lessons/${course.replace(':', '_')}/${id}.json`); }
  async putLesson(course, id, data) { return this.write(`lessons/${course.replace(':', '_')}/${id}.json`, data); }
  async getConvo(id) { return this.read(`conversas/${id}.json`); }
  async putConvo(id, data) { return this.write(`conversas/${id}.json`, data); }
}

export class GitHubStore extends Base {
  constructor(token, owner, repo) { super(); this.token = token; this.owner = owner; this.repo = repo; this.shas = {}; this.queue = Promise.resolve(); this.onError = () => {}; }
  async api(path, opts = {}) {
    const r = await fetch(API + path, { ...opts, headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) } });
    return r;
  }
  static async whoami(token) {
    const r = await fetch(API + '/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status === 401 ? 'Token inválido ou expirado.' : 'Não consegui falar com o GitHub (' + r.status + ').');
    return (await r.json()).login;
  }
  async read(path) {
    const r = await this.api(`/repos/${this.owner}/${this.repo}/contents/${encPath(path)}?t=${Date.now()}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub ${r.status} ao ler ${path}`);
    const j = await r.json();
    this.shas[path] = j.sha;
    let text;
    if (j.content && j.encoding === 'base64') text = b64dec(j.content);
    else {
      const raw = await this.api(`/repos/${this.owner}/${this.repo}/contents/${encPath(path)}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
      text = await raw.text();
    }
    try { return JSON.parse(text); } catch { return null; }
  }
  write(path, data) {
    const body = JSON.stringify(data, null, 1);
    this.queue = this.queue.then(() => this._put(path, body)).catch(e => this.onError(e));
    return this.queue;
  }
  async _put(path, body, retry = true) {
    const payload = { message: `${path} · ${new Date().toLocaleString('pt-BR')}`, content: b64enc(body) };
    if (this.shas[path]) payload.sha = this.shas[path];
    const r = await this.api(`/repos/${this.owner}/${this.repo}/contents/${encPath(path)}`, { method: 'PUT', body: JSON.stringify(payload) });
    if ((r.status === 409 || r.status === 422) && retry) {
      const g = await this.api(`/repos/${this.owner}/${this.repo}/contents/${encPath(path)}?t=${Date.now()}`);
      this.shas[path] = g.ok ? (await g.json()).sha : undefined;
      return this._put(path, body, false);
    }
    if (!r.ok) throw new Error(`Não consegui salvar (${r.status}). Verifique a internet.`);
    this.shas[path] = (await r.json()).content.sha;
  }
  async listMonths() {
    const r = await this.api(`/repos/${this.owner}/${this.repo}/contents/history`);
    if (!r.ok) return [];
    return (await r.json()).map(f => f.name.replace('.json', '')).filter(n => /^\d{4}-\d{2}$/.test(n)).sort().reverse();
  }
  async load(catalog) {
    const [config, state, srs] = await Promise.all([this.read('config.json'), this.read('state.json'), this.read('srs.json')]);
    if (config === null && state === null && !(await this.api(`/repos/${this.owner}/${this.repo}`)).ok)
      throw new Error(`Não encontrei o repositório ${this.owner}/${this.repo}. Confira o nome e se o token tem acesso a ele.`);
    this.config = config || {};
    this.state = state || defaultState(catalog);
    this.srs = srs || [];
    this.isNew = !state || !state.onboarded;
    await this.month(ym());
    if (!state) this.saveState();
  }
}

// Supabase: login com e-mail e senha; cada conta guarda os próprios "arquivos" (protegidos por RLS).
export class SupabaseStore extends Base {
  constructor(sb, user) { super(); this.sb = sb; this.user = user; this.queue = Promise.resolve(); this.onError = () => {}; this.owner = user.email; this.repo = 'conta'; }
  async read(path) {
    const { data, error } = await this.sb.from('arquivos').select('data').eq('path', path).maybeSingle();
    if (error) throw new Error('Não consegui ler seus dados (' + error.message + ').');
    return data ? data.data : null;
  }
  write(path, data) {
    const row = { user_id: this.user.id, path, data, updated_at: new Date().toISOString() };
    this.queue = this.queue.then(async () => {
      const { error } = await this.sb.from('arquivos').upsert(row);
      if (error) throw new Error('Não consegui salvar (' + error.message + '). Verifique a internet.');
    }).catch(e => this.onError(e));
    return this.queue;
  }
  async listMonths() {
    const { data } = await this.sb.from('arquivos').select('path').like('path', 'history/%');
    return (data || []).map(r => r.path.slice(8, 15)).filter(n => /^\d{4}-\d{2}$/.test(n)).sort().reverse();
  }
  // IA pelo servidor do IAlvorecer (Supabase Edge Function "ia"): ninguém precisa de chave própria
  aiProxy = async ({ op = 'gen', model, body, cache = null }) => {
    const { data } = await this.sb.auth.getSession();
    return fetch(`${this.sbUrl}/functions/v1/ia`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}`, apikey: this.sbKey }, body: JSON.stringify({ op, model, body, cache }) });
  };
  async wipe() { const { error } = await this.sb.from('arquivos').delete().eq('user_id', this.user.id); if (error) throw new Error(error.message); }
  async load(catalog) {
    const [config, state, srs] = await Promise.all([this.read('config.json'), this.read('state.json'), this.read('srs.json')]);
    const meta = this.user.user_metadata || {};
    this.config = config || { email: this.user.email, emailsOn: meta.emails !== false, emailHoraAula: 8, conversa: { modo: 'livre', hora: 19, agenda: [], lembrete: false } };
    if (this.config.model && /^gemini-2.5/.test(this.config.model)) delete this.config.model;
    if (!this.config.email) this.config.email = this.user.email;
    this.state = state || defaultState(catalog);
    if (!state && meta.name) this.state.profile.name = meta.name;
    this.srs = srs || [];
    this.isNew = !state || !state.onboarded;
    await this.month(ym());
    if (!config) this.saveConfig();
    if (!state) this.saveState();
  }
}

// Modo demonstração: nada é salvo, só para ver como o site funciona.
export class DemoStore extends Base {
  constructor(demo) { super(); this.demo = demo; this.queue = Promise.resolve(); this.files = {}; this.isDemo = true; }
  async read(path) { return this.files[path] ? JSON.parse(this.files[path]) : null; }
  async write(path, data) { this.files[path] = JSON.stringify(data); }
  async listMonths() { return Object.keys(this.files).filter(k => k.startsWith('history/')).map(k => k.slice(8, 15)).sort().reverse(); }
  async load() {
    const d = this.demo();
    this.config = d.config; this.state = d.state; this.srs = d.srs;
    for (const [k, v] of Object.entries(d.files)) this.files[k] = JSON.stringify(v);
    await this.month(ym());
  }
}
