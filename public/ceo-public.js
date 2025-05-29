document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('ceo-public-container');
    const params = new URLSearchParams(window.location.search);
    const ceoId = params.get('ceoId');
    const postId = params.get('postId');

    if (!ceoId || !postId) {
        container.innerHTML = '<div style="color:#f357a8;">Invalid product or Ceo.</div>';
        return;
    }

    // Fetch Ceo info and product info
    const [usersRes, postsRes] = await Promise.all([
        fetch('/api/users'), // You should have an endpoint to get all users or a single user by ID
        fetch('/api/posts')
    ]);
    const users = await usersRes.json();
    const posts = await postsRes.json();

    const ceo = users.find(u => u._id === ceoId);
    const post = posts.find(p => p._id === postId);

    if (!ceo || !post) {
        container.innerHTML = '<div style="color:#f357a8;">Product or Ceo not found.</div>';
        return;
    }

    container.innerHTML = `
        <div class="ceo-public-header">
            <img src="${ceo.profilePic || './default-avatar.png'}" alt="Ceo Profile" class="ceo-public-avatar">
            <div class="ceo-public-info">
                <div class="ceo-public-name">${ceo.username}</div>
                <div class="ceo-public-role">CEO</div>
                <div class="ceo-public-email">${ceo.email || ''}</div>
            </div>
        </div>
        <img src="${post.imageUrl}" alt="Product Image" class="ceo-public-product-img">
        <div class="ceo-public-product-desc">${post.description}</div>
        <div>
            <span class="ceo-public-product-price">₦${post.price}</span>
            <span class="ceo-public-neg">${post.negotiable ? 'Negotiable' : 'Not Negotiable'}</span>
        </div>
    `;
});