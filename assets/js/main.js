// Inline photos fallback (used when fetch() is blocked, e.g. opening file:// locally)
  
    document.getElementById('year').textContent = new Date().getFullYear();

    /* ---------- ACTIVE NAV HIGHLIGHT ---------- */
    const navHeight = 72;
    const links = [...document.querySelectorAll(".navlink")];
    const sectionIds = ["home","journey","rides","videos","gallery","contact"];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    function setActive(id){
      links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
    }

    function updateActive(){
      const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 2);
      if(atBottom){ setActive("contact"); return; }

      const y = window.scrollY + navHeight + 14;
      let current = "home";
      for(const sec of sections){
        if(sec.offsetTop <= y) current = sec.id;
      }
      setActive(current);
    }
    window.addEventListener("scroll", updateActive, { passive:true });
    window.addEventListener("load", updateActive);

   /* ---------- SCROLL REVEAL (stagger) ---------- */
const revealEls = document.querySelectorAll(".reveal");
revealEls.forEach((el, i) => {
  el.style.setProperty("--d", (i % 12) * 25 + "ms"); // stagger delay
});

const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) e.target.classList.add("show");
  });
}, { threshold: 0.12 });

revealEls.forEach(el => obs.observe(el));


    /* ---------- HERO PARALLAX ---------- */
    const home = document.getElementById("home");
    let ticking = false;
    function onScroll(){
      if(ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = home.offsetHeight || 1;
        const withinHero = Math.min(Math.max(y / h, 0), 1);
        const pos = 50 + withinHero * 10;
        home.style.setProperty("--heroY", pos + "%");
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive:true });

    /* ---------- PREMIUM TILT ---------- */
    const tiltEls = document.querySelectorAll(".tilt-card");
    const supportsHover = matchMedia("(hover:hover) and (pointer:fine)").matches;

    function setVars(el, xPct, yPct){
      el.style.setProperty("--mx", xPct + "%");
      el.style.setProperty("--my", yPct + "%");
    }

    function applyTilt(el, e){
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      setVars(el, mx, my);

      const dx = (e.clientX - (rect.left + rect.width/2)) / (rect.width/2);
      const dy = (e.clientY - (rect.top + rect.height/2)) / (rect.height/2);
      const max = 8;

      el.style.transform = `translateY(-6px) rotateX(${(-dy*max).toFixed(2)}deg) rotateY(${(dx*max).toFixed(2)}deg)`;
    }

    function resetTilt(el){
      el.style.transform = "";
      setVars(el, 50, 50);
    }

    if(supportsHover){
      tiltEls.forEach(el => {
        setVars(el, 50, 50);
        el.addEventListener("mousemove", (e) => applyTilt(el, e));
        el.addEventListener("mouseleave", () => resetTilt(el));
      });
    }

    /* ---------- GALLERY LIGHTBOX + SWIPE (dynamic) ---------- */
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const closeBtn = document.getElementById("closeBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const galleryContainer = document.getElementById('galleryGrid');
    let galleryItems = [];
    let currentIndex = 0;

    function escapeHtml(s){
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
    }

/* ---------- LIGHTBOX ZOOM ---------- */
if(lightbox && lightboxImg){
  lightboxImg.addEventListener("click", (e) => {
    e.stopPropagation(); // don't close lightbox
    lightbox.classList.toggle("zoom");
  });
}




    async function loadGallery(){
      if(!galleryContainer) return;
      const candidates = [
        'assets/images/photos.json',
        './assets/images/photos.json',
        'assets/photos.json',
        './assets/photos.json'
      ].map(p => new URL(p, location.href).href);

      let photos = null;
      let lastError = null;

      for(const url of candidates){
        try{
          console.debug('Trying gallery JSON URL:', url);
          const res = await fetch(url);
          if(!res.ok){
            lastError = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
            continue;
          }

          
          // allow both formats:
// 1) old: [ {...}, {...} ]
// 2) new CMS: { photos: [ {...} ] }
if (photos && !Array.isArray(photos) && Array.isArray(photos.photos)) {
  photos = photos.photos;
}

          console.debug('Loaded gallery JSON from', url);
          break;
        }catch(err){
          lastError = err;
        }
      }

      if(!photos){
        // fallback to inline data when available (works for file:// opens)
        if(window.__PHOTOS_DATA__ && Array.isArray(window.__PHOTOS_DATA__) && window.__PHOTOS_DATA__.length){
          console.debug('Using inline __PHOTOS_DATA__ fallback for gallery');
          photos = window.__PHOTOS_DATA__;
        }
      }

      if(!photos){
        // show an on-page error so users on GitHub Pages can see it without DevTools
        const errMsg = lastError ? lastError.message : 'Unknown error fetching gallery JSON';
        console.error('Gallery load failed:', errMsg);
        galleryContainer.innerHTML = `<div style="padding:18px;border-radius:12px;background:rgba(255,60,60,0.06);border:1px solid rgba(255,60,60,0.12);color:#FFDADA;">`+
          `<strong>Gallery failed to load</strong><div style="font-size:13px;margin-top:8px;">${escapeHtml(errMsg)}</div>`+
          `<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.8);">Tried URLs:<ul style=\"margin:6px 0 0 18px;\">${candidates.map(u=>`<li>${escapeHtml(u)}</li>`).join('')}</ul></div>`+
        `</div>`;
        return;
      }
        galleryContainer.innerHTML = photos.map((p,i) => (
          `<div class="g-item tilt-card" data-caption="${escapeHtml(p.caption||'')}">`+
            `<img src="${escapeHtml(p.src||'')}" alt="${escapeHtml(p.caption||'Photo')}" loading="lazy" data-index="${i}">`+
            `<div class="g-cap">${escapeHtml(p.caption||'')}</div>`+
          `</div>`
        )).join('');

        // refresh galleryItems and attach handlers
        galleryItems = [...document.querySelectorAll('.g-item img')];
        galleryItems.forEach((img,i) => {
          img.addEventListener('click', () => openLightbox(i));
          img.style.cursor = 'pointer';
        });

        // initialize tilt on new elements (avoid duplicate listeners)
        if(supportsHover){
          const newTilts = document.querySelectorAll('.tilt-card');
          newTilts.forEach(el => {
            if(!el.dataset.tiltInited){
              setVars(el,50,50);
              el.addEventListener('mousemove', (e) => applyTilt(el,e));
              el.addEventListener('mouseleave', () => resetTilt(el));
              el.dataset.tiltInited = '1';
            }
          });
        }

      // render
      galleryContainer.innerHTML = photos.map((p,i) => (
        `<div class="g-item tilt-card" data-caption="${escapeHtml(p.caption||'')}">`+
          `<img src="${escapeHtml(p.src||'')}" alt="${escapeHtml(p.caption||'Photo')}" loading="lazy" data-index="${i}">`+
          `<div class="g-cap">${escapeHtml(p.caption||'')}</div>`+
        `</div>`
      )).join('');

      // refresh galleryItems and attach handlers
      galleryItems = [...document.querySelectorAll('.g-item img')];
      galleryItems.forEach((img,i) => {
        img.addEventListener('click', () => openLightbox(i));
        img.style.cursor = 'pointer';
      });

      // initialize tilt on new elements (avoid duplicate listeners)
      if(supportsHover){
        const newTilts = document.querySelectorAll('.tilt-card');
        newTilts.forEach(el => {
          if(!el.dataset.tiltInited){
            setVars(el,50,50);
            el.addEventListener('mousemove', (e) => applyTilt(el,e));
            el.addEventListener('mouseleave', () => resetTilt(el));
            el.dataset.tiltInited = '1';
          }
        });
      }
    }

    function openLightbox(index){
      currentIndex = index;
      const img = galleryItems[currentIndex];
      const cap = img.closest('.g-item')?.dataset?.caption || img.alt || 'Photo';
      lightboxImg.src = img.src;
      lightboxTitle.textContent = cap;
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox(){
      lightbox.classList.remove('show');
      lightbox.classList.remove("zoom");
      document.body.style.overflow = '';
      lightboxImg.src = '';
    }

    function showPrev(){
      if(!galleryItems.length) return;
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      openLightbox(currentIndex);
    }
    function showNext(){
      if(!galleryItems.length) return;
      currentIndex = (currentIndex + 1) % galleryItems.length;
      openLightbox(currentIndex);
    }

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

    lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });

    window.addEventListener('keydown', (e) => {
      if(!lightbox.classList.contains('show')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') showPrev();
      if(e.key === 'ArrowRight') showNext();
    });

    // start load
    loadGallery();

    let touchX = 0;
    lightboxImg.addEventListener("touchstart", (e) => {
      touchX = e.touches[0].clientX;
    }, {passive:true});

    lightboxImg.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - touchX;
      if(Math.abs(diff) > 45){
        if(diff > 0) showPrev(); else showNext();
      }
    }, {passive:true});

    /* ---------- MOBILE MENU ---------- */
    const burger = document.getElementById("burger");
    const menuOverlay = document.getElementById("menuOverlay");
    const menuDrawer = document.getElementById("menuDrawer");
    const drawerClose = document.getElementById("drawerClose");
    const drawerLinks = [...document.querySelectorAll(".drawer-link")];

    function openMenu(){
      menuOverlay.classList.add("show");
      menuDrawer.classList.add("show");
      burger.setAttribute("aria-expanded", "true");
      menuOverlay.setAttribute("aria-hidden", "false");
      menuDrawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMenu(){
      menuOverlay.classList.remove("show");
      menuDrawer.classList.remove("show");
      burger.setAttribute("aria-expanded", "false");
      menuOverlay.setAttribute("aria-hidden", "true");
      menuDrawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    burger.addEventListener("click", () => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      if(isOpen) closeMenu(); else openMenu();
    });

    drawerClose.addEventListener("click", closeMenu);
    menuOverlay.addEventListener("click", closeMenu);

    drawerLinks.forEach(a => a.addEventListener("click", closeMenu));

    window.addEventListener("keydown", (e) => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      if(isOpen && e.key === "Escape") closeMenu();
    });


    /* ---------- BACK TO TOP ---------- */
const toTopBtn = document.getElementById("toTop");

function toggleToTop(){
  if(!toTopBtn) return;
  const y = window.scrollY || document.documentElement.scrollTop;
  toTopBtn.classList.toggle("show", y > 500);
}

if(toTopBtn){
  window.addEventListener("scroll", toggleToTop, { passive:true });
  window.addEventListener("load", toggleToTop);

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


    window.addEventListener("load", () => document.body.classList.add("page-ready"));
