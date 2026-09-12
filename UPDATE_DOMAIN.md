# 🚀 Quick Guide: I-update ang Domain

## Kapag may custom domain na (e.g., allenshores.com)

### Step 1: Update Environment Variables sa Vercel

#### Sa Client Project (Frontend):
1. Go to Vercel Dashboard → Your Client Project → Settings → Environment Variables
2. Add or update:
   ```
   REACT_APP_API_URL=https://api.allenshores.com/api
   ```
   (Palitan ang `allenshores.com` ng actual domain mo)

#### Sa Server Project (Backend):
1. Go to Vercel Dashboard → Your Server Project → Settings → Environment Variables
2. Add or update:
   ```
   CLIENT_URL=https://allenshores.com
   ```
   (Palitan ang `allenshores.com` ng actual domain mo)

### Step 2: Update CORS sa Server

Edit `server/index.js`, line 20-24:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://allenshores-client.vercel.app',
  'https://allenshoresph.vercel.app',
  'https://allenshores.com',           // ← Add your domain
  'https://www.allenshores.com',       // ← Add www version
  'https://api.allenshores.com',       // ← Add api subdomain
  process.env.CLIENT_URL
].filter(Boolean);
```

### Step 3: Update Production Environment File

Edit `client/.env.production`:

```env
REACT_APP_API_URL=https://api.allenshores.com/api
```

### Step 4: Add Domains sa Vercel

#### Client Project:
1. Go to Settings → Domains
2. Add domain:
   - `allenshores.com`
   - `www.allenshores.com`

#### Server Project:
1. Go to Settings → Domains
2. Add domain:
   - `api.allenshores.com`

### Step 5: Configure DNS

Sa domain registrar mo (e.g., Namecheap, GoDaddy):

#### Para sa Client (allenshores.com):
```
Type: A
Host: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

#### Para sa API (api.allenshores.com):
```
Type: CNAME
Host: api
Value: cname.vercel-dns.com
```

### Step 6: Redeploy

```bash
# Redeploy client
cd client
vercel --prod

# Redeploy server
cd ../server
vercel --prod
```

### Step 7: Test

1. Open `https://allenshores.com`
2. Login as owner
3. Go to Bookings
4. Test all actions:
   - ✅ View booking
   - ✅ Send email
   - ✅ Update status
   - ✅ Delete booking

---

## ⚡ One-Line Updates

Kung naka-setup na lahat, i-update lang:

1. **Vercel Client Env**: `REACT_APP_API_URL=https://api.yourdomain.com/api`
2. **Vercel Server Env**: `CLIENT_URL=https://yourdomain.com`
3. **server/index.js**: Add domain sa `allowedOrigins` array
4. **Redeploy**: `vercel --prod`

---

## 🔍 Troubleshooting

### Issue: CORS Error
- Check if domain is added sa `allowedOrigins` sa `server/index.js`
- Redeploy server after updating

### Issue: API not found (404)
- Check if `REACT_APP_API_URL` is correct
- Verify API subdomain is pointing to server project

### Issue: Booking actions not working
- Open browser console (F12)
- Check Network tab for failed requests
- Verify authorization token is being sent

---

## 📝 Current vs Target Setup

### Current (Vercel Default):
```
Client:  https://allenshores-client.vercel.app
Server:  https://allenshoresph.vercel.app
```

### Target (Custom Domain):
```
Client:  https://allenshores.com
Server:  https://api.allenshores.com
```

### API Endpoint Examples:
```
GET  https://api.allenshores.com/api/beaches
GET  https://api.allenshores.com/api/owner/bookings
POST https://api.allenshores.com/api/owner/bookings/123/email
PUT  https://api.allenshores.com/api/owner/bookings/123/status
```

---

**Note**: Palitan ang `allenshores.com` ng actual domain mo sa lahat ng examples! 🎯
