export const QUESTION_GENERATION_PROMPT = `
You are an AI technical interviewer for a {role} position.

Role: {role}
Skills to evaluate: {skills}
Difficulty: {difficulty}
Question index: {currentStep}

Generate ONE technical question that:
1. Tests the skill: {targetSkill}
2. Is specific to {role} responsibilities
3. Matches {difficulty} level
4. Is NOT generic or behavioral

Return JSON:
{
  "question": "One specific technical question",
  "skill": "{targetSkill}",
  "expectedPoints": ["key technical points"]
}
`;

export const ANSWER_EVALUATION_PROMPT = `
You are evaluating a candidate's answer in a technical interview.

Question: {question}
Candidate Answer: {answer}
Skill Being Evaluated: {skill}
Expected Points: {expectedPoints}
Difficulty Level: {difficulty}

Analyze the answer and return JSON:
{
  "score": 0-100,
  "evidence": ["specific quotes or points from the answer that demonstrate competency"],
  "strengths": ["what they did well"],
  "weaknesses": ["areas for improvement"],
  "confidence": 0.0-1.0,
  "redFlags": ["any concerning responses"]
}

Scoring criteria:
- 90-100: Exceptional - Deep understanding, real-world experience, best practices
- 75-89: Strong - Good technical knowledge, clear communication, practical approach
- 60-74: Adequate - Basic understanding, some gaps, needs more depth
- 40-59: Weak - Significant gaps, unclear explanations, limited knowledge
- 0-39: Poor - Fundamental misunderstandings, off-topic, or no meaningful content

Evaluate based on:
- Technical accuracy and depth
- Evidence of real-world experience
- Problem-solving approach
- Communication clarity
- Coverage of expected points
- Appropriate for {difficulty} level

Be objective and vary scores based on actual answer quality.
`;

export const FINAL_EVALUATION_PROMPT = `
You are conducting a final evaluation of an interview session.

Interview Config: {interviewConfig}
All Q&A Pairs: {allResponses}
Individual Scores: {individualScores}

Generate final evaluation JSON:
{
  "overallScore": 0-100,
  "recommendation": "proceed" | "borderline" | "review",
  "skillBreakdown": {
    "skillName": {
      "score": 0-100,
      "evidence": ["supporting quotes from answers"],
      "confidence": 0.0-1.0
    }
  },
  "redFlags": ["any concerning patterns"],
  "summary": "2-3 sentence evaluation summary",
  "confidence": 0.0-1.0
}

Calculate overallScore as the average of all skill scores from individualScores.
Calculate confidence as the average of all individual confidence scores.

Recommendation guidelines:
- "proceed": overallScore >= 75 and no major red flags
- "borderline": overallScore 60-74 or some concerns
- "review": overallScore < 60 or significant red flags

Consider:
- Consistency across answers
- Depth vs breadth of knowledge
- Communication quality
- Red flags from rubric
- Overall fit for {role} at {difficulty} level

Base all scores on actual candidate responses, not assumptions.
`;

export const FOLLOW_UP_PROMPT = `
Based on the candidate's answer, generate a relevant follow-up question.

Original Question: {question}
Candidate Answer: {answer}
Skill: {skill}
Style: {style}

Generate JSON:
{
  "followUp": "follow-up question text",
  "reason": "why this follow-up is valuable",
  "shouldAsk": true/false
}

Only suggest follow-ups that:
- Probe deeper into their understanding
- Clarify vague or incomplete answers
- Explore real-world application
- Are worth the interview time
`;