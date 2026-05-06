# Mermaider

A plain HTML/JS Mermaid viewer styled with Tailwind CSS via the CDN build.

## Project Structure

- `index.html`: Main entry point and UI.
- Tailwind utilities are applied directly in `index.html`.

## Development

Since this is a plain HTML/JS project, you can open `index.html` directly in any modern web browser.

For a better development experience, you can use a local static server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```

## Tailwind

This project currently uses the Tailwind CDN script, which is the quickest way to start using Tailwind in a static HTML file.

If you later want a production-style setup with tree-shaken CSS, add a Node build step with `tailwindcss` and move the styles into a dedicated stylesheet.
