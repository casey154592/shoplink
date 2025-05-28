document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('user', JSON.stringify(result));
                    showPopupMessage('Sign-up successful! Welcome, ' + result.username);
                    setTimeout(() => {
                        window.location.href = 'questions.html';
                    }, 1500);
                } else {
                    const result = await response.json();
                    alert('Sign-up failed: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                alert('Network error');
            }
        });
    }

    document.getElementById('google-signup').onclick = async function() {
        // Simulate Google OAuth and get Gmail (replace with real OAuth in production)
        const gmail = prompt("Enter your Google email for demo:");
        const role = document.getElementById('role').value;
        if (!gmail || !role) return alert('Please enter your Gmail and select a role.');

        const res = await fetch('/api/signup/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail, role })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('userGmail', gmail);
            alert('Welcome email sent! Check your Gmail for the link to continue.');
            // Optionally, redirect to feed or wait for user to click the link in email
            // window.location.href = 'feed.html';
        } else {
            alert(data.message || 'Signup failed.');
        }
    };

    document.getElementById('role').addEventListener('change', function() {
        const googleBtn = document.querySelector('.g_id_signin');
        if (this.value === "selectrole") {
            googleBtn.style.pointerEvents = 'none';
            googleBtn.style.opacity = '0.5';
        } else {
            googleBtn.style.pointerEvents = 'auto';
            googleBtn.style.opacity = '1';
        }
    });
    // Initialize state on page load
    document.getElementById('role').dispatchEvent(new Event('change'));
});

window.handleGoogleSignup = async function(response) {
    const id_token = response.credential;
    const role = document.getElementById('role').value;
    if (!role || role === "selectrole") {
        showPopupMessage('Please select a role (CEO or Customer) before continuing with Google.');
        return;
    }

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
};

function showPopupMessage(message) {
    const popup = document.getElementById('popup-message');
    const popupText = document.getElementById('popup-text');
    popupText.textContent = message;
    popup.style.display = 'flex';
    // Auto-hide after 5 seconds
    setTimeout(() => { popup.style.display = 'none'; }, 5000);
}
document.getElementById('popup-close').onclick = function() {
    document.getElementById('popup-message').style.display = 'none';
};