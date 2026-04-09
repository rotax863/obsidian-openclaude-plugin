import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { OpenClaudePlugin } from './main';

export const VIEW_TYPE_OPENCLAUDE = 'openclaude-view';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class OpenClaudeView extends ItemView {
  plugin: OpenClaudePlugin;
  chatContainer: HTMLElement;
  inputContainer: HTMLElement;
  inputElement: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  messagesContainer: HTMLElement;
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

    // Messages container
    this.messagesContainer = container.createDiv('openclaude-chat-container');

    // Input container
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

    // Load previous messages
    await this.loadMessages();
  }

  async onClose() {
    // Clean up if needed
  }

  private async loadMessages() {
    // Load messages from local storage or plugin data
    const savedMessages = await this.plugin.loadData();
    if (savedMessages && savedMessages.messages) {
      this.messages = savedMessages.messages;
      this.renderMessages();
    }
  }

  private async saveMessages() {
    await this.plugin.saveData({ messages: this.messages });
  }

  private renderMessages() {
    this.messagesContainer.empty();

    this.messages.forEach((message) => {
      const messageEl = this.messagesContainer.createDiv('openclaude-message', {
        cls: message.role
      });

      const content = message.content.replace(/\n/g, '<br>');
      messageEl.innerHTML = content;

      // Add timestamp
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const timestampEl = messageEl.createDiv();
      timestampEl.style.fontSize = '0.8em';
      timestampEl.style.color = 'var(--text-muted)';
      timestampEl.style.marginTop = '4px';
      timestampEl.textContent = timestamp;
    });

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private async sendMessage() {
    const message = this.inputElement.value.trim();
    if (!message) return;

    if (!this.plugin.settings.openclaudeApiKey) {
      new Notice('Please configure your OpenAI API key in settings');
      return;
    }

    // Add user message
    this.addMessage('user', message);
    this.inputElement.value = '';
    this.sendButton.disabled = true;

    // Show loading indicator
    const loadingEl = this.messagesContainer.createDiv('openclaude-loading');
    loadingEl.textContent = 'Open Claude is thinking...';

    try {
      // Get response from Open Claude
      const response = await this.getOpenClaudeResponse(message);

      // Remove loading indicator
      loadingEl.remove();

      // Add assistant response
      this.addMessage('assistant', response);

      // Save messages
      await this.saveMessages();

    } catch (error) {
      loadingEl.remove();
      new Notice(`Error: ${error.message}`);
      this.sendButton.disabled = false;
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.renderMessages();
  }

  private async getOpenClaudeResponse(message: string): Promise<string> {
    const messages = [
      { role: 'system', content: this.plugin.settings.systemPrompt },
      ...this.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${this.plugin.settings.openclaudeApiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.plugin.settings.openclaudeApiKey}`
      },
      body: JSON.stringify({
        model: this.plugin.settings.openclaudeModel,
        messages: messages,
        temperature: this.plugin.settings.openclaudeTemperature,
        max_tokens: this.plugin.settings.openclaudeMaxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}