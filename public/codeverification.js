let timerInterval;
let timeLeft = 60;

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    document.getElementById('timer').textContent = `Code expires in ${timeLeft}s`;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = `Code expires in ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').textContent = 'Code expired. Please resend.';
        }
    }, 1000);
}

startTimer();

document.getElementById('verify-form').onsubmit = async function(e) {
    e.preventDefault();
    const code = document.getElementById('verify-code').value;
    const email = localStorage.getItem('pendingGoogleEmail');
    if (!email) {
        document.getElementById('verify-message').textContent = "Session expired. Please login again.";
        return;
    }
    const res = await fetch('/api/login/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('pendingGoogleEmail');
        window.location.href = 'feed.html';
    } else {
        document.getElementById('verify-message').textContent = data.message || "Incorrect code. Access denied.";
    }
};

document.getElementById('resend-code').onclick = async function() {
    const email = localStorage.getItem('pendingGoogleEmail');
    if (!email) return;
    const res = await fetch('/api/login/google/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    document.getElementById('verify-message').textContent = data.message;
    startTimer();
};