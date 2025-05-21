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
                    alert('Sign-up successful! Welcome, ' + result.username);
                    window.location.href = 'feed.html'; // Redirect to feed page
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
        // Use Google API to get token, here we simulate
        const role = document.getElementById('role').value;
        if (!role) return alert('Please select a role.');
        // Simulate Google token
        const googleToken = 'fake-google-token';
        const res = await fetch('/api/signup/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleToken, role })
        });
        const data = await res.json();
        document.getElementById('welcome-message').innerHTML =
            data.message + `<br><a href="${data.continueUrl}">Continue to site</a>`;
    };
});