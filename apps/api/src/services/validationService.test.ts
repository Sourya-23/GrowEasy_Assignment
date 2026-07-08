import { describe, it, expect } from "vitest";
import { validateRecords } from "./validationService.js";

const base = {
  created_at: "2026-05-13 14:20:48",
  name: "X",
  email: "x@y.com",
  country_code: "+91",
  mobile_without_country_code: "9876543210",
  company: "", city: "", state: "", country: "", lead_owner: "",
  crm_status: "SALE_DONE", crm_note: "", data_source: "", possession_time: "", description: "",
};

describe("validateRecords", () => {
  it("keeps a valid record", () => {
    const { records, skipped } = validateRecords([base], [{}]);
    expect(records).toHaveLength(1);
    expect(skipped).toHaveLength(0);
  });

  it("coerces an invalid status to blank", () => {
    const { records } = validateRecords([{ ...base, crm_status: "totally made up" }], [{}]);
    expect(records[0].crm_status).toBe("");
  });

  it("keeps a contactable record but blanks an unparseable date", () => {
    const { records, skipped } = validateRecords(
      [{ ...base, created_at: "sometime last week" }],
      [{}]
    );
    expect(records).toHaveLength(1);
    expect(records[0].created_at).toBe("");
    expect(skipped).toHaveLength(0);
  });

  it("preserves a valid created_at unchanged", () => {
    const { records } = validateRecords(
      [{ ...base, created_at: "2026-06-29 10:00:00" }],
      [{}]
    );
    expect(records[0].created_at).toBe("2026-06-29 10:00:00");
  });

  it("skips a record with no email and no mobile", () => {
    const { records, skipped } = validateRecords(
      [{ ...base, email: "", mobile_without_country_code: "" }],
      [{ name: "ghost" }]
    );
    expect(records).toHaveLength(0);
    expect(skipped[0].reason).toMatch(/No email or mobile/);
  });

  it("skips a null (failed batch) row with a clear reason", () => {
    const { skipped } = validateRecords([null], [{ name: "orphan" }]);
    expect(skipped[0].reason).toMatch(/AI extraction failed/);
  });

  it("escapes newlines to keep a single CSV row", () => {
    const { records } = validateRecords([{ ...base, crm_note: "line1\nline2" }], [{}]);
    expect(records[0].crm_note).toBe("line1\\nline2");
  });
});