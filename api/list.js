const GH_API = "https://api.github.com";
function json(res, status = 200) {
  return { statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(res) };
}
module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Metode tidak diizinkan." });
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH = "main" } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return res.status(503).json({ error: "Konfigurasi GitHub belum lengkap." });
  try {
    const all = [];
    for (const type of ["tugas", "materi"]) {
      const url = `${GH_API}/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${type}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`GitHub API mengembalikan status ${response.status}.`);
      const items = await response.json();
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item.type !== "file") continue;
        let description = item.name.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/_[a-f0-9]{8}(?=\.)/, "").replace(/_/g, " ");
        description = description.replace(/\.[^.]+$/, "");
        const meta = item.name.match(/^\d{4}-\d{2}-\d{2}_(.*?)_[a-f0-9]{8}\./);
        if (meta) description = meta[1].replace(/_/g, " ");
        all.push({ type, name: item.name, description, url: item.download_url || item.html_url, size: item.size, updatedAt: item.name.slice(0, 10) });
      }
    }
    all.sort((a,b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return res.status(200).json({ files: all });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Tidak dapat membaca arsip GitHub." });
  }
};
