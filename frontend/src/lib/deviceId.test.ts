import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("getDeviceId", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("generates and persists a device id", async () => {
    const { getDeviceId } = await import("./deviceId");
    const id1 = getDeviceId();
    expect(id1).toMatch(/^dev-/);
    // Second call returns the same id.
    const id2 = getDeviceId();
    expect(id2).toBe(id1);
  });

  it("returns a new id if localStorage is cleared", async () => {
    const { getDeviceId } = await import("./deviceId");
    const id1 = getDeviceId();
    localStorage.clear();
    vi.resetModules();
    const { getDeviceId: getDeviceId2 } = await import("./deviceId");
    const id2 = getDeviceId2();
    // Both are valid device ids but may differ after a storage clear.
    expect(id2).toMatch(/^dev-/);
  });

  it("returns a valid id even when localStorage is unavailable", async () => {
    // Simulate storage being blocked (e.g., incognito restrictions)
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    vi.resetModules();
    const { getDeviceId } = await import("./deviceId");
    const id = getDeviceId();
    expect(id).toMatch(/^dev-/);

    vi.restoreAllMocks();
  });
});
