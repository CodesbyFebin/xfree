import { describe, it, expect } from "vitest";
import { formatJson } from "../home-demo";

describe("formatJson (home-page JSON formatter demo)", () => {
  it("formats a valid object with 2-space indent", () => {
    const result = formatJson('{"name":"xfree","tools":12}');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('{\n  "name": "xfree",\n  "tools": 12\n}');
  });

  it("formats arrays correctly", () => {
    const result = formatJson("[1,2,3]");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("[\n  1,\n  2,\n  3\n]");
  });

  it("returns ok=false with an error message for malformed input", () => {
    const result = formatJson('{"name": "xfree"');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe("string");
  });

  it("returns ok=false for non-string input", () => {
    const result = formatJson(null as unknown as string);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Input must be a string");
  });

  it("returns ok=true with the string \"null\" for input 'null'", () => {
    const result = formatJson("null");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("null");
  });

  it("preserves nested structures", () => {
    const input = '{"a":{"b":{"c":1}},"d":[true,false,null]}';
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    expect(result.value).toContain('"a"');
    expect(result.value).toContain('"b"');
    expect(result.value).toContain('"c": 1');
    expect(result.value).toContain("true");
    expect(result.value).toContain("false");
  });
});
