# Diffy Squares

An interactive, static math exploration by Andrew Thompson, styled to match Triangle Transformations with its maroon, gold, and Salisbury University footer.

## Use

Open `dist/index.html` in a modern browser, or serve `dist/` with any static web server. No build step, account, server, analytics, or application dependencies are required.

Enter the corners in their labeled positions (A top left, B top right, C bottom right, D bottom left), then select **Create square**. Use **Next square**, **Play**, **Show all**, the timeline, or a history row to explore the sequence. Gold points preview the next midpoint values. **Focus current square** magnifies the selected square without changing its numbers. The SVG has a text description and the full numbers remain available in the calculation cards and history table. CSV export includes the entire computed sequence.

## Mathematics

Each iteration replaces clockwise values `(a,b,c,d)` with `(|b-a|,|c-b|,|d-c|,|a-d|)`. The fourth subtraction closes the square. Midpoints become the next square's ordered vertices.

Inputs accept signed integers and finite decimals in ordinary decimal notation, with at most 100 digits total and 30 decimal places per number. Values are converted to a common decimal scale and computed with JavaScript `BigInt`, avoiding floating-point rounding. Four integer inputs eventually reach zero; multiplying finite decimals by a common power of ten reduces them to that case. Computation has a defensive 2,000-step display limit and reports that limit explicitly if reached. Scientific notation, fractions, and irrational expressions are not accepted.

Square 1 is the original square. A starting zero square therefore has one square and zero steps. All-equal nonzero values take one step and two squares. Geometric shrinkage is independent of the numbers.

## Project files

- `dist/index.html`, `style.css`: accessible responsive interface.
- `dist/math.js`: independently testable exact arithmetic.
- `dist/app.js`: SVG, playback, history, and CSV controls.
- `dist/assets/`: local Salisbury logo from Triangle Transformations.
- `reference/diffySquares.txt`: original numerical code supplied for reference.
- `.openai/hosting.json`: Sites static hosting configuration.

## Checks

Run `node tests/math.cjs`. The suite verifies wraparound, negative values, exact decimals, integers above the safe Number range, invalid inputs, known sequences, convergence, and invariants under translation/scaling.

`tests/controls.cjs` exercises the interface through jsdom when installed (`npm install --no-save jsdom`). It checks controls, validation, examples, timer playback, zero cases, CSV export, and SVG metadata. This supplements, but does not replace, visual browser QA.

Deployment serves the existing `dist/` directory directly. For GitHub Pages, deploy `dist/` as the site's artifact or select it in your chosen static hosting service.
