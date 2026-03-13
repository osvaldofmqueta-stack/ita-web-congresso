import { Router, type IRouter } from "express";
import { db, csaSettingsTable, csaLinksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/* ─── Default settings ─────────────────────────────────────────────────────── */
const DEFAULT_SETTINGS: Record<string, string> = {
  inscription_end_date: "2026-04-30",
  congress_event_date: "2026-05-15",
  congress_location: "Instituto de Tecnologia Agro-Alimentar, URNM, Angola",
  admin_pin: "admin2026",
};

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db
      .insert(csaSettingsTable)
      .values({ key, value })
      .onConflictDoNothing();
  }
}

async function getPin(): Promise<string> {
  const row = await db
    .select()
    .from(csaSettingsTable)
    .where(eq(csaSettingsTable.key, "admin_pin"))
    .limit(1);
  return row[0]?.value ?? "admin2026";
}

function requirePin(pinFromReq: string | undefined, correctPin: string): boolean {
  return pinFromReq === correctPin;
}

/* ─── GET /api/csa/settings ────────────────────────────────────────────────── */
router.get("/settings", async (_req, res) => {
  try {
    await ensureDefaults();
    const rows = await db.select().from(csaSettingsTable);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      if (row.key !== "admin_pin") {
        settings[row.key] = row.value;
      }
    }
    res.json({ ok: true, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── PUT /api/csa/settings ────────────────────────────────────────────────── */
router.put("/settings", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }

    const { settings } = req.body as { settings: Record<string, string> };
    if (!settings || typeof settings !== "object") {
      res.status(400).json({ ok: false, error: "Invalid payload" });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(csaSettingsTable)
        .values({ key, value })
        .onConflictDoUpdate({
          target: csaSettingsTable.key,
          set: { value, updatedAt: new Date() },
        });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/csa/verify-pin ─────────────────────────────────────────────── */
router.post("/verify-pin", async (req, res) => {
  try {
    await ensureDefaults();
    const { pin } = req.body as { pin: string };
    const correctPin = await getPin();
    if (pin === correctPin) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── GET /api/csa/links ───────────────────────────────────────────────────── */
router.get("/links", async (_req, res) => {
  try {
    const links = await db
      .select()
      .from(csaLinksTable)
      .orderBy(csaLinksTable.createdAt);
    res.json({ ok: true, links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/csa/links ──────────────────────────────────────────────────── */
router.post("/links", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }

    const { platform, label, url, active } = req.body as {
      platform: string;
      label: string;
      url: string;
      active: boolean;
    };

    const [link] = await db
      .insert(csaLinksTable)
      .values({ platform, label, url, active: active ?? false })
      .returning();

    res.json({ ok: true, link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── PUT /api/csa/links/:id ───────────────────────────────────────────────── */
router.put("/links/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }

    const id = Number(req.params.id);
    const { platform, label, url, active } = req.body as {
      platform?: string;
      label?: string;
      url?: string;
      active?: boolean;
    };

    const updates: Partial<typeof csaLinksTable.$inferInsert> = {};
    if (platform !== undefined) updates.platform = platform;
    if (label !== undefined) updates.label = label;
    if (url !== undefined) updates.url = url;
    if (active !== undefined) updates.active = active;

    const [link] = await db
      .update(csaLinksTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(csaLinksTable.id, id))
      .returning();

    res.json({ ok: true, link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── DELETE /api/csa/links/:id ────────────────────────────────────────────── */
router.delete("/links/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }

    const id = Number(req.params.id);
    await db.delete(csaLinksTable).where(eq(csaLinksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
