# PixelPharm Health Analytics Platform

A comprehensive health analytics SaaS platform that processes medical documents (blood tests, body composition reports) using AI-powered OCR and provides detailed health analysis and insights.

## 🚀 Features

- **Multi-format Medical Document Processing**: Blood tests, body composition scans (InBody, DEXA), fitness activities
- **AI-Powered Analysis**: AWS Bedrock (Claude models) for intelligent document processing and health insights
- **Comprehensive Health Dashboard**: Track biomarkers, body composition trends, and health correlations
- **Subscription-based Access**: Basic and Pro plans with upload limits and feature access
- **Secure Authentication**: NextAuth.js with Google OAuth and credentials-based authentication
- **Real-time Processing**: Async file processing with status tracking and progress indicators

## 🛠 Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Zustand** for state management

### Backend & Database
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication
- **Stripe** for payments and subscriptions

### AI & Cloud Services
- **AWS Bedrock** (Claude 3 Haiku and Sonnet)
- **AWS Textract** for OCR processing
- **AWS S3** for file storage
- **Fallback Analysis** when AI services unavailable

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- AWS account with Bedrock, S3, Textract access
- Stripe account for payments
- Google OAuth credentials (optional)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adamskee/pixelpharm-saas.git
   cd pixelpharm-saas/pixelpharm-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/pixelpharm"

   # NextAuth.js
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # AWS Configuration
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="your-s3-bucket-name"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── ai/           # AI processing endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   ├── stripe/       # Payment processing
│   │   └── user/         # User management
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main application dashboard
│   ├── payment/          # Payment and subscription pages
│   └── body-composition/ # Body composition upload page
├── components/           # Reusable React components
│   ├── ui/              # Base UI components
│   ├── dashboard/       # Dashboard-specific components
│   └── upload/          # File upload components
├── lib/                 # Utility libraries and configurations
│   ├── auth/           # Authentication logic
│   ├── aws/            # AWS service integrations
│   ├── database/       # Database utilities
│   ├── medical/        # Medical analysis utilities
│   └── stripe/         # Stripe configuration
└── hooks/              # Custom React hooks
```

## 🚀 Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to database
npx prisma studio       # Open Prisma Studio

# Debug Utilities
node inspect-database.js        # Inspect database structure
node debug-biomarkers.js       # Debug biomarker storage
node test-biomarker-storage.js # Test biomarker functionality
```

## 🔐 Authentication System

### Dual Authentication Support
- **Credentials**: Email/password with bcrypt hashing
- **Google OAuth**: Seamless social authentication (configurable)

### Payment-First Signup Flow
1. Users select a plan and enter account details
2. Stripe checkout processes payment
3. Webhook creates user account with active subscription
4. Automatic signin redirects to dashboard

## 💾 Database Schema

### Key Models
- **Users**: Authentication and subscription data
- **FileUploads**: Upload tracking with processing status
- **BiomarkerValues**: Health metrics with reference ranges
- **BodyCompositionResults**: Body composition data
- **AIProcessingResults**: AI analysis results

### Upload Types
- `BLOOD_TESTS`: Laboratory blood work
- `BODY_COMPOSITION`: InBody, DEXA scans
- `FITNESS_ACTIVITIES`: Garmin Connect exports

## 🤖 AI Processing Pipeline

### Multi-Stage Processing
1. **File Upload**: Secure S3 upload with presigned URLs
2. **OCR Extraction**: AWS Textract or Bedrock vision analysis
3. **Data Processing**: Claude models extract structured health data
4. **Storage**: Normalized data stored in PostgreSQL
5. **Analysis**: Health insights and recommendations generation

### Fallback Strategy
- Primary: Claude 3 Haiku/Sonnet via AWS Bedrock
- Fallback: Local analysis when AI services unavailable
- Caching: 10-minute TTL for analysis results

## 💳 Subscription & Upload Limits

### Plan Types
- **Basic**: 5 uploads per month, basic analysis
- **Pro**: 20 uploads per 30 days, advanced features

### Upload Limit System
- Monthly limits for Basic plans
- Total limits for Pro plans (30-day rolling)
- Real-time usage tracking and validation

## 🔧 Recent Critical Fixes

### Body Composition Upload Issues (Fixed)
**Problem**: Upload button greyed out, 500 API errors

**Root Causes**:
1. **Database Query Issues**: Incorrect table/column names
   - Fixed: `prisma.fileUpload` → `prisma.file_uploads`
   - Fixed: `userId` → `user_id`, `uploadType` → `upload_type`

2. **Upload Type Filtering**: Only checked `BLOOD_TESTS`
   - Fixed: Now includes all types (`BLOOD_TESTS`, `BODY_COMPOSITION`, `FITNESS_ACTIVITIES`)

3. **Prisma Client Conflicts**: Multiple client instances
   - Fixed: Use shared singleton from `@/lib/database/client`

**Files Fixed**:
- `src/lib/subscription/upload-limits.ts`
- `src/app/api/user/upload-usage-custom/route.ts`
- `src/lib/auth/subscription-check.ts`

### Payment Flow Enhancements
- Fixed payment success page authentication
- Enhanced webhook handling for 100% discount coupons
- Improved error handling and debugging tools
- Disabled Google OAuth for production reliability

## 🐛 Debugging & Troubleshooting

### Available Debug Endpoints
- `/api/debug/test-upload-limits` - Test upload limits functionality
- `/api/debug/user-status` - Check user subscription status
- `/api/debug/manual-subscription-fix` - Manual subscription activation

### Common Issues
1. **Upload Button Disabled**: Check upload limits and authentication
2. **500 Errors**: Verify database connections and Prisma client usage
3. **Payment Issues**: Check Stripe webhook configuration
4. **Auth Problems**: Verify environment variables and session handling

## 📊 Monitoring & Analytics

### Built-in Analytics
- Upload statistics and processing success rates
- Subscription metrics and user engagement
- Error tracking and performance monitoring
- Health insights and biomarker trends

## 🔒 Security Features

- Server-side file processing with validation
- AWS credentials excluded from client bundle
- Secure session management with NextAuth.js
- CORS configuration for API endpoints
- Input sanitization and SQL injection prevention

## 🚀 Deployment

### Environment Requirements
- Node.js 18+ runtime
- PostgreSQL database
- AWS services configuration
- Stripe webhook endpoints

### Build Configuration
- ESLint and TypeScript checking for development
- Webpack optimization for AWS SDK
- Image optimization for S3 domains
- Security headers for API routes

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Email: support@pixelpharm.com
- Documentation: See `CLAUDE.md` for detailed development guidance

---

**Note**: This platform processes sensitive health information. Ensure compliance with HIPAA and other relevant healthcare data protection regulations in your deployment environment.