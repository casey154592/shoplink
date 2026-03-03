document.addEventListener('DOMContentLoaded', async function() {
    const cartItemsDiv = document.getElementById('cart-items');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (!cart.length) {
        cartItemsDiv.innerHTML = '<div class="empty-cart">Your cart is empty.</div>';
        return;
    }

    // Fetch product details from backend
    const res = await fetch('/api/posts');
    const posts = await res.json();

    // Filter posts that are in the cart
    const cartPosts = posts.filter(post => cart.includes(post._id));

    if (!cartPosts.length) {
        cartItemsDiv.innerHTML = '<div class="empty-cart">Your cart is empty.</div>';
        return;
    }

    // helper to build a grid of media items
    function getMediaHtml(mediaArray) {
        if (!mediaArray || mediaArray.length === 0) return '';
        let html = '<div class="cart-item-media">';
        mediaArray.forEach(item => {
            if (item.type === 'video') {
                html += `<video controls><source src="${item.url}" type="video/mp4">Your browser does not support video.</video>`;
            } else {
                html += `<img src="${item.url}" alt="Product Image">`;
            }
        });
        html += '</div>';
        return html;
    }

    cartItemsDiv.innerHTML = cartPosts.map(post => {
        const mediaHtml = getMediaHtml(post.media || (post.imageUrl ? [{ url: post.imageUrl, type: 'image' }] : []));
        return `
        <div class="cart-item" data-ceo-id="${post.ceoId}" data-post-id="${post._id}">
            ${mediaHtml}
            <div class="cart-item-details">
                <div class="cart-item-title">${post.description?.slice(0, 30) || 'Product'}</div>
                <div class="cart-item-desc">${post.description || ''}</div>
                <div>
                    <span class="cart-item-price">₦${post.price}</span>
                    <span class="cart-item-neg" style="background:${post.negotiable ? '#7b2ff2' : '#888'};color:#fff;">
                        ${post.negotiable ? 'Negotiable' : 'Not Negotiable'}
                    </span>
                </div>
                <button class="cart-buy-btn" data-ceo-id="${post.ceoId}" data-post-id="${post._id}">Buy</button>
            </div>
        </div>
    `}).join('');

    // Buy button logic
    document.querySelectorAll('.cart-buy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const ceoId = this.dataset.ceoId;
            const postId = this.dataset.postId;
            // Redirect to ceo-public.html with ceoId and postId as query params
            window.location.href = `ceo-public.html?ceoId=${encodeURIComponent(ceoId)}&postId=${encodeURIComponent(postId)}`;
        });
    });

    // Click whole cart item to view CEO profile + product
    document.querySelectorAll('.cart-item').forEach(item => {
        item.addEventListener('click', function() {
            const ceoId = this.dataset.ceoId;
            const postId = this.dataset.postId;
            if (ceoId && postId) {
                window.location.href = `ceo-public.html?ceoId=${encodeURIComponent(ceoId)}&postId=${encodeURIComponent(postId)}`;
            }
        });
    });
});