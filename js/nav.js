document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header .nav");
  if (!header || header.querySelector(".menu-btn")) return;
  const links = header.querySelector("nav.links");
  if (!links) return;
  const btn = document.createElement("button");
  btn.className = "menu-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Menu");
  btn.textContent = "Menu";
  header.insertBefore(btn, links);
  btn.addEventListener("click", () => {
    links.classList.toggle("open");
    btn.textContent = links.classList.contains("open") ? "Close" : "Menu";
  });
});
