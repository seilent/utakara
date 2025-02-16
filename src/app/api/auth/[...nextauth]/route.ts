import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminUsername = process.env.ADMIN_USERNAME || DEFAULT_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
        
        if (credentials?.username === adminUsername && 
            credentials?.password === adminPassword) {
          return {
            id: "1",
            name: credentials?.username || "",
            email: "admin@example.com"
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };