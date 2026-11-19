// Splits the single-file page into extension/newtab.html, newtab.css, newtab.js.
// Run from the workspace root: node tools/extract.mjs
// NOTE: this scaffolds the first pass only. Re-running it overwrites the MV3 edits
// (chrome.search, go(), favicon changes) in newtab.js, so it refuses unless --force.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'newTabByClaude.html'), 'utf8');
const out = (...p) => path.join(root, 'extension', ...p);

if (!process.argv.includes('--force') && fs.existsSync(out('newtab.js'))) {
  console.error('extension/newtab.js already exists — refusing to overwrite the MV3 edits. Use --force to rebuild from scratch.');
  process.exit(1);
}

const styleStart = src.indexOf('<style>');
const styleEnd = src.indexOf('</style>');
const scriptOpen = src.lastIndexOf('<script>');
const scriptClose = src.lastIndexOf('</script>');
const bodyOpen = src.indexOf('<body');
const bodyTagEnd = src.indexOf('>', bodyOpen) + 1;

if ([styleStart, styleEnd, scriptOpen, scriptClose, bodyOpen].some((i) => i < 0)) throw new Error('struct');
if (!(styleStart < styleEnd && styleEnd < bodyOpen && bodyTagEnd < scriptOpen && scriptOpen < scriptClose)) throw new Error('order');

let css = src.slice(styleStart + '<style>'.length, styleEnd);
const bodyOpenTag = src.slice(bodyOpen, bodyTagEnd);
const bodyInner = src.slice(bodyTagEnd, scriptOpen);
let js = src.slice(scriptOpen + '<script>'.length, scriptClose);

// --- font: decode the data URI (already written to fonts/Virgil.woff2) and repoint @font-face ---
const fontMatch = css.match(/src:\s*url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)\s*format\("woff2"\);/);
if (!fontMatch) throw new Error('font data URI not found in CSS');
fs.writeFileSync(out('fonts', 'Virgil.woff2'), Buffer.from(fontMatch[1], 'base64'));
css = css.replace(fontMatch[0], 'src: url("fonts/Virgil.woff2") format("woff2");');
css = css.replace(/  \/\* Virgil – the handwriting font[\s\S]*?Embedded so it works offline\. \*\//,
  '  /* Virgil by Ellinor Rapp, SIL Open Font License 1.1 (see fonts/OFL.txt). */');

// --- html: link the stylesheet in <head>, load the script at the end of <body> ---
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New Tab</title>
<link rel="stylesheet" href="newtab.css">
</head>
${bodyOpenTag}${bodyInner}<script src="newtab.js"></script>
</body>
</html>
`;

fs.mkdirSync(out('fonts'), { recursive: true });
fs.writeFileSync(out('newtab.html'), html);
fs.writeFileSync(out('newtab.css'), css.trim() + '\n');
fs.writeFileSync(out('newtab.js'), js.replace(/^\n/, '') + '\n');

console.log('wrote newtab.html, newtab.css, newtab.js, fonts/Virgil.woff2');
console.log('html bytes', fs.statSync(out('newtab.html')).size, 'css bytes', fs.statSync(out('newtab.css')).size, 'js bytes', fs.statSync(out('newtab.js')).size);
