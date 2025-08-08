'use client'

import LeagueTable from '@/components/league-table'

export default function TablesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-600">Super League 2025 standings and statistics</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <LeagueTable />
      </div>
    </div>
  )
}