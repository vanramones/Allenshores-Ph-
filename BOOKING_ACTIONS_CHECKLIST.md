# ✅ Booking Actions Production Checklist

## Pre-Deployment Checklist

### 1. Code Changes ✅
- [x] Updated booking actions UI (FaEllipsisV icon)
- [x] Reorganized actions dropdown menu
- [x] Added proper titles and labels
- [x] Moved delete action to dropdown

### 2. API Endpoints (Already Working)
- [x] `GET /api/owner/bookings` - Fetch bookings
- [x] `PUT /api/owner/bookings/:id/status` - Update status
- [x] `POST /api/owner/bookings/:id/email` - Send email
- [x] `DELETE /api/owner/bookings/:id` - Delete booking

### 3. Email Templates (Already Implemented)
- [x] Thank You email
- [x] Re-Schedule email
- [x] Reminder email
- [x] Custom email with rich HTML template

---

## Domain Setup Checklist

### 1. Environment Variables

#### Client (Vercel Dashboard)
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```
- [ ] Added to Vercel environment variables
- [ ] Updated `.env.production` file
- [ ] Redeployed after changes

#### Server (Vercel Dashboard)
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://yourdomain.com

# Email Configuration (REQUIRED for booking emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (for beach images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
- [ ] All variables added to Vercel
- [ ] Email credentials tested
- [ ] Cloudinary credentials verified
- [ ] Redeployed after changes

### 2. CORS Configuration
- [x] Updated `server/index.js` with proper CORS
- [ ] Added custom domain to `allowedOrigins` array
- [ ] Tested CORS with production domain

### 3. Domain Configuration
- [ ] Client domain added: `yourdomain.com`
- [ ] WWW domain added: `www.yourdomain.com`
- [ ] API subdomain added: `api.yourdomain.com`
- [ ] DNS records configured
- [ ] SSL certificates active (auto by Vercel)

---

## Post-Deployment Testing

### Test as Owner (Caba Villa Diaz Beach)

#### 1. Login
- [ ] Navigate to `https://yourdomain.com/owner/login`
- [ ] Login with owner credentials
- [ ] Verify redirect to dashboard

#### 2. View Bookings
- [ ] Go to Bookings page
- [ ] Verify bookings list loads
- [ ] Check if all columns display correctly
- [ ] Test search functionality
- [ ] Test status filter
- [ ] Test sort options

#### 3. View Action (👁️)
- [ ] Click View button on a booking
- [ ] Verify modal opens
- [ ] Check all booking details display:
  - [ ] Guest name
  - [ ] Email
  - [ ] Phone
  - [ ] Visit date
  - [ ] Number of people
  - [ ] Status badge
  - [ ] Message (if any)
  - [ ] Booking timestamp

#### 4. Email Action (✉️)
- [ ] Click Email button
- [ ] Verify email modal opens
- [ ] Check guest info displays correctly
- [ ] Test "Thank You" template
  - [ ] Click template button
  - [ ] Verify subject auto-fills
  - [ ] Verify message auto-fills with correct data
- [ ] Test "Re-Schedule" template
  - [ ] Click template button
  - [ ] Verify content is correct
- [ ] Test "Reminder" template
  - [ ] Click template button
  - [ ] Verify content is correct
- [ ] Test "Custom" template
  - [ ] Click Custom button
  - [ ] Verify fields clear
  - [ ] Type custom subject and message
- [ ] Send test email
  - [ ] Click Send Email button
  - [ ] Verify success toast appears
  - [ ] Check recipient's inbox
  - [ ] Verify email formatting (HTML template)
  - [ ] Check beach logo displays
  - [ ] Verify "Book More" and "Edit Booking" links work

#### 5. Status Update Action (⋮)
- [ ] Click More Actions dropdown (three dots)
- [ ] Verify dropdown menu opens
- [ ] Test "Mark Pending"
  - [ ] Click option
  - [ ] Verify status updates in table
  - [ ] Refresh page and verify persistence
- [ ] Test "Mark Confirmed"
  - [ ] Click option
  - [ ] Verify status badge changes to green
- [ ] Test "Mark Cancelled"
  - [ ] Click option
  - [ ] Verify status badge changes to red

#### 6. Delete Action (🗑️)
- [ ] Click More Actions dropdown
- [ ] Click "Delete Booking" (red text)
- [ ] Verify confirmation modal appears
- [ ] Click Cancel - verify modal closes
- [ ] Click Delete Booking again
- [ ] Click Delete - verify booking is removed
- [ ] Verify booking no longer in list

### Test as Owner (Tonying Beach)
- [ ] Repeat all tests above for Tonying beach owner
- [ ] Verify beach-specific data is correct

---

## Browser Compatibility Testing

Test booking actions on:
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Edge (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (Mobile)

---

## Performance Testing

- [ ] Bookings page loads in < 2 seconds
- [ ] Email modal opens instantly
- [ ] Status updates reflect immediately
- [ ] No console errors
- [ ] No network errors (check F12 → Network tab)

---

## Security Testing

- [ ] Cannot access bookings without login
- [ ] Owner can only see their own beach bookings
- [ ] JWT token is sent with all requests
- [ ] 401 redirects to login page
- [ ] No sensitive data in console logs

---

## Email Delivery Testing

### Gmail Configuration
- [ ] Using Gmail App Password (not regular password)
- [ ] 2FA enabled on Gmail account
- [ ] App Password generated from Google Account settings
- [ ] EMAIL_USER and EMAIL_PASS set in Vercel

### Email Testing
- [ ] Send test email to Gmail
- [ ] Send test email to Yahoo
- [ ] Send test email to Outlook
- [ ] Check spam folders
- [ ] Verify email formatting on mobile
- [ ] Verify links work in email

---

## Error Handling Testing

- [ ] Test with invalid booking ID
- [ ] Test email with empty subject
- [ ] Test email with empty message
- [ ] Test with expired JWT token
- [ ] Test with slow internet connection
- [ ] Verify error messages are user-friendly

---

## Monitoring & Logs

### Vercel Function Logs
- [ ] Check for any errors in server logs
- [ ] Monitor email sending logs
- [ ] Check database query logs
- [ ] Verify no CORS errors

### Browser Console
- [ ] No JavaScript errors
- [ ] No failed API requests
- [ ] No CORS errors
- [ ] Proper error handling for failed requests

---

## Final Verification

- [ ] All booking actions work on production
- [ ] Emails are being delivered successfully
- [ ] Status updates persist correctly
- [ ] Delete functionality works
- [ ] No breaking errors in logs
- [ ] Mobile responsive design works
- [ ] Performance is acceptable

---

## Rollback Plan

If issues occur:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints directly (Postman/curl)
4. Rollback to previous deployment if needed
5. Check CORS configuration
6. Verify database connectivity

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Cloudinary Support**: https://support.cloudinary.com
- **Gmail SMTP Issues**: https://support.google.com/mail/answer/7126229

---

## Notes

- Email sending may take 1-5 seconds
- Status updates are immediate
- Delete action is permanent (no undo)
- All actions require owner authentication
- Beach logo in emails comes from beach image

---

**Last Updated**: 2026-09-10
**Status**: Ready for Production ✅
