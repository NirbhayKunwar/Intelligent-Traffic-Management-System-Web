import { existsSync, statSync, createReadStream } from "fs";
import path from "path";

export function streamLocalVideo(req, res, absPath) {
  if (!absPath || !existsSync(absPath)) {
    return res.status(404).json({ message: "Video file not found." });
  }

  const stat = statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();
  
  const contentType =
    ext === ".webm"
      ? "video/webm"
      : ext === ".mkv"
        ? "video/x-matroska"
        : ext === ".avi"
          ? "video/x-msvideo"
          : ext === ".mov"
            ? "video/quicktime"
            : "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = Number(parts[0]);
    const end = parts[1] ? Number(parts[1]) : fileSize - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= fileSize) {
      return res.status(416).send("Requested Range Not Satisfiable");
    }

    const chunkSize = end - start + 1;
    const file = createReadStream(absPath, { start, end });
    
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    
    file.pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  
  createReadStream(absPath).pipe(res);
}
