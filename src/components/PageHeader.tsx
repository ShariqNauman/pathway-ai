import React from 'react';

interface PageHeaderProps {
  heading: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ heading, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
} 