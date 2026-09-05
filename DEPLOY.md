# AllenShores Deployment Guide

## Requirements

1. [Vercel](https://vercel.com) account
2. [Vercel CLI](https://vercel.com/docs/cli) (optional but recommended)
3. Remote MySQL database (Vercel cannot connect to your local XAMPP MySQL)

## Important: Database

Vercel is serverless and cannot reach your local XAMPP MySQL. You need a publicly-accessible MySQL database such as:
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com)
- [Aiven](https://aiven.io)
- [AWS RDS](https://aws.amazon.com/rds/)
- [FreeSQLdatabase](https://www.freesqldatabase.com/)

After creating the remote database, import your current `beach_comparison` database schema and data, then set the environment variables below.

## Backend Deployment (server/)

1. Create a new project on Vercel and link it to the `server/` directory.

2. Add the following Environment Variables in Vercel Project Settings:

```
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=beach_comparison
DB_PORT=3306
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

3. Deploy:

```bash
cd server
vercel --prod
```

4. After deployment, Vercel will give you a URL like `https://your-backend-url.vercel.app`.

## Frontend Deployment (client/)

1. Update `client/.env.production` with your actual backend URL:

```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

2. Create a new project on Vercel and link it to the `client/` directory.

3. Deploy:

```bash
cd client
vercel --prod
```

4. After deployment, Vercel will give you a URL like `https://your-frontend-url.vercel.app`.

## Environment Variables Summary

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `mysql.example.com` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `password` |
| `DB_NAME` | Database name | `beach_comparison` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_SSL` | Use SSL | `true` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |
| `EMAIL_USER` | Gmail address | `you@gmail.com` |
| `EMAIL_PASS` | Gmail App Password | `abcd efgh ijkl mnop` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://your-backend-url.vercel.app/api` |

## Important Notes

- Do **NOT** commit `.env` files. They are already in `.gitignore`.
- Set environment variables in the Vercel dashboard, not in the code.
- Make sure your remote MySQL allows connections from Vercel's IP ranges or is set to allow all hosts (`%`).
- Uploads: `multer` stores files in `/tmp` on Vercel, which is temporary. For production, use a cloud storage service like Cloudinary, AWS S3, or Supabase Storage.
- CORS is enabled for all origins in the backend (`app.use(cors())`).

## Post-Deployment

1. Visit `https://your-backend-url.vercel.app/api/health` to verify the backend is running.
2. Visit `https://your-frontend-url.vercel.app` to use the app.
3. Login to `/admin/login` with your admin credentials.

## Troubleshooting

### "Cannot connect to database"
- Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSL
- Make sure your database is publicly accessible
- Whitelist Vercel IPs if needed

### "CORS error"
- Make sure `REACT_APP_API_URL` matches your actual backend URL
- Make sure it includes `/api` at the end

### "Uploads not working"
- Vercel's filesystem is read-only except `/tmp`
- Use Cloudinary or S3 for production uploads
