const state = { type: "tugas", files: [] };
const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function niceSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}
function render() {
  const q = $("searchInput").value.trim().toLowerCase();
  const filtered = state.files.filter(f => f.type === state.type &&
    `${f.description || ""} ${f.name || ""}`.toLowerCase().includes(q));
  $("taskCount").textContent = state.files.filter(f => f.type === "tugas").length;
  $("materialCount").textContent = state.files.filter(f => f.type === "materi").length;
  $("resultLabel").textContent = `${filtered.length} file`;
  const list = $("fileList");
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">${state.files.length ? "Belum ada file yang cocok dengan pencarian ini." : "Belum ada arsip. File yang diunggah akan muncul di sini."}</div>`;
    return;
  }
  list.innerHTML = filtered.map(f => {
    const name = escapeHtml(f.name || "File");
    const description = escapeHtml(f.description || f.name || "Tanpa keterangan");
    const type = f.type === "materi" ? "MATERI" : "TUGAS";
    const date = f.updatedAt ? new Date(f.updatedAt).toLocaleDateString("id-ID", {day:"numeric",month:"short",year:"numeric"}) : "";
    const size = f.size ? niceSize(f.size) : "";
    const url = escapeHtml(f.url || "#");
    return `<article class="file-card"><div class="file-top"><div class="file-icon">▤</div><span class="file-type">${type}</span></div><h3>${description}</h3><div class="file-name">${name}</div><div class="file-meta">${[date,size].filter(Boolean).join(" · ")}</div><div class="file-actions"><a href="${url}" target="_blank" rel="noreferrer">Lihat file ↗</a><a class="download" href="${url}" download>Unduh ↓</a></div></article>`;
  }).join("");
}
async function loadFiles() {
  $("resultLabel").textContent = "Memuat arsip...";
  try {
    const res = await fetch("/api/list", { cache: "no-store" });
    if (!res.ok) throw new Error("Endpoint arsip belum siap. Pastikan website sudah dideploy ke Vercel.");
    const data = await res.json();
    state.files = Array.isArray(data.files) ? data.files : [];
    render();
  } catch (err) {
    state.files = [];
    $("fileList").innerHTML = `<div class="empty-state">${escapeHtml(err.message)}<br>Setelah konfigurasi selesai, file akan tampil otomatis di sini.</div>`;
    $("taskCount").textContent = "0";
    $("materialCount").textContent = "0";
    $("resultLabel").textContent = "Arsip belum tersedia";
  }
}
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  state.type = btn.dataset.tab;
  document.querySelectorAll(".tab").forEach(tab => {
    const active = tab === btn;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  render();
}));
$("searchInput").addEventListener("input", render);
$("refreshBtn").addEventListener("click", loadFiles);
$("uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = $("fileInput").files[0];
  const msg = $("uploadMessage");
  const btn = $("uploadBtn");
  msg.className = "form-message";
  if (!file) { msg.textContent = "Pilih file terlebih dahulu."; return; }
  if (file.size > 5 * 1024 * 1024) { msg.className = "form-message error"; msg.textContent = "Ukuran file melebihi 5 MB. Silakan kompres file terlebih dahulu."; return; }
  btn.disabled = true;
  btn.textContent = "Mengunggah...";
  msg.textContent = "Sedang mengunggah file ke GitHub. Jangan tutup halaman.";
  try {
    const body = new FormData();
    body.append("password", $("adminPassword").value);
    body.append("type", $("fileType").value);
    body.append("description", $("description").value.trim());
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Unggah gagal. Periksa konfigurasi server.");
    msg.className = "form-message success";
    msg.textContent = "Berhasil diunggah! Arsip sedang diperbarui.";
    $("uploadForm").reset();
    await loadFiles();
  } catch (err) {
    msg.className = "form-message error";
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Unggah ke arsip <span>↑</span>';
  }
});
loadFiles();
