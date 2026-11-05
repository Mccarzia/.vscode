const pages = ["about", "education", "skills", "works", "contact"];
const storageKey = "my-little-book-portfolio-v2";
// Ganti PIN ini sebelum publikasi; autentikasi sisi klien tidak menggantikan login server.
const OPERATOR_PIN = "Euforia_life";
const coverScreen = document.querySelector("#coverScreen");
const portfolio = document.querySelector("#portfolio");
const toast = document.querySelector("#toast");
const editToggle = document.querySelector("#editToggle");
const operatorDialog = document.querySelector("#operatorDialog");
const operatorForm = document.querySelector("#operatorForm");
const operatorPin = document.querySelector("#operatorPin");
const pinMessage = document.querySelector("#pinMessage");
const instagramLink = document.querySelector("#instagramLink");
const instagramInput = document.querySelector("#instagramInput");
const pageContents = [...document.querySelectorAll("[data-content]")];
const pageLinks = [...document.querySelectorAll(".toc-link[data-page]")];
const nameInput = document.querySelector("#nameInput");
const nameEditor = document.querySelector(".name-editor");
const photoInput = document.querySelector("#photoInput");
const photoButton = document.querySelector(".photo-button");
const aboutPhotoButton = document.querySelector(".about-photo-button");
let currentPage = 0;
let editing = false;
let toastTimer;
let speechTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function readSavedData() {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return {};
    const data = JSON.parse(value);
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
    notify("Data tersimpan tidak valid; isi awal tetap digunakan.");
  } catch (error) {
    console.error("Data portofolio tidak dapat dibaca.", error);
    notify("Penyimpanan browser tidak tersedia; perubahan tidak tersimpan.");
  }
  return {};
}

const data = readSavedData();

function saveData(key, value) {
  data[key] = value;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error("Perubahan portofolio tidak dapat disimpan.", error);
    notify("Perubahan tampil, tetapi gagal disimpan di browser.");
  }
}

document.querySelectorAll("[data-editable]").forEach((element) => {
  const key = element.dataset.editable;
  if (Object.hasOwn(data, key)) {
    element.textContent = key === "name" && element.closest("#aboutTitle")
      ? `${data[key]}.`
      : data[key];
  }
  element.addEventListener("input", () => {
    const text = element.textContent ?? "";
    document.querySelectorAll(`[data-editable="${key}"]`).forEach((other) => {
      if (other !== element) other.textContent = text;
    });
    if (key === "name") document.querySelector("#nameInput").value = text;
    saveData(key, text);
    updateContactLinks();
  });
});

nameInput.value = typeof data.name === "string" ? data.name : "";
nameInput.addEventListener("input", () => {
  const enteredName = nameInput.value.trim();
  const displayName = enteredName || "Nama Kamu";
  document.querySelectorAll('[data-editable="name"]').forEach((element) => {
    element.textContent = element.closest("#aboutTitle") ? `${displayName}.` : displayName;
  });
  if (enteredName) saveData("name", enteredName);
  else {
    delete data.name;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Nama tidak dapat dihapus dari penyimpanan browser.", error);
      notify("Nama tampil kosong, tetapi perubahan gagal disimpan.");
    }
  }
});

function validWebUrl(value, acceptedHost) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (acceptedHost && !acceptedHost(url.hostname.toLowerCase())) return null;
    return url.href;
  } catch {
    return null;
  }
}

function applyInstagramUrl(value, persist = false) {
  const validUrl = validWebUrl(value.trim(), (host) => /(^|\.)instagram\.com$/.test(host));
  if (!validUrl) return false;
  instagramLink.href = validUrl;
  instagramInput.value = validUrl;
  if (persist) saveData("instagram-url", validUrl);
  return true;
}

if (typeof data["instagram-url"] === "string") {
  if (!applyInstagramUrl(data["instagram-url"])) notify("Tautan Instagram tersimpan tidak valid.");
}

function updateContactLinks() {
  const email = document.querySelector("#emailLink");
  const phone = document.querySelector("#phoneLink");
  const emailAddress = email.textContent.trim();
  const phoneNumber = phone.textContent.replace(/[^\d+]/g, "");
  email.href = `mailto:${emailAddress}`;
  phone.href = `tel:${phoneNumber}`;
}

updateContactLinks();

function setEditing(enabled) {
  editing = enabled;
  portfolio.classList.toggle("is-editing", enabled);
  editToggle.setAttribute("aria-pressed", String(enabled));
  document.querySelector("#editLabel").textContent = enabled ? "Keluar editor" : "Operator";
  document.querySelectorAll("[data-editable]").forEach((element) => {
    element.contentEditable = String(enabled);
    element.spellcheck = enabled;
  });
  nameEditor.hidden = !enabled;
  photoButton.hidden = !enabled;
  aboutPhotoButton.hidden = !enabled;
  photoInput.disabled = !enabled;
  instagramInput.hidden = !enabled;
  document.querySelectorAll("[data-work-url]").forEach((input) => {
    input.hidden = !enabled;
    if (enabled) input.value = document.querySelector(`[data-work-link="${input.dataset.workUrl}"]`).href;
  });
  if (!enabled) notify("Sesi operator berakhir. Portofolio kembali ke mode pengunjung.");
}

function showPage(index) {
  const previousPage = currentPage;
  currentPage = Math.max(0, Math.min(index, pages.length - 1));
  const selected = pages[currentPage];
  const direction = currentPage >= previousPage ? "forward" : "backward";
  pageContents.forEach((article) => {
    article.hidden = article.dataset.content !== selected;
    article.classList.remove("turn-forward", "turn-backward");
    if (article.dataset.content === selected) {
      article.classList.add(direction === "forward" ? "turn-forward" : "turn-backward");
    }
  });
  pageLinks.forEach((link) => {
    const isSelected = link.dataset.page === selected;
    link.classList.toggle("active", isSelected);
    if (isSelected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelector("#pageNumber").textContent =
    `${String(currentPage + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
  document.querySelector("#previousPage").disabled = currentPage === 0;
  document.querySelector("#nextPage").disabled = currentPage === pages.length - 1;
}

pageLinks.forEach((link) => {
  link.addEventListener("click", () => showPage(pages.indexOf(link.dataset.page)));
});

document.querySelector("#previousPage").addEventListener("click", () => showPage(currentPage - 1));
document.querySelector("#nextPage").addEventListener("click", () => showPage(currentPage + 1));
document.querySelector("#openBook").addEventListener("click", () => {
  coverScreen.hidden = true;
  portfolio.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.querySelector("#backToCover").addEventListener("click", () => {
  portfolio.hidden = true;
  coverScreen.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
editToggle.addEventListener("click", () => {
  if (editing) {
    setEditing(false);
    return;
  }
  pinMessage.textContent = "";
  operatorPin.value = "";
  operatorDialog.showModal();
  operatorPin.focus();
});

operatorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (operatorPin.value !== OPERATOR_PIN) {
    pinMessage.textContent = "PIN belum cocok. Coba periksa lalu masukkan lagi.";
    operatorPin.value = "";
    operatorPin.focus();
    return;
  }
  operatorDialog.close();
  pinMessage.textContent = "";
  setEditing(true);
  editToggle.focus();
  notify("Mode operator aktif. Isi yang bisa diedit sudah ditandai.");
});

operatorPin.addEventListener("input", () => {
  pinMessage.textContent = "";
});

document.querySelector("#cancelOperator").addEventListener("click", () => {
  operatorDialog.close();
});

operatorDialog.addEventListener("click", (event) => {
  if (event.target === operatorDialog) operatorDialog.close();
});

instagramInput.addEventListener("change", () => {
  if (applyInstagramUrl(instagramInput.value, true)) {
    notify("Tautan Instagram berhasil diperbarui.");
  } else {
    notify("Masukkan URL Instagram yang valid.");
    instagramInput.value = instagramLink.href;
  }
});

document.querySelectorAll("[data-work-url]").forEach((input) => {
  const link = document.querySelector(`[data-work-link="${input.dataset.workUrl}"]`);
  const savedUrl = data[`work-url-${input.dataset.workUrl}`];
  const validSavedUrl = typeof savedUrl === "string" ? validWebUrl(savedUrl) : null;
  if (validSavedUrl) link.href = validSavedUrl;
  input.addEventListener("change", () => {
    const validUrl = validWebUrl(input.value.trim());
    if (!validUrl) {
      notify("Gunakan URL lengkap yang diawali https://");
      input.value = link.href;
      return;
    }
    link.href = validUrl;
    saveData(`work-url-${input.dataset.workUrl}`, validUrl);
    notify("Tautan karya berhasil disimpan.");
  });
});

document.querySelectorAll(".track").forEach((button) => {
  button.addEventListener("click", () => {
    const player = document.querySelector("#spotifyPlayer");
    const title = button.querySelector("[data-editable]").textContent.trim();
    player.src = `https://open.spotify.com/embed/track/${button.dataset.track}?utm_source=generator`;
    player.title = `Pemutar Spotify: ${title}`;
    document.querySelectorAll(".track").forEach((track) => {
      const selected = track === button;
      track.classList.toggle("selected", selected);
      track.setAttribute("aria-pressed", String(selected));
      track.setAttribute(
        "aria-label",
        `Putar ${track.querySelector("[data-editable]").textContent.trim()} di player`,
      );
    });
  });
});

const profileImage = document.querySelector("#profileImage");
const profilePlaceholder = document.querySelector("#profilePlaceholder");
const aboutProfileImage = document.querySelector("#aboutProfileImage");
const aboutProfilePlaceholder = document.querySelector("#aboutProfilePlaceholder");

function showProfilePhoto(source) {
  profileImage.src = source;
  profileImage.hidden = false;
  profilePlaceholder.hidden = true;
  aboutProfileImage.src = source;
  aboutProfileImage.hidden = false;
  aboutProfilePlaceholder.hidden = true;
}

if (typeof data["profile-photo"] === "string" && data["profile-photo"].startsWith("data:image/")) {
  showProfilePhoto(data["profile-photo"]);
}

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    notify("Pilih file gambar untuk foto profil.");
    photoInput.value = "";
    return;
  }
  const image = new Image();
  image.addEventListener("load", () => {
    const ratio = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) {
      notify("Browser tidak dapat memproses gambar ini.");
      URL.revokeObjectURL(image.src);
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.82);
    showProfilePhoto(photo);
    saveData("profile-photo", photo);
    notify("Foto profil berhasil diperbarui.");
    URL.revokeObjectURL(image.src);
  });
  image.addEventListener("error", () => {
    notify("Foto tidak dapat dibuka. Coba gambar lain.");
    URL.revokeObjectURL(image.src);
  });
  image.src = URL.createObjectURL(file);
});

const messages = [
  "Hai! Senang kamu mampir ✿",
  "Pelan-pelan, kamu tetap bertumbuh ♡",
  "Karya kecil juga layak dirayakan!",
  "Jangan lupa istirahat sebentar ✧",
  "Semoga harimu menyenangkan!",
];
const pixelPal = document.querySelector("#pixelPal");
const speech = document.querySelector("#speech");

document.querySelectorAll(".track [data-editable]").forEach((label) => {
  label.addEventListener("click", (event) => {
    if (editing) event.stopPropagation();
  });
});

document.querySelector("#pixelButton").addEventListener("click", () => {
  speech.textContent = messages[Math.floor(Math.random() * messages.length)];
  pixelPal.classList.add("show");
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => pixelPal.classList.remove("show"), 2800);
});

document.addEventListener("keydown", (event) => {
  if (portfolio.hidden || editing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.matches("input, textarea, [contenteditable='true']")) return;
  if (event.key === "ArrowLeft") showPage(currentPage - 1);
  if (event.key === "ArrowRight") showPage(currentPage + 1);
});

showPage(0);

const book = document.querySelector("#book");
const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)");
if (canTilt.matches) {
  book.addEventListener("pointermove", (event) => {
    const bounds = book.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    book.style.setProperty("--tilt-x", `${-y * 2}deg`);
    book.style.setProperty("--tilt-y", `${x * 2}deg`);
    book.classList.add("is-tilting");
  });
  book.addEventListener("pointerleave", () => book.classList.remove("is-tilting"));
}

const book = document.querySelector("#book");
const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)");
if (canTilt.matches) {
  book.addEventListener("pointermove", (event) => {
    const bounds = book.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    book.style.setProperty("--tilt-x", `${-y * 2}deg`);
    book.style.setProperty("--tilt-y", `${x * 2}deg`);
    book.classList.add("is-tilting");
  });
  book.addEventListener("pointerleave", () => book.classList.remove("is-tilting"));
}