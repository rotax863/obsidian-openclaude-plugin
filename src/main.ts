import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { OpenClaudeView, VIEW_TYPE_OPENCLAUDE } from './OpenClaudeView';

interface OpenClaudeSettings {
  openclaudeApiKey: string;
  openclaudeApiUrl: string;
  openclaudeModel: string;
  openclaudeTemperature: number;
  openclaudeMaxTokens: number;
  permissionMode: 'interactive' | 'permissionless';
  systemPrompt: string;
}

const DEFAULT_SETTINGS: OpenClaudeSettings = {
  openclaudeApiKey: '',
  openclaudeApiUrl: 'https://api.openai.com/v1',
  openclaudeModel: 'gpt-4',
  openclaudeTemperature: 0.7,
  openclaudeMaxTokens: 2000,
  permissionMode: 'interactive',
  systemPrompt: 'You are a helpful AI assistant integrated with Obsidian. Help users with their notes and questions.'
}

export default class OpenClaudePlugin extends Plugin {
  settings: OpenClaudeSettings;

  onload() {
    return this.loadSettings().then(() => {
      this.addSettingTab(new OpenClaudeSettingTab(this.app, this));

      this.registerView(
        VIEW_TYPE_OPENCLAUDE,
        (leaf) => new OpenClaudeView(leaf, this)
      );

      this.addRibbonIcon('message-square', 'Open Claude', () => {
        this.activateView();
      });

      this.addCommand({
        id: 'open-openclaude',
        name: 'Open Open Claude',
        callback: () => {
          this.activateView();
        }
      });
    });
  }

  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_OPENCLAUDE).forEach((leaf) => {
      leaf.detach();
    });
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
      await leaf.setViewState({
        type: VIEW_TYPE_OPENCLAUDE,
        active: true
      });
    }

    this.app.workspace.revealLeaf(leaf);
  }
}

class OpenClaudeSettingTab extends PluginSettingTab {
  plugin: OpenClaudePlugin;

  constructor(app: App, plugin: OpenClaudePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl('h2', {text: 'Open Claude Settings'});

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your OpenAI API key for Open Claude')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.openclaudeApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openclaudeApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('API URL')
      .setDesc('Custom API URL (optional)')
      .addText(text => text
        .setPlaceholder('https://api.openai.com/v1')
        .setValue(this.plugin.settings.openclaudeApiUrl)
        .onChange(async (value) => {
          this.plugin.settings.openclaudeApiUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Model')
      .setDesc('OpenAI model to use')
      .addDropdown(dropdown => dropdown
        .addOption('gpt-4', 'GPT-4')
        .addOption('gpt-4-turbo', 'GPT-4 Turbo')
        .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
        .addOption('gpt-3.5-turbo-16k', 'GPT-3.5 Turbo 16K')
        .setValue(this.plugin.settings.openclaudeModel)
        .onChange(async (value) => {
          this.plugin.settings.openclaudeModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('Randomness of responses (0-1)')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.openclaudeTemperature)
        .onChange(async (value) => {
          this.plugin.settings.openclaudeTemperature = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Max Tokens')
      .setDesc('Maximum tokens in response')
      .addSlider(slider => slider
        .setLimits(100, 4000, 100)
        .setValue(this.plugin.settings.openclaudeMaxTokens)
        .onChange(async (value) => {
          this.plugin.settings.openclaudeMaxTokens = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Permission Mode')
      .setDesc('Choose how the plugin handles tool permissions')
      .addDropdown(dropdown => dropdown
        .addOption('interactive', 'Interactive (ask for each action)')
        .addOption('permissionless', 'Permissionless (allow all actions)')
        .setValue(this.plugin.settings.permissionMode)
        .onChange(async (value) => {
          this.plugin.settings.permissionMode = value as 'interactive' | 'permissionless';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('System Prompt')
      .setDesc('Custom system prompt for Open Claude')
      .addTextArea(text => text
        .setPlaceholder('Enter system prompt')
        .setValue(this.plugin.settings.systemPrompt)
        .onChange(async (value) => {
          this.plugin.settings.systemPrompt = value;
          await this.plugin.saveSettings();
        }));
  }
}