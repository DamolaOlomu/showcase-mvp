const COLORS = ["#3a3a3a", "#4d4d4d", "#5e5e5e", "#2b2b2b", "#707070"];

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
      className={`shrink-0 rounded-full ${ring ? "p-[1.5px] bg-gradient-to-br from-black/45 via-black/18 to-black/5" : ""}`}
      style={ring ? { width: size + 3, height: size + 3 } : undefined}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-medium"
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
    </div>
  );
}
