// reset-password.js
(function(){
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const requestSection = document.getElementById('request-section');
  const confirmSection = document.getElementById('confirm-section');
  const title = document.getElementById('title');

  const requestBtn = document.getElementById('request-btn');
  const emailInput = document.getElementById('email');
  const requestMsg = document.getElementById('request-msg');

  const confirmBtn = document.getElementById('confirm-btn');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const confirmMsg = document.getElementById('confirm-msg');

  function showMessage(el, msg, ok=true){
    el.textContent = msg;
    el.style.color = ok ? '#155724' : '#721c24';
  }

  if (token) {
    // show confirm flow
    requestSection.style.display = 'none';
    confirmSection.style.display = 'block';
    title.textContent = 'Set a new password';
  }

  requestBtn.addEventListener('click', async () => {
    requestBtn.disabled = true;
    showMessage(requestMsg, 'Sending...');
    try {
      const res = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim().toLowerCase() })
      });
      const data = await res.json();
      showMessage(requestMsg, data.message || 'If an account exists, a reset link was sent.', true);
    } catch (err) {
      showMessage(requestMsg, 'Failed to send reset link. Try again later.', false);
    } finally {
      requestBtn.disabled = false;
    }
  });

  confirmBtn.addEventListener('click', async () => {
    const p1 = newPasswordInput.value;
    const p2 = confirmPasswordInput.value;
    if (!p1 || !p2) return showMessage(confirmMsg, 'Please enter and confirm your new password.', false);
    if (p1 !== p2) return showMessage(confirmMsg, 'Passwords do not match.', false);

    confirmBtn.disabled = true;
    showMessage(confirmMsg, 'Resetting password...');
    try {
      const res = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: p1 })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(confirmMsg, data.message || 'Password reset successful.', true);
        setTimeout(() => { window.location.href = 'login.html'; }, 1800);
      } else {
        showMessage(confirmMsg, data.message || 'Failed to reset password.', false);
      }
    } catch (err) {
      showMessage(confirmMsg, 'Failed to reset password. Try again later.', false);
    } finally {
      confirmBtn.disabled = false;
    }
  });

})();
