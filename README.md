# Cyberdog Creative

Cyberdog Creative is a bold-red creative agency site and connected developer-community suite. The application is designed as a **subdomain-ready product system** with a unified account experience, hosted forms, a hosted forum handoff, browser-encrypted message envelopes, social features, support, documentation, and opt-in AI assistance.

## Product Areas

| Area | Production subdomain | Development route | Implementation status |
|---|---|---|---|
| Agency site | `cyberdog.io` | `/` | Implemented |
| Journal | `blog.cyberdog.io` | `/journal` | Implemented; owner content controls included |
| Community | `community.cyberdog.io` | `/community` | Hosted-forum handoff and configuration surface implemented |
| Documentation | `docs.cyberdog.io` | `/docs` | Implemented; owner content controls included |
| Account | `account.cyberdog.io` | `/account` | Implemented |
| Messages | `messages.cyberdog.io` | `/messages` | Browser-encrypted, refresh-based delivery implemented |
| Support | `support.cyberdog.io` | `/support` | Hosted ticket-intake handoff implemented |

## Local Development

```bash
pnpm install
pnpm dev
```

Run the quality checks with:

```bash
pnpm check
pnpm test
```

## Architecture Notes

The project uses React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, and MySQL-compatible storage. Public landing, work, journal, feed, docs, and account data are loaded through a **prefetch gate** before the UI is revealed. The gate will not render the main site until its critical initial fetch completes.

Private messaging uses a browser-created ECDH P-256 device key, HKDF-SHA-256 key derivation, and AES-256-GCM message envelopes. Ciphertext and initialization vectors are stored server-side; message bodies are encrypted before submission. This is a device-bound model: clearing the browser’s local storage removes that device’s private key and prevents it from decrypting older conversations. Private message bodies are intentionally excluded from the AI feature surface.

## External Service Configuration

The repository does **not** contain API keys, user data, `.env` files, or production credentials.

| Service | Current role | Required configuration before production |
|---|---|---|
| Auth0 | Recommended dedicated identity backbone | Create an Auth0 tenant and application, then configure approved callback URLs for each final subdomain plus the production session and issuer secrets. The current platform OAuth is a development fallback until this is completed. |
| Jotform | Contact and help-desk intake | Cyberdog Creative contact and help-desk forms have been created in the connected form workspace. Embed or redirect to those production form URLs after reviewing their notification and privacy settings. |
| Discourse or another hosted forum | Community threads, replies, moderation, and notifications | Provision the forum at `community.cyberdog.io`, configure the provider’s SSO integration with the chosen identity provider, and use the provider dashboard for moderation. |
| Custom domains | Product-area isolation | Add the listed hostnames in the project domain settings and map the routes or provider endpoints accordingly. Ensure HTTPS-only operation and configure CORS, CSP, and provider allowlists for the final exact origins. |

## Important Security Boundaries

The present OAuth fallback is intentionally host-scoped. A production-wide shared login requires the selected dedicated identity provider to be configured for the exact product domains. Do not widen cookies across subdomains casually; use the provider’s secure session and SSO patterns instead.

Subdomains improve product separation but do not automatically secure an application. The final deployment must use HTTPS, exact origin allowlists, strict content-security policy rules, secure provider callback URLs, and least-privilege access to external provider dashboards.

## Content Ownership and Moderation

The owner-only control room is available at `/admin` for journal and documentation creation. The social feed contains server-side authorization procedures for member posting and owner moderation. Hosted community moderation and support intake remain in their specialist provider dashboards, which avoids reimplementing mature operational controls in the application.
