function bytesToBase64UrlBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function decodeJwtPart(value: string): unknown {
  return JSON.parse(new TextDecoder().decode(bytesToBase64UrlBytes(value)));
}

export function decodeJwtWithoutVerification(input: string): string {
  const parts = input.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("JWT input must contain three non-empty dot-separated sections.");
  }

  return JSON.stringify({
    warning: "Decoded only. The signature and token authenticity were not verified.",
    header: decodeJwtPart(parts[0]),
    payload: decodeJwtPart(parts[1]),
    signature: parts[2],
  }, null, 2);
}

const PASSWORD_CLASSES = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "!@#$%^&*()_+-=[]{}|;:,.<>?",
] as const;

function secureIndex(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 256) {
    throw new Error("Secure index range must be between 1 and 256.");
  }

  const limit = 256 - (256 % maxExclusive);
  const byte = new Uint8Array(1);
  do crypto.getRandomValues(byte); while (byte[0] >= limit);
  return byte[0] % maxExclusive;
}

function secureShuffle(values: string[]): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
}

export function generateSecurePasswords(input: string): string {
  const [lengthToken, countToken] = input.trim().split(/\s+/);
  const length = Math.min(64, Math.max(12, Number.parseInt(lengthToken, 10) || 20));
  const count = Math.min(50, Math.max(1, Number.parseInt(countToken, 10) || 1));
  const allCharacters = PASSWORD_CLASSES.join("");

  const passwords = Array.from({ length: count }, () => {
    const characters = PASSWORD_CLASSES.map((characterClass) => characterClass[secureIndex(characterClass.length)]);
    while (characters.length < length) characters.push(allCharacters[secureIndex(allCharacters.length)]);
    secureShuffle(characters);
    return characters.join("");
  });

  return passwords.join("\n");
}

function channelToHex(channel: number): string {
  return channel.toString(16).padStart(2, "0");
}

function rgbToHsl(red: number, green: number, blue: number): { h: number; s: number; l: number } {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 100) };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue = max === r
    ? (g - b) / delta + (g < b ? 6 : 0)
    : max === g
      ? (b - r) / delta + 2
      : (r - g) / delta + 4;

  return { h: Math.round(hue * 60), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export function convertHexColor(input: string): string {
  const value = input.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
    throw new Error("Enter a three- or six-digit HEX color, such as #0ea5e9.");
  }

  const expanded = value.length === 3 ? [...value].map((character) => character.repeat(2)).join("") : value;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const hsl = rgbToHsl(red, green, blue);

  return JSON.stringify({
    hex: `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`.toUpperCase(),
    rgb: `rgb(${red}, ${green}, ${blue})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  }, null, 2);
}

export function encodeUrlComponent(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrlComponent(input: string): string {
  try {
    return decodeURIComponent(input.trim());
  } catch {
    throw new Error("Input is not valid percent-encoded text.");
  }
}

export function formatJson(input: string): string {
  return JSON.stringify(JSON.parse(input), null, 2);
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonValue(child)]),
    );
  }
  return value;
}

export function sortJsonKeys(input: string): string {
  return JSON.stringify(sortJsonValue(JSON.parse(input)), null, 2);
}

const HTML_ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"']/g, (character) => HTML_ENCODE_MAP[character]);
}

const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const codePoint = Number.parseInt(body.slice(2), 16);
      return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    }
    if (body.startsWith("#")) {
      const codePoint = Number.parseInt(body.slice(1), 10);
      return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    }
    return HTML_NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

export function slugifyText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function splitLines(input: string): string[] {
  return input.replace(/\r\n?/g, "\n").split("\n");
}

export function deduplicateLines(input: string): string {
  return [...new Set(splitLines(input))].join("\n");
}

export function sortLines(input: string): string {
  return splitLines(input).toSorted((left, right) => left.localeCompare(right)).join("\n");
}

export function parseQueryString(input: string): string {
  const raw = input.trim();
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1).split("#", 1)[0] : raw.replace(/^\?/, "");
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(query)) {
    const existing = values[key];
    values[key] = existing === undefined ? value : Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return JSON.stringify(values, null, 2);
}

export function convertTimestamp(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("Enter Unix seconds, Unix milliseconds, or an ISO date-time.");
  const numeric = /^-?\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : Number.NaN;
  const milliseconds = Number.isFinite(numeric)
    ? Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric
    : Date.parse(raw);
  if (!Number.isFinite(milliseconds)) throw new Error("Input is not a valid timestamp or date-time.");
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error("Input is outside the supported JavaScript Date range.");
  return JSON.stringify({
    iso: date.toISOString(),
    unixSeconds: Math.trunc(date.getTime() / 1000),
    unixMilliseconds: date.getTime(),
    utc: date.toUTCString(),
  }, null, 2);
}

export function encodeUtf8Hex(input: string): string {
  return [...new TextEncoder().encode(input)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function decodeUtf8Hex(input: string): string {
  const normalized = input.replace(/\s+/g, "");
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(normalized)) {
    throw new Error("HEX input must contain complete two-digit bytes.");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("HEX bytes are not valid UTF-8 text.");
  }
}

export function inspectUnicodeCodePoints(input: string): string {
  return JSON.stringify([...input].map((character, index) => ({
    character,
    codePoint: `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
    decimal: character.codePointAt(0),
    utf16Units: character.length,
    codePointIndex: index,
  })), null, 2);
}

export function applyRot13(input: string): string {
  return input.replace(/[A-Za-z]/g, (character) => {
    const start = character <= "Z" ? 65 : 97;
    return String.fromCharCode(start + ((character.charCodeAt(0) - start + 13) % 26));
  });
}

export function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function removeEmptyLines(input: string): string {
  return splitLines(input).filter((line) => line.trim().length > 0).join("\n");
}

export function reverseLines(input: string): string {
  return splitLines(input).reverse().join("\n");
}

const EMAIL_EXTRACTION_PATTERN = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

export function extractEmailCandidates(input: string): string {
  return [...new Set(input.match(EMAIL_EXTRACTION_PATTERN) ?? [])].join("\n");
}

const URL_EXTRACTION_PATTERN = /https?:\/\/[^\s<>"']+/gi;

export function extractHttpUrls(input: string): string {
  const matches = input.match(URL_EXTRACTION_PATTERN) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[),.;!?]+$/g, "")))].join("\n");
}

function parseBigIntInBase(value: string, base: number): bigint {
  const negative = value.startsWith("-");
  const digits = (negative ? value.slice(1) : value).toLowerCase();
  if (!digits) throw new Error("Enter an integer value before the source and target bases.");
  let result = 0n;
  for (const digit of digits) {
    const numeric = Number.parseInt(digit, 36);
    if (!Number.isInteger(numeric) || numeric >= base) throw new Error(`Digit ${digit} is invalid for base ${base}.`);
    result = result * BigInt(base) + BigInt(numeric);
  }
  return negative ? -result : result;
}

export function convertIntegerBase(input: string): string {
  const [value, sourceRaw, targetRaw, ...extra] = input.trim().split(/\s+/);
  if (!value || !sourceRaw || !targetRaw || extra.length > 0) {
    throw new Error("Use the format: integer sourceBase targetBase, for example FF 16 10.");
  }
  const sourceBase = Number(sourceRaw);
  const targetBase = Number(targetRaw);
  if (![sourceBase, targetBase].every((base) => Number.isInteger(base) && base >= 2 && base <= 36)) {
    throw new Error("Source and target bases must be integers from 2 through 36.");
  }
  return parseBigIntInBase(value, sourceBase).toString(targetBase).toUpperCase();
}
