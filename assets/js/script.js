const urlParams = new URLSearchParams(window.location.search);
const WEDDING_SLUG = urlParams.get("wedding") || "ayse-mert";

let weddingData = null;
let currentWeddingId = null;

let drawingCanvas = null;
let drawingContext = null;
let isDrawing = false;
let hasDrawing = false;

let heroLottie = null;
let isMusicPlaying = false;

const introScreen = document.getElementById("introScreen");
const introVideo = document.getElementById("introVideo");
const skipIntroBtn = document.getElementById("skipIntroBtn");

const backgroundMusic = document.getElementById("backgroundMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");

const heroFloralAnimation = document.getElementById("heroFloralAnimation");

const introNames = document.getElementById("introNames");
const introDate = document.getElementById("introDate");
const coupleNames = document.getElementById("coupleNames");
const weddingDateText = document.getElementById("weddingDateText");
const heroInvitationText = document.getElementById("heroInvitationText");

const detailDate = document.getElementById("detailDate");
const detailTime = document.getElementById("detailTime");
const detailVenue = document.getElementById("detailVenue");
const detailAddress = document.getElementById("detailAddress");
const locationVenueText = document.getElementById("locationVenueText");
const mapButton = document.getElementById("mapButton");
const mapIframe = document.getElementById("mapIframe");

const finalTitle = document.getElementById("finalTitle");
const finalNames = document.getElementById("finalNames");
const memoryPhotos = document.getElementById("memoryPhotos");
const couplePortraitImage = document.getElementById("couplePortraitImage");

const messageForm = document.getElementById("messageForm");
const messageStatus = document.getElementById("messageStatus");
const clearDrawingBtn = document.getElementById("clearDrawingBtn");
const messageText = document.getElementById("messageText");
const messageCounter = document.getElementById("messageCounter");

const photoForm = document.getElementById("photoForm");
const photoStatus = document.getElementById("photoStatus");
const photoInput = document.getElementById("photoInput");
const selectedPhotoName = document.getElementById("selectedPhotoName");
const photoPreviewGrid = document.getElementById("photoPreviewGrid");

const uploadProgressWrap = document.querySelector(".upload-progress-wrap");
const uploadProgressText = document.getElementById("uploadProgressText");
const uploadProgressPercent = document.getElementById("uploadProgressPercent");
const uploadProgressBar = document.getElementById("uploadProgressBar");

const copyLinkBtn = document.getElementById("copyLinkBtn");
const whatsappShareBtn = document.getElementById("whatsappShareBtn");

document.addEventListener("DOMContentLoaded", async () => {
  setupVideoIntro();
  setupHeroAnimation();
  setupDrawingCanvas();
  setupMessageForm();
  setupPhotoForm();
  setupSelectedPhotoName();
  setupPhotoPreview();
  setupRevealSections();
  setupMusicControl();
  setupMessageCounter();
  setupShareButtons();

  await loadWeddingData();
});

/* VIDEO INTRO */

function setupVideoIntro() {
  document.body.classList.add("intro-active");

  if (!introScreen) {
    document.body.classList.remove("intro-active");
    document.body.classList.add("invitation-started");
    return;
  }

  let introClosed = false;
  let hardFallbackTimer = null;
  let durationFallbackTimer = null;

  function openInvitation() {
    if (introClosed) return;

    introClosed = true;

    if (hardFallbackTimer) clearTimeout(hardFallbackTimer);
    if (durationFallbackTimer) clearTimeout(durationFallbackTimer);

    if (introVideo) introVideo.pause();

    introScreen.classList.add("is-finished");
    document.body.classList.remove("intro-active");
    document.body.classList.add("invitation-started");

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });

    setTimeout(() => {
      introScreen.style.display = "none";
    }, 950);
  }

  if (skipIntroBtn) {
    skipIntroBtn.addEventListener("click", openInvitation);
  }

  if (!introVideo) {
    setTimeout(openInvitation, 1800);
    return;
  }

  introVideo.muted = true;
  introVideo.loop = false;
  introVideo.playsInline = true;

  introVideo.addEventListener("ended", openInvitation);

  introVideo.addEventListener("error", () => {
    console.warn("Intro video yüklenemedi. Davetiye açılıyor.");
    openInvitation();
  });

  introVideo.addEventListener("timeupdate", () => {
    const duration = introVideo.duration;
    const currentTime = introVideo.currentTime;

    if (!duration || Number.isNaN(duration)) return;

    if (currentTime >= duration - 0.25) {
      openInvitation();
    }
  });

  introVideo.addEventListener("loadedmetadata", () => {
    const duration = introVideo.duration;

    if (!duration || Number.isNaN(duration)) return;

    if (durationFallbackTimer) clearTimeout(durationFallbackTimer);

    durationFallbackTimer = setTimeout(() => {
      openInvitation();
    }, duration * 1000 + 700);
  });

  const playPromise = introVideo.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      console.warn("Video otomatik oynatılamadı. Buton ile geçiş yapılabilir.");
    });
  }

  hardFallbackTimer = setTimeout(() => {
    openInvitation();
  }, 12000);
}

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
    map_url: "https://www.google.com/maps/search/?api=1&query=Masal+Kır+Düğün+Salonu",
    map_embed_url: "",
    couple_photo_url: "assets/images/couple-photo.jpg",
    intro_video_url: "assets/videos/open-gate.mp4",
    music_url: "assets/audio/wedding-music.mp3",
    theme: "rose",
    memory_photos: []
  };

  renderWeddingData(fallbackData);
}

function renderWeddingData(data) {
  const names = `${data.bride_name || ""} & ${data.groom_name || ""}`;
  const formattedDate = formatDateTR(data.wedding_date);

  document.title = `${names} | Düğün Davetiyesi`;

  setText(introNames, names);
  setText(introDate, formattedDate);
  setText(coupleNames, names);
  setText(weddingDateText, formattedDate);
  setText(detailDate, formattedDate);
  setText(detailTime, data.wedding_time || "Saat bilgisi eklenecek");
  setText(detailVenue, data.venue_name || "Mekan bilgisi eklenecek");
  setText(detailAddress, data.venue_address || "Adres bilgisi eklenecek");
  setText(locationVenueText, data.venue_name || "Düğün Konumu");
  setText(finalNames, `Sevgiyle, ${names}`);

  if (data.couple_photo_url && couplePortraitImage) {
    couplePortraitImage.src = data.couple_photo_url;
  }

  if (data.intro_video_url && introVideo) {
    introVideo.src = data.intro_video_url;
  }

  if (data.music_url && backgroundMusic) {
    backgroundMusic.src = data.music_url;
  }

  if (data.map_url && mapButton) {
    mapButton.href = data.map_url;
  }

  if (data.map_embed_url && mapIframe) {
    mapIframe.src = data.map_embed_url;
  }

  applyTheme(data.theme);
  applyWeddingDateMode(data);
  renderMemoryPhotos(data);
  updateShareLinks(names);
}

function applyTheme(themeName) {
  const allowedThemes = ["rose", "gold", "green", "night"];
  const selectedTheme = allowedThemes.includes(themeName) ? themeName : "rose";

  document.body.classList.remove("theme-rose", "theme-gold", "theme-green", "theme-night");
  document.body.classList.add(`theme-${selectedTheme}`);
}

function applyWeddingDateMode(data) {
  if (!data.wedding_date) return;

  const now = new Date();
  const weddingDate = new Date(`${data.wedding_date}T23:59:59`);
  const isAfterWedding = now.getTime() > weddingDate.getTime();

  if (!isAfterWedding) return;

  if (heroInvitationText) {
    heroInvitationText.textContent =
      "Bu güzel günü bizimle paylaşacak olmanız, sevginiz ve iyi dilekleriniz bizim için çok kıymetli.";
  }

  if (finalTitle) {
    finalTitle.textContent =
      "Bu özel güne kattığınız sevgi, iyi dilekler ve anılar için teşekkür ederiz.";
  }
}

function renderMemoryPhotos(data) {
  if (!memoryPhotos) return;

  let photos = [];

  if (Array.isArray(data.memory_photos)) {
    photos = data.memory_photos;
  }

  if (typeof data.memory_photos === "string") {
    try {
      const parsed = JSON.parse(data.memory_photos);
      if (Array.isArray(parsed)) photos = parsed;
    } catch (error) {
      console.warn("memory_photos JSON okunamadı:", error);
    }
  }

  if (!photos.length) return;

  const labels = ["İlk Anılar", "Güzel Günler", "Birlikte", "Sonsuza Dek"];

  memoryPhotos.innerHTML = photos.slice(0, 4).map((photo, index) => {
    const imageUrl = typeof photo === "string" ? photo : photo.url;
    const label = typeof photo === "object" && photo.label ? photo.label : labels[index] || "Anımız";

    return `
      <article class="memory-card memory-card-${index + 1}">
        <span class="photo-pin"></span>
        <figure>
          <img src="${escapeHtml(imageUrl)}" alt="Gelin ve damat anı fotoğrafı" />
        </figure>
        <p>${escapeHtml(label)}</p>
      </article>
    `;
  }).join("");
}

/* MUSIC */

function setupMusicControl() {
  if (!musicToggleBtn || !backgroundMusic) return;

  musicToggleBtn.addEventListener("click", async () => {
    try {
      if (isMusicPlaying) {
        backgroundMusic.pause();
        isMusicPlaying = false;
        musicToggleBtn.classList.remove("is-playing");
        musicToggleBtn.textContent = "♪";
        return;
      }

      await backgroundMusic.play();
      isMusicPlaying = true;
      musicToggleBtn.classList.add("is-playing");
      musicToggleBtn.textContent = "Ⅱ";
    } catch (error) {
      console.warn("Müzik başlatılamadı:", error);
    }
  });
}

/* SHARE */

function setupShareButtons() {
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyLinkBtn.textContent = "Kopyalandı";
        setTimeout(() => {
          copyLinkBtn.textContent = "Linki Kopyala";
        }, 1800);
      } catch (error) {
        console.warn("Link kopyalanamadı:", error);
      }
    });
  }

  updateShareLinks("Düğün Davetiyesi");
}

function updateShareLinks(names) {
  if (!whatsappShareBtn) return;

  const message = `${names} düğün davetiyesi: ${window.location.href}`;
  whatsappShareBtn.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
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

  window.addEventListener("resize", resizeDrawingCanvas);

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

function setupMessageCounter() {
  if (!messageText || !messageCounter) return;

  messageText.addEventListener("input", () => {
    messageCounter.textContent = `${messageText.value.length} / 500`;
  });
}

function setupMessageForm() {
  if (!messageForm) return;

  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const honeypot = document.getElementById("messageWebsite");
    if (honeypot && honeypot.value.trim()) return;

    if (isRateLimited("messageSubmitTime", 30)) {
      setTemporaryStatus(messageStatus, "Lütfen tekrar göndermeden önce biraz bekleyin.", "error");
      return;
    }

    if (typeof supabaseClient === "undefined") {
      setTemporaryStatus(messageStatus, "Supabase bağlantısı bulunamadı. Config dosyasını kontrol edin.", "error");
      return;
    }

    if (!currentWeddingId) {
      setTemporaryStatus(messageStatus, "Düğün bilgisi yüklenemedi. Lütfen Supabase kaydını kontrol edin.", "error");
      return;
    }

    const guestName = document.getElementById("guestName").value.trim();
    const messageValue = document.getElementById("messageText").value.trim();

    if (!guestName) {
      setTemporaryStatus(messageStatus, "Lütfen adınızı yazın.", "error");
      return;
    }

    if (!messageValue && !hasDrawing) {
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
        message_text: messageValue,
        drawing_url: drawingUrl
      });

    setButtonLoading(messageForm, false);

    if (error) {
      console.error("Message insert error:", error);
      setTemporaryStatus(messageStatus, "Not gönderilirken bir hata oluştu.", "error");
      return;
    }

    localStorage.setItem("messageSubmitTime", String(Date.now()));

    messageForm.reset();
    clearDrawing();

    if (messageCounter) {
      messageCounter.textContent = "0 / 500";
    }

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

    const honeypot = document.getElementById("photoWebsite");
    if (honeypot && honeypot.value.trim()) return;

    if (isRateLimited("photoSubmitTime", 30)) {
      setTemporaryStatus(photoStatus, "Lütfen tekrar göndermeden önce biraz bekleyin.", "error");
      return;
    }

    if (typeof supabaseClient === "undefined") {
      setTemporaryStatus(photoStatus, "Supabase bağlantısı bulunamadı. Config dosyasını kontrol edin.", "error");
      return;
    }

    if (!currentWeddingId) {
      setTemporaryStatus(photoStatus, "Düğün bilgisi yüklenemedi. Lütfen Supabase kaydını kontrol edin.", "error");
      return;
    }

    const guestName = document.getElementById("photoGuestName").value.trim();
    const files = Array.from(photoInput.files || []);

    if (!guestName) {
      setTemporaryStatus(photoStatus, "Lütfen adınızı yazın.", "error");
      return;
    }

    if (!files.length) {
      setTemporaryStatus(photoStatus, "Lütfen en az bir fotoğraf seçin.", "error");
      return;
    }

    for (const file of files) {
      const validation = validatePhoto(file);

      if (!validation.valid) {
        setTemporaryStatus(photoStatus, validation.message, "error");
        return;
      }
    }

    setButtonLoading(photoForm, true);
    setTemporaryStatus(photoStatus, "Fotoğraflar hazırlanıyor...", "normal");
    setUploadProgress(0, "Fotoğraflar hazırlanıyor");

    let successCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      setUploadProgress(
        Math.round((index / files.length) * 100),
        `${index + 1} / ${files.length} hazırlanıyor`
      );

      const compressedFile = await compressImageFile(file);

      const uploadResult = await uploadPhotoFile(compressedFile, guestName);

      if (!uploadResult.success) {
        setButtonLoading(photoForm, false);
        setTemporaryStatus(photoStatus, uploadResult.message, "error");
        return;
      }

      successCount += 1;

      setUploadProgress(
        Math.round((successCount / files.length) * 100),
        `${successCount} / ${files.length} yüklendi`
      );
    }

    setButtonLoading(photoForm, false);

    localStorage.setItem("photoSubmitTime", String(Date.now()));

    photoForm.reset();
    clearPhotoPreview();

    if (selectedPhotoName) {
      selectedPhotoName.textContent = "Henüz dosya seçilmedi";
    }

    setTemporaryStatus(photoStatus, `${successCount} fotoğraf başarıyla yüklendi. Çok teşekkür ederiz.`, "success");

    setTimeout(() => {
      setUploadProgress(0, "Hazır", false);
    }, 2200);
  });
}

async function uploadPhotoFile(file, guestName) {
  const safeName = createSafeFileName(guestName || "guest");
  const extension = getFileExtension(file.name);
  const filePath = `${WEDDING_SLUG}/${Date.now()}-${safeName}-${createRandomId()}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("wedding-photos")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    console.error("Photo upload error:", uploadError);

    return {
      success: false,
      message: "Fotoğraf yüklenirken bir hata oluştu. Storage izinlerini kontrol edin."
    };
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

  if (insertError) {
    console.error("Photo database insert error:", insertError);

    return {
      success: false,
      message: "Fotoğraf yüklendi ama veritabanı kaydı oluşturulamadı."
    };
  }

  return {
    success: true,
    url: data.publicUrl
  };
}

function setupSelectedPhotoName() {
  if (!photoInput || !selectedPhotoName) return;

  photoInput.addEventListener("change", () => {
    const files = Array.from(photoInput.files || []);

    if (!files.length) {
      selectedPhotoName.textContent = "Henüz dosya seçilmedi";
      return;
    }

    if (files.length === 1) {
      selectedPhotoName.textContent = files[0].name;
      return;
    }

    selectedPhotoName.textContent = `${files.length} fotoğraf seçildi`;
  });
}

function setupPhotoPreview() {
  if (!photoInput || !photoPreviewGrid) return;

  photoInput.addEventListener("change", () => {
    clearPhotoPreview();

    const files = Array.from(photoInput.files || []);

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const previewUrl = URL.createObjectURL(file);

      const item = document.createElement("div");
      item.className = "photo-preview-item";

      const image = document.createElement("img");
      image.src = previewUrl;
      image.alt = file.name;

      image.onload = () => {
        URL.revokeObjectURL(previewUrl);
      };

      item.appendChild(image);
      photoPreviewGrid.appendChild(item);
    });
  });
}

function clearPhotoPreview() {
  if (!photoPreviewGrid) return;
  photoPreviewGrid.innerHTML = "";
}

function setUploadProgress(percent, text, visible = true) {
  if (!uploadProgressWrap || !uploadProgressText || !uploadProgressPercent || !uploadProgressBar) return;

  if (visible) {
    uploadProgressWrap.classList.add("is-visible");
  } else {
    uploadProgressWrap.classList.remove("is-visible");
  }

  uploadProgressText.textContent = text;
  uploadProgressPercent.textContent = `${percent}%`;
  uploadProgressBar.style.width = `${percent}%`;
}

function validatePhoto(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 20 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Sadece JPG, PNG veya WEBP görsel yükleyebilirsiniz."
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: "Her fotoğraf maksimum 20 MB olabilir. Sistem yüklemeden önce sıkıştırır."
    };
  }

  return {
    valid: true,
    message: ""
  };
}

async function compressImageFile(file) {
  if (!file.type.startsWith("image/")) return file;

  const imageBitmap = await createImageBitmap(file);

  const maxWidth = 1800;
  const maxHeight = 1800;

  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });

  if (!blob) return file;

  const safeOriginalName = file.name.replace(/\.[^/.]+$/, "");

  return new File(
    [blob],
    `${safeOriginalName}-compressed.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now()
    }
  );
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

function createRandomId() {
  return Math.random().toString(36).slice(2, 10);
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(element, value) {
  if (!element) return;
  element.textContent = value;
}

function isRateLimited(key, seconds) {
  const lastSubmitTime = Number(localStorage.getItem(key) || 0);

  if (!lastSubmitTime) return false;

  const diff = Date.now() - lastSubmitTime;

  return diff < seconds * 1000;
}