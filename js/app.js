const config = window.INVITATION_CONFIG || {};
const invitation = config.invitation || {};
const characters = config.characters || [];

const $ = (selector) => document.querySelector(selector);

const loader = $("#loader");
const enterButton = $("#enter-button");
const audio = $("#audio");
const musicToggle = $("#music-toggle");
const characterImage = $("#character-image");
const countdown = $("#countdown");
const countdownStatus = $("#countdown-status");

let characterIndex = 0;
let characterInterval = null;
let countdownInterval = null;
let hasEntered = false;

function setText(selector, value) {
  const element = $(selector);
  if (element && value !== undefined && value !== null) {
    element.textContent = value;
  }
}

function fitTextToContainer(element, maxSize, minSize = 28) {
  if (!element || !element.parentElement) return;

  const availableWidth = Math.max(180, element.parentElement.clientWidth - 24);
  let size = maxSize;
  element.style.fontSize = size + "px";

  while (element.scrollWidth > availableWidth && size > minSize) {
    size -= 1;
    element.style.fontSize = size + "px";
  }
}

function fitNameTitles() {
  fitTextToContainer($("#loader-title"), 88, 32);
  fitTextToContainer($("#guest-name"), 92, 34);
}

function populateInvitation() {
  document.title = `Invitación de ${invitation.name || "cumpleaños"}`;

  setText("#loader-title", invitation.name);
  setText("#guest-name", invitation.name);
  setText("#age-label", invitation.age ? `CUMPLE ${invitation.age} AÑOS` : "");
  setText("#invitation-message", invitation.message);
  setText("#event-date", invitation.dateLabel);
  setText("#event-time", invitation.timeLabel);
  setText("#event-venue", invitation.venue);
  setText("#event-address", invitation.address);
  setText("#dress-code", invitation.dressCode);

  const portrait = $("#portrait");
  if (portrait && invitation.name) portrait.alt = `Foto de ${invitation.name}`;

  const mapButton = $("#map-button");
  if (mapButton && invitation.mapUrl) mapButton.href = invitation.mapUrl;

  const whatsappButton = $("#whatsapp-button");
  if (whatsappButton) {
    if (invitation.whatsappNumber) {
      const whatsappText = encodeURIComponent(invitation.whatsappMessage || "");
      whatsappButton.href = `https://wa.me/${invitation.whatsappNumber}?text=${whatsappText}`;
      whatsappButton.target = "_blank";
      whatsappButton.rel = "noopener noreferrer";
      whatsappButton.removeAttribute("aria-disabled");
    } else {
      whatsappButton.removeAttribute("href");
      whatsappButton.removeAttribute("target");
      whatsappButton.removeAttribute("rel");
      whatsappButton.setAttribute("aria-disabled", "true");
    }
  }

  const instagramLink = $("#instagram-link");
  if (instagramLink) {
    if (invitation.instagramUrl) instagramLink.href = invitation.instagramUrl;
    if (invitation.instagramHandle) instagramLink.textContent = invitation.instagramHandle;
  }
}

function applyCharacter(character) {
  if (!characterImage) return;

  characterImage.style.width = character.width;
  characterImage.style.bottom = character.bottom;
  characterImage.style.left = character.left;
  characterImage.style.transform = `translate3d(${character.translateX}, 18px, 0) scale(1.04)`;
}

function showCharacter(index) {
  if (!characterImage || !characters.length) return;

  const character = characters[index];
  characterImage.classList.remove("is-visible");

  window.setTimeout(() => {
    applyCharacter(character);
    characterImage.src = character.src;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        characterImage.style.transform = `translate3d(${character.translateX}, 0, 0) scale(1)`;
        characterImage.classList.add("is-visible");
      });
    });
  }, 500);
}

function startCharacters() {
  if (!characters.length) return;

  showCharacter(characterIndex);

  if (characters.length > 1) {
    characterInterval = window.setInterval(() => {
      characterIndex = (characterIndex + 1) % characters.length;
      showCharacter(characterIndex);
    }, 6200);
  }
}

async function startAudio() {
  if (!audio) return;

  try {
    await audio.play();
  } catch (error) {
    // Algunos navegadores pueden requerir otra interacción.
  }

  updateMusicButton();
}

function updateMusicButton() {
  if (!audio || !musicToggle) return;

  const playing = !audio.paused;
  musicToggle.classList.toggle("is-playing", playing);
  musicToggle.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
  musicToggle.innerHTML = `<span class="music-toggle__icon" aria-hidden="true">${playing ? "♪" : "♫"}</span>`;
}

function enterInvitation() {
  if (hasEntered) return;

  hasEntered = true;
  document.body.classList.remove("is-locked");
  loader?.classList.add("is-leaving");

  if (musicToggle) musicToggle.hidden = false;
  startAudio();

  window.setTimeout(() => {
    if (loader?.isConnected) loader.remove();
  }, 550);
}

function toggleAudio() {
  if (!audio) return;

  if (audio.paused) startAudio();
  else audio.pause();

  updateMusicButton();
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -5% 0px"
  });

  elements.forEach((element) => observer.observe(element));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function setCountdownValues(days, hours, minutes, seconds) {
  setText("#countdown-days", pad(days));
  setText("#countdown-hours", pad(hours));
  setText("#countdown-minutes", pad(minutes));
  setText("#countdown-seconds", pad(seconds));
}

function finishCountdown(message, status = "") {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (countdown) {
    countdown.classList.add("is-finished");
    countdown.innerHTML = `<p class="countdown__finished-message">${message}</p>`;
  }

  if (countdownStatus) countdownStatus.textContent = status;
}

function updateCountdown() {
  if (!countdown || !countdownStatus) return;

  const start = new Date(invitation.eventDateTime).getTime();
  const end = new Date(invitation.eventEndDateTime).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    countdownStatus.textContent = "Revisá la fecha configurada en js/config.js.";
    return;
  }

  if (now >= end) {
    finishCountdown("¡Gracias por compartir este día!");
    return;
  }

  if (now >= start) {
    finishCountdown("¡Hoy es el gran día! 🖤", "La espera terminó.");
    return;
  }

  const totalSeconds = Math.max(0, Math.floor((start - now) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setCountdownValues(days, hours, minutes, seconds);

  if (days === 0) countdownStatus.textContent = "Ya falta menos de un día.";
  else if (days === 1) countdownStatus.textContent = "Falta solo 1 día.";
  else countdownStatus.textContent = `Faltan ${days} días para festejar juntos.`;
}

function startCountdown() {
  updateCountdown();

  if (!countdownInterval && !countdown?.classList.contains("is-finished")) {
    countdownInterval = window.setInterval(updateCountdown, 1000);
  }
}

function setupVisibilityAudio() {
  document.addEventListener("visibilitychange", () => {
    if (!hasEntered || !document.hidden || !audio) return;
    audio.pause();
    updateMusicButton();
  });
}

function init() {
  document.body.classList.add("is-locked");

  populateInvitation();
  startCharacters();
  startCountdown();
  setupRevealAnimations();
  setupVisibilityAudio();

  const runTextFit = () => fitNameTitles();

  if (document.fonts?.ready) {
    document.fonts.ready.then(runTextFit);
  } else {
    window.setTimeout(runTextFit, 150);
  }

  window.addEventListener("resize", runTextFit);

  enterButton?.addEventListener("click", enterInvitation);
  musicToggle?.addEventListener("click", toggleAudio);
  audio?.addEventListener("play", updateMusicButton);
  audio?.addEventListener("pause", updateMusicButton);
}

document.addEventListener("DOMContentLoaded", init);