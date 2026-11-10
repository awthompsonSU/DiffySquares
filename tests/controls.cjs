const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '../dist');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const dom = new JSDOM(html, {runScripts:'outside-only',url:'https://diffy.test/'});
const w=dom.window, doc=w.document;
let callback=null, downloaded=false;
w.setTimeout=fn=>{callback=fn;return 1;};w.clearTimeout=()=>{callback=null;};
w.URL.createObjectURL=()=>{downloaded=true;return 'blob:csv';};w.URL.revokeObjectURL=()=>{};
w.HTMLAnchorElement.prototype.click=function(){assert.equal(this.download,'diffy-squares.csv');};
w.eval(fs.readFileSync(path.join(root,'math.js'),'utf8'));
w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));
const $=id=>doc.getElementById(id), click=id=>$(id).click();
const cells=()=>[...doc.querySelectorAll('#history tr.selected td')].slice(0,4).map(td=>td.textContent);
function values(a){['a','b','c','d'].forEach((c,i)=>$('corner-'+c).value=a[i]); $('corner-form').dispatchEvent(new w.Event('submit',{cancelable:true}));}
assert.deepEqual(cells(),['1','5','10','20']);
assert($('back').disabled);assert($('restart').disabled);
click('next');assert.deepEqual(cells(),['4','5','10','19']);
assert.equal($('step-badge').textContent,'Square 2');
assert.equal($('svg-title').textContent,'Diffy square 2');
assert.equal(doc.querySelectorAll('.calculation').length,4);
click('back');assert.equal($('step-range').value,'0');
click('finish');assert(cells().every(n=>n==='0'));assert($('next').disabled);assert($('status').textContent.includes('Four zeros!'));
click('restart');assert.deepEqual(cells(),['1','5','10','20']);
$('step-range').value='2';$('step-range').dispatchEvent(new w.Event('input'));assert.equal($('step-badge').textContent,'Square 3');
doc.querySelector('#history button').click();assert.equal($('step-range').value,'0');
click('play');assert.equal($('play').textContent,'Ⅱ Pause');callback();assert.equal($('step-range').value,'1');click('play');assert.equal(callback,null);
values(['0.1','0.5','1','2']);click('next');assert.deepEqual(cells(),['0.4','0.5','1','1.9']);
values(['-3','5','-8','2']);click('next');assert.deepEqual(cells(),['8','13','10','5']);
values(['0','0','0','0']);assert.equal(doc.querySelectorAll('#history tr').length,1);assert($('play').disabled);assert($('status').textContent.includes('0 steps'));
values(['7','7','7','7']);click('next');assert.equal(doc.querySelectorAll('#history tr').length,2);assert(cells().every(n=>n==='0'));
values(['','5','10','20']);assert(!$('input-error').hidden);assert.equal($('corner-a').getAttribute('aria-invalid'),'true');
values(['9007199254740993','9007199254740994','9007199254740995','9007199254740996']);click('next');assert.deepEqual(cells(),['1','1','1','3']);
values(['0','653','1854','4063']);assert.equal(doc.querySelectorAll('#history tr').length,24);
click('finish');$('zoom').checked=true;$('zoom').dispatchEvent(new w.Event('change'));assert($('diagram').querySelectorAll('circle').length>=4);
click('download');assert(downloaded);
click('random');assert.equal($('step-range').value,'0');
assert.equal(doc.querySelectorAll('[aria-current="step"]').length,1);
const ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
// Number labels have no vertex/index prefixes in the SVG.
for (const t of doc.querySelectorAll('#diagram text')) assert(!/^[ABCD1-4]:/.test(t.textContent));
assert.equal($('random').nextElementSibling.textContent.trim(), 'Create square →');
assert.equal($('random').closest('form').id, 'corner-form');
// Latest ten distinct valid starting sets, newest first; invalid entries are not saved.
for(let i=0;i<12;i++)values([String(i), '30','40','50']);
assert.equal($('recent-runs').options.length,11);
let saved=JSON.parse(w.localStorage.getItem('diffy-squares.recent.v1'));
assert.equal(saved.length,10);assert.equal(saved[0].values[0],'11');assert.equal(saved.at(-1).values[0],'2');
const count=saved[0].squares;assert($('recent-runs').options[1].textContent.includes(`${count} squares`));
values(['','1','2','3']);assert.equal(w.localStorage.getItem('diffy-squares.recent.v1'),JSON.stringify(saved));
values(['11.0','30.00','40','50']);assert.equal(JSON.parse(w.localStorage.getItem('diffy-squares.recent.v1')).length,10);
$('recent-runs').value='2';$('recent-runs').dispatchEvent(new w.Event('change'));assert.equal($('corner-a').value,'9');assert.equal($('step-range').value,'0');
// Practice must not expose or skip future answers.
values(['1','5','10','20']);
click('practice-mode');
assert($('practice-mode').checked);assert(!$('practice-form').hidden);assert($('calculation-panel').hidden);
assert.equal($('calculations').childElementCount,0);assert($('play').hidden);assert($('finish').hidden);assert($('download').disabled);
assert.equal(doc.querySelectorAll('#history tr').length,1);assert.equal($('step-range').max,'0');
assert.equal(doc.querySelectorAll('#practice-inputs input').length,4);
assert.equal([...doc.querySelectorAll('#diagram text')].filter(t=>t.firstChild.textContent==='?').length,4);
click('next');assert.equal($('step-range').value,'0');assert(!$('practice-feedback').hidden);
assert.equal(doc.querySelectorAll('#practice-inputs [aria-invalid="true"]').length,4);
function answers(a){a.forEach((n,i)=>$('answer-'+i).value=n);}
answers(['4','5','10','-19']);click('next');assert.equal($('step-range').value,'0');assert.equal($('answer-3').getAttribute('aria-invalid'),'true');
answers(['4.00','05','10','19']);$('practice-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
assert.equal($('step-range').value,'1');assert.equal($('step-range').max,'1');assert.equal(doc.querySelectorAll('#history tr').length,2);
assert($('practice-feedback').textContent.includes('All four are correct'));assert.equal($('answer-0').value,'');
click('finish');assert.equal($('step-range').value,'1');
click('back');assert.equal($('step-range').value,'0');click('next');assert.equal($('step-range').value,'0');
// Switching modes resets student work and restores the watch controls.
click('watch-mode');assert(!$('play').hidden);assert(!$('finish').hidden);assert(!$('download').disabled);assert.equal($('step-range').value,'0');
values(['0.1','0.5','1','2']);click('practice-mode');answers(['0.4','0.50','1.000','1.90']);click('next');assert.equal($('step-range').value,'1');
values(['-3','5','-8','2']);answers(['8','13','10','5']);click('next');assert.equal($('step-range').value,'1');
values(['7','7','7','7']);answers(['0','0.0','-0','00']);click('next');assert($('practice-form').hidden);assert($('next').disabled);assert($('status').textContent.includes('Four zeros'));
values(['0','0','0','0']);assert($('practice-form').hidden);assert($('status').textContent.includes('0 steps'));
// Extreme valid corners may produce more digits than one input; answers still validate exactly.
const huge='9'.repeat(100), double=(BigInt(huge)*2n).toString();
values(['-'+huge,huge,'-'+huge,huge]);answers([double,double,double,double]);click('next');assert.equal($('step-range').value,'1');
// Investigations can be browsed both ways, have sources, and stop at the ends.
assert($('idea-back').disabled);const firstTitle=$('idea-title').textContent;
for(let i=0;i<7;i++)click('idea-next');assert.equal($('idea-position').textContent,'Idea 8 of 8');assert($('idea-next').disabled);
assert($('idea-source').querySelector('a').href.startsWith('https://nrich.maths.org/'));
for(let i=0;i<7;i++)click('idea-back');assert.equal($('idea-title').textContent,firstTitle);assert($('idea-back').disabled);
// Saved history reloads with counts recomputed, and malformed entries cannot break startup.
function reload(savedValue, deny=false){
 const d=new JSDOM(html,{runScripts:'outside-only',url:'https://diffy.test/'}), v=d.window;
 if(savedValue!==undefined)v.localStorage.setItem('diffy-squares.recent.v1',savedValue);
 if(deny)Object.defineProperty(v,'localStorage',{get(){throw new Error('disabled');}});
 v.eval(fs.readFileSync(path.join(root,'math.js'),'utf8'));v.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));return d;
}
const restored=reload(JSON.stringify(saved));assert.equal(restored.window.document.getElementById('recent-runs').options.length,11);
assert.equal(reload('{broken').window.document.getElementById('recent-runs').options.length,1);
assert.equal(reload(JSON.stringify([{values:['<script>','1','2','3'],squares:5}])).window.document.getElementById('recent-runs').options.length,1);
const denied=reload(undefined,true);assert(denied.window.document.getElementById('recent-help').textContent.includes('unavailable'));
console.log('Interface checks passed: playback, validation, exact values, 10-entry history/persistence, practice gating, hidden answers, investigations, and storage fallback.');
