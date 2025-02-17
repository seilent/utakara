import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authConfig: AuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin';
        
        if (credentials?.username === username && 
            credentials?.password === password) {
          return { id: "1", name: username };
        }
        return null;
      }
    }
  ],
  pages: {
    signIn: '/login'
  }
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };