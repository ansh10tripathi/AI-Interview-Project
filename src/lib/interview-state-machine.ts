import { InterviewConfig, InterviewState, InterviewResponse, InterviewQuestion } from '@/types/interview';
import { aiService } from './ai-service';

export class InterviewStateMachine {
  private config: InterviewConfig;
  private state: InterviewState;
  private maxQuestions: number = 5;

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
      this.state.currentStep,
      this.state.responses
    );
    
    this.state.nextQuestion = question;
    return question;
  }

  async submitAnswer(answer: string): Promise<{
    nextQuestion?: InterviewQuestion;
    isComplete: boolean;
    needsFollowUp?: boolean;
  }> {
    // Initialize first question if no active question exists
    if (!this.state.nextQuestion) {
      const firstQuestion = await aiService.generateQuestion(
        this.config,
        this.state.currentStep,
        this.state.responses
      );
      this.state.nextQuestion = firstQuestion;
    }

    // Record the response
    const response: InterviewResponse = {
      questionId: this.state.nextQuestion.id,
      answer,
      timestamp: new Date()
    };
    
    this.state.responses.push(response);

    // Check if we should ask a follow-up
    const followUpResult = await aiService.shouldFollowUp(
      this.state.nextQuestion,
      answer,
      this.config.style
    );

    if (followUpResult.shouldAsk && followUpResult.followUp) {
      // Generate follow-up question
      const followUpQuestion: InterviewQuestion = {
        id: `${this.state.nextQuestion.id}-followup`,
        text: followUpResult.followUp,
        skill: this.state.nextQuestion.skill,
        followUps: [],
        expectedPoints: []
      };
      
      this.state.nextQuestion = followUpQuestion;
      return {
        nextQuestion: followUpQuestion,
        isComplete: false,
        needsFollowUp: true
      };
    }

    // Move to next main question
    this.state.currentStep++;
    
    // Check if interview is complete
    if (this.state.currentStep >= this.maxQuestions) {
      this.state.isComplete = true;
      return { isComplete: true };
    }

    // Generate next question
    const nextQuestion = await aiService.generateQuestion(
      this.config,
      this.state.currentStep,
      this.state.responses
    );
    
    this.state.nextQuestion = nextQuestion;
    
    return {
      nextQuestion,
      isComplete: false
    };
  }

  getState(): InterviewState {
    return { ...this.state };
  }

  getProgress(): number {
    return Math.min((this.state.currentStep / this.maxQuestions) * 100, 100);
  }

  async generateEvaluation() {
    if (!this.state.isComplete) {
      throw new Error('Interview not complete');
    }

    // Evaluate individual answers
    const individualScores = [];
    for (const response of this.state.responses) {
      const question = this.findQuestionById(response.questionId);
      if (question) {
        const evaluation = await aiService.evaluateAnswer(
          question,
          response.answer,
          this.config.difficulty
        );
        individualScores.push({
          questionId: response.questionId,
          skill: question.skill,
          ...evaluation
        });
      }
    }

    // Generate final evaluation
    return await aiService.generateFinalEvaluation(
      this.config,
      this.state.responses,
      individualScores
    );
  }

  private findQuestionById(questionId: string): InterviewQuestion | undefined {
    // In a real implementation, you'd store all questions
    // For now, return a mock question structure
    return {
      id: questionId,
      text: 'Mock question',
      skill: 'General',
      followUps: [],
      expectedPoints: []
    };
  }

  // Serialize state for persistence
  serialize(): string {
    return JSON.stringify({
      config: this.config,
      state: this.state
    });
  }

  // Restore from serialized state
  static deserialize(data: string): InterviewStateMachine {
    const { config, state } = JSON.parse(data);
    const machine = new InterviewStateMachine(config);
    machine.state = state;
    return machine;
  }
}