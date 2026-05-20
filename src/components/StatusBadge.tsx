import React from 'react';
import { 
  FileText, CheckCircle, Play, 
  Hourglass, AlertTriangle, Calendar,
  Clock, XOctagon 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'script' | 'audio' | 'calendar';
}

export default function StatusBadge({ status, type = 'script' }: StatusBadgeProps) {
  const normStatus = status.toLowerCase();

  let label = status;
  let colorClass = '';
  let Icon = FileText;

  if (normStatus === 'draft') {
    label = 'Draft';
    colorClass = 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50';
    Icon = FileText;
  } else if (normStatus === 'ready') {
    label = 'Ready';
    colorClass = 'bg-purple-950/40 text-purple-300 border border-purple-800/40 shadow-[0_0_10px_rgba(124,58,237,0.05)]';
    Icon = CheckCircle;
  } else if (normStatus === 'used') {
    label = 'Used';
    colorClass = 'bg-blue-950/40 text-blue-300 border border-blue-800/40';
    Icon = Play;
  } else if (normStatus === 'pending') {
    label = 'Pending';
    colorClass = 'bg-amber-950/40 text-amber-300 border border-amber-800/40';
    Icon = Hourglass;
  } else if (normStatus === 'generated') {
    label = 'Generated';
    colorClass = 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40';
    Icon = CheckCircle;
  } else if (normStatus === 'failed') {
    label = 'Failed';
    colorClass = 'bg-rose-950/40 text-rose-300 border border-rose-800/40';
    Icon = AlertTriangle;
  } else if (normStatus === 'scheduled') {
    label = 'Scheduled';
    colorClass = 'bg-purple-950/40 text-purple-300 border border-purple-800/40';
    Icon = Clock;
  } else if (normStatus === 'posted') {
    label = 'Posted';
    colorClass = 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40';
    Icon = CheckCircle;
  } else if (normStatus === 'skipped') {
    label = 'Skipped';
    colorClass = 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50';
    Icon = XOctagon;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
