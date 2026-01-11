import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InterviewOS - AI-Native Interview Infrastructure',
  description: 'Scalable, consistent, and structured AI interviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">InterviewOS</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-gray-900 admin-only">Home</a>
                <a href="/create" className="text-gray-700 hover:text-gray-900 admin-only">Create Interview</a>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900 admin-only">Dashboard</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <script dangerouslySetInnerHTML={{
          __html: `
            const isCandidate = window.location.pathname.startsWith('/interview');
            if (isCandidate) {
              document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
            }
          `
        }} />
      </body>
    </html>
  )
}