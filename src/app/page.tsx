'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PostsList } from '@/components/posts-list'
import { useCounterStore } from '@/store/counter'

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Rugby Demo App
          </h1>
          <p className="text-lg text-gray-600">
            Next.js 15.4 with TypeScript, Tailwind CSS, and modern tooling
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Zustand Counter */}
          <Card>
            <CardHeader>
              <CardTitle>Zustand Counter</CardTitle>
              <CardDescription>
                State management with Zustand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{count}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={increment} variant="outline">
                  +
                </Button>
                <Button onClick={decrement} variant="outline">
                  -
                </Button>
                <Button onClick={reset} variant="destructive">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shadcn/ui Components */}
          <Card>
            <CardHeader>
              <CardTitle>shadcn/ui Components</CardTitle>
              <CardDescription>
                Pre-built components with Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Enter your email..." />
              <Button className="w-full">Primary Button</Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
            </CardContent>
          </Card>

          {/* Tech Stack Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
              <CardDescription>
                Modern tools and libraries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Next.js 15.4 (App Router)</li>
                <li>✅ TypeScript</li>
                <li>✅ Tailwind CSS</li>
                <li>✅ shadcn/ui</li>
                <li>✅ Zustand</li>
                <li>✅ TanStack Query</li>
                <li>✅ Prisma ORM</li>
                <li>✅ NextAuth.js v5</li>
                <li>✅ ESLint + Prettier</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* TanStack Query Demo */}
        <Card>
          <CardHeader>
            <CardTitle>TanStack Query Demo</CardTitle>
            <CardDescription>
              Data fetching from JSONPlaceholder API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PostsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}