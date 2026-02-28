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

    // helper to get first media element
    function getFirstMediaPost(post) {
        if (post.media && post.media.length > 0) {
            return post.media[0];
        }
        // fallback to legacy imageUrl
        if (post.imageUrl) {
            return { url: post.imageUrl, type: 'image' };
        }
        return null;
    }

    cartItemsDiv.innerHTML = cartPosts.map(post => {
        const media = getFirstMediaPost(post);
        let mediaHtml = '';
        if (media) {
            if (media.type === 'video') {
                mediaHtml = `<video controls class="cart-item-img"><source src="${media.url}" type="video/mp4">Your browser does not support video.</video>`;
            } else {
                mediaHtml = `<img src="${media.url}" alt="Product Image" class="cart-item-img">`;
            }
        }
        return `
        <div class="cart-item">
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
    `).join('');

    // Buy button logic
    document.querySelectorAll('.cart-buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ceoId = this.dataset.ceoId;
            const postId = this.dataset.postId;
            // Redirect to ceo-public.html with ceoId and postId as query params
            window.location.href = `ceo-public.html?ceoId=${encodeURIComponent(ceoId)}&postId=${encodeURIComponent(postId)}`;
        });
    });
});