const { Plugin } = require('obsidian');

class OpenClaudePlugin extends Plugin {
    onload() {
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

        this.registerView('openclaude-view', (leaf) => new OpenClaudeView(leaf, this));
    }

    onunload() {
        this.app.workspace.getLeavesOfType('openclaude-view').forEach((leaf) => {
            leaf.detach();
        });
    }

    activateView() {
        let leaf = this.app.workspace.getLeaf(false);
        leaf.setViewState({
            type: 'openclaude-view',
            active: true
        });
        this.app.workspace.revealLeaf(leaf);
    }
}

class OpenClaudeView {
    constructor(leaf, plugin) {
        this.leaf = leaf;
        this.plugin = plugin;
        this.container = leaf.containerEl.children[1];
        this.messages = [];

        this.onOpen();
    }

    onOpen() {
        this.container.empty();
        this.container.addClass('openclaude-container');

        // Messages container
        this.messagesContainer = this.container.createDiv('openclaude-chat-container');

        // Load previous messages
        this.loadMessages();

        // Input container
        this.inputContainer = this.container.createDiv('openclaude-input-container');

        this.inputElement = this.inputContainer.createEl('textarea', {
            cls: 'openclaude-input',
            placeholder: 'Ask Open Claude anything...'
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
    }

    onClose() {
        // Clean up
    }

    async loadMessages() {
        const saved = await this.plugin.loadData();
        if (saved && saved.messages) {
            this.messages = saved.messages;
            this.renderMessages();
        }
    }

    async saveMessages() {
        await this.plugin.saveData({ messages: this.messages });
    }

    renderMessages() {
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

    async sendMessage() {
        const message = this.inputElement.value.trim();
        if (!message) return;

        const settings = this.plugin.settings || {};
        if (!settings.openclaudeApiKey) {
            new Notice('Please configure your OpenAI API key in settings');
            return;
        }

        // Add user message
        this.addMessage('user', message);
        this.inputElement.value = '';
        this.sendButton.disabled = true;

        // Show loading
        const loadingEl = this.messagesContainer.createDiv('openclaude-loading');
        loadingEl.textContent = 'Open Claude is thinking...';

        try {
            const response = await this.getOpenAIResponse(message);
            loadingEl.remove();

            // Add assistant response
            this.addMessage('assistant', response);
            await this.saveMessages();

        } catch (error) {
            loadingEl.remove();
            new Notice(`Error: ${error.message}`);
            this.sendButton.disabled = false;
        }
    }

    addMessage(role, content) {
        this.messages.push({
            role,
            content,
            timestamp: Date.now()
        });
        this.renderMessages();
    }

    async getOpenAIResponse(message) {
        const settings = this.plugin.settings || {};

        const messages = [
            { role: 'system', content: settings.systemPrompt || 'You are a helpful AI assistant.' },
            ...this.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        const response = await fetch(`${settings.openclaudeApiUrl || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.openclaudeApiKey}`
            },
            body: JSON.stringify({
                model: settings.openclaudeModel || 'gpt-4',
                messages: messages,
                temperature: settings.openclaudeTemperature || 0.7,
                max_tokens: settings.openclaudeMaxTokens || 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    getViewType() {
        return 'openclaude-view';
    }

    getDisplayText() {
        return 'Open Claude';
    }
}

module.exports = OpenClaudePlugin;