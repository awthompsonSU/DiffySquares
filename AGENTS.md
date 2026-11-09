# Diffy Squares

Use plain HTML, CSS, and JavaScript with no required build or runtime packages. Static app files live in `dist/`.

Preserve the clockwise absolute-difference rule, including the last-to-first edge. Compute finite decimals exactly with BigInt at a shared scale. Count the original square as Square 1 and zero iterations as zero steps. Keep input validation and the iteration guard.

Match Triangle Transformations branding: maroon `#782b1b`, gold `#fec81e`, white cards, local Salisbury logo linked to the university, and author credit linked to Andrew Thompson's faculty page.

Keep the diagram, history, calculations, timeline, and playback in sync. Keep labels accessible and full numeric values available outside the SVG. Do not add a backend or collect student information without a request.

Run `node tests/math.cjs` for arithmetic changes. UI checks use `node tests/controls.cjs` with jsdom installed. Browser QA is separate from these DOM checks.
