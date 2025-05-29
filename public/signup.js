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

    // Handle normal signup
    document.getElementById('signup-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        document.getElementById('loading-indicator').style.display = 'flex';
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });
            document.getElementById('loading-indicator').style.display = 'none';
            if (res.ok) {
                showPopup('Sign up successful! Redirecting...', true);
                setTimeout(() => { window.location.href = 'questions.html'; }, 1800);
            } else {
                showPopup('Sign up failed. Please try again.', false);
            }
        } catch (err) {
            document.getElementById('loading-indicator').style.display = 'none';
            showPopup('Sign up failed. Please try again.', false);
        }
    });

    // Google signup callback
    window.handleGoogleSignup = async function(response) {
        document.getElementById('loading-indicator').style.display = 'flex';
        const id_token = response.credential;
        const role = document.getElementById('role').value;
        if (!role) {
            document.getElementById('loading-indicator').style.display = 'none';
            showPopup('Please select a role before continuing with Google.', false);
            return;
        }
        try {
            const res = await fetch('/api/signup/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token, role })
            });
            document.getElementById('loading-indicator').style.display = 'none';
            if (res.ok) {
                showPopup('Signed up with Google! Redirecting...', true);
                setTimeout(() => { window.location.href = 'questions.html'; }, 1800);
            } else {
                showPopup('Google sign up failed. Please try again.', false);
            }
        } catch (err) {
            document.getElementById('loading-indicator').style.display = 'none';
            showPopup('Google sign up failed. Please try again.', false);
        }
    };