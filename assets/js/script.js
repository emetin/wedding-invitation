const WEDDING_SLUG = "ayse-mert";

let weddingData = null;
let currentWeddingId = null;

let drawingCanvas = null;
let drawingContext = null;
let isDrawing = false;
let hasDrawing = false;

let heroLottie = null;

const introFrameCanvas = document.getElementById("introFrameCanvas");
const introScreen = document.getElementById("introScreen");
const introProgressBar = document.getElementById("introProgressBar");

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
const photoInput = document.getElementById("photoInput");
const selectedPhotoName = document.getElementById("selectedPhotoName");

document.addEventListener("DOMContentLoaded", async () => {
  setupScrollDrivenIntroFrames();
  setupHeroAnimation();
  setupDrawingCanvas();
  setupMessageForm();
  setupPhotoForm();
  setupSelectedPhotoName();
  setupRevealSections();

  await loadWeddingData();
});

/* DATA */

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

/* SCROLL DRIVEN FRAME CANVAS */

function setupScrollDrivenIntroFrames() {
  const canvas = document.getElementById("introFrameCanvas");
  const intro = document.getElementById("introScreen");
  const progressBar = document.getElementById("introProgressBar");
  const introSticky = document.querySelector(".intro-sticky");

  if (!canvas || !intro || !introSticky) {
    console.error("Intro canvas, intro alanı veya sticky alan bulunamadı.");
    return;
  }

  const context = canvas.getContext("2d");

  const frameCount = 240;
  const images = [];
  let loadedCount = 0;
  let currentFrame = 1;
  let ticking = false;

  function getFramePath(index) {
    const frameNumber = String(index).padStart(4, "0");
    return `assets/frames/gate_${frameNumber}.jpg`;
  }

  function preloadFrames() {
    for (let index = 1; index <= frameCount; index += 1) {
      const image = new Image();
      image.src = getFramePath(index);

      image.onload = () => {
        loadedCount += 1;

        if (index === 1) {
          drawFrame(1);
        }

        if (loadedCount === frameCount) {
          console.log("Tüm intro frame görselleri yüklendi:", loadedCount);
        }
      };

      image.onerror = () => {
        console.warn("Frame yüklenemedi:", image.src);
      };

      images[index] = image;
    }
  }

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    drawFrame(currentFrame);
  }

  function drawFrame(index) {
    const image = images[index];

    if (!image || !image.complete || !image.naturalWidth) return;

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (imageRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  function getProgress() {
    const rect = intro.getBoundingClientRect();
    const scrollDistance = intro.offsetHeight - window.innerHeight;

    if (scrollDistance <= 0) return 1;

    const scrolled = Math.min(Math.max(-rect.top, 0), scrollDistance);

    return scrolled / scrollDistance;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function smoothStep(edge0, edge1, value) {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function updateIntroMotion(progress) {
    const centerMoveProgress = smoothStep(0.12, 0.62, progress);
    const fadeProgress = smoothStep(0.74, 1, progress);

    const frameScale = lerp(1.02, 1.16, centerMoveProgress);
    const contentY = lerp(0, -145, centerMoveProgress);
    const contentScale = lerp(1, 1.06, centerMoveProgress) - fadeProgress * 0.08;
    const titleScale = lerp(1, 1.08, centerMoveProgress) - fadeProgress * 0.06;
    const contentOpacity = clamp(1 - fadeProgress * 0.72, 0.28, 1);
    const gradientOpacity = clamp(1 - fadeProgress * 0.28, 0.62, 1);
    const blur = lerp(0, 1.2, fadeProgress);

    introSticky.style.setProperty("--intro-frame-scale", frameScale.toFixed(3));
    introSticky.style.setProperty("--intro-content-y", `${contentY.toFixed(1)}px`);
    introSticky.style.setProperty("--intro-content-scale", contentScale.toFixed(3));
    introSticky.style.setProperty("--intro-title-scale", titleScale.toFixed(3));
    introSticky.style.setProperty("--intro-content-opacity", contentOpacity.toFixed(3));
    introSticky.style.setProperty("--intro-gradient-opacity", gradientOpacity.toFixed(3));
    introSticky.style.setProperty("--intro-blur", `${blur.toFixed(2)}px`);
  }

  function updateByScroll() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      ticking = false;

      const progress = getProgress();

      if (progressBar) {
        progressBar.style.width = `${Math.round(progress * 100)}%`;
      }

      updateIntroMotion(progress);

      const targetFrame = Math.min(
        frameCount,
        Math.max(1, Math.round(progress * (frameCount - 1)) + 1)
      );

      if (targetFrame === currentFrame) return;

      currentFrame = targetFrame;
      drawFrame(currentFrame);

      console.log("Intro frame:", currentFrame, "Progress:", progress.toFixed(3));
    });
  }

  resizeCanvas();
  preloadFrames();
  updateIntroMotion(0);

  window.addEventListener("resize", () => {
    resizeCanvas();
    updateByScroll();
  });

  window.addEventListener("scroll", updateByScroll, { passive: true });

  setTimeout(() => {
    updateByScroll();
  }, 300);
}

/* ANIMATIONS */

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

function setupRevealSections() {
  const sections = document.querySelectorAll(".reveal-section");

  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* DRAWING CANVAS */

function setupDrawingCanvas() {
  drawingCanvas = document.getElementById("drawingCanvas");

  if (!drawingCanvas) return;

  drawingContext = drawingCanvas.getContext("2d");

  resizeDrawingCanvas();

  window.addEventListener("resize", () => {
    resizeDrawingCanvas();
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

function resizeDrawingCanvas() {
  if (!drawingCanvas || !drawingContext) return;

  const rect = drawingCanvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  drawingCanvas.width = rect.width * ratio;
  drawingCanvas.height = rect.height * ratio;

  drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);

  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";
  drawingContext.lineWidth = 3;
  drawingContext.strokeStyle = "#b76f6a";
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

    if (selectedPhotoName) {
      selectedPhotoName.textContent = "Henüz dosya seçilmedi";
    }

    setTemporaryStatus(photoStatus, "Fotoğraf başarıyla yüklendi. Çok teşekkür ederiz.", "success");
  });
}

function setupSelectedPhotoName() {
  if (!photoInput || !selectedPhotoName) return;

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) {
      selectedPhotoName.textContent = "Henüz dosya seçilmedi";
      return;
    }

    selectedPhotoName.textContent = file.name;
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