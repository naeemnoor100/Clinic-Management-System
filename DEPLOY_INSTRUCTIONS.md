# Deployment Instructions

This application consists of a React frontend and a PHP/MySQL backend for synchronization.

## 1. Database Setup
1. Create a MySQL database on your hosting provider (e.g., `clinic_db`).
2. Import the `database.sql` file into your MySQL database. This will create all the necessary tables.

## 2. Backend Configuration
1. Open `config.php`.
2. Update the database credentials to match your hosting environment:
   ```php
   define('DB_HOST', 'localhost'); // Often 'localhost', but check your host
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_database_user');
   define('DB_PASS', 'your_database_password');
   ```

## 3. Uploading Files
Upload the following files/folders to your web server (e.g., `public_html`):
- `index.html`
- `dist/` folder (after running `npm run build`) - *See Frontend Build below*
- `sync.php`
- `config.php`

## 4. Frontend Build (If not already built)
If you are deploying the source code:
1. Run `npm install` to install dependencies.
2. Run `npm run build` to generate the production-ready frontend files in the `dist` folder.
3. Upload the contents of the `dist` folder to your web server's root (or subdirectory).

## 5. Connecting the App
1. Open the app in your browser (e.g., `https://yourdomain.com`).
2. The app will automatically connect to the default clinic.
3. Your data will automatically sync with the server.

## 6. Cloud Sync Configuration (Optional)
If your `sync.php` is hosted on a different domain or path:
1. Go to **Settings** > **Cloud Sync**.
2. Enter the full URL to your `sync.php` file (e.g., `https://api.yourdomain.com/sync.php`).
3. Click **Pull Data** to fetch the latest data from the server.
4. Click **Push Data** to upload your local data to the server.

## Troubleshooting
- **404 Error on Sync**: Ensure `sync.php` is in the correct location and your server supports PHP.
- **500 Error**: Check `config.php` credentials and ensure the database user has permissions.
- **CORS Error**: If your frontend is on a different domain (e.g., Netlify) than your backend, ensure `sync.php` headers allow the origin (already configured to allow `*`).
