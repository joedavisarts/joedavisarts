// portfolio.js — Joe Davis Arts & Media
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.port-card[data-category]');
  if (!filterBtns.length) return;

  function filterCards(cat) {
    cards.forEach(card => {
      const match = cat === 'all' || card.getAttribute('data-category') === cat;
      if (match) {
        card.style.display = '';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }));
      } else {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        setTimeout(() => { card.style.display = 'none'; }, 300);
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCards(btn.getAttribute('data-filter'));
    });
  });
});
