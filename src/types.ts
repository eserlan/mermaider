declare global {
  interface Window {
    mermaid: {
      initialize: (config: Record<string, unknown>) => void;
      render: (id: string, text: string) => Promise<{ svg: string }>;
    };
  }
}

export interface DiagramData {
  name: string;
  text: string;
  zoom: number;
  baseW: number;
  baseH: number;
}

export interface DragState {
  active: boolean;
  x: number;
  y: number;
  sL: number;
  sT: number;
}

export interface DOMElements {
  wrap: HTMLElement;
  source: HTMLElement;
  empty: HTMLElement;
  path: HTMLElement;
  status: HTMLElement;
  toast: HTMLElement;
  toastMessage: HTMLElement;
  toastClose: HTMLButtonElement;
  picker: HTMLInputElement;
  controlsPanel: HTMLElement;
  controlsToggle: HTMLButtonElement;
  inputPanel: HTMLElement;
  input: HTMLTextAreaElement;
  renderInput: HTMLButtonElement;
  clear: HTMLButtonElement;
  edit: HTMLButtonElement;
  png: HTMLButtonElement;
  svg: HTMLButtonElement;
  zoomLabel: HTMLElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
  zoomReset: HTMLButtonElement;
  theme: HTMLButtonElement;
}
