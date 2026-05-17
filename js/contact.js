// contact.js — Joe Davis Arts & Media
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const successMsg = document.getElementById('formSuccess');

  function showError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    input.classList.add('error');
    let err = group.querySelector('.form-error');
    if (!err) { err = document.createElement('span'); err.className = 'form-error'; group.appendChild(err); }
    err.textContent = message;
    err.style.display = 'block';
  }

  function clearError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    input.classList.remove('error');
    const err = group.querySelector('.form-error');
    if (err) err.style.display = 'none';
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function validate() {
    let ok = true;
    const fields = {
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email is required',
      service: 'Please select a service',
      message: 'Please describe your project'
    };
    Object.entries(fields).forEach(([name, msg]) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (!el) return;
      clearError(el);
      if (!el.value.trim()) { showError(el, msg); ok = false; }
      else if (name === 'email' && !isValidEmail(el.value.trim())) { showError(el, 'Enter a valid email address'); ok = false; }
    });
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        form.style.opacity = '0';
        form.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          form.style.display = 'none';
          if (successMsg) { successMsg.style.display = 'flex'; requestAnimationFrame(() => { successMsg.style.opacity = '1'; }); }
        }, 300);
      } else {
        btn.disabled = false; btn.textContent = 'Send message';
        const emailEl = form.querySelector('[name="email"]');
        if (emailEl) showError(emailEl, 'Something went wrong — please try again.');
      }
    } catch {
      btn.disabled = false; btn.textContent = 'Send message';
    }
  });

  form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    el.addEventListener('input', () => clearError(el));
    el.addEventListener('change', () => clearError(el));
  });
});
