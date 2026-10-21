import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API route for shortening URLs (bypasses browser CORS)
  const handleShorten = async (req: any, res: any) => {
    try {
      const { longUrl, schoolId } = req.body;
      if (!longUrl) {
        return res.status(400).json({ error: "Missing longUrl" });
      }

      const cleanSchoolId = (schoolId || "school").toLowerCase().replace(/[^a-z0-9]/g, "");
      
      // Just get a standard tinyurl to prevent alias conflicts/errors
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);

      if (response.ok) {
        const shortUrl = await response.text();
        res.json({ shortUrl: shortUrl.trim() });
      } else {
        res.status(500).json({ error: "Failed to shorten URL with TinyURL" });
      }
    } catch (error: any) {
      console.error("Error shortening URL:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  };

  app.post("/api/shorten", handleShorten);
  app.post("/api/link", handleShorten);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
