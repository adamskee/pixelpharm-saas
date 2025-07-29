import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";

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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
