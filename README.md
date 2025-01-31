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

### 1. Clone or Download the Code
You can clone this repository using Git:  
```sh
git clone https://github.com/adrianspeyer/light-weight-cookie-consent.git
```
Or download the ZIP file from GitHub and extract the contents.

### 2. Set Up the Database (MySQL)
Before uploading the files, create the **database** for logging consent:

1. Locate the file **`database_setup.sql`** in this package.
2. Run the SQL script in your **MySQL database**.  
   - This will create a **`cookie_consent`** table to log user consent.
3. Open **`save_consent.php`** and update your **database credentials**:
   ```php
   $dsn = "mysql:host=your_host;dbname=your_database;charset=utf8mb4";
   $username = "your_db_user";
   $password = "your_db_password";
   ```

### 3. Upload Required Files to Your Website
Once the database is set up, upload the following files to your **website directory**:
- `cookie-consent.php` (Main consent banner)
- `trackingscripts.js` (Tracking script loader)
- `save_consent.php` (Logs consent to the database)
- `admin_dashboard.php` (Admin panel for consent logs)
- `admin_login.php` (Login page for admin panel)
- `admin_logout.php` (Logout script)
- `terms-and-conditions.html` (T&C page)
- `cookie-policy.html` (Cookie policy page)
- `README.md` (Setup guide)

### 4. Include the Cookie Banner
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

### 5. Configure Tracking Scripts
Edit `trackingscripts.js` to include your analytics and marketing trackers.

- Replace the placeholders **"G-XXXXXXXXXX"**, **"YOUR_CLARITY_ID"**, **"YOUR_FACEBOOK_PIXEL_ID"** with your actual tracking IDs.

You can add additional tracking scripts inside `trackingscripts.js`.

### 6. Modify Terms & Conditions / Cookie Policy
Update `terms-and-conditions.html` and `cookie-policy.html` with your site's specific legal details.

### 7. Secure the Admin Panel (Optional)
1. The **admin panel** at `admin_dashboard.php` allows you to view consent logs.
2. Change the **default admin credentials** in `admin_login.php`:
   ```php
   define("ADMIN_USER", "admin");
   define("ADMIN_PASS", "securepassword123");
   ```

### 8. Manage Cookie Preferences (User Control)
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
If you need **additional features** or **support**, feel free to modify the code or contact a developer. This is released as-is.
