// Efeitos visuais: ícones Lucide, partículas, animações de entrada.
export const ic = (n, cls = '') => `<i data-lucide="${n}"${cls ? ` class="${cls}"` : ''}></i>`;
export const icoOf = v => !v ? ic('sparkles') : /^[a-z0-9-]+$/.test(v) ? ic(v) : String(v).replace(/[&<>"']/g, '');

// emojis da interface → ícones de linha
const EMO = {
  '✦': 'sparkles', '🎙': 'mic', '📅': 'calendar-days', '🧪': 'flask-conical', '📘': 'book-open', '◎': 'repeat-2', '🔥': 'flame',
  '📝': 'clipboard-check', '🏆': 'trophy', '📋': 'list-checks', '🌴': 'coffee', '✓': 'check', '🗑': 'trash-2', '↶': 'undo-2',
  '🧭': 'compass', '⏭': 'skip-forward', '👍': 'thumbs-up', '👎': 'thumbs-down', '🧹': 'eraser', '⚠': 'triangle-alert', '☀': 'sunrise',
  '🎯': 'target', '💡': 'lightbulb', '🔊': 'volume-2', '✏': 'pencil', '➤': 'send-horizontal', '▦': 'layout-grid', '✕': 'x', '↻': 'refresh-cw',
  '💬': 'message-circle', '⚖': 'scale', '📐': 'ruler', '🗣': 'languages', '🎨': 'palette', '🤖': 'bot', '🚀': 'rocket', '📷': 'camera', '📊': 'bar-chart-3', '🌅': 'sunrise', '🔒': 'lock', '＋': 'plus', '👁': 'eye', '⭐': 'star', '🌎': 'globe', '🇺🇸': 'flag', '🇧🇷': 'flag'
};
const KEYS = Object.keys(EMO).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const RE = new RegExp(`(${KEYS.join('|')})\\uFE0F?`, 'g');
const SEL = '.cicon,.row > span,.btn,.today-strip a,.dayrow .it,.task .ck,.fab,.chip,.back,.act,.sugs button,.lesson .st,.areasbtn,.steps button,.tabs button,.ev .ic,.notice,.say,.mic,.send,.iconbtn,.eyebrow,h1,h2,h3,.cta-band,.lock,.del,.mstep,.job .links a,.week h4,.asst-h,.atile i,.langsel button,.stat b,.demo-badge,.corr,.score';

function iconize(root) {
  const els = [...(root.matches?.(SEL) ? [root] : []), ...root.querySelectorAll(SEL)];
  els.forEach(el => {
    if (el.closest('.msg,.prose,input,textarea')) return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) { RE.lastIndex = 0; if (RE.test(w.currentNode.nodeValue)) nodes.push(w.currentNode); }
    nodes.forEach(t => {
      const frag = document.createDocumentFragment();
      t.nodeValue.split(RE).forEach(part => {
        if (!part) return;
        const name = EMO[part];
        if (name) { const i = document.createElement('i'); i.setAttribute('data-lucide', name); frag.append(i); }
        else frag.append(part.replace(/\uFE0F/g, ''));
      });
      t.replaceWith(frag);
    });
  });
}

// A biblioteca redesenhava TODOS os ícones a cada chamada (e isso se repetia sem parar, engolindo cliques).
// Agora só desenha os que ainda não viraram ícone.
function iconesLeves() {
  const L = window.lucide; if (!L || L.leve) return;
  const orig = L.createIcons, leve = function (...a) {
    if (!document.querySelector('[data-lucide]:not(svg)')) return;
    document.querySelectorAll('svg[data-lucide]').forEach(s => s.removeAttribute('data-lucide'));
    const r = orig.apply(L, a);
    document.querySelectorAll('svg[data-lucide]').forEach(s => s.removeAttribute('data-lucide'));
    return r;
  };
  try { L.createIcons = leve; } catch { }
  if (L.createIcons !== leve) window.lucide = { ...L, createIcons: leve, leve: true }; else L.leve = true;
}

let io;
function reveal() {
  if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('#app .section, #app .cards > *, #app .grid > *, #app .atiles > *, #app .lessons > *, #app .hero-home, #app .cta-band, #app .jobs > *, #app .week, #app .journey > *, #app .stats > *').forEach(el => {
    if (el.dataset.rv) return; el.dataset.rv = 1;
    const idx = [...el.parentElement.children].indexOf(el);
    el.classList.add('rv'); el.style.transitionDelay = Math.min(idx, 8) * 60 + 'ms';
    io.observe(el);
  });
}

// Só reprocessa o que mudou (antes varria a página inteira a cada mudança, o que deixava os cliques lentos com a tela cheia)
let pending = false; const sujos = new Set();
function run(tudo) {
  pending = false;
  if (tudo) iconize(document.body);
  else {
    const lista = [...sujos]; sujos.clear();
    const alvo = new Set();
    lista.forEach(r => { if (!r.isConnected) return; const c = r.closest?.(SEL); if (c) alvo.add(c); alvo.add(r); });
    alvo.forEach(r => { if (r.isConnected) iconize(r); });
  }
  try { iconesLeves(); window.lucide?.createIcons(); } catch { }
  reveal();
}
export function initFx() {
  const dust = document.createElement('div'); dust.className = 'dust';
  for (let i = 0; i < 22; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.top = 60 + Math.random() * 50 + '%'; p.style.animationDelay = -Math.random() * 18 + 's'; p.style.animationDuration = 14 + Math.random() * 14 + 's'; p.style.transform = `scale(${0.5 + Math.random()})`; dust.append(p); }
  document.body.prepend(dust);
  new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) { const el = n.nodeType === 1 ? n : n.parentElement; if (el) sujos.add(el); }
    if (sujos.size && !pending) { pending = true; requestAnimationFrame(() => run(false)); }
  }).observe(document.body, { childList: true, subtree: true });
  // a biblioteca de ícones carrega sem travar a página; quando chega (ou se já chegou), desenha os ícones
  { const ico = () => { try { iconesLeves(); window.lucide?.createIcons(); } catch { } }; if (window.lucide) ico(); else document.querySelector('script[src*="lucide"]')?.addEventListener('load', ico); }
  run(true);
}
