<?php
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

// Get user data
$user_ip = $_SERVER['REMOTE_ADDR'];
$user_agent = $_SERVER['HTTP_USER_AGENT'];
$consent_status = isset($_POST['consent']) ? $_POST['consent'] : null;

if ($consent_status) {
    // Delete previous consent for this IP
    $stmt = $pdo->prepare("DELETE FROM cookie_consent WHERE user_ip = ?");
    $stmt->execute([$user_ip]);

    // Insert new consent record
    $stmt = $pdo->prepare("INSERT INTO cookie_consent (user_ip, consent_status, user_agent) VALUES (?, ?, ?)");
    $stmt->execute([$user_ip, $consent_status, $user_agent]);

    // Set a secure cookie for frontend reference (expires in 1 year)
    setcookie("cookie_consent", $consent_status, time() + (365 * 24 * 60 * 60), "/", "", true, true);
    
    echo "Consent saved successfully.";
}
?>
