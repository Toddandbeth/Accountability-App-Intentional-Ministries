interface DashboardColumnHeadersProps {
  labels: string[]; // exactly 5, in slot order
}

export function DashboardColumnHeaders({ labels }: DashboardColumnHeadersProps) {
  return (
    <div className="flex items-center gap-3 px-3">
      <span className="min-w-0 flex-1" />
      <span className="flex gap-1">
        {labels.map((label, i) => (
          <span
            key={i}
            className="w-8 truncate text-center text-[9px] font-semibold text-neutral-400"
            title={label}
          >
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}
