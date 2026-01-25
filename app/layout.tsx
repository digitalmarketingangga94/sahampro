import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSY",
  description: "Stock Analysis Dashboard",
};

import { Suspense } from "react";
import Navbar from "./components/Navbar";

// Loading component for navbar suspense boundary
const NavbarLoading = () => (
  <nav className="navbar">
    <div className="navbar-container" style={{ padding: '1rem', minHeight: '60px' }}>
      <div className="navbar-brand">
        <h1 className="navbar-title">RSY Analyze Stock</h1>
      </div>
    </div>
  </nav>
);

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
        <Suspense fallback={<NavbarLoading />}>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}