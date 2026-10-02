const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');
const errorMsg = document.getElementById('auth-error');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    forms.forEach((f) => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    hideError();
  });
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}
function hideError() {
  errorMsg.hidden = true;
}

// Redirect straight to the dashboard if already logged in
(async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) window.location.href = '/dashboard.html';
  } catch (_) { /* not logged in, stay on this page */ }
})();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const data = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) return showError(body.error || 'Login failed');
    window.location.href = '/dashboard.html';
  } catch (err) {
    showError('Could not reach the server');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const data = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) return showError(body.error || 'Registration failed');
    window.location.href = '/dashboard.html';
  } catch (err) {
    showError('Could not reach the server');
  }
});
