# Light-Weight-Cookie-Consent

## Overview
This package provides a fully **GDPR-compliant** cookie consent solution with **server-side consent logging** and **external tracking script management**.

### Features:
- **User Consent Banner** – Fully customizable placement (bottom-left, bottom-right, full modal).
- **Tracking Scripts Loader** – Loads Google Analytics, Microsoft Clarity, Facebook Pixel *only after consent*.
- **Server-Side Logging** – GDPR-compliant logging of user consent.
- **Manage Cookies Button** – Users can revoke consent anytime using an **include file**.
- **Admin Panel (in `/lwca/` folder)** – Secure admin section for viewing consent logs.
- **.htaccess Security by Default** – Prevent unauthorized access to the admin panel.
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

1. Locate the file **`lwca/database_setup.sql`** in this package.
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
- `lwca/admin_login.php` (Login page for admin panel, optional)
- `lwca/admin_logout.php` (Logout script)
- `lwca/save_consent.php` (Handles consent logging)
- `lwca/database_setup.sql` (SQL file to create the consent log table)

### 4. Secure the Admin Panel (`lwca/` folder) with `.htaccess` (Default)
By **default, `.htaccess` security is enabled** to prevent unauthorized access. This ensures **only authenticated users** can view consent logs.

#### **📌 How to Set Up `.htpasswd` for Authentication**
Follow these steps to **restrict access** to the `lwca/` folder.

1️⃣ **Create an `.htaccess` File**  
Inside the **`lwca/`** folder, create a new file named:  
```
.htaccess
```
Paste this inside the file:
```
AuthType Basic
AuthName "Restricted Access"
AuthUserFile /path/to/.htpasswd
Require valid-user
```
- **Replace `/path/to/.htpasswd`** with the actual location where you will store the `.htpasswd` file.

2️⃣ **Create the `.htpasswd` File**  
The `.htpasswd` file stores the **username & encrypted password** for authentication.

📌 **On Linux/macOS**  
Run this command in **Terminal**:
```sh
htpasswd -c /path/to/.htpasswd admin
```
- Replace `/path/to/.htpasswd` with the actual file path.
- Replace `admin` with your **desired username**.
- It will prompt you to **set a password**.

📌 **On Windows**  
1. **Download** `htpasswd.exe` from [Apache website](https://httpd.apache.org/docs/current/programs/htpasswd.html).
2. Open **Command Prompt** and run:
   ```sh
   htpasswd -c C:\path	o\.htpasswd admin
   ```
3. **Enter a password** when prompted.

3️⃣ **Verify Protection**  
- Try accessing `/lwca/admin_dashboard.php` in your browser.
- You should now see a **popup asking for a username & password**.

4️⃣ **Keep `.htpasswd` Secure**  
- **Never store `.htpasswd` inside `/lwca/`**.  
- Store it **above your web root directory**, e.g.:  
  ```
  /home/youruser/.htpasswd
  ```

5️⃣ **Changing Your Password**  
To **change the password**, use:
```sh
htpasswd /path/to/.htpasswd admin
```

### 5. Optional: Enable PHP Form-Based Login (Alternative or Additional Security)
If you prefer **form-based login** instead of `.htaccess` (or as an extra layer), enable the built-in **PHP login system**.

1. **Open `lwca/admin_login.php`** and change the default credentials:
   ```php
   define("ADMIN_USER", "your_admin_username");
   define("ADMIN_PASS", "your_secure_password");
   ```
2. **Remove `.htaccess` protection** (if you prefer only form login).

### **Comparison of Security Methods**
| Security Option  | Protection Level | How Users Log In |
|------------------|-----------------|------------------|
| **.htaccess (Default, Recommended)** | 🔒 Strong | Enter `admin` + password in a browser prompt before accessing admin panel |
| **PHP Form Login (Optional)** | ✅ Moderate | Enter `admin` + password on login form (`admin_login.php`) |
| **Both (Extra Secure)** | 🔥 Maximum Security | Enter `.htpasswd` password → Enter `admin_login.php` password |

### 6. Include the Cookie Banner
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

### 7. Manage Cookie Preferences (User Control)
Users can revoke their consent at any time by clicking the "Manage Cookies" button.  
Add this button to your **footer or menu**:
```php
<?php include 'manage-cookies.php'; ?>
```

## Support & Customization
If you need **additional features** or **support**, feel free to modify the code or contact a developer. This is released as-is.
