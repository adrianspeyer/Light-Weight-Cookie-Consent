-- Additive installation/migration. Existing cookie_consent data is not changed.
-- Back up the live database and review retention before running this manually.
CREATE TABLE IF NOT EXISTS cc_consent_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    revision VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    language VARCHAR(35) NOT NULL,
    action ENUM('accept_all','reject_all','save_preferences','withdraw') NOT NULL,
    analytics BOOLEAN NOT NULL,
    marketing BOOLEAN NOT NULL,
    gpc BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX receipt_history (receipt_id, id),
    INDEX retention_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One global admin authentication bucket, shared across cookies and client IPs.
CREATE TABLE IF NOT EXISTS cc_admin_throttle (
    id TINYINT UNSIGNED PRIMARY KEY,
    failures INT UNSIGNED NOT NULL DEFAULT 0,
    window_start BIGINT UNSIGNED NOT NULL DEFAULT 0,
    blocked_until BIGINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;
INSERT IGNORE INTO cc_admin_throttle (id) VALUES (1);
