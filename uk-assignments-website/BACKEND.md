# Backend Setup Instructions

## Prerequisites
- Node.js installed on your system

## Installation

1. Navigate to the website directory:
```bash
cd C:\Users\Bravo\Desktop\uk-assignments-website
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
# or for development with auto-restart:
npm run dev
```

## Features

### Authentication
- **POST /api/register** - Create new user account
- **POST /api/login** - Login and receive JWT token
- **GET /api/profile** - Get user profile (requires authentication)

### Orders
- **POST /api/calculate-price** - Calculate order price
- **POST /api/orders** - Create new order (requires authentication)
- **GET /api/orders** - Get user's orders (requires authentication)

### Admin Endpoints
- **GET /api/admin/users** - Get all users (requires admin key)
- **GET /api/admin/orders** - Get all orders with customer info (requires admin key)
- **GET /api/admin/stats** - Get statistics (users, orders, revenue)

## Database
- SQLite database file `bravin-morara.db` will be created automatically
- Contains `users` and `orders` tables

## Frontend Integration
- Add `<script src="api.js"></script>` to your HTML pages
- The login page already connects to the backend
- Orders are saved to database when logged in

## Admin Dashboard Access (Live Deployment)

After deploying your website:

### **Method 1: Admin Page**
Visit: `https://yourdomain.com/admin.html`

Login with your admin key: **bravin-admin-2026**

### **Method 2: Direct API Calls**
View all data via API endpoints:

```bash
# Get all users
curl -H "x-admin-key: bravin-admin-2026" https://yourdomain.com/api/admin/users

# Get all orders
curl -H "x-admin-key: bravin-admin-2026" https://yourdomain.com/api/admin/orders

# Get statistics
curl -H "x-admin-key: bravin-admin-2026" https://yourdomain.com/api/admin/stats
```

### **Method 3: SQLite Database**
Directly access `bravin-morara.db` using any SQLite browser tool:

```bash
# Using sqlite3 command line
sqlite3 bravin-morara.db "SELECT * FROM users;"
sqlite3 bravin-morara.db "SELECT * FROM orders;"
```

### **Data Analytics Features**
- Real-time statistics cards (users, orders, revenue)
- Doughnut chart: Orders by service type
- Line chart: Revenue over time
- Recent orders table with customer details