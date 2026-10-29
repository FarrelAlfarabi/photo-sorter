export interface Description {
  description: string;
  tags: string[];
}

export interface Group {
  name: string;
  photoIds: string[];
}

/** Models sometimes wrap JSON in code fences or add a sentence around it. */
function readJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Could not read model reply as JSON");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Could not read model reply as JSON");
  }
}

export function parseDescription(text: string): Description {
  const raw = readJson(text);
  if (typeof raw.description !== "string" || !raw.description.trim()) {
    throw new Error("Model reply has no description");
  }
  const tags: string[] = [];
  for (const t of Array.isArray(raw.tags) ? raw.tags : []) {
    const tag = String(t).trim().toLowerCase();
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return { description: raw.description.trim(), tags };
}

/** Checks a sort plan from the model: no invented ids, no photo in two groups, leftovers go to "Other". */
export function parseSortPlan(text: string, photoIds: string[]): Group[] {
  const raw = readJson(text);
  const known = new Set(photoIds);
  const used = new Set<string>();
  const groups: Group[] = [];
  for (const g of Array.isArray(raw.groups) ? raw.groups : []) {
    if (typeof g?.name !== "string") continue;
    const ids = (Array.isArray(g.photoIds) ? g.photoIds : []).filter(
      (id: string) => known.has(id) && !used.has(id) && used.add(id),
    );
    if (ids.length) groups.push({ name: g.name, photoIds: ids });
  }
  const leftover = photoIds.filter((id) => !used.has(id));
  if (leftover.length) groups.push({ name: "Other", photoIds: leftover });
  return groups;
}
