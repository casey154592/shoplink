document.addEventListener('DOMContentLoaded', async function() {
    // Show popup message
    function showPopup(msg, isSuccess = true) {
        // Simple alert for now
        alert(msg);
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    // Check if user is authenticated
    if (!user || !token) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }

    // Load transaction statistics
    async function loadTransactionStats() {
        try {
            const response = await fetch(`/api/transactions/stats/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const stats = await response.json();
                displayStats(stats);
            }
        } catch (error) {
            console.error('Error loading transaction stats:', error);
        }
    }

    // Display statistics
    function displayStats(stats) {
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.inProgress}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completed}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₦${stats.totalAmount.toLocaleString()}</div>
                <div class="stat-label">Total Amount</div>
            </div>
        `;
    }

    // Load transactions
    async function loadTransactions() {
        try {
            const response = await fetch('/api/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const transactions = await response.json();
            displayTransactions(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
            document.getElementById('transactions-list').innerHTML = '<div class="no-transactions">Failed to load transactions. Please try again.</div>';
        }
    }

    // Display transactions
    function displayTransactions(transactions) {
        const transactionsList = document.getElementById('transactions-list');

        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="no-transactions">You haven\'t engaged in any transactions yet.</div>';
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction => {
            const statusClass = `status-${transaction.status}`;
            const statusText = transaction.status.replace('_', ' ').toUpperCase();

            let actionButtons = '';

            if (user.role === 'customer' && transaction.status === 'pending') {
                actionButtons = `<button class="btn btn-danger cancel-transaction" data-id="${transaction._id}">Cancel</button>`;
            } else if (user.role === 'CEO') {
                if (transaction.status === 'pending') {
                    actionButtons = `<button class="btn btn-success accept-transaction" data-id="${transaction._id}">Accept</button>
                                    <button class="btn btn-danger reject-transaction" data-id="${transaction._id}">Reject</button>`;
                } else if (transaction.status === 'in_progress') {
                    actionButtons = `<button class="btn btn-primary complete-transaction" data-id="${transaction._id}">Mark Complete</button>
                                    <button class="btn btn-danger fail-transaction" data-id="${transaction._id}">Mark Failed</button>`;
                }
            }

            const otherParty = user.role === 'customer' ? transaction.ceoId : transaction.customerId;
            const otherPartyName = user.role === 'customer' ? (otherParty.brandName || otherParty.username) : otherParty.username;

            return `
                <div class="transaction-card">
                    <div class="transaction-header">
                        <div class="transaction-parties">
                            <div class="party-info">
                                <img src="${otherParty.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(otherPartyName)}" alt="Avatar" class="party-avatar">
                                <div>
                                    <strong>${otherPartyName}</strong>
                                    <div>${user.role === 'customer' ? 'CEO' : 'Customer'}</div>
                                </div>
                            </div>
                        </div>
                        <span class="transaction-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="transaction-content">
                        <div class="transaction-amount">₦${transaction.amount.toLocaleString()}</div>
                        <div class="transaction-description">${transaction.description}</div>
                        <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                            Created: ${new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="transaction-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for action buttons
        attachTransactionActions();
    }

    // Attach event listeners to transaction action buttons
    function attachTransactionActions() {
        // Cancel transaction (customer)
        document.querySelectorAll('.cancel-transaction').forEach(btn => {
            btn.addEventListener('click', async function() {
                const transactionId = this.dataset.id;
                if (confirm('Are you sure you want to cancel this transaction?')) {
                    await updateTransactionStatus(transactionId, 'cancelled');
                }
            });
        });

        // Accept transaction (CEO)
        document.querySelectorAll('.accept-transaction').forEach(btn => {
            btn.addEventListener('click', async function() {
                const transactionId = this.dataset.id;
                if (confirm('Are you sure you want to accept this transaction?')) {
                    await updateTransactionStatus(transactionId, 'in_progress');
                }
            });
        });

        // Reject transaction (CEO)
        document.querySelectorAll('.reject-transaction').forEach(btn => {
            btn.addEventListener('click', async function() {
                const transactionId = this.dataset.id;
                if (confirm('Are you sure you want to reject this transaction?')) {
                    await updateTransactionStatus(transactionId, 'cancelled');
                }
            });
        });

        // Complete transaction (CEO)
        document.querySelectorAll('.complete-transaction').forEach(btn => {
            btn.addEventListener('click', async function() {
                const transactionId = this.dataset.id;
                if (confirm('Mark this transaction as completed?')) {
                    await updateTransactionStatus(transactionId, 'completed');
                }
            });
        });

        // Fail transaction (CEO)
        document.querySelectorAll('.fail-transaction').forEach(btn => {
            btn.addEventListener('click', async function() {
                const transactionId = this.dataset.id;
                if (confirm('Mark this transaction as failed?')) {
                    await updateTransactionStatus(transactionId, 'failed');
                }
            });
        });
    }

    // Update transaction status
    async function updateTransactionStatus(transactionId, status) {
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
                const result = await response.json();
                showPopup(result.message || 'Transaction updated successfully');
                loadTransactions();
                loadTransactionStats();
            } else {
                const error = await response.json();
                showPopup(error.message || 'Failed to update transaction', false);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            showPopup('An error occurred while updating the transaction', false);
        }
    }

    // Load posts for transaction creation (customers only)
    async function loadPostsForTransaction() {
        if (user.role !== 'customer') return;

        try {
            const response = await fetch('/api/posts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const posts = await response.json();
                const postSelect = document.getElementById('transaction-post');
                postSelect.innerHTML = '<option value="">Choose a post...</option>';

                posts.forEach(post => {
                    const option = document.createElement('option');
                    option.value = post._id;
                    option.textContent = `${post.author?.brandName || post.author?.username}: ${post.description.substring(0, 50)}...`;
                    postSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    // Handle transaction form submission
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const postId = document.getElementById('transaction-post').value;
            const amount = document.getElementById('transaction-amount').value;
            const description = document.getElementById('transaction-description').value;

            try {
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ postId, amount, description })
                });

                if (response.ok) {
                    const result = await response.json();
                    showPopup(result.message || 'Transaction created successfully');
                    document.getElementById('transaction-modal').style.display = 'none';
                    transactionForm.reset();
                    loadTransactions();
                    loadTransactionStats();
                } else {
                    const error = await response.json();
                    showPopup(error.message || 'Failed to create transaction', false);
                }
            } catch (error) {
                console.error('Error creating transaction:', error);
                showPopup('An error occurred while creating the transaction', false);
            }
        });
    }

    // Modal functionality
    const modal = document.getElementById('transaction-modal');
    const modalClose = document.querySelector('.modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Add "Create Transaction" button for customers
    if (user.role === 'customer') {
        const header = document.querySelector('.transactions-header');
        const createBtn = document.createElement('button');
        createBtn.className = 'btn btn-primary';
        createBtn.textContent = 'Create New Transaction';
        createBtn.style.marginTop = '1rem';
        createBtn.addEventListener('click', function() {
            loadPostsForTransaction();
            modal.style.display = 'block';
        });
        header.appendChild(createBtn);
    }

    // Initialize the page
    await loadTransactionStats();
    await loadTransactions();
});