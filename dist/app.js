'use strict';
const $ = id => document.getElementById(id);
const M = DiffyMath;
const fields = ['a','b','c','d'].map(c => $('corner-' + c));
let rows = [], scale = 0, step = 0, complete = true, timer = null;
let practice = false, unlocked = 0;
const RECENT_KEY = 'diffy-squares.recent.v1';
let storageAvailable = true;
let recentRuns = loadRecentRuns();
function runKey(values) { const data = M.parse(values); return data.values.map(n => M.format(n, data.scale)).join(','); }
function loadRecentRuns() {
  try {
    let raw;
    try {raw = localStorage.getItem(RECENT_KEY);} catch {storageAvailable = false; return [];}
    let saved;
    try {saved = JSON.parse(raw || '[]');} catch {return [];}
    if (!Array.isArray(saved)) return [];
    const valid = [], keys = new Set();
    for (const entry of saved.slice(0, 10)) {
      try {
        if (!Array.isArray(entry.values) || entry.values.length !== 4 || !entry.values.every(v => typeof v === 'string' && v.length <= 103)) continue;
        const data = M.parse(entry.values), key = runKey(entry.values);
        if (keys.has(key)) continue;
        const result = M.sequence(data.values);
        valid.push({values: entry.values, squares: result.rows.length, complete: result.complete}); keys.add(key);
      } catch { /* Ignore malformed saved entries. */ }
    }
    return valid;
  } catch { storageAvailable = false; return []; }
}
function renderRecentRuns() {
  const select = $('recent-runs'); select.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = '';
  placeholder.textContent = recentRuns.length ? 'Choose a recent starting set…' : 'No saved starting sets yet';
  select.append(placeholder);
  recentRuns.forEach((entry, i) => {
    const option = document.createElement('option'); option.value = String(i);
    option.textContent = `${entry.values.join(', ')} — ${entry.squares} ${entry.squares === 1 ? 'square' : 'squares'}${entry.complete ? '' : ' (display limit)'}`;
    select.append(option);
  });
  $('recent-help').textContent = `${storageAvailable ? 'Saved on this browser.' : 'Browser storage is unavailable; history lasts for this visit.'} Values are A, B, C, D clockwise. Counts include the starting square.`;
}
function rememberRun() {
  const values = fields.map(field => field.value.trim());
  const key = runKey(values);
  recentRuns = [{values, squares: rows.length, complete}, ...recentRuns.filter(entry => runKey(entry.values) !== key)].slice(0, 10);
  try {localStorage.setItem(RECENT_KEY, JSON.stringify(recentRuns)); storageAvailable = true;} catch {storageAvailable = false;}
  renderRecentRuns();
}
function resetPractice() { $('practice-feedback').hidden = true; }
function practiceInputs() {
  const container = $('practice-inputs'); container.replaceChildren();
  if (!practice || step === rows.length - 1) return;
  rows[step].forEach((n, i) => {
    const card = document.createElement('div'); card.className = 'calculation';
    const label = document.createElement('label'); label.htmlFor = `answer-${i}`;
    label.textContent = `|${f(rows[step][(i + 1) % 4])} − (${f(n)})|`;
    const input = document.createElement('input'); input.id = `answer-${i}`; input.name = `answer-${i}`;
    input.inputMode = 'decimal'; input.autocomplete = 'off'; input.spellcheck = false;
    input.setAttribute('aria-label', `Absolute difference for edge ${i + 1}: ${label.textContent}`);
    input.setAttribute('aria-describedby', 'practice-feedback');
    input.addEventListener('input', () => {input.removeAttribute('aria-invalid');});
    card.append(label, input); container.append(card);
  });
}
function nextStep() {
  pause();
  if (step >= rows.length - 1) return;
  if (practice) {
    const answers = [...$('practice-inputs').querySelectorAll('input')];
    const expected = M.next(rows[step]);
    const invalid = answers.filter((input, i) => {
      let correct = false;
      try {const pair = M.parse([input.value, f(expected[i])], 132); correct = pair.values[0] === pair.values[1];} catch { /* Treat missing or invalid numbers as incorrect. */ }
      if (correct) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      return !correct;
    });
    if (answers.length !== 4 || invalid.length) {
      $('practice-feedback').hidden = false; $('practice-feedback').className = 'practice-feedback error';
      $('practice-feedback').textContent = 'Not quite yet. Check the highlighted differences. Enter all four absolute differences as nonnegative numbers; the square will stay here until all four are correct.';
      invalid[0]?.focus(); return;
    }
    unlocked = Math.max(unlocked, step + 1);
  }
  selectStep(step + 1);
  if (practice) {
    $('practice-feedback').hidden = false; $('practice-feedback').className = 'practice-feedback success';
    $('practice-feedback').textContent = step === rows.length - 1 && complete ? 'All four are correct — you reached four zeros!' : 'All four are correct! Here is your next square.';
    $('answer-0')?.focus();
  }
}
const f = n => M.format(n, scale);
const textNumber = n => f(n).length > 16 ? f(n).slice(0, 12) + '…' : f(n);
function pause() { clearTimeout(timer); timer = null; $('play').textContent = '▶ Play'; }
function create(save = true) {
  pause();
  fields.forEach(field => field.removeAttribute('aria-invalid'));
  try {
    const data = M.parse(fields.map(field => field.value));
    const result = M.sequence(data.values);
    rows = result.rows; scale = data.scale; complete = result.complete; step = 0; unlocked = 0; resetPractice();
    $('input-error').hidden = true;
    $('step-range').max = rows.length - 1;
    if (save) rememberRun();
    render();
  } catch (error) {
    $('input-error').textContent = error.message;
    $('input-error').hidden = false;
    fields.forEach(field => {try {M.parse([field.value]);} catch {field.setAttribute('aria-invalid', 'true');}});
    (fields.find(field => field.getAttribute('aria-invalid')) || fields[0]).focus();
  }
}
function selectStep(value) { pause(); step = Math.max(0, Math.min(practice ? unlocked : rows.length - 1, Number(value))); resetPractice(); render(); }
function schedule() {
  if (practice) return;
  timer = setTimeout(() => {
    step++; render();
    if (step >= rows.length - 1) pause(); else schedule();
  }, Number($('speed').value));
}
function render() {
  buildHistory();
  $('practice-form').hidden = !practice || step === rows.length - 1;
  $('calculation-panel').hidden = practice;
  $('play').hidden = $('finish').hidden = $('speed').parentElement.hidden = practice;
  $('download').disabled = practice;
  $('download').title = practice ? 'Switch to Watch the pattern to download the full sequence.' : '';
  $('step-range').max = practice ? unlocked : rows.length - 1;
  practiceInputs();
  const last = step === rows.length - 1;
  $('step-badge').textContent = step ? `Square ${step + 1}` : 'Starting square';
  $('step-range').value = step;
  $('step-position').textContent = `${step} / ${practice ? unlocked : rows.length - 1}`;
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
  (practice ? rows.slice(0, unlocked + 1) : rows).forEach((row, i) => {
    const tr = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = i === 0 ? '1 · Start' : `${i + 1}${row.every(v => v === 0n) ? ' · Zero' : ''}`;
    button.setAttribute('aria-label', `Display square ${i + 1}`); button.onclick = () => selectStep(i);
    th.append(button); tr.append(th);
    [...row, row.reduce((a,b) => a > b ? a : b)].forEach(n => {const td = document.createElement('td'); td.textContent = f(n); tr.append(td);});
    body.append(tr);
  });
  $('history-note').textContent = practice ? 'Practice mode shows only the starting square and squares you have earned with correct answers. The timeline revisits those squares. Full CSV export is available in Watch the pattern.' : `${rows.length} ${rows.length === 1 ? 'square' : 'squares'} · ${rows.length - 1} steps${complete ? ' to four zeros' : ' (display limit reached)'}. Square 1 is the starting square; each step creates one new square.`;
}
function calculations() {
  const target = $('calculations'); target.replaceChildren();
  if (practice) return;
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
  svg.append(element('title', {id:'svg-title'}, `Diffy square ${step + 1}`), element('desc',{id:'svg-desc'},`Clockwise corner values: ${rows[step].map(f).join(', ')}. ${practice ? 'Gold question marks are the next differences for you to calculate.' : 'Gold points show the absolute differences for the next square.'} See the calculation cards and history for full values.`));
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
  function labelPoint(p, value, color, inside = false) {
    svg.append(element('circle',{cx:p[0],cy:p[1],r:inside?5:6,fill:color,stroke:inside?'#6b4c00':'white','stroke-width':1.5}));
    if(size < 38) return;
    const dx = p[0]-340, dy = p[1]-270, dist = Math.hypot(dx,dy)||1;
    const x = p[0]+dx/dist*(inside?28:30), y = p[1]+dy/dist*(inside?28:30);
    const g = element('g'); const text = element('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',fill:inside?'#725200':'#542015','font-size':size<130?12:17,'font-weight':750,'paint-order':'stroke',stroke:'#fff','stroke-width':5,'stroke-linejoin':'round'},value === null ? '?' : textNumber(value));
    text.append(element('title',{}, value === null ? 'Calculate this midpoint difference' : f(value)));g.append(text); svg.append(g);
  }
  rows[step].forEach((n,i)=>labelPoint(points[i],n,'#782b1b'));
  if ($('midpoints').checked && !rows[step].every(n=>n===0n)) {
    const mids = midpoints(points); svg.append(element('polygon',{points:mids.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#c39108','stroke-width':1.6,'stroke-dasharray':'6 5'}));
    M.next(rows[step]).forEach((n,i)=>labelPoint(mids[i],practice ? null : n,'#fec81e',true));
  }
}
$('corner-form').addEventListener('submit',e=>{e.preventDefault();create();});
$('recent-runs').onchange = e => {
  if (e.target.value === '') return;
  const entry = recentRuns[Number(e.target.value)];
  if (entry) {entry.values.forEach((v,i) => fields[i].value = v); create();}
};
$('random').onclick = () => {fields.forEach(field => field.value = Math.floor(Math.random() * 31)); create();};
fields.forEach(field=>field.addEventListener('input',()=>{$('recent-runs').value='';pause();$('status').textContent='Corner values changed. Select “Create square” to apply them.';}));
$('practice-form').addEventListener('submit', e => {e.preventDefault(); nextStep();});
function changeMode() {
  pause(); practice = $('practice-mode').checked; step = 0; unlocked = 0;
  resetPractice(); render();
}
$('watch-mode').onchange = $('practice-mode').onchange = changeMode;
$('next').onclick=nextStep; $('back').onclick=()=>selectStep(step-1); $('restart').onclick=()=>selectStep(0); $('finish').onclick=()=>selectStep(rows.length-1);
$('step-range').oninput=e=>selectStep(e.target.value);
$('play').onclick=()=>{if(practice)return;if(timer) pause();else {if(step===rows.length-1) {step=0;render();} $('play').textContent='Ⅱ Pause';schedule();}};
$('speed').onchange=()=>{if(timer){clearTimeout(timer);schedule();}};
$('midpoints').onchange=$('zoom').onchange=draw;
$('download').onclick=()=>{
  if (practice) return;
  const csv = 'Square,Corner 1,Corner 2,Corner 3,Corner 4\r\n'+rows.map((row,i)=>[i+1,...row.map(f)].join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url;a.download='diffy-squares.csv'; a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const ideas = [
  {title:'Change just one corner', prompt:'Start with 1, 5, 10, 20. Increase only the first number by 1, then try again. Which first-step differences change? Does the total square count change?', challenge:'Predict before calculating. Test three more changes and explain the affected edges.', source:'Number Squares', url:'https://nrich.maths.org/problems/number-squares'},
  {title:'Work backward from a target', prompt:'Can you choose four starting numbers whose first differences are 3, 3, 3, 3? Find two different starting squares that work.', challenge:'Then try the target 1, 1, 1, 2. Is it possible? Explain your reasoning.', source:'Number Squares', url:'https://nrich.maths.org/problems/number-squares'},
  {title:'Shift every number', prompt:'Compare 1, 5, 10, 20 with 11, 15, 20, 30. What stays the same after the first step? Try adding a negative number to every corner.', challenge:'Use the subtraction rule to explain your observations.', source:'Number Squares', url:'https://nrich.maths.org/problems/number-squares'},
  {title:'Scale the starting square', prompt:'Compare 1, 5, 10, 20 with 2, 10, 20, 40 and 0.1, 0.5, 1, 2. Track both the values and the number of squares.', challenge:'What do you predict for any positive scale factor?', source:'Number Squares', url:'https://nrich.maths.org/problems/number-squares'},
  {title:'Find the shortest journeys', prompt:'Compare four equal numbers, alternating values such as 2, 7, 2, 7, and two matching pairs such as 2, 2, 7, 7.', challenge:'Predict the number of steps for each pattern. Remember to count the starting square separately.', source:'Differs', url:'https://nrich.maths.org/problems/differs'},
  {title:'Same numbers, different order', prompt:'Arrange 1, 5, 10, 20 in different orders. Compare rotating the order, reversing it, and swapping only two corners.', challenge:'Which rearrangements preserve the square count? Use the edge differences to explain.', source:'Differs', url:'https://nrich.maths.org/problems/differs'},
  {title:'Chase a longer journey', prompt:'Choose integers from 0 to 20. Can you beat your previous square count? Use the recent-starting-sets dropdown to compare your attempts.', challenge:'Work systematically, changing one corner at a time. Make a conjecture about patterns that last longer.', source:'Differs', url:'https://nrich.maths.org/problems/differs'},
  {title:'Track odd and even', prompt:'Use integer starting values. Mark each corner odd or even at every step. What can you say about the four differences after four steps?', challenge:'Try several starting patterns, then explain using the parity of a difference.', source:'Differs', url:'https://nrich.maths.org/problems/differs'}
];
let ideaIndex = 0;
function renderIdea() {
  const idea = ideas[ideaIndex];
  $('idea-position').textContent = `Idea ${ideaIndex + 1} of ${ideas.length}`;
  $('idea-title').textContent = idea.title;
  $('idea-prompt').textContent = idea.prompt;
  $('idea-challenge').textContent = idea.challenge;
  const source = $('idea-source'); source.replaceChildren();
  source.append(document.createTextNode('Prompt adapted for this app. Related classroom investigation: '));
  const link = document.createElement('a'); link.href = idea.url; link.textContent = `NRICH · ${idea.source}`;
  source.append(link);
  $('idea-back').disabled = ideaIndex === 0;
  $('idea-next').disabled = ideaIndex === ideas.length - 1;
}
$('idea-back').onclick = () => {if (ideaIndex > 0) {ideaIndex--; renderIdea();}};
$('idea-next').onclick = () => {if (ideaIndex < ideas.length - 1) {ideaIndex++; renderIdea();}};

renderRecentRuns();
renderIdea();
create(false);
