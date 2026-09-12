# Vercel Domain Setup Guide for AllenShores

## 📋 Checklist para sa Production Deployment

### 1. Environment Variables sa Vercel Dashboard

#### Client (Frontend) Project
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```
O kung same domain:
```
REACT_APP_API_URL=https://yourdomain.com/api
```

#### Server (Backend) Project
```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=https://yourdomain.com

# Email Configuration (for booking emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Domain Configuration

#### Option A: Separate Subdomains (Recommended)
- **Frontend**: `www.yourdomain.com` or `yourdomain.com`
- **Backend**: `api.yourdomain.com`

**Steps:**
1. Sa Vercel Dashboard ng Client project:
   - Go to Settings → Domains
   - Add: `yourdomain.com` at `www.yourdomain.com`

2. Sa Vercel Dashboard ng Server project:
   - Go to Settings → Domains
   - Add: `api.yourdomain.com`

3. Update `.env.production` sa client:
   ```
   REACT_APP_API_URL=https://api.yourdomain.com/api
   ```

#### Option B: Single Domain with Path
- **Frontend**: `yourdomain.com`
- **Backend**: `yourdomain.com/api`

**Note**: Mas complex ang setup nito, recommended ang Option A.

### 3. CORS Configuration

I-verify na tama ang CORS settings sa server. Check `server/index.js`:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 4. Update Production Environment File

Update `client/.env.production`:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### 5. Database Setup

Ensure PostgreSQL database is accessible:
- Use Vercel Postgres, Supabase, or Neon
- Update `DATABASE_URL` sa Vercel environment variables
- Run migrations kung kailangan

### 6. Testing Checklist

After deployment, i-test ang mga features:

#### Owner Booking Actions:
- [ ] View booking details
- [ ] Send email to guest (Thank You, Reminder, Re-Schedule, Custom)
- [ ] Update booking status (Pending, Confirmed, Cancelled)
- [ ] Delete booking
- [ ] Check email delivery

#### General Features:
- [ ] Login (Admin & Owner)
- [ ] Dashboard stats
- [ ] Beach management
- [ ] Image uploads (Cloudinary)
- [ ] Reviews
- [ ] Reports

### 7. Deployment Commands

#### Deploy Client:
```bash
cd client
npm run build
vercel --prod
```

#### Deploy Server:
```bash
cd server
vercel --prod
```

### 8. Post-Deployment

1. **Test API Endpoints**:
   ```bash
   curl https://api.yourdomain.com/api/beaches
   ```

2. **Check Browser Console** for any CORS or API errors

3. **Test Booking Actions**:
   - Login as owner
   - Go to Bookings page
   - Test all action buttons

4. **Monitor Logs**:
   - Vercel Dashboard → Deployments → View Function Logs
   - Check for any errors

### 9. Common Issues & Solutions

#### Issue: "Network Error" sa booking actions
**Solution**: 
- Check if `REACT_APP_API_URL` is correct
- Verify CORS settings
- Check Vercel function logs

#### Issue: Email not sending
**Solution**:
- Verify EMAIL_* environment variables
- Check if Gmail "App Password" is used (not regular password)
- Enable "Less secure app access" or use App Password

#### Issue: Images not uploading
**Solution**:
- Verify Cloudinary credentials
- Check file size limits (Vercel has 4.5MB limit for serverless functions)

#### Issue: 401 Unauthorized
**Solution**:
- Check if JWT_SECRET is set
- Verify token is being sent in Authorization header
- Check token expiration

### 10. Environment Variables Template

Copy this to Vercel Dashboard:

**Client Project:**
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

**Server Project:**
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

## 🚀 Quick Deployment Steps

1. **Setup Domain sa Vercel**
   - Client: `yourdomain.com`
   - Server: `api.yourdomain.com`

2. **Add Environment Variables** sa both projects

3. **Update `.env.production`** sa client folder

4. **Deploy both projects**:
   ```bash
   # Client
   cd client && vercel --prod
   
   # Server
   cd ../server && vercel --prod
   ```

5. **Test booking actions** sa production URL

---

## 📞 Support

Kung may issues pa, check:
- Vercel Function Logs
- Browser Console (F12)
- Network Tab (F12 → Network)

**Current Setup:**
- Client: https://allenshores-client.vercel.app
- Server: https://allenshoresph.vercel.app

**Target Setup (with domain):**
- Client: https://yourdomain.com
- Server: https://api.yourdomain.com
