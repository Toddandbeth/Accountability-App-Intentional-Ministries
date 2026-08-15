interface DashboardColumnHeadersProps {
  labels: string[]; // exactly 5, in slot order
}

export function DashboardColumnHeaders({ labels }: DashboardColumnHeadersProps) {
  return (
    <div className="flex items-center gap-1.5 px-3">
      <span className="w-24 shrink-0" />
      <span className="flex flex-1 justify-end gap-1">
        {labels.map((label, i) => (
          <span
            key={i}
            className="w-9 shrink-0 text-center text-[7px] font-semibold leading-tight text-neutral-400"
            title={label}
          >
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}
