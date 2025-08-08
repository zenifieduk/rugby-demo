'use client'

import FixturesList from '@/components/fixtures-list'

export default function FixturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixtures</h1>
          <p className="text-gray-600">Super League 2025 fixtures and results</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <FixturesList />
      </div>
    </div>
  )
}