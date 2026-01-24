'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';

export default function Home() {
  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator />
      </div>
    </div>
  );
}