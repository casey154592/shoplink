document.addEventListener('DOMContentLoaded', async function() {
    // Show popup message
    function showPopup(msg, isSuccess = true) {
        const popup = document.getElementById('popup-message');
        const popupText = document.getElementById('popup-text');
        if (popup && popupText) {
            popupText.textContent = msg;
            popup.style.borderColor = isSuccess ? '#7b2ff2' : '#db4437';
            popup.style.color = isSuccess ? '#7b2ff2' : '#db4437';
            popup.style.display = 'flex';
            setTimeout(() => { popup.style.display = 'none'; }, 3500);
        }
    }

    // Close popup functionality
    const popupClose = document.getElementById('popup-close');
    if (popupClose) {
        popupClose.onclick = function() {
            document.getElementById('popup-message').style.display = 'none';
        };
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    // Check if user is authenticated
    if (!user || !token) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }

    // Load user profile and posts
    async function loadUserProfile() {
        try {
            const response = await fetch(`/api/profile/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const profileData = await response.json();
                // Update localStorage with latest data
                const updatedUser = { ...user, ...profileData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Update the local user variable
                Object.assign(user, profileData);

                // Populate profile section
                document.getElementById('profile-username').textContent = user.username || '';
                document.getElementById('profile-brand').textContent = user.brandName || '';
                document.getElementById('profile-role').textContent = user.role ? `Role: ${user.role}` : '';
                document.getElementById('profile-pic').src = user.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    // Load user's posts
    async function loadUserPosts() {
        try {
            const response = await fetch('/api/posts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const posts = await response.json();

            // Filter posts by current user
            const userPosts = posts.filter(post => post.author?.id === user.id);

            const postsContainer = document.getElementById('posts-container');

            if (userPosts.length === 0) {
                postsContainer.innerHTML = '<div class="no-posts">You haven\'t posted anything yet. <a href="feed.html">Create your first post!</a></div>';
                return;
            }

            // helper for media rendering
            function renderMedia(mediaArray) {
                if (!mediaArray || mediaArray.length === 0) return '';
                let html = '';
                mediaArray.forEach(item => {
                    if (item.type === 'video') {
                        html += `<video controls class="post-image" style="max-width:100%;height:auto;display:block;margin-bottom:0.5rem;"><source src="${item.url}" type="video/mp4">Your browser does not support video.</video>`;
                    } else {
                        html += `<img src="${item.url}" alt="Product Image" class="post-image">`;
                    }
                });
                return html;
            }

            postsContainer.innerHTML = userPosts.map(post => {
                const negotiableBadge = post.negotiable
                    ? `<span class="negotiable-badge">Negotiable</span>`
                    : `<span class="negotiable-badge" style="background:#888;">Not Negotiable</span>`;

                return `
                    <div class="post-card">
                        ${renderMedia(post.media)}
                        <div class="post-content">
                            <div class="post-price">
                                ₦<span>${post.price}</span>
                                ${negotiableBadge}
                            </div>
                            <div class="post-description">
                                <p>${post.description}</p>
                            </div>
                            <div class="post-actions">
                                <button class="edit-btn" data-post-id="${post._id}">Edit</button>
                                <button class="delete-btn" data-post-id="${post._id}">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners for edit and delete buttons
            attachPostActions();

        } catch (error) {
            console.error('Error loading posts:', error);
            document.getElementById('posts-container').innerHTML = '<div class="no-posts">Failed to load posts. Please try again.</div>';
        }
    }

    // Attach event listeners to post action buttons
    function attachPostActions() {
        // Edit post logic
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                const card = this.closest('.post-card');
                const descElement = card.querySelector('.post-description p');
                const priceElement = card.querySelector('.post-price span');
                const negotiableBadge = card.querySelector('.negotiable-badge');

                if (this.textContent === 'Edit') {
                    // Switch to edit mode
                    const currentDesc = descElement.textContent;
                    const currentPrice = priceElement.textContent;
                    const isNegotiable = negotiableBadge && !negotiableBadge.style.background.includes('888');

                    descElement.innerHTML = `<textarea style="width:100%;min-height:60px;padding:8px;border:1px solid #7b2ff2;border-radius:4px;">${currentDesc}</textarea>`;
                    priceElement.innerHTML = `<input type="number" step="0.01" min="0" value="${currentPrice}" style="width:80px;padding:4px;border:1px solid #7b2ff2;border-radius:4px;">`;

                    // Add negotiable checkbox
                    if (negotiableBadge) {
                        negotiableBadge.innerHTML = `<label style="font-size:0.8rem;"><input type="checkbox" ${isNegotiable ? 'checked' : ''} style="margin-right:4px;">Negotiable</label>`;
                    }

                    this.textContent = 'Save';
                    this.style.background = '#28a745';
                } else {
                    // Save changes
                    const newDesc = descElement.querySelector('textarea').value.trim();
                    const newPrice = parseFloat(priceElement.querySelector('input').value);
                    const isNegotiable = negotiableBadge && negotiableBadge.querySelector('input').checked;

                    if (!newDesc || !newPrice || newPrice <= 0) {
                        showPopup('Please enter valid description and price.', false);
                        return;
                    }

                    // Send update request
                    fetch(`/api/posts/${postId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            description: newDesc,
                            price: newPrice,
                            negotiable: isNegotiable
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        if (result.message === 'Post updated successfully') {
                            showPopup('Post updated successfully!', true);
                            // Refresh the posts
                            loadUserPosts();
                        } else {
                            showPopup(result.message || 'Failed to update post.', false);
                        }
                    })
                    .catch(error => {
                        console.error('Edit post error:', error);
                        showPopup('API endpoint not found or network error. Please try again.', false);
                    });
                }
            });
        });

        // Delete post logic
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                    try {
                        const response = await fetch(`/api/posts/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        const result = await response.json();

                        if (response.ok) {
                            showPopup('Post deleted successfully!', true);
                            // Refresh the posts
                            loadUserPosts();
                        } else {
                            showPopup(result.message || 'Failed to delete post.', false);
                        }
                    } catch (error) {
                        console.error('Delete post error:', error);
                        showPopup('An error occurred while deleting the post.', false);
                    }
                }
            });
        });
    }

    // Initialize the page
    await loadUserProfile();
    await loadUserPosts();
});