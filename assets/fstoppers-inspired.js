const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = document.querySelectorAll(".feed-tabs button");
const stories = document.querySelectorAll(".story-card");
const searchInput = document.querySelector(".site-search input");

navToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

function applyFilters() {
  const active = document.querySelector(".feed-tabs button.active")?.dataset.filter || "all";
  const query = searchInput?.value.trim().toLowerCase() || "";

  stories.forEach((story) => {
    const category = story.dataset.category || "";
    const searchable = story.dataset.search || "";
    const categoryMatch = active === "all" || category === active;
    const searchMatch = !query || searchable.includes(query);
    story.classList.toggle("is-hidden", !(categoryMatch && searchMatch));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

document.querySelectorAll(".community-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".community-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});
