document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const loadingIndicator = document.getElementById('loading-indicator');
    const popup = document.getElementById('popup-message');
    const popupText = document.getElementById('popup-text');
    const popupClose = document.getElementById('popup-close');
    const googleBtn = document.querySelector('.g_id_signin');
    const roleSelect = document.getElementById('role') || document.getElementById('signup-role');
    // const signupLoading = document.getElementById('signup-loading');

    // Show/hide loading indicator
    function showLoading(show) {
        if (loadingIndicator) loadingIndicator.style.display = show ? 'block' : 'none';
    }

    // Show popup message
    function showPopupMessage(message) {
        if (popup && popupText) {
            popupText.textContent = message;
            popup.style.display = 'flex';
            setTimeout(() => { popup.style.display = 'none'; }, 5000);
        } else {
            alert(message);
        }
    }
    if (popupClose) {
        popupClose.onclick = function() {
            popup.style.display = 'none';
        };
    }

    // Enable/disable Google signup button based on role selection
    if (roleSelect && googleBtn) {
        roleSelect.addEventListener('change', function() {
            if (this.value === "selectrole" || !this.value) {
                googleBtn.style.pointerEvents = 'none';
                googleBtn.style.opacity = '0.5';
            } else {
                googleBtn.style.pointerEvents = 'auto';
                googleBtn.style.opacity = '1';
            }
        });
        // Initialize state on page load
        roleSelect.dispatchEvent(new Event('change'));
    }

    // Email/password signup
    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoading(true);
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify({
                        username: result.username,
                        email: result.email,
                        role: result.role
                    }));
                    showPopupMessage('Sign-up successful! Welcome, ' + result.username);
                    setTimeout(() => {
                        window.location.href = 'questions.html';
                    }, 1500);
                } else {
                    showPopupMessage('Sign-up failed: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                showPopupMessage('Network error');
            } finally {
                showLoading(false);
            }
        });
    }

    // Google signup (button click for demo/manual)
    const googleSignupBtn = document.getElementById('google-signup');
    if (googleSignupBtn) {
        googleSignupBtn.onclick = async function() {
            const gmail = prompt("Enter your Google email for demo:");
            const role = roleSelect ? roleSelect.value : '';
            if (!gmail || !role || role === "selectrole") {
                showPopupMessage('Please enter your Gmail and select a role.');
                return;
            }
            showLoading(true);
            try {
                const res = await fetch('/api/signup/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gmail, role })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('userGmail', gmail);
                    showPopupMessage('Welcome email sent! Check your Gmail for the link to continue.');
                } else {
                    showPopupMessage(data.message || 'Signup failed.');
                }
            } catch (err) {
                showPopupMessage('Network error');
            } finally {
                showLoading(false);
            }
        };
    }

    // Google Identity Services callback
    window.handleGoogleSignup = async function(response) {
        const id_token = response.credential;
        const role = roleSelect ? roleSelect.value : '';
        if (!role || role === "selectrole") {
            showPopupMessage('Please select a role (CEO or Customer) before continuing with Google.');
            return;
        }
        showLoading(true);
        try {
            const res = await fetch('/api/signup/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token, role })
            });
            const data = await res.json();
            if (res.ok) {
                showPopupMessage('Welcome email sent! Check your Gmail for the link to continue.');
                setTimeout(() => {
                    window.location.href = 'questions.html';
                }, 1500);
            } else {
                showPopupMessage(data.message || 'Signup failed.');
            }
        } catch (err) {
            showPopupMessage('Network error');
        } finally {
            showLoading(false);
        }
    };
});