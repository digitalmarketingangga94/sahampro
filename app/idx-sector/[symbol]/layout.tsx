import React from 'react';

export default function IdxSectorSymbolLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-layout">
      <div className="app-main">
        {children}
      </div>
    </div>
  );
}