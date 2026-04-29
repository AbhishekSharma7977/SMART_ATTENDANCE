/**
 * SafeRoute — OpenRouter Config (Enterprise Edition)
 * 
 * Fixes:
 *  - API key read lazily (not at module import time)
 *  - HTTP-Referer from env
 *  - Request timeout configured
 */

const axios = require('axios');

const createOpenRouterClient = () => {
    const apiKey = process.env.OPEN_ROUTER_KEY;
    if (!apiKey) {
        throw new Error('OPEN_ROUTER_KEY environment variable is not set');
    }

    return axios.create({
        baseURL: 'https://openrouter.ai/api/v1',
        timeout: 30_000,    // 30 second timeout — prevents hanging requests
        headers: {
            Authorization:  `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://saferoute.app',
            'X-Title':      'SafeRoute AI Assistant',
            'Content-Type': 'application/json',
        },
    });
};

module.exports = { createOpenRouterClient };