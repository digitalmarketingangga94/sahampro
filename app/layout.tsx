import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adimology",
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
      <body
        className={`antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
