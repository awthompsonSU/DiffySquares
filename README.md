# Diffy Squares

An interactive, static math exploration by Andrew Thompson, styled to match Triangle Transformations with its maroon, gold, and Salisbury University footer.

## Use

Open `dist/index.html` in a modern browser, or serve `dist/` with any static web server. No build step, account, server, analytics, or application dependencies are required.

Enter the corners in their labeled positions (A top left, B top right, C bottom right, D bottom left), then select **Create square**. In **Option 1 · Watch the pattern**, use **Next square**, **Play**, **Show all**, the timeline, or a history row to explore the sequence. Gold points preview the next midpoint values. **Focus current square** magnifies the selected square without changing its numbers. The SVG has a text description and the full numbers remain available in the calculation cards and history table. CSV export includes the entire computed sequence in Watch mode. Diagram labels show the numbers without vertex/index prefixes.

**Option 2 · Work it out** asks students to enter all four next absolute differences. Next square (or Enter) checks them with exact arithmetic. Incorrect or missing answers are highlighted and leave the square in place. Future midpoint values and calculation results are hidden; playback and full CSV export are unavailable. The timeline and numerical history revisit only previously earned squares. Switching modes starts again at the original square.

**Your last 10 starting sets** replaces the old example picker. It stores the latest ten distinct successfully created sets in `localStorage` on the current browser, newest first, displaying their original clockwise values and total square count. Reusing an entry moves it to the top; equivalent numeric inputs share an entry. Invalid input and the automatic initial example do not enter history. Stored counts are recomputed on reload. If browser storage is unavailable, history works for the current visit. The random-number button is immediately above Create square.

The bottom investigation card has eight prompts and Previous/Next buttons, with source links. These app-specific prompts draw on Cambridge NRICH's [Number Squares](https://nrich.maths.org/problems/number-squares) and [Differs](https://nrich.maths.org/problems/differs), with extensions about translation, scaling, and parity. They cover changing one corner, working backward, shifting, scaling, short journeys, rearrangements, longer journeys, and odd/even patterns.

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

`tests/controls.cjs` exercises the interface through jsdom when installed (`npm install --no-save jsdom`). It checks controls, validation, timer playback, zero cases, CSV export, SVG labels, recent-history capacity and persistence, practice-mode gating and hidden answers, exact decimal/large answers, storage failures, and investigation navigation. This supplements, but does not replace, visual browser QA.

Deployment serves the existing `dist/` directory directly. For GitHub Pages, deploy `dist/` as the site's artifact or select it in your chosen static hosting service.
