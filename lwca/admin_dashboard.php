<?php
session_start();
if (!isset($_SESSION["admin_logged_in"])) {
    header("Location: admin_login.php");
    exit;
}

// Database Connection
$dsn = "mysql:host=your_host;dbname=your_database;charset=utf8mb4";
$username = "your_db_user";
$password = "your_db_password";

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Fetch Consent Logs
$stmt = $pdo->query("SELECT * FROM cookie_consent ORDER BY consent_timestamp DESC");
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard - Cookie Consent Logs</title>
</head>
<body>
    <h2>Cookie Consent Logs</h2>
    <table border="1">
        <tr>
            <th>ID</th>
            <th>IP Address</th>
            <th>Consent Status</th>
            <th>Timestamp</th>
            <th>User Agent</th>
        </tr>
        <?php foreach ($logs as $log): ?>
        <tr>
            <td><?= htmlspecialchars($log["id"]) ?></td>
            <td><?= htmlspecialchars($log["user_ip"]) ?></td>
            <td><?= htmlspecialchars($log["consent_status"]) ?></td>
            <td><?= htmlspecialchars($log["consent_timestamp"]) ?></td>
            <td><?= htmlspecialchars($log["user_agent"]) ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <br>
    <a href="admin_logout.php">Logout</a>
</body>
</html>
