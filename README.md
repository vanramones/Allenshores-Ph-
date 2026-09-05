# AllenShores PH - React + Express Version

A modern beach comparison and booking system built with React, React Bootstrap, and Express.

## 🏗️ Project Structure

```
WEB_BASED_BEACH_COMPARISON/
├── client/                    # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   └── AdminLayout.js
│   │   │   ├── beaches/
│   │   │   │   └── BeachCard.js
│   │   │   └── common/
│   │   │       ├── Footer.js
│   │   │       ├── Loading.js
│   │   │       ├── Navbar.js
│   │   │       └── StarRating.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   ├── BookmarkContext.js
│   │   │   └── CompareContext.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminAccounts.js
│   │   │   │   ├── AdminBeaches.js
│   │   │   │   ├── AdminBookings.js
│   │   │   │   ├── AdminReviews.js
│   │   │   │   ├── Dashboard.js
│   │   │   │   └── Login.js
│   │   │   └── public/
│   │   │       ├── BeachDetail.js
│   │   │       ├── Beaches.js
│   │   │       ├── Booking.js
│   │   │       ├── Bookmarks.js
│   │   │       ├── Compare.js
│   │   │       ├── Home.js
│   │   │       └── Reviews.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                    # Express Backend
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── admins.js
│   │   ├── auth.js
│   │   ├── beaches.js
│   │   ├── bookings.js
│   │   ├── bookmarks.js
│   │   ├── dashboard.js
│   │   └── reviews.js
│   ├── .env
│   ├── index.js
│   └── package.json
│
└── uploads/                   # Uploaded files
    └── beaches/
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (via XAMPP or standalone)
- npm or yarn

### Database Setup
The system uses the existing `beach_comparison` MySQL database. Make sure it's running.

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server (development)
npm run dev

# Or start in production
npm start
```

The API will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

The React app will run on `http://localhost:3000`

## 🔐 Default Admin Credentials
- **Username:** admin
- **Password:** admin123

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token

### Beaches
- `GET /api/beaches` - Get all beaches
- `GET /api/beaches/featured` - Get featured beaches
- `GET /api/beaches/stats` - Get statistics
- `GET /api/beaches/:id` - Get single beach
- `POST /api/beaches` - Create beach (Admin)
- `PUT /api/beaches/:id` - Update beach (Admin)
- `DELETE /api/beaches/:id` - Delete beach (Admin)

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/beach/:beachId` - Get reviews for beach
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review (Admin)

### Bookings
- `GET /api/bookings` - Get all bookings (Admin)
- `GET /api/bookings/stats` - Get booking stats (Admin)
- `GET /api/bookings/:id` - Get single booking (Admin)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update status (Admin)
- `DELETE /api/bookings/:id` - Delete booking (Admin)

### Bookmarks
- `GET /api/bookmarks` - Get user bookmarks
- `POST /api/bookmarks/toggle` - Toggle bookmark
- `GET /api/bookmarks/check/:beachId` - Check if bookmarked

### Dashboard (Admin)
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/recent-beaches` - Recent beaches
- `GET /api/dashboard/recent-reviews` - Recent reviews
- `GET /api/dashboard/recent-bookings` - Recent bookings
- `GET /api/dashboard/booking-trend` - Booking trend chart data

### Admin Accounts
- `GET /api/admins` - Get all admins
- `POST /api/admins` - Create admin
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin

## 🎨 Tech Stack

### Frontend
- React 18
- React Router v6
- React Bootstrap
- React Icons
- Chart.js + react-chartjs-2
- Axios
- React Toastify

### Backend
- Express.js
- MySQL2
- JSON Web Tokens (JWT)
- bcryptjs
- Multer (file uploads)
- CORS

## 📱 Features

### Public Features
- 🏖️ Browse beaches with filters and search
- ⚖️ Compare up to 3 beaches side-by-side
- 🔖 Bookmark favorite beaches
- 📅 Book beach visits
- ⭐ Read and write reviews
- 📱 Fully responsive design

### Admin Features
- 📊 Dashboard with statistics and charts
- 🏖️ Manage beaches (CRUD)
- 📅 Manage bookings (approve/decline)
- ⭐ Manage reviews
- 👤 Manage admin accounts
- 🔐 JWT authentication

## 🔧 Environment Variables

### Server (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=beach_comparison
JWT_SECRET=your_secret_key
PORT=5000
```

## 📝 License
MIT License - AllenShores PH © 2024
