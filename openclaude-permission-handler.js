/**
 * OpenClaude Permission Handler
 *
 * This handler intercepts API calls and routes them through OpenClaude's
 * permission system, ensuring proper authorization and tool usage.
 */

module.exports = class OpenClaudePermissionHandler {
  constructor(plugin) {
    this.plugin = plugin;
    this.pendingRequests = new Map();
  }

  /**
   * Intercept and handle API requests through OpenClaude
   */
  async handleRequest(request, options) {
    const { method, url, body, headers } = options;

    // Check if this is an OpenAI API call that needs interception
    if (url.includes('openai.com') || url.includes('api.openai.com')) {
      return this.handleOpenAIRequest(request, options);
    }

    // Check if this is a chat completion request
    if (url.includes('/chat/completions') && method === 'POST') {
      return this.handleChatCompletion(request, body, headers);
    }

    // For other requests, pass through
    return this.passThrough(request, options);
  }

  /**
   * Handle OpenAI API requests through OpenClaude
   */
  async handleOpenAIRequest(request, options) {
    const url = options.url;

    // Transform OpenAI API URL to OpenClaude proxy URL
    const openClaudeUrl = this.transformToOpenClaudeUrl(url);

    // Check permissions based on request type
    const requiresPermission = this.requiresPermission(options);

    if (requiresPermission) {
      const permission = await this.requestPermission(options);
      if (!permission.granted) {
        throw new Error('Permission denied for OpenAI API call');
      }
    }

    // Forward request through OpenClaude
    return this.forwardThroughOpenClaude(openClaudeUrl, options);
  }

  /**
   * Handle chat completion requests with proper permission checks
   */
  async handleChatCompletion(request, body, headers) {
    const settings = this.plugin.settings || {};

    // If using OpenClaude API, route directly
    if (settings.openclaudeApiKey && settings.useOpenClaude) {
      return this.routeToOpenClaude(body, headers);
    }

    // Otherwise, check interactive permissions
    if (settings.permissionMode === 'interactive') {
      const permission = await this.requestChatPermission(body);
      if (!permission.granted) {
        throw new Error('Permission denied for chat completion');
      }
    }

    // Route to OpenClaude
    return this.routeToOpenClaude(body, headers);
  }

  /**
   * Transform OpenAI URL to OpenClaude proxy URL
   */
  transformToOpenClaudeUrl(url) {
    // Replace OpenAI endpoint with OpenClaude proxy
    return url
      .replace('https://api.openai.com', 'https://openclaude.ai/proxy')
      .replace('/v1/', '/v1/openclaude/');
  }

  /**
   * Check if request requires permission
   */
  requiresPermission(options) {
    const sensitiveEndpoints = [
      '/completions',
      '/chat/completions',
      '/embeddings',
      '/images/generations'
    ];

    return sensitiveEndpoints.some(endpoint =>
      options.url.includes(endpoint)
    );
  }

  /**
   * Request permission from user
   */
  async requestPermission(request) {
    // Check if permission is cached
    const cacheKey = this.generateCacheKey(request);
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Request interactive permission
    const permission = await this.plugin.requestPermission({
      type: 'api_call',
      details: {
        method: request.method,
        url: request.url,
        timestamp: Date.now()
      }
    });

    // Cache the result
    this.pendingRequests.set(cacheKey, permission);
    setTimeout(() => this.pendingRequests.delete(cacheKey), 300000); // 5 minute cache

    return permission;
  }

  /**
   * Request chat-specific permission
   */
  async requestChatPermission(body) {
    const message = body?.messages?.[body.messages.length - 1]?.content || '';

    return await this.plugin.requestPermission({
      type: 'chat',
      details: {
        messagePreview: message.substring(0, 100),
        timestamp: Date.now()
      }
    });
  }

  /**
   * Route request through OpenClaude
   */
  async routeToOpenClaude(body, headers) {
    const settings = this.plugin.settings || {};

    // Add OpenClaude-specific headers
    const openClaudeHeaders = {
      ...headers,
      'X-OpenClaude-Proxy': 'obsidian',
      'X-OpenClaude-Model': settings.openclaudeModel || 'gpt-4',
      'Authorization': `Bearer ${settings.openclaudeApiKey}`
    };

    // Forward to OpenClaude endpoint
    const response = await fetch('https://openclaude.ai/api/chat/completions', {
      method: 'POST',
      headers: openClaudeHeaders,
      body: JSON.stringify(body)
    });

    return response;
  }

  /**
   * Forward request through OpenClaude proxy
   */
  async forwardThroughOpenClaude(url, options) {
    const settings = this.plugin.settings || {};

    // Transform headers for OpenClaude
    const openClaudeHeaders = new Headers(options.headers);
    openClaudeHeaders.set('X-OpenClaude-Proxy', 'obsidian');
    openClaudeHeaders.set('Authorization', `Bearer ${settings.openclaudeApiKey}`);

    const proxyOptions = {
      ...options,
      headers: openClaudeHeaders,
      url: url.replace('api.openai.com', 'openclaude.ai')
    };

    return fetch(proxyOptions.url, proxyOptions);
  }

  /**
   * Generate cache key for permission requests
   */
  generateCacheKey(request) {
    const body = request.body && typeof request.body === 'object'
      ? JSON.stringify(request.body)
      : request.body || '';
    return `${request.method}:${request.url}:${body}`;
  }

  /**
   * Pass request through without modification
   */
  async passThrough(request, options) {
    return fetch(request, options);
  }
};