// Simple Authentication Script for Creative Section
// Add this script to basic.html before the closing </body> tag

function checkAuth() {
    const isAuthenticated = localStorage.getItem('creativeAuth') === 'true';
    const userEmail = localStorage.getItem('creativeUserEmail');
    
    if (isAuthenticated && userEmail) {
        document.getElementById('loginSection').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('userEmail').textContent = userEmail;
        document.getElementById('userAvatar').textContent = userEmail.charAt(0).toUpperCase();
    } else {
        document.getElementById('loginSection').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Simple demo authentication - in production, use Supabase Auth
    if (email && password) {
        localStorage.setItem('creativeAuth', 'true');
        localStorage.setItem('creativeUserEmail', email);
        checkAuth();
    } else {
        errorDiv.textContent = 'Please enter email and password';
        errorDiv.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('creativeAuth');
    localStorage.removeItem('creativeUserEmail');
    checkAuth();
}

// Initialize auth check and event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});
