const WEDDING_SLUG = "ayse-mert";

let weddingData = null;
let currentWeddingId = null;

let drawingCanvas = null;
let drawingContext = null;
let isDrawing = false;
let hasDrawing = false;

let heroLottie = null;
let introOpened = false;

const introScreen = document.getElementById("introScreen");
const invitationContent = document.getElementById("invitationContent");
const introGateVideo = document.getElementById("introGateVideo");

const heroFloralAnimation = document.getElementById("heroFloralAnimation");

const introNames = document.getElementById("introNames");
const introDate = document.getElementById("introDate");
const coupleNames = document.getElementById("coupleNames");
const weddingDateText = document.getElementById("weddingDateText");
const detailDate = document.getElementById("detailDate");
const detailTime = document.getElementById("detailTime");
const detailVenue = document.getElementById("detailVenue");
const detailAddress = document.getElementById("detailAddress");
const locationVenueText = document.getElementById("locationVenueText");
const mapButton = document.getElementById("mapButton");
const finalNames = document.getElementById("finalNames");

const messageForm = document.getElementById("messageForm");
const messageStatus = document.getElementById("messageStatus");
const clearDrawingBtn = document.getElementById("clearDrawingBtn");

const photoForm = document.getElementById("photoForm");
const photoStatus = document.getElementById("photoStatus");

document.addEventListener("DOMContentLoaded", async () => {
  setupIntroGateAutoPlay();
  setupHeroAnimation();
  setupDrawingCanvas();
  setupMessageForm();
  setupPhotoForm();

  await loadWeddingData();
});

async function loadWeddingData() {
  try {
    if (typeof supabaseClient === "undefined") {
      console.warn("Supabase bağlantısı bulunamadı. Varsayılan bilgiler gösteriliyor.");
      renderFallbackWeddingData();
      return;
    }

    const { data, error } = await supabaseClient
      .from("weddings")
      .select("*")
      .eq("slug", WEDDING_SLUG)
      .single();

    if (error || !data) {
      console.error("Wedding data error:", error);
      renderFallbackWeddingData();
      return;
    }

    weddingData = data;
    currentWeddingId = data.id;

    renderWeddingData(data);
  } catch (error) {
    console.error("loadWeddingData error:", error);
    renderFallbackWeddingData();
  }
}

function renderFallbackWeddingData() {
  const fallbackData = {
    id: null,
    bride_name: "Sema",
    groom_name: "Emre",
    wedding_date: "2026-06-28",
    wedding_time: "19:30",
    venue_name: "Masal Kır Düğün Salonu",
    venue_address: "Masal Kır Düğün Salonu",
    map_url: "https://www.google.com/maps/search/?api=1&query=Masal+Kır+Düğün+Salonu"
  };

  renderWeddingData(fallbackData);
}

function renderWeddingData(data) {
  const names = `${data.bride_name || ""} & ${data.groom_name || ""}`;
  const formattedDate = formatDateTR(data.wedding_date);

  document.title = `${names} | Düğün Davetiyesi`;

  if (introNames) introNames.textContent = names;
  if (introDate) introDate.textContent = formattedDate;

  if (coupleNames) coupleNames.textContent = names;
  if (weddingDateText) weddingDateText.textContent = formattedDate;

  if (detailDate) detailDate.textContent = formattedDate;
  if (detailTime) detailTime.textContent = data.wedding_time || "Saat bilgisi eklenecek";
  if (detailVenue) detailVenue.textContent = data.venue_name || "Mekan bilgisi eklenecek";
  if (detailAddress) detailAddress.textContent = data.venue_address || "Adres bilgisi eklenecek";

  if (locationVenueText) {
    locationVenueText.textContent = data.venue_name || "Düğün Konumu";
  }

  if (mapButton) {
    mapButton.href = data.map_url || "https://www.google.com/maps/search/?api=1&query=Masal+Kır+Düğün+Salonu";
  }

  if (finalNames) {
    finalNames.textContent = `Sevgiyle, ${names}`;
  }
}

function setupIntroGateAutoPlay() {
  if (!introScreen || !invitationContent || !introGateVideo) {
    console.error("Intro gate elementlerinden biri bulunamadı.");
    return;
  }

  introGateVideo.muted = true;
  introGateVideo.playsInline = true;
  introGateVideo.currentTime = 0;

  introGateVideo.addEventListener("ended", showInvitationContent);

  introGateVideo.addEventListener("error", () => {
    console.error("Intro video yüklenemedi.");
    setTimeout(showInvitationContent, 1200);
  });

  const playPromise = introGateVideo.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        introScreen.classList.add("is-video-playing");
      })
      .catch((error) => {
        console.error("Intro video otomatik oynatılamadı:", error);
        setTimeout(showInvitationContent, 1200);
      });
  } else {
    introScreen.classList.add("is-video-playing");
  }
}

function showInvitationContent() {
  if (introOpened) return;

  introOpened = true;

  introScreen.classList.add("intro-leaving");

  setTimeout(() => {
    introScreen.classList.add("is-hidden");
    invitationContent.classList.remove("is-hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 900);
}

function setupHeroAnimation() {
  if (!heroFloralAnimation || typeof lottie === "undefined") return;

  heroLottie = lottie.loadAnimation({
    container: heroFloralAnimation,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "assets/animations/wedding-floral.json"
  });
}

/* DRAWING CANVAS */

function setupDrawingCanvas() {
  drawingCanvas = document.getElementById("drawingCanvas");

  if (!drawingCanvas) return;

  drawingContext = drawingCanvas.getContext("2d");

  resizeCanvas();

  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  drawingCanvas.addEventListener("pointerdown", startDrawing);
  drawingCanvas.addEventListener("pointermove", draw);
  drawingCanvas.addEventListener("pointerup", stopDrawing);
  drawingCanvas.addEventListener("pointerleave", stopDrawing);
  drawingCanvas.addEventListener("pointercancel", stopDrawing);

  if (clearDrawingBtn) {
    clearDrawingBtn.addEventListener("click", clearDrawing);
  }
}

function resizeCanvas() {
  if (!drawingCanvas || !drawingContext) return;

  const rect = drawingCanvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  drawingCanvas.width = rect.width * ratio;
  drawingCanvas.height = rect.height * ratio;

  drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);

  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";
  drawingContext.lineWidth = 3;
  drawingContext.strokeStyle = "#8a5f5b";
}

function getPointerPosition(event) {
  const rect = drawingCanvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDrawing(event) {
  event.preventDefault();

  isDrawing = true;
  hasDrawing = true;

  const position = getPointerPosition(event);

  drawingContext.beginPath();
  drawingContext.moveTo(position.x, position.y);
}

function draw(event) {
  if (!isDrawing) return;

  event.preventDefault();

  const position = getPointerPosition(event);

  drawingContext.lineTo(position.x, position.y);
  drawingContext.stroke();
}

function stopDrawing() {
  if (!isDrawing) return;

  isDrawing = false;
  drawingContext.closePath();
}

function clearDrawing() {
  if (!drawingCanvas || !drawingContext) return;

  const rect = drawingCanvas.getBoundingClientRect();

  drawingContext.clearRect(0, 0, rect.width, rect.height);
  hasDrawing = false;
}

/* MESSAGE FORM */

function setupMessageForm() {
  if (!messageForm) return;

  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (typeof supabaseClient === "undefined") {
      setTemporaryStatus(messageStatus, "Supabase bağlantısı bulunamadı. Config dosyasını kontrol edin.", "error");
      return;
    }

    if (!currentWeddingId) {
      setTemporaryStatus(messageStatus, "Düğün bilgisi yüklenemedi. Lütfen Supabase kaydını kontrol edin.", "error");
      return;
    }

    const guestName = document.getElementById("guestName").value.trim();
    const messageText = document.getElementById("messageText").value.trim();

    if (!guestName) {
      setTemporaryStatus(messageStatus, "Lütfen adınızı yazın.", "error");
      return;
    }

    if (!messageText && !hasDrawing) {
      setTemporaryStatus(messageStatus, "Lütfen yazılı veya çizimli bir not bırakın.", "error");
      return;
    }

    setButtonLoading(messageForm, true);
    setTemporaryStatus(messageStatus, "Notunuz kaydediliyor...", "normal");

    let drawingUrl = null;

    if (hasDrawing) {
      const drawingUpload = await uploadDrawing(guestName);

      if (!drawingUpload.success) {
        setButtonLoading(messageForm, false);
        setTemporaryStatus(messageStatus, drawingUpload.message, "error");
        return;
      }

      drawingUrl = drawingUpload.url;
    }

    const { error } = await supabaseClient
      .from("guest_messages")
      .insert({
        wedding_id: currentWeddingId,
        guest_name: guestName,
        attendance_status: "Not bilgisi",
        guest_count: 1,
        message_text: messageText,
        drawing_url: drawingUrl
      });

    setButtonLoading(messageForm, false);

    if (error) {
      console.error("Message insert error:", error);
      setTemporaryStatus(messageStatus, "Not gönderilirken bir hata oluştu.", "error");
      return;
    }

    messageForm.reset();
    clearDrawing();

    setTemporaryStatus(messageStatus, "Notunuz başarıyla kaydedildi. Çok teşekkür ederiz.", "success");
  });
}

async function uploadDrawing(guestName) {
  const blob = await new Promise((resolve) => {
    drawingCanvas.toBlob(resolve, "image/png", 0.95);
  });

  if (!blob) {
    return {
      success: false,
      message: "Çizim kaydedilemedi."
    };
  }

  const safeName = createSafeFileName(guestName || "guest");
  const filePath = `${WEDDING_SLUG}/${Date.now()}-${safeName}-drawing.png`;

  const { error } = await supabaseClient.storage
    .from("wedding-drawings")
    .upload(filePath, blob, {
      contentType: "image/png",
      upsert: false
    });

  if (error) {
    console.error("Drawing upload error:", error);

    return {
      success: false,
      message: "Çizim yüklenirken bir hata oluştu. Storage izinlerini kontrol edin."
    };
  }

  const { data } = supabaseClient.storage
    .from("wedding-drawings")
    .getPublicUrl(filePath);

  return {
    success: true,
    url: data.publicUrl
  };
}

/* PHOTO FORM */

function setupPhotoForm() {
  if (!photoForm) return;

  photoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (typeof supabaseClient === "undefined") {
      setTemporaryStatus(photoStatus, "Supabase bağlantısı bulunamadı. Config dosyasını kontrol edin.", "error");
      return;
    }

    if (!currentWeddingId) {
      setTemporaryStatus(photoStatus, "Düğün bilgisi yüklenemedi. Lütfen Supabase kaydını kontrol edin.", "error");
      return;
    }

    const guestName = document.getElementById("photoGuestName").value.trim();
    const fileInput = document.getElementById("photoInput");
    const file = fileInput.files[0];

    if (!guestName) {
      setTemporaryStatus(photoStatus, "Lütfen adınızı yazın.", "error");
      return;
    }

    if (!file) {
      setTemporaryStatus(photoStatus, "Lütfen bir fotoğraf seçin.", "error");
      return;
    }

    const validation = validatePhoto(file);

    if (!validation.valid) {
      setTemporaryStatus(photoStatus, validation.message, "error");
      return;
    }

    setButtonLoading(photoForm, true);
    setTemporaryStatus(photoStatus, "Fotoğraf yükleniyor...", "normal");

    const safeName = createSafeFileName(guestName || "guest");
    const extension = getFileExtension(file.name);
    const filePath = `${WEDDING_SLUG}/${Date.now()}-${safeName}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("wedding-photos")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      setButtonLoading(photoForm, false);
      setTemporaryStatus(photoStatus, "Fotoğraf yüklenirken bir hata oluştu. Storage izinlerini kontrol edin.", "error");
      return;
    }

    const { data } = supabaseClient.storage
      .from("wedding-photos")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabaseClient
      .from("photo_uploads")
      .insert({
        wedding_id: currentWeddingId,
        guest_name: guestName,
        file_url: data.publicUrl,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      });

    setButtonLoading(photoForm, false);

    if (insertError) {
      console.error("Photo database insert error:", insertError);
      setTemporaryStatus(photoStatus, "Fotoğraf yüklendi ama veritabanı kaydı oluşturulamadı.", "error");
      return;
    }

    photoForm.reset();

    setTemporaryStatus(photoStatus, "Fotoğraf başarıyla yüklendi. Çok teşekkür ederiz.", "success");
  });
}

function validatePhoto(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Sadece JPG, PNG veya WEBP görsel yükleyebilirsiniz."
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: "Fotoğraf maksimum 5 MB olabilir."
    };
  }

  return {
    valid: true,
    message: ""
  };
}

/* HELPERS */

function formatDateTR(dateString) {
  if (!dateString) return "Tarih bilgisi eklenecek";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function createSafeFileName(value) {
  const cleaned = String(value || "guest")
    .toLowerCase()
    .trim()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return cleaned || "guest";
}

function getFileExtension(fileName) {
  const parts = String(fileName || "").split(".");
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : "jpg";

  if (extension === "jpeg") return "jpg";

  return extension;
}

function setTemporaryStatus(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.classList.remove("is-error", "is-success");

  if (type === "error") {
    element.classList.add("is-error");
  }

  if (type === "success") {
    element.classList.add("is-success");
  }
}

function setButtonLoading(form, isLoading) {
  const button = form.querySelector("button[type='submit']");

  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Lütfen bekleyin...";
    button.disabled = true;
    button.style.opacity = "0.65";
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.style.opacity = "1";
  }
}