# HomeFaciliti Admin Backend

This is the Node.js / Express backend server that powers the HomeFaciliti Admin Panel and Partner Dashboard.

## 🚀 Live Deployment
- **Server URL:** `https://adminbackend-1-h03r.onrender.com`
- **Hosting:** Render.com (Web Service)
- **Database:** Direct MySQL connection to `homefaciliti.com` (BigRock)

## 📁 Directory Structure
- `server.js` - The main entry point. Initializes Express, configures CORS, and mounts all API routes.
- `db.js` - Manages the MySQL connection pool. It includes auto-retry logic to handle aggressive BigRock idle connection timeouts.
- `filePersistence.js` - Handles saving and restoring uploaded images/files from the database (since Render uses an ephemeral file system).
- `routes/` - Contains separate route handlers for each module:
  - `dashboard.js` - Dashboard statistics (Total users, categories, orders, earnings)
  - `categories.js` - Fetch and manage service categories
  - `users.js` - User management APIs
  - `partners.js` - Partner/Provider management APIs
  - `orders.js` - Order booking and tracking
  - `services.js` - Specific home services under categories
- `uploads/` - Local directory where images are temporarily stored before/after syncing with the DB.

## 🛠️ Architecture & Features
- **Direct Database Connection:** The backend communicates directly with the MySQL database on BigRock via port 3306. **Important:** BigRock's Remote MySQL settings MUST have the `%` wildcard enabled to allow Render's dynamic IP addresses to connect.
- **Ephemeral Storage Fallback:** Because Render wipes the local disk on every restart, `server.js` intercepts requests for missing `/uploads/*` files and uses `filePersistence.js` to instantly restore them from the `uploaded_files` MySQL table.

## 🔗 Main API Endpoints
All API routes are prefixed with `/api`.
- `GET /api/dashboard` - Get overall stats.
- `GET /api/categories` - List all categories.
- `GET /api/users` - List registered users.
- `GET /api/partners` - List registered partners.
- `GET /api/orders` - View all bookings.
- `GET /api/system/ip` - Diagnostic route to check the server's current outbound IP address.

## 💻 Local Development
1. Run `npm install` to install dependencies.
2. Ensure you have a `.env` file with the correct database credentials:
   ```env
   DB_HOST=homefaciliti.com
   DB_USER=your_db_user
   DB_PASSWORD=your_db_pass
   DB_NAME=your_db_name
   ```
3. Run `node server.js` to start the server locally on `http://localhost:3000`.
