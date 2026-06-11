const STORAGE_KEY = "carbon_device_id";
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `dev-${crypto.randomUUID().replace(/-/g, "")}`;
  return `dev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch { return generateId(); }
}
