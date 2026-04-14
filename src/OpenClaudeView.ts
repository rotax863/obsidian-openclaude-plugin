import { ItemView, WorkspaceLeaf, Notice, TextComponent, DropdownComponent, SliderComponent, Setting } from 'obsidian';
import type { OpenClaudePlugin } from './plugin-types';

export const VIEW_TYPE_OPENCLAUDE = 'openclaude-view';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ApiError {
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string | null;
  };
}

export class OpenClaudeView extends ItemView {
  plugin: OpenClaudePlugin;
  chatContainer!: HTMLElement;
  inputContainer!: HTMLElement;
  inputElement!: HTMLTextAreaElement;
  sendButton!: HTMLButtonElement;
  messagesContainer!: HTMLElement;
  messages: ChatMessage[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: OpenClaudePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_OPENCLAUDE;
  }

  getDisplayText() {
    return 'Open Claude';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('openclaude-container');

    this.messagesContainer = container.createDiv('openclaude-chat-container');
    this.inputContainer = container.createDiv('openclaude-input-container');

    this.inputElement = this.inputContainer.createEl('textarea', {
      cls: 'openclaude-input',
      placeholder: 'Ask Open Claude anything about your notes...'
    });
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendButton = this.inputContainer.createEl('button', {
      cls: 'openclaude-send-button',
      text: 'Send'
    });
    this.sendButton.addEventListener('click', () => this.sendMessage());

    await this.loadMessages();
    this.createSettingItems();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  private async loadMessages() {
    const savedMessages = await this.plugin.loadData();
    if (savedMessages && savedMessages.messages) {
      this.messages = savedMessages.messages;
      this.renderMessages();
    }
  }

  private