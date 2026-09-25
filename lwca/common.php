<?php
declare(strict_types=1);

function cc_config(): array {
    $origin = rtrim((string) getenv('CC_ORIGIN'), '/');
    $parts = parse_url($origin);
    $local = getenv('CC_ALLOW_LOCAL_HTTP') === '1';
    if (!$parts || !isset($parts['scheme'], $parts['host']) || isset($parts['user']) || isset($parts['query']) || isset($parts['fragment']) || !empty($parts['path']) ||
        ($parts['scheme'] !== 'https' && !($local && $parts['scheme'] === 'http' && in_array($parts['host'], ['localhost', '127.0.0.1', '[::1]'], true)))) {
        throw new RuntimeException('Configure CC_ORIGIN with an HTTPS origin.');
    }
    $revision = (string) (getenv('CC_REVISION') ?: '1');
    if (!preg_match('/^[A-Za-z0-9._-]{1,64}$/D', $revision)) throw new RuntimeException('Invalid revision.');
    $days = getenv('CC_EXPIRY_DAYS') ?: '180';
    if (!ctype_digit($days) || (int)$days < 1 || (int)$days > 365) throw new RuntimeException('Invalid expiry.');
    return ['origin' => $origin, 'secure' => $parts['scheme'] === 'https', 'revision' => $revision, 'days' => (int)$days];
}
function cc_db(): PDO {
    $dsn = (string)getenv('CC_DB_DSN');
    if (strpos($dsn, 'mysql:') !== 0 || !getenv('CC_DB_USER')) throw new RuntimeException('Database not configured.');
    $pdo = new PDO($dsn, (string)getenv('CC_DB_USER'), (string)getenv('CC_DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}
function cc_headers(bool $json = false): void {
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
    if ($json) header('Content-Type: application/json; charset=utf-8');
    else header("Content-Security-Policy: default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
}
function cc_session(array $config, bool $admin = false): void {
    session_name($admin ? 'cc_admin_session' : 'cc_consent_session');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $config['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    if (!session_start()) throw new RuntimeException('Session unavailable.');
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
function cc_same_origin(array $config): bool {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // POST must carry an exact Origin, or a same-origin Referer for older browsers.
    if ($origin !== '') return hash_equals($config['origin'], $origin);
    $ref = parse_url($_SERVER['HTTP_REFERER'] ?? '');
    if (!$ref || !isset($ref['scheme'], $ref['host'])) return false;
    return hash_equals($config['origin'], $ref['scheme'] . '://' . $ref['host'] . (isset($ref['port']) ? ':' . $ref['port'] : ''));
}
function cc_csrf($token): bool {
    return is_string($token) && isset($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}
function cc_uuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
}
function cc_validate(array $data, array $config, bool $headerGpc): array {
    if (($data['revision'] ?? null) !== $config['revision']) throw new InvalidArgumentException('revision_mismatch');
    if (!is_string($data['language'] ?? null) || !preg_match('/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8}){0,4}$/D', $data['language']) || strlen($data['language']) > 35) throw new InvalidArgumentException('invalid_language');
    $action = $data['action'] ?? null;
    if (!in_array($action, ['accept_all','reject_all','save_preferences','withdraw'], true)) throw new InvalidArgumentException('invalid_action');
    $categories = $data['categories'] ?? null;
    if (!is_array($categories) || count($categories) !== 3 || ($categories['necessary'] ?? null) !== true || !is_bool($categories['analytics'] ?? null) || !is_bool($categories['marketing'] ?? null) || !is_bool($data['gpc'] ?? null)) throw new InvalidArgumentException('invalid_categories');
    $gpc = $headerGpc || $data['gpc'];
    if (in_array($action, ['reject_all','withdraw'], true)) $categories = ['necessary'=>true,'analytics'=>false,'marketing'=>false];
    if ($action === 'accept_all') $categories = ['necessary'=>true,'analytics'=>true,'marketing'=>true];
    if ($gpc) $categories['marketing'] = false;
    return ['revision'=>$config['revision'],'language'=>$data['language'],'categories'=>$categories,'action'=>$action,'gpc'=>$gpc];
}
function cc_record(array $row): array {
    return ['receiptId'=>$row['receipt_id'],'revision'=>$row['revision'],'language'=>$row['language'], 'categories'=>['necessary'=>true,'analytics'=>(bool)$row['analytics'],'marketing'=>(bool)$row['marketing']], 'action'=>$row['action'],'gpc'=>(bool)$row['gpc'],'createdAt'=>gmdate('c', strtotime($row['created_at'].' UTC')),'expiresAt'=>gmdate('c',strtotime($row['expires_at'].' UTC'))];
}
function cc_escape($value): string { return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function cc_admin_init(): array {
    cc_headers();
    try {
        $config = cc_config();
        if (!getenv('CC_ADMIN_USER') || !getenv('CC_ADMIN_PASSWORD_HASH') || empty(password_get_info((string)getenv('CC_ADMIN_PASSWORD_HASH'))['algo'])) throw new RuntimeException('Admin not configured.');
        cc_session($config, true);
        return $config;
    } catch (Throwable $e) { http_response_code(503); exit('Admin unavailable. Check server configuration.'); }
}
function cc_require_admin(): void {
    if (empty($_SESSION['admin']) || ($_SESSION['last_activity'] ?? 0) < time()-1800 || ($_SESSION['login_at'] ?? 0) < time()-28800) {
        unset($_SESSION['admin']); header('Location: admin_login.php'); exit;
    }
    $_SESSION['last_activity'] = time();
}
