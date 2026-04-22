// ============================================================
// DIAGRAM RENDERING + INTERACTIONS
// ============================================================

const LS_EDITS = 'larti-edits-v1';
const LS_OPEN  = 'larti-open-v1';
const LS_EDITMODE = 'larti-edit-v1';

// Saved edits are { "scope.key": "text" }
let edits = {};
try { edits = JSON.parse(localStorage.getItem(LS_EDITS) || '{}'); } catch(e){ edits = {}; }

let openScenarios = {};
try { openScenarios = JSON.parse(localStorage.getItem(LS_OPEN) || '{}'); } catch(e){ openScenarios = {}; }

function saveEdits(){ localStorage.setItem(LS_EDITS, JSON.stringify(edits)); }
function saveOpen(){ localStorage.setItem(LS_OPEN, JSON.stringify(openScenarios)); }

function t(scope, key, def){
  const id = `${scope}.${key}`;
  return edits[id] !== undefined ? edits[id] : def;
}
function editable(scope, key, def, tag='span'){
  const id = `${scope}.${key}`;
  const val = edits[id] !== undefined ? edits[id] : def;
  return `<${tag} data-edit data-edit-id="${id}">${escapeHTML(val)}</${tag}>`;
}
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ============================================================
// RENDER PROCESS VIEWS
// ============================================================
function renderProcess(procKey){
  const p = PROCESSES[procKey];
  const root = document.getElementById('v-' + procKey);
  if(!root) return;
  root.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">${procKey.toUpperCase()} · trámite</div>
      <h1>${editable('proc-'+procKey, 'title', p.title, 'span')}</h1>
      <p>${editable('proc-'+procKey, 'subtitle', p.subtitle, 'span')}</p>
      <div class="meta">
        <span><b>${p.def.scenarios.length}</b> escenarios documentados</span>
        <span><b>${p.def.lanes.length}</b> áreas involucradas</span>
        <span>Tocá el <b>(+)</b> para desplegar cada escenario</span>
      </div>
    </div>
    <div class="scenarios" id="scn-list-${procKey}">
      ${p.def.scenarios.map(s => renderScenarioHeader(procKey, s, p.def)).join('')}
    </div>
  `;
  // attach open-state
  p.def.scenarios.forEach(s => {
    const open = openScenarios[`${procKey}.${s.id}`];
    const el = root.querySelector(`[data-scn="${s.id}"]`);
    if(el && open){
      el.classList.add('open');
      renderScenarioBody(procKey, s, p.def);
    }
  });
}

function renderScenarioHeader(procKey, s, procDef){
  const scope = `${procKey}.${s.id}`;
  const tags = (s.badges || []).map(b => `<span class="scn-tag ${b.cls||''}">${b.t}</span>`).join('');
  return `
    <div class="scenario" data-scn="${s.id}" data-proc="${procKey}">
      <div class="scn-header" onclick="toggleScenario('${procKey}','${s.id}')">
        <div class="scn-toggle">+</div>
        <div class="scn-title">
          <div class="idx">Escenario ${s.id.toUpperCase()}</div>
          <div class="t">${editable(scope,'title',s.title)}<small>${editable(scope,'subtitle',s.subtitle)}</small></div>
        </div>
        <div class="scn-tags">${tags}</div>
        <div class="scn-count">${s.nodes.length} pasos</div>
      </div>
      <div class="scn-body"></div>
    </div>
  `;
}

function renderScenarioBody(procKey, s, procDef){
  const body = document.querySelector(`[data-scn="${s.id}"][data-proc="${procKey}"] .scn-body`);
  if(!body) return;
  if(body.dataset.rendered === '1') return;

  const scope = `${procKey}.${s.id}`;

  // Meta bar
  const meta = (s.meta || []).map(m => `
    <div class="m"><div class="l">${m.l}</div><div class="v">${escapeHTML(m.v)}</div></div>
  `).join('');

  // Build swimlane grid
  const lanes = procDef.lanes;
  const laneColW = 200;
  const nRows = Math.max(...s.nodes.map(n => n.row)) + 1;

  const laneHeaders = lanes.map((k,i) => {
    const a = AREAS[k];
    return `<div class="lh" style="background:${a.color};">${a.label}</div>`;
  }).join('');

  // Row structure
  const rows = [];
  for(let r=0; r<nRows; r++){
    const cells = lanes.map((k,i) => {
      const node = s.nodes.find(n => n.row === r && n.lane === k);
      const bgIdx = i % 6;
      const nodeHTML = node ? renderNode(scope, node) : '';
      return `<div class="cell bg-${bgIdx}" data-row="${r}" data-lane="${k}" id="cell-${s.id}-${r}-${k}">${nodeHTML}</div>`;
    }).join('');
    rows.push(`<div class="row" style="grid-template-columns: repeat(${lanes.length}, 1fr);">${cells}</div>`);
  }

  // Position + Estado columns
  const posCells = [];
  const estCells = [];
  for(let r=0; r<nRows; r++){
    const node = s.nodes.find(n => n.row === r);
    if(node && node.type !== 'end'){
      const p = POS[node.pos] || POS.sin;
      posCells.push(`<div class="ch"><span class="pos-pill" style="--pc:${p.color};">${p.label} — ${node.type==='dec'?'decisión':'doc'}</span></div>`);
      estCells.push(`<div class="ch"><span class="est-pill" style="--ec:${estColor(node.est)};">${editable(scope,'est-'+node.id,node.est)}</span></div>`);
    } else if(node && node.type === 'end'){
      posCells.push(`<div class="ch"><span class="pos-pill" style="--pc:#2f8564; color:#fff; background:#2f8564; border-color:#2f8564;">Cierre</span></div>`);
      estCells.push(`<div class="ch"><span class="est-pill" style="--ec:#2f8564; color:#fff; background:#2f8564; border-color:#2f8564;">Proceso cerrado</span></div>`);
    } else {
      posCells.push(`<div class="ch"></div>`);
      estCells.push(`<div class="ch"></div>`);
    }
  }

  body.innerHTML = `
    <div class="scn-meta">${meta}</div>
    <div class="diagram-tools">
      <span class="label">Lectura</span>
      <div class="legend-inline">
        <span>Carriles por <b>área</b></span>
        <span>•</span>
        <span><b>Verde</b>: posición del documento</span>
        <span>•</span>
        <span><b>Celeste</b>: estado del trámite</span>
      </div>
      <div class="spacer"></div>
      <button onclick="collapseScenario('${procKey}','${s.id}')">Contraer ↑</button>
    </div>
    <div class="diagram-wrap">
      <div class="diagram" style="grid-template-columns: 1fr 220px 220px;">
        <div class="lanes">
          <div class="lane-headers" style="grid-template-columns: repeat(${lanes.length}, 1fr);">
            ${laneHeaders}
          </div>
          <div class="grid" id="grid-${s.id}">
            ${rows.join('')}
            <svg class="edges" id="edges-${s.id}" preserveAspectRatio="none"></svg>
          </div>
        </div>
        <div class="col-pos">
          <div class="column-head">Posición</div>
          ${posCells.join('')}
        </div>
        <div class="col-est">
          <div class="column-head">Estado (Algoritmo)</div>
          ${estCells.join('')}
        </div>
      </div>
    </div>
  `;

  body.dataset.rendered = '1';

  // Attach contentEditable if edit mode on
  if(document.body.classList.contains('edit-on')) enableEditables(body);

  // Attach node click
  body.querySelectorAll('.node').forEach(n => {
    n.addEventListener('click', (ev) => {
      if(document.body.classList.contains('edit-on')) return;
      ev.stopPropagation();
      openDetail(n, s, scope);
    });
  });

  // Draw edges after layout
  requestAnimationFrame(() => drawEdges(s));
}

function renderNode(scope, node){
  if(node.type === 'end'){
    return `<div class="node end" data-node="${node.id}">${editable(scope,'n-'+node.id,node.label)}</div>`;
  }
  const area = AREAS[node.lane];
  const color = area ? area.color : '#7FBFAE';
  if(node.type === 'dec'){
    return `<div class="node rombo" style="--nc:${color};" data-node="${node.id}"><div class="inner"><span class="n-idx">${node.idx||''}</span>${editable(scope,'n-'+node.id,node.label)}</div></div>`;
  }
  return `<div class="node" style="--nc:${color};" data-node="${node.id}">
    <span class="n-idx">${node.idx||''}</span>${editable(scope,'n-'+node.id,node.label)}
  </div>`;
}

function estColor(est){
  const e = (est||'').toLowerCase();
  if(e.includes('cerrado') || e.includes('finalizada')) return '#7AB898';
  if(e.includes('anulada') || e.includes('no autor') || e.includes('rechaz')) return '#E3A5A5';
  if(e.includes('pend')) return '#EDC070';
  if(e.includes('autor')) return '#A8C8E3';
  return '#C9CFCF';
}

function drawEdges(s){
  const svg = document.getElementById('edges-' + s.id);
  if(!svg) return;
  const grid = document.getElementById('grid-' + s.id);
  const rect = grid.getBoundingClientRect();
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.innerHTML = `<defs>
    <marker id="arr-${s.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#8F9A9A" />
    </marker>
    <marker id="arr-no-${s.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#C98A8A" />
    </marker>
  </defs>`;

  for(const e of s.edges){
    const a = grid.querySelector(`[data-node="${e.from}"]`);
    const b = grid.querySelector(`[data-node="${e.to}"]`);
    if(!a || !b) continue;
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const ax = ar.left + ar.width/2 - rect.left;
    const ay = ar.bottom - rect.top - 2;
    const bx = br.left + br.width/2 - rect.left;
    const by = br.top - rect.top + 2;

    let d;
    if(Math.abs(ax - bx) < 2){
      d = `M ${ax} ${ay} L ${bx} ${by}`;
    } else {
      const midY = ay + (by - ay) * 0.5;
      d = `M ${ax} ${ay} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${by}`;
    }
    const cls = e.kind === 'no' ? 'no' : '';
    const marker = e.kind === 'no' ? `arr-no-${s.id}` : `arr-${s.id}`;
    svg.insertAdjacentHTML('beforeend',
      `<path d="${d}" class="${cls}" marker-end="url(#${marker})"></path>`);
    if(e.label){
      const lx = (ax + bx) / 2;
      const ly = ay + (by - ay) * 0.5 - 6;
      svg.insertAdjacentHTML('beforeend',
        `<text x="${lx}" y="${ly}" text-anchor="middle">${escapeHTML(e.label)}</text>`);
    }
  }
}

// ============================================================
// SCENARIO TOGGLE
// ============================================================
function toggleScenario(procKey, id){
  const el = document.querySelector(`[data-proc="${procKey}"][data-scn="${id}"]`);
  if(!el) return;
  const isOpen = el.classList.toggle('open');
  openScenarios[`${procKey}.${id}`] = isOpen;
  saveOpen();
  if(isOpen){
    const s = PROCESSES[procKey].def.scenarios.find(x => x.id === id);
    renderScenarioBody(procKey, s, PROCESSES[procKey].def);
  }
}
function collapseScenario(procKey, id){
  const el = document.querySelector(`[data-proc="${procKey}"][data-scn="${id}"]`);
  if(el) el.classList.remove('open');
  openScenarios[`${procKey}.${id}`] = false;
  saveOpen();
}

// ============================================================
// DETAIL POPOVER
// ============================================================
function openDetail(nodeEl, s, scope){
  const nid = nodeEl.dataset.node;
  const node = s.nodes.find(n => n.id === nid);
  if(!node) return;
  const pop = document.getElementById('detail-pop');
  const area = AREAS[node.lane];
  const pos  = POS[node.pos];
  document.getElementById('dp-eye').textContent = `Paso ${node.idx || ''} · ${s.title}`;
  document.getElementById('dp-title').textContent = t(scope,'n-'+node.id,node.label);
  document.getElementById('dp-area').textContent = area ? area.label : '—';
  document.getElementById('dp-type').textContent = node.type === 'dec' ? 'Decisión (autorizar / rechazar)' : node.type === 'end' ? 'Cierre' : 'Documento / registro';
  document.getElementById('dp-pos').textContent = pos ? pos.label : '—';
  document.getElementById('dp-est').textContent = t(scope,'est-'+node.id,node.est || '—');
  document.getElementById('dp-action').textContent = node.action || '—';

  const r = nodeEl.getBoundingClientRect();
  pop.classList.add('open');
  const pr = pop.getBoundingClientRect();
  let left = r.right + 12;
  if(left + pr.width > window.innerWidth - 12) left = r.left - pr.width - 12;
  if(left < 12) left = 12;
  let top = r.top;
  if(top + pr.height > window.innerHeight - 12) top = window.innerHeight - pr.height - 12;
  if(top < 12) top = 12;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}
function closeDetail(){ document.getElementById('detail-pop').classList.remove('open'); }
document.addEventListener('click', (ev) => {
  const pop = document.getElementById('detail-pop');
  if(!pop.classList.contains('open')) return;
  if(ev.target.closest('.detail-pop') || ev.target.closest('.node')) return;
  closeDetail();
});

// ============================================================
// TABS
// ============================================================
function goView(key){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const v = document.getElementById('v-' + key);
  if(v) v.classList.add('active');
  const btn = document.querySelector(`.tab-btn[data-view="${key}"]`);
  if(btn) btn.classList.add('active');
  // redraw edges for any open scenarios
  setTimeout(() => {
    document.querySelectorAll('.scenario.open').forEach(el => {
      const proc = el.dataset.proc; const sid = el.dataset.scn;
      const s = PROCESSES[proc].def.scenarios.find(x => x.id === sid);
      if(s) drawEdges(s);
    });
  }, 30);
}
document.querySelectorAll('.tab-btn').forEach(b => {
  b.addEventListener('click', () => goView(b.dataset.view));
});

// ============================================================
// EDIT MODE
// ============================================================
const PW = 'A123';

document.getElementById('btn-edit').addEventListener('click', () => {
  if(document.body.classList.contains('edit-on')){
    exitEdit();
  } else {
    openPw();
  }
});
function openPw(){
  document.getElementById('pw-mask').classList.add('open');
  document.getElementById('pw-input').value = '';
  document.getElementById('pw-err').textContent = '';
  setTimeout(() => document.getElementById('pw-input').focus(), 50);
}
function closePw(){ document.getElementById('pw-mask').classList.remove('open'); }
function submitPw(){
  const v = document.getElementById('pw-input').value;
  if(v === PW){
    closePw();
    enterEdit();
  } else {
    document.getElementById('pw-err').textContent = 'Contraseña incorrecta.';
  }
}
document.getElementById('pw-input').addEventListener('keydown', (e) => {
  if(e.key === 'Enter') submitPw();
  if(e.key === 'Escape') closePw();
});

function enterEdit(){
  document.body.classList.add('edit-on');
  document.getElementById('edit-indicator').classList.add('on');
  document.getElementById('edit-indicator').textContent = 'Edición';
  document.getElementById('btn-edit').classList.add('on');
  document.getElementById('btn-edit').textContent = 'Salir de edición';
  localStorage.setItem(LS_EDITMODE, '1');
  enableEditables(document);
}
function exitEdit(){
  document.body.classList.remove('edit-on');
  document.getElementById('edit-indicator').classList.remove('on');
  document.getElementById('edit-indicator').textContent = 'Lectura';
  document.getElementById('btn-edit').classList.remove('on');
  document.getElementById('btn-edit').textContent = 'Editar';
  localStorage.setItem(LS_EDITMODE, '0');
  document.querySelectorAll('[data-edit]').forEach(el => {
    el.setAttribute('contenteditable', 'false');
  });
}

function enableEditables(scope){
  const nodes = scope.querySelectorAll('[data-edit]');
  nodes.forEach(el => {
    el.setAttribute('contenteditable', 'true');
    el.addEventListener('blur', onEditBlur);
    el.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); el.blur(); }
      if(e.key === 'Escape'){ el.blur(); }
    });
    // prevent click from propagating (node clicks etc)
    el.addEventListener('click', (e) => { if(document.body.classList.contains('edit-on')) e.stopPropagation(); });
  });
}
function onEditBlur(ev){
  const el = ev.target;
  const id = el.dataset.editId;
  if(!id) return;
  const val = el.innerText.trim();
  edits[id] = val;
  saveEdits();
}

// ============================================================
// INIT
// ============================================================
renderProcess('compra');
renderProcess('venta');
renderProcess('directa');

if(localStorage.getItem(LS_EDITMODE) === '1'){
  enterEdit();
}

// Handle resize to redraw edges
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    document.querySelectorAll('.scenario.open').forEach(el => {
      const proc = el.dataset.proc; const sid = el.dataset.scn;
      const s = PROCESSES[proc].def.scenarios.find(x => x.id === sid);
      if(s) drawEdges(s);
    });
  }, 150);
});
