import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSY",
  description: "Stock Analysis Dashboard",
};

import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-primary text-text-primary min-h-screen overflow-x-hidden antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}