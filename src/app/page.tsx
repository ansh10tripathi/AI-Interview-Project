'use client'

import { useSearchParams } from 'next/navigation'

export default function HomePage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {message === 'admin_redirect' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> You are logged in as an admin. Please log out to access candidate features.
            </p>
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Interview Platform
          </h1>
          <p className="text-xl text-gray-600">
            Complete your technical interview with our AI-powered system
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            For Candidates
          </h2>
          <p className="text-gray-600 mb-6">
            If you received an interview link, click it to start your interview session.
            The link contains your unique interview ID.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Interview links are sent via email. 
              If you haven't received one, please contact your recruiter.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            For Administrators
          </h2>
          <p className="text-gray-600 mb-6">
            Manage interviews, review evaluations, and configure interview settings.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
