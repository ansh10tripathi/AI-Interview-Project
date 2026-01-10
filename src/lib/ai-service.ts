import { InterviewConfig, InterviewQuestion, InterviewResponse, InterviewEvaluation, SkillScore } from '@/types/interview';
import { 
  QUESTION_GENERATION_PROMPT, 
  ANSWER_EVALUATION_PROMPT, 
  FINAL_EVALUATION_PROMPT,
  FOLLOW_UP_PROMPT 
} from './prompts';

// Mock AI service for hackathon - replace with real LLM calls
class AIService {
  private async callLLM(prompt: string): Promise<any> {
    // Mock implementation - replace with actual LLM API call
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    if (prompt.includes('Generate the next interview question')) {
      return this.mockQuestionGeneration(prompt);
    } else if (prompt.includes('evaluating a candidate\'s answer')) {
      return this.mockAnswerEvaluation(prompt);
    } else if (prompt.includes('final evaluation')) {
      return this.mockFinalEvaluation(prompt);
    } else if (prompt.includes('follow-up question')) {
      return this.mockFollowUp(prompt);
    }
    
    return { error: 'Unknown prompt type' };
  }

  private mockQuestionGeneration(prompt: string): InterviewQuestion {
    const questions = [
      {
        id: '1',
        text: 'Can you walk me through how you would design a REST API for a simple e-commerce system?',
        skill: 'API Design',
        followUps: ['How would you handle authentication?', 'What about rate limiting?'],
        expectedPoints: ['RESTful principles', 'Resource modeling', 'HTTP methods', 'Status codes']
      },
      {
        id: '2', 
        text: 'Describe the difference between SQL and NoSQL databases. When would you choose one over the other?',
        skill: 'Databases',
        followUps: ['Can you give a specific example?', 'How do you handle transactions in NoSQL?'],
        expectedPoints: ['ACID properties', 'Scalability', 'Schema flexibility', 'Use cases']
      },
      {
        id: '3',
        text: 'How would you optimize a slow database query? Walk me through your debugging process.',
        skill: 'Performance',
        followUps: ['What tools would you use?', 'How do you measure improvement?'],
        expectedPoints: ['Query analysis', 'Indexing', 'Execution plans', 'Monitoring']
      }
    ];
    
    const step = this.extractStep(prompt);
    return questions[step % questions.length];
  }

  private mockAnswerEvaluation(prompt: string) {
    return {
      score: Math.floor(Math.random() * 40) + 60, // 60-100 range
      evidence: ['Mentioned key concepts', 'Provided practical examples'],
      strengths: ['Clear communication', 'Good technical understanding'],
      weaknesses: ['Could provide more detail on implementation'],
      confidence: 0.8,
      redFlags: []
    };
  }

  private mockFinalEvaluation(prompt: string): InterviewEvaluation {
    return {
      overallScore: 78,
      recommendation: 'proceed' as const,
      skillBreakdown: {
        'API Design': {
          score: 82,
          evidence: ['Demonstrated REST principles', 'Good resource modeling'],
          confidence: 0.85
        },
        'Databases': {
          score: 75,
          evidence: ['Understood SQL vs NoSQL tradeoffs'],
          confidence: 0.8
        }
      },
      redFlags: [],
      summary: 'Strong technical foundation with good communication skills. Ready for next round.',
      confidence: 0.82
    };
  }

  private mockFollowUp(prompt: string) {
    return {
      followUp: 'Can you give me a specific example of when you implemented this approach?',
      reason: 'To validate practical experience',
      shouldAsk: true
    };
  }

  private extractStep(prompt: string): number {
    const match = prompt.match(/Current step: (\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async generateQuestion(
    config: InterviewConfig, 
    currentStep: number, 
    previousResponses: InterviewResponse[]
  ): Promise<InterviewQuestion> {
    const prompt = QUESTION_GENERATION_PROMPT
      .replace('{role}', config.role)
      .replace('{skills}', config.skills.join(', '))
      .replace('{difficulty}', config.difficulty)
      .replace('{style}', config.style)
      .replace('{currentStep}', currentStep.toString())
      .replace('{previousResponses}', JSON.stringify(previousResponses));

    return await this.callLLM(prompt);
  }

  async evaluateAnswer(
    question: InterviewQuestion,
    answer: string,
    difficulty: string
  ): Promise<any> {
    const prompt = ANSWER_EVALUATION_PROMPT
      .replace('{question}', question.text)
      .replace('{answer}', answer)
      .replace('{skill}', question.skill)
      .replace('{expectedPoints}', question.expectedPoints.join(', '))
      .replace('{difficulty}', difficulty);

    return await this.callLLM(prompt);
  }

  async generateFinalEvaluation(
    config: InterviewConfig,
    responses: InterviewResponse[],
    individualScores: any[]
  ): Promise<InterviewEvaluation> {
    const prompt = FINAL_EVALUATION_PROMPT
      .replace('{interviewConfig}', JSON.stringify(config))
      .replace('{allResponses}', JSON.stringify(responses))
      .replace('{individualScores}', JSON.stringify(individualScores))
      .replace('{role}', config.role)
      .replace('{difficulty}', config.difficulty);

    return await this.callLLM(prompt);
  }

  async shouldFollowUp(
    question: InterviewQuestion,
    answer: string,
    style: string
  ): Promise<{ followUp?: string; shouldAsk: boolean }> {
    const prompt = FOLLOW_UP_PROMPT
      .replace('{question}', question.text)
      .replace('{answer}', answer)
      .replace('{skill}', question.skill)
      .replace('{style}', style);

    return await this.callLLM(prompt);
  }
}

export const aiService = new AIService();