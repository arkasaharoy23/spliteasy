const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
const heroVisual = document.getElementById("heroVisual");
const currentYearEl = document.getElementById("currentYear");

function updateNavbarShadow() {
  if (window.scrollY > 8) {
    navbar.classList.add("is-scrolled");
  } else {
    navbar.classList.remove("is-scrolled");
  }
}

function toggleNav() {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeNavOnLinkClick(event) {
  if (event.target.tagName === "A") {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
}

function revealOnScroll() {
  const targets = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((target) => observer.observe(target));
}

function playHeroAnimation() {
  requestAnimationFrame(() => {
    heroVisual.classList.add("is-loaded");
  });
}

function setFooterYear() {
  currentYearEl.textContent = new Date().getFullYear();
}

window.addEventListener("scroll", updateNavbarShadow, { passive: true });
navToggle.addEventListener("click", toggleNav);
document.getElementById("navLinks").addEventListener("click", closeNavOnLinkClick);

document.addEventListener("DOMContentLoaded", () => {
  setFooterYear();
  revealOnScroll();
  playHeroAnimation();
});