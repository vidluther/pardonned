(function () {
  var els = document.querySelectorAll("[data-animate]");
  els.forEach(function (el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    el.style.transition =
      "opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  els.forEach(function (el) {
    observer.observe(el);
  });
})();
