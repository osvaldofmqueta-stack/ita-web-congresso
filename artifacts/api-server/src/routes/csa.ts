import { Router, type IRouter } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { db, csaSettingsTable, csaLinksTable, csaImportantDatesTable, csaSpeakersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "speakers");
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadsDir();
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase()) ? ext : ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens (JPEG, PNG, WebP, GIF) são permitidas"));
    }
  },
});

/** PIN inicial apenas quando não existe nenhum na base (primeira utilização). */
const INITIAL_PIN_IF_EMPTY = "admin2026";

function normalizePin(p: string | undefined | null): string {
  const s = typeof p === "string" ? p.trim() : "";
  return s;
}

const router: IRouter = Router();

async function getPin(): Promise<string> {
  const row = await db
    .select()
    .from(csaSettingsTable)
    .where(eq(csaSettingsTable.key, "admin_pin"))
    .limit(1);
  const value = normalizePin(row[0]?.value);
  return value || INITIAL_PIN_IF_EMPTY;
}

function requirePin(pinFromReq: string | undefined, correctPin: string): boolean {
  return normalizePin(pinFromReq) === normalizePin(correctPin);
}

/* ─── GET /api/csa/settings ────────────────────────────────────────────────── */
router.get("/settings", async (_req, res) => {
  try {
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
    const { pin } = (req.body as { pin?: string }) ?? {};
    const correctPin = await getPin();
    if (normalizePin(pin) === correctPin) {
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

/* ─── GET /api/csa/dates ────────────────────────────────────────────────────── */
router.get("/dates", async (_req, res) => {
  try {
    const dates = await db
      .select()
      .from(csaImportantDatesTable)
      .orderBy(asc(csaImportantDatesTable.sortOrder), asc(csaImportantDatesTable.createdAt));
    res.json({ ok: true, dates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/csa/dates ──────────────────────────────────────────────────── */
router.post("/dates", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const { label, date, done, sortOrder } = req.body as { label?: string; date?: string; done?: boolean; sortOrder?: number };
    const [entry] = await db
      .insert(csaImportantDatesTable)
      .values({
        label: label ?? "",
        date: date ?? "",
        done: done ?? false,
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    res.json({ ok: true, date: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── PUT /api/csa/dates/:id ───────────────────────────────────────────────── */
router.put("/dates/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const id = Number(req.params.id);
    const { label, date, done, sortOrder } = req.body as { label?: string; date?: string; done?: boolean; sortOrder?: number };
    const updates: Partial<typeof csaImportantDatesTable.$inferInsert> = {};
    if (label !== undefined) updates.label = label;
    if (date !== undefined) updates.date = date;
    if (done !== undefined) updates.done = done;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const [entry] = await db
      .update(csaImportantDatesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(csaImportantDatesTable.id, id))
      .returning();
    res.json({ ok: true, date: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── DELETE /api/csa/dates/:id ────────────────────────────────────────────── */
router.delete("/dates/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const id = Number(req.params.id);
    await db.delete(csaImportantDatesTable).where(eq(csaImportantDatesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── GET /api/csa/speakers ────────────────────────────────────────────────── */
router.get("/speakers", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(csaSpeakersTable)
      .where(eq(csaSpeakersTable.active, true))
      .orderBy(asc(csaSpeakersTable.sortOrder), asc(csaSpeakersTable.createdAt));
    res.json({ ok: true, speakers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── GET /api/csa/speakers/all (admin: todos, incluindo inativos) ─────────── */
router.get("/speakers/all", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const rows = await db
      .select()
      .from(csaSpeakersTable)
      .orderBy(asc(csaSpeakersTable.sortOrder), asc(csaSpeakersTable.createdAt));
    res.json({ ok: true, speakers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/csa/speakers ───────────────────────────────────────────────── */
router.post("/speakers", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const { name, role, area, country, initials, photoUrl, category, academicDegree, origin, active, sortOrder } = req.body as {
      name?: string; role?: string; area?: string; country?: string; initials?: string;
      photoUrl?: string; category?: string; academicDegree?: string; origin?: string;
      active?: boolean; sortOrder?: number;
    };
    const [speaker] = await db
      .insert(csaSpeakersTable)
      .values({
        name: name ?? "",
        role: role ?? "",
        area: area ?? "",
        country: country ?? "",
        initials: initials ?? "",
        photoUrl: photoUrl ?? null,
        category: category ?? null,
        academicDegree: academicDegree ?? null,
        origin: origin ?? null,
        active: active ?? true,
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    res.json({ ok: true, speaker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── PUT /api/csa/speakers/:id ─────────────────────────────────────────────── */
router.put("/speakers/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const id = Number(req.params.id);
    const { name, role, area, country, initials, photoUrl, category, academicDegree, origin, active, sortOrder } = req.body as {
      name?: string; role?: string; area?: string; country?: string; initials?: string;
      photoUrl?: string; category?: string; academicDegree?: string; origin?: string;
      active?: boolean; sortOrder?: number;
    };
    const updates: Partial<typeof csaSpeakersTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (area !== undefined) updates.area = area;
    if (country !== undefined) updates.country = country;
    if (initials !== undefined) updates.initials = initials;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (category !== undefined) updates.category = category;
    if (academicDegree !== undefined) updates.academicDegree = academicDegree;
    if (origin !== undefined) updates.origin = origin;
    if (active !== undefined) updates.active = active;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const [speaker] = await db
      .update(csaSpeakersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(csaSpeakersTable.id, id))
      .returning();
    res.json({ ok: true, speaker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── DELETE /api/csa/speakers/:id ─────────────────────────────────────────── */
router.delete("/speakers/:id", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    const id = Number(req.params.id);
    await db.delete(csaSpeakersTable).where(eq(csaSpeakersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/csa/upload-photo (foto do palestrante, ficheiro local) ──────── */
router.post("/upload-photo", async (req, res) => {
  try {
    const pin = req.headers["x-admin-pin"] as string;
    const correctPin = await getPin();
    if (!requirePin(pin, correctPin)) {
      res.status(401).json({ ok: false, error: "PIN incorrecto" });
      return;
    }
    upload.single("photo")(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Erro no upload";
        res.status(400).json({ ok: false, error: msg });
        return;
      }
      const file = (req as unknown as { file?: multer.File }).file;
      if (!file) {
        res.status(400).json({ ok: false, error: "Nenhum ficheiro enviado. Use o campo 'photo'." });
        return;
      }
      const url = `/uploads/speakers/${file.filename}`;
      res.json({ ok: true, url });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
