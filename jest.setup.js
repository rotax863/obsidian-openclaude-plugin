// Global type declarations for Jest so ts-jest doesn't conflict with obsidian module types
global.OpenClaudeSettingTab = class {
  constructor(app, plugin) {}
  display() {}
  hide() {}
  get icon() { return ''; }
};

global.TextComponent = class {
  setPlaceholder() { return this; }
  setValue() { return this; }
  onChange(cb) { return this; }
  get inputEl() { return { style: {} }; }
};

global.SliderComponent = class {
  setLimits() { return this; }
  setValue() { return this; }
  onChange(cb) { return this; }
};