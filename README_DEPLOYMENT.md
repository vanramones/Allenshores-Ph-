# 🌊 AllenShores - Production Deployment Guide

## 📦 Mga Ginawa (What Was Fixed)

### Booking Actions Improvements ✅
1. **Updated UI** - Mas organized ang action buttons
   - View (👁️) - View booking details
   - Email (✉️) - Send emails to guests
   - More Actions (⋮) - Status updates & delete

2. **Email Templates** - 3 pre-made templates + custom
   - Thank You email
   - Re-Schedule email  
   - Reminder email
   - Custom message

3. **Better Organization** - Delete action moved to dropdown menu

4. **CORS Configuration** - Ready for custom domain

---

## 🚀 Deployment Steps (Pag may Domain na)

### Quick Steps:
1. **Add Domain sa Vercel**
   - Client: `yourdomain.com`
   - Server: `api.yourdomain.com`

2. **Set Environment Variables**
   - Client: `REACT_APP_API_URL=https://api.yourdomain.com/api`
   - Server: `CLIENT_URL=https://yourdomain.com` + email settings

3. **Update CORS** sa `server/index.js`
   - Add your domain sa `allowedOrigins` array

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Test** - Login as owner, test booking actions

---

## 📚 Documentation Files

### 1. `VERCEL_DOMAIN_SETUP.md`
Complete guide for setting up custom domain
- Environment variables
- Domain configuration
- CORS setup
- Testing checklist
- Troubleshooting

### 2. `UPDATE_DOMAIN.md`
Quick reference for updating domain
- One-line updates
- DNS configuration
- Common issues

### 3. `BOOKING_ACTIONS_CHECKLIST.md`
Detailed testing checklist
- Pre-deployment checks
- Post-deployment testing
- Email delivery testing
- Browser compatibility

---

## 🔧 Current Configuration

### Local Development
```
Client:  http://localhost:3000
Server:  http://localhost:5000
```

### Vercel (Current)
```
Client:  https://allenshores-client.vercel.app
Server:  https://allenshoresph.vercel.app
```

### Production (Target with Domain)
```
Client:  https://yourdomain.com
Server:  https://api.yourdomain.com
```

---

## ✅ Booking Actions Features

### For Caba Villa Diaz Beach & Tonying Beach Owners:

1. **View Booking** (👁️)
   - See complete booking details
   - Guest information
   - Visit date and number of people
   - Booking status

2. **Send Email** (✉️)
   - **Thank You** - After guest visit
   - **Re-Schedule** - Request date change
   - **Reminder** - Upcoming visit reminder
   - **Custom** - Write your own message
   - Beautiful HTML email template with beach logo
   - Includes "Book More" and "Edit Booking" links

3. **Update Status** (⋮ → Status)
   - Mark as Pending (yellow)
   - Mark as Confirmed (green)
   - Mark as Cancelled (red)

4. **Delete Booking** (⋮ → Delete)
   - Remove booking permanently
   - Confirmation modal to prevent accidents

---

## 🔐 Required Environment Variables

### Server (Backend)
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=https://yourdomain.com

# Email (REQUIRED for booking emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client (Frontend)
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## 🧪 Testing Checklist

### Before Going Live:
- [ ] Login works (admin & owner)
- [ ] Dashboard loads correctly
- [ ] Bookings list displays
- [ ] View booking modal works
- [ ] Email sending works (test all templates)
- [ ] Status updates work
- [ ] Delete booking works
- [ ] Images upload correctly
- [ ] No console errors
- [ ] Mobile responsive

### Email Testing:
- [ ] Gmail app password configured
- [ ] Test email delivery
- [ ] Check spam folder
- [ ] Verify HTML formatting
- [ ] Test links in email

---

## 🐛 Common Issues & Solutions

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: 
1. Add domain sa `allowedOrigins` sa `server/index.js`
2. Redeploy server: `vercel --prod`

### Issue: Email Not Sending
```
Failed to send email
```
**Solution**:
1. Use Gmail App Password (not regular password)
2. Enable 2FA on Gmail
3. Generate App Password: https://myaccount.google.com/apppasswords
4. Update `EMAIL_PASS` sa Vercel environment variables

### Issue: 401 Unauthorized
```
Request failed with status code 401
```
**Solution**:
1. Check if JWT_SECRET is set
2. Clear browser localStorage
3. Login again

### Issue: Images Not Uploading
```
Upload failed
```
**Solution**:
1. Verify Cloudinary credentials
2. Check file size (max 5MB)
3. Check allowed formats (jpg, png, gif, webp)

---

## 📱 API Endpoints

### Booking Actions Endpoints:
```
GET    /api/owner/bookings              - Get all bookings
GET    /api/owner/bookings?status=pending&search=john
PUT    /api/owner/bookings/:id/status   - Update status
POST   /api/owner/bookings/:id/email    - Send email
DELETE /api/owner/bookings/:id          - Delete booking
```

### Example Request (Send Email):
```javascript
POST https://api.yourdomain.com/api/owner/bookings/123/email
Headers: {
  Authorization: Bearer <owner_token>
  Content-Type: application/json
}
Body: {
  subject: "Thank You for Visiting!",
  message: "We hope you enjoyed your stay..."
}
```

---

## 🎯 Next Steps

1. **Get Custom Domain** (e.g., allenshores.com)
2. **Configure DNS** (point to Vercel)
3. **Update Environment Variables** (both client & server)
4. **Update CORS** (add domain to allowedOrigins)
5. **Deploy to Production** (vercel --prod)
6. **Test All Features** (use checklist)
7. **Monitor Logs** (check for errors)

---

## 📞 Support & Resources

### Documentation:
- Vercel Docs: https://vercel.com/docs
- Cloudinary Docs: https://cloudinary.com/documentation
- Gmail SMTP: https://support.google.com/mail/answer/7126229

### Vercel Dashboard:
- Client Project: https://vercel.com/dashboard
- Server Project: https://vercel.com/dashboard
- View Logs: Deployments → Function Logs

### Testing Tools:
- Browser Console: F12
- Network Tab: F12 → Network
- Postman: Test API endpoints
- MailTrap: Test emails (dev)

---

## 🎉 Summary

**Tapos na ang booking actions!** Ready na for production deployment. 

**Mga Features:**
✅ View booking details  
✅ Send beautiful emails (4 templates)  
✅ Update booking status  
✅ Delete bookings  
✅ Search & filter  
✅ Mobile responsive  
✅ Secure authentication  

**Para sa Production:**
1. Setup custom domain
2. Configure environment variables
3. Update CORS
4. Deploy
5. Test

**Kung may tanong pa, check ang:**
- `VERCEL_DOMAIN_SETUP.md` - Complete setup guide
- `UPDATE_DOMAIN.md` - Quick reference
- `BOOKING_ACTIONS_CHECKLIST.md` - Testing checklist

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2026-09-10  
**Version**: 1.0.0
