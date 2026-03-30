import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import {
  createQuotation,
  deleteQuotation,
  getQuotationById,
  listQuotations,
  updateQuotation,
} from "./quotation-service.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", async (_req, res) => {
  res.json({
    name: "quotation-backend",
    ok: true,
    endpoints: [
      "GET /health",
      "GET /api/quotations",
      "GET /api/quotations/:id",
      "POST /api/quotations",
      "PUT /api/quotations/:id",
      "DELETE /api/quotations/:id",
    ],
  });
});

app.get("/health", async (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/quotations", async (_req, res, next) => {
  try {
    const data = await listQuotations();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/quotations/:id", async (req, res, next) => {
  try {
    const data = await getQuotationById(Number(req.params.id));
    if (!data) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/api/quotations", async (req, res, next) => {
  try {
    const data = await createQuotation(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

app.put("/api/quotations/:id", async (req, res, next) => {
  try {
    const data = await updateQuotation(Number(req.params.id), req.body);
    if (!data) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/quotations/:id", async (req, res, next) => {
  try {
    const deleted = await deleteQuotation(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: "quotationNo already exists" });
  }

  if (error?.message?.includes("required") || error?.message?.includes("must contain")) {
    return res.status(400).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await initDatabase();
  app.listen(config.port, config.host, () => {
    console.log(`Quotation backend running on http://${config.host}:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
});
