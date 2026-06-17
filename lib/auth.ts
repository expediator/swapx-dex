import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { redis, keys, getPortfolio, setBalance } from './redis';
import { INITIAL_PORTFOLIO } from './tokens';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async signIn({ user }) {
      // Seed initial portfolio on first sign-in
      if (!user.id) return true;
      const existing = await getPortfolio(user.id);
      if (Object.keys(existing).length === 0) {
        await Promise.all(
          Object.entries(INITIAL_PORTFOLIO).map(([sym, amt]) =>
            setBalance(user.id!, sym, amt)
          )
        );
        // Record user registration
        await redis.set(`user:${user.id}:registered`, Date.now());
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
