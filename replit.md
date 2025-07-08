# Fast Result Checker

## Overview

This is a full-stack web application designed to check examination results for Bangladesh education boards. The system provides a fast, reliable interface for students to retrieve their academic results with optimized performance during peak usage times.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter (lightweight React router)

### Architecture Pattern
The application follows a **monorepo structure** with clear separation between client, server, and shared code:
- `/client/` - React frontend application
- `/server/` - Express.js backend API
- `/shared/` - Shared TypeScript types and database schema

## Key Components

### Frontend Architecture
- **Component-based structure** using React functional components with hooks
- **shadcn/ui design system** for consistent UI components
- **Form handling** with react-hook-form and Zod validation
- **Real-time updates** using TanStack Query for server state management
- **Responsive design** with mobile-first approach using Tailwind CSS

### Backend Architecture
- **RESTful API** design with Express.js
- **Modular service layer** for business logic separation
- **Database abstraction** using Drizzle ORM
- **In-memory storage fallback** for development/testing
- **Error handling middleware** with structured error responses

### Database Design
The system uses PostgreSQL with two main tables:
- **result_requests**: Stores user search requests and their status
- **system_stats**: Tracks system performance metrics

### External Service Integration
- **Result fetching service** that scrapes data from Bangladesh education board websites
- **Captcha service** for security and bot prevention
- **Cheerio** for HTML parsing and data extraction

## Data Flow

1. **User submits search form** with board, exam, roll, registration details
2. **Captcha validation** ensures request authenticity
3. **Request stored** in database with pending status
4. **Background service** fetches result from education board websites
5. **Real-time updates** via polling to show progress to user
6. **Result displayed** or error handling if retrieval fails

### Request Processing Pipeline
```
User Input → Validation → Captcha Check → Database Storage → 
External API Call → Data Parsing → Database Update → Client Response
```

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **axios**: HTTP client for external API calls
- **cheerio**: Server-side HTML parsing
- **nanoid**: Unique ID generation

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitives
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the stack
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- **Client build**: Vite bundles React app for production
- **Server build**: esbuild compiles TypeScript to ESM format
- **Static assets**: Served from `/dist/public/` directory

### Environment Configuration
- **Development**: Uses Vite dev server with HMR
- **Production**: Serves static files with Express.js
- **Database**: Requires `DATABASE_URL` environment variable

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database instance
- Static file serving capability

## Demo Testing

For testing purposes, use these demo credentials:
- **Roll Number**: 123456
- **Registration**: 1234567890
- **Board**: Any board
- **Exam**: Any exam type

This will return a sample result to test the full functionality without needing real student data.

## Changelog

```
Changelog:
- July 08, 2025. Initial setup with SSC result checker
- July 08, 2025. Enhanced result fetcher with real website integration
- July 08, 2025. Added demo mode and comprehensive error handling
- July 08, 2025. GitHub deployment configuration completed
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```