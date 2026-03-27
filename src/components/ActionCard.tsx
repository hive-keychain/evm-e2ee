import type { ReactNode } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ActionCard({ title, description, children }: ActionCardProps) {
  return (
    <section className="panel-card action-card">
      <header className="card-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
