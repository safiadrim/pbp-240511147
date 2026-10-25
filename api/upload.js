const GH_API = "https://api.github.com";
const formidable = require("formidable");
const fs = require("fs/promises");
const MAX_SIZE = 5 * 1024 * 1024;

function safeName(value) {
  return String(value || "file").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^[_\.]+|[_\.]+$/g, "").slice(0, 90) || "file";
}
function parseForm(req) {
  const form = formidable({
    maxFileSize: MAX_SIZE,
    maxTotalFileSize: MAX_SIZE,
    multiples: false,
    keepExtensions: true,
    allowEmptyFiles: false
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });
}
function first(value) { return Array.isArray(value) ? value[0] : value; }

module.exports = async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan." });
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH = "main", ADMIN_PASSWORD } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !ADMIN_PASSWORD) return res.status(503).json({ error: "Environment Variables belum lengkap. Periksa pengaturan Vercel." });
  let tempPath;
  try {
    const { fields, files } = await parseForm(req);
    const password = first(fields.password);
    const type = first(fields.type);
    const description = String(first(fields.description) || "").trim();
    const file = first(files.file);
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Kata sandi pengelola salah." });
    if (!["tugas", "materi"].includes(type)) return res.status(400).json({ error: "Jenis unggahan tidak valid." });
    if (!description) return res.status(400).json({ error: "Keterangan wajib diisi." });
    if (!file || !file.filepath) return res.status(400).json({ error: "File belum dipilih." });
    if (file.size > MAX_SIZE) return res.status(413).json({ error: "Ukuran file maksimal 5 MB." });
    tempPath = file.filepath;
    const bytes = await fs.readFile(file.filepath);
    const date = new Date().toISOString().slice(0,10);
    const desc = safeName(description);
    const original = safeName(file.originalFilename || "file");
    const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : "";
    const base = original.includes(".") ? original.slice(0, original.lastIndexOf(".")) : original;
    const unique = require("crypto").randomBytes(4).toString("hex");
    const filename = `${date}_${desc}_${unique}_${base}${ext}`.slice(0, 180);
    const path = `${type}/${filename}`;
    const apiUrl = `${GH_API}/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
    const gh = await fetch(apiUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Tambah ${type}: ${description}`, content: bytes.toString("base64"), branch: GITHUB_BRANCH })
    });
    const data = await gh.json().catch(() => ({}));
    if (!gh.ok) return res.status(502).json({ error: data.message || `GitHub menolak unggahan (HTTP ${gh.status}).` });
    return res.status(200).json({ ok: true, name: filename, url: data.content?.html_url || "" });
  } catch (error) {
    const message = error.code === "biggerThanMaxFileSize" ? "Ukuran file maksimal 5 MB." : (error.message || "Terjadi kesalahan saat mengunggah.");
    return res.status(500).json({ error: message });
  } finally {
    if (tempPath) await fs.unlink(tempPath).catch(() => {});
  }
};
