// Show Ceo post card only for Ceo users (example, adjust as needed)
document.addEventListener('DOMContentLoaded', function() {
    // Show Ceo post card only for Ceo users
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'ceo') {
        document.getElementById('ceo-post-card').style.display = 'block';
    }

    // Negotiable toggle label update
    const negotiableCheckbox = document.getElementById('negotiable');
    const negotiableLabel = document.getElementById('negotiable-label');
    if (negotiableCheckbox && negotiableLabel) {
        negotiableCheckbox.addEventListener('change', function() {
            negotiableLabel.textContent = this.checked ? 'Negotiable' : 'Not Negotiable';
            negotiableLabel.style.color = this.checked ? '#7b2ff2' : '#888';
        });
    }

    // Handle form submission
    const postForm = document.getElementById('ceo-post-form');
    if (postForm) {
        postForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(postForm);
            // Add negotiable as boolean
            formData.set('negotiable', negotiableCheckbox.checked);

            // Add authentication token if needed
            const token = user?.token;
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData
                });
                if (res.ok) {
                    alert('Product posted successfully!');
                    postForm.reset();
                    negotiableLabel.textContent = 'Not Negotiable';
                    negotiableLabel.style.color = '#888';
                } else {
                    const data = await res.json();
                    alert('Failed to post product: ' + (data.message || 'Unknown error'));
                }
            } catch (err) {
                alert('Error posting product: ' + err.message);
            }
        });
    }
});