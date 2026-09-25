<?php
declare(strict_types=1);
require __DIR__ . '/common.php';
$config = cc_admin_init();
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!cc_same_origin($config) || !cc_csrf($_POST['csrf'] ?? null)) { http_response_code(403); exit('Invalid request.'); }
    $pdo = null;
    try {
        $pdo = cc_db();
        $pdo->beginTransaction();
        $row = $pdo->query('SELECT * FROM cc_admin_throttle WHERE id = 1 FOR UPDATE')->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new RuntimeException('Throttle not installed.');
        $now = time();
        if ((int)$row['blocked_until'] > $now) {
            $pdo->rollBack(); http_response_code(429); header('Retry-After: '.((int)$row['blocked_until']-$now));
            $error = 'Too many attempts. Try again later.';
        } else {
            $user = $_POST['username'] ?? null; $password = $_POST['password'] ?? null;
            $validPassword = is_string($password) && strlen($password) <= 1024 && password_verify($password, (string)getenv('CC_ADMIN_PASSWORD_HASH'));
            $valid = is_string($user) && hash_equals((string)getenv('CC_ADMIN_USER'), $user) && $validPassword;
            if ($valid) {
                $pdo->exec('UPDATE cc_admin_throttle SET failures=0, window_start=0, blocked_until=0 WHERE id=1');
                $pdo->commit(); session_regenerate_id(true);
                $_SESSION = ['admin'=>true,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>$now,'login_at'=>$now];
                header('Location: admin_dashboard.php'); exit;
            }
            $fresh = (int)$row['window_start'] < $now-900;
            $failures = $fresh ? 1 : (int)$row['failures']+1;
            $stmt = $pdo->prepare('UPDATE cc_admin_throttle SET failures=?, window_start=?, blocked_until=? WHERE id=1');
            $stmt->execute([$failures,$fresh ? $now : $row['window_start'],$failures >= 5 ? $now+900 : 0]);
            $pdo->commit(); http_response_code(401); $error = 'Invalid credentials.';
        }
    } catch (Throwable $e) {
        if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
        http_response_code(503); $error = 'Admin unavailable.';
    }
} elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') { header('Allow: GET, POST'); http_response_code(405); exit; }
?>
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consent admin login</title>
<body><main><h1>Consent admin login</h1>
<?php if ($error !== ''): ?><p role="alert"><?= cc_escape($error) ?></p><?php endif; ?>
<form method="post"><input type="hidden" name="csrf" value="<?= cc_escape($_SESSION['csrf']) ?>">
<p><label>Username <input name="username" autocomplete="username" maxlength="128" required></label></p>
<p><label>Password <input type="password" name="password" autocomplete="current-password" maxlength="1024" required></label></p>
<button type="submit">Log in</button></form></main></body></html>
