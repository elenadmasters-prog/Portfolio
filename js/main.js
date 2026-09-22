(function () {
  const data = window.SITE_DATA;
  if (!data) return;

  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  const filtersEl = document.getElementById("filters");
  const worksEl = document.getElementById("works");
  const modal = document.getElementById("modal");
  const form = document.querySelector(".form");
  const thanks = document.querySelector(".form__thanks");
  const formError = document.querySelector(".form__error");
  let lastFocus = null;
  let currentFilter = "Все";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.classList.toggle("is-open", open);
  }

  burger.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 980) setMenu(false);
  });

  data.services.forEach(function (service) {
    const card = el("article", "service");
    card.append(
      el("p", "service__index", service.index),
      el("h3", null, service.title),
      el("p", "service__lead", service.lead)
    );
    const list = el("ul");
    service.points.forEach(function (point) {
      list.append(el("li", null, point));
    });
    card.append(list, el("p", "service__note", service.note));
    document.getElementById("services-grid").append(card);
  });

  data.filters.forEach(function (name) {
    const button = el("button", null, name);
    button.type = "button";
    button.dataset.filter = name;
    button.setAttribute("aria-pressed", name === "Все" ? "true" : "false");
    filtersEl.append(button);
  });

  data.projects.forEach(function (project) {
    const button = el("button", "work");
    button.type = "button";
    button.dataset.id = project.id;
    button.dataset.category = project.category;
    const media = el("span", "work__media");
    const image = document.createElement("img");
    image.src = project.image;
    image.alt = project.title;
    image.width = 1600;
    image.height = 1200;
    media.append(image);
    button.append(
      media,
      el("span", "work__cat", project.category),
      el("span", "work__title", project.title),
      el("span", "work__text", project.summary)
    );
    worksEl.append(button);
  });

  function applyFilter() {
    worksEl.querySelectorAll(".work").forEach(function (card) {
      const visible = currentFilter === "Все" || card.dataset.category === currentFilter;
      card.classList.toggle("is-hidden", !visible);
    });
  }

  filtersEl.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    currentFilter = button.dataset.filter;
    filtersEl.querySelectorAll("button").forEach(function (item) {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
    applyFilter();
  });

  data.stories.forEach(function (story) {
    const article = el("article", "story");
    article.append(el("h3", null, story.title), el("p", "story__text", story.text));
    const row = el("div", "story__row");
    story.frames.forEach(function (frame) {
      const figure = el("figure");
      const image = document.createElement("img");
      image.src = frame.src;
      image.alt = frame.alt;
      image.width = 1600;
      image.height = 1200;
      figure.append(image, el("figcaption", null, frame.label));
      row.append(figure);
    });
    article.append(row);
    document.getElementById("stories").append(article);
  });

  data.tools.forEach(function (tool) {
    const card = el("article", "tool");
    card.append(el("h3", null, tool.title), el("p", null, tool.text));
    document.getElementById("tools-grid").append(card);
  });

  data.steps.forEach(function (step) {
    const item = el("li");
    item.append(el("span", "process__n", step.n), el("h3", null, step.title), el("p", null, step.text));
    document.getElementById("process-list").append(item);
  });

  data.advantages.forEach(function (item) {
    const card = el("article", "trust__card");
    card.append(el("h3", null, item.title), el("p", null, item.text));
    document.getElementById("trust-grid").append(card);
  });

  const modalImage = modal.querySelector(".modal__image");
  const modalCategory = document.getElementById("modal-category");
  const modalTitle = document.getElementById("modal-title");
  const modalSummary = modal.querySelector(".modal__summary");
  const modalBlocks = modal.querySelector(".modal__blocks");
  const closeButton = modal.querySelector(".modal__close");

  function openModal(id) {
    const project = data.projects.find(function (item) { return item.id === id; });
    if (!project) return;
    modalImage.src = project.image;
    modalImage.alt = project.title;
    modalCategory.textContent = project.category;
    modalTitle.textContent = project.title;
    modalSummary.textContent = project.summary;
    modalBlocks.replaceChildren();
    [
      ["Задача", project.task],
      ["Идея", project.idea],
      ["Решение", project.solution],
      ["Результат", project.result]
    ].forEach(function (pair) {
      const block = el("div", "modal__block");
      block.append(el("p", "modal__label", pair[0]), el("p", null, pair[1]));
      modalBlocks.append(block);
    });
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }

  worksEl.addEventListener("click", function (event) {
    const card = event.target.closest(".work");
    if (!card) return;
    openModal(card.dataset.id);
  });

  modal.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    setMenu(false);
    closeModal();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const valid = ["name", "contact", "message"].every(function (name) {
      return form.elements[name].value.trim().length > 0;
    });
    formError.hidden = valid;
    if (!valid) return;
    form.reset();
    form.hidden = true;
    thanks.hidden = false;
  });

  const links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  const sections = links
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);
  const hero = document.querySelector(".hero");
  if (hero) sections.push(hero);

  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(".reveal").forEach(function (node) { reveal.observe(node); });

    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach(function (section) { spy.observe(section); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (node) { node.classList.add("is-in"); });
  }
})();
