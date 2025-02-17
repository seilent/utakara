import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin";

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
        try {
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
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      try {
        if (session?.user && token) {
          session.user.id = token.sub;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return {};
      }
    },
    async jwt({ token }) {
      return token;
    }
  }
});

export { handler as GET, handler as POST };