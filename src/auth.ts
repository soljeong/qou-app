import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Missing Google OAuth env vars: AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Cloud Run sits behind a reverse proxy, so Auth.js must trust the host header.
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});
