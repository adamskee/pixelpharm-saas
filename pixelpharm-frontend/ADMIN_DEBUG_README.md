# PixelPharm Admin & Debug Tools

This document provides comprehensive documentation for all admin, debugging, and testing tools available in the PixelPharm SaaS platform.

## 🎯 Quick Access URLs

### Debug Pages (Frontend Interfaces)
- **Main Debug Console**: `/debug/signin-test` - Primary debug interface for user management
- **Subscription Fixer**: `/debug/fix-subscription` - Fix subscription status issues

### API Endpoints (Backend Services)

#### User Management & Authentication
- `POST /api/debug/check-user-password` - Check user password status and validation
- `POST /api/debug/create-user` - Create new user account manually
- `POST /api/debug/create-user-from-stripe` - Create user from Stripe payment session
- `POST /api/debug/fix-user-passwords` - Check and migrate user password fields
- `GET /api/debug/user-status` - Get comprehensive user status information
- `POST /api/debug/user-status-custom` - Custom user status checks
- `GET /api/debug/user-data` - Retrieve detailed user data

#### Subscription & Payment Management
- `POST /api/debug/fix-user-pro` - Manually upgrade user to pro status
- `POST /api/debug/fix-user-subscription` - Fix subscription status issues
- `GET /api/debug/recent-stripe-sessions` - View recent Stripe payment sessions

#### System Health
- `GET /api/debug/database-connection` - Test database connectivity

## 🛠️ Debug Interface: `/debug/signin-test`

The main debug console provides a comprehensive interface for troubleshooting user signup and authentication issues.

### Features:

#### 1. Check Specific User
**Input**: Email address and optional password
**Function**: Validates user existence, password hash status, and account details

**Use Cases**:
- Verify if user exists in database
- Check password hash integrity
- Validate authentication credentials
- Troubleshoot login issues

#### 2. Check All Users
**Function**: Scans all credential-based users for password hash issues

**Use Cases**:
- System-wide password migration audits
- Identify users with missing password hashes
- Bulk user status verification

#### 3. 🚨 Recovery Tool
**Input**: Stripe session ID (cs_...) or email/password combination
**Function**: Creates missing user accounts from successful Stripe payments

**Use Cases**:
- Fix "User not found" errors after successful payment
- Recover accounts lost due to webhook failures
- Manual account creation for paid users

## 📊 API Endpoint Details

### Authentication Debugging

#### `POST /api/debug/check-user-password`
```json
{
  "email": "user@example.com",
  "password": "optional-for-testing"
}
```
**Returns**: User details, password validation status, account information

#### `POST /api/debug/fix-user-passwords`
```json
{}
```
**Returns**: List of users needing password migration, system status

### Subscription Management

#### `POST /api/debug/create-user-from-stripe`
```json
{
  "sessionId": "cs_live_...",
  "email": "user@example.com",
  "password": "user-password"
}
```
**Returns**: Created user details, subscription status

#### `POST /api/debug/fix-user-subscription`
```json
{
  "email": "user@example.com",
  "subscriptionPlan": "pro",
  "subscriptionStatus": "active"
}
```
**Returns**: Updated user subscription details

### System Information

#### `GET /api/debug/database-connection`
**Returns**: Database connectivity status and health information

#### `GET /api/debug/recent-stripe-sessions`
**Returns**: Recent Stripe checkout sessions for debugging payments

## 🔧 Common Troubleshooting Scenarios

### Scenario 1: User Paid But Can't Sign In
**Problem**: User completed Stripe payment but receives "User not found" error
**Solution**: 
1. Go to `/debug/signin-test`
2. Use the Recovery Tool with the Stripe session ID
3. Verify user creation and subscription status

### Scenario 2: Pro User Showing as Free Plan
**Problem**: Paid user shows limited features and free plan status
**Investigation**:
1. Check user with `/api/debug/check-user-password`
2. Verify subscription fields: `subscriptionPlan` and `subscriptionStatus`
3. Use `/api/debug/fix-user-subscription` if needed

### Scenario 3: Password Authentication Issues
**Problem**: Users can't sign in with correct credentials
**Investigation**:
1. Use "Check Specific User" in debug console
2. Verify passwordHash field exists and is properly formatted (should start with `$2b$`)
3. Use "Check All Users" to identify system-wide issues

### Scenario 4: Webhook Processing Failures
**Problem**: Stripe payments successful but users not created
**Investigation**:
1. Check `/api/debug/recent-stripe-sessions` for payment records
2. Verify webhook endpoint configuration in Stripe dashboard
3. Use Recovery Tool to manually create missing users

## 🔍 Database Schema Reference

### User Model Key Fields:
- `userId` - Primary identifier
- `email` - User email (unique)
- `passwordHash` - bcrypt hashed password (required for credentials provider)
- `provider` - Authentication provider ('credentials', 'google')
- `subscriptionPlan` - Current plan ('free', 'basic', 'pro', 'elite')
- `subscriptionStatus` - Subscription status ('active', 'inactive', 'cancelled')
- `planType` - Plan type enum (legacy field)
- `uploadsUsed` - Number of uploads consumed
- `stripeCustomerId` - Stripe customer identifier
- `stripeSubscriptionId` - Stripe subscription identifier

### Plan Limits:
- **Free**: 1 upload, 3 biomarkers
- **Basic**: 10 uploads, unlimited biomarkers  
- **Pro**: 20 uploads, unlimited biomarkers
- **Elite**: Unlimited uploads and biomarkers

## 🚨 Emergency Procedures

### Complete User Recovery
If a user is completely lost after payment:
1. Find Stripe session ID from Stripe dashboard
2. Use Recovery Tool in debug console
3. Verify user creation and subscription activation
4. Test login functionality

### Bulk User Migration
For system-wide password issues:
1. Run "Check All Users" to identify affected accounts
2. Use `/api/debug/fix-user-passwords` for assessment
3. Contact users to reset passwords if needed

### Subscription Status Fixes
For users with subscription issues:
1. Verify payment in Stripe dashboard
2. Use `/api/debug/fix-user-subscription` to correct status
3. Verify plan limits and features work correctly

## 📈 Monitoring & Logging

### Console Logs to Monitor:
- `💳 Active subscription detected` - Successful subscription recognition
- `🎯 Google OAuth user detected` - Legacy user access grants
- `⚠️ No planType found` - Users defaulting to free plan
- `🔐 Generated new password hash` - Password creation events
- `✅ User created successfully` - Successful user creation

### Error Patterns:
- `❌ No user found with userId` - Missing user accounts
- `⚠️ Could not fetch user plan` - Database connectivity issues
- `🚨 Recovery Tool` usage - Manual intervention required

## 🔒 Security Considerations

### Access Control
- Debug endpoints should only be accessible in development/staging environments
- Production access should be restricted to authorized personnel
- Consider IP whitelisting for sensitive debug endpoints

### Data Handling
- Never log actual passwords or sensitive data
- Stripe session IDs contain sensitive information
- User emails and IDs should be handled with care

### Best Practices
- Always verify user consent before making account changes
- Log all administrative actions for audit trails
- Use secure methods for password resets and account recovery

## 📞 Support Workflow

### For Customer Support:
1. Start with `/debug/signin-test` for user-specific issues
2. Check subscription status and payment history
3. Use Recovery Tool only when payment is confirmed
4. Document all actions taken for user records

### For Development Team:
1. Monitor system logs for error patterns
2. Use bulk tools for identifying systemic issues
3. Implement fixes based on debug tool insights
4. Update documentation when new tools are added

---

## 🔄 Maintenance Notes

This documentation should be updated when:
- New debug endpoints are added
- API parameters change
- New troubleshooting scenarios are discovered
- Database schema modifications affect user management

**Last Updated**: February 2025
**Version**: 1.0
**Maintainer**: Development Team