'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InterviewQuestion, InterviewEvaluation } from '@/types/interview'
import { getHomeRoute } from '@/lib/navigation'

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('id')
  
  const [step, setStep] = useState<'start' | 'interview' | 'complete' | 'locked' | 'ended'>('start')
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReturnHome = async () => {
    const homeRoute = await getHomeRoute();
    window.location.href = homeRoute;
  }

  // Check for existing session on load
  useEffect(() => {
    const savedSessionId = localStorage.getItem(`interview-session-${interviewId}`)
    if (savedSessionId) {
      setSessionId(savedSessionId)
      resumeInterview(savedSessionId)
    }
  }, [interviewId])

  const resumeInterview = async (sessionId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      const result = await response.json()
      
      if (result.success) {
        const session = result.session
        
        if (session.status === 'locked') {
          setStep('locked')
          return
        }
        
        if (session.status === 'completed') {
          setStep('complete')
          setCandidateName(session.candidateName)
          setCandidateEmail(session.candidateEmail)
          if (session.evaluation) {
            try {
              setEvaluation(JSON.parse(session.evaluation))
            } catch (e) {
              console.error('Failed to parse evaluation:', e)
            }
          }
        } else if (session.status === 'active') {
          setStep('interview')
          setCandidateName(session.candidateName)
          setCandidateEmail(session.candidateEmail)
          
          if (session.currentQuestion && session.currentQuestion.text) {
            setCurrentQuestion(session.currentQuestion)
            setQuestionIndex(session.currentStep || 0)
            setProgress(session.progress || 0)
          } else {
            setError('Failed to load interview question. Please refresh the page.')
          }
        }
      } else {
        localStorage.removeItem(`interview-session-${interviewId}`)
        setStep('start')
      }
    } catch (error) {
      console.error('Error resuming interview:', error)
      localStorage.removeItem(`interview-session-${interviewId}`)
      setStep('start')
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const startInterview = async () => {
    if (!candidateName.trim()) {
      alert('Please enter your full name')
      return
    }

    if (!candidateEmail.trim()) {
      alert('Please enter your email address')
      return
    }

    if (!validateEmail(candidateEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailError('')
    setLoading(true)
    setError(null)
    
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
        if (!result.question || !result.question.text) {
          setError('Failed to generate interview question. Please try again.')
          return
        }
        
        setSessionId(result.sessionId)
        setCurrentQuestion(result.question)
        setQuestionIndex(result.questionIndex || 0)
        setProgress(result.progress || 0)
        setStep('interview')
        localStorage.setItem(`interview-session-${interviewId}`, result.sessionId)
      } else {
        if (result.error?.includes('already completed')) {
          setError('You have already completed this interview. You cannot retake it.')
        } else {
          setError(result.error || 'Failed to start interview')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to start interview. Please check your connection and try again.')
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
          localStorage.removeItem(`interview-session-${interviewId}`)
        } else {
          if (result.nextQuestion) {
            setCurrentQuestion(result.nextQuestion)
          }
          if (typeof result.progress === 'number') {
            setProgress(result.progress)
          }
          if (typeof result.updatedStep === 'number') {
            setQuestionIndex(result.updatedStep)
          }
          setAnswer('')
        }
      } else {
        if (result.error?.includes('already completed')) {
          setStep('complete')
          localStorage.removeItem(`interview-session-${interviewId}`)
        } else if (result.error?.includes('session has ended')) {
          setStep('ended')
          localStorage.removeItem(`interview-session-${interviewId}`)
        } else {
          setError(result.error || 'Failed to submit answer')
        }
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

  if (step === 'locked') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Locked</h1>
          <p className="text-gray-600 mb-4">
            This interview session has been locked by the administrator.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the interviewer if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  if (step === 'ended') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Interview Session Ended</h1>
        <p className="text-gray-600 mt-2">This interview session has been terminated by the administrator.</p>
        <p className="text-gray-500 mt-4">Please contact the interviewer if you believe this is an error.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button 
          onClick={() => {
            setError(null)
            setStep('start')
          }} 
          className="mt-4"
        >
          Try Again
        </Button>
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
                onChange={(e) => {
                  setCandidateEmail(e.target.value)
                  setEmailError('')
                }}
                placeholder="Enter your email address"
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1">{emailError}</p>
              )}
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
    if (loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <p className="text-gray-600">Loading interview...</p>
          </div>
        </div>
      )
    }

    if (!currentQuestion) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">Failed to load interview question</p>
            <Button onClick={() => setStep('start')}>Return to Start</Button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">Interview in Progress</h1>
              <span className="text-sm text-gray-500">Question {questionIndex + 1} of 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-6">
            {currentQuestion ? (
              <div className="space-y-6" key={currentQuestion.id}>
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
            ) : (
              <p className="text-gray-500">Loading question...</p>
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
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
            <p className="text-gray-600">
              Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
            </p>
          </div>
          
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              You have already completed this interview. You cannot retake or modify your answers.
            </p>
            <Button onClick={handleReturnHome} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}