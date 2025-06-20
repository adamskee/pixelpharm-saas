import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
// Remove this line: import '@/lib/aws/amplify-config';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PixelPharm - AI-Powered Health Analytics",
  description: "Upload blood tests and get AI-powered health insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
