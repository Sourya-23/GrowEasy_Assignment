import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the ONLY module that talks to Gemini. Phase 1 returns a mapping,
// Phase 2 echoes deterministic records so we can assert the orchestration.
vi.mock("./ai/geminiClient.js", () => ({
  generateJson: vi.fn(async ({ system, user }: { system: string; user: string }) => {
    if (system.toLowerCase().includes("mapping plan")) {
      return { entries: [], unmappedColumns: [], notes: "" };
    }
    // extraction: pull the rows out of the user prompt and build records
    const rows: Record<string, string>[] = JSON.parse(user.slice(user.indexOf("[")));
    return rows.map((r) => ({
      created_at: "",
      name: r["name"] ?? r["Full Name"] ?? "",
      email: r["email"] ?? r["contact_email"] ?? r["Email Address"] ?? "",
      country_code: "",
      mobile_without_country_code: r["mobile"] ?? r["Phone Number"] ?? "",
      company: "", city: "", state: "", country: "", lead_owner: "",
      crm_status: "", crm_note: "", data_source: "", possession_time: "", description: "",
    }));
  }),
}));

const { runImport } = await import("./services/importService.js");

describe("runImport pipeline", () => {
  beforeEach(() => vi.clearAllMocks());

  it("imports rows with contact and skips those without", async () => {
    const csv = [
      "name,email,mobile",
      "Has Email,has@x.com,",
      "Has Phone,,9876543210",
      "No Contact,,",
    ].join("\n");

    const events: string[] = [];
    const result = await runImport("test.csv", csv, (e) => events.push(e.type));

    expect(result.totals.totalRows).toBe(3);
    expect(result.totals.imported).toBe(2);
    expect(result.totals.skipped).toBe(1);
    expect(result.skipped[0].reason).toMatch(/No email or mobile/);
    expect(events).toContain("parsed");
    expect(events).toContain("mapping");
    expect(events).toContain("done");
  });
});
