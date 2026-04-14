import type { Plugin } from 'obsidian';

export interface OpenClaudePlugin {
  settings?: {
    openclaudeApiKey: string;
    openclaudeApiUrl: string;
    openclaudeModel: string;
    openclaudeTemperature: number;
    openclaudeMaxTokens: number;
    permissionMode: 'interactive' | 'permissionless';
    systemPrompt: string;
  };
  validateApiKey(key: string): boolean;
  validateApiUrl(url: string): boolean;
  validateMaxTokens(tokens: number): boolean;
  validateTemperature(temp: number): boolean;
}