import React, { useState } from 'react';
import { NavLink } from './NavLink';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/mint', label: 'Mint DD' },
  { to: '/transfer', label: 'Transfer' },
  { to: '/positions', label: 'Positions' },
  { to: '/docs', label: 'Docs' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-3">
        <span className="text-lg font-bold text-dgb-accent">DigiDollar</span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-400 hover:text-white"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          menuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-56 bg-gray-900 border-r border-gray-800 flex-shrink-0`}
      >
        <div className="hidden md:block px-5 py-6">
          <h1 className="text-xl font-bold text-dgb-accent">DigiDollar</h1>
          <p className="text-xs text-gray-500 mt-1">Testnet Demo</p>
        </div>
        <nav className="px-3 py-2 md:py-0 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
