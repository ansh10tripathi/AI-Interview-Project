# Email Validation Implementation

## Basic Validation (Currently Active)

### Frontend (`src/app/interview/page.tsx`)
- Email regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Real-time error display
- Prevents submission with invalid emails

### Backend (`src/app/api/sessions/start/route.ts`)
- Server-side email validation
- Name length check (min 2 chars)
- Email normalization (trim + lowercase)
- Duplicate session prevention per email

## Secure Implementation (Recommended)

### Email Verification Flow

1. **Request Session** (`/api/sessions/request`)
   - Validates email format
   - Creates pending session
   - Generates verification token
   - Sends verification email

2. **Verify Email** (`/api/sessions/verify`)
   - Validates token
   - Checks expiry (24 hours)
   - Activates session
   - Returns interview link

3. **Start Interview** (`/api/sessions/start`)
   - Requires verified session
   - Validates session ownership
   - Initializes interview

### Implementation Files

- `src/lib/email-verification.ts` - Token generation and email utilities
- `src/app/api/sessions/request/route.ts` - Request verification email
- `src/app/api/sessions/verify/route.ts` - Verify token and activate session

### Migration Steps

1. Add email service credentials (SendGrid/AWS SES) to `.env`
2. Update frontend to use `/api/sessions/request` instead of `/api/sessions/start`
3. Create verification page at `/interview/verify`
4. Update session schema to include `verificationToken` and `verified` fields

### Environment Variables

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
EMAIL_SERVICE_API_KEY=your_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### Security Benefits

- Prevents fake emails
- Confirms candidate identity
- One session per verified email
- Token expiry prevents replay attacks
- Email ownership verification
