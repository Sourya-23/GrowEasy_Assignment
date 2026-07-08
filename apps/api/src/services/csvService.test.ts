import { describe, it, expect } from "vitest";
import { parseCsv } from "./csvService.js";

describe("parseCsv", () => {
  it("strips BOM and trims headers", () => {
    const { headers } = parseCsv("\uFEFF name , email \nA,a@b.com");
    expect(headers).toEqual(["name", "email"]);
  });

  it("drops fully empty rows", () => {
    const { rows } = parseCsv("name,email\nA,a@b.com\n,\nB,b@b.com");
    expect(rows).toHaveLength(2);
  });

  it("keeps commas and newlines inside quoted fields", () => {
    const csv = 'name,note\nA,"hello, world\nsecond line"';
    const { rows } = parseCsv(csv);
    expect(rows[0].note).toContain("hello, world");
    expect(rows[0].note).toContain("second line");
  });
});
