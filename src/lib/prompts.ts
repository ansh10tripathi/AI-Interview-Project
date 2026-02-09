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
Evaluate this technical interview answer. Return ONLY valid JSON with no markdown, explanations, or extra text.

Question: {question}
Answer: {answer}
Skill: {skill}
Expected: {expectedPoints}
Level: {difficulty}

Return this exact JSON structure:
{
  "score": number,
  "evidence": ["specific quotes from answer"],
  "strengths": ["what they did well"],
  "weaknesses": ["areas for improvement"],
  "confidence": number,
  "redFlags": ["concerning responses"]
}

Scoring (0-100):
90-100: Expert level, comprehensive, accurate
75-89: Strong technical knowledge, clear communication
60-74: Basic understanding, some gaps
40-59: Significant gaps, unclear
0-39: Poor understanding or off-topic
`;

export const FINAL_EVALUATION_PROMPT = `
Generate final interview evaluation. Return ONLY valid JSON with no markdown or extra text.

Config: {interviewConfig}
Responses: {allResponses}
Scores: {individualScores}

Return this exact JSON structure:
{
  "overallScore": number,
  "recommendation": "proceed" | "review" | "reject",
  "skillBreakdown": {
    "skillName": {
      "score": number,
      "evidence": ["supporting quotes"]
    }
  },
  "redFlags": ["concerning patterns"],
  "summary": "evaluation summary",
  "confidence": number
}

Recommendations:
- "proceed": score >= 75, no major flags
- "review": score 50-74 or some concerns  
- "reject": score < 50 or major flags
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