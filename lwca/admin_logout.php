<?php
declare(strict_types=1);
require __DIR__ . '/common.php';
$config = cc_admin_init();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Allow: POST'); http_response_code(405); exit('POST required.'); }
if (!cc_same_origin($config) || !cc_csrf($_POST['csrf'] ?? null)) { http_response_code(403); exit('Invalid request.'); }
$_SESSION = [];
setcookie(session_name(), '', ['expires'=>1,'path'=>'/','secure'=>$config['secure'],'httponly'=>true,'samesite'=>'Lax']);
session_destroy(); header('Location: admin_login.php');
