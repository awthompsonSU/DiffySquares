'use strict';
const $ = id => document.getElementById(id);
const M = DiffyMath;
const fields = ['a','b','c','d'].map(c => $('corner-' + c));
let rows = [], scale = 0, step = 0, complete = true, timer = null;
const f = n => M.format(n, scale);
const textNumber = n => f(n).length > 16 ? f(n).slice(0, 12) + '…' : f(n);
function pause() { clearTimeout(timer); timer = null; $('play').textContent = '▶ Play'; }
function create() {
  pause();
  fields.forEach(field => field.removeAttribute('aria-invalid'));
  try {
    const data = M.parse(fields.map(field => field.value));
    const result = M.sequence(data.values);
    rows = result.rows; scale = data.scale; complete = result.complete; step = 0;
    $('input-error').hidden = true;
    $('step-range').max = rows.length - 1;
    buildHistory(); render();
  } catch (error) {
    $('input-error').textContent = error.message;
    $('input-error').hidden = false;
    fields.forEach(field => {try {M.parse([field.value]);} catch {field.setAttribute('aria-invalid', 'true');}});
    (fields.find(field => field.getAttribute('aria-invalid')) || fields[0]).focus();
  }
}
function selectStep(value) { pause(); step = Math.max(0, Math.min(rows.length - 1, Number(value))); render(); }
function schedule() {
  timer = setTimeout(() => {
    step++; render();
    if (step >= rows.length - 1) pause(); else schedule();
  }, Number($('speed').value));
}
function render() {
  const last = step === rows.length - 1;
  $('step-badge').textContent = step ? `Square ${step + 1}` : 'Starting square';
  $('step-range').value = step;
  $('step-position').textContent = `${step} / ${rows.length - 1}`;
  $('back').disabled = $('restart').disabled = step === 0;
  $('next').disabled = $('finish').disabled = last;
  $('play').disabled = rows.length === 1;
  $('status').classList.toggle('complete', last && complete);
  $('status').textContent = last && complete ? `Four zeros! ${rows.length} ${rows.length === 1 ? 'square' : 'squares'} in total, including the starting square · ${rows.length - 1} steps.` : last ? 'Stopped at the 2,000-step display limit.' : `Step ${step}: ${step ? 'each new corner came from the edge before it.' : 'your four starting values are ready.'}`;
  document.querySelectorAll('#history tr').forEach((tr, i) => {
    tr.classList.toggle('selected', i === step);
    const button = tr.querySelector('button');
    if (i === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  draw(); calculations();
}
function buildHistory() {
  const body = $('history'); body.replaceChildren();
  rows.forEach((row, i) => {
    const tr = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = i === 0 ? '1 · Start' : `${i + 1}${row.every(v => v === 0n) ? ' · Zero' : ''}`;
    button.setAttribute('aria-label', `Display square ${i + 1}`); button.onclick = () => selectStep(i);
    th.append(button); tr.append(th);
    [...row, row.reduce((a,b) => a > b ? a : b)].forEach(n => {const td = document.createElement('td'); td.textContent = f(n); tr.append(td);});
    body.append(tr);
  });
  $('history-note').textContent = `${rows.length} ${rows.length === 1 ? 'square' : 'squares'} · ${rows.length - 1} steps${complete ? ' to four zeros' : ' (display limit reached)'}. Square 1 is the starting square; each step creates one new square.`;
}
function calculations() {
  const target = $('calculations'); target.replaceChildren();
  const row = rows[step];
  const labels = step === 0 ? ['A → B','B → C','C → D','D → A'] : ['1 → 2','2 → 3','3 → 4','4 → 1'];
  $('calc-title').textContent = row.every(n => n === 0n) ? 'Every difference is zero' : 'The next four midpoints';
  row.forEach((n, i) => {
    const card = document.createElement('div'); card.className = 'calculation';
    const small = document.createElement('span'); small.textContent = labels[i];
    const equation = document.createElement('div'); equation.className = 'equation'; equation.textContent = `|${f(row[(i + 1) % 4])} − (${f(n)})|`;
    const result = document.createElement('strong'); result.textContent = '= ' + f(M.abs(row[(i + 1) % 4] - n));
    card.append(small, equation, result); target.append(card);
  });
}
const NS = 'http://www.w3.org/2000/svg';
function element(tag, attrs = {}, content) {const e = document.createElementNS(NS, tag); for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); if (content !== undefined) e.textContent = content; return e;}
function midpoints(points) {return points.map((p,i) => [(p[0]+points[(i+1)%4][0])/2, (p[1]+points[(i+1)%4][1])/2]);}
function draw() {
  const svg = $('diagram'); svg.replaceChildren();
  svg.append(element('title', {id:'svg-title'}, `Diffy square ${step + 1}`), element('desc',{id:'svg-desc'},`Clockwise corner values: ${rows[step].map(f).join(', ')}. Gold points show the absolute differences for the next square. See the calculation cards and history for full values.`));
  const defs = element('defs'); const pattern = element('pattern', {id:'grid',width:24,height:24,patternUnits:'userSpaceOnUse'}); pattern.append(element('circle',{cx:1,cy:1,r:0.8,fill:'#dce0e4'})); defs.append(pattern); svg.append(defs, element('rect',{width:680,height:540,fill:'url(#grid)'}));
  // Regenerate from a normalized square at the visible level to avoid precision loss
  // after many midpoint iterations. Each level rotates 45 degrees and scales by √½.
  const focus = $('zoom').checked;
  const base = focus ? step : 0;
  const angle = base * Math.PI / 4;
  let points = Array.from({length:4},(_,i) => {const a = -3*Math.PI/4 + i*Math.PI/2 + angle; return [340+Math.cos(a)*220,270+Math.sin(a)*220];});
  const geometries = [points];
  const levels = focus ? 0 : Math.min(step, 48);
  for (let i=0;i<levels;i++) geometries.push(midpoints(geometries.at(-1)));
  if (!focus) geometries.forEach((p,i) => {if(i<step) svg.append(element('polygon',{points:p.map(v=>v.join(',')).join(' '),fill:'none',stroke:i===0?'#9a9da4':'#c6b5af','stroke-width':i===0?1.8:1.2}));});
  points = geometries.at(-1);
  if (!focus && step > 6) {
    const note = element('text',{x:340,y:34,'text-anchor':'middle',fill:'#6d5145','font-size':13},'Small squares? Turn on “Focus current square” to inspect this step.'); svg.append(note);
  }
  svg.append(element('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:'#782b1b', 'fill-opacity':0.035, stroke:'#782b1b','stroke-width':3}));
  const size = Math.hypot(points[0][0]-points[1][0], points[0][1]-points[1][1]);
  function labelPoint(p, value, label, color, inside = false) {
    svg.append(element('circle',{cx:p[0],cy:p[1],r:inside?5:6,fill:color,stroke:inside?'#6b4c00':'white','stroke-width':1.5}));
    if(size < 38) return;
    const dx = p[0]-340, dy = p[1]-270, dist = Math.hypot(dx,dy)||1;
    const x = p[0]+dx/dist*(inside?28:30), y = p[1]+dy/dist*(inside?28:30);
    const g = element('g'); const text = element('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',fill:inside?'#725200':'#542015','font-size':size<130?12:17,'font-weight':750,'paint-order':'stroke',stroke:'#fff','stroke-width':5,'stroke-linejoin':'round'},`${label}: ${textNumber(value)}`);
    text.append(element('title',{}, `${label}: ${f(value)}`));g.append(text); svg.append(g);
  }
  rows[step].forEach((n,i)=>labelPoint(points[i],n,step===0?'ABCD'[i]:String(i+1),'#782b1b'));
  if ($('midpoints').checked && !rows[step].every(n=>n===0n)) {
    const mids = midpoints(points); svg.append(element('polygon',{points:mids.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#c39108','stroke-width':1.6,'stroke-dasharray':'6 5'}));
    M.next(rows[step]).forEach((n,i)=>labelPoint(mids[i],n,String(i+1),'#fec81e',true));
  }
}
$('corner-form').addEventListener('submit',e=>{e.preventDefault();create();});
$('example').onchange = e => {if(e.target.value) {e.target.value.split(',').forEach((v,i)=>fields[i].value=v); create();}};
$('random').onclick = () => {fields.forEach(field=>field.value=Math.floor(Math.random()*31)); $('example').value=''; create();};
fields.forEach(field=>field.addEventListener('input',()=>{$('example').value='';pause();$('status').textContent='Corner values changed. Select “Create square” to apply them.';}));
$('next').onclick=()=>selectStep(step+1); $('back').onclick=()=>selectStep(step-1); $('restart').onclick=()=>selectStep(0); $('finish').onclick=()=>selectStep(rows.length-1);
$('step-range').oninput=e=>selectStep(e.target.value);
$('play').onclick=()=>{if(timer) pause();else {if(step===rows.length-1) {step=0;render();} $('play').textContent='Ⅱ Pause';schedule();}};
$('speed').onchange=()=>{if(timer){clearTimeout(timer);schedule();}};
$('midpoints').onchange=$('zoom').onchange=draw;
$('download').onclick=()=>{
  const csv = 'Square,Corner 1,Corner 2,Corner 3,Corner 4\r\n'+rows.map((row,i)=>[i+1,...row.map(f)].join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url;a.download='diffy-squares.csv'; a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
create();
