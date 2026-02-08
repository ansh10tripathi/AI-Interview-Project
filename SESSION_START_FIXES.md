# Session Start Bug Fixes - Technical Analysis

## Problem Summary
Candidates were unable to start interviews, receiving "Failed to generate interview question" error even when all conditions were valid.

## Root Causes Identified

### 1. **Import Error: MAX_ACTIVE_SESSIONS**
**Bug:**
```typescript
import { MAX_ACTIVE_SESSIONS } from '@/lib/auth';
```

**Why it failed:**
- `MAX_ACTIVE_SESSIONS` was exported from `@/lib/auth.ts` but the import was causing runtime issues
- The constant was added recently but not properly integrated
- Import failures cause the entire route handler to fail before any logic executes

**Fix:**
```typescript
// Safe constant for max concurrent sessions
const MAX_ACTIVE_SESSIONS = 100;
```

**Why this works:**
- Removes external dependency that was causing import failures
- Defines constant locally where it's used
- Can be easily moved to environment variable later if needed
- Prevents route handler from failing at import time

---

### 2. **Incorrect Active Session Query**
**Bug:**
```typescript
const activeCount = await prisma.interviewSession.count({
  where: {
    OR: [
      { status: 'active' },
      { completedAt: null }
    ]
  }
});
```

**Why it failed:**
- The OR condition was too broad
- `completedAt: null` matches ALL sessions that haven't been completed, including:
  - Pending sessions (not started yet)
  - Active sessions (in progress)
  - Locked sessions (admin terminated)
- This caused the count to include sessions that weren't actually "active"
- When count exceeded limit, legitimate new sessions were blocked

**Example scenario:**
- 50 completed sessions (completedAt = timestamp)
- 30 pending sessions (status = 'pending', completedAt = null)
- 25 active sessions (status = 'active', completedAt = null)
- Query returns: 55 sessions (30 pending + 25 active)
- If MAX_ACTIVE_SESSIONS = 50, new sessions are blocked even though only 25 are truly active

**Fix:**
```typescript
const activeCount = await prisma.interviewSession.count({
  where: {
    status: 'active',
    completedAt: null
  }
});
```

**Why this works:**
- Uses AND condition (both must be true)
- Only counts sessions that are:
  - Currently in 'active' status
  - Not yet completed (completedAt is null)
- Accurately represents concurrent active interviews
- Allows new sessions when capacity is available

---

### 3. **No Validation of Generated Question**
**Bug:**
```typescript
const stateMachine = new InterviewStateMachine(config);
const firstQuestion = await stateMachine.start();

// Immediately used without validation
const session = await prisma.interviewSession.create({
  data: {
    // ... uses firstQuestion
  }
});
```

**Why it failed:**
- If `aiService.generateQuestion()` returned null/undefined/empty object, no error was thrown
- Session was created with invalid question data
- Frontend received malformed response
- No way to debug what went wrong

**Scenarios that could cause empty questions:**
- AI service timeout
- Invalid role/skill mapping
- Mock question bank missing entries
- Network issues (if using real LLM)
- Parsing errors in question generation

**Fix:**
```typescript
const firstQuestion = await stateMachine.start();

// Validate first question was generated
if (!firstQuestion || !firstQuestion.text || !firstQuestion.id) {
  console.error('[Session Start] Failed to generate first question:', firstQuestion);
  return NextResponse.json(
    { success: false, error: 'Failed to generate interview question. Please try again.' },
    { status: 500 }
  );
}

console.log(`[Session Start] First question generated:`, {
  id: firstQuestion.id,
  skill: firstQuestion.skill,
  textLength: firstQuestion.text.length
});
```

**Why this works:**
- Validates question has required fields (text, id)
- Returns clear error message to frontend
- Prevents session creation with invalid data
- Logs actual question data for debugging
- Gives user actionable error message

---

### 4. **Missing Debug Logging**
**Bug:**
- No logging throughout the session start process
- When errors occurred, no way to trace where/why
- Silent failures made debugging impossible

**Fix:**
Added comprehensive logging at key points:

```typescript
// Log active session count
console.log(`[Session Start] Active sessions: ${activeCount}/${MAX_ACTIVE_SESSIONS}`);

// Log interview configuration
console.log(`[Session Start] Interview config:`, {
  role: config.role,
  skills: config.skills,
  difficulty: config.difficulty
});

// Log state machine initialization
console.log('[Session Start] Initializing state machine...');

// Log question generation result
console.log(`[Session Start] First question generated:`, {
  id: firstQuestion.id,
  skill: firstQuestion.skill,
  textLength: firstQuestion.text.length
});

// Log successful session creation
console.log(`[Session Start] Session created successfully:`, {
  sessionId: session.id,
  candidateEmail: trimmedEmail
});

// Log errors with context
console.error('[Session Start] Failed to generate first question:', firstQuestion);
console.error('[Session Start] Failed to parse interview config:', error);
console.error('[Session Start] Unexpected error:', error);
```

**Why this helps:**
- Traces execution flow through the route
- Identifies exactly where failures occur
- Provides context for debugging
- Helps identify patterns in failures
- Makes production debugging possible

---

## Complete Fixed Code

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewStateMachine } from '@/lib/interview-state-machine';
import { InterviewConfig } from '@/types/interview';
import { InterviewSessionStateMachine, getSessionState } from '@/lib/session-state-machine';

// Safe constant for max concurrent sessions
const MAX_ACTIVE_SESSIONS = 100;

export async function POST(request: NextRequest) {
  try {
    const { interviewId, candidateName, candidateEmail } = await request.json();
    
    if (!interviewId || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const trimmedName = candidateName.trim();
    const trimmedEmail = candidateEmail.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        interviewId,
        candidateEmail: trimmedEmail
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingSession) {
      const sessionState = new InterviewSessionStateMachine(getSessionState(existingSession.status));
      
      if (sessionState.isCompleted() || sessionState.isLocked()) {
        return NextResponse.json(
          { success: false, error: 'You have already completed this interview' },
          { status: 409 }
        );
      }
      
      if (sessionState.isActive()) {
        return NextResponse.json(
          { success: false, error: 'An active interview session already exists for this email' },
          { status: 409 }
        );
      }
    }
    
    // Check active session limit - only count truly active sessions
    const activeCount = await prisma.interviewSession.count({
      where: {
        status: 'active',
        completedAt: null
      }
    });
    
    console.log(`[Session Start] Active sessions: ${activeCount}/${MAX_ACTIVE_SESSIONS}`);
    
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      return NextResponse.json(
        { success: false, error: 'Maximum interview capacity reached. Please try later.' },
        { status: 429 }
      );
    }
    
    // Get interview config
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Parse interview configuration
    let config: InterviewConfig;
    try {
      config = {
        role: interview.role,
        skills: JSON.parse(interview.skills),
        difficulty: interview.difficulty as any,
        rubric: JSON.parse(interview.rubric),
        redFlags: JSON.parse(interview.redFlags),
        style: interview.style as any
      };
      
      console.log(`[Session Start] Interview config:`, {
        role: config.role,
        skills: config.skills,
        difficulty: config.difficulty
      });
    } catch (error) {
      console.error('[Session Start] Failed to parse interview config:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid interview configuration' },
        { status: 500 }
      );
    }

    // Initialize state machine and get first question
    console.log('[Session Start] Initializing state machine...');
    const stateMachine = new InterviewStateMachine(config);
    
    const firstQuestion = await stateMachine.start();
    
    // Validate first question was generated
    if (!firstQuestion || !firstQuestion.text || !firstQuestion.id) {
      console.error('[Session Start] Failed to generate first question:', firstQuestion);
      return NextResponse.json(
        { success: false, error: 'Failed to generate interview question. Please try again.' },
        { status: 500 }
      );
    }
    
    console.log(`[Session Start] First question generated:`, {
      id: firstQuestion.id,
      skill: firstQuestion.skill,
      textLength: firstQuestion.text.length
    });

    // Create session with initial state
    const session = await prisma.interviewSession.create({
      data: {
        interviewId,
        candidateName: trimmedName,
        candidateEmail: trimmedEmail,
        status: 'active',
        currentStep: 0,
        responses: JSON.stringify([]),
        evaluation: stateMachine.serialize()
      }
    });
    
    console.log(`[Session Start] Session created successfully:`, {
      sessionId: session.id,
      candidateEmail: trimmedEmail
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      question: firstQuestion,
      questionIndex: 0,
      totalQuestions: 5,
      progress: 0
    });
  } catch (error) {
    console.error('[Session Start] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start session. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

## Testing Checklist

- [ ] Candidate can start new interview with valid email
- [ ] First question is displayed correctly
- [ ] Session is created in database with status 'active'
- [ ] Active session count only includes truly active sessions
- [ ] Completed sessions don't block new sessions
- [ ] Clear error message when question generation fails
- [ ] Console logs show execution flow
- [ ] Duplicate email check still works
- [ ] Completed interview check still works
- [ ] Capacity limit works correctly

---

## Future Improvements

1. **Environment Configuration:**
   ```typescript
   const MAX_ACTIVE_SESSIONS = parseInt(process.env.MAX_ACTIVE_SESSIONS || '100');
   ```

2. **Retry Logic:**
   - Retry question generation on failure
   - Exponential backoff for AI service calls

3. **Monitoring:**
   - Track question generation success rate
   - Alert on high failure rates
   - Monitor active session count trends

4. **Graceful Degradation:**
   - Fallback questions if AI service fails
   - Queue system for capacity management
