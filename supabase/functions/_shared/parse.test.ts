import { describe, expect, it } from "vitest";
import { parseDescription, parseSortPlan } from "./parse.ts";

describe("parseDescription", () => {
  it("reads plain JSON from the model", () => {
    const out = parseDescription('{"description":"A bowl of ramen","tags":["food","ramen"]}');
    expect(out).toEqual({ description: "A bowl of ramen", tags: ["food", "ramen"] });
  });

  it("strips markdown code fences the model sometimes adds", () => {
    const out = parseDescription('```json\n{"description":"Beach","tags":["beach"]}\n```');
    expect(out.description).toBe("Beach");
  });

  it("lowercases and trims tags, drops empties and duplicates", () => {
    const out = parseDescription('{"description":"x","tags":[" Food ","food","", "VIEW"]}');
    expect(out.tags).toEqual(["food", "view"]);
  });

  it("throws a clear error on junk", () => {
    expect(() => parseDescription("sorry, I can't do that")).toThrow(/model reply/i);
  });

  it("throws when description is missing", () => {
    expect(() => parseDescription('{"tags":["a"]}')).toThrow(/description/i);
  });
});

describe("parseSortPlan", () => {
  const ids = ["a", "b", "c", "d"];

  it("accepts a valid plan", () => {
    const plan = parseSortPlan('{"groups":[{"name":"Food","photoIds":["a","b"]},{"name":"Views","photoIds":["c"]}]}', ids);
    expect(plan).toEqual([
      { name: "Food", photoIds: ["a", "b"] },
      { name: "Views", photoIds: ["c"] },
      { name: "Other", photoIds: ["d"] },
    ]);
  });

  it("drops photo ids the model made up", () => {
    const plan = parseSortPlan('{"groups":[{"name":"Food","photoIds":["a","zzz"]}]}', ["a"]);
    expect(plan).toEqual([{ name: "Food", photoIds: ["a"] }]);
  });

  it("keeps each photo in only one group (first wins)", () => {
    const plan = parseSortPlan('{"groups":[{"name":"A","photoIds":["a"]},{"name":"B","photoIds":["a","b"]}]}', ["a", "b"]);
    expect(plan).toEqual([
      { name: "A", photoIds: ["a"] },
      { name: "B", photoIds: ["b"] },
    ]);
  });

  it("removes groups that end up empty", () => {
    const plan = parseSortPlan('{"groups":[{"name":"Ghost","photoIds":["nope"]}]}', ["a"]);
    expect(plan).toEqual([{ name: "Other", photoIds: ["a"] }]);
  });

  it("throws on junk", () => {
    expect(() => parseSortPlan("nope", ids)).toThrow(/model reply/i);
  });
});
