import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a simple example. In production, you should use proper authentication
        if (credentials?.username === process.env.ADMIN_USERNAME && 
            credentials?.password === process.env.ADMIN_PASSWORD) {
          return {
            id: "1",
            name: credentials.username,
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