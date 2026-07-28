const COLORS = ["#111111", "#5b5b5b", "#8a8a8a", "#3a3a3a", "#6f6f6f"];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  username,
  avatarUrl,
  size = 24,
  ring = false,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-medium ${
        ring ? "ring-2 ring-white" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: avatarUrl ? undefined : colorFor(username),
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}
