# Security and deployment boundaries

This package is a consent-control component, not a legal certification. The site
operator remains responsible for identifying tracking, integrating every relevant
service, selecting an appropriate configuration and validating actual behaviour.

## Reporting

Do not post credentials, visitor records or working exploit details in a public
issue. Use GitHub private vulnerability reporting if enabled, or privately contact
the repository owner to agree a secure reporting channel. Do not assume a response
SLA or a monitored security email address that is not published by the owner.

## Operational requirements

- Serve production over HTTPS. Keep database/configuration secrets outside public
  files and use a restricted database account.
- Use a unique administrator password hash and the documented authentication
  configuration; never retain historical hardcoded defaults.
- Do not commit session files, logs, exports or production database backups.
- Restrict administration and protect exports/backups with access controls.
- Set retention and deletion procedures appropriate to your actual obligations.
  Append-only event recording does not mean indefinite retention.
- Protect the public endpoint with appropriate hosting-level request limits; do
  not use consent collection as an excuse to create a visitor fingerprint database.
- Integrate server-side tracking separately. Browser controls cannot retract data
  already transmitted, delete arbitrary third-party cookies or stop disconnected
  server-side processing.
- On third-party script changes, repeat accept/reject/withdrawal network checks.

## Upgrade boundary

The old release used a hardcoded admin password, IP-based replacement of records,
and inconsistent save endpoints. An upgrade requires configuration and a new event
table; replacing files alone is not a safe production migration. Follow README.md.
Review historical deployment exposure and credentials on the actual installation.
