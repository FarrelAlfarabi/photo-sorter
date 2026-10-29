import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { buildCleanupPlan, type CleanupPlan } from "./src/core/cleanup";
import { groupByDay, groupIntoTrips, type Trip } from "./src/core/trips";
import type { PhotoMeta } from "./src/core/types";
import { createTripAlbum, deletePhotos, ensurePermission, scanLibrary } from "./src/device/scan";

const SCAN_LIMIT = 300;

interface Result {
  photos: PhotoMeta[];
  trips: Trip[];
  plan: CleanupPlan;
}

const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export default function App() {
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function scan() {
    if (!(await ensurePermission())) {
      Alert.alert("Permission needed", "Allow photo access so the app can look at your photos. Nothing leaves your phone.");
      return;
    }
    setProgress("Starting...");
    const { photos, analysis } = await scanLibrary(SCAN_LIMIT, (d, t) => setProgress(`Looking at photo ${d} of ${t}`));
    setResult({ photos, trips: groupIntoTrips(photos), plan: buildCleanupPlan(photos, analysis) });
    setProgress(null);
  }

  async function makeAlbums() {
    if (!result) return;
    const byId = new Map(result.photos.map((p) => [p.id, p]));
    for (const trip of result.trips) {
      if (trip.photoIds.length < 5) continue; // skip tiny "trips"
      const name = `Trip ${fmt(trip.start)}`;
      await createTripAlbum(name, trip.photoIds.filter((id) => byId.has(id)));
    }
    Alert.alert("Done", "Trip albums created. Your original photos were copied, not moved.");
  }

  async function removeJunk() {
    if (!result) return;
    const ok = await deletePhotos(result.plan.cuts.map((c) => c.id));
    if (ok) setResult(null);
  }

  const counts = result?.plan.cuts.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.reason]: (acc[c.reason] ?? 0) + 1 }), {});

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Photo Sorter (demo)</Text>
        <Text style={styles.body}>
          Looks at your latest {SCAN_LIMIT} photos on this phone. Finds trips, duplicates, blurry shots and screenshots. Nothing is uploaded.
        </Text>
        <Pressable style={styles.button} onPress={scan} disabled={progress !== null}>
          <Text style={styles.buttonText}>{progress ?? "Scan my photos"}</Text>
        </Pressable>

        {result && (
          <View style={styles.card}>
            <Text style={styles.h2}>Preview (nothing changed yet)</Text>
            <Text style={styles.body}>{result.photos.length} photos scanned</Text>

            <Text style={styles.h3}>Trips ({result.trips.length})</Text>
            {result.trips.map((t) => {
              const days = groupByDay(result.photos.filter((p) => t.photoIds.includes(p.id)), -new Date().getTimezoneOffset());
              return (
                <Text key={t.start} style={styles.body}>
                  {fmt(t.start)} to {fmt(t.end)}: {t.photoIds.length} photos over {days.length} day(s)
                </Text>
              );
            })}

            <Text style={styles.h3}>Suggested clean up ({result.plan.cuts.length})</Text>
            <Text style={styles.body}>
              {`Blurry: ${counts?.blurry ?? 0}   Screenshots: ${counts?.screenshot ?? 0}   Duplicates: ${counts?.duplicate ?? 0}`}
            </Text>
            <Text style={styles.body}>Best shot of each burst is kept. Android asks you to confirm before anything is removed.</Text>

            <Pressable style={styles.button} onPress={makeAlbums}>
              <Text style={styles.buttonText}>Create trip albums</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.danger]} onPress={removeJunk} disabled={result.plan.cuts.length === 0}>
              <Text style={styles.buttonText}>Remove suggested junk</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f6f7" },
  scroll: { padding: 16, paddingTop: 64, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#172125" },
  h2: { fontSize: 20, fontWeight: "700", color: "#172125" },
  h3: { fontSize: 16, fontWeight: "700", color: "#172125", marginTop: 8 },
  body: { fontSize: 15, color: "#33424a" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 16, gap: 6 },
  button: { backgroundColor: "#0a6a5c", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  danger: { backgroundColor: "#a3302a" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
