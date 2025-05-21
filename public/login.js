document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('user', JSON.stringify(result));
                    window.location.href = 'feed.html'; // Redirect to feed page
                }
            } catch (error) {
                alert('An error occurred. Please try again later.');
            }
        });
    }

    document.getElementById('google-login').onclick = async function() {
        // Simulate Google login and get email (replace with real Google OAuth in production)
        const email = prompt("Enter your Google email for demo:"); // Replace with real Google email
        if (!email) return alert('Email is required.');

        // Send request to backend to send verification code
        const res = await fetch('/api/login/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            // Store email in localStorage for verification step
            localStorage.setItem('pendingGoogleEmail', email);
            // Redirect to code verification page
            window.location.href = 'codeverification.html';
        } else {
            alert(data.message || 'Failed to start Google login.');
        }
    };
});