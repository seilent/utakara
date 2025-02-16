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
        const adminUsername = cleanEnvVar(process.env.ADMIN_USERNAME, DEFAULT_USERNAME);
        const adminPassword = cleanEnvVar(process.env.ADMIN_PASSWORD, DEFAULT_PASSWORD);
        
        // Debug logging
        console.log('Attempt login with:', {
          providedUsername: credentials?.username,
          expectedUsername: adminUsername,
          credentialsMatch: credentials?.username === adminUsername && credentials?.password === adminPassword
        });
        
        if (credentials?.username === adminUsername && 
            credentials?.password === adminPassword) {
          return {
            id: "1",
            name: credentials.username,
            email: "admin@example.com"
          };
        }
        
        console.log('Authentication failed');
        throw new Error('Invalid credentials');
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  debug: true,
  session: {
    strategy: "jwt"
  }
});

export { handler as GET, handler as POST };