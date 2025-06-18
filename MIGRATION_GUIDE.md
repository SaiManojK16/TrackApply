# TrackApply Next.js Migration Guide

This guide will help you complete the migration from your current MERN stack (separate frontend/backend) to a full-stack Next.js application.

## ✅ Already Completed

### 1. Project Setup
- ✅ Next.js project created with TypeScript and Tailwind CSS
- ✅ Dependencies installed (Material-UI, MongoDB, JWT, etc.)
- ✅ Database models converted to TypeScript
- ✅ MongoDB connection utility created
- ✅ Authentication middleware created
- ✅ Basic auth API routes (login/register) created

## 🔄 Next Steps to Complete

### 2. Complete API Routes Migration

Copy the remaining API routes from your Express backend to Next.js API routes:

#### Auth Routes (partially done)
- ✅ `/api/auth/login` - Done
- ✅ `/api/auth/register` - Done
- ⏳ `/api/auth/profile` - GET and PUT methods
- ⏳ `/api/auth/unlock-access` - POST method
- ⏳ `/api/auth/upload-resume` - POST method

#### Cover Letter & PDF Routes
- ⏳ `/api/generate-cover-letter` - POST method
- ⏳ `/api/generate-pdf` - POST method  
- ⏳ `/api/preview-pdf` - GET method

#### Job Applications Routes
- ⏳ `/api/job-applications` - GET and POST methods
- ⏳ `/api/job-applications/[id]` - GET, PUT, DELETE methods

#### Email Generation
- ⏳ `/api/generate-email` - POST method

### 3. Frontend Components Migration

Copy your React components from `cover-letter-generator/frontend/src/components/` to `src/components/`:

#### Core Components
- `CoverLetterGenerator.js` → `CoverLetterGenerator.tsx`
- `JobTracking.js` → `JobTracking.tsx`
- `LandingPage.js` → `LandingPage.tsx`
- `Login.js` → `Login.tsx`
- `Register.js` → `Register.tsx`
- `Header.js` → `Header.tsx`
- `Footer.js` → `Footer.tsx`
- `Layout.js` → `Layout.tsx`

#### UI Components
- `components/ui/` folder contents

### 4. Pages Migration

Convert your React Router pages to Next.js App Router pages:

#### Main Pages
- `src/app/page.tsx` - Landing page (already exists, needs content)
- `src/app/dashboard/page.tsx` - Dashboard with job tracking
- `src/app/generator/page.tsx` - Cover letter generator
- `src/app/profile/page.tsx` - User profile page
- `src/app/login/page.tsx` - Login page
- `src/app/register/page.tsx` - Register page

### 5. Utilities and Libraries

Copy utility files:
- `lib/utils.js` → `src/lib/utils.ts`
- `theme.js` → `src/lib/theme.ts`

### 6. Environment Variables

Create `.env.local` file:
```env
MONGODB_URI=mongodb+srv://saimanojk:saimanojk@cluster0.jv4zqbt.mongodb.net/
JWT_SECRET=your-secret-key-change-this-in-production
GEMINI_API_KEY=your-google-gemini-api-key
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 7. Package.json Scripts

Update scripts for LaTeX/PDF generation:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🔧 Key Changes Required

### API Routes Structure
```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── profile/route.ts
│   ├── unlock-access/route.ts
│   └── upload-resume/route.ts
├── generate-cover-letter/route.ts
├── generate-pdf/route.ts
├── preview-pdf/route.ts
├── generate-email/route.ts
└── job-applications/
    ├── route.ts
    └── [id]/route.ts
```

### Frontend Structure
```
src/
├── app/
│   ├── api/ (API routes)
│   ├── dashboard/page.tsx
│   ├── generator/page.tsx
│   ├── profile/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── CoverLetterGenerator.tsx
│   ├── JobTracking.tsx
│   └── ...
├── lib/
│   ├── mongodb.ts
│   ├── utils.ts
│   └── theme.ts
├── models/
│   ├── User.ts
│   └── JobApplication.ts
└── middleware/
    └── auth.ts
```

## 🚀 Deployment Benefits

Once migrated to Next.js:

1. **Single Deployment**: Deploy entire app to Vercel with one command
2. **Automatic API Routes**: No need for separate backend server
3. **Optimized Performance**: Built-in optimizations and caching
4. **Serverless Functions**: API routes run as serverless functions
5. **Easy Environment Management**: Built-in environment variable support

## 📝 Migration Steps

1. **Copy API Routes**: Migrate all Express routes to Next.js API routes
2. **Copy Components**: Move React components to Next.js structure
3. **Update Imports**: Change relative imports to use Next.js conventions
4. **Test Functionality**: Ensure all features work correctly
5. **Deploy to Vercel**: Single command deployment

## 🔗 Helpful Resources

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Vercel Deployment Guide](https://nextjs.org/docs/deployment)

## 💡 Tips

1. **Start with API Routes**: Get backend functionality working first
2. **Test Each Route**: Verify each API endpoint before moving to frontend
3. **Use TypeScript**: Take advantage of type safety throughout
4. **Environment Variables**: Use `.env.local` for development
5. **Vercel Deployment**: Use Vercel CLI for easy deployment

Would you like me to help you complete specific parts of this migration? 