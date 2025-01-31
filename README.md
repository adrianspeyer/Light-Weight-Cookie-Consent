# GDPR Cookie Consent Package

## Overview
This package provides a fully **GDPR-compliant** cookie consent solution with **server-side consent logging** and **external tracking script management**.

### Features:
- **User Consent Banner** – Fully customizable placement (bottom-left, bottom-right, full modal).
- **Tracking Scripts Loader** – Loads Google Analytics, Microsoft Clarity, Facebook Pixel *only after consent*.
- **Server-Side Logging** – GDPR-compliant logging of user consent.
- **Manage Cookies Button** – Users can revoke consent anytime.
- **Standalone PHP Files** – Easy to include in any project.

## Installation

### 1. Upload the Files
Extract the contents of the **`gdpr_cookie_consent.zip`** to your website directory.

### 2. Include the Cookie Banner
Add this line in your **PHP pages** where you want to show the banner:
```php
<?php include 'cookie-consent.php'; ?>
```

#### Customize Placement:
- **Default (Bottom-Left)**  
  ```php
  <?php include 'cookie-consent.php'; ?>
  ```
- **Bottom-Right:**  
  ```php
  <?php include 'cookie-consent.php?style=bottom-right'; ?>
  ```
- **Full-Screen Modal:**  
  ```php
  <?php include 'cookie-consent.php?style=modal'; ?>
  ```

### 3. Configure Tracking Scripts
Edit `trackingscripts.js` to include your analytics and marketing trackers.

- Replace the placeholders **"G-XXXXXXXXXX"**, **"YOUR_CLARITY_ID"**, **"YOUR_FACEBOOK_PIXEL_ID"** with your actual tracking IDs.

You can add additional tracking scripts inside `trackingscripts.js`.

### 4. Modify Terms & Conditions / Cookie Policy
Update `terms-and-conditions.html` and `cookie-policy.html` with your site's specific legal details.

### 5. Enable Server-Side Consent Logging (Recommended)
To store user consent for GDPR compliance:
1. **Set up the database**  
   - Locate the file **`database_setup.sql`** in this package.
   - Run the SQL script in your MySQL database.  
   - This will create a **`cookie_consent`** table to log user consent.
   
2. **Modify `save_consent.php`**  
   - Open `save_consent.php` in a text editor.  
   - Replace `your_host`, `your_database`, `your_db_user`, and `your_db_password` with your database credentials.  

3. **Secure the Admin Panel** (Optional)  
   - The admin dashboard at **`admin_dashboard.php`** allows you to view logged consent.
   - Change the default credentials in **`admin_login.php`** (`ADMIN_USER`, `ADMIN_PASS`).

### 6. Manage Cookie Preferences (User Control)
Users can revoke their consent at any time by clicking the "Manage Cookies" button.  
Add this button to your **footer or menu**:
```html
<button onclick="manageCookies()" style="position: fixed; bottom: 10px; right: 10px; background: #FFA500; color: white; border: none; padding: 10px; cursor: pointer; border-radius: 5px;">
    Manage Cookies
</button>

<script>
function manageCookies() {
    if (confirm("Do you want to revoke your cookie consent?")) {
        fetch("save_consent.php", {
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
```

## Support & Customization
If you need **additional features** or **support**, feel free to modify the code or contact a developer. This is released as is.
