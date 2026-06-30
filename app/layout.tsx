import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIRAN ContentForge",
  description: "KIRAN AI content command center powered by Groq, Supabase, and multimodel image workflows"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
