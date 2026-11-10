/* Exact fixed-point decimal arithmetic. No binary floating-point rounding. */
(function(root) {
  'use strict';
  function parse(values, maxDigits = 100) {
    const parts = values.map(value => {
      const text = String(value).trim();
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) throw new Error('Enter a number at every corner, using ordinary decimal notation (for example −3 or 0.25).');
      const clean = text.replace(/^[+-]/, '');
      const [whole, fraction = ''] = clean.split('.');
      if (whole.length + fraction.length > maxDigits || fraction.length > 30) throw new Error(`Use at most ${maxDigits} digits per number and at most 30 decimal places.`);
      return { negative: text[0] === '-', whole: whole || '0', fraction };
    });
    const scale = Math.max(...parts.map(p => p.fraction.length));
    return {scale, values: parts.map(p => BigInt(p.whole + p.fraction.padEnd(scale, '0')) * (p.negative ? -1n : 1n))};
  }
  const abs = n => n < 0n ? -n : n;
  const next = values => values.map((v, i) => abs(values[(i + 1) % 4] - v));
  function sequence(initial, limit = 2000) {
    const rows = [initial.slice()];
    while (!rows.at(-1).every(v => v === 0n) && rows.length <= limit) rows.push(next(rows.at(-1)));
    return {rows, complete: rows.at(-1).every(v => v === 0n)};
  }
  function format(n, scale) {
    const negative = n < 0n;
    let s = abs(n).toString().padStart(scale + 1, '0');
    if (scale) s = (s.slice(0, -scale) + '.' + s.slice(-scale)).replace(/\.?0+$/, '');
    return (negative ? '-' : '') + s;
  }
  const api = {parse, abs, next, sequence, format};
  if (typeof module !== 'undefined') module.exports = api;
  root.DiffyMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
