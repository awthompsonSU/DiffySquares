const assert = require('node:assert/strict');
const M = require('../dist/math.js');
const run = input => {const p=M.parse(input);return {scale:p.scale,...M.sequence(p.values)};};
assert.deepEqual(M.next([1n,5n,10n,20n]),[4n,5n,10n,19n]);
assert.deepEqual(M.next([-3n,5n,-8n,2n]),[8n,13n,10n,5n]);
assert.equal(run(['0','0','0','0']).rows.length,1);
assert.equal(run(['7','7','7','7']).rows.length,2);
assert.equal(run(['0','653','1854','4063']).rows.length,24);
const decimal=run(['0.1','0.5','1','2']);
assert.deepEqual(decimal.rows[1].map(n=>M.format(n,decimal.scale)),['0.4','0.5','1','1.9']);
assert.equal(M.format(0n,30),'0');
assert.equal(M.format(-12340n,3),'-12.34');
assert.equal(M.format(10000n,3),'10');
assert.equal(run(['9007199254740993','9007199254740994','9007199254740995','9007199254740996']).rows[1][0],1n);
for(const invalid of ['', 'NaN','Infinity','1e5','1,000','--1','<script>','0.'+'1'.repeat(31)])assert.throws(()=>M.parse([invalid]));
for(let i=0;i<250;i++) {
 const a=Array.from({length:4},()=>BigInt(Math.floor(Math.random()*20000)-10000));
 const seq=M.sequence(a);assert(seq.complete); assert(seq.rows.at(-1).every(n=>n===0n));
 // Adding a constant to each corner must leave the first differences unchanged.
 assert.deepEqual(M.next(a),M.next(a.map(n=>n+19n)));
 assert.deepEqual(M.next(a).map(n=>n*3n),M.next(a.map(n=>n*3n)));
}
console.log('Math checks passed (exact decimals, wraparound, negatives, large values, and 250 convergence cases).');
