/// <reference types="obsidian" />

// Provide ambient declarations to satisfy the type checker without
// pulling in obsidian's module exports that conflict with our mocks
declare global {
  interface Window {}
}
declare class OpenClaudeSettingTab {
  constructor(app: any, plugin: any);
  display(): void;
  hide(): void;
  get icon(): string;
}
declare class TextComponent {
  setPlaceholder(v: string): TextComponent;
  setValue(v: string): TextComponent;
  onChange(cb: (v: string) => any): TextComponent;
  inputEl: HTMLTextAreaElement;
}
declare class SliderComponent {
  setLimits(min: number, max: number, step: number): SliderComponent;
  setValue(v: number): SliderComponent;
  onChange(cb: (v: number) => any): SliderComponent;
}
declare module './main' {
  interface Window {}
}