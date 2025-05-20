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
});