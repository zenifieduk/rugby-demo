'use client'

import { Sidebar } from '@/components/sidebar'
import { VoiceProvider } from '@/components/voice-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <VoiceProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </VoiceProvider>
  )
}