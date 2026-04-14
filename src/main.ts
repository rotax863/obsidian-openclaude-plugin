import { Plugin, PluginSettingTab, Setting } from 'obsidian';
import { OpenClaudeView, VIEW_TYPE_OPENCLAUDE } from './OpenClaudeView';
import type { OpenClaudePlugin } from './plugin-types';

const DEFAULT_SETTINGS = {
  openclaudeApiKey: '',
  openclaudeApiUrl: 'https://api.openai.com/v1',
  openclaudeModel: 'gpt-4',
  openclaudeTemperature: 0.7,
  openclaudeMaxTokens: 2000,
  permissionMode: 'interactive' as const,
  systemPrompt: 'You are a helpful AI assistant integrated with Obsidian. Help users with their notes and questions.'
};

const asAny = <T>(val: T): any => val;

export default class OpenClaudePlugin extends Plugin implements OpenClaudePlugin {
  // @ts-ignore
  settings?: {
    openclaudeApiKey: string;
    openclaudeApiUrl: string;
    openclaudeModel: string;
    openclaudeTemperature: number;
    openclaudeMaxTokens: number;
    permissionMode: 'interactive' | 'permissionless';
    systemPrompt: string;
  };

  onload() {
    return this.loadSettings().then(() => {
      this.addSettingTab(new OpenClaudeSettingTab(this.app, this));
      this.registerView(VIEW_TYPE_OPENCLAUDE, (leaf) => new OpenClaudeView(leaf, this));
      this.addRibbonIcon('message-square', 'Open Claude', () => this.activateView());
      this.addCommand({ id: 'open-openclaude', name: 'Open Open Claude', callback: () => this.activateView() });
    });
  }

  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_OPENCLAUDE).forEach((leaf) => leaf.detach());
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeaf(false);
    if (!leaf.view.containerEl.querySelector('.openclaude-container')) {
      await leaf.setViewState({ type: VIEW_TYPE_OPENCLAUDE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  validateApiKey(key: string): boolean {
    if (!key) return false;
    return /^sk-[a-zA-Z0-9]{20,}$/.test(key);
  }

  validateApiUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  validateMaxTokens(tokens: number): boolean {
    return Number.isInteger(tokens) && tokens >= 1 && tokens <= 16384;
  }

  validateTemperature(temp: number): boolean {
    return Number.isFinite(temp) && temp >= 0 && temp <= 2;
  }

  createSettingItems?() {
    new Setting(this.containerEl)
      .setName('API Key')
      .setDesc('Your OpenAI API key for authentication')
      .addText((text: TextComponent) => {
        text.setPlaceholder('Enter your API key')
          .setValue(this.settings!.openclaudeApiKey)
          .onChange(async (value: string) => {
            this.settings!.openclaudeApiKey = value;
            await this.saveSettings();
            if (value && !this.validateApiKey(value)) {
              asAny(text.inputEl).style.borderColor = 'var(--color-error)';
            } else {
              asAny(text.inputEl).style.borderColor = '';
            }
          });
      });

    new Setting(this.containerEl)
      .setName('API URL')
      .setDesc('Custom API endpoint (default: OpenAI)')
      .addText((text: TextComponent) => {
        text.setPlaceholder('https://api.openai.com/v1')
          .setValue(this.settings!.openclaudeApiUrl)
          .onChange(async (value: string) => {
            this.settings!.openclaudeApiUrl = value;
            await this.saveSettings();
            asAny(text.inputEl).style.borderColor = this.validateApiUrl(value) ? '' : 'var(--color-error)';
          });
      });

    new Setting(this.containerEl)
      .setName('Model')
      .setDesc('OpenAI model to use for completions')
      .addDropdown((dropdown) => {
        dropdown.addOption('gpt-4', 'GPT-4')
          .addOption('gpt-4-turbo', 'GPT-4 Turbo')
          .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
          .addOption('gpt-3.5-turbo-16k', 'GPT-3.5 Turbo 16K')
          .setValue(this.settings!.openclaudeModel)
          .onChange(async (value: string) => {
            this.settings!.openclaudeModel = value;
            await this.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('Temperature')
      .setDesc('Randomness of responses (0 = deterministic, 2 = very random)')
      .addSlider((slider: SliderComponent) => {
        slider.setLimits(0, 2, 0.1)
          .setValue(this.settings!.openclaudeTemperature)
          .onChange(async (value: number) => {
            this.settings!.openclaudeTemperature = value;
            await this.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('Max Tokens')
      .setDesc('Maximum tokens in response')
      .addSlider((slider: SliderComponent) => {
        slider.setLimits(1, 16384, 1)
          .setValue(this.settings!.openclaudeMaxTokens)
          .onChange(async (value: number) => {
            this.settings!.openclaudeMaxTokens = value;
            await this.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('Permission Mode')
      .setDesc('How the plugin handles tool permissions')
      .addDropdown((dropdown) => {
        dropdown.addOption('interactive', 'Interactive (ask for each action)')
          .addOption('permissionless', 'Permissionless (allow all actions)')
          .setValue(this.settings!.permissionMode)
          .onChange(asAny((value: 'interactive' | 'permissionless') => {
            this.settings!.permissionMode = value;
            return this.saveSettings();
          }));
      });

    new Setting(this.containerEl)
      .setName('System Prompt')
      .setDesc('Custom instructions for the AI assistant')
      .addTextArea((text: TextComponent) => {
        text.setPlaceholder('Enter system prompt')
          .setValue(this.settings!.systemPrompt)
          .onChange(asAny(async (value: string) => {
            this.settings!.systemPrompt = value;
            await this.saveSettings();
          }));
      });
  }

  // Keep module syntax for TypeScript compatibility
}