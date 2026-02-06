import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Max Facility Rink Reports",
  description:
    "Comprehensive SaaS platform for ice rink facility management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
