<?php
declare(strict_types=1);
require_once __DIR__ . '/lwca/common.php';
cc_headers(true);
function cc_reply(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_SLASHES); exit; }
try {
    $config = cc_config();
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['GET','POST'], true)) { header('Allow: GET, POST'); cc_reply(405, ['error'=>'method_not_allowed']); }
    if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] === 'cross-site') cc_reply(403, ['error'=>'cross_origin']);
    if ($method === 'POST' && !cc_same_origin($config)) cc_reply(403, ['error'=>'cross_origin']);
    cc_session($config);
    $pdo = cc_db();
    $receipt = $_COOKIE['cc_receipt'] ?? '';
    if (!is_string($receipt) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $receipt)) $receipt = '';
    $headerGpc = ($_SERVER['HTTP_SEC_GPC'] ?? '') === '1';
    if ($method === 'GET') {
        $consent = null;
        if ($receipt !== '') {
            $stmt = $pdo->prepare('SELECT * FROM cc_consent_events WHERE receipt_id = ? ORDER BY id DESC LIMIT 1');
            $stmt->execute([$receipt]); $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && $row['revision'] === $config['revision'] && strtotime($row['expires_at'].' UTC') > time()) {
                $consent = cc_record($row);
                // Apply the current signal without rewriting the historic event.
                if ($headerGpc) { $consent['categories']['marketing'] = false; $consent['gpc'] = true; }
            }
        }
        cc_reply(200, ['csrfToken'=>$_SESSION['csrf'],'revision'=>$config['revision'],'expiresDays'=>$config['days'],'gpc'=>$headerGpc,'consent'=>$consent]);
    }
    if (!cc_csrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) cc_reply(403, ['error'=>'invalid_csrf']);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') cc_reply(415,['error'=>'json_required']);
    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if ($raw === false || strlen($raw)>4096) cc_reply(413,['error'=>'body_too_large']);
    $data = json_decode($raw, true);
    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) cc_reply(400,['error'=>'invalid_json']);
    try { $record = cc_validate($data, $config, $headerGpc); }
    catch (InvalidArgumentException $e) { cc_reply($e->getMessage() === 'revision_mismatch' ? 409 : 422,['error'=>$e->getMessage()]); }
    // Existing sessions cannot flood the evidence ledger. Also rate-limit at the web server.
    if (!in_array($record['action'], ['reject_all','withdraw'], true) && ($_SESSION['last_save'] ?? 0) > microtime(true)-0.5) { header('Retry-After: 1'); cc_reply(429,['error'=>'rate_limited']); }
    if ($receipt === '') $receipt = cc_uuid();
    $now = time(); $expires = $now + $config['days'] * 86400;
    $stmt = $pdo->prepare('INSERT INTO cc_consent_events (receipt_id,revision,language,action,analytics,marketing,gpc,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$receipt,$record['revision'],$record['language'],$record['action'],(int)$record['categories']['analytics'],(int)$record['categories']['marketing'],(int)$record['gpc'],gmdate('Y-m-d H:i:s',$now),gmdate('Y-m-d H:i:s',$expires)]);
    // Never acknowledge success before the append has succeeded.
    setcookie('cc_receipt',$receipt,['expires'=>$expires,'path'=>'/','secure'=>$config['secure'],'httponly'=>true,'samesite'=>'Lax']);
    setcookie('cookie_consent','',['expires'=>1,'path'=>'/','secure'=>$config['secure'],'httponly'=>true,'samesite'=>'Lax']);
    $_SESSION['last_save'] = microtime(true);
    $record['receiptId']=$receipt; $record['createdAt']=gmdate('c',$now); $record['expiresAt']=gmdate('c',$expires);
    cc_reply(200,['consent'=>$record]);
} catch (Throwable $e) { cc_reply(503,['error'=>'service_unavailable']); }
