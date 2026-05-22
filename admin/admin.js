const ADMIN_WEDDING_SLUG = "ayse-mert";

let adminWeddingData = null;
let adminWeddingId = null;

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const adminPasswordInput = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");

const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardDate = document.getElementById("dashboardDate");

const totalMessages = document.getElementById("totalMessages");
const totalComing = document.getElementById("totalComing");
const totalGuests = document.getElementById("totalGuests");
const totalPhotos = document.getElementById("totalPhotos");

const messagesList = document.getElementById("messagesList");
const photosGrid = document.getElementById("photosGrid");

const refreshMessagesBtn = document.getElementById("refreshMessagesBtn");
const refreshPhotosBtn = document.getElementById("refreshPhotosBtn");

document.addEventListener("DOMContentLoaded", async () => {
  await loadWeddingForAdmin();

  const isLoggedIn = localStorage.getItem("weddingAdminLoggedIn") === "true";

  if (isLoggedIn) {
    showDashboard();
  }

  setupAdminEvents();
});

function setupAdminEvents() {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = adminPasswordInput.value.trim();

    if (!adminWeddingData) {
      setLoginStatus("Düğün bilgisi yüklenemedi. Supabase bağlantısını kontrol edin.", "error");
      return;
    }

    if (password === adminWeddingData.admin_password) {
      localStorage.setItem("weddingAdminLoggedIn", "true");
      adminPasswordInput.value = "";
      showDashboard();
    } else {
      setLoginStatus("Şifre hatalı. Lütfen tekrar deneyin.", "error");
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("weddingAdminLoggedIn");
    dashboardScreen.classList.add("is-hidden");
    loginScreen.classList.remove("is-hidden");
  });

  refreshMessagesBtn.addEventListener("click", loadMessages);
  refreshPhotosBtn.addEventListener("click", loadPhotos);
}

async function loadWeddingForAdmin() {
  try {
    if (typeof supabaseClient === "undefined") {
      setLoginStatus("Supabase bağlantısı bulunamadı. Config dosyasını kontrol edin.", "error");
      return;
    }

    const { data, error } = await supabaseClient
      .from("weddings")
      .select("*")
      .eq("slug", ADMIN_WEDDING_SLUG)
      .single();

    if (error || !data) {
      console.error("Admin wedding error:", error);
      setLoginStatus("Düğün kaydı bulunamadı.", "error");
      return;
    }

    adminWeddingData = data;
    adminWeddingId = data.id;

    renderDashboardHeader(data);
  } catch (error) {
    console.error("loadWeddingForAdmin error:", error);
    setLoginStatus("Admin bilgileri yüklenirken hata oluştu.", "error");
  }
}

function renderDashboardHeader(data) {
  const names = `${data.bride_name || ""} & ${data.groom_name || ""}`;

  dashboardTitle.textContent = names;
  dashboardDate.textContent = formatDateTR(data.wedding_date);
}

async function showDashboard() {
  loginScreen.classList.add("is-hidden");
  dashboardScreen.classList.remove("is-hidden");

  await loadMessages();
  await loadPhotos();
}

async function loadMessages() {
  if (!adminWeddingId) return;

  messagesList.innerHTML = `<div class="empty-state">Notlar yükleniyor...</div>`;

  const { data, error } = await supabaseClient
    .from("guest_messages")
    .select("*")
    .eq("wedding_id", adminWeddingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Messages error:", error);
    messagesList.innerHTML = `<div class="empty-state">Notlar yüklenirken hata oluştu.</div>`;
    return;
  }

  renderMessages(data || []);
}

function renderMessages(messages) {
  totalMessages.textContent = messages.length;

  const comingMessages = messages.filter((item) => item.attendance_status === "Geliyorum");
  totalComing.textContent = comingMessages.length;

  const totalGuestCount = comingMessages.reduce((sum, item) => {
    return sum + Number(item.guest_count || 0);
  }, 0);

  totalGuests.textContent = totalGuestCount;

  if (!messages.length) {
    messagesList.innerHTML = `<div class="empty-state">Henüz katılımcı notu bulunmuyor.</div>`;
    return;
  }

  messagesList.innerHTML = messages.map((item) => {
    const date = formatDateTimeTR(item.created_at);
    const guestCount = item.guest_count || 1;

    return `
      <article class="message-card">
        <div class="message-top">
          <div>
            <strong>${escapeHTML(item.guest_name || "İsimsiz Katılımcı")}</strong>
            <span>${date}</span>
          </div>

          <div class="badge">
            ${escapeHTML(item.attendance_status || "Belirtilmedi")} · ${guestCount} kişi
          </div>
        </div>

        ${
          item.message_text
            ? `<p class="message-text">${escapeHTML(item.message_text)}</p>`
            : `<p class="message-text">Yazılı not bırakılmadı.</p>`
        }

        ${
          item.drawing_url
            ? `
              <div class="drawing-preview">
                <img src="${item.drawing_url}" alt="Çizimli not" loading="lazy" />
              </div>
            `
            : ""
        }
      </article>
    `;
  }).join("");
}

async function loadPhotos() {
  if (!adminWeddingId) return;

  photosGrid.innerHTML = `<div class="empty-state">Fotoğraflar yükleniyor...</div>`;

  const { data, error } = await supabaseClient
    .from("photo_uploads")
    .select("*")
    .eq("wedding_id", adminWeddingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Photos error:", error);
    photosGrid.innerHTML = `<div class="empty-state">Fotoğraflar yüklenirken hata oluştu.</div>`;
    return;
  }

  renderPhotos(data || []);
}

function renderPhotos(photos) {
  totalPhotos.textContent = photos.length;

  if (!photos.length) {
    photosGrid.innerHTML = `<div class="empty-state">Henüz fotoğraf yüklenmedi.</div>`;
    return;
  }

  photosGrid.innerHTML = photos.map((item) => {
    const date = formatDateTimeTR(item.created_at);
    const size = formatFileSize(item.file_size);

    return `
      <article class="photo-card">
        <img src="${item.file_url}" alt="Yüklenen düğün fotoğrafı" loading="lazy" />

        <div class="photo-info">
          <strong>${escapeHTML(item.guest_name || "İsimsiz Katılımcı")}</strong>
          <span>${date}</span>
          <span>${size}</span>

          <div class="photo-actions">
            <a href="${item.file_url}" target="_blank" rel="noopener">Aç</a>
            <a href="${item.file_url}" download>İndir</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setLoginStatus(message, type) {
  loginStatus.textContent = message;
  loginStatus.classList.remove("is-error");

  if (type === "error") {
    loginStatus.classList.add("is-error");
  }
}

function formatDateTR(dateString) {
  if (!dateString) return "Tarih bilgisi yok";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatDateTimeTR(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatFileSize(size) {
  if (!size) return "Boyut bilgisi yok";

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}