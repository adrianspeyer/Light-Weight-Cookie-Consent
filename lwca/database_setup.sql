CREATE TABLE cookie_consent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ip VARCHAR(45) NOT NULL,
    consent_status ENUM('accepted', 'declined') NOT NULL,
    consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT
);
