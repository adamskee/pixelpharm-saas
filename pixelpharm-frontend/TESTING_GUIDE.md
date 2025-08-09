# User Access Testing Guide

## Current User Plan Assignments (from database)

Based on the test script results, here are your current users:

### FREE Plan Users (Should see max 3 biomarkers)
- `adam.piro@dta.gov.au` - Anonymous user, 22 total biomarkers → Should show 3
- `tribalcollective@gmail.com` - Regular user, 0 biomarkers → Should show 0  
- `105941927608135147952-1754133755601@demo.pixelpharm.com` - Google user, 14 total biomarkers → Should show 3
- `supercharbot@gmail.com` - Google user, 0 biomarkers → Should show 0

### BASIC Plan Users (Should see all biomarkers)
- `jedimaster@pixelpharm.com` - 35 total biomarkers → Should show all 35

### PRO Plan Users (Should see all biomarkers)  
- `adamskee@gmail.com` - 0 biomarkers → Should show 0
- `user-117355393393976327622@temp.com` - 18 total biomarkers → Should show all 18
- `princess@pixelpharm.com` - 54 total biomarkers → Should show all 54
- `100648025502020106177-1754137454479@demo.pixelpharm.com` - 22 total biomarkers → Should show all 22
- `adampiro@gmail.com` - 0 biomarkers → Should show 0

## Manual Testing Steps

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Key Users

#### Test FREE Plan Limitation
**User: `adam.piro@dta.gov.au` (Anonymous, 22 biomarkers)**
1. Sign in as this user
2. Go to Health Analytics dashboard
3. **Expected**: Should see only 3 biomarkers with upgrade prompt
4. **Check**: Console logs should show "Applied FREE plan limit: 22 → 3 biomarkers"

**User: `105941927608135147952-1754133755601@demo.pixelpharm.com` (Google, 14 biomarkers)**
1. Sign in as this user
2. Go to Health Analytics dashboard  
3. **Expected**: Should see only 3 biomarkers with upgrade prompt
4. **Check**: Console logs should show "Applied FREE plan limit: 14 → 3 biomarkers"

#### Test BASIC Plan Access
**User: `jedimaster@pixelpharm.com` (35 biomarkers)**
1. Sign in as this user
2. Go to Health Analytics dashboard
3. **Expected**: Should see all 35 biomarkers
4. **Check**: Console logs should show "BASIC user: showing all 35 biomarkers"

#### Test PRO Plan Access
**User: `princess@pixelpharm.com` (54 biomarkers)**
1. Sign in as this user
2. Go to Health Analytics dashboard
3. **Expected**: Should see all 54 biomarkers
4. **Check**: Console logs should show "PRO user: showing all 54 biomarkers"

### 3. Check API Endpoints Directly

#### Plan Status API
```bash
# Test FREE user
curl "http://localhost:3000/api/user/plan-status?userId=adam.piro@dta.gov.au"

# Test BASIC user  
curl "http://localhost:3000/api/user/plan-status?userId=jedimaster@pixelpharm.com"

# Test PRO user
curl "http://localhost:3000/api/user/plan-status?userId=princess@pixelpharm.com"
```

#### Biomarkers API
```bash
# Test FREE user (should return max 3)
curl "http://localhost:3000/api/user/biomarkers?userId=adam.piro@dta.gov.au"

# Test BASIC user (should return all 35)
curl "http://localhost:3000/api/user/biomarkers?userId=jedimaster@pixelpharm.com"

# Test PRO user (should return all 54)
curl "http://localhost:3000/api/user/biomarkers?userId=princess@pixelpharm.com"
```

### 4. Admin Panel Verification

1. Go to `/admin` (login: `admin@pixelpharm.com` / `PixelPharmAdmin2025!`)
2. Check "Users" tab
3. **Verify**:
   - User plan types are correctly displayed
   - Biomarker counts match expected values
   - Stats show: 1 BASIC, 5 PRO, 4 FREE users

### 5. Console Log Monitoring

When testing, watch browser console for these logs:

#### Plan Detection Logs
```javascript
✅ Using planType: FREE → free
🎯 Google OAuth user detected, granting PRO access  
⚠️ No planType found, defaulting to free
```

#### Biomarker Filtering Logs
```javascript
🔬 Applied FREE plan limit: 22 → 3 biomarkers
🔬 PRO user: showing all 54 biomarkers
🔬 BASIC user: showing all 35 biomarkers
🔬 Unknown plan (undefined), applied FREE plan limit: 14 → 3 biomarkers
```

### 6. Expected Test Results

| User | Plan | Total Biomarkers | Should Display | Notes |
|------|------|-----------------|----------------|--------|
| adam.piro@dta.gov.au | FREE | 22 | 3 | Anonymous user |
| 105941927608135147952@demo.pixelpharm.com | FREE | 14 | 3 | Google demo user |
| jedimaster@pixelpharm.com | BASIC | 35 | 35 | Recently updated |
| princess@pixelpharm.com | PRO | 54 | 54 | Power user |
| user-117355393393976327622@temp.com | PRO | 18 | 18 | Google OAuth |

### 7. Troubleshooting

#### If FREE users see all biomarkers:
- Check plan detection in biomarkers API
- Verify planType is correctly set in database
- Check console logs for plan detection logic

#### If PRO/BASIC users see only 3:
- Check planType field in database  
- Verify plan detection logic includes 'basic' and 'pro'
- Check for API errors in network tab

#### If APIs return HTTP 500:
- Check server logs for Prisma errors
- Verify database connection
- Check for missing/incorrect field names

## Quick Verification Commands

### Check database plan assignments:
```sql
SELECT email, plan_type, provider, is_anonymous, 
       (SELECT COUNT(*) FROM biomarker_values WHERE user_id = users.user_id) as biomarker_count
FROM users 
ORDER BY plan_type, email;
```

### Test with curl:
```bash
# Start server first: npm run dev

# Test each plan type
curl -s "http://localhost:3000/api/user/biomarkers?userId=adam.piro@dta.gov.au" | jq '.count'  # Should be 3
curl -s "http://localhost:3000/api/user/biomarkers?userId=jedimaster@pixelpharm.com" | jq '.count'  # Should be 35
curl -s "http://localhost:3000/api/user/biomarkers?userId=princess@pixelpharm.com" | jq '.count'  # Should be 54
```