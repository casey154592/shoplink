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
    const userId = user?.id;
    const userRole = user?.role;
    const feedPosts = document.getElementById('feed-posts');
    const notifBadge = document.getElementById('notification-badge');
    const notifIcon = document.getElementById('notification-icon');
    const cartBadge = document.getElementById('cart-badge');

    // Check if user is authenticated, if not redirect to login
    if (!user || !token) {
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        window.location.href = 'login.html';
        return;
    }

    // Initialize cart badge
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length > 0) {
        cartBadge.textContent = cart.length;
        cartBadge.style.display = 'flex';
    }

    // Hide cart button and sidebar cart link for CEOs, hide create post button for customers
    const cartBtn = document.getElementById('cart-btn');
    const addPostBtn = document.getElementById('add-post-btn');
    const sideMenu = document.getElementById('side-menu');
    const normalizedRole = userRole ? userRole.toLowerCase() : '';
    
    if (normalizedRole === 'ceo') {
        if (cartBtn) cartBtn.style.display = 'none';
        // Hide cart link in sidebar for CEOs
        if (sideMenu) {
            const cartLink = sideMenu.querySelector('a[href="cart.html"]');
            if (cartLink) cartLink.style.display = 'none';
        }
    }
    if (normalizedRole === 'customer') {
        if (addPostBtn) addPostBtn.style.display = 'none';
    }

    // Fetch and render posts (with Ceo info, follow button, add to cart)
    async function loadFeed() {
        feedPosts.innerHTML = '<div>Loading...</div>';
        const res = await fetch('/api/posts', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const posts = await res.json();
        if (!Array.isArray(posts) || posts.length === 0) {
            feedPosts.innerHTML = '<p class="no-posts">No posts yet.</p>';
            return;
        }
        feedPosts.innerHTML = '';
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        posts.forEach(post => {
            const isFollowing = (post.author?.followers || []).includes(userId);
            const showFollowBtn = userRole === 'customer' && post.author && post.author.id !== userId && !isFollowing;
            const followBtnHtml = showFollowBtn
                ? `<button class="follow-ceo-btn" data-ceo-id="${post.author.id}"><i class="fa fa-user-plus"></i> Add Ceo</button>`
                : '';
            const negotiableBadge = post.negotiable
                ? `<span class="negotiable-badge">Negotiable</span>`
                : `<span class="negotiable-badge" style="background:#888;">Not Negotiable</span>`;
            const isOwnPost = userRole === 'CEO' && post.author && post.author.id === userId;
            const deleteBtnHtml = isOwnPost
                ? `<button class="delete-post-btn" data-post-id="${post._id}" style="background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:4px;margin-left:10px;"><i class="fa fa-trash"></i> Delete</button>`
                : '';
            const isLiked = (post.likes || []).some(like => like.toString ? like.toString() === userId : like === userId);
            const likeCount = post.likes ? post.likes.length : 0;
            const commentCount = post.comments ? post.comments.length : 0;
            const inCart = cart.includes(post._id);
            
            feedPosts.innerHTML += `
                <div class="product-card" data-post-id="${post._id}">
                    <div class="product-card-header">
                        <div class="ceo-profile-section">
                            <img src="${post.author?.profilePictureUrl || './default-avatar.png'}" alt="Ceo Profile" class="product-ceo-avatar circular-avatar">
                            <div class="ceo-info">
                                <span class="product-ceo-name">${post.author?.username || 'Unknown'}</span>
                                ${post.author?.brandName ? `<span class="product-ceo-brand">${post.author.brandName}</span>` : ''}
                                <span class="product-ceo-role">CEO</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            ${followBtnHtml}
                        </div>
                    </div>
                    <img src="${post.imageUrl}" alt="Product Image" class="product-img">
                    <div class="product-info">
                        <div class="product-price">
                            ₦<span>${post.price}</span>
                            ${negotiableBadge}
                        </div>
                        <div class="product-desc">
                            <p>${post.description}</p>
                        </div>
                        <div class="post-stats">
                            <span class="like-count"><i class="fa fa-heart"></i> ${likeCount} Likes</span>
                            <span class="comment-count"><i class="fa fa-comment"></i> ${commentCount} Comments</span>
                        </div>
                        <div class="post-actions">
                            <button class="like-btn" data-post-id="${post._id}" style="flex:1;background:${isLiked ? '#f357a8' : '#f0f0f0'};color:${isLiked ? '#fff' : '#333'};border:none;padding:0.6rem;border-radius:5px;cursor:pointer;"><i class="fa fa-heart${isLiked ? '' : '-o'}"></i> ${isLiked ? 'Unlike' : 'Like'}</button>
                            <button class="comment-btn" data-post-id="${post._id}" style="flex:1;background:#f0f0f0;color:#333;border:none;margin-left:0.5rem;padding:0.6rem;border-radius:5px;cursor:pointer;"><i class="fa fa-comment"></i> Comment</button>
                            ${userRole === 'customer' ? `<button class="add-to-cart-btn" data-post-id="${post._id}" ${inCart ? 'disabled' : ''} style="flex:1;background:${inCart ? '#888' : '#7b2ff2'};color:#fff;border:none;margin-left:0.5rem;padding:0.6rem;border-radius:5px;cursor:${inCart ? 'not-allowed' : 'pointer'};">${inCart ? '<i class="fa fa-check"></i> In Cart' : '<i class="fa fa-shopping-cart"></i> Add to Cart'}</button>` : ''}
                            ${userRole === 'CEO' && post.author?.id === userId ? `<button class="edit-post-btn" data-post-id="${post._id}" style="flex:1;background:#ffc107;color:#000;border:none;margin-left:0.5rem;padding:0.6rem;border-radius:5px;cursor:pointer;">Edit Post</button>` : ''}
                            ${userRole === 'CEO' && post.author?.id === userId ? `<button class="delete-post-btn" data-post-id="${post._id}" style="flex:1;background:#dc3545;color:white;border:none;margin-left:0.5rem;padding:0.6rem;border-radius:5px;cursor:pointer;"><i class="fa fa-trash"></i> Delete</button>` : ''}
                        </div>
                    </div>
                    <div class="comments-section" id="comments-${post._id}" style="display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid #eee;">
                        <div class="comments-list" id="comments-list-${post._id}"></div>
                        <div style="display:flex;gap:0.5rem;margin-top:0.8rem;">
                            <input type="text" class="comment-input" data-post-id="${post._id}" placeholder="Write a comment..." style="flex:1;padding:0.5rem;border:1px solid #ddd;border-radius:4px;">
                            <button class="submit-comment-btn" data-post-id="${post._id}" style="background:#7b2ff2;color:#fff;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer;">Post</button>
                        </div>
                    </div>
                </div>
            `;


        // Follow Ceo button logic
        document.querySelectorAll('.follow-ceo-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const ceoId = this.dataset.ceoId;
                try {
                    const res = await fetch(`/api/posts/follow/${ceoId}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        this.innerHTML = '<i class="fa fa-check"></i> Following';
                        this.disabled = true;
                        this.style.background = '#7b2ff2';
                        showPopup('Successfully followed CEO!', true);
                    } else {
                        const error = await res.json();
                        showPopup(error.message || 'Failed to follow CEO.', false);
                    }
                } catch (error) {
                    console.error('Follow error:', error);
                    showPopup('An error occurred while following the CEO.', false);
                }
            });
        });

        // Add to cart logic
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                if (!cart.includes(postId)) {
                    cart.push(postId);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    showPopup('Added to cart!', true);
                    this.innerHTML = '<i class="fa fa-shopping-cart"></i> In Cart';
                    this.disabled = true;
                    this.style.background = '#888';
                    
                    // Update cart badge
                    const cartBadge = document.getElementById('cart-badge');
                    cartBadge.textContent = cart.length;
                    cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
                } else {
                    showPopup('Already in cart!', false);
                }
            });
        });

        // Like post logic
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                try {
                    const res = await fetch(`/api/posts/${postId}/like`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        const isLiked = !this.textContent.includes('Unlike');
                        this.style.background = isLiked ? '#f0f0f0' : '#f357a8';
                        this.style.color = isLiked ? '#333' : '#fff';
                        this.innerHTML = isLiked ? '<i class="fa fa-heart-o"></i> Like' : '<i class="fa fa-heart"></i> Unlike';
                        
                        // Update like count
                        const card = this.closest('.product-card');
                        const likeCount = card.querySelector('.like-count');
                        likeCount.innerHTML = `<i class="fa fa-heart"></i> ${data.likes} Likes`;
                    }
                } catch (error) {
                    console.error('Like error:', error);
                    showPopup('Failed to like post.', false);
                }
            });
        });

        // Comment button logic (toggle comments section)
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                const commentsSection = document.getElementById(`comments-${postId}`);
                
                if (commentsSection.style.display === 'none') {
                    // Load and show comments
                    try {
                        const res = await fetch(`/api/posts/${postId}/comments`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        
                        const commentsList = document.getElementById(`comments-list-${postId}`);
                        if (data.comments.length === 0) {
                            commentsList.innerHTML = '<p style="color:#999;text-align:center;padding:1rem;">No comments yet. Be the first to comment!</p>';
                        } else {
                            commentsList.innerHTML = data.comments.map(comment => `
                                <div style="padding:0.8rem;background:#f5f5f5;border-radius:4px;margin-bottom:0.5rem;">
                                    <strong>${comment.username}</strong>
                                    <p style="margin:0.3rem 0 0 0;color:#333;">${comment.text}</p>
                                    <small style="color:#999;">${new Date(comment.createdAt).toLocaleDateString()}</small>
                                </div>
                            `).join('');
                        }
                    } catch (error) {
                        console.error('Load comments error:', error);
                        showPopup('Failed to load comments.', false);
                    }
                    
                    commentsSection.style.display = 'block';
                    this.style.background = '#7b2ff2';
                    this.style.color = '#fff';
                } else {
                    commentsSection.style.display = 'none';
                    this.style.background = '#f0f0f0';
                    this.style.color = '#333';
                }
            });
        });

        // Submit comment logic
        document.querySelectorAll('.submit-comment-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
                const text = input.value.trim();
                
                if (!text) {
                    showPopup('Please write a comment.', false);
                    return;
                }
                
                try {
                    const res = await fetch(`/api/posts/${postId}/comment`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ text })
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        // Add new comment to the list
                        const commentsList = document.getElementById(`comments-list-${postId}`);
                        const newCommentHtml = `
                            <div style="padding:0.8rem;background:#f5f5f5;border-radius:4px;margin-bottom:0.5rem;">
                                <strong>${data.comment.username}</strong>
                                <p style="margin:0.3rem 0 0 0;color:#333;">${data.comment.text}</p>
                                <small style="color:#999;">just now</small>
                            </div>
                        `;
                        
                        if (commentsList.innerHTML.includes('No comments yet')) {
                            commentsList.innerHTML = newCommentHtml;
                        } else {
                            commentsList.innerHTML += newCommentHtml;
                        }
                        
                        // Update comment count
                        const card = this.closest('.product-card');
                        const commentCount = card.querySelector('.comment-count');
                        commentCount.innerHTML = `<i class="fa fa-comment"></i> ${data.commentCount} Comments`;
                        
                        input.value = '';
                        showPopup('Comment added!', true);
                    }
                } catch (error) {
                    console.error('Comment error:', error);
                    showPopup('Failed to add comment.', false);
                }
            });
        });

        // Delete post logic (for CEOs on their own posts)
        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                console.log('Delete button clicked for post:', postId);
                if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                    try {
                        console.log('Sending DELETE request to:', `/api/posts/${postId}`);
                        const response = await fetch(`/api/posts/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        console.log('DELETE response status:', response.status);
                        const result = await response.json();
                        console.log('DELETE response:', result);

                        if (response.ok) {
                            showPopup('Post deleted successfully!', true);
                            // Refresh the feed to remove the deleted post
                            await loadFeed();
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

        // Edit post logic (for CEOs on their own posts)
        document.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                const card = this.closest('.product-card');
                const descElement = card.querySelector('.product-desc p');
                const priceElement = card.querySelector('.product-price span');
                const negotiableBadge = card.querySelector('.negotiable-badge');

                if (this.textContent === 'Edit Post') {
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

                    this.textContent = 'Save Changes';
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
                            // Refresh the feed to show updated post
                            loadFeed();
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
        });
    }

    // Notifications
    async function loadNotifications() {
        if (!token) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (notifBadge) {
                    notifBadge.textContent = data.unreadCount;
                    notifBadge.style.display = data.unreadCount > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    if (notifIcon) {
        notifIcon.addEventListener('click', function() {
            window.location.href = 'notifications.html';
        });
    }

    // Initial load
    loadFeed();
    if (notifBadge) loadNotifications();

    // Post Creation Modal Functionality
    // const addPostBtn = document.getElementById('add-post-btn');
    const postModal = document.getElementById('post-modal');
    const postModalClose = document.getElementById('post-modal-close');
    const createPostForm = document.getElementById('create-post-form');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const postLoading = document.getElementById('post-loading');

    // Open modal
    if (addPostBtn) {
        addPostBtn.addEventListener('click', function() {
            // Check if user is CEO (only CEOs can create posts)
            if (userRole !== 'CEO') {
                showPopup('Only CEOs can create product posts.', false);
                return;
            }
            postModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    // Close modal
    if (postModalClose) {
        postModalClose.addEventListener('click', function() {
            postModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            createPostForm.reset();
        });
    }

    // Close modal when clicking outside
    if (postModal) {
        postModal.addEventListener('click', function(e) {
            if (e.target === postModal) {
                postModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                createPostForm.reset();
            }
        });
    }

    // Handle post creation form submission
    if (createPostForm) {
        createPostForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const description = document.getElementById('post-description').value.trim();
            const price = document.getElementById('post-price').value;
            const imageInput = document.getElementById('post-image');

            // Client-side validation
            if (!description) {
                showPopup('Please enter a product description.', false);
                return;
            }
            if (!price || parseFloat(price) <= 0) {
                showPopup('Please enter a valid price greater than 0.', false);
                return;
            }
            if (!imageInput.files[0]) {
                showPopup('Please select a product image.', false);
                return;
            }

            postSubmitBtn.disabled = true;
            postSubmitBtn.textContent = 'Creating...';
            postLoading.style.display = 'block';

            try {
                const formData = new FormData();
                formData.append('description', description);
                formData.append('price', price);
                formData.append('negotiable', document.getElementById('post-negotiable').value);
                formData.append('productImage', imageInput.files[0]);

                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    showPopup('Post created successfully!', true);
                    postModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    createPostForm.reset();
                    // Refresh the feed to show the new post immediately
                    await loadFeed();
                } else {
                    if (response.status === 401) {
                        showPopup('Your session has expired. Please log in again.', false);
                        setTimeout(() => {
                            localStorage.removeItem('user');
                            window.location.href = 'login.html';
                        }, 2000);
                    } else if (response.status === 403) {
                        showPopup('Only CEOs can create posts.', false);
                    } else {
                        showPopup(result.message || 'Failed to create post. Please try again.', false);
                    }
                }

            } catch (error) {
                console.error('Post creation error:', error);
                showPopup('An error occurred while creating your post. Please check your connection and try again.', false);
            } finally {
                postSubmitBtn.disabled = false;
                postSubmitBtn.textContent = 'Create Post';
                postLoading.style.display = 'none';
            }
        });
    }

    // Logout functionality
    const sideLogoutBtn = document.getElementById('side-logout-btn');
    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                // Call logout API endpoint to invalidate session on server
                const res = await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Clear all user data from localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('cart');
                localStorage.removeItem('notifications');
                
                // Redirect to login page
                window.location.href = 'login.html';
            } catch (err) {
                console.error('Logout error:', err);
                // Even if logout fails, clear local data and redirect
                localStorage.removeItem('user');
                localStorage.removeItem('cart');
                window.location.href = 'login.html';
            }
        });
    }

    // Slide-in menu functionality and profile info
    // const sideMenu = document.getElementById('side-menu');
    const openMenu = document.getElementById('open-menu');
    const closeMenu = document.getElementById('close-menu');

    // Load and display user profile info in sidebar
    async function loadUserSidebarInfo() {
        if (!user || !user.id) return;

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
            }
        } catch (error) {
            console.error('Error fetching user profile for sidebar:', error);
        }

        // Populate sidebar with user data
        document.getElementById('side-profile-username').textContent = user.username || '';
        document.getElementById('side-profile-email').textContent = user.email || '';
        document.getElementById('side-profile-role').textContent = user.role ? `Role: ${user.role}` : '';
        document.getElementById('side-profile-bio').textContent = user.bio || '';
        document.getElementById('side-profile-pic').src = user.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
    }

    if (user) {
        loadUserSidebarInfo();
    }

    if (openMenu && sideMenu) {
        openMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            sideMenu.classList.add('active');
        });
    }
    if (closeMenu && sideMenu) {
        closeMenu.addEventListener('click', function() {
            sideMenu.classList.remove('active');
        });
    }
    document.addEventListener('click', function(event) {
        if (
            sideMenu.classList.contains('active') &&
            !sideMenu.contains(event.target) &&
            event.target !== openMenu
        ) {
            sideMenu.classList.remove('active');
        }
    });

    // Chat button functionality
    const chatBtn = document.getElementById('chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', function() {
            showPopup('Chat feature coming soon! You will be able to chat with other registered users.', false);
        });
    }

    // Profile button functionality
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            window.location.href = 'my-posts.html';
        });
    }

    // Update cart badge with number of items (only for customers)
    // const cartBtn = document.getElementById('cart-btn');
    // const cartBadge = document.getElementById('cart-badge');
    if (userRole === 'customer') {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        if (cartItems.length > 0) {
            cartBadge.textContent = cartItems.length;
            cartBadge.style.display = 'inline-block';
        } else {
            cartBadge.style.display = 'none';
        }
        if (cartBtn) {
            cartBtn.style.display = 'inline-flex';
            cartBtn.addEventListener('click', function() {
                window.location.href = 'cart.html';
            });
        }
    } else {
        // Hide cart button for CEOs
        if (userRole==='CEOs') {
            cartBtn.style.display = 'none';
        }
    }

    // Search bar functionality
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    searchToggle.addEventListener('click', function() {
        if (searchBar.style.display === 'none' || !searchBar.style.display) {
            searchBar.style.display = 'inline-block';
            searchBar.focus();
        } else {
            searchBar.style.display = 'none';
            searchBar.value = '';
        }
    });
    searchBar.addEventListener('input', async function() {
        const query = searchBar.value.trim().toLowerCase();
        if (!query) return;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        feedPosts.innerHTML = data.posts.map(post => `
            <div class="feed-post-card">
                <div class="feed-post-header">
                    <img class="feed-post-avatar" src="${post.author?.profilePictureUrl || './default-avatar.png'}" alt="Profile Picture" />
                    <div>
                        <span class="feed-post-username">${post.author?.username || 'Unknown'}</span>
                        <span class="feed-post-date">${new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div class="feed-post-content">${post.content}</div>
                ${post.videoUrl ? `<video class="feed-post-video" src="${post.videoUrl}" controls></video>` : ''}
            </div>
        `).join('');
    });

    // Side menu icon logic
    const openMenuBtn = document.getElementById('open-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    if (openMenuBtn && sideMenu) {
        openMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sideMenu.classList.add('active');
        });
    }
    if (closeMenuBtn && sideMenu) {
        closeMenuBtn.addEventListener('click', function() {
            sideMenu.classList.remove('active');
        });
    }
    document.addEventListener('click', function(event) {
        if (
            sideMenu.classList.contains('active') &&
            !sideMenu.contains(event.target) &&
            event.target !== openMenuBtn
        ) {
            sideMenu.classList.remove('active');
        }
    });
});