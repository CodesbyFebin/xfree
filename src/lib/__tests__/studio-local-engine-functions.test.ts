import { describe, expect, it } from "vitest";
import {
  convertHexColor,
  convertIntegerBase,
  convertTimestamp,
  decodeHtmlEntities,
  decodeJwtWithoutVerification,
  decodeUrlComponent,
  decodeUtf8Hex,
  deduplicateLines,
  encodeUtf8Hex,
  encodeHtmlEntities,
  encodeUrlComponent,
  formatJson,
  generateSecurePasswords,
  extractEmailCandidates,
  extractHttpUrls,
  inspectUnicodeCodePoints,
  applyRot13,
  minifyJson,
  parseQueryString,
  normalizeWhitespace,
  removeEmptyLines,
  reverseLines,
  slugifyText,
  sortJsonKeys,
  sortLines,
} from "../studio/local-engine-functions";

describe("Studio local engine functions", () => {
  it("round-trips UTF-8 URL component text", () => {
    const input = "a b&c/✓";
    expect(encodeUrlComponent(input)).toBe("a%20b%26c%2F%E2%9C%93");
    expect(decodeUrlComponent(encodeUrlComponent(input))).toBe(input);
  });

  it("rejects malformed percent encoding", () => {
    expect(() => decodeUrlComponent("%ZZ")).toThrow("valid percent-encoded text");
  });

  it("converts short and long HEX colors", () => {
    expect(JSON.parse(convertHexColor("#0ea5e9"))).toEqual({
      hex: "#0EA5E9",
      rgb: "rgb(14, 165, 233)",
      hsl: "hsl(199, 89%, 48%)",
    });
    expect(JSON.parse(convertHexColor("#fff")).hex).toBe("#FFFFFF");
    expect(() => convertHexColor("transparent")).toThrow("HEX color");
  });

  it("decodes JWT sections while displaying an explicit non-verification warning", () => {
    const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiLwn5qAIiwiaWF0IjoxfQ.signature";
    expect(JSON.parse(decodeJwtWithoutVerification(token))).toEqual({
      warning: "Decoded only. The signature and token authenticity were not verified.",
      header: { alg: "none", typ: "JWT" },
      payload: { sub: "🚀", iat: 1 },
      signature: "signature",
    });
    expect(() => decodeJwtWithoutVerification("not-a-jwt")).toThrow("three non-empty");
  });

  it("generates passwords with all four required character classes", () => {
    const passwords = generateSecurePasswords("24 20").split("\n");
    expect(passwords).toHaveLength(20);
    for (const password of passwords) {
      expect(password).toHaveLength(24);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    }
  });

  it("formats, minifies, and recursively sorts valid JSON", () => {
    const input = '{"z":1,"a":{"d":4,"b":2},"items":[{"y":2,"x":1}]}';
    expect(JSON.parse(formatJson(input))).toEqual(JSON.parse(input));
    expect(minifyJson(formatJson(input))).toBe(input);
    expect(sortJsonKeys(input)).toBe('{\n  "a": {\n    "b": 2,\n    "d": 4\n  },\n  "items": [\n    {\n      "x": 1,\n      "y": 2\n    }\n  ],\n  "z": 1\n}');
    expect(() => formatJson("{broken}")).toThrow();
  });

  it("encodes HTML-significant characters and decodes supported entities", () => {
    expect(encodeHtmlEntities('<a title="x & y">\'z\'</a>')).toBe("&lt;a title=&quot;x &amp; y&quot;&gt;&#39;z&#39;&lt;/a&gt;");
    expect(decodeHtmlEntities("&lt;&#x1F680;&#39;&amp;&unknown;")).toBe("<🚀'&&unknown;");
    expect(decodeHtmlEntities("&#x110000;")).toBe("&#x110000;");
  });

  it("creates a deterministic lowercase ASCII slug", () => {
    expect(slugifyText("  Café & XFree — Tools  ")).toBe("cafe-and-xfree-tools");
    expect(slugifyText("---")).toBe("");
  });

  it("deduplicates exact lines and sorts normalized line endings", () => {
    expect(deduplicateLines("beta\r\nalpha\nbeta\nBeta")).toBe("beta\nalpha\nBeta");
    expect(sortLines("beta\r\nalpha\ngamma")).toBe("alpha\nbeta\ngamma");
  });

  it("parses repeated query parameters without discarding values", () => {
    expect(JSON.parse(parseQueryString("https://example.test/path?a=1&a=2&space=hello+world#part"))).toEqual({
      a: ["1", "2"],
      space: "hello world",
    });
  });

  it("converts Unix seconds, milliseconds, and ISO timestamps", () => {
    expect(JSON.parse(convertTimestamp("0"))).toMatchObject({ iso: "1970-01-01T00:00:00.000Z", unixSeconds: 0, unixMilliseconds: 0 });
    expect(JSON.parse(convertTimestamp("1704067200000")).iso).toBe("2024-01-01T00:00:00.000Z");
    expect(JSON.parse(convertTimestamp("2024-01-01T00:00:00Z")).unixSeconds).toBe(1704067200);
    expect(() => convertTimestamp("not a date")).toThrow("valid timestamp");
  });

  it("round-trips Unicode text through strict UTF-8 HEX", () => {
    const input = "XFree ✓ 🚀";
    expect(decodeUtf8Hex(encodeUtf8Hex(input))).toBe(input);
    expect(decodeUtf8Hex("58 46 72 65 65")).toBe("XFree");
    expect(() => decodeUtf8Hex("f")).toThrow("two-digit bytes");
    expect(() => decodeUtf8Hex("ff")).toThrow("valid UTF-8");
  });

  it("reports Unicode code points separately from UTF-16 units", () => {
    expect(JSON.parse(inspectUnicodeCodePoints("A🚀"))).toEqual([
      { character: "A", codePoint: "U+0041", decimal: 65, utf16Units: 1, codePointIndex: 0 },
      { character: "🚀", codePoint: "U+1F680", decimal: 128640, utf16Units: 2, codePointIndex: 1 },
    ]);
  });

  it("applies ROT13 only to ASCII letters and is self-inverse", () => {
    const input = "Hello, XFree 123 — café";
    expect(applyRot13(applyRot13(input))).toBe(input);
    expect(applyRot13("Abc Nop")).toBe("Nop Abc");
  });

  it("normalizes whitespace, removes empty lines, and reverses line order", () => {
    expect(normalizeWhitespace("  one\n\t two   three ")).toBe("one two three");
    expect(removeEmptyLines("a\n  \n b \r\n\t\nc")).toBe("a\n b \nc");
    expect(reverseLines("one\r\ntwo\nthree")).toBe("three\ntwo\none");
  });

  it("extracts unique email and HTTP URL candidates", () => {
    expect(extractEmailCandidates("a@example.com A@example.com a@example.com invalid@localhost")).toBe("a@example.com\nA@example.com");
    expect(extractHttpUrls("See https://example.com/a, then HTTP://EXAMPLE.com/b). https://example.com/a")).toBe("https://example.com/a\nHTTP://EXAMPLE.com/b");
  });

  it("converts arbitrarily large signed integers between bases 2 and 36", () => {
    expect(convertIntegerBase("FF 16 10")).toBe("255");
    expect(convertIntegerBase("-255 10 16")).toBe("-FF");
    expect(convertIntegerBase("11111111111111111111111111111111 2 16")).toBe("FFFFFFFF");
    expect(() => convertIntegerBase("2 2 10")).toThrow("invalid for base 2");
    expect(() => convertIntegerBase("10 1 10")).toThrow("2 through 36");
  });
});
