document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(localStorage.getItem('user'));
    // if (!user || !user.email) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    const feedPosts = document.getElementById('feed-posts');
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        if (!Array.isArray(posts) || posts.length === 0) {
            feedPosts.innerHTML = '<p class="no-posts">No posts yet.</p>';
            return;
        }
        feedPosts.innerHTML = posts.map(post => `
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
    } catch (err) {
        feedPosts.innerHTML = '<p class="no-posts">Failed to load posts.</p>';
    }

    // Logout functionality
    document.getElementById('side-logout-btn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Slide-in menu functionality and profile info
    const sideMenu = document.getElementById('side-menu');
    const openMenu = document.getElementById('open-menu');
    const closeMenu = document.getElementById('close-menu');
    const sideLogoutBtn = document.getElementById('side-logout-btn');

    // Show user profile info in the menu
    if (user) {
        document.getElementById('side-profile-username').textContent = user.username || '';
        document.getElementById('side-profile-email').textContent = user.email || '';
        document.getElementById('side-profile-role').textContent = user.role ? `Role: ${user.role}` : '';
        document.getElementById('side-profile-bio').textContent = user.bio || '';
        document.getElementById('side-profile-pic').src = user.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
    }

    openMenu.addEventListener('click', function() {
        sideMenu.style.width = '260px';
    });

    closeMenu.addEventListener('click', function() {
        sideMenu.style.width = '0';
    });

    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Chat button functionality
    const chatBtn = document.getElementById('chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', function() {
            alert('Chat feature coming soon! You will be able to chat with other registered users.');
            // You can link to a chat page or open a chat modal here in the future
        });
    }

    // Example: Update cart badge with number of items
    const cartBtn = document.getElementById('cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    // Suppose you store cart items in localStorage as an array
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartBadge.textContent = cartItems.length;
        cartBadge.style.display = 'inline-block';
    } else {
        cartBadge.style.display = 'none';
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            window.location.href = 'cart.html'; // Or your cart page
        });
    }

    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');

    // Toggle search bar visibility
    searchToggle.addEventListener('click', function() {
        if (searchBar.style.display === 'none' || !searchBar.style.display) {
            searchBar.style.display = 'inline-block';
            searchBar.focus();
        } else {
            searchBar.style.display = 'none';
            searchBar.value = '';
            // Optionally, reload all posts here
        }
    });

    // Search posts or users as user types
    searchBar.addEventListener('input', async function() {
        const query = searchBar.value.trim().toLowerCase();
        if (!query) {
            // Optionally, reload all posts if search is cleared
            return;
        }
        // Fetch posts and users matching the query
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        // Render search results (posts and/or users)
        // Example: show posts in feedPosts
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
        // Optionally, render users if you want to show user search results
    });

    // Example for side menu icon
    const openMenuBtn = document.getElementById('open-menu');
    const closeMenuBtn = document.getElementById('close-menu');

    if (openMenuBtn && sideMenu) {
        openMenuBtn.addEventListener('click', function() {
            sideMenu.style.display = 'block';
        });
    }
    if (closeMenuBtn && sideMenu) {
        closeMenuBtn.addEventListener('click', function() {
            sideMenu.style.display = 'none';
        });
    }

    // Repeat similar checks for other icon buttons
    // Example: notification, cart, chat, etc.
});