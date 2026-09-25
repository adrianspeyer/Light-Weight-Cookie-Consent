# Changelog

## 2.0.0 — 2026-09-25

Breaking upgrade; test migration before replacing a live installation.

- Replace cookie-reading banner logic with a same-origin, server-confirmed consent API.
- Add English/French category preferences, language selection, withdrawal, revision and
  expiry handling, GPC marketing denial and a persistent preferences control.
- Replace automatic example trackers with explicit start/stop adapters, off by default.
- Fail closed on invalid/failed requests; prevent a failed withdrawal from restoring
  old acceptance after reload when browser storage is available; notify other tabs.
- Add append-only pseudonymous consent events and preserve legacy records separately.
- Replace hardcoded admin credentials with environment-configured password hashes,
  session rotation, CSRF protection, session expiry and database-backed throttling.
- Add a compatibility save endpoint, installation generator, safe demo, migration and
  security documentation, automated tests and public-repository agent instructions.
- Remove unsupported universal/GDPR compliance claims and misleading policy placeholders.

No live deployment is implied by this version. Site-specific tracker integration,
reviewed disclosures, HTTPS configuration and operational retention remain required.
