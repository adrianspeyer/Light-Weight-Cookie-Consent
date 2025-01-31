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
- `terms-and-conditions.html` (**T&C page placeholder**)
- `cookie-policy.html` (**Cookie policy page placeholder**)
- `README.md` (Setup guide)

#### **Admin Panel (Secure) - Upload to `/lwca/`**
Move these **admin files** into a **secure folder called `lwca/`**:
- `lwca/admin_dashboard.php` (Admin panel for consent logs)
- `lwca/admin_login.php` (Login page for admin panel, optional)
- `lwca/admin_logout.php` (Logout script)
- `lwca/save_consent.php` (Handles consent logging)
- `lwca/database_setup.sql` (SQL file to create the consent log table)
- `lwca/htaccess.txt` (**Rename to `.htaccess`** to enable security)

### 4. Secure the Admin Panel (`lwca/` folder) with `.htaccess` (Default)
By **default, `.htaccess` security is enabled** to prevent unauthorized access. This ensures **only authenticated users** can view consent logs.

#### **📌 How to Enable `.htaccess` Security**
Inside the **`lwca/`** folder, **rename** the file:
```
htaccess.txt → .htaccess
```

#### **📌 How to Set Up `.htpasswd` for Authentication**
Follow these steps to **restrict access** to the `lwca/` folder.

1️⃣ **Create an `.htpasswd` File**  
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

2️⃣ **Verify Protection**  
- Try accessing `/lwca/admin_dashboard.php` in your browser.
- You should now see a **popup asking for a username & password**.

3️⃣ **Keep `.htpasswd` Secure**  
- **Never store `.htpasswd` inside `/lwca/`**.  
- Store it **above your web root directory**, e.g.:  
  ```
  /home/youruser/.htpasswd
  ```

4️⃣ **Changing Your Password**  
To **change the password**, use:
```sh
htpasswd /path/to/.htpasswd admin
```

### 5. Configure Tracking Scripts (`trackingscripts.js`)
This package **only loads tracking scripts after user consent is given**.  

📌 **How to Add Your Trackers:**  
1. Open the file **`trackingscripts.js`**.  
2. Replace the placeholders:  
   - `"G-XXXXXXXXXX"` → **Your Google Analytics 4 ID**  
   - `"YOUR_CLARITY_ID"` → **Your Microsoft Clarity ID**  
   - `"YOUR_FACEBOOK_PIXEL_ID"` → **Your Facebook Pixel ID**  
3. You can also add additional trackers inside `trackingscripts.js`.  
4. These scripts **only run if the user has accepted cookies** (ensuring GDPR compliance).  

### 6. Using the Placeholder Pages (`terms-and-conditions.html`, `cookie-policy.html`)
- The **`terms-and-conditions.html`** and **`cookie-policy.html`** pages are **placeholders**.
- You can either:
  - **Edit these files** with your actual policies, OR
  - **Update `cookie-consent.php`** to link to existing legal pages on your website.

### 7. Manage Cookie Preferences (User Control)
Users can revoke their consent at any time by clicking the "Manage Cookies" button.  
Add this button to your **footer or menu**:
```php
<?php include 'manage-cookies.php'; ?>
```

## Support & Customization
If you need **additional features** or **support**, feel free to modify the code or contact a developer. This is released as-is.
