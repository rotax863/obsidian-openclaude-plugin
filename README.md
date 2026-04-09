# Open Claude Plugin for Obsidian

A modified version of the obsidian-claude-code-plugin that integrates Open Claude (OpenAI's API) with Obsidian.

## Features

- Chat interface with Open Claude directly in Obsidian
- Conversation history persistence
- Customizable system prompts
- Configurable AI parameters (temperature, max tokens, model)
- Permission modes for tool usage
- Clean, native Obsidian UI

## Installation

1. Download the latest release or build from source
2. Copy the `obsidian-openclaude-plugin` folder to your Obsidian vault's `.obsidian/plugins` directory
3. Enable the plugin in Obsidian settings

## Setup

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com/)
2. Go to Settings > Community Plugins > Open Claude Plugin
3. Enter your API key
4. Configure other settings as desired

## Usage

- Click the Open Claude icon in the left ribbon to open the chat panel
- Type your message and press Enter or click Send
- Your conversation history is automatically saved
- Use the command palette (`Cmd/Ctrl+P`) to run "Open Open Claude"

## Configuration Options

- **API Key**: Your OpenAI API key
- **API URL**: Custom API endpoint (defaults to OpenAI)
- **Model**: Choose which OpenAI model to use
- **Temperature**: Controls randomness (0-1)
- **Max Tokens**: Maximum response length
- **Permission Mode**: Choose how tool permissions are handled
- **System Prompt**: Custom instructions for Open Claude

## Building from Source

```bash
npm install
npm run build
```

## Differences from Original

This plugin is modified from the original obsidian-claude-code-plugin to:
- Use OpenAI's API instead of Claude Code CLI
- Provide a simpler chat interface focused on conversation
- Remove complex tool execution features
- Add message history persistence
- Support different OpenAI models

## License

MIT License - see LICENSE file for details.