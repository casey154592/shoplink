document.addEventListener('DOMContentLoaded', function() {
    // Show popup message
    function showPopup(msg, isSuccess = true) {
        const popup = document.getElementById('popup-message');
        const popupText = document.getElementById('popup-text');
        popupText.textContent = msg;
        popup.style.borderColor = isSuccess ? '#7b2ff2' : '#db4437';
        popup.style.color = isSuccess ? '#7b2ff2' : '#db4437';
        popup.style.display = 'flex';
        setTimeout(() => { popup.style.display = 'none'; }, 3500);
    }
    document.getElementById('popup-close').onclick = function() {
        document.getElementById('popup-message').style.display = 'none';
    };

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    
    console.log('User from localStorage:', user);
    console.log('Token:', token);
    
    // Check if user is logged in when page loads
    if (!user || !token) {
        showPopup('You must be logged in to access your profile.', false);
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return;
    }
    
    const postsContainer = document.getElementById('posts-container');
    const postsLoading = document.getElementById('posts-loading');

    // Load transaction statistics
    async function loadTransactionStats() {
        try {
            const response = await fetch(`/api/transactions/stats/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const stats = await response.json();
                displayTransactionStats(stats);
            }
        } catch (error) {
            console.error('Error loading transaction stats:', error);
        }
    }

    // Display transaction statistics
    function displayTransactionStats(stats) {
        const profileContainer = document.querySelector('.profile-container');
        
        // Remove existing stats section if it exists
        const existingStats = document.getElementById('transaction-stats');
        if (existingStats) {
            existingStats.remove();
        }

        // Only show stats for customers
        if (user.role === 'customer') {
            const statsSection = document.createElement('div');
            statsSection.id = 'transaction-stats';
            statsSection.innerHTML = `
                <h2 style="color: #7b2ff2; margin-top: 2rem; margin-bottom: 1rem;">Transaction Summary</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="text-align: center; padding: 1rem; background: #f9f6ff; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #7b2ff2;">${stats.total}</div>
                        <div style="color: #666; font-size: 0.9rem;">Total</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #fff3cd; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #856404;">${stats.pending}</div>
                        <div style="color: #666; font-size: 0.9rem;">Pending</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #cce7ff; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">${stats.inProgress}</div>
                        <div style="color: #666; font-size: 0.9rem;">Ongoing</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #d4edda; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${stats.completed}</div>
                        <div style="color: #666; font-size: 0.9rem;">Completed</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f8d7da; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #721c24;">${stats.failed + stats.cancelled}</div>
                        <div style="color: #666; font-size: 0.9rem;">Failed</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #e7f3ff; border-radius: 8px; margin-bottom: 2rem;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #7b2ff2;">₦${stats.totalAmount.toLocaleString()}</div>
                    <div style="color: #666;">Total Amount Spent</div>
                </div>
            `;
            profileContainer.appendChild(statsSection);
        } else if (user.role === 'CEO') {
            // For CEOs, show their customer count
            const ceoStatsSection = document.createElement('div');
            ceoStatsSection.id = 'ceo-stats';
            ceoStatsSection.innerHTML = `
                <h2 style="color: #7b2ff2; margin-top: 2rem; margin-bottom: 1rem;">Business Summary</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="text-align: center; padding: 1rem; background: #f9f6ff; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #7b2ff2;">${user.followers ? user.followers.length : 0}</div>
                        <div style="color: #666; font-size: 0.9rem;">Followers</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #d4edda; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${stats.completed}</div>
                        <div style="color: #666; font-size: 0.9rem;">Completed Deals</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #cce7ff; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">${stats.inProgress}</div>
                        <div style="color: #666; font-size: 0.9rem;">Active Deals</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #e7f3ff; border-radius: 8px; margin-bottom: 2rem;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: #7b2ff2;">₦${stats.totalAmount.toLocaleString()}</div>
                    <div style="color: #666;">Total Earnings</div>
                </div>
            `;
            profileContainer.appendChild(ceoStatsSection);
        }
    }

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
            if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                try {
                    console.log('Profile delete: Sending DELETE request to:', `/api/posts/${postId}`);
                    const response = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log('Profile delete response status:', response.status);
                    const result = await response.json();
                    console.log('Profile delete response:', result);

                    if (response.ok) {
                        showPopup('Post deleted successfully!', true);
                        loadUserPosts(); // Refresh the posts list
                    } else {
                        showPopup(result.message || 'Failed to delete post.', false);
                    }
                } catch (error) {
                    console.error('Delete post error:', error);
                    showPopup('An error occurred while deleting the post.', false);
                }
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

    // Handle profile form submission
    document.getElementById('profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!user || !user.id) {
            showPopup('User data not found. Please log in first.', false);
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }

        const submitBtn = document.getElementById('profile-submit-btn');
        const loadingDiv = document.getElementById('profile-loading');
        const originalText = submitBtn.textContent;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        loadingDiv.style.display = 'block';

        try {
            const formData = new FormData();
            const username = document.getElementById('profile-username').value.trim();
            const bio = document.getElementById('profile-bio').value.trim();

            // Validate username
            if (!username) {
                showPopup('Username is required.', false);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                loadingDiv.style.display = 'none';
                return;
            }

            formData.append('username', username);
            formData.append('bio', bio);
            formData.append('userId', user?.id);

            // Add profile picture if selected
            const fileInput = document.getElementById('profile-picture');
            if (fileInput.files[0]) {
                formData.append('profilePicture', fileInput.files[0]);
            }

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Update localStorage with new user data
                const updatedUser = { ...user, ...result.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                Object.assign(user, result.user);

                showPopup('Profile updated successfully!', true);
                setTimeout(() => { window.location.href = 'feed.html'; }, 2000);

            } else {
                if (response.status === 401) {
                    showPopup('Your session has expired. Please log in again.', false);
                    setTimeout(() => {
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showPopup(result.message || 'Failed to update profile. Please try again.', false);
                }
            }

        } catch (error) {
            console.error('Profile update error:', error);
            showPopup('An error occurred while updating your profile. Please check your connection and try again.', false);
        } finally {
            // Re-enable button and hide loading
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            loadingDiv.style.display = 'none';
        }
    });

    loadUserPosts();
    loadUserProfile();
    loadTransactionStats();
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async function() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;

        // Call logout API to invalidate token on server
        await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout API error:', error);
    }

    // Clear local storage and redirect
    localStorage.removeItem('user');
    localStorage.removeItem('sessionStart');
    window.location.href = 'login.html';
});

document.getElementById('delete-account-btn').onclick = async function() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (!token) {
        showPopup('Authentication required.', false);
        return;
    }
    
    try {
        const res = await fetch('/api/profile', { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            localStorage.removeItem('user');
            showPopup('Account deleted.', true);
            setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
        } else {
            const error = await res.json();
            showPopup(error.message || 'Failed to delete account.', false);
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showPopup('An error occurred while deleting your account.', false);
    }
};