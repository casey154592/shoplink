document.addEventListener('DOMContentLoaded', function() {
    // Get user role from localStorage (set after signup)
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role || localStorage.getItem('pendingRole');
    const questionsTitle = document.getElementById('questions-title');
    const questionsList = document.getElementById('questions-list');

    // Example questions
    const questions = {
        CEO: [
            { type: 'text', label: "What is your business name?", name: "businessName" },
            { type: 'text', label: "What is your brand name?", name: "brandName" },
            {
                type: 'select',
                label: "What business do you render to customers?",
                name: "businessType",
                options: [
                    "Fashion",
                    "Electronics",
                    "Groceries",
                    "Beauty",
                    "Home & Living",
                    "Consulting",
                    "Tech Services",
                    "Other"
                ]
            },
            { type: 'text', label: "Describe your target customers?", name: "targetCustomers" }
        ],
        CUSTOMER: [
            {
                type: 'select',
                label: "What products are you interested in?",
                name: "productInterest",
                options: [
                    "Fashion",
                    "Electronics",
                    "Groceries",
                    "Beauty",
                    "Home & Living",
                    "Other"
                ]
            },
            { type: 'text', label: "How did you hear about us?" },
            { type: 'text', label: "Would you like to receive promotional emails?" }
        ]
    };

    if (role && questions[role]) {
        questionsTitle.textContent = `A few quick questions for ${role}s`;
        questionsList.innerHTML = questions[role].map((q, i) => {
            if (q.type === 'select') {
                return `
                <div class="form-group">
                    <label>${q.label}</label>
                    <select name="${q.name || 'q' + i}" required>
                        <option value="">Select an option</option>
                        ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>
                `;
            } else {
                return `
                <div class="form-group">
                    <label>${q.label}</label>
                    <input type="text" name="${q.name || 'q' + i}" />
                </div>
                `;
            }
        }).join('');
    } else {
        questionsTitle.textContent = "A few quick questions";
        questionsList.innerHTML = "";
    }

    document.getElementById('questions-form').onsubmit = async function(e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.email) {
            window.location.href = 'signup.html';
            return;
        }
        const formData = new FormData(this);
        const answers = {};
        for (let [key, value] of formData.entries()) {
            answers[key] = value;
        }

        // Send answers to backend to update user profile
        await fetch('/api/profile/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, answers })
        });

        // Suggest adding another user based on interest
        let suggestion = '';
        if (answers.productInterest) {
            suggestion = `Would you like to add another user interested in ${answers.productInterest}?`;
        } else if (answers.businessType) {
            suggestion = `Would you like to add another user who renders ${answers.businessType} services?`;
        }

        if (suggestion) {
            showSuggestionPopup(suggestion);
        } else {
            window.location.href = 'feed.html';
        }
    };

    document.getElementById('skip-btn').onclick = function() {
        window.location.href = 'feed.html';
    };

    // Helper to show suggestion popup
    function showSuggestionPopup(message) {
        const popup = document.createElement('div');
        popup.className = 'popup-message';
        popup.innerHTML = `
            <span>${message}</span>
            <button id="add-another-user-btn">Add User</button>
            <button id="continue-btn">Continue</button>
        `;
        document.body.appendChild(popup);

        document.getElementById('add-another-user-btn').onclick = function() {
            window.location.href = 'signup.html';
        };
        document.getElementById('continue-btn').onclick = function() {
            window.location.href = 'feed.html';
        };
    }

    // Show/hide loading indicator in your JS (signup.js, questions.js, etc.)
    function showLoading(show) {
        document.getElementById('loading-indicator').style.display = show ? 'block' : 'none';
    }

    // Example usage in async function:
    // showLoading(true);
    // try {
    //     const response = await fetch(...);
    //     // handle response
    // } finally {
    //     showLoading(false);
    // }
});