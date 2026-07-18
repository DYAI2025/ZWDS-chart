// ── Anthropic LLM client (REQ-015) ─────────────────────────────────────────────
// Constructed ONLY when the LLM is enabled (which requires a validated, hash-pinned
// reviewed corpus — see the env gate in server/index.mjs). The API key is read from config
// and NEVER logged. Kept intentionally thin: no retry framework, no streaming.

export function createLlmClient(config) {
  if (!config.LLM_ENABLED) return null;

  return {
    async complete(system, user) {
      // Lazy import so the SDK is only loaded when the LLM is actually enabled.
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: config.LLM_API_KEY });
      const message = await client.messages.create(
        {
          model: config.LLM_MODEL,
          max_tokens: 1500,
          system,
          messages: [{ role: 'user', content: user }],
        },
        { timeout: config.LLM_TIMEOUT_MS },
      );
      return message.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
    },
  };
}
