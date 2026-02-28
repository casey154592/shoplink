document.addEventListener('DOMContentLoaded', async function() {
    // Popup message function
    function showPopup(msg, isSuccess = true) {
        const popup = document.getElementById('popup-message');
        const popupText = document.getElementById('popup-text');
        popup.style.borderLeftColor = isSuccess ? '#7b2ff2' : '#db4437';
        popupText.textContent = msg;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 3500);
    }

    // Close popup functionality
    const popupClose = document.getElementById('popup-close');
    if (popupClose) {
        popupClose.addEventListener('click', () => {
            document.getElementById('popup-message').classList.remove('show');
        });
    }

    // Get user and transaction info
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    const userId = user?.id;
    const userRole = user?.role;

    // Get transaction ID from URL
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('id');

    // Check authentication
    if (!user || !token || !transactionId) {
        if (!transactionId) {
            alert('No transaction selected');
        }
        window.location.href = 'login.html';
        return;
    }

    let transaction = null;
    let otherParty = null;

    // Load transaction details
    async function loadTransaction() {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                showPopup('Failed to load transaction', false);
                setTimeout(() => window.location.href = 'transactions.html', 2000);
                return;
            }

            transaction = await response.json();
            otherParty = userRole === 'customer' ? transaction.ceoId : transaction.customerId;

            // Update header
            document.getElementById('other-avatar').src = otherParty.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParty.username)}`;
            document.getElementById('other-name').textContent = otherParty.username;
            document.getElementById('other-role').textContent = userRole === 'customer' ? 'CEO' : 'Customer';
            
            // Update status badge
            const statusBadge = document.getElementById('status-badge');
            statusBadge.textContent = transaction.status.toUpperCase();
            statusBadge.className = `transaction-status status-${transaction.status}`;

            // Update sidebar
            document.getElementById('trans-amount').textContent = `₦${transaction.amount.toLocaleString()}`;
            document.getElementById('trans-status').textContent = transaction.status.toUpperCase();
            document.getElementById('trans-date').textContent = new Date(transaction.createdAt).toLocaleDateString();

            // Show product details
            if (transaction.postId) {
                const productDetails = document.getElementById('product-details');
                productDetails.innerHTML = `
                    <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd;">
                        <div style="font-weight: bold; color: #666;">Product</div>
                        <div style="font-size: 0.85rem; color: #333;">${transaction.postId.description.substring(0, 50)}...</div>
                        <div style="font-size: 0.85rem; color: #666;">₦${transaction.postId.price}</div>
                    </div>
                `;
            }

            // Setup action buttons based on role and status
            setupActionButtons();

            // Enable message input
            document.getElementById('message-input').disabled = false;
            document.getElementById('send-btn').disabled = false;

            // Load messages
            await loadMessages();

        } catch (error) {
            console.error('Error loading transaction:', error);
            showPopup('Error loading transaction', false);
        }
    }

    // Load messages
    async function loadMessages() {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                console.error('Failed to load messages');
                return;
            }

            const data = await response.json();
            displayMessages(data.messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Display messages
    function displayMessages(messages) {
        const messagesArea = document.getElementById('messages-area');
        
        if (messages.length === 0) {
            messagesArea.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
            return;
        }

        messagesArea.innerHTML = messages.map(msg => {
            const isSent = msg.senderId === userId;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div>
                        <div class="message-bubble">${msg.text}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Send message
    async function sendMessage(text) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                document.getElementById('message-input').value = '';
                await loadMessages();
            } else {
                showPopup('Failed to send message', false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showPopup('Error sending message', false);
        }
    }

    // Setup action buttons
    function setupActionButtons() {
        const actionsSection = document.getElementById('actions-section');
        const actionsContainer = document.getElementById('transaction-actions');

        if (userRole === 'customer') {
            // Customer can only cancel pending transactions
            if (transaction.status === 'pending') {
                actionsContainer.innerHTML = `
                    <button class="action-btn action-btn-danger" id="cancel-btn">
                        <i class="fa fa-times"></i> Cancel Transaction
                    </button>
                `;
                document.getElementById('cancel-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to cancel this transaction?')) {
                        updateTransactionStatus('cancelled');
                    }
                });
            }
        } else if (userRole === 'CEO') {
            // CEO can accept, reject, complete, or fail
            if (transaction.status === 'pending') {
                actionsContainer.innerHTML = `
                    <button class="action-btn action-btn-primary" id="accept-btn">
                        <i class="fa fa-check"></i> Accept
                    </button>
                    <button class="action-btn action-btn-danger" id="reject-btn">
                        <i class="fa fa-times"></i> Reject
                    </button>
                `;
                document.getElementById('accept-btn').addEventListener('click', () => {
                    if (confirm('Accept this transaction request?')) {
                        updateTransactionStatus('in_progress');
                    }
                });
                document.getElementById('reject-btn').addEventListener('click', () => {
                    if (confirm('Reject this transaction?')) {
                        updateTransactionStatus('cancelled');
                    }
                });
            } else if (transaction.status === 'in_progress') {
                actionsContainer.innerHTML = `
                    <button class="action-btn action-btn-primary" id="complete-btn">
                        <i class="fa fa-check"></i> Mark Complete
                    </button>
                    <button class="action-btn action-btn-danger" id="fail-btn">
                        <i class="fa fa-times"></i> Mark Failed
                    </button>
                `;
                document.getElementById('complete-btn').addEventListener('click', () => {
                    if (confirm('Mark this transaction as completed?')) {
                        updateTransactionStatus('completed');
                    }
                });
                document.getElementById('fail-btn').addEventListener('click', () => {
                    if (confirm('Mark this transaction as failed?')) {
                        updateTransactionStatus('failed');
                    }
                });
            }
        }

        actionsSection.style.display = actionsContainer.innerHTML ? 'block' : 'none';
    }

    // Update transaction status
    async function updateTransactionStatus(status) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                showPopup('Transaction updated successfully', true);
                await loadTransaction();
            } else {
                const error = await response.json();
                showPopup(error.message || 'Failed to update transaction', false);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            showPopup('Error updating transaction', false);
        }
    }

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'transactions.html';
    });

    // Toggle sidebar on mobile
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('transaction-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Send message on button click
    document.getElementById('send-btn').addEventListener('click', () => {
        const input = document.getElementById('message-input');
        if (input.value.trim()) {
            sendMessage(input.value.trim());
        }
    });

    // Send message on Enter key
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('send-btn').click();
        }
    });

    // Load initial data
    await loadTransaction();

    // Reload messages every 3 seconds for real-time updates (simple polling)
    setInterval(loadMessages, 3000);
});
