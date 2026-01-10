'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InterviewQuestion, InterviewEvaluation } from '@/types/interview'

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('id')
  
  const [step, setStep] = useState<'start' | 'interview' | 'complete'>('start')
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null)

  const startInterview = async () => {
    if (!candidateName || !candidateEmail) {
      alert('Please enter your name and email')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          candidateName,
          candidateEmail
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setSessionId(result.sessionId)
        setCurrentQuestion(result.question)
        setStep('interview')
      } else {
        alert('Failed to start interview')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answer
        })
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.isComplete) {
          setEvaluation(result.evaluation)
          setStep('complete')
        } else {
          setCurrentQuestion(result.nextQuestion)
          setProgress(result.progress || 0)
          setAnswer('')
        }
      } else {
        alert('Failed to submit answer')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }

  if (!interviewId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invalid Interview Link</h1>
        <p className="text-gray-600 mt-2">Please check your interview link and try again.</p>
      </div>
    )
  }

  if (step === 'start') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Your Interview</h1>
          <p className="text-gray-600 mb-8">
            You're about to start an AI-powered interview. Please provide your details to begin.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={startInterview}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Starting Interview...' : 'Start Interview'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'interview') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">Interview in Progress</h1>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-6">
            {currentQuestion && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Question
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800">{currentQuestion.text}</p>
                    {currentQuestion.skill && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {currentQuestion.skill}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={6}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={submitAnswer}
                    disabled={loading || !answer.trim()}
                  >
                    {loading ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview Complete!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
          </p>
          
          {evaluation && (
            <div className="bg-gray-50 p-6 rounded-lg text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Overall Score</span>
                  <p className="text-2xl font-bold text-gray-900">{evaluation.overallScore}/100</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Recommendation</span>
                  <p className="text-lg font-semibold capitalize text-gray-900">
                    {evaluation.recommendation}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">Summary</span>
                <p className="text-gray-700 mt-1">{evaluation.summary}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}