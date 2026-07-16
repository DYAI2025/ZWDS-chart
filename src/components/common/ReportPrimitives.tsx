import type { ReactNode } from 'react';
import type { SourceStatus } from '@/domain/zwdsTypes';
import type { TruthClass } from '@/domain/truthTypes';
import { TRUTH_CLASS_INFO } from '@/domain/truthTypes';

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="visually-hidden">{children}</span>;
}

export function TruthBadge({ truthClass, label }: { truthClass: TruthClass; label: string }) {
  return <span className={`truth-badge truth-badge--${truthClass}`}><span aria-hidden="true">{TRUTH_CLASS_INFO[truthClass].iconPattern}</span> {label}</span>;
}

export function SourceChip({ status, label }: { status: SourceStatus; label: string }) {
  const icon = status === 'SOURCE_REVIEWED' ? '✓' : status === 'SOURCE_NEEDED' ? '!' : 'x';
  return <span className={`source-indicator source-indicator--${status}`}><span aria-hidden="true">{icon} </span>{label}</span>;
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-heading"><p className="section-heading__eyebrow">{eyebrow}</p><h2 className="section-heading__title text-editorial">{title}</h2></div>;
}