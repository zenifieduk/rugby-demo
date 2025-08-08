'use client'

import { useState } from 'react'
import fixturesData from '@/data/super-league-2025-fixtures-results.json'

interface Match {
  date: string
  ko: string
  home: string
  away: string
  venue: string
  result: {
    home: number
    away: number
    winner: string
  }
}

interface FixtureRound {
  round: number
  matches: Match[]
}

export default function FixturesList() {
  const [selectedRound, setSelectedRound] = useState<number | 'all'>(1)
  
  const fixtures: FixtureRound[] = fixturesData.fixtures
  const totalRounds = fixtures.length

  const filteredFixtures = selectedRound === 'all' 
    ? fixtures 
    : fixtures.filter(round => round.round === selectedRound)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatKickOff = (ko: string) => {
    return ko
  }

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">
            {fixturesData.competition} - {fixturesData.season}
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="round-select" className="text-sm font-medium text-black">
              Round:
            </label>
            <select
              id="round-select"
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black"
            >
              <option value="all">All Rounds</option>
              {Array.from({ length: totalRounds }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Round {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {filteredFixtures.map((round) => (
          <div key={round.round} className="border-b border-gray-200 last:border-b-0">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-black">Round {round.round}</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {round.matches.map((match, index) => {
                const isWiganMatch = match.home === "Wigan Warriors" || match.away === "Wigan Warriors";
                return (
                  <div key={index} className={`p-3 ${isWiganMatch ? 'bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-sm font-medium ${isWiganMatch ? 'text-red-800 font-bold' : 'text-black'}`}>
                            <span className={match.home === "Wigan Warriors" ? 'bg-red-200 px-1 rounded' : ''}>
                              {match.home}
                            </span>
                            {' vs '}
                            <span className={match.away === "Wigan Warriors" ? 'bg-red-200 px-1 rounded' : ''}>
                              {match.away}
                            </span>
                          </div>
                        {match.result && (
                          <div className="text-sm font-semibold text-black">
                            {match.result.home} - {match.result.away}
                          </div>
                        )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{formatDate(match.date)}</span>
                          <span>{formatKickOff(match.ko)}</span>
                          <span>{match.venue}</span>
                        </div>
                        
                        {match.result && (
                          <div className="text-xs text-gray-700 mt-1">
                            Winner: <span className="font-medium">{match.result.winner}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredFixtures.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No fixtures found for the selected round.
        </div>
      )}
    </div>
  )
}