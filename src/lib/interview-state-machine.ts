import { InterviewConfig, InterviewState, InterviewResponse, InterviewQuestion } from '@/types/interview';
import { aiService } from './ai-service';

export class InterviewStateMachine {
  private config: InterviewConfig;
  private state: InterviewState;
  private maxQuestions: number = 5;
  private activeQuestion: InterviewQuestion | null = null;
  private questionHistory: InterviewQuestion[] = [];

  constructor(config: InterviewConfig) {
    this.config = config;
    this.state = {
      currentStep: 0,
      responses: [],
      isComplete: false
    };
  }

  async start(): Promise<InterviewQuestion> {
    const question = await aiService.generateQuestion(
      this.config,
      0,
      []
    );
    
    this.activeQuestion = question;
    this.questionHistory = [question];
    this.state.currentStep = 0;
    this.state.responses = [];
    this.state.isComplete = false;
    
    return question;
  }

  async submitAnswer(answer: string): Promise<{
    nextQuestion?: InterviewQuestion;
    isComplete: boolean;
    needsFollowUp?: boolean;
  }> {
    if (!this.activeQuestion) {
      throw new Error('No active question - interview may not be properly initialized');
    }

    // Record the response
    const response: InterviewResponse = {
      questionId: this.activeQuestion.id,
      answer: answer.trim(),
      timestamp: new Date()
    };
    
    this.state.responses.push(response);

    // Move to next main question
    this.state.currentStep++;
    
    // Check if interview is complete
    if (this.state.currentStep >= this.maxQuestions) {
      this.state.isComplete = true;
      this.activeQuestion = null;
      return { isComplete: true };
    }

    // Generate next question
    const nextQuestion = await aiService.generateQuestion(
      this.config,
      this.state.currentStep,
      this.state.responses
    );
    
    this.activeQuestion = nextQuestion;
    this.questionHistory.push(nextQuestion);
    
    return {
      nextQuestion,
      isComplete: false
    };
  }

  getState(): InterviewState & { activeQuestion: InterviewQuestion | null } {
    return { 
      ...this.state,
      activeQuestion: this.activeQuestion
    };
  }

  getProgress(): number {
    return Math.min((this.state.currentStep / this.maxQuestions) * 100, 100);
  }

  getCurrentQuestion(): InterviewQuestion | null {
    return this.activeQuestion;
  }

  async generateEvaluation() {
    console.log('[State Machine] Starting evaluation generation...');
    
    if (!this.state.isComplete) {
      throw new Error('Interview not complete');
    }

    if (this.state.responses.length === 0) {
      throw new Error('No responses to evaluate');
    }

    if (this.state.responses.length !== this.maxQuestions) {
      throw new Error(`Expected ${this.maxQuestions} responses, got ${this.state.responses.length}`);
    }

    console.log('[State Machine] Evaluating individual answers...');
    const individualScores = [];
    
    for (let i = 0; i < this.state.responses.length; i++) {
      const response = this.state.responses[i];
      
      if (!response.answer || response.answer.trim().length === 0) {
        individualScores.push({
          questionId: response.questionId,
          skill: 'General',
          answer: '',
          score: 0,
          evidence: ['No answer provided'],
          strengths: [],
          weaknesses: ['Did not answer question'],
          confidence: 0.1,
          redFlags: ['Empty response']
        });
        continue;
      }
      
      const question = this.questionHistory[i] || this.findQuestionForResponse(response);
      
      try {
        const evaluation = await aiService.evaluateAnswer(
          question,
          response.answer,
          this.config.difficulty
        );
        
        individualScores.push({
          questionId: response.questionId,
          skill: question.skill,
          answer: response.answer,
          ...evaluation
        });
      } catch (error) {
        console.error(`[State Machine] Error evaluating answer ${i}:`, error);
        individualScores.push({
          questionId: response.questionId,
          skill: question.skill,
          answer: response.answer,
          score: 50,
          evidence: ['Evaluation error occurred'],
          strengths: ['Provided response'],
          weaknesses: ['Could not fully evaluate'],
          confidence: 0.3,
          redFlags: []
        });
      }
    }

    if (individualScores.length === 0) {
      throw new Error('Failed to generate any individual scores');
    }

    console.log('[State Machine] Individual scores generated:', individualScores.length);

    try {
      console.log('[State Machine] Generating final evaluation...');
      const finalEval = await aiService.generateFinalEvaluation(
        this.config,
        this.state.responses,
        individualScores
      );
      
      console.log('[State Machine] Final evaluation complete:', {
        overallScore: finalEval.overallScore,
        recommendation: finalEval.recommendation
      });
      
      return finalEval;
    } catch (error) {
      console.error('[State Machine] Error generating final evaluation:', error);
      
      const avgScore = Math.round(
        individualScores.reduce((sum, s) => sum + s.score, 0) / individualScores.length
      );
      
      console.log('[State Machine] Using fallback evaluation with avgScore:', avgScore);
      
      return {
        overallScore: avgScore,
        recommendation: avgScore >= 75 ? 'proceed' : avgScore >= 60 ? 'borderline' : 'review',
        skillBreakdown: individualScores.reduce((acc, item) => {
          acc[item.skill] = {
            score: item.score,
            evidence: item.evidence,
            confidence: item.confidence
          };
          return acc;
        }, {} as any),
        redFlags: individualScores.flatMap(s => s.redFlags || []),
        summary: `Interview completed with ${avgScore}/100 overall score. Evaluation generated with limited analysis.`,
        confidence: 0.5
      };
    }
  }

  private findQuestionForResponse(response: InterviewResponse): InterviewQuestion {
    const question = this.questionHistory.find(q => q.id === response.questionId);
    if (question) return question;
    
    return {
      id: response.questionId,
      text: 'Interview question',
      skill: 'General',
      followUps: [],
      expectedPoints: []
    };
  }

  // Serialize state for persistence
  serialize(): string {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      activeQuestion: this.activeQuestion,
      questionHistory: this.questionHistory,
      maxQuestions: this.maxQuestions
    });
  }

  // Restore from serialized state
  static deserialize(data: string): InterviewStateMachine {
    try {
      const parsed = JSON.parse(data);
      const machine = new InterviewStateMachine(parsed.config);
      machine.state = parsed.state || {
        currentStep: 0,
        responses: [],
        isComplete: false
      };
      machine.activeQuestion = parsed.activeQuestion || null;
      machine.questionHistory = parsed.questionHistory || [];
      machine.maxQuestions = parsed.maxQuestions || 5;
      return machine;
    } catch (error) {
      console.error('Error deserializing state:', error);
      throw new Error('Invalid state data');
    }
  }

  // Restore state from database session
  static fromSession(config: InterviewConfig, sessionData: {
    currentStep: number;
    responses: string;
    status: string;
    evaluation?: string | null;
  }): InterviewStateMachine {
    const machine = new InterviewStateMachine(config);
    
    try {
      machine.state.currentStep = sessionData.currentStep;
      machine.state.responses = JSON.parse(sessionData.responses || '[]');
      machine.state.isComplete = sessionData.status === 'completed';
      
      if (sessionData.evaluation) {
        try {
          const serializedState = JSON.parse(sessionData.evaluation);
          machine.activeQuestion = serializedState.activeQuestion || null;
          machine.questionHistory = serializedState.questionHistory || [];
        } catch (e) {
          machine.activeQuestion = null;
          machine.questionHistory = [];
        }
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
      machine.state.currentStep = 0;
      machine.state.responses = [];
      machine.state.isComplete = false;
      machine.activeQuestion = null;
      machine.questionHistory = [];
    }
    
    return machine;
  }
}