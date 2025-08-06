import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // In a real app, you would validate against your database
        // For demo purposes, we'll use a hardcoded user
        const user = {
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          password: await bcrypt.hash('password123', 10)
        }

        if (credentials.email === user.email) {
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (isValidPassword) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
})