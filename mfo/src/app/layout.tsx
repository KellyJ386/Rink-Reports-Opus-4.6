import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Max Facility Rink Reports",
  description: "Ice rink management and reporting system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
