export function formatRelativeTime(isoString) {
  const ts = new Date(isoString).getTime();
  if (!Number.isFinite(ts)) return "Unknown";
  const delta = Math.max(0, Date.now() - ts);
  const sec = Math.floor(delta / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function mapCameraResponse(camera) {
  const rawUrl = String(camera.streamUrl || "");
  const isLocalFile = /^[a-zA-Z]:\\|^\//.test(rawUrl);
  const previewUrl = isLocalFile
    ? `/api/cameras/media/${camera.id}`
    : /^https?:\/\//i.test(rawUrl) || /^data:/i.test(rawUrl)
      ? rawUrl
      : "";
  return {
    id: camera.id,
    name: camera.name,
    url: camera.streamUrl,
    stream: camera.stream,
    status: camera.status,
    lastPing: formatRelativeTime(camera.lastActive || camera.updatedAt || camera.createdAt),
    lastPingAt: camera.lastActive || camera.updatedAt || camera.createdAt,
    createdAt: camera.createdAt,
    updatedAt: camera.updatedAt,
    latitude: camera.coordinates?.lat ?? null,
    longitude: camera.coordinates?.lng ?? null,
    modelHint: camera.type || "",
    previewUrl,
  };
}
