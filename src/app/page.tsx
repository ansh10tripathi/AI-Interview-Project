'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Home() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isCandidate = typeof window !== 'undefined' && window.location.pathname.startsWith('/interview')
  
  useEffect(() => {
    if (isCandidate) {
      router.push('/interview')
    }
  }, [isCandidate, router])
  
  if (isCandidate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
        <p className="text-gray-600 mt-2">Please use your interview link to continue.</p>
      </div>
    )
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          InterviewOS
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          AI-Native First Round Interview Infrastructure
        </p>
        <p className="mt-4 text-base text-gray-500">
          Convert first-round interviews into programmable, scalable software infrastructure using AI interviewers.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/create">
            <Button size="lg">
              Create Interview
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Configurable</h3>
          <p className="mt-2 text-gray-600">
            Define job roles, skills, difficulty levels, and evaluation rubrics
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Scalable</h3>
          <p className="mt-2 text-gray-600">
            Interview multiple candidates simultaneously with consistent quality
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Structured</h3>
          <p className="mt-2 text-gray-600">
            Extract structured signals instead of raw transcripts for better decisions
          </p>
        </div>
      </div>

      <div className="mt-16 bg-white p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900">Create Interview</h3>
            <p className="text-gray-600 mt-2">Define role, skills, and evaluation criteria</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900">AI Interviews</h3>
            <p className="text-gray-600 mt-2">Candidates interact with AI interviewer</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900">Review Results</h3>
            <p className="text-gray-600 mt-2">Get structured evaluations and recommendations</p>
          </div>
        </div>
      </div>
    </div>
  )
}