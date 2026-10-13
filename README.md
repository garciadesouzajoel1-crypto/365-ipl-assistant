# 365 — STARPOINT WORLD SERIES

English CS2 community onboarding and manual competition workflows for Discord, with an owner-authenticated ChatGPT MCP connector.

See [SETUP.md](SETUP.md) for Railway persistent-volume configuration, permissions, explicit setup approval, command usage, remaining production features and the live acceptance checklist.

## Validation

```sh
npm ci --ignore-scripts
npm run check
npm test
```

The automated tests use mocked Discord resources. They verify deterministic state and permission construction, not the live guild or Railway deployment. New STARPOINT automation is opt-in through `SWS_ENABLED=true` and requires `SWS_DATA_PATH` on durable storage. Setup does not run on startup: the configured owner must inspect `/sws-audit`, run `/sws-setup`, and confirm the preview.

Existing OAuth and private bridge routes are retained. New `inspect_server` MCP tooling provides a read-only role and permission audit. Administrative propose/execute actions still require explicit owner confirmation. Region selection and competition results do not use an AI model.
