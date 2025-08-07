# Voice-Controlled Dashboard Blueprint
*Architecture guide for bspoq.ai voice-enabled web applications*

## Project Overview
This blueprint documents the architecture for building voice-controlled dashboards that maintain persistent ElevenLabs voice agent connections while navigating between pages. Perfect for AI-powered sports analytics, energy monitoring, or any real-time dashboard application.

## Core Architecture Pattern: Persistent Layout with Client-Side Navigation

### Key Concept
Uses Next.js App Router's **Persistent Layout Pattern** to maintain voice agent sessions during navigation:
- Sidebar and layout components never unmount
- Client-side navigation prevents page reloads
- Voice agent state and context remain active
- DOM elements stay stable for voice control

## Tech Stack

### Framework & Core
- **Next.js 15.4+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **React 18+** with client components

### UI & Components
- **shadcn/ui** - Pre-built component library
- **Lucide React** - Icon system
- **Custom sidebar** with persistent navigation

### State & Data
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **Prisma ORM** - Database integration

### Voice Integration Ready
- **ElevenLabs Conversational AI** (REST API + streaming)
- **Client-side navigation** preserves voice agent state
- **DOM-stable elements** for voice control

### Development Tools
- **ESLint + Prettier** with Tailwind plugin
- **NextAuth.js v5** for authentication
- **Git workflow** with structured commits

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Route group - preserves layout
│   │   ├── layout.tsx         # Persistent shell (CRITICAL)
│   │   ├── page.tsx           # Redirects to default route
│   │   ├── squad/page.tsx     # Individual pages
│   │   ├── fixtures/page.tsx
│   │   └── tables/page.tsx
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home redirect
│   └── globals.css            # Brand colors + Tailwind
├── components/
│   ├── sidebar.tsx            # Persistent navigation (CRITICAL)
│   └── ui/                    # shadcn/ui components
├── data/                      # JSON data files
├── lib/
│   └── utils.ts               # Utility functions
└── store/                     # Zustand stores
```

## Critical Implementation Details

### 1. Persistent Layout Setup
```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar /> {/* NEVER UNMOUNTS */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children} {/* Only this changes */}
        </div>
      </main>
    </div>
  )
}
```

### 2. Client-Side Navigation
```typescript
// src/components/sidebar.tsx
'use client'
import Link from 'next/link' // CLIENT-SIDE ROUTING
import { usePathname } from 'next/navigation'

// Navigation preserves voice connections
<Link href="/squad" className="nav-item">Squad</Link>
```

### 3. Brand Color System
```css
/* src/app/globals.css */
:root {
  --wigan-burgundy: #862633;  /* Primary brand */
  --wigan-white: #FFFFFF;     /* Secondary */
  --wigan-black: #15100C;     /* Accent */
}
```

## Setup Commands (Zero to Running)

### 1. Initialize Project
```bash
npx create-next-app@latest project-name \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --yes
cd project-name
```

### 2. Install Dependencies
```bash
# UI & Icons
npx shadcn@latest init
npx shadcn@latest add button card input
npm install lucide-react

# State & Data
npm install zustand @tanstack/react-query
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite

# Auth & Tools
npm install next-auth@beta bcryptjs
npm install --save-dev @types/bcryptjs
npm install --save-dev prettier prettier-plugin-tailwindcss eslint-config-prettier
```

### 3. Create Dashboard Structure
```bash
mkdir -p src/app/\(dashboard\)/{squad,fixtures,tables}
mkdir -p src/components
mkdir -p src/store
mkdir -p src/data
```

### 4. Configure Brand Colors
Add brand colors to `globals.css` and apply to sidebar component.

### 5. Setup Navigation
- Create persistent sidebar component
- Implement dashboard layout
- Add route pages with basic structure

## Voice Integration Architecture

### ElevenLabs Conversational AI Pattern
```typescript
// Recommended: Initialize in layout.tsx
'use client'
import { useState, useEffect, useRef } from 'react'

export function VoiceProvider({ children }) {
  const [agentId, setAgentId] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const audioRef = useRef(null)
  
  useEffect(() => {
    // Initialize ElevenLabs agent via API
    // Agent state persists during navigation
    initializeVoiceAgent()
  }, [])
  
  const initializeVoiceAgent = async () => {
    // Create agent session via REST API
    // Maintains conversation context across page changes
  }
  
  return (
    <VoiceContext.Provider value={{ agentId, conversationId, audioRef }}>
      {children}
    </VoiceContext.Provider>
  )
}
```

### Why ElevenLabs Conversational AI > WebSocket
1. **Vercel Compatibility** - No persistent connections needed
2. **Serverless Friendly** - Works with edge functions
3. **Better Reliability** - Handles network drops gracefully
4. **Conversation Persistence** - Agent remembers context via API
5. **Simpler State Management** - REST endpoints easier to manage

### DOM Stability for Voice Control
- Use consistent `data-voice-target` attributes
- Sidebar elements maintain stable DOM positions
- Navigation items have predictable selectors
- Agent can reference page context through conversation API

## Key Benefits

1. **Voice Persistence** - Agent sessions maintained during navigation
2. **Performance** - Instant page transitions
3. **State Continuity** - No loss of voice agent context
4. **SEO Friendly** - Still uses proper routing
5. **Scalable** - Easy to add new dashboard sections

## Brand Integration

### Color System
Define brand colors in CSS variables and apply consistently:
- Primary: Use for sidebar, active states
- Secondary: Use for text, backgrounds
- Accent: Use for highlights, status indicators

### Logo Implementation
```tsx
<img 
  src="/images/club-badges/logo.svg" 
  alt="Brand Logo" 
  className="h-8 w-8"
/>
```

## Development Workflow

1. **Create feature branch**
2. **Add new dashboard page** in `(dashboard)/` folder
3. **Update navigation** in sidebar component
4. **Test voice integration** (connections maintained)
5. **Commit with descriptive messages**
6. **Push and deploy**

## Future Enhancements

- [ ] Voice command routing
- [ ] Real-time data integration
- [ ] Advanced voice controls
- [ ] Multi-language support
- [ ] Voice analytics dashboard

## Troubleshooting

### Voice Agent Issues
- Check layout component is client-side
- Verify agent doesn't reinitialize on navigation
- Ensure conversation ID persists across pages
- Confirm API endpoints are properly configured

### Navigation Problems
- Confirm using Next.js `<Link>` components
- Check route group syntax `(dashboard)`
- Verify layout.tsx exports default function

---

*This blueprint ensures voice-enabled dashboards maintain seamless audio connections while providing excellent user experience through client-side navigation.*