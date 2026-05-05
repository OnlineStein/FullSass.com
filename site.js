const navItems = [
  { slug: "home", label: "Home", href: "index.html" },
  { slug: "results", label: "Results", href: "results.html" },
  { slug: "stuff", label: "Stuff", href: "stuff.html" },
  { slug: "private-events", label: "Private Events", href: "private-events.html" },
  { slug: "merch", label: "Merch", href: "merch.html" },
  { slug: "about-contact", label: "About + Contact", href: "about-contact.html" }
];

const page = document.body.dataset.page;
const shell = document.getElementById("site-shell");
const content = window.FULL_SASS_CONTENT;
const lightboxGroups = {};

function renderShell() {
  const navLinks = navItems
    .map((item) => {
      const active = item.slug === page ? ' class="is-active"' : "";
      return `<a${active} href="${item.href}">${item.label}</a>`;
    })
    .join("");

  shell.innerHTML = `
    <header class="site-header">
      <div class="layout topmark">
        <a class="brandmark" href="index.html" aria-label="${content.site.title} home">
          <img class="brandmark__logo" src="logo2020.jpg" alt="" />
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open navigation menu">
          <span class="nav-toggle__plus nav-toggle__plus--horizontal"></span>
          <span class="nav-toggle__plus nav-toggle__plus--vertical"></span>
        </button>
      </div>
      <nav id="site-nav" class="site-nav layout" aria-label="Primary navigation">
        ${navLinks}
      </nav>
    </header>
  `;

  const button = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  });
}

function wireSharedLinks() {
  const instagram = document.getElementById("home-instagram-link");
  const facebook = document.getElementById("home-facebook-link");
  const privateEventsEmail = document.getElementById("private-events-email-link");
  const aboutEmail = document.getElementById("about-email-link");

  if (instagram) {
    instagram.href = content.site.social.instagram;
  }

  if (facebook) {
    facebook.href = content.site.social.facebook;
  }

  if (privateEventsEmail) {
    privateEventsEmail.href = `mailto:${content.site.email}`;
    privateEventsEmail.textContent = content.site.email;
  }

  if (aboutEmail) {
    aboutEmail.href = `mailto:${content.site.email}`;
  }
}

function isDirectVideoSource(src = "") {
  return /\.(mp4|webm|ogg)$/i.test(src);
}

function getLinkLabel(item) {
  if (item.linkLabel) return item.linkLabel;

  try {
    const url = new URL(item.link);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

function mediaItem(item, options = {}) {
  if (item.type === "video" && isDirectVideoSource(item.src)) {
    return `
      <div class="media-card media-card--video media-card--video-file">
        <video controls preload="metadata">
          <source src="${item.src}" />
        </video>
      </div>
    `;
  }

  if (item.type === "video") {
    return `
      <div class="media-card media-card--video">
        <iframe
          src="${item.src}"
          title="${item.title || "Embedded video"}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  if (item.link) {
    return `
      <div class="media-card media-card--image media-card--linked">
        <a
          class="media-card__link"
          href="${item.link}"
          target="_blank"
          rel="noreferrer"
          aria-label="${item.alt || "Open linked image"}"
        >
          <img src="${item.src}" alt="${item.alt || ""}" />
        </a>
        <a class="media-card__external-link" href="${item.link}" target="_blank" rel="noreferrer">
          ${getLinkLabel(item)}
        </a>
      </div>
    `;
  }

  if (options.expandable) {
    return `
      <button
        class="media-card media-card--image media-zoom-trigger"
        type="button"
        data-full-src="${item.src}"
        data-full-alt="${item.alt || ""}"
        data-lightbox-group="${options.lightboxGroup || ""}"
        data-lightbox-index="${options.lightboxIndex ?? ""}"
        aria-label="Open larger image"
      >
        <img src="${item.src}" alt="${item.alt || ""}" />
      </button>
    `;
  }

  return `
    <figure class="media-card media-card--image">
      <img src="${item.src}" alt="${item.alt || ""}" />
    </figure>
  `;
}

function renderFeaturedCarousel(media, options = {}) {
  const lightboxGroup = options.lightboxGroup || "";
  let lightboxImageIndex = 0;
  const isSingleItem = media.length <= 1;

  return `
    <div
      class="featured-carousel${isSingleItem ? " featured-carousel--static" : ""}"
      data-carousel
      aria-label="${options.ariaLabel || "Media carousel"}"
    >
      ${
        isSingleItem
          ? ""
          : '<button class="carousel-clickzone carousel-clickzone--prev" type="button" data-carousel-prev aria-label="Previous media"></button>'
      }
      <div class="featured-carousel__viewport">
        <div class="featured-carousel__track" data-carousel-track>
          ${media
            .map((item) => {
              const markup =
                item.type === "image" && !item.link
                  ? mediaItem(item, {
                      expandable: true,
                      lightboxGroup,
                      lightboxIndex: lightboxImageIndex++
                    })
                  : mediaItem(item);

              return `
                <div class="featured-carousel__slide">
                  ${markup}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
      ${
        isSingleItem
          ? ""
          : `
      <button class="carousel-clickzone carousel-clickzone--next" type="button" data-carousel-next aria-label="Next media"></button>
      <button class="carousel-arrow carousel-arrow--prev" type="button" data-carousel-prev aria-label="Previous media">
        <span aria-hidden="true">&#8592;</span>
      </button>
      <button class="carousel-arrow carousel-arrow--next" type="button" data-carousel-next aria-label="Next media">
        <span aria-hidden="true">&#8594;</span>
      </button>
      <div class="carousel-footer">
        <p class="carousel-count" data-carousel-count>1 / ${media.length}</p>
      </div>`
      }
    </div>
  `;
}

function renderResults() {
  const root = document.getElementById("results-feed");
  if (!root) return;

  Object.keys(lightboxGroups).forEach((key) => delete lightboxGroups[key]);

  root.innerHTML = content.results
    .filter((entry) => entry.published)
    .map((entry, entryIndex) => {
      const lightboxGroup = `results-${entryIndex}`;
      const imageMedia = entry.media.filter((item) => item.type === "image");
      lightboxGroups[lightboxGroup] = imageMedia;

      return `
        <article class="feed-entry">
          <div class="entry-header">
            <p class="entry-date">${entry.week}</p>
            <h2>${entry.title}</h2>
            <p>${entry.intro}</p>
          </div>
          <div class="entry-grid">
            ${renderFeaturedCarousel(entry.media, {
              lightboxGroup,
              ariaLabel: "Weekly results media carousel"
            })}
            <div class="scoreboard-wrap">
              <div class="entry-notes">
                ${entry.notes.map((note) => `<p>${note}</p>`).join("")}
              </div>
            </div>
          </div>
        </article>
      `
    })
    .join("");
}

function renderStuff() {
  const root = document.getElementById("stuff-feed");
  if (!root) return;

  let publishedIndex = 0;
  root.innerHTML = content.stuff
    .filter((entry) => entry.published)
    .map((entry) => {
      const lightboxGroup = `stuff-${publishedIndex++}`;
      const imageMedia = entry.media.filter((item) => item.type === "image" && !item.link);
      lightboxGroups[lightboxGroup] = imageMedia;

      return `
        <article class="feed-entry feed-entry--stuff">
          <div class="entry-header">
            <p class="entry-date">${entry.date}</p>
            <h2>${entry.title}</h2>
            <p>${entry.body}</p>
          </div>
          <div class="entry-grid">
            ${renderFeaturedCarousel(entry.media, {
              lightboxGroup,
              ariaLabel: "Stuff page media carousel"
            })}
            <div class="scoreboard-wrap">
              <div class="entry-notes">
                ${(entry.notes || []).map((note) => `<p>${note}</p>`).join("")}
              </div>
            </div>
          </div>
        </article>
      `
    })
    .join("");
}

function renderPrivateEvents() {
  const gallery = document.getElementById("event-gallery");
  const testimonials = document.getElementById("testimonials-list");
  if (!gallery || !testimonials) return;

  const lightboxGroup = "private-events";
  const imageMedia = content.privateEvents.gallery.filter((item) => item.type === "image" && !item.link);
  lightboxGroups[lightboxGroup] = imageMedia;

  gallery.innerHTML = renderFeaturedCarousel(content.privateEvents.gallery, {
    lightboxGroup,
    ariaLabel: "Private events media carousel"
  });
  testimonials.innerHTML = content.privateEvents.testimonials
    .map(
      (item) => `
        <blockquote class="testimonial">
          <p>${item.quote}</p>
          <footer>${item.source}</footer>
        </blockquote>
      `
    )
    .join("");
}

function renderMerch() {
  const root = document.getElementById("merch-grid");
  if (!root) return;

  root.innerHTML = content.merch
    .map(
      (item) => `
        <article class="merch-card">
          <a href="${item.link}" target="_blank" rel="noreferrer">
            <img src="${item.image}" alt="${item.title}" />
          </a>
          <div class="merch-card__body">
            <h2>
              <a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a>
            </h2>
            <p>${item.description}</p>
            <a href="${item.link}" target="_blank" rel="noreferrer">View item</a>
          </div>
        </article>
      `
    )
    .join("");
}

function wireContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const details = formData.get("details");
    const subject = encodeURIComponent(`Private Event Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nDetails:\n${details}`);
    window.location.href = `mailto:${content.site.email}?subject=${subject}&body=${body}`;
  });
}

function wireImageLightbox() {
  if (document.getElementById("image-lightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.id = "image-lightbox";
  lightbox.className = "image-lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <button class="image-lightbox__backdrop" type="button" aria-label="Close image viewer"></button>
    <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Expanded image">
      <button class="image-lightbox__nav image-lightbox__nav--prev" type="button" aria-label="Previous image">
        <span aria-hidden="true">&#8592;</span>
      </button>
      <button class="image-lightbox__nav image-lightbox__nav--next" type="button" aria-label="Next image">
        <span aria-hidden="true">&#8594;</span>
      </button>
      <button class="image-lightbox__tapzone image-lightbox__tapzone--prev" type="button" aria-label="Previous image"></button>
      <button class="image-lightbox__tapzone image-lightbox__tapzone--next" type="button" aria-label="Next image"></button>
      <button class="image-lightbox__close" type="button" aria-label="Close image viewer">Close</button>
      <img class="image-lightbox__image" src="" alt="" />
    </div>
  `;

  document.body.appendChild(lightbox);

  const image = lightbox.querySelector(".image-lightbox__image");
  const prevButtons = lightbox.querySelectorAll(".image-lightbox__nav--prev, .image-lightbox__tapzone--prev");
  const nextButtons = lightbox.querySelectorAll(".image-lightbox__nav--next, .image-lightbox__tapzone--next");
  const closeButtons = lightbox.querySelectorAll(".image-lightbox__backdrop, .image-lightbox__close");
  const state = {
    group: null,
    index: 0
  };

  function renderLightboxImage() {
    const items = lightboxGroups[state.group] || [];
    const current = items[state.index];
    if (!current) return;

    image.src = current.src;
    image.alt = current.alt || "";
    const hasMultiple = items.length > 1;
    lightbox.querySelector(".image-lightbox__nav--prev").hidden = !hasMultiple;
    lightbox.querySelector(".image-lightbox__nav--next").hidden = !hasMultiple;
    lightbox.querySelector(".image-lightbox__tapzone--prev").hidden = !hasMultiple;
    lightbox.querySelector(".image-lightbox__tapzone--next").hidden = !hasMultiple;
  }

  function moveLightbox(step) {
    const items = lightboxGroups[state.group] || [];
    if (!items.length) return;
    state.index = (state.index + step + items.length) % items.length;
    renderLightboxImage();
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".media-zoom-trigger");
    if (!trigger) return;

    state.group = trigger.dataset.lightboxGroup || null;
    state.index = Number(trigger.dataset.lightboxIndex || 0);
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    renderLightboxImage();
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      lightbox.hidden = true;
      image.src = "";
      image.alt = "";
      document.body.classList.remove("lightbox-open");
    });
  });

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => moveLightbox(-1));
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => moveLightbox(1));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      lightbox.hidden = true;
      image.src = "";
      image.alt = "";
      document.body.classList.remove("lightbox-open");
    } else if (event.key === "ArrowLeft" && !lightbox.hidden) {
      moveLightbox(-1);
    } else if (event.key === "ArrowRight" && !lightbox.hidden) {
      moveLightbox(1);
    }
  });
}

function wireResultsCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const viewport = carousel.querySelector(".featured-carousel__viewport");
    const slides = Array.from(track.children);
    const count = carousel.querySelector("[data-carousel-count]");
    let index = 0;

    function syncCarousel() {
      track.style.transform = `translateX(-${index * 100}%)`;
      if (viewport && slides[index]) {
        viewport.style.height = `${slides[index].offsetHeight}px`;
      }
      if (count) {
        count.textContent = `${index + 1} / ${slides.length}`;
      }
    }

    function move(step) {
      index = (index + step + slides.length) % slides.length;
      syncCarousel();
    }

    slides.forEach((slide) => {
      slide.querySelectorAll("img").forEach((image) => {
        if (image.complete) return;
        image.addEventListener("load", syncCarousel, { once: true });
      });

      slide.querySelectorAll("video").forEach((video) => {
        video.addEventListener("loadedmetadata", syncCarousel, { once: true });
      });
    });

    if (slides.length <= 1) {
      if (count) {
        count.textContent = "1 / 1";
      }
      syncCarousel();
      requestAnimationFrame(syncCarousel);
      return;
    }

    carousel.querySelectorAll("[data-carousel-prev]").forEach((button) => {
      button.addEventListener("click", () => move(-1));
    });

    carousel.querySelectorAll("[data-carousel-next]").forEach((button) => {
      button.addEventListener("click", () => move(1));
    });

    syncCarousel();
    requestAnimationFrame(syncCarousel);
    window.addEventListener("resize", syncCarousel);
  });
}

renderShell();
wireSharedLinks();
renderResults();
renderStuff();
renderPrivateEvents();
renderMerch();
wireContactForm();
wireImageLightbox();
wireResultsCarousels();
