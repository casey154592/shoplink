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
                } else {
                    const error = await response.json();
                    alert(error.message || 'Login failed.');
                }
            } catch (error) {
                alert('An error occurred. Please try again later.');
            }
        });
    }

    window.handleGoogleLogin = async function(response) {
        const id_token = response.credential;
        const res = await fetch('/api/login/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token })
        });
        const data = await res.json();
        if (res.ok) {
            // Optionally store user info in localStorage
            window.location.href = 'feed.html';
        } else {
            alert(data.message || 'Google login failed.');
        }
    };
});