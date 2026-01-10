import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample interviews
  const backendInterview = await prisma.interview.create({
    data: {
      role: 'Backend Engineer',
      skills: JSON.stringify(['API Design', 'Databases', 'System Design', 'Performance']),
      difficulty: 'Mid',
      rubric: JSON.stringify({
        'API Design': 25,
        'Databases': 25,
        'System Design': 30,
        'Performance': 20
      }),
      redFlags: JSON.stringify([
        'No real-world examples',
        'Hand-wavy explanations',
        'Cannot explain trade-offs',
        'No understanding of scalability'
      ]),
      style: 'neutral'
    }
  })

  const frontendInterview = await prisma.interview.create({
    data: {
      role: 'Frontend Developer',
      skills: JSON.stringify(['React', 'JavaScript', 'CSS', 'Performance', 'Testing']),
      difficulty: 'Mid',
      rubric: JSON.stringify({
        'React': 30,
        'JavaScript': 25,
        'CSS': 20,
        'Performance': 15,
        'Testing': 10
      }),
      redFlags: JSON.stringify([
        'No component design understanding',
        'Poor state management knowledge',
        'No testing experience',
        'Cannot explain browser concepts'
      ]),
      style: 'friendly'
    }
  })

  const seniorInterview = await prisma.interview.create({
    data: {
      role: 'Senior Full Stack Engineer',
      skills: JSON.stringify(['Architecture', 'Leadership', 'System Design', 'Mentoring', 'Technical Strategy']),
      difficulty: 'Senior',
      rubric: JSON.stringify({
        'Architecture': 30,
        'Leadership': 25,
        'System Design': 25,
        'Mentoring': 10,
        'Technical Strategy': 10
      }),
      redFlags: JSON.stringify([
        'No leadership experience',
        'Cannot design systems at scale',
        'Poor communication skills',
        'No mentoring experience'
      ]),
      style: 'strict'
    }
  })

  // Create sample interview sessions
  const session1 = await prisma.interviewSession.create({
    data: {
      interviewId: backendInterview.id,
      candidateName: 'John Doe',
      candidateEmail: 'john.doe@example.com',
      status: 'completed',
      currentStep: 5,
      responses: JSON.stringify([
        {
          questionId: '1',
          answer: 'I would design a REST API with clear resource endpoints, proper HTTP methods, and consistent response formats. For authentication, I would use JWT tokens with proper expiration and refresh mechanisms.',
          timestamp: new Date('2024-01-15T10:00:00Z')
        },
        {
          questionId: '2',
          answer: 'SQL databases provide ACID guarantees and are great for structured data with complex relationships. NoSQL databases offer better scalability and flexibility for unstructured data. I would choose SQL for financial systems and NoSQL for content management.',
          timestamp: new Date('2024-01-15T10:05:00Z')
        }
      ]),
      completedAt: new Date('2024-01-15T10:30:00Z')
    }
  })

  const session2 = await prisma.interviewSession.create({
    data: {
      interviewId: frontendInterview.id,
      candidateName: 'Jane Smith',
      candidateEmail: 'jane.smith@example.com',
      status: 'completed',
      currentStep: 5,
      responses: JSON.stringify([
        {
          questionId: '1',
          answer: 'React components should be small, focused, and reusable. I use functional components with hooks for state management and follow the single responsibility principle. Props should be well-typed and components should be easy to test.',
          timestamp: new Date('2024-01-16T14:00:00Z')
        },
        {
          questionId: '2',
          answer: 'For performance optimization, I use React.memo for preventing unnecessary re-renders, useMemo and useCallback for expensive computations, code splitting with lazy loading, and optimize bundle size with tree shaking.',
          timestamp: new Date('2024-01-16T14:05:00Z')
        }
      ]),
      completedAt: new Date('2024-01-16T14:25:00Z')
    }
  })

  // Create sample evaluations
  await prisma.evaluation.create({
    data: {
      sessionId: session1.id,
      scores: JSON.stringify({
        'API Design': {
          score: 85,
          evidence: ['Mentioned JWT authentication', 'Understood REST principles', 'Discussed proper HTTP methods'],
          confidence: 0.9
        },
        'Databases': {
          score: 78,
          evidence: ['Explained ACID properties', 'Understood SQL vs NoSQL tradeoffs', 'Provided good use cases'],
          confidence: 0.85
        },
        'System Design': {
          score: 72,
          evidence: ['Basic understanding shown', 'Could improve on scalability concepts'],
          confidence: 0.7
        },
        'Performance': {
          score: 65,
          evidence: ['Limited performance optimization knowledge'],
          confidence: 0.6
        }
      }),
      evidence: JSON.stringify([
        'Strong API design knowledge',
        'Good database fundamentals',
        'Needs improvement in system design'
      ]),
      recommendation: 'proceed',
      confidence: 0.8,
      redFlags: JSON.stringify([])
    }
  })

  await prisma.evaluation.create({
    data: {
      sessionId: session2.id,
      scores: JSON.stringify({
        'React': {
          score: 92,
          evidence: ['Excellent component design principles', 'Strong hooks knowledge', 'Good testing awareness'],
          confidence: 0.95
        },
        'JavaScript': {
          score: 88,
          evidence: ['Solid JS fundamentals', 'Good ES6+ knowledge'],
          confidence: 0.9
        },
        'CSS': {
          score: 75,
          evidence: ['Basic CSS knowledge', 'Could improve on advanced concepts'],
          confidence: 0.8
        },
        'Performance': {
          score: 90,
          evidence: ['Excellent performance optimization knowledge', 'Mentioned React.memo, useMemo, code splitting'],
          confidence: 0.92
        },
        'Testing': {
          score: 70,
          evidence: ['Basic testing understanding'],
          confidence: 0.7
        }
      }),
      evidence: JSON.stringify([
        'Excellent React knowledge',
        'Strong performance optimization skills',
        'Good overall frontend understanding'
      ]),
      recommendation: 'proceed',
      confidence: 0.9,
      redFlags: JSON.stringify([])
    }
  })

  console.log('Database seeded successfully!')
  console.log(`Created interviews:`)
  console.log(`- Backend Engineer: ${backendInterview.id}`)
  console.log(`- Frontend Developer: ${frontendInterview.id}`)
  console.log(`- Senior Full Stack Engineer: ${seniorInterview.id}`)
  console.log(`\nSample interview links:`)
  console.log(`- Backend: http://localhost:3000/interview?id=${backendInterview.id}`)
  console.log(`- Frontend: http://localhost:3000/interview?id=${frontendInterview.id}`)
  console.log(`- Senior: http://localhost:3000/interview?id=${seniorInterview.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })