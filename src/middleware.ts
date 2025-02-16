import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token !== null,
  },
});

export const config = {
  matcher: ["/admin/:path*"]
};