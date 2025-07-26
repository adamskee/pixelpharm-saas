import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

console.log("🔧 NextAuth route loaded");
console.log("🔧 Environment check:");
console.log(
  "  GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING"
);
console.log(
  "  NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "SET" : "MISSING"
);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-secret",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: true,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
