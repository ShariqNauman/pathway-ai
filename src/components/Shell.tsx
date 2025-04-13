import React from 'react';

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className = '' }: ShellProps) {
  return (
    <div className={`container space-y-8 py-8 ${className}`}>
      {children}
    </div>
  );
} 