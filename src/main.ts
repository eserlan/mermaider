import type { DOMElements, DiagramData, DragState } from './types';
import { initTheme } from './theme';
import { getExportSvg, getPngBlob, download, copyToClipboard } from './export';

(function () {
  const defaultSourcePath = 'demo.mmd';
  const sourceParams = new URLSearchParams(window.location.search);
  const mermaidSourcePath = sourceParams.get('src') || defaultSourcePath;

  const elements: DOMElements = {
    wrap: document.querySelector('.diagram-wrap') as HTMLElement,
    source: document.getElementById('diagramSource') as HTMLElement,
    empty: document.getElementById('emptyState') as HTMLElement,
    path: document.getElementById('sourcePath') as HTMLElement,
    status: document.getElementById('statusText') as HTMLElement,
    toast: document.getElementById('copyToast') as HTMLElement,
    toastMessage: document.getElementById('copyToastMessage') as HTMLElement,
    toastClose: document.getElementById('copyToastClose') as HTMLButtonElement,
    picker: document.getElementById('filePicker') as HTMLInputElement,
    controlsPanel: document.getElementById('mainControls') as HTMLElement,
    controlsToggle: document.getElementById('controlsToggle') as HTMLButtonElement,
    inputPanel: document.getElementById('inputPanel') as HTMLElement,
    input: document.getElementById('mermaidInput') as HTMLTextAreaElement,
    renderInput: document.getElementById('renderInput') as HTMLButtonElement,
    clear: document.getElementById('clearDiagram') as HTMLButtonElement,
    edit: document.getElementById('editDiagram') as HTMLButtonElement,
    png: document.getElementById('savePng') as HTMLButtonElement,
    svg: document.getElementById('saveSvg') as HTMLButtonElement,
    zoomLabel: document.getElementById('zoomLabel') as HTMLElement,
    zoomIn: document.getElementById('zoomIn') as HTMLButtonElement,
    zoomOut: document.getElementById('zoomOut') as HTMLButtonElement,
    zoomReset: document.getElementById('zoomReset') as HTMLButtonElement,
    theme: document.getElementById('themeToggle') as HTMLButtonElement
  };

  let currentData: DiagramData = { name: '', text: '', zoom: 1, baseW: 0, baseH: 0 };
  let drag: DragState = { active: false, x: 0, y: 0, sL: 0, sT: 0 };
  let dragDepth = 0;
  let renderCount = 0;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
  }

  // Initialize theme controls
  if (elements.theme) {
    initTheme(elements.theme);
  }

  function setInputVisible(visible: boolean): void {
    elements.inputPanel.classList.toggle('hidden', !visible);
    if (visible) elements.input.focus();
  }

  function setControlsVisible(visible: boolean): void {
    elements.controlsPanel.classList.toggle('hidden', !visible);
    elements.controlsPanel.classList.toggle('grid', visible);
    elements.controlsToggle.setAttribute('aria-expanded', String(visible));
    elements.controlsToggle.textContent = visible ? 'Hide' : 'Tools';
  }

  function setDiagramControlsEnabled(enabled: boolean): void {
    elements.edit.disabled = !enabled;
    elements.png.disabled = !enabled;
    elements.svg.disabled = !enabled;
    elements.wrap.classList.toggle('has-diagram', enabled);
    elements.empty.classList.toggle('hidden', enabled);
  }

  function setStatus(message: string): void {
    elements.status.textContent = message;
  }

  function hideCopyToast(): void {
    if (toastTimer) clearTimeout(toastTimer);
    const toast = elements.toast as HTMLElement & {
      hidePopover?: () => void;
      matches: (selector: string) => boolean;
    };
    if (typeof toast.hidePopover === 'function' && toast.matches(':popover-open')) {
      toast.hidePopover();
    }
    elements.toast.classList.add('hidden');
  }

  function showCopyToast(message: string): void {
    if (toastTimer) clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');
    const toast = elements.toast as HTMLElement & { showPopover?: () => void };
    if (typeof toast.showPopover === 'function') {
      toast.showPopover();
    }
    toastTimer = setTimeout(hideCopyToast, 3000);
  }

  function setCurrentDiagram(name: string, text: string, baseW = 0, baseH = 0): void {
    currentData = { name, text, zoom: 1, baseW, baseH };
  }

  function updateZoom(): void {
    const svg = elements.source.querySelector('svg');
    if (!svg || !currentData.baseW) {
      elements.zoomLabel.textContent = Math.round(currentData.zoom * 100) + '%';
      return;
    }
    const width = Math.round(currentData.baseW * currentData.zoom);
    const height = Math.round(currentData.baseH * currentData.zoom);
    elements.source.style.width = width + 'px';
    elements.source.style.height = height + 'px';
    svg.style.width = width + 'px';
    svg.style.height = height + 'px';
    elements.zoomLabel.textContent = Math.round(currentData.zoom * 100) + '%';
  }

  function getRenderedSvgSize(svg: SVGSVGElement): { width: number; height: number } {
    const viewBox = svg.viewBox && svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const attrWidth = parseFloat(svg.getAttribute('width') || '0');
    const attrHeight = parseFloat(svg.getAttribute('height') || '0');
    return {
      width: viewBox && viewBox.width ? viewBox.width : rect.width || attrWidth || 0,
      height: viewBox && viewBox.height ? viewBox.height : rect.height || attrHeight || 0
    };
  }

  function zoomBy(delta: number): void {
    if (!currentData.text) return;
    currentData.zoom = Math.min(3, Math.max(0.2, currentData.zoom + delta));
    updateZoom();
  }

  function resetZoom(): void {
    if (!currentData.text) return;
    currentData.zoom = 1;
    updateZoom();
  }

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    return (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable
    );
  }

  function handleZoomKeys(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomBy(0.1);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomBy(-0.1);
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  }

  function clearDiagram(): void {
    setCurrentDiagram('', '');
    elements.source.innerHTML = '';
    elements.source.style.color = '';
    elements.source.style.padding = '';
    elements.source.style.width = '';
    elements.source.style.height = '';
    elements.input.value = '';
    elements.path.textContent = 'Pasted or cleared';
    document.title = 'Mermaid Viewer';
    elements.wrap.scrollLeft = 0;
    elements.wrap.scrollTop = 0;
    setInputVisible(true);
    updateZoom();
    setDiagramControlsEnabled(false);
    setStatus('Paste Mermaid to render');
  }

  function editDiagram(): void {
    if (!currentData.text) return;
    elements.input.value = currentData.text;
    setInputVisible(true);
    setStatus('Editing: ' + currentData.name);
  }

  async function render(text: string, name: string): Promise<void> {
    try {
      setStatus('Rendering...');
      const cleanText = text.trim().replace(/^```mermaid\s*|\s*```$/gi, '');
      if (!cleanText) {
        clearDiagram();
        return;
      }
      const displayName = name.split('/').pop() || 'pasted.mmd';
      elements.input.value = cleanText;
      elements.path.textContent = name;
      document.title = displayName + ' - Mermaid Viewer';

      const { svg } = await window.mermaid.render('d' + (++renderCount), cleanText);
      elements.source.style.color = '';
      elements.source.style.padding = '';
      elements.source.style.width = '';
      elements.source.style.height = '';
      elements.source.innerHTML = svg;

      const svgEl = elements.source.querySelector('svg') as SVGSVGElement | null;
      if (svgEl) {
        const size = getRenderedSvgSize(svgEl);
        setCurrentDiagram(displayName, cleanText, size.width, size.height);
      } else {
        setCurrentDiagram(displayName, cleanText, 0, 0);
      }

      elements.wrap.scrollLeft = 0;
      elements.wrap.scrollTop = 0;
      updateZoom();
      setInputVisible(false);
      setDiagramControlsEnabled(true);
      setStatus('Loaded: ' + currentData.name);
    } catch (e: unknown) {
      const error = e as Error;
      setStatus('Error: ' + error.message);
      setCurrentDiagram('', '');
      elements.source.style.color = '#dc2626';
      elements.source.style.padding = '20px';
      elements.source.style.width = '';
      elements.source.style.height = '';
      elements.source.textContent = error.message;
      if (name === 'pasted.mmd') setInputVisible(true);
      updateZoom();
      setDiagramControlsEnabled(false);
      elements.empty.classList.add('hidden');
    }
  }

  // Zoom bindings
  elements.zoomIn.onclick = () => zoomBy(0.1);
  elements.zoomOut.onclick = () => zoomBy(-0.1);
  elements.zoomReset.onclick = () => resetZoom();
  document.addEventListener('keydown', handleZoomKeys);

  // File loading
  elements.picker.onchange = async e => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      await render(await file.text(), file.name);
    } catch (err: unknown) {
      const error = err as Error;
      setStatus('Error: ' + error.message);
    } finally {
      elements.picker.value = '';
    }
  };

  elements.renderInput.onclick = () =>
    render(elements.input.value, currentData.name || 'pasted.mmd');
  elements.clear.onclick = () => clearDiagram();
  elements.edit.onclick = () => editDiagram();
  elements.toastClose.onclick = () => hideCopyToast();
  elements.controlsToggle.onclick = () =>
    setControlsVisible(elements.controlsPanel.classList.contains('hidden'));

  elements.input.onkeydown = e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      render(elements.input.value, currentData.name || 'pasted.mmd');
    }
  };

  // Drag & Drop
  window.ondragenter = e => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragDepth += 1;
    document.body.classList.add('drag-over');
  };

  window.ondragover = e => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
  };

  window.ondragleave = e => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) document.body.classList.remove('drag-over');
  };

  window.ondrop = async e => {
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    try {
      await render(await file.text(), file.name);
    } catch (err: unknown) {
      const error = err as Error;
      setStatus('Error: ' + error.message);
    }
  };

  // Panning
  elements.wrap.onpointerdown = e => {
    if (e.button !== 0 || !currentData.text) return;
    drag = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      sL: elements.wrap.scrollLeft,
      sT: elements.wrap.scrollTop
    };
    elements.wrap.setPointerCapture(e.pointerId);
  };

  elements.wrap.onpointermove = e => {
    if (!drag.active) return;
    elements.wrap.scrollLeft = drag.sL - (e.clientX - drag.x);
    elements.wrap.scrollTop = drag.sT - (e.clientY - drag.y);
  };

  elements.wrap.onpointerup = () => {
    drag.active = false;
  };

  // Export handling
  elements.svg.onclick = async e => {
    try {
      const svg = await getExportSvg(currentData, renderCount);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      if (e.shiftKey) {
        setStatus('Copying SVG...');
        const message = 'Copied ' + (await copyToClipboard(blob, svg)) + ' to clipboard';
        setStatus(message);
        showCopyToast(message);
      } else {
        download(blob, currentData.name + '.svg');
      }
    } catch (e: unknown) {
      const error = e as Error;
      setStatus('Error: ' + error.message);
    }
  };

  elements.png.onclick = async e => {
    try {
      const svg = await getExportSvg(currentData, renderCount);
      const blob = await getPngBlob(svg);
      if (e.shiftKey) {
        setStatus('Copying PNG...');
        const message = 'Copied ' + (await copyToClipboard(blob)) + ' to clipboard';
        setStatus(message);
        showCopyToast(message);
      } else {
        download(blob, currentData.name + '.png');
      }
    } catch (e: unknown) {
      const error = e as Error;
      setStatus('Error: ' + error.message);
    }
  };

  // Initial load
  setDiagramControlsEnabled(false);
  fetch(mermaidSourcePath)
    .then(r => (r.ok ? r.text() : Promise.reject(new Error('Unable to load ' + mermaidSourcePath))))
    .then(t => render(t, mermaidSourcePath))
    .catch(() => {
      elements.path.textContent = 'Paste Mermaid or open a file';
      setStatus('Press Clear to paste Mermaid');
      updateZoom();
    });
})();
