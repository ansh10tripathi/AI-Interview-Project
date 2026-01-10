# InterviewOS - AI-Native First Round Interview Infrastructure

A hackathon-ready MVP that converts first-round interviews into programmable, scalable software infrastructure using AI interviewers.

## 🚀 Features

- **Configurable AI Interviewers**: Create interviews by defining role, skills, difficulty, and evaluation criteria
- **Scalable Interview Sessions**: Multiple candidates can interview simultaneously 
- **Structured Evaluations**: Extract machine-readable signals instead of raw transcripts
- **Human Review Dashboard**: Visualize scores, evidence, and AI recommendations
- **Interview as Code**: JSON-based interview schemas for consistency

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Recruiter     │    │   AI Interview   │    │   Reviewer      │
│   Creates       │───▶│   Engine         │───▶│   Dashboard     │
│   Interview     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Interview       │    │ State Machine    │    │ Structured      │
│ Schema          │    │ + Prompts        │    │ Evaluations     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with Prisma ORM
- **AI Layer**: Mock LLM interface (easily replaceable with OpenAI/Anthropic)
- **UI Components**: Custom components with Radix UI primitives

## 📦 Installation

1. **Clone and install dependencies**:
```bash
cd interview-os
npm install
```

2. **Set up the database**:
```bash
npm run db:push
npm run db:seed
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open your browser**:
Navigate to `http://localhost:3000`

## 🎯 Demo Flow

### 1. Create an Interview (Recruiter)
- Go to `/create`
- Define job role (e.g., "Backend Engineer")
- Add skills to evaluate (e.g., "API Design", "Databases")
- Set difficulty level (Junior/Mid/Senior)
- Configure interview style (Friendly/Neutral/Strict)
- Add red flags to watch for
- Click "Create Interview"

### 2. Share Interview Link
- Copy the generated interview link from the dashboard
- Share with candidates: `http://localhost:3000/interview?id={interview-id}`

### 3. Candidate Takes Interview
- Candidate enters name and email
- AI interviewer asks role-specific questions
- Questions adapt based on previous answers
- Progress bar shows completion status
- Structured evaluation generated at the end

### 4. Review Results (Reviewer)
- Go to `/dashboard`
- View all candidate evaluations
- See skill-by-skill breakdown with evidence
- Review AI recommendation (Proceed/Borderline/Review)
- Access detailed conversation transcripts

## 📊 Sample Interview Schema

```json
{
  "role": "Backend Engineer",
  "skills": ["API Design", "Databases", "System Design"],
  "difficulty": "Mid",
  "rubric": {
    "API Design": 30,
    "Databases": 35,
    "System Design": 35
  },
  "redFlags": [
    "No real-world examples",
    "Hand-wavy explanations",
    "Cannot explain trade-offs"
  ],
  "style": "neutral"
}
```

## 🤖 AI Interview Engine

The system uses a prompt-based approach with structured JSON outputs:

### Question Generation
- Analyzes role requirements and candidate level
- Generates contextual follow-up questions
- Maintains interview flow and progression

### Answer Evaluation  
- Scores responses on 0-100 scale
- Extracts evidence snippets
- Identifies strengths and weaknesses
- Detects red flags from rubric

### Final Assessment
- Aggregates individual question scores
- Provides overall recommendation
- Generates explainable evaluation summary

## 🔧 Customization

### Replace Mock AI with Real LLM
Update `src/lib/ai-service.ts`:

```typescript
private async callLLM(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### Add New Interview Types
1. Create new interview schema in seed data
2. Add role-specific prompt templates
3. Configure skill-specific evaluation criteria

### Extend Evaluation Metrics
1. Update `InterviewEvaluation` type
2. Modify evaluation prompts
3. Add new dashboard visualizations

## 📁 Project Structure

```
interview-os/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── create/            # Interview creation page
│   │   ├── interview/         # Candidate interview page
│   │   └── dashboard/         # Reviewer dashboard
│   ├── components/ui/         # Reusable UI components
│   ├── lib/                   # Core business logic
│   │   ├── ai-service.ts      # AI interview engine
│   │   ├── interview-state-machine.ts
│   │   ├── prompts.ts         # AI prompt templates
│   │   └── db.ts              # Database client
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema & seeds
└── public/                    # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔮 Future Enhancements

- **Voice Interviews**: Web Speech API integration
- **Video Analysis**: Facial expression and body language evaluation  
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Interview performance metrics
- **Integration APIs**: ATS and HRIS system connectors
- **Real-time Collaboration**: Multiple reviewers
- **Custom Scoring Models**: ML-based evaluation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Port Conflicts
```bash
# Use different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

**Built for hackathons, designed for production.**

Transform your hiring process with AI-native interview infrastructure that scales.