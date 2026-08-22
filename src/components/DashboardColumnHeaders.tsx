interface DashboardColumnHeadersProps {
  labels: string[]; // exactly 5, in slot order
}

export function DashboardColumnHeaders({ labels }: DashboardColumnHeadersProps) {
  return (
    <div className="flex items-center gap-2 px-3">
      <span className="w-10 shrink-0" />
      <span className="flex flex-1 gap-1">
        {labels.map((label, i) => (
          <span
            key={i}
            className="flex-1 text-center text-xs font-semibold leading-tight text-neutral-400"
            title={label}
          >
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}
