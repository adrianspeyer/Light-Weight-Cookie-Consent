# Local verification — 2026-09-25

Version 2.0.0 was checked as a public, self-hosted package. No live deployment or
production database was accessed or changed. Tests used a disposable local database.

## Results

| Command / check | Observed result |
|---|---|
| `node --test tests/frontend.test.js` | 5 tests passed, 0 failed |
| `php tests/backend.php` | 25 checks passed |
| `python3 tests/backend-http.py` with isolated test environment | 38 checks passed |
| `node tests/browser.cjs` with isolated test environment and Playwright | 13 browser scenarios passed |
| PHP lint, all PHP files | No syntax errors |
| JavaScript syntax checks | Passed |
| `git diff --check` | Passed |

The local server used PHP 8.4.1 and MySQL 5.7; browser automation used Chromium.
An additional visible Chrome check confirmed English/French presentation and the
accept → reopen preferences → withdraw flow, with both demonstration adapters off
after withdrawal. Browser mobile checks used a 390 × 844 viewport, not a physical phone.

Browser scenarios cover return visits, rejection, category isolation, failed acceptance,
failed withdrawal/recovery, GPC via browser and HTTP header, cross-tab withdrawal,
expired/stale receipts, French/mobile layout, generator output and mock request evidence.
The request fixture observes network calls from an explicit test adapter; no actual
analytics or advertising vendor SDK was configured or certified.

## Material limits

- Production HTTPS/session configuration, reverse proxy/CSP, actual vendor adapters,
  hosting access rules and the site's complete tracking surface remain deployment tests.
- A failed withdrawal persists a protective local denial when browser storage is
  available. When both web-storage APIs are unavailable, that local protection cannot
  survive navigation until a server save succeeds.
- Custom translations need a complete key set and human review. Built-in French was
  functionally checked, not independently legally reviewed.
- Consent records document choices; they do not prove every service respected them.
- No universal legal compliance claim or live-release certification is made.

Run test scripts only against disposable environments. Admin HTTP tests intentionally
trigger the test login throttle; do not run them against a public installation.
