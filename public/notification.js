document.addEventListener('DOMContentLoaded', async function() {
        const list = document.getElementById('notification-list');
        const empty = document.getElementById('empty-notifications');
        // Get user from localStorage (adjust key as needed)
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        try {
            const res = await fetch('/api/posts/notifications', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const notifications = await res.json();
            if (!notifications.length) {
                empty.style.display = 'block';
                return;
            }
            notifications.forEach(n => {
                const li = document.createElement('li');
                li.className = 'notification-item';
                li.innerHTML = `
                    <span class="notification-icon"><i class="fa fa-bell"></i></span>
                    <div class="notification-content">
                        <div class="notification-message">${n.message}</div>
                        <div class="notification-date">${new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                `;
                list.appendChild(li);
            });
        } catch (err) {
            empty.textContent = 'Could not load notifications.';
            empty.style.display = 'block';
        }
    });
    