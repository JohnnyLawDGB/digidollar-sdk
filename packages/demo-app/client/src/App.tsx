import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import { Dashboard } from './pages/Dashboard';
import { Mint } from './pages/Mint';
import { Transfer } from './pages/Transfer';
import { Positions } from './pages/Positions';
import { Docs } from './pages/Docs';

export function App() {
  return (
    <BrowserRouter basename="/test">
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/docs" element={<Docs />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
