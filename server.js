const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.static(publicDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "ResumeCraft", version: "1.0.0" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ResumeCraft is running at http://localhost:${PORT}`);
});