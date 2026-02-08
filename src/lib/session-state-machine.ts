export type SessionState = 'pending' | 'active' | 'completed' | 'locked';

export interface StateTransition {
  from: SessionState;
  to: SessionState;
  allowed: boolean;
  reason?: string;
}

export class InterviewSessionStateMachine {
  private currentState: SessionState;

  constructor(initialState: SessionState = 'pending') {
    this.currentState = initialState;
  }

  getCurrentState(): SessionState {
    return this.currentState;
  }

  canTransition(to: SessionState): StateTransition {
    const transitions: Record<SessionState, SessionState[]> = {
      'pending': ['active', 'locked'],
      'active': ['completed', 'locked'],
      'completed': ['locked'],
      'locked': []
    };

    const allowed = transitions[this.currentState]?.includes(to) || false;

    return {
      from: this.currentState,
      to,
      allowed,
      reason: allowed ? undefined : `Cannot transition from ${this.currentState} to ${to}`
    };
  }

  transition(to: SessionState): boolean {
    const check = this.canTransition(to);
    
    if (!check.allowed) {
      throw new Error(check.reason || 'Invalid state transition');
    }

    this.currentState = to;
    return true;
  }

  // State checks
  isPending(): boolean {
    return this.currentState === 'pending';
  }

  isActive(): boolean {
    return this.currentState === 'active';
  }

  isCompleted(): boolean {
    return this.currentState === 'completed';
  }

  isLocked(): boolean {
    return this.currentState === 'locked';
  }

  canStart(): boolean {
    return this.isPending();
  }

  canAnswer(): boolean {
    return this.isActive();
  }

  canComplete(): boolean {
    return this.isActive();
  }

  // Actions
  start(): void {
    this.transition('active');
  }

  complete(): void {
    this.transition('completed');
  }

  lock(): void {
    this.transition('locked');
  }
}

// Helper to get state from database status
export function getSessionState(status: string): SessionState {
  const stateMap: Record<string, SessionState> = {
    'pending': 'pending',
    'active': 'active',
    'completed': 'completed',
    'locked': 'locked'
  };
  return stateMap[status] || 'pending';
}

// Helper to validate state transition
export function validateStateTransition(from: string, to: string): boolean {
  const machine = new InterviewSessionStateMachine(getSessionState(from));
  return machine.canTransition(getSessionState(to)).allowed;
}
