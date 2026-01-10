'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InterviewConfig } from '@/types/interview'
import { useRoleGuard } from '@/lib/useRoleGuard'

export default function CreateInterview() {
  useRoleGuard('admin');
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<Partial<InterviewConfig>>({
    role: '',
    skills: [],
    difficulty: 'Mid',
    rubric: {},
    redFlags: [],
    style: 'neutral'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const result = await response.json()
      
      if (result.success) {
        router.push(`/dashboard?created=${result.interviewId}`)
      } else {
        alert('Failed to create interview')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    const skill = prompt('Enter skill name:')
    if (skill && !config.skills?.includes(skill)) {
      setConfig(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setConfig(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill) || []
    }))
  }

  const addRedFlag = () => {
    const flag = prompt('Enter red flag:')
    if (flag && !config.redFlags?.includes(flag)) {
      setConfig(prev => ({
        ...prev,
        redFlags: [...(prev.redFlags || []), flag]
      }))
    }
  }

  const removeRedFlag = (flag: string) => {
    setConfig(prev => ({
      ...prev,
      redFlags: prev.redFlags?.filter(f => f !== flag) || []
    }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create Interview</h1>
          <p className="text-gray-600">Configure your AI interviewer</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Role
            </label>
            <Input
              value={config.role || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Backend Engineer, Frontend Developer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills to Evaluate
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.skills?.map(skill => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addSkill}>
              Add Skill
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={config.difficulty || 'Mid'}
              onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Style
            </label>
            <select
              value={config.style || 'neutral'}
              onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="friendly">Friendly</option>
              <option value="neutral">Neutral</option>
              <option value="strict">Strict</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Red Flags to Watch For
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.redFlags?.map(flag => (
                <span
                  key={flag}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {flag}
                  <button
                    type="button"
                    onClick={() => removeRedFlag(flag)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addRedFlag}>
              Add Red Flag
            </Button>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Interview'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}