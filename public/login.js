// Show popup message
    function showPopup(msg, isSuccess = true) {
        const popup = document.getElementById('popup-message');
        const popupText = document.getElementById('popup-text');
        popupText.textContent = msg;
        popup.style.borderColor = isSuccess ? '#7b2ff2' : '#db4437';
        popup.style.color = isSuccess ? '#7b2ff2' : '#db4437';
        popup.style.display = 'flex';
        setTimeout(() => { popup.style.display = 'none'; }, 3500);
    }
    document.getElementById('popup-close').onclick = function() {
        document.getElementById('popup-message').style.display = 'none';
    };

    // Handle normal login
    document.getElementById('login-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        document.getElementById('loading-indicator').style.display = 'flex';
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            document.getElementById('loading-indicator').style.display = 'none';
            const data = await res.json();
            if (res.ok) {
                
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('sessionStart', new Date().getTime().toString());
                showPopup('Login successful! Redirecting...', true);
                setTimeout(() => { window.location.href = 'feed.html'; }, 1500);
            } 
            else {
                    showPopup(data.message||'Login failed. Please check your credentials.', false);
                
            }
        } catch (err) {
            document.getElementById('loading-indicator').style.display = 'none';
            showPopup('Login failed. Please try again.', false);
        }
    });

    // Google login callback
    window.handleGoogleLogin = async function(response) {
        document.getElementById('loading-indicator').style.display = 'flex';
        const id_token = response.credential;
        try {
            const res = await fetch('/api/login/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });
            document.getElementById('loading-indicator').style.display = 'none';
            if (res.ok) {
                showPopup('Login with Google successful! Redirecting...', true);
                setTimeout(() => { window.location.href = 'feed.html'; }, 1500);
            } else {
                const data = await res.json();
                if (data && data.message && data.message.toLowerCase().includes('no account')) {
                    showPopup('No account found. Redirecting to sign up...', false);
                    setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
                } else {
                    showPopup('Google login failed. Please try again.', false);
                }
            }
        } catch (err) {
            document.getElementById('loading-indicator').style.display = 'none';
            showPopup('Google login failed. Please try again.', false);
        }
    };
