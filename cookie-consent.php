<?php
// Set $lwcaBaseUrl before including when the package is not at the site root.
// Example: $lwcaBaseUrl = '/cookie-consent'; include 'cookie-consent.php';
if (!defined('LWCA_EMBED_RENDERED')) {
    define('LWCA_EMBED_RENDERED', true);
    $lwcaAssetBase = isset($lwcaBaseUrl) ? rtrim($lwcaBaseUrl, '/') : '';
    $lwcaAssetUrl = htmlspecialchars($lwcaAssetBase . '/assets/consent.js', ENT_QUOTES, 'UTF-8');
    echo '<script src="' . $lwcaAssetUrl . '" defer></script>';
}
