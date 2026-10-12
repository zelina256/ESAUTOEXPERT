(function () {
    "use strict";

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Footer year
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* ---------------------------------------------------------------------
       Navigation: scrolled state, progress bar, mobile menu, scrollspy
       --------------------------------------------------------------------- */
    var nav = $("#nav");
    var toggle = $(".nav__toggle");

    function onScroll() {
        var y = window.scrollY || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        nav.classList.toggle("is-scrolled", y > 24);
        nav.style.setProperty("--p", max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    $$(".nav__links a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 980) setMenu(false); });

    // Scrollspy (home page only)
    var spyLinks = $$('.nav__link[data-nav]').filter(function (a) { return a.getAttribute("href").charAt(0) === "#"; });
    if (spyLinks.length && "IntersectionObserver" in window) {
        var map = {};
        spyLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
        var targets = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    spyLinks.forEach(function (a) { a.classList.remove("is-active"); });
                    map[en.target.id].classList.add("is-active");
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        targets.forEach(function (t) { spy.observe(t); });
    }

    /* ---------------------------------------------------------------------
       Hero video: respect reduced motion and data saver
       --------------------------------------------------------------------- */
    var video = $(".hero__video");
    if (video) {
        var saveData = navigator.connection && navigator.connection.saveData;
        if (reduceMotion || saveData) {
            video.removeAttribute("autoplay");
            video.pause();
        }
    }

    /* ---------------------------------------------------------------------
       Makes marquee: duplicate the group so the loop is seamless
       --------------------------------------------------------------------- */
    var group = $("[data-marquee]");
    if (group) {
        var clone = group.cloneNode(true);
        clone.removeAttribute("data-marquee");
        clone.setAttribute("aria-hidden", "true");
        group.parentNode.appendChild(clone);
    }

    /* ---------------------------------------------------------------------
       Services: accessible tabs
       --------------------------------------------------------------------- */
    var tablist = $(".svc__tabs");
    if (tablist) {
        var tabs = $$('[role="tab"]', tablist);
        var panels = $$('[role="tabpanel"]');
        var scrollButtons = $$("[data-service-tabs]");

        var updateServiceScrollButtons = function () {
            var maxScroll = tablist.scrollWidth - tablist.clientWidth;
            scrollButtons.forEach(function (button) {
                var previous = button.getAttribute("data-service-tabs") === "previous";
                button.disabled = maxScroll <= 1 || (previous ? tablist.scrollLeft <= 1 : tablist.scrollLeft >= maxScroll - 1);
            });
        };

        var select = function (tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute("aria-selected", String(on));
                t.tabIndex = on ? 0 : -1;
            });
            panels.forEach(function (p) {
                var on = p.id === tab.getAttribute("aria-controls");
                p.classList.toggle("is-active", on);
                if (on) { p.removeAttribute("inert"); } else { p.setAttribute("inert", ""); }
            });
            if (focus) tab.focus();
            // keep the active pill in view on mobile
            if (tablist.scrollWidth > tablist.clientWidth) {
                tablist.scrollTo({
                    left: tab.offsetLeft - tablist.clientWidth / 2 + tab.offsetWidth / 2,
                    behavior: reduceMotion ? "auto" : "smooth"
                });
            }
            updateServiceScrollButtons();
        };

        scrollButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                var direction = button.getAttribute("data-service-tabs") === "next" ? 1 : -1;
                tablist.scrollBy({
                    left: direction * Math.max(tablist.clientWidth * .7, 200),
                    behavior: reduceMotion ? "auto" : "smooth"
                });
            });
        });
        tablist.addEventListener("scroll", updateServiceScrollButtons, { passive: true });
        window.addEventListener("resize", updateServiceScrollButtons);
        updateServiceScrollButtons();

        tabs.forEach(function (tab, i) {
            tab.addEventListener("click", function () { select(tab, false); });
            tab.addEventListener("keydown", function (e) {
                var next = null;
                if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
                if (e.key === "Home") next = tabs[0];
                if (e.key === "End") next = tabs[tabs.length - 1];
                if (next) { e.preventDefault(); select(next, true); }
            });
        });

        // "Ask about this service" pre-fills the quote form
        $$("[data-service]").forEach(function (a) {
            a.addEventListener("click", function () {
                var sel = $("#f-service");
                if (sel) sel.value = a.getAttribute("data-service");
            });
        });
    }

    /* ---------------------------------------------------------------------
       Work strip: arrows + mouse drag
       --------------------------------------------------------------------- */
    var strip = $("#strip");
    if (strip) {
        var step = function () { return Math.max(strip.clientWidth * 0.7, 280); };
        $$("[data-strip]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var dir = btn.getAttribute("data-strip") === "next" ? 1 : -1;
                strip.scrollBy({ left: dir * step(), behavior: reduceMotion ? "auto" : "smooth" });
            });
        });
        strip.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") { strip.scrollBy({ left: 240 }); e.preventDefault(); }
            if (e.key === "ArrowLeft") { strip.scrollBy({ left: -240 }); e.preventDefault(); }
        });

        var down = false, startX = 0, startLeft = 0, moved = false;
        strip.addEventListener("pointerdown", function (e) {
            if (e.pointerType !== "mouse") return;
            down = true; moved = false;
            startX = e.clientX; startLeft = strip.scrollLeft;
        });
        window.addEventListener("pointermove", function (e) {
            if (!down) return;
            var dx = e.clientX - startX;
            if (Math.abs(dx) > 4) { moved = true; strip.classList.add("is-dragging"); }
            strip.scrollLeft = startLeft - dx;
        });
        window.addEventListener("pointerup", function () {
            if (!down) return;
            down = false;
            strip.classList.remove("is-dragging");
        });
    }

    /* ---------------------------------------------------------------------
       Quote form: builds an email in the visitor's mail app (no backend)
       --------------------------------------------------------------------- */
    var form = $("#quote");
    if (form) {
        var status = $("#form-status");
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var d = new FormData(form);
            var missing = ["name", "vehicle", "message"].filter(function (k) { return !String(d.get(k) || "").trim(); });
            status.classList.remove("is-error");
            if (missing.length) {
                status.classList.add("is-error");
                status.textContent = "Add your name, your vehicle and a short description so we can help.";
                var first = form.elements[missing[0]];
                if (first) first.focus();
                return;
            }
            var lines = [
                "Name: " + d.get("name"),
                "Phone: " + (d.get("phone") || "not provided"),
                "Vehicle: " + d.get("vehicle"),
                "Service: " + (d.get("service") || "not sure yet"),
                "",
                d.get("message")
            ];
            var subject = "Quote request: " + d.get("vehicle");
            window.location.href = "mailto:kler1990@hotmail.com?subject=" + encodeURIComponent(subject) +
                "&body=" + encodeURIComponent(lines.join("\n"));
            status.textContent = "Your email app should open with the request ready to send. If it doesn't, call 201-300-9101.";
        });
    }

    /* ---------------------------------------------------------------------
       Our work page: filters + lightbox
       --------------------------------------------------------------------- */
    var gallery = $("#gallery");
    if (gallery) {
        var items = $$(".gallery__item", gallery);
        var chips = $$(".chip");
        var count = $("#count");

        var applyFilter = function (key) {
            var shown = 0;
            items.forEach(function (li) {
                var match = key === "all" || li.getAttribute("data-cat").split(" ").indexOf(key) > -1;
                li.hidden = !match;
                if (match) shown++;
            });
            chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === key)); });
            count.textContent = "Showing " + shown + " of " + items.length + " photos";
        };
        chips.forEach(function (c) { c.addEventListener("click", function () { applyFilter(c.getAttribute("data-filter")); }); });
        applyFilter("all");

        var box = $("#lightbox");
        var img = $("#lb-img");
        var cap = $("#lb-cap");
        var current = 0;
        var visible = function () { return items.filter(function (li) { return !li.hidden; }); };

        var show = function (list, i) {
            current = (i + list.length) % list.length;
            var src = $("img", list[current]);
            img.src = src.currentSrc || src.src;
            img.alt = src.alt;
            cap.textContent = src.alt + " (" + (current + 1) + " of " + list.length + ")";
        };

        items.forEach(function (li) {
            $(".gallery__btn", li).addEventListener("click", function () {
                var list = visible();
                show(list, list.indexOf(li));
                if (typeof box.showModal === "function") box.showModal(); else box.setAttribute("open", "");
            });
        });
        $(".lightbox__close").addEventListener("click", function () { box.close(); });
        $(".lightbox__prev").addEventListener("click", function () { var l = visible(); show(l, current - 1); });
        $(".lightbox__next").addEventListener("click", function () { var l = visible(); show(l, current + 1); });
        box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
        box.addEventListener("keydown", function (e) {
            var l = visible();
            if (e.key === "ArrowRight") show(l, current + 1);
            if (e.key === "ArrowLeft") show(l, current - 1);
        });
    }
})();
