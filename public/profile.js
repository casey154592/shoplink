document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    const postsContainer = document.getElementById('posts-container');
    const postsLoading = document.getElementById('posts-loading');

    function showPostsLoading(show) {
        if (postsLoading) postsLoading.style.display = show ? 'flex' : 'none';
    }

    // Fetch and display user's posts
    async function loadUserPosts() {
        if (!user || !user.email) return;
        showPostsLoading(true);
        postsContainer.innerHTML = '';
        try {
            const res = await fetch(`/api/posts/user/${encodeURIComponent(user.email)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const posts = await res.json();
            showPostsLoading(false);
            if (!Array.isArray(posts) || posts.length === 0) {
                postsContainer.innerHTML = '<p style="color:#888;text-align:center;">You have not posted anything yet.</p>';
                return;
            }
            postsContainer.innerHTML = posts.map(post => `
                <div class="feed-post-card profile-post-card" data-id="${post._id}">
                    <div class="feed-post-header profile-post-header">
                        <div style="display:flex;align-items:center;">
                            <img class="feed-post-avatar" src="${user.profilePictureUrl || './default-avatar.png'}" alt="Profile Picture" />
                            <span class="feed-post-username">${user.username}</span>
                        </div>
                        <span class="feed-post-date">${new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="profile-post-content" contenteditable="false">${post.content}</div>
                    ${post.videoUrl ? `<video class="feed-post-video" src="${post.videoUrl}" controls></video>` : ''}
                    <div style="margin-top:0.7rem;">
                        <button class="edit-post-btn">Edit</button>
                        <button class="delete-post-btn">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            showPostsLoading(false);
            postsContainer.innerHTML = '<p style="color:#f357a8;text-align:center;">Failed to load your posts.</p>';
        }
    }

    // Handle delete and edit actions
    postsContainer.addEventListener('click', async function(e) {
        const card = e.target.closest('.profile-post-card');
        if (!card) return;
        const postId = card.getAttribute('data-id');

        // Delete
        if (e.target.classList.contains('delete-post-btn')) {
            if (confirm('Delete this post?')) {
                await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                });
                loadUserPosts();
            }
        }

        // Edit
        if (e.target.classList.contains('edit-post-btn')) {
            const contentDiv = card.querySelector('.profile-post-content');
            if (contentDiv.isContentEditable) {
                // Save edit
                const newContent = contentDiv.textContent.trim();
                await fetch(`/api/posts/${postId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, content: newContent })
                });
                contentDiv.contentEditable = "false";
                e.target.textContent = "Edit";
                loadUserPosts(); // Refresh to reflect changes in feed
            } else {
                // Enable editing
                contentDiv.contentEditable = "true";
                contentDiv.focus();
                e.target.textContent = "Save";
            }
        }
    });

    // Profile picture upload preview
    const fileInput = document.getElementById('profile-picture');
    const previewImg = document.getElementById('profile-picture-preview-img');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                previewImg.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    loadUserPosts();
});

document.getElementById('delete-account-btn').onclick = async function() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return alert('User not found.');
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) {
        localStorage.removeItem('user');
        alert('Account deleted.');
        window.location.href = 'signup.html';
    } else {
        alert('Failed to delete account.');
    }
};