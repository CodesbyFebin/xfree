import { describe, expect, it } from "vitest";
import { findClosestDocument, jaccardSimilarity, wordNgrams } from "../../content-pipeline/similarity";

describe("content similarity", () => {
  it("normalizes punctuation and compares word trigrams", () => {
    const left = wordNgrams("JSON input stays in local browser memory during processing.");
    const right = wordNgrams("JSON input stays in local browser memory during processing!");
    expect(jaccardSimilarity(left, right)).toBe(1);
  });

  it("finds the closest document in a corpus", () => {
    const match = findClosestDocument("format nested json records into csv rows", [
      { slug: "regex", text: "test regular expressions against sample strings" },
      { slug: "json-csv", text: "format nested json records into csv rows safely" },
    ]);
    expect(match?.slug).toBe("json-csv");
    expect(match?.score).toBeGreaterThan(0.5);
  });
});
