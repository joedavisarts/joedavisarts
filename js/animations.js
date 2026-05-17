// animations.js — Joe Davis Arts & Media
document.addEventListener('DOMContentLoaded', () => {

  // — Scroll animations (fade up + slide left)
  const scrollEls = document.querySelectorAll('.animate-on-scroll, .animate-slide-left, .stagger-item');
  const scrollObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        scrollObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  scrollEls.forEach(el => scrollObs.observe(el));

  // — Stagger delays
  document.querySelectorAll('.stagger-group').forEach(group => {
    group.querySelectorAll('.stagger-item').forEach((item, i) => {
      item.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  // — Counter animation
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function runCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOutQuart(progress) * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { runCounter(entry.target); counterObs.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));
});
