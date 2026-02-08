# Interview Session State Machine

## States

### pending
- Initial state when session is created but not started
- Waiting for candidate to begin interview
- **Transitions to**: active, locked

### active
- Interview is in progress
- Candidate can submit answers
- **Transitions to**: completed, locked

### completed
- All questions answered and evaluation generated
- Session is read-only
- **Transitions to**: locked

### locked
- Session is permanently locked by admin
- No further actions allowed
- **Transitions to**: none (terminal state)

## State Transitions

```
pending → active    (candidate starts interview)
pending → locked    (admin locks before start)
active → completed  (all questions answered)
active → locked     (admin locks during interview)
completed → locked  (admin locks after completion)
```

## API Enforcement

### POST /api/sessions/start
- Checks if existing session is completed/locked
- Creates new session in `pending` state
- Returns error if duplicate active session exists

### POST /api/sessions/answer
- Validates session is in `active` state
- Rejects if completed or locked
- Transitions to `completed` when all questions answered

### DELETE /api/sessions/delete (admin only)
- Can transition any session to `locked` state
- Prevents further access

## Frontend States

- `start`: Show registration form
- `interview`: Show questions and answer input
- `complete`: Show evaluation summary
- `locked`: Show locked message with icon

## Usage Example

```typescript
import { InterviewSessionStateMachine } from '@/lib/session-state-machine';

const machine = new InterviewSessionStateMachine('pending');

// Check if can start
if (machine.canStart()) {
  machine.start(); // transitions to 'active'
}

// Check if can answer
if (machine.canAnswer()) {
  // allow answer submission
}

// Complete interview
if (machine.canComplete()) {
  machine.complete(); // transitions to 'completed'
}

// Lock session (admin action)
machine.lock(); // transitions to 'locked'
```

## Benefits

1. **Clear transitions**: No ambiguous state changes
2. **Validation**: Prevents invalid operations
3. **Consistency**: Backend and frontend use same logic
4. **Auditability**: State changes are explicit
5. **Security**: Locked state prevents tampering
