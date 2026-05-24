(function () {
  const pieces = document.querySelectorAll(".piece");
  if (!pieces.length) return;

  if (!("IntersectionObserver" in window)) {
    pieces.forEach((p) => p.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  pieces.forEach((p) => io.observe(p));
})();
