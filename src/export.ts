import mermaid from 'mermaid';
import type { DiagramData } from './types';

export async function getExportSvg(
  currentData: DiagramData,
  renderCount: number
): Promise<string> {
  if (!currentData.text) throw new Error('No diagram to export');

  const { svg } = await mermaid.render(
    'exp' + renderCount,
    currentData.text.replace(/<br\s*\/?>/gi, '\n')
  );

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const el = doc.documentElement;
  el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const viewBoxAttr = el.getAttribute('viewBox');
  const viewBox = viewBoxAttr?.trim().split(/\s+/).map(Number);
  if (viewBox && viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    el.setAttribute('width', String(viewBox[2]));
    el.setAttribute('height', String(viewBox[3]));
  }

  const bg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', 'white');
  el.insertBefore(bg, el.firstChild);

  return new XMLSerializer().serializeToString(el);
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getPngBlob(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        reject(new Error('Could not determine PNG dimensions'));
        return;
      }

      const preferredScale = 4;
      const maxCanvasPixels = 64 * 1024 * 1024;
      const scale = Math.min(
        preferredScale,
        Math.sqrt(maxCanvasPixels / (width * height))
      );
      const cvs = document.createElement('canvas');
      cvs.width = Math.max(1, Math.floor(width * scale));
      cvs.height = Math.max(1, Math.floor(height * scale));

      const ctx = cvs.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context'));
        return;
      }

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      cvs.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Could not create PNG'))),
        'image/png'
      );
    };
    img.onerror = () => reject(new Error('Could not create PNG'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function copyToClipboard(
  blob: Blob,
  fallbackText?: string
): Promise<string> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard image copying is not supported in this browser');
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  } catch (error) {
    if (!fallbackText || !navigator.clipboard.writeText) throw error;
    await navigator.clipboard.writeText(fallbackText);
    return 'SVG markup';
  }
  return blob.type === 'image/png' ? 'PNG image' : 'SVG image';
}
