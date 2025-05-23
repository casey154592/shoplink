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
});