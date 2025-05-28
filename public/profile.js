document.addEventListener('DOMContentLoaded', function() {
    // Simulate getting user info from localStorage/session (replace with real auth in production)
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        // alert('You must be logged in to view your profile.');
        window.location.href = 'index.html';
        return;
    }

    // Show post section for CEOs
    if (user.role === 'CEO') {
        document.getElementById('post-section').style.display = 'block';
        const postForm = document.getElementById('post-form');
        const postLoading = document.getElementById('post-loading');
        const postSubmitBtn = document.getElementById('post-submit-btn');
        postForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            postLoading.style.display = 'block';
            postSubmitBtn.disabled = true;

            const formData = new FormData(postForm);
            formData.append('email', user.email);

            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Post created!');
                    postForm.reset();
                } else {
                    alert('Post failed: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                alert('Network error');
            }
            postLoading.style.display = 'none';
            postSubmitBtn.disabled = false;
        });
    }

    // Show posts for Customers
    if (user.role === 'Customer') {
        const postsSection = document.getElementById('customer-posts-section');
        if (postsSection) {
            fetch('/api/posts')
                .then(res => res.json())
                .then(posts => {
                    if (posts.length === 0) {
                        postsSection.innerHTML = '<p>No posts available yet.</p>';
                    } else {
                        postsSection.innerHTML = posts.map(post => `
                            <div class="post-card">
                                <h3>${post.author?.username || 'Unknown CEO'}</h3>
                                <p>${post.content}</p>
                                ${post.videoUrl ? `<video src="${post.videoUrl}" controls style="max-width:100%;"></video>` : ''}
                                <small>${new Date(post.createdAt).toLocaleString()}</small>
                            </div>
                        `).join('');
                    }
                })
                .catch(() => {
                    postsSection.innerHTML = '<p>Could not load posts.</p>';
                });
        }
    }

    // Populate form with user info
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-role').value = user.role;
    document.getElementById('profile-bio').value = user.bio || '';

    // Show profile picture if exists
    if (user.profilePictureUrl) {
        document.getElementById('profile-picture-preview').innerHTML =
            `<img src="${user.profilePictureUrl}" alt="Profile Picture" style="width:80px;height:80px;border-radius:50%;">`;
    }

    // Preview selected profile picture
    document.getElementById('profile-picture').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                document.getElementById('profile-picture-preview').innerHTML =
                    `<img src="${evt.target.result}" alt="Profile Picture" style="width:80px;height:80px;border-radius:50%;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle profile update
    const profileForm = document.getElementById('profile-form');
    const profileLoading = document.getElementById('profile-loading');
    const profileSubmitBtn = document.getElementById('profile-submit-btn');
    profileForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        profileLoading.style.display = 'block';
        profileSubmitBtn.disabled = true;
        const formData = new FormData(profileForm);
        formData.append('email', user.email); // Ensure email is sent

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                alert('Profile updated!');
                // Update localStorage user info
                user.username = result.user.username;
                user.bio = result.user.bio;
                user.profilePictureUrl = result.user.profilePictureUrl;
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                alert('Update failed: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Network error');
        }
        profileLoading.style.display = 'none';
        profileSubmitBtn.disabled = false;
    });

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});