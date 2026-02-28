import React from 'react';
import { NavLink as RRNavLink } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function NavLink({ to, children, onClick }: NavLinkProps) {
  return (
    <RRNavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-dgb-blue text-dgb-accent'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`
      }
    >
      {children}
    </RRNavLink>
  );
}
