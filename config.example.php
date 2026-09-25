<?php
/**
 * Configuration reference ONLY. This file is deliberately not loaded.
 * Set environment variables in your PHP-FPM pool / hosting control panel.
 * Never commit real credentials. PHP 8.2+ with PDO MySQL and sessions required.
 *
 * CC_ORIGIN                 https://www.example.com (exact public origin, no path)
 * CC_DB_DSN                 mysql:host=localhost;dbname=consent;charset=utf8mb4
 * CC_DB_USER                deployment-specific least-privilege database user
 * CC_DB_PASSWORD            deployment-specific database password
 * CC_REVISION               1 (bump when purposes, vendors or notice materially change)
 * CC_EXPIRY_DAYS            180 (1..365; choose an appropriate consent lifetime)
 * CC_ADMIN_USER             deployment-specific administrator name
 * CC_ADMIN_PASSWORD_HASH    output of password_hash($password, PASSWORD_DEFAULT)
 * CC_ALLOW_LOCAL_HTTP       1 only for localhost development; default disabled
 *
 * TLS must terminate securely at the configured origin; do not trust arbitrary
 * X-Forwarded-* headers. The application derives Secure cookies from CC_ORIGIN.
 * Configure session.save_path outside the web root with private permissions.
 * Apply host-level POST rate limits, database backups, and a documented retention
 * job (including backups and legacy cookie_consent raw IP/UA records).
 * A single installation supports one origin/site, not cross-origin SaaS hosting.
 */
