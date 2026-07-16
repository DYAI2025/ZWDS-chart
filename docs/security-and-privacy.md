# Security and Privacy

Secrets, upstream URLs and authentication values are server-only. Logs redact keys matching date, time, place, location, name, key, secret, token or body. Errors contain no upstream body or stack trace.

Helmet, a 64 kB JSON limit, route-specific rate limits, request IDs, an optional strict origin allowlist and Fetch-Metadata cross-site write rejection are enabled. Cookie authentication is not used; if introduced, CSRF tokens remain required.

Intake requires location confirmation and privacy consent. LLM operation is rejected by environment validation while corpus status is `SOURCE_NEEDED`. PDF report data uses random 192-bit in-memory tokens with 30-minute expiry and `no-store` responses.