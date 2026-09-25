<?php
declare(strict_types=1);
require __DIR__ . '/common.php';
$config = cc_admin_init(); cc_require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { header('Allow: GET'); http_response_code(405); exit; }
$before = filter_input(INPUT_GET, 'before', FILTER_VALIDATE_INT, ['options'=>['min_range'=>1]]);
try {
    $pdo = cc_db();
    $stmt = $pdo->prepare('SELECT * FROM cc_consent_events'.($before ? ' WHERE id < ?' : '').' ORDER BY id DESC LIMIT 100');
    $stmt->execute($before ? [$before] : []); $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) { http_response_code(503); exit('Consent records unavailable.'); }
?>
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consent evidence</title>
<body><main><h1>Consent evidence</h1><p>Latest 100 events, UTC. Necessary storage is always enabled. Records show choices; they do not certify tracker behaviour or legal compliance.</p>
<table><caption>Recorded consent changes</caption><thead><tr><th scope="col">ID</th><th scope="col">Receipt</th><th scope="col">Action</th><th scope="col">Analytics</th><th scope="col">Marketing</th><th scope="col">GPC</th><th scope="col">Revision</th><th scope="col">Language</th><th scope="col">Time (UTC)</th><th scope="col">Expires (UTC)</th></tr></thead><tbody>
<?php foreach ($logs as $log): ?><tr><?php foreach (['id','receipt_id','action','analytics','marketing','gpc','revision','language','created_at','expires_at'] as $key): ?><td><?= cc_escape($log[$key]) ?></td><?php endforeach; ?></tr><?php endforeach; ?>
</tbody></table>
<?php if (count($logs) === 100): ?><p><a href="?before=<?= cc_escape($logs[99]['id']) ?>">Older events</a></p><?php endif; ?>
<form action="admin_logout.php" method="post"><input type="hidden" name="csrf" value="<?= cc_escape($_SESSION['csrf']) ?>"><button type="submit">Log out</button></form>
</main></body></html>
