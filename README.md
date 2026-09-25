# Light Weight Cookie Consent

A self-hosted consent widget with English/French preferences, explicit tracker adapters,
server-confirmed choices, an append-only consent event ledger and a protected admin viewer.

**Version 2.0.0 — breaking configuration/schema upgrade.** The previous release's
unqualified compliance claims are withdrawn. This is a technical component that supports
configured consent workflows; it does not certify GDPR, Quebec, California or worldwide
compliance. Review the actual website, applicable rules and vendor integrations before release.

Original author: **Adrian Speyer** — [repository](https://github.com/adrianspeyer/Light-Weight-Cookie-Consent).
This upgrade modifies the original implementation; [LICENSE.md](LICENSE.md) remains in force.

## What it does

- Equal first-level Accept, Reject and preference controls; analytics and marketing
  are separate, optional categories. A persistent control reopens preferences.
- The browser gets state from a same-origin server, without reading HttpOnly cookies.
- A valid saved choice applies on subsequent loads. Revision changes and expiry require
  a new decision; a failed save never activates optional trackers or claims success.
- Changes are separate database events associated with a random browser receipt identifier,
  not an IP address. The new event ledger stores no raw IP address or user-agent string.
- Global Privacy Control disables the configured marketing category. This conservative
  behaviour is not a complete implementation of every jurisdiction's opt-out obligations.
- English and French, explicit language choice and extensible loaded translations.
- No optional trackers configured by default. Only explicitly integrated adapters are controlled.

## Requirements

PHP 8.2+ with PDO MySQL and sessions, MySQL 5.7+ (8+ recommended), HTTPS, and environment configuration.
JavaScript has no runtime dependencies or build step. One installation supports **one origin**.
This is not a cross-origin hosted CMP or a multi-tenant SaaS.

No third-party script is loaded merely by installing the widget. Services already embedded
elsewhere, tag managers, iframes and server-side tracking must be integrated separately.

## Install

1. Back up an existing installation and database. Read the migration section below.
2. Import `lwca/database_setup.sql` into a dedicated database. It creates new tables and
   does not drop the historical `cookie_consent` table. Use appropriate restricted DB privileges.
3. Set environment variables on the PHP host. `config.example.php` documents them and is
   **not** automatically loaded. Do not put secrets into JavaScript or tracked PHP files.

| Variable | Meaning |
|---|---|
| `CC_ORIGIN` | Exact HTTPS website origin, e.g. `https://www.example.com`, without a path |
| `CC_DB_DSN` | PDO MySQL DSN with `charset=utf8mb4` |
| `CC_DB_USER`, `CC_DB_PASSWORD` | Dedicated database credentials |
| `CC_REVISION` | Notice/purpose/vendor configuration version, initially `1` |
| `CC_EXPIRY_DAYS` | Choice lifetime, default 180 days; select for your use case |
| `CC_ADMIN_USER` | Administrator username, no shipped default |
| `CC_ADMIN_PASSWORD_HASH` | A PHP `password_hash` result for a unique password |
| `CC_ALLOW_LOCAL_HTTP` | `1` only for loopback development; never production |

Generate password hashes using PHP `password_hash` in a trusted local process. Do not paste
production passwords into shared terminals, scripts, issues or this repository. Keep PHP
session storage private and outside the web root.

4. Serve the package on the same origin as your website, for example `/consent/`.
5. Open `generator.html` to create a starting `consent-settings.js` and installation tags.
   The generator runs locally in the browser and does not upload settings. Alternatively:

```html
<script src="/consent/consent-settings.js" defer></script>
<script src="/consent/assets/consent.js" defer></script>
```

```js
// consent-settings.js: public configuration, never credentials
window.LightweightConsentConfig = {
  endpoint: '/consent/save_consent.php',
  policyUrl: '/cookie-policy',
  fallbackLanguage: 'en',
  adapters: []
};
```

Use external settings rather than inline JavaScript when enforcing a strict CSP. Permit
same-origin scripts, styles and API requests; add third-party domains only for the services
you deliberately configure. Load configuration before the widget. Do not use async on the
ordered setup scripts. Review `trackingscripts.js` for an adapter example; it is no longer
a default GA/Clarity loader and must not be treated as an automatic blocker.

For a PHP include:

```php
<?php
$lwcaBaseUrl = '/consent';
include '/your/server/path/to/consent/cookie-consent.php';
?>
```

`manage-cookies.php` initializes the same persistent widget for legacy includes. Include
configuration before either entry point. Both entry points are safe to include on one page.

## Languages

Built-in locales are English and French. The order is explicit configuration,
a saved manual choice, website language, browser language preference, then configured fallback. A manual selector
lets the visitor change it. Browser language is not keyboard layout or jurisdiction.

Set `language: 'fr'` to force an initial locale. Add `translations` entries using the full
key set in `assets/consent.js`; incomplete translations are excluded from the selector,
so the normal supported-language fallback is used rather than mixed-language notices. Have
consent wording reviewed in each offered language. Do not infer applicable law from language.

## Integrating tracking

Configure adapters with unique IDs, `category: 'analytics'` or `'marketing'`, and `start` /
`stop` functions. These hooks must be synchronous. Cancel any pending asynchronous SDK
initialization in `stop` so a delayed script cannot activate after withdrawal. Put all
optional script initialization inside the adapter. Use the vendor's
supported shutdown/consent APIs in `stop`; the widget reloads after a category is revoked to
clear already-executed page code. The next page must honor the saved denial before loading it.
A denial marker in local/session storage protects against a failed withdrawal reactivating
old acceptance after reload, and shares the denial with other tabs when localStorage works.
If both storage APIs are unavailable, that failed-save protection only lasts for the current
document: working stop hooks and a successful server save are essential.
Deleting cookies alone does not stop an active script. Disconnected server-side processing
requires its own controls, and withdrawal cannot retract already-transmitted information.

Inventory every optional script and embed, including those inserted by plugins and tag
managers. Never label analytics or advertising as necessary merely to bypass a choice.
Test with network inspection; a banner being visible proves nothing about blocking.

## Records and administration

`GET save_consent.php` returns a CSRF token, current revision and the current unexpired
consent record (or null). `POST` accepts a JSON action and categories with `X-CSRF-Token`.
Only successful database insertion is acknowledged. The `cc_receipt` cookie is a random
HttpOnly browser identifier; it is not proof of a named person's identity. Clearing cookies
creates a new browser history; there is no cross-device identity matching.

The endpoint expects same-origin calls. Keep HTTPS, CSRF protection and Origin checks enabled.
The compatibility path `lwca/save_consent.php` delegates to the root handler. Keep public
consent collection reachable while restricting administrative pages.

Admin pages live under `lwca/`. Authentication uses a configured password hash, session
rotation, idle/absolute expiry and CSRF-protected forms. Review deployment-level request
limits and admin access restrictions. The example `htaccess.txt` is not automatically active
and Apache rules do not apply to Nginx or other hosts. Read it before installing any rule.

The ledger records choices and revisions, not the complete historic notice text. **Archive
an immutable copy of each notice, translations, purpose/vendor configuration and deployed
adapter version under its revision** to interpret the evidence later. Define and operate a
retention/deletion policy for records, backups and old tables; append-only does not mean forever.

## Upgrade from the original package

This is not a blind file replacement on a live site.

1. Back up files and database; test the upgrade on a separate installation.
2. Install the new schema and environment configuration. Replace old default admin
   credentials. Assess historical exposure on your actual hosting configuration.
3. Stop using the old automatic `trackingscripts.js` loader. Move your actual configured
   trackers into explicit adapters and remove duplicate scripts from templates/plugins.
4. The old IP-based records cannot be safely mapped to anonymous browser receipts. They
   are left untouched for your retention decision; visitors must make a fresh choice.
5. Replace the old policy placeholders with your reviewed site-specific disclosures.
6. Verify endpoint paths, PHP includes and web-server access rules. A directory-wide Basic
   Auth rule can accidentally block the public save endpoint and prevent consent changes.
7. Run the complete release checklist before deploying. Keep the backup for rollback;
   rolling back code is not permission to reactivate tracking against newer refusals.

## Verification

```sh
node --test tests/frontend.test.js
php tests/backend.php
find . -name '*.php' -not -path './.git/*' -exec php -l {} \;
node --check assets/consent.js
node --check assets/generator.js
node --check trackingscripts.js
git diff --check
```

Backend unit tests do not require production credentials. The optional browser test uses
Playwright installed in your development Node environment (not a runtime dependency).
Run `CC_TEST_BASE_URL=http://127.0.0.1:8769 node tests/browser.cjs` against a disposable
configured installation. Run `tests/backend-http.py` with the same environment variable;
optional `CC_TEST_ADMIN_USER` and `CC_TEST_ADMIN_PASSWORD` enable admin tests, which
intentionally trigger the test account's 15-minute lockout. Never run these on production.

Browser/integration verification
must use an isolated test database, test credentials and a local/test site, never visitor data.

Before release, verify: fresh visit; accept and next page; reject and next page; individual
categories; withdraw after trackers start; a failed save; expired/revised choices; GPC;
English/French/manual language; keyboard/focus/mobile layout; admin login/logout and rate
limits; and an installation in a subdirectory. Observe actual network requests in each state.
Keep a release record stating what was tested and what was not. See `docs/VERIFICATION.md`
for the latest local verification, and [SECURITY.md](SECURITY.md) for operational boundaries.

Contributors and AI assistants: read [AGENTS.md](AGENTS.md). Nothing is automatically deployed.
