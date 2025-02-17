import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin";

export const runtime = 'nodejs';

// Helper to clean environment variables from quotes
const cleanEnvVar = (value: string | undefined, defaultValue: string) => {
  if (!value) return defaultValue;
  return value.replace(/^["']|["']$/g, '');
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Auth attempt for username:', credentials?.username);
        const adminUsername = cleanEnvVar(process.env.ADMIN_USERNAME, DEFAULT_USERNAME);
        const adminPassword = cleanEnvVar(process.env.ADMIN_PASSWORD, DEFAULT_PASSWORD);
        
        if (credentials?.username === adminUsername && 
            credentials?.password === adminPassword) {
          return {
            id: "1",
            name: credentials.username,
            email: "admin@example.com"
          };
        }
        console.log('Auth failed: Invalid credentials');
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    }
  }
});

export { handler as GET, handler as POST };