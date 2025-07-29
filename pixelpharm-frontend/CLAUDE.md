# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixelPharm is a health analytics SaaS platform that processes medical documents (blood tests, body composition reports) using AI-powered OCR and provides comprehensive health analysis. The frontend is built with Next.js 15 and integrates with AWS services (Bedrock, S3, Textract) for AI processing.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generation)
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint linting
- `prisma generate` - Generate Prisma client (runs automatically on build)

### Database Operations
Use the included utility scripts for database operations:
- `node inspect-database.js` - Inspect database structure and data
- `node debug-biomarkers.js` - Debug biomarker data storage
- `node test-biomarker-storage.js` - Test biomarker storage functionality

## Architecture Overview

### Core Systems
1. **Authentication**: Dual auth system supporting both Google OAuth and email/password via NextAuth.js
2. **AI Processing Pipeline**: Multi-stage document processing using AWS Bedrock (Claude models), Textract, and custom OCR
3. **Health Analytics**: Advanced biomarker analysis and medical review system with AI insights
4. **Data Storage**: PostgreSQL with Prisma ORM, comprehensive health data models

### Key Directories
- `src/app/api/` - API routes for all backend functionality
- `src/lib/aws/` - AWS service integrations (Bedrock, S3, Textract)
- `src/lib/medical/` - Medical analysis and review systems
- `src/lib/database/` - Database operations and utilities
- `src/components/` - React components organized by feature
- `prisma/` - Database schema and migrations

### Database Schema
The Prisma schema includes comprehensive health data modeling:
- User management with NextAuth.js integration
- File upload tracking and processing status
- Biomarker values with reference ranges and abnormality detection
- Body composition and fitness activity data
- AI processing results and medical reviews
- Health insights and recommendations

### AI Integration
- **Primary Models**: Claude 3 Haiku and Sonnet via AWS Bedrock
- **Fallback Strategy**: Multiple model fallbacks with local analysis when AI unavailable
- **Caching**: 10-minute TTL cache for health analysis results
- **Processing Types**: OCR, health analysis, and recommendation generation

## Configuration Notes

### Environment Variables Required
- AWS credentials and region configuration
- NextAuth.js configuration (Google OAuth + custom credentials)
- Database connection URL
- S3 bucket configuration for file uploads

### Build Configuration
- ESLint and TypeScript checking disabled during builds for deployment
- Webpack configuration optimized for AWS SDK (client-side exclusions)
- Security headers configured for API routes and general pages
- Image optimization configured for AWS S3 domains

### Key Features
- **Multi-format Upload Support**: PDF conversion to PNG for OCR processing
- **Enhanced Medical Review System**: Comprehensive health analysis with clinical findings, system reviews, and actionable recommendations  
- **Real-time Processing**: Async file processing with status tracking
- **Data Visualization**: Chart generation for health trends and biomarker analysis

## Development Guidelines

### API Route Structure
- `/api/ai/` - AI processing endpoints (OCR, analysis, storage)
- `/api/auth/` - Authentication endpoints
- `/api/health/` - Health analysis and insights
- `/api/upload/` - File upload and processing
- `/api/user/` - User data management

### Error Handling
- Comprehensive error handling in AI processing with fallback strategies
- Retry logic with exponential backoff for AWS service calls
- Graceful degradation when AI services are unavailable

### Testing Utilities
Several test scripts are available for debugging specific functionality:
- Biomarker storage and retrieval
- AI processing pipeline integration
- Database connectivity and operations
- Bedrock model availability

### Medical Data Processing
The system processes various medical document types:
- Blood test results with biomarker extraction and analysis
- Body composition reports (InBody, DEXA scans)
- Fitness activity data (Garmin Connect exports)
- Custom medical form uploads

### Security Considerations
- File uploads are processed server-side with validation
- AWS credentials are server-side only (excluded from client bundle)
- NextAuth.js handles secure session management
- CORS configured for API endpoints with proper headers