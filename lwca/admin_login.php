<?php
session_start();

define("ADMIN_USER", "admin");
define("ADMIN_PASS", "securepassword123");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($_POST["username"] === ADMIN_USER && $_POST["password"] === ADMIN_PASS) {
        $_SESSION["admin_logged_in"] = true;
        header("Location: admin_dashboard.php");
        exit;
    } else {
        $error = "Invalid credentials.";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
</head>
<body>
    <h2>Admin Login</h2>
    <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>
    <form method="post">
        <input type="text" name="username" placeholder="Username" required><br>
        <input type="password" name="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
    </form>
</body>
</html>
