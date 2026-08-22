function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

interface AvatarProps {
  name: string;
  imageUrl: string | null;
  size?: number;
  initialsColor?: string | null;
}

export function Avatar({ name, imageUrl, size = 32, initialsColor }: AvatarProps) {
  const style = { width: size, height: size };

  if (imageUrl) {
    return (
      // Small (200x200, already resized on upload) external Supabase
      // Storage URL — next/image's remote-pattern config isn't worth it here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" style={style} className="shrink-0 rounded-full object-cover" />
    );
  }

  return (
    <span
      style={initialsColor ? { ...style, backgroundColor: initialsColor } : style}
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        initialsColor ? "text-white" : "bg-brand-light text-brand-navy"
      }`}
    >
      {initialsFor(name)}
    </span>
  );
}
