# Light Weight Cookie Consent

## Overview
This package provides a fully **GDPR-compliant** cookie consent solution with **server-side consent logging** and **external tracking script management**.

### Features:
- **User Consent Banner** – Fully customizable placement (bottom-left, bottom-right, full modal).
- **Tracking Scripts Loader** – Loads Google Analytics, Microsoft Clarity, Facebook Pixel *only after consent*.
- **Server-Side Logging** – GDPR-compliant logging of user consent.
- **Manage Cookies Button** – Users can revoke consent anytime using an **include file**.
- **Admin Panel (in `/lwca/` folder)** – Secure admin section for viewing consent logs.
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
3. Open **`lwca/save_consent.php`** and update your **database credentials**:
   ```php
   $dsn = "mysql:host=your_host;dbname=your_database;charset=utf8mb4";
   $username = "your_db_user";
   $password = "your_db_password";
   ```

### 3. Upload Required Files to Your Website
Once the database is set up, upload the following files to your **website directory**:

#### **Main Files**
- `cookie-consent.php` (Main consent banner)
- `trackingscripts.js` (Tracking script loader)
- `manage-cookies.php` (**Include file for Manage Cookies button**)
- `terms-and-conditions.html` (T&C page)
- `cookie-policy.html` (Cookie policy page)
- `README.md` (Setup guide)

#### **Admin Panel (Secure) - Upload to `/lwca/`**
Move these **admin files** into a **secure folder called `lwca/`**:
- `lwca/admin_dashboard.php` (Admin panel for consent logs)
- `lwca/admin_login.php` (Login page for admin panel)
- `lwca/admin_logout.php` (Logout script)
- `lwca/save_consent.php` (Handles consent logging)
- `lwca/database_setup.sql` (SQL file to create the consent log table)

### 4. Secure the Admin Panel (`lwca/` folder)
To prevent unauthorized access to the admin panel, create an **.htaccess** file inside the `lwca/` folder:  

📌 **Create a file named `.htaccess` inside `lwca/` and add this content:**
```
AuthType Basic
AuthName "Restricted Access"
AuthUserFile /path/to/.htpasswd
Require valid-user
```

📌 **Generate a `.htpasswd` file** to store admin credentials securely:
```sh
htpasswd -c /path/to/.htpasswd admin
```
Replace **`/path/to/.htpasswd`** with the actual path on your server.

### 5. Include the Cookie Banner
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

### 6. Configure Tracking Scripts
Edit `trackingscripts.js` to include your analytics and marketing trackers.

- Replace the placeholders **"G-XXXXXXXXXX"**, **"YOUR_CLARITY_ID"**, **"YOUR_FACEBOOK_PIXEL_ID"** with your actual tracking IDs.

You can add additional tracking scripts inside `trackingscripts.js`.

### 7. Manage Cookie Preferences (User Control)
Users can revoke their consent at any time by clicking the "Manage Cookies" button.  
Add this button to your **footer or menu**:
```php
<?php include 'manage-cookies.php'; ?>
```

## Support & Customization
If you need **additional features** or **support**, feel free to modify the code or contact a developer. This is released as-is.
