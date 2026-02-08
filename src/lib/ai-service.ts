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
    
    // Check prompt type and route to appropriate mock
    if (prompt.includes('evaluating a candidate\'s answer')) {
      return this.mockAnswerEvaluation(prompt);
    } else if (prompt.includes('conducting a final evaluation')) {
      return this.mockFinalEvaluation(prompt);
    } else if (prompt.includes('follow-up question')) {
      return this.mockFollowUp(prompt);
    } else if (prompt.includes('You are an AI technical interviewer')) {
      return this.mockQuestionGeneration(prompt);
    }
    
    // Default fallback
    console.warn('[AI Service] Unknown prompt type, defaulting to question generation');
    return this.mockQuestionGeneration(prompt);
  }

  private mockQuestionGeneration(prompt: string): InterviewQuestion {
    const roleMatch = prompt.match(/Role: ([^\n]+)/);
    const skillMatch = prompt.match(/skill: ([^\n}]+)/);
    const difficultyMatch = prompt.match(/Difficulty: ([^\n]+)/);
    const stepMatch = prompt.match(/Question index: (\d+)/);
    
    const role = roleMatch ? roleMatch[1].trim() : 'Software Engineer';
    const targetSkill = skillMatch ? skillMatch[1].trim() : 'Programming';
    const difficulty = difficultyMatch ? difficultyMatch[1].trim() : 'Mid';
    const step = stepMatch ? parseInt(stepMatch[1]) : 0;

    const roleQuestions: Record<string, Record<string, string[]>> = {
      'Frontend Developer': {
        'React': [
          'Explain how React\'s virtual DOM works and why it improves performance.',
          'How would you optimize a React component that re-renders too frequently?',
          'Describe the difference between controlled and uncontrolled components in React.',
          'How do you handle state management in a large React application?',
          'Explain React hooks lifecycle and when you would use useEffect vs useLayoutEffect.'
        ],
        'CSS': [
          'How would you implement a responsive navigation menu without using a framework?',
          'Explain CSS specificity and how it affects style application.',
          'What are CSS Grid and Flexbox, and when would you use each?',
          'How do you optimize CSS for performance in a large application?',
          'Describe how you would implement a dark mode theme switcher.'
        ],
        'JavaScript': [
          'Explain closures in JavaScript and provide a practical use case.',
          'What is the event loop and how does it handle asynchronous operations?',
          'Describe the difference between var, let, and const.',
          'How would you implement debouncing for a search input?',
          'Explain prototypal inheritance in JavaScript.'
        ]
      },
      'Backend Engineer': {
        'API Design': [
          'How would you design a RESTful API for a blog platform with posts and comments?',
          'Explain the difference between PUT and PATCH HTTP methods.',
          'How do you handle API versioning in a production system?',
          'Describe how you would implement rate limiting for an API.',
          'What are the key considerations for designing a scalable API?'
        ],
        'Database': [
          'Explain the difference between SQL and NoSQL databases with use cases.',
          'How would you optimize a slow database query?',
          'Describe database indexing and when you would use it.',
          'How do you handle database migrations in a production environment?',
          'Explain ACID properties and their importance.'
        ],
        'Node.js': [
          'How does Node.js handle concurrency despite being single-threaded?',
          'Explain the difference between process.nextTick() and setImmediate().',
          'How would you handle memory leaks in a Node.js application?',
          'Describe how you would implement authentication in a Node.js API.',
          'What are streams in Node.js and when would you use them?'
        ]
      },
      'Full Stack Developer': {
        'System Design': [
          'Design a URL shortener service like bit.ly. What are the key components?',
          'How would you architect a real-time chat application?',
          'Explain how you would design a scalable file upload system.',
          'Describe the architecture for a social media feed with millions of users.',
          'How would you implement caching in a distributed system?'
        ],
        'Authentication': [
          'Explain JWT tokens and how they differ from session-based authentication.',
          'How would you implement OAuth 2.0 in your application?',
          'Describe how you would secure an API against common attacks.',
          'What is the difference between authentication and authorization?',
          'How do you handle password storage securely?'
        ],
        'DevOps': [
          'Explain the CI/CD pipeline you would set up for a web application.',
          'How would you containerize a full-stack application using Docker?',
          'Describe your approach to monitoring and logging in production.',
          'What strategies would you use for zero-downtime deployments?',
          'How do you handle database migrations in a CI/CD pipeline?'
        ]
      }
    };

    const normalizedRole = Object.keys(roleQuestions).find(r => 
      role.toLowerCase().includes(r.toLowerCase().split(' ')[0])
    ) || 'Backend Engineer';

    const roleSkills = roleQuestions[normalizedRole];
    const normalizedSkill = Object.keys(roleSkills).find(s => 
      targetSkill.toLowerCase().includes(s.toLowerCase())
    ) || Object.keys(roleSkills)[0];

    const questions = roleSkills[normalizedSkill];
    const questionText = questions[step % questions.length];

    return {
      id: `q-${step}-${Date.now()}`,
      text: questionText,
      skill: normalizedSkill,
      followUps: [],
      expectedPoints: this.getExpectedPoints(normalizedSkill, difficulty)
    };
  }

  private getExpectedPoints(skill: string, difficulty: string): string[] {
    const basePoints: Record<string, string[]> = {
      'React': ['Component lifecycle', 'State management', 'Performance optimization'],
      'CSS': ['Layout techniques', 'Responsive design', 'Browser compatibility'],
      'JavaScript': ['Language fundamentals', 'Async patterns', 'Best practices'],
      'API Design': ['REST principles', 'HTTP methods', 'Error handling'],
      'Database': ['Query optimization', 'Data modeling', 'Transactions'],
      'Node.js': ['Event loop', 'Async operations', 'Error handling'],
      'System Design': ['Scalability', 'Trade-offs', 'Architecture patterns'],
      'Authentication': ['Security principles', 'Token management', 'Best practices'],
      'DevOps': ['Automation', 'Monitoring', 'Deployment strategies']
    };

    return basePoints[skill] || ['Technical understanding', 'Practical experience', 'Best practices'];
  }

  private mockAnswerEvaluation(prompt: string) {
    const answerMatch = prompt.match(/Candidate Answer: ([^\n]+)/);
    const answer = answerMatch ? answerMatch[1] : '';
    
    const answerLength = answer.trim().length;
    const words = answer.trim().split(/\s+/);
    const wordCount = words.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueRatio = uniqueWords.size / Math.max(wordCount, 1);
    
    const hasKeywords = /\b(design|implement|architecture|system|database|api|performance|scale|security|test|function|component|service|method|class|data|user|application|code|process|solution|approach|consider|ensure|handle|manage|optimize|develop|build|create|use|would|could|should)\b/i.test(answer);
    const hasTechnicalDepth = answer.split(/[.!?]/).filter(s => s.trim().length > 20).length > 2;
    const hasExamples = /\b(example|instance|case|scenario|experience|project|worked|built|implemented|used|applied)\b/i.test(answer);
    const hasStructure = /\b(first|second|third|then|next|finally|also|additionally|furthermore|however|therefore|because)\b/i.test(answer);
    
    const isRandomChars = /^[a-z]{20,}$/i.test(answer.replace(/\s/g, '')) || avgWordLength < 3;
    const isRepeated = uniqueRatio < 0.5 && wordCount > 10;
    const isTooShort = answerLength < 50;
    const isGibberish = wordCount > 5 && !hasKeywords && avgWordLength < 4;
    
    let baseScore = 50;
    let confidence = 0.7;
    const evidence = [];
    const strengths = [];
    const weaknesses = [];
    const redFlags = [];
    
    if (isRandomChars || isGibberish) {
      baseScore = 20;
      confidence = 0.3;
      redFlags.push('Answer appears to be random or meaningless text');
      weaknesses.push('No coherent technical content');
      return { score: baseScore, evidence: ['Unintelligible response'], strengths: [], weaknesses, confidence, redFlags };
    }
    
    if (isRepeated) {
      baseScore = 30;
      confidence = 0.4;
      redFlags.push('Repetitive content with low information density');
      weaknesses.push('Lacks variety in explanation');
    }
    
    if (isTooShort) {
      baseScore = Math.min(baseScore, 45);
      confidence = Math.min(confidence, 0.5);
      weaknesses.push('Answer is too brief and lacks detail');
    } else {
      if (answerLength > 200) baseScore += 10;
      if (answerLength > 400) baseScore += 8;
    }
    
    if (hasKeywords) {
      baseScore += 15;
      evidence.push('Used relevant technical terminology');
      strengths.push('Demonstrated technical vocabulary');
    } else {
      baseScore -= 10;
      weaknesses.push('Missing technical terminology');
    }
    
    if (hasTechnicalDepth) {
      baseScore += 12;
      evidence.push('Provided structured explanation');
      strengths.push('Clear communication structure');
    } else {
      weaknesses.push('Lacks depth in explanation');
    }
    
    if (hasExamples) {
      baseScore += 10;
      evidence.push('Referenced practical experience');
      strengths.push('Connected theory to practice');
    }
    
    if (hasStructure) {
      baseScore += 8;
      strengths.push('Well-organized response');
    }
    
    if (uniqueRatio > 0.7 && wordCount > 20) {
      baseScore += 5;
      confidence += 0.05;
    }
    
    const score = Math.min(100, Math.max(15, baseScore));
    confidence = Math.min(1.0, Math.max(0.2, confidence));
    
    if (score < 40) {
      redFlags.push('Limited technical depth');
    }
    
    return {
      score,
      evidence: evidence.length > 0 ? evidence : ['Provided response to question'],
      strengths: strengths.length > 0 ? strengths : ['Attempted to answer'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Could provide more depth'],
      confidence,
      redFlags
    };
  }

  private mockFinalEvaluation(prompt: string): InterviewEvaluation {
    const scoresMatch = prompt.match(/Individual Scores: (\[.*?\])/s);
    let individualScores: any[] = [];
    
    try {
      if (scoresMatch) {
        individualScores = JSON.parse(scoresMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse individual scores:', e);
    }
    
    if (individualScores.length === 0) {
      return {
        overallScore: 50,
        recommendation: 'review',
        skillBreakdown: {},
        redFlags: ['No evaluation data available'],
        summary: 'Unable to evaluate - insufficient data',
        confidence: 0.3
      };
    }
    
    const skillBreakdown: Record<string, any> = {};
    const skillScores: number[] = [];
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    
    individualScores.forEach((item: any) => {
      const skill = item.skill || 'General';
      const score = item.score || 50;
      const evidence = item.evidence || [];
      const confidence = item.confidence || 0.5;
      
      if (!skillBreakdown[skill]) {
        skillBreakdown[skill] = {
          score,
          evidence,
          confidence
        };
        skillScores.push(score);
        if (item.strengths) allStrengths.push(...item.strengths);
        if (item.weaknesses) allWeaknesses.push(...item.weaknesses);
      } else {
        skillBreakdown[skill].score = Math.round((skillBreakdown[skill].score + score) / 2);
        skillBreakdown[skill].evidence.push(...evidence);
        skillBreakdown[skill].confidence = (skillBreakdown[skill].confidence + confidence) / 2;
      }
    });
    
    const overallScore = Math.round(skillScores.reduce((a, b) => a + b, 0) / skillScores.length);
    
    const avgConfidence = Object.values(skillBreakdown)
      .reduce((sum, skill: any) => sum + skill.confidence, 0) / Object.keys(skillBreakdown).length;
    
    let recommendation: 'proceed' | 'borderline' | 'review';
    if (overallScore >= 75) recommendation = 'proceed';
    else if (overallScore >= 60) recommendation = 'borderline';
    else recommendation = 'review';
    
    const redFlags: string[] = [];
    if (overallScore < 50) redFlags.push('Below expected performance level');
    if (avgConfidence < 0.6) redFlags.push('Inconsistent answer quality');
    
    individualScores.forEach(item => {
      if (item.redFlags && item.redFlags.length > 0) {
        redFlags.push(...item.redFlags);
      }
    });
    
    const summary = this.generateDynamicSummary(
      overallScore,
      recommendation,
      skillBreakdown,
      allStrengths,
      allWeaknesses,
      redFlags
    );
    
    return {
      overallScore,
      recommendation,
      skillBreakdown,
      redFlags: [...new Set(redFlags)],
      summary,
      confidence: Math.round(avgConfidence * 100) / 100
    };
  }

  private generateDynamicSummary(
    overallScore: number,
    recommendation: string,
    skillBreakdown: Record<string, any>,
    strengths: string[],
    weaknesses: string[],
    redFlags: string[]
  ): string {
    const skills = Object.keys(skillBreakdown);
    const skillScores = Object.values(skillBreakdown).map((s: any) => s.score);
    const highScores = skillScores.filter(s => s >= 75).length;
    const lowScores = skillScores.filter(s => s < 60).length;
    
    let summary = '';
    
    if (overallScore >= 85) {
      summary = `Exceptional performance with ${overallScore}/100 overall. `;
      if (highScores === skills.length) {
        summary += `Demonstrated strong expertise across all evaluated skills: ${skills.join(', ')}. `;
      } else {
        summary += `Strong technical depth in ${skills.slice(0, 2).join(' and ')}. `;
      }
      if (strengths.length > 0) {
        summary += `Key strengths include ${strengths.slice(0, 2).join(' and ')}.`;
      }
    } else if (overallScore >= 75) {
      summary = `Solid performance with ${overallScore}/100 overall. `;
      summary += `Good understanding of ${skills.join(', ')} with practical knowledge. `;
      if (weaknesses.length > 0) {
        summary += `Minor improvements needed in ${weaknesses[0].toLowerCase()}.`;
      } else {
        summary += 'Ready for next interview stage.';
      }
    } else if (overallScore >= 60) {
      summary = `Moderate performance with ${overallScore}/100 overall. `;
      if (lowScores > 0) {
        summary += `Gaps identified in ${lowScores} skill area${lowScores > 1 ? 's' : ''}. `;
      }
      if (weaknesses.length > 0) {
        summary += `Needs improvement in ${weaknesses.slice(0, 2).join(' and ')}.`;
      } else {
        summary += 'Additional technical depth required.';
      }
    } else if (overallScore >= 40) {
      summary = `Below expectations with ${overallScore}/100 overall. `;
      summary += `Significant gaps in ${skills.join(', ')}. `;
      if (redFlags.length > 0) {
        summary += `Concerns: ${redFlags[0].toLowerCase()}.`;
      } else {
        summary += 'Fundamental concepts not clearly demonstrated.';
      }
    } else {
      summary = `Poor performance with ${overallScore}/100 overall. `;
      summary += `Lacks basic understanding of required skills. `;
      if (redFlags.length > 0) {
        summary += `Critical issues: ${redFlags.slice(0, 2).join(', ').toLowerCase()}.`;
      } else {
        summary += 'Not recommended for this role.';
      }
    }
    
    return summary;
  }

  private mockFollowUp(prompt: string) {
    return {
      followUp: null,
      reason: 'Answer is sufficient',
      shouldAsk: false
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
    const targetSkill = config.skills[currentStep % config.skills.length];
    
    const prompt = QUESTION_GENERATION_PROMPT
      .replace('{role}', config.role)
      .replace(/{role}/g, config.role)
      .replace('{skills}', config.skills.join(', '))
      .replace('{difficulty}', config.difficulty)
      .replace(/{difficulty}/g, config.difficulty)
      .replace('{currentStep}', currentStep.toString())
      .replace('{targetSkill}', targetSkill)
      .replace(/{targetSkill}/g, targetSkill);

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
    console.log('[AI Service] Generating final evaluation with', individualScores.length, 'scores');
    
    const prompt = FINAL_EVALUATION_PROMPT
      .replace('{interviewConfig}', JSON.stringify(config))
      .replace('{allResponses}', JSON.stringify(responses))
      .replace('{individualScores}', JSON.stringify(individualScores))
      .replace('{role}', config.role)
      .replace('{difficulty}', config.difficulty);

    const result = await this.callLLM(prompt);
    console.log('[AI Service] Final evaluation result:', result);
    return result;
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