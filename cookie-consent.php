<?php
$style = isset($_GET['style']) ? $_GET['style'] : 'bottom-left';
$css = "";
switch ($style) {
    case 'bottom-right': $css = "bottom: 20px; right: 20px;"; break;
    case 'modal': $css = "top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; text-align: center;"; break;
    default: $css = "bottom: 20px; left: 20px;";
}
?>
<div id="cookie-consent-banner" style="position: fixed; <?= $css ?> background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px; display: none; max-width: 300px;">
    <p id="cookie-message">This website uses cookies to ensure you get the best experience.</p>
    <a href="terms-and-conditions.html" target="_blank" style="color: lightblue;">Terms & Conditions</a> |
    <a href="cookie-policy.html" target="_blank" style="color: lightblue;">Learn More</a>
    <br>
    <button id="accept-cookies" style="background: #4CAF50; color: white; border: none; padding: 10px 10px;">Accept</button>
    <button id="decline-cookies" style="background: #D9534F; color: white; border: none; padding: 10px 10px;">Decline</button>
</div>
<script>
document.addEventListener("DOMContentLoaded", function () {
    if (!document.cookie.includes("cookie_consent")) {
        document.getElementById("cookie-consent-banner").style.display = "block";
    }
    function sendConsent(consent) {
        fetch("save_consent.php", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "consent=" + consent
        }).then(() => {
            document.getElementById("cookie-consent-banner").style.display = "none";
            if (consent === "accepted") loadTrackingScripts();
        });
    }
    document.getElementById("accept-cookies").addEventListener("click", function () { sendConsent("accepted"); });
    document.getElementById("decline-cookies").addEventListener("click", function () { sendConsent("declined"); });
});
function loadTrackingScripts() {
    let script = document.createElement("script");
    script.src = "trackingscripts.js";
    script.async = true;
    document.head.appendChild(script);
}
</script>
