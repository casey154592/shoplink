document.addEventListener('DOMContentLoaded', async function() {
        const list = document.getElementById('notification-list');
        const empty = document.getElementById('empty-notifications');
        // Get user from localStorage (adjust key as needed)
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        try {
            const res = await fetch('/api/notifications', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            const notifications = data.notifications;
            if (!notifications || notifications.length === 0) {
                empty.style.display = 'block';
                return;
            }
            notifications.forEach(n => {
                const li = document.createElement('li');
                li.className = `notification-item ${!n.isRead ? 'unread' : ''}`;
                li.innerHTML = `
                    <span class="notification-icon"><i class="fa fa-bell"></i></span>
                    <div class="notification-content">
                        <div class="notification-message"><strong>${n.title}:</strong> ${n.message}</div>
                        <div class="notification-date">${new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                `;
                // Add click handler to mark as read
                li.addEventListener('click', async function() {
                    if (!n.isRead) {
                        try {
                            await fetch(`/api/notifications/${n._id}/read`, {
                                method: 'PUT',
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            li.classList.remove('unread');
                            n.isRead = true;
                        } catch (error) {
                            console.error('Error marking notification as read:', error);
                        }
                    }
                });
                list.appendChild(li);
            });
        } catch (err) {
            empty.textContent = 'Could not load notifications.';
            empty.style.display = 'block';
        }
    });
    