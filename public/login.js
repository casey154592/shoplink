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
        // Simulate Google OAuth and get Gmail (replace with real OAuth in production)
        const gmail = prompt("Enter your Google email for demo:");
        if (!gmail) return alert('Gmail is required.');

        const res = await fetch('/api/login/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: gmail })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('pendingGoogleEmail', gmail);
            // Only redirect if code was sent
            window.location.href = 'codeverification.html';
        } else {
            alert(data.message || 'Failed to send verification code.');
        }
    };
});