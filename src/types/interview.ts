export interface InterviewConfig {
  role: string;
  skills: string[];
  difficulty: 'Junior' | 'Mid' | 'Senior';
  rubric: {
    [key: string]: number; // skill -> weight percentage
  };
  redFlags: string[];
  style: 'friendly' | 'neutral' | 'strict';
}

export interface InterviewQuestion {
  id: string;
  text: string;
  skill: string;
  followUps: string[];
  expectedPoints: string[];
}

export interface InterviewResponse {
  questionId: string;
  answer: string;
  timestamp: Date;
}

export interface InterviewState {
  currentStep: number;
  responses: InterviewResponse[];
  nextQuestion?: InterviewQuestion;
  isComplete: boolean;
}

export interface SkillScore {
  skill: string;
  score: number; // 0-100
  evidence: string[];
  confidence: number;
}

export interface InterviewEvaluation {
  scores: SkillScore[];
  overallScore: number;
  recommendation: 'proceed' | 'borderline' | 'review';
  redFlags: string[];
  summary: string;
  confidence: number;
}

export interface InterviewSession {
  id: string;
  interviewId: string;
  candidateName: string;
  candidateEmail: string;
  status: 'pending' | 'active' | 'completed';
  currentStep: number;
  responses: InterviewResponse[];
  evaluation?: InterviewEvaluation;
  createdAt: Date;
  completedAt?: Date;
}