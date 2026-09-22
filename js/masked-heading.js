(function () {
  const clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v;
  };

  const num = function (value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const SVG_NS = "http://www.w3.org/2000/svg";

  function mount(root) {
    const text = (root.textContent || "").replace(/\s+/g, " ").trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return;

    const settings = {
      fillScale: num(root.dataset.fillScale, 1.25),
      parallax: num(root.dataset.parallax, 26),
      drift: num(root.dataset.drift, 18),
      brightness: num(root.dataset.brightness, 1),
      saturation: num(root.dataset.saturation, 1),
      grayscale: root.dataset.grayscale === "true",
      textScale: num(root.dataset.textScale, 0.115)
    };
    const reveal = root.dataset.reveal || "rise";
    const duration = num(root.dataset.duration, 1.1);
    const stagger = num(root.dataset.stagger, 0.09);
    const trigger = root.dataset.trigger || "view";
    const src = root.dataset.src || "";
    const poster = root.dataset.poster || "";
    const mediaType = root.dataset.mediaType || "image";

    root.classList.add("masked-heading");
    root.style.textAlign = root.dataset.align || "center";
    root.style.fontWeight = root.dataset.weight || "700";
    root.style.letterSpacing = num(root.dataset.tracking, -0.03) + "em";
    root.style.lineHeight = root.dataset.lineHeight || "1.06";
    root.textContent = "";

    const wordRefs = [];
    const baseRefs = [];
    const glyphRefs = [];
    const offset = { x: 0, y: 0, tx: 0, ty: 0 };
    const clipId = "mh-" + Math.random().toString(36).slice(2, 10);

    const measure = document.createElement("span");
    measure.className = "masked-heading__measure";
    words.forEach(function (word) {
      const box = document.createElement("span");
      box.className = "masked-heading__word";
      box.append(document.createTextNode(word));
      const base = document.createElement("i");
      base.className = "masked-heading__baseline";
      box.append(base);
      measure.append(box);
      wordRefs.push(box);
      baseRefs.push(base);
    });

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "masked-heading__defs");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const defs = document.createElementNS(SVG_NS, "defs");
    const clip = document.createElementNS(SVG_NS, "clipPath");
    clip.setAttribute("id", clipId);
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    words.forEach(function (word) {
      const glyph = document.createElementNS(SVG_NS, "text");
      glyph.textContent = word;
      clip.append(glyph);
      glyphRefs.push(glyph);
    });
    defs.append(clip);
    svg.append(defs);

    const revealLayer = document.createElement("span");
    revealLayer.className = "masked-heading__reveal";
    const clipBox = document.createElement("span");
    clipBox.className = "masked-heading__clip";
    clipBox.style.clipPath = "url(#" + clipId + ")";
    const media = document.createElement("span");
    media.className = "masked-heading__media";
    const source = mediaType === "video" ? document.createElement("video") : document.createElement("img");
    source.className = "masked-heading__source";
    if (mediaType === "video") {
      source.src = src;
      source.poster = poster;
      source.autoplay = true;
      source.muted = true;
      source.loop = true;
      source.playsInline = true;
    } else {
      source.src = src;
      source.alt = "";
      source.draggable = false;
    }
    media.append(source);
    clipBox.append(media);
    revealLayer.append(clipBox);
    root.append(measure, svg, revealLayer);

    function place() {
      const width = root.clientWidth;
      const height = root.clientHeight;
      const maxX = Math.max(0, ((settings.fillScale - 1) / 2) * width);
      const maxY = Math.max(0, ((settings.fillScale - 1) / 2) * height);
      media.style.transform = "translate3d(" + clamp(offset.x, -maxX, maxX).toFixed(2) + "px, " + clamp(offset.y, -maxY, maxY).toFixed(2) + "px, 0) scale(" + settings.fillScale + ")";
      media.style.filter = "brightness(" + settings.brightness + ") saturate(" + settings.saturation + ")" + (settings.grayscale ? " grayscale(1)" : "");
    }

    function sync() {
      root.style.fontSize = clamp(root.clientWidth * settings.textScale, 20, 200).toFixed(1) + "px";
      const computed = window.getComputedStyle(measure);
      wordRefs.forEach(function (box, index) {
        const base = baseRefs[index];
        const glyph = glyphRefs[index];
        if (!box || !base || !glyph) return;
        glyph.setAttribute("x", String(box.offsetLeft));
        glyph.setAttribute("y", String(base.offsetTop));
        glyph.style.fontFamily = computed.fontFamily;
        glyph.style.fontSize = computed.fontSize;
        glyph.style.fontWeight = computed.fontWeight;
        glyph.style.fontStyle = computed.fontStyle;
        glyph.style.letterSpacing = computed.letterSpacing;
      });
      place();
    }

    const resize = new ResizeObserver(sync);
    resize.observe(root);

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = function (now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const dx = Math.sin(clock * 0.21) * settings.drift;
      const dy = Math.cos(clock * 0.17) * settings.drift * 0.6;
      const ease = 1 - Math.exp(-dt / 0.18);
      offset.x += (offset.tx + dx - offset.x) * ease;
      offset.y += (offset.ty + dy - offset.y) * ease;
      place();
      raf = requestAnimationFrame(frame);
    };

    const onMove = function (event) {
      if (settings.parallax <= 0) return;
      const rect = root.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      const ny = ((event.clientY - rect.top) / (rect.height || 1)) * 2 - 1;
      offset.tx = clamp(nx, -1, 1) * -settings.parallax;
      offset.ty = clamp(ny, -1, 1) * -settings.parallax;
    };
    const onLeave = function () {
      offset.tx = 0;
      offset.ty = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);

    let tween = null;
    function setupReveal() {
      const glyphs = glyphRefs.filter(Boolean);
      if (!glyphs.length || !window.gsap) return;
      const gsap = window.gsap;
      const riseDistance = function () {
        return (parseFloat(window.getComputedStyle(root).fontSize) || 48) * 1.15;
      };
      const settle = function () {
        gsap.set(glyphs, { y: 0 });
        gsap.set(revealLayer, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" });
      };
      const rest = function () {
        if (reveal === "rise") gsap.set(glyphs, { y: riseDistance() });
        else if (reveal === "wipe") gsap.set(revealLayer, { clipPath: "inset(0% 100% 0% 0%)" });
        else if (reveal === "fade") gsap.set(revealLayer, { opacity: 0, scale: 1.08 });
      };
      const play = function () {
        if (tween) tween.kill();
        if (reveal === "rise") {
          gsap.set(revealLayer, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" });
          tween = gsap.fromTo(glyphs, { y: riseDistance() }, { y: 0, duration: duration, stagger: stagger, ease: "power4.out", overwrite: "auto" });
        } else if (reveal === "wipe") {
          gsap.set(glyphs, { y: 0 });
          const state = { p: 100 };
          tween = gsap.to(state, {
            p: 0,
            duration: duration,
            ease: "power3.inOut",
            overwrite: "auto",
            onUpdate: function () {
              revealLayer.style.clipPath = "inset(0% " + state.p + "% 0% 0%)";
            }
          });
        } else if (reveal === "fade") {
          gsap.set(glyphs, { y: 0 });
          tween = gsap.fromTo(revealLayer, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: duration, ease: "power3.out", overwrite: "auto" });
        }
      };

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reveal === "none" || reduce) {
        settle();
        return;
      }
      if (trigger === "hover") {
        settle();
        root.addEventListener("pointerenter", play);
        return;
      }
      if (trigger === "view") {
        settle();
        rest();
        const observer = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) {
            play();
            observer.disconnect();
          }
        }, { threshold: 0.25 });
        observer.observe(root);
        return;
      }
      play();
    }

    sync();
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      sync();
      setupReveal();
    }).catch(function () {
      sync();
      setupReveal();
    });
  }

  document.querySelectorAll("[data-masked-heading]").forEach(mount);
})();
