export const App = jest.fn();
export const Plugin = jest.fn();
export const ItemView = jest.fn().mockImplementation(() => ({
  onOpen: jest.fn(),
  onClose: jest.fn(),
  getViewType: jest.fn(),
  getDisplayText: jest.fn(),
  containerEl: { children: [], empty: jest.fn(), addClass: jest.fn() },
}));
export const WorkspaceLeaf = jest.fn();
export const Notice = jest.fn();
export class TextComponent {
  setPlaceholder = jest.fn().mockReturnThis();
  setValue = jest.fn().mockReturnThis();
  onChange = jest.fn().mockReturnThis();
  inputEl = { style: {}, cols: 0, rows: 0, textLength: 0, wrap: '' } as any;
}
export class SliderComponent {
  setLimits = jest.fn().mockReturnThis();
  setValue = jest.fn().mockReturnThis();
  onChange = jest.fn().mockReturnThis();
}
export class Setting {
  constructor(app: any, plugin: any) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addSlider = jest.fn().mockReturnThis();
  addTextArea = jest.fn().mockReturnThis();
}
export const View = jest.fn();