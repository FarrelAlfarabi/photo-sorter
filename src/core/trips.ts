import type { PhotoMeta } from "./types";

export interface Trip {
  start: number;
  end: number;
  photoIds: string[];
}

export interface DayGroup {
  /** Local calendar day as YYYY-MM-DD. */
  day: string;
  photoIds: string[];
}

export interface TripOptions {
  /** A quiet gap longer than this starts a new trip. */
  maxGapHours?: number;
  /** A jump in place longer than this starts a new trip. */
  maxJumpKm?: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line distance over the earth's surface (haversine). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function groupIntoTrips(photos: PhotoMeta[], opts: TripOptions = {}): Trip[] {
  const maxGapMs = (opts.maxGapHours ?? 48) * 3600_000;
  const maxJumpKm = opts.maxJumpKm ?? 100;
  const sorted = [...photos].sort((a, b) => a.takenAt - b.takenAt);

  const trips: Trip[] = [];
  let current: Trip | null = null;
  let lastPlace: { lat: number; lon: number } | null = null;
  let prev: PhotoMeta | null = null;

  for (const p of sorted) {
    const hasPlace = p.lat !== undefined && p.lon !== undefined;
    const bigGap = prev !== null && p.takenAt - prev.takenAt > maxGapMs;
    const bigJump =
      hasPlace && lastPlace !== null && distanceKm(lastPlace.lat, lastPlace.lon, p.lat!, p.lon!) > maxJumpKm;

    if (!current || bigGap || bigJump) {
      current = { start: p.takenAt, end: p.takenAt, photoIds: [] };
      trips.push(current);
    }
    current.photoIds.push(p.id);
    current.end = p.takenAt;
    if (hasPlace) lastPlace = { lat: p.lat!, lon: p.lon! };
    prev = p;
  }
  return trips;
}

export function groupByDay(photos: PhotoMeta[], tzOffsetMinutes: number): DayGroup[] {
  const sorted = [...photos].sort((a, b) => a.takenAt - b.takenAt);
  const days = new Map<string, string[]>();
  for (const p of sorted) {
    const day = new Date(p.takenAt + tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
    const ids = days.get(day);
    if (ids) ids.push(p.id);
    else days.set(day, [p.id]);
  }
  return [...days].map(([day, photoIds]) => ({ day, photoIds }));
}
