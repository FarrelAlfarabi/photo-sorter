import { describe, expect, it } from "vitest";
import { distanceKm, groupByDay, groupIntoTrips } from "./trips";
import type { PhotoMeta } from "./types";

const H = 3600_000;
const T0 = Date.UTC(2026, 5, 1, 9, 0, 0);
const photo = (id: string, hoursAfter: number, extra: Partial<PhotoMeta> = {}): PhotoMeta => ({
  id, takenAt: T0 + hoursAfter * H, width: 4000, height: 3000, filename: `${id}.jpg`, ...extra,
});

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm(0, 0, 0, 0)).toBe(0);
  });
  it("matches a known distance (Jakarta to Bandung is about 120 km)", () => {
    const d = distanceKm(-6.2088, 106.8456, -6.9175, 107.6191);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(130);
  });
});

describe("groupIntoTrips", () => {
  it("keeps photos taken close together in one trip", () => {
    const trips = groupIntoTrips([photo("a", 0), photo("b", 5), photo("c", 30)]);
    expect(trips).toHaveLength(1);
    expect(trips[0].photoIds).toEqual(["a", "b", "c"]);
  });

  it("splits when there is a gap of more than 2 days", () => {
    const trips = groupIntoTrips([photo("a", 0), photo("b", 1), photo("c", 100)]);
    expect(trips.map((t) => t.photoIds)).toEqual([["a", "b"], ["c"]]);
  });

  it("splits on a big jump in place even after a short gap", () => {
    const trips = groupIntoTrips([
      photo("a", 0, { lat: -6.2, lon: 106.8 }),
      photo("b", 8, { lat: -8.4, lon: 115.2 }),
    ]);
    expect(trips).toHaveLength(2);
  });

  it("does not split when only one side has GPS", () => {
    const trips = groupIntoTrips([photo("a", 0, { lat: -6.2, lon: 106.8 }), photo("b", 8)]);
    expect(trips).toHaveLength(1);
  });

  it("sorts unsorted input by time and reports start and end", () => {
    const [trip] = groupIntoTrips([photo("b", 5), photo("a", 0)]);
    expect(trip.photoIds).toEqual(["a", "b"]);
    expect(trip.start).toBe(T0);
    expect(trip.end).toBe(T0 + 5 * H);
  });

  it("returns nothing for no photos", () => {
    expect(groupIntoTrips([])).toEqual([]);
  });
});

describe("groupByDay", () => {
  it("groups photos by local calendar day", () => {
    const days = groupByDay([photo("a", 0), photo("b", 2), photo("c", 30)], 0);
    expect(days.map((d) => [d.day, d.photoIds])).toEqual([
      ["2026-06-01", ["a", "b"]],
      ["2026-06-02", ["c"]],
    ]);
  });

  it("respects the timezone offset in minutes", () => {
    // 09:00 UTC is 16:00 in UTC+7, but 20:00 UTC is already the next day there
    const days = groupByDay([photo("a", 0), photo("b", 11)], 420);
    expect(days.map((d) => d.day)).toEqual(["2026-06-01", "2026-06-02"]);
  });
});
