# Mermaider

A plain HTML/JS Mermaid viewer styled with Tailwind CSS via the CDN build.

## Project Structure

- `index.html`: Main entry point and UI.
- Tailwind utilities are applied directly in `index.html`.

## Development

Use a local static server so the app can fetch `demo.mmd` correctly:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then open the printed local URL in your browser.

For a quick JavaScript syntax check of the inline app code:

```bash
node -e "const fs=require('fs'),vm=require('vm'); const html=fs.readFileSync('index.html','utf8'); const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]).filter(s=>s.trim()&&!s.includes('window.tailwind')); for (const s of scripts) new vm.Script(s); console.log('inline JavaScript syntax ok');"
```

## Tailwind

This project currently uses the Tailwind CDN script, which is the quickest way to start using Tailwind in a static HTML file.

If you later want a production-style setup with tree-shaken CSS, add a Node build step with `tailwindcss` and move the styles into a dedicated stylesheet.
