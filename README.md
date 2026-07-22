# Mermaider

A Mermaid viewer built with TypeScript, Vite, and Tailwind CSS.

## Project Structure

- `index.html`: Main entry point and UI markup.
- `src/`: TypeScript application source code.
  - `src/types.ts`: Interface definitions and window types.
  - `src/theme.ts`: Dark mode state management and persistence.
  - `src/export.ts`: Diagram PNG/SVG export and clipboard copying.
  - `src/main.ts`: Application initialization, events, zoom/pan, and rendering logic.
- `demo.mmd`: Default sample Mermaid diagram.

## Development

Install dependencies:

```bash
bun install
```

Start the Vite development server:

```bash
bun dev
```

Build for production (TypeScript type checking + Vite bundling):

```bash
bun run build
```

Preview the production build locally:

```bash
bun preview
```

## Tailwind

This project uses the Tailwind CDN script configured with dark mode class support.

