import { describe, expect, it } from "vitest";
import { BATCH4_LOCAL_ENGINES, runBatch4Engine } from "../studio/batch4-engines";

const smokeInputs: Record<string, string> = {
  "character-count":"A🚀", "code-point-count":"A🚀", "grapheme-count":"👨‍👩‍👧‍👦", "word-count":"one two", "sentence-count":"One. Two!", "paragraph-count":"one\n\ntwo", "character-frequency":"aba", "word-frequency":"One one two", "reverse-text":"A🚀", "reverse-words":"one two",
  "trim-lines":" a \n b ", "prefix-lines":"> \na\nb", "suffix-lines":"!\na\nb", "number-lines":"a\nb", "filter-lines":"keep\nkeep this\ndrop", "remove-matching-lines":"drop\nkeep\ndrop this", "repeat-text":"2\nab", "truncate-text":"2\nA🚀B", "tabs-to-spaces":"2\na\tb", "spaces-to-tabs":"2\n  a\n    b",
  "json-validate":"{\"a\":1}", "json-value-type":"[]", "json-object-keys":"{\"a\":1}", "json-array-length":"[1,2]", "json-pointer-get":"/a/0\n{\"a\":[9]}", "json-array-dedupe":"[1,1,{\"a\":1},{\"a\":1}]", "json-array-sort":"[3,1,2]", "json-string-escape":"a\nb", "json-string-unescape":"\"a\\nb\"", "json-lines-to-array":"{\"a\":1}\n2", "json-array-to-lines":"[{\"a\":1},2]", "json-depth":"{\"a\":[{\"b\":1}]}",
  "url-parse":"https://u:p@example.com:8443/a?q=1#x", "url-origin":"https://example.com/a", "url-path-segments":"https://example.com/a%20b/c", "url-query-build":"a=1\na=2\nq=hello world", "url-query-sort":"?z=1&a=2", "url-normalize":"HTTPS://EXAMPLE.COM:443/a#x", "url-resolve":"https://example.com/a/\n../b", "data-url-encode":"hello ✓", "data-url-decode":"data:text/plain;charset=utf-8,hello%20%E2%9C%93", "domain-extract":"https://sub.example.com/a",
  "gcd":"48 18", "lcm":"4 6", "prime-check":"97", "integer-factors":"12", "mean":"1 2 3", "median":"1 9 3 5", "number-minmax":"3 -1 8", "number-sort":"3 1 2", "percentage":"25 200", "byte-format":"1536", "roman-encode":"1994", "roman-decode":"MCMXCIV",
  "date-difference":"2024-01-01T00:00:00Z\n2024-01-02T00:00:00Z", "date-add-days":"2024-01-01T00:00:00Z\n2", "day-of-week":"2024-01-01T00:00:00Z", "leap-year":"2024", "iso-week":"2024-01-01T00:00:00Z",
  "tsv-to-csv":"a\tb\n1\t2", "csv-to-tsv":"\"a\",\"b\"\n\"1\",\"2\"", "list-to-json":"a\nb", "json-to-list":"[\"a\",{\"b\":1}]", "env-parse":"A=1\nB=\"two\"", "http-headers-parse":"Accept: text/html\nSet-Cookie: a=1\nSet-Cookie: b=2", "crc32":"123456789", "mime-lookup":"file.json",
};

describe("Batch 4 Studio engines", () => {
  it("registers exactly 67 unique engines with smoke vectors", async () => {
    expect(BATCH4_LOCAL_ENGINES).toHaveLength(67);
    expect(new Set(BATCH4_LOCAL_ENGINES.map((engine) => engine.id)).size).toBe(67);
    expect(Object.keys(smokeInputs).sort()).toEqual(BATCH4_LOCAL_ENGINES.map((engine) => engine.id).sort());
    for (const engine of BATCH4_LOCAL_ENGINES) {
      const result = await engine.run(smokeInputs[engine.id], "");
      expect(result.content, engine.id).toEqual(expect.any(String));
    }
  });

  it("preserves critical conversion contracts", () => {
    expect(runBatch4Engine("gcd", "48 18").content).toBe("6");
    expect(runBatch4Engine("lcm", "4 6").content).toBe("12");
    expect(runBatch4Engine("crc32", "123456789").content).toBe("cbf43926");
    expect(runBatch4Engine("roman-encode", "1994").content).toBe("MCMXCIV");
    expect(runBatch4Engine("roman-decode", "MCMXCIV").content).toBe("1994");
    expect(runBatch4Engine("json-pointer-get", "/a~1b\n{\"a/b\":7}").content).toBe("7");
  });

  it("rejects malformed or unsafe bounded input", () => {
    expect(() => runBatch4Engine("repeat-text", "1001\nx")).toThrow("cannot exceed 1000");
    expect(() => runBatch4Engine("integer-factors", "1000000000001")).toThrow("1,000,000,000,000");
    expect(() => runBatch4Engine("json-string-unescape", "123")).toThrow("JSON string literal");
    expect(() => runBatch4Engine("data-url-decode", "data:text/plain;base64,SGk=")).toThrow("non-Base64");
  });
});
