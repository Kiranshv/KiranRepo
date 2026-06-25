import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentForge",
  description: "Hosted AI content pipeline dashboard powered by Groq and Supabase"
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
