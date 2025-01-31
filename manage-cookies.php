<?php
// Manage Cookies Button Include File
?>
<div id="manage-cookies-container">
    <button onclick="manageCookies()" style="position: fixed; bottom: 10px; right: 10px; background: #FFA500; color: white; border: none; padding: 10px; cursor: pointer; border-radius: 5px;">
        Manage Cookies
    </button>
</div>

<script>
function manageCookies() {
    if (confirm("Do you want to revoke your cookie consent?")) {
        fetch("lwca/save_consent.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "consent=declined"
        }).then(() => {
            alert("Your consent has been revoked. The page will refresh.");
            location.reload();
        });
    }
}
</script>
