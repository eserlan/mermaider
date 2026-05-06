import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const defaultSourcePath = 'demo.mmd';
const sourceParams = new URLSearchParams(window.location.search);
const mermaidSourcePath = sourceParams.get('src') || defaultSourcePath;
const diagramWrap = document.querySelector('.diagram-wrap');
const diagramSource = document.getElementById('diagramSource');
const pageTitle = document.getElementById('pageTitle');
const sourcePath = document.getElementById('sourcePath');
const statusText = document.getElementById('statusText');
const filePicker = document.getElementById('filePicker');
const savePngButton = document.getElementById('savePng');
const saveSvgButton = document.getElementById('saveSvg');
const zoomLabel = document.getElementById('zoomLabel');
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');
const zoomResetButton = document.getElementById('zoomReset');
const themeToggle = document.getElementById('themeToggle');

const screenMermaidConfig = {
  startOnLoad: false,
  securityLevel: 'loose',
  flowchart: { useMaxWidth: false, htmlLabels: true }
};
const exportMermaidConfig = {
  startOnLoad: false,
  securityLevel: 'loose',
  flowchart: { useMaxWidth: false, htmlLabels: false }
};

let currentDiagramName = '';
let currentDiagramText = '';
let currentZoom = 1;
let baseWidth = 0;
let baseHeight = 0;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartScrollLeft = 0, dragStartScrollTop = 0;

// Initialize Mermaid
mermaid.initialize(screenMermaidConfig);

// Helper functions
function getFileName(path) {
  return path.split('/').pop().split('\\').pop() || path;
}

async function loadDiagramSource(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load Mermaid source: ${path}`);
  return response.text();
}

function normalizeMermaidSource(sourceText) {
  const trimmed = sourceText.trim();
  const fencedMatch = trimmed.match(/^```(?:mermaid[\w.-]*)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fencedMatch) return fencedMatch[1].trim();
  const embeddedMatch = sourceText.match(/```(?:mermaid[\w.-]*)?\s*\r?\n([\s\S]*?)\r?\n```/i);
  if (embeddedMatch) return embeddedMatch[1].trim();
  return trimmed;
}

function setViewerTitle(displayName) {
  sourcePath.textContent = displayName;
  currentDiagramName = getFileName(displayName);
  pageTitle.textContent = currentDiagramName;
  document.title = `${currentDiagramName} - Mermaid Viewer`;
}

function updateZoomLabel() {
  zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
}

function applyZoom() {
  const svg = diagramSource.querySelector('svg');
  if (!svg || !baseWidth || !baseHeight) return;
  svg.style.width = `${Math.round(baseWidth * currentZoom)}px`;
  svg.style.height = `${Math.round(baseHeight * currentZoom)}px`;
  updateZoomLabel();
}

function setZoom(nextZoom) {
  currentZoom = Math.min(3, Math.max(0.4, nextZoom));
  applyZoom();
}

async function renderMermaidSource(diagramText, displayName) {
  const normalizedDiagramText = normalizeMermaidSource(diagramText);
  if (!normalizedDiagramText) throw new Error(`No Mermaid content found in ${displayName}`);

  currentDiagramText = normalizedDiagramText;
  setViewerTitle(displayName);

  const renderId = `diagram-${Date.now()}`;
  const { svg } = await mermaid.render(renderId, currentDiagramText);
  diagramSource.innerHTML = svg;

  const svgElement = diagramSource.querySelector('svg');
  if (!svgElement) throw new Error('Mermaid did not produce an SVG.');

  const viewBox = svgElement.viewBox && svgElement.viewBox.baseVal;
  baseWidth = viewBox && viewBox.width ? viewBox.width : svgElement.getBoundingClientRect().width;
  baseHeight = viewBox && viewBox.height ? viewBox.height : svgElement.getBoundingClientRect().height;

  currentZoom = 1;
  diagramWrap.scrollLeft = 0;
  diagramWrap.scrollTop = 0;
  applyZoom();
  statusText.textContent = 'Mermaid diagram loaded';
}

// Drag and Drop Logic
function setupDragAndDrop() {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  window.addEventListener('dragenter', () => document.body.classList.add('drag-over'));
  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) document.body.classList.remove('drag-over');
  });
  window.addEventListener('drop', async (e) => {
    document.body.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      statusText.textContent = `Loading ${file.name}...`;
      try {
        await renderMermaidSource(await file.text(), `${file.name} (dropped)`);
      } catch (err) {
        diagramSource.innerHTML = `<pre style="color:#b91c1c; padding:16px;">Error: ${err.message}</pre>`;
        statusText.textContent = 'Load failed';
      }
    }
  });
}

// Theme Logic
function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    themeToggle.textContent = nextTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  });
}

// Event Listeners
zoomInButton.addEventListener('click', () => setZoom(currentZoom + 0.1));
zoomOutButton.addEventListener('click', () => setZoom(currentZoom - 0.1));
zoomResetButton.addEventListener('click', () => setZoom(1));

filePicker.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    statusText.textContent = `Loading ${file.name}...`;
    try {
      await renderMermaidSource(await file.text(), `${file.name} (local)`);
    } catch (err) {
      diagramSource.innerHTML = `<pre style="color:#b91c1c; padding:16px;">Error: ${err.message}</pre>`;
      statusText.textContent = 'Load failed';
    }
  }
});

// Panning Logic
diagramWrap.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragStartScrollLeft = diagramWrap.scrollLeft; dragStartScrollTop = diagramWrap.scrollTop;
  diagramWrap.classList.add('dragging');
  diagramWrap.setPointerCapture(e.pointerId);
});

diagramWrap.addEventListener('pointermove', e => {
  if (!isDragging) return;
  diagramWrap.scrollLeft = dragStartScrollLeft - (e.clientX - dragStartX);
  diagramWrap.scrollTop = dragStartScrollTop - (e.clientY - dragStartY);
});

const stopDragging = (e) => {
  if (!isDragging) return;
  isDragging = false;
  diagramWrap.classList.remove('dragging');
  if (e && diagramWrap.hasPointerCapture(e.pointerId)) diagramWrap.releasePointerCapture(e.pointerId);
};
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => diagramWrap.addEventListener(ev, stopDragging));

// Export Logic (SVG/PNG) - Omitted for brevity in this step, but should be included or refactored.
// I'll add the export logic back in.

async function createExportSvgMarkup() {
  if (!currentDiagramText) throw new Error('No source to export.');
  mermaid.initialize(exportMermaidConfig);
  try {
    const { svg } = await mermaid.render(`export-${Date.now()}`, prepareDiagramTextForExport(currentDiagramText));
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = svgDoc.documentElement;
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const bg = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#ffffff');
    svgEl.insertBefore(bg, svgEl.firstChild);
    return new XMLSerializer().serializeToString(svgEl);
  } finally {
    mermaid.initialize(screenMermaidConfig);
  }
}

function prepareDiagramTextForExport(text) { return text.replace(/<br\s*\/?>/gi, '\n'); }

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

saveSvgButton.addEventListener('click', async () => {
  try {
    const svg = await createExportSvgMarkup();
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${currentDiagramName}.svg`);
  } catch (err) { statusText.textContent = err.message; }
});

savePngButton.addEventListener('click', async () => {
  try {
    const svg = await createExportSvgMarkup();
    const img = new Image();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => downloadBlob(blob, `${currentDiagramName}.png`), 'image/png');
    };
    img.src = svgUrl;
  } catch (err) { statusText.textContent = err.message; }
});

// Initialization
async function init() {
  setupTheme();
  setupDragAndDrop();
  try {
    const text = await loadDiagramSource(mermaidSourcePath);
    await renderMermaidSource(text, mermaidSourcePath);
  } catch (err) {
    diagramSource.innerHTML = `<pre style="color:#b91c1c; padding:16px;">Error: ${err.message}</pre>`;
    statusText.textContent = 'Initial load failed';
  }
}

init();
