document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    const userId = user?.id;
    const userRole = user?.role;
    const feedPosts = document.getElementById('feed-posts');
    const notifBadge = document.getElementById('notification-badge');
    const notifIcon = document.getElementById('notification-icon');

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
        posts.forEach(post => {
            const isFollowing = (post.author?.followers || []).includes(userId);
            const showFollowBtn = userRole === 'customer' && post.author && post.author.id !== userId && !isFollowing;
            const followBtnHtml = showFollowBtn
                ? `<button class="follow-ceo-btn" data-ceo-id="${post.author.id}"><i class="fa fa-user-plus"></i> Add Ceo</button>`
                : '';
            const negotiableBadge = post.negotiable
                ? `<span class="negotiable-badge">Negotiable</span>`
                : `<span class="negotiable-badge" style="background:#888;">Not Negotiable</span>`;
            feedPosts.innerHTML += `
                <div class="product-card">
                    <div class="product-card-header">
                        <img src="${post.author?.profilePictureUrl || './default-avatar.png'}" alt="Ceo Profile" class="product-ceo-avatar">
                        <div class="product-ceo-info">
                            <span class="product-ceo-name">${post.author?.username || 'Unknown'}</span>
                            <span class="product-ceo-role">CEO</span>
                        </div>
                        ${followBtnHtml}
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
                        ${userRole === 'customer' ? `<button class="add-to-cart-btn" data-post-id="${post._id}">Add to Cart</button>` : ''}
                    </div>
                </div>
            `;
        });

        // Follow Ceo button logic
        document.querySelectorAll('.follow-ceo-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const ceoId = this.dataset.ceoId;
                const res = await fetch(`/api/posts/follow/${ceoId}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    this.textContent = 'Following';
                    this.disabled = true;
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
                    alert('Added to cart!');
                } else {
                    alert('Already in cart!');
                }
            });
        });
    }

    // Notifications
    async function loadNotifications() {
        if (!token) return;
        const res = await fetch('/api/posts/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const notifications = await res.json();
        if (notifBadge) notifBadge.textContent = notifications.filter(n => !n.read).length;
        // Optionally, show notifications in a modal or dropdown
        if (notifications.length > 0) {
            alert('Notifications:\n' + notifications.map(n => n.content).join('\n'));
        } else {
            alert('No new notifications.');
        }
    }
    if (notifIcon) {
        notifIcon.addEventListener('click', loadNotifications);
    }

    // Initial load
    loadFeed();
    if (notifBadge) loadNotifications();

    // Logout functionality
    const sideLogoutBtn = document.getElementById('side-logout-btn');
    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Slide-in menu functionality and profile info
    const sideMenu = document.getElementById('side-menu');
    const openMenu = document.getElementById('open-menu');
    const closeMenu = document.getElementById('close-menu');

    if (user) {
        document.getElementById('side-profile-username').textContent = user.username || '';
        document.getElementById('side-profile-email').textContent = user.email || '';
        document.getElementById('side-profile-role').textContent = user.role ? `Role: ${user.role}` : '';
        document.getElementById('side-profile-bio').textContent = user.bio || '';
        document.getElementById('side-profile-pic').src = user.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
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
            alert('Chat feature coming soon! You will be able to chat with other registered users.');
        });
    }

    // Update cart badge with number of items
    const cartBtn = document.getElementById('cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartBadge.textContent = cartItems.length;
        cartBadge.style.display = 'inline-block';
    } else {
        cartBadge.style.display = 'none';
    }
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            window.location.href = 'cart.html';
        });
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