# Instructions for contributors and coding agents

This is a **public repository** for a self-hosted consent-control component. Read
README.md, SECURITY.md and the relevant implementation before changing it.
CLAUDE.md points here; keep one canonical instruction set.

## Public repository boundary

- Never commit credentials, production configuration, consent records, database
  dumps, passwords, personal information, private company details or local paths.
- Keep this package standalone. Never include private roadmaps, business plans,
  unrelated projects, cross-project strategy or conversation notes in any tracked file.
- Use environment configuration and placeholder-only examples. Preserve .gitignore.
- Preserve LICENSE.md and original-author attribution. Describe modifications honestly.
- Do not upload private customer sites, logs or data to external services.
- Do not push, publish or deploy without explicit owner authorization.

## Product and security invariants

- This component supports configured consent workflows. Never claim that installing
  it guarantees GDPR compliance or compliance with every jurisdiction.
- No optional tracker runs until a valid, current server-confirmed choice permits
  its category. A failed request must not activate tracking or display success.
- Necessary storage is restricted to the consent/security mechanism. Analytics and
  marketing are separate and off by default. Respect supported GPC handling.
- Acceptance, rejection, preference changes and withdrawal must remain available.
  Withdrawal must stop future configured tracking, including already-loaded code.
- Consent state comes from the server; never read HttpOnly cookies in JavaScript.
- Preserve append-only consent history; never identify a person by IP address alone.
- Keep revision and expiry checks on the server. Do not silently extend consent.
- Keep CSRF, same-origin checks, safe sessions, input limits and admin authentication.
  No default admin credentials or direct public access to database records.
- Language is independent of legal jurisdiction. Preserve English/French parity,
  explicit language choice, loaded-language fallback and accessible controls.
- No automatic legal decisions, arbitrary script blocking claims or unsupported compliance claims.

## Architecture and change discipline

- Keep the runtime lightweight: browser JavaScript/CSS and PHP/PDO, without a
  mandatory frontend build pipeline. Avoid dependencies unless justified and approved.
- Preserve legacy PHP include entry points where safe, with documented migration.
- Update documentation and tests with behaviour changes. Test actual consent state
  transitions, HTTP failures and tracker activation, not just rendered strings.
- Schema changes must preserve existing records; document backup and migration steps.

## Verification and reporting

Run the commands documented in README.md. At minimum, run JavaScript tests and
syntax checks, PHP lint and backend tests where PHP is available, and browser
tests for the complete lifecycle. Report environment blockers explicitly.

Before a release, test a real PHP/database installation over HTTPS: first visit,
accept/reject, next page, category changes, withdrawal, expiry/revision, save failure,
language switching, GPC and admin login/logout. Observe network requests to confirm
tracking behaviour. Mock browser tests are not a substitute for this integration gate.

Inspect git diff for sensitive information and unintended files. State what changed,
what was tested, what remains unverified, and whether anything was deployed.
