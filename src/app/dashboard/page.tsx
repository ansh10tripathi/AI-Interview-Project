'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { logout } from '@/lib/logout'

interface EvaluationSummary {
  id: string
  sessionId: string
  candidateName: string
  candidateEmail: string
  role: string
  recommendation: 'proceed' | 'borderline' | 'review'
  confidence: number
  scores: any
  redFlags: string[]
  createdAt: string
}

export default function Dashboard() {
  const isChecking = useRoleGuard('admin');
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [deletingSession, setDeletingSession] = useState<string | null>(null)
  const [deletingInterview, setDeletingInterview] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [evalResponse, interviewResponse] = await Promise.all([
        fetch('/api/evaluations'),
        fetch('/api/interviews')
      ])

      const evalResult = await evalResponse.json()
      const interviewResult = await interviewResponse.json()

      if (evalResult.success) {
        setEvaluations(evalResult.evaluations)
      }
      if (interviewResult.success) {
        setInterviews(interviewResult.interviews)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/evaluations?sessionId=${sessionId}`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setSelectedEvaluation(result.evaluation)
      }
    } catch (error) {
      console.error('Error fetching evaluation details:', error)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed': return 'text-green-600 bg-green-100'
      case 'borderline': return 'text-yellow-600 bg-yellow-100'
      case 'review': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const copyInterviewLink = (interviewId: string) => {
    const link = `${window.location.origin}/interview?id=${interviewId}`
    navigator.clipboard.writeText(link)
    alert('Interview link copied to clipboard!')
  }

  const deleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Delete session for ${sessionName}? This cannot be undone.`)) {
      return
    }
    
    setDeletingSession(sessionId)
    try {
      const response = await fetch('/api/sessions/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setInterviews(prev => prev.map(interview => ({
          ...interview,
          sessions: interview.sessions?.filter((s: any) => s.id !== sessionId) || []
        })))
        
        setEvaluations(prev => prev.filter(evaluation => evaluation.sessionId !== sessionId))
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session')
    } finally {
      setDeletingSession(null)
    }
  }

  const deleteInterview = async (interviewId: string, role: string) => {
    if (!confirm(`Delete interview "${role}" and all its sessions? This cannot be undone.`)) {
      return
    }
    
    setDeletingInterview(interviewId)
    try {
      const response = await fetch('/api/interviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setInterviews(prev => prev.filter(interview => interview.id !== interviewId))
        setEvaluations(prev => prev.filter(evaluation => {
          const interview = interviews.find(i => i.id === interviewId)
          return !interview?.sessions?.some((s: any) => s.id === evaluation.sessionId)
        }))
      } else {
        alert('Failed to delete interview')
      }
    } catch (error) {
      console.error('Error deleting interview:', error)
      alert('Failed to delete interview')
    } finally {
      setDeletingInterview(null)
    }
  }

  if (isChecking || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (selectedEvaluation) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluation Details - {selectedEvaluation.candidateName}
            </h1>
            <Button
              variant="outline"
              onClick={() => setSelectedEvaluation(null)}
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Candidate Info</h3>
                <p className="text-gray-600">{selectedEvaluation.candidateEmail}</p>
                <p className="text-gray-600">{selectedEvaluation.role}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Overall Score</h3>
                <p className="text-3xl font-bold text-gray-900">
                {(() => {
                if (!selectedEvaluation.scores) return 0

                const values = Object.values(selectedEvaluation.scores) as any[]
                if (values.length === 0) return 0

                const total = values.reduce((sum, item) => sum + (item?.score ?? 0), 0)
                return Math.round(total / values.length)
              })()}/100

                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Recommendation</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(selectedEvaluation.recommendation)}`}>
                  {selectedEvaluation.recommendation}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEvaluation.scores && Object.entries(selectedEvaluation.scores).map(([skill, data]: [string, any]) => (
                  <div key={skill} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{skill}</h4>
                      <span className="text-lg font-bold text-gray-900">{data.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                    {data.evidence && data.evidence.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {data.evidence.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-gray-400 mr-2">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedEvaluation.redFlags && selectedEvaluation.redFlags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Red Flags</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {selectedEvaluation.redFlags.map((flag: string, idx: number) => (
                      <li key={idx} className="flex items-start text-red-700">
                        <span className="text-red-500 mr-2">⚠</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Responses</h3>
              <div className="space-y-4">
                {selectedEvaluation.responses && selectedEvaluation.responses.map((response: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">Question {idx + 1}</p>
                    <p className="text-gray-700 mb-3">{response.answer}</p>
                    <p className="text-sm text-gray-500">
                      Answered at: {new Date(response.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Dashboard</h1>
          <p className="text-gray-600">Manage interviews and review candidate evaluations</p>
        </div>
        <Button
          variant="destructive"
          onClick={logout}
        >
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Created Interviews */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Created Interviews</h2>
          </div>
          <div className="p-6">
            {interviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No interviews created yet</p>
            ) : (
              <div className="space-y-4">
                {interviews.map(interview => (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{interview.role}</h3>
                      <span className="text-sm text-gray-500">
                        {interview.sessions?.length || 0} sessions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Skills: {JSON.parse(interview.skills).join(', ')}
                    </p>
                    <div className="flex space-x-2 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInterviewLink(interview.id)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteInterview(interview.id, interview.role)}
                        disabled={deletingInterview === interview.id}
                      >
                        {deletingInterview === interview.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    {interview.sessions && interview.sessions.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sessions:</h4>
                        <div className="space-y-2">
                          {interview.sessions.map((session: any) => (
                            <div key={session.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <div>
                                <span className="text-sm font-medium">{session.candidateName}</span>
                                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                  session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {session.status}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteSession(session.id, session.candidateName)}
                                disabled={deletingSession === session.id}
                              >
                                {deletingSession === session.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Candidate Evaluations */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Candidate Evaluations</h2>
          </div>
          <div className="p-6">
            {evaluations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No evaluations available yet</p>
            ) : (
              <div className="space-y-4">
                {evaluations.map(evaluation => (
                  <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{evaluation.candidateName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(evaluation.recommendation)}`}>
                        {evaluation.recommendation}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{evaluation.candidateEmail}</p>
                    <p className="text-sm text-gray-600 mb-3">{evaluation.role}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Confidence: {Math.round(evaluation.confidence * 100)}%
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => viewDetails(evaluation.sessionId)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSession(evaluation.sessionId, evaluation.candidateName)}
                          disabled={deletingSession === evaluation.sessionId}
                        >
                          {deletingSession === evaluation.sessionId ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}