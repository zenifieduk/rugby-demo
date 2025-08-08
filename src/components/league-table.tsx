'use client'

import { useState } from 'react'
import fixturesData from '@/data/super-league-2025-fixtures-results.json'

interface TeamStats {
  team: string
  played: number
  won: number
  lost: number
  drawn: number
  pointsFor: number
  pointsAgainst: number
  pointsDiff: number
  points: number
}

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

export default function LeagueTable() {
  const [upToRound, setUpToRound] = useState<number>(20) // Show up to Round 20 (latest complete data)
  
  // Normalize team names to handle inconsistencies
  const normalizeTeamName = (teamName: string): string => {
    const normalizations: { [key: string]: string } = {
      'Hull KR': 'Hull Kingston Rovers',
      'Hull Kingston Rovers': 'Hull Kingston Rovers'
    }
    return normalizations[teamName] || teamName
  }

  const calculateTable = (maxRound: number): TeamStats[] => {
    const teams: { [key: string]: TeamStats } = {}
    
    // Initialize all teams
    const allTeams = new Set<string>()
    fixturesData.fixtures.forEach(round => {
      round.matches.forEach(match => {
        allTeams.add(normalizeTeamName(match.home))
        allTeams.add(normalizeTeamName(match.away))
      })
    })
    
    allTeams.forEach(team => {
      teams[team] = {
        team,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0,
        points: 0
      }
    })
    
    // Process matches up to the specified round
    fixturesData.fixtures
      .filter(round => round.round <= maxRound)
      .forEach(round => {
        round.matches.forEach(match => {
          if (match.result) {
            const homeTeamName = normalizeTeamName(match.home)
            const awayTeamName = normalizeTeamName(match.away)
            const homeTeam = teams[homeTeamName]
            const awayTeam = teams[awayTeamName]
            
            // Update played games
            homeTeam.played++
            awayTeam.played++
            
            // Update points for/against
            homeTeam.pointsFor += match.result.home
            homeTeam.pointsAgainst += match.result.away
            awayTeam.pointsFor += match.result.away
            awayTeam.pointsAgainst += match.result.home
            
            // Determine winner and update wins/losses/draws
            if (match.result.home > match.result.away) {
              homeTeam.won++
              homeTeam.points += 2 // 2 points for a win
              awayTeam.lost++
            } else if (match.result.away > match.result.home) {
              awayTeam.won++
              awayTeam.points += 2 // 2 points for a win
              homeTeam.lost++
            } else {
              homeTeam.drawn++
              awayTeam.drawn++
              homeTeam.points += 1 // 1 point for a draw
              awayTeam.points += 1 // 1 point for a draw
            }
            
            // Update points difference
            homeTeam.pointsDiff = homeTeam.pointsFor - homeTeam.pointsAgainst
            awayTeam.pointsDiff = awayTeam.pointsFor - awayTeam.pointsAgainst
          }
        })
      })
    
    // Convert to array and sort
    return Object.values(teams)
      .filter(team => team.played > 0) // Only show teams that have played
      .sort((a, b) => {
        // Sort by points, then by points difference, then by points for
        if (b.points !== a.points) return b.points - a.points
        if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff
        return b.pointsFor - a.pointsFor
      })
  }
  
  const table = calculateTable(upToRound)
  const totalRounds = fixturesData.fixtures.length

  return (
    <div className="bg-white border border-gray-300">
      <div className="border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">
            Betfred Super League Table
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="round-select" className="text-sm font-medium text-black">
              Up to Round:
            </label>
            <select
              id="round-select"
              value={upToRound}
              onChange={(e) => setUpToRound(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black"
            >
              {Array.from({ length: totalRounds }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Round {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-black">#</th>
              <th className="text-left p-3 text-sm font-semibold text-black">Team</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Played</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Won</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Lost</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Drawn</th>
              <th className="text-center p-3 text-sm font-semibold text-black">For</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Against</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Pts Diff</th>
              <th className="text-center p-3 text-sm font-semibold text-black">Points</th>
            </tr>
          </thead>
          <tbody>
            {table.map((team, index) => {
              const isWigan = team.team === "Wigan Warriors"
              return (
                <tr 
                  key={team.team} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isWigan ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                  <td className={`p-3 text-sm font-medium ${isWigan ? 'text-red-800 font-bold' : 'text-black'}`}>
                    {isWigan ? (
                      <span className="bg-red-200 px-1 rounded">{team.team}</span>
                    ) : (
                      team.team
                    )}
                  </td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.played}</td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.won}</td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.lost}</td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.drawn}</td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.pointsFor}</td>
                  <td className="p-3 text-sm text-center text-gray-700">{team.pointsAgainst}</td>
                  <td className={`p-3 text-sm text-center font-medium ${
                    team.pointsDiff > 0 ? 'text-green-600' : team.pointsDiff < 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {team.pointsDiff > 0 ? '+' : ''}{team.pointsDiff}
                  </td>
                  <td className="p-3 text-sm text-center font-bold text-black">{team.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {table.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No match results available for the selected rounds.
        </div>
      )}
    </div>
  )
}