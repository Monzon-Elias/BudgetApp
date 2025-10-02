const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/.netlify/functions';

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save token to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to main app
                window.location.href = 'index.html';
            } else {
                showError(errorMessage, data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(errorMessage, 'Failed to connect to server');
        }
    });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        // Clear previous messages
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.classList.remove('show');
        successMessage.textContent = '';
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showError(errorMessage, 'Passwords do not match');
            return false;
        }
        
        // Validate password length
        if (password.length < 6) {
            showError(errorMessage, 'Password must be at least 6 characters');
            return false;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
        if (response.ok) {
            showSuccess(successMessage, 'Registration successful! You can now login.');
            // Clear form
            registerForm.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
                showError(errorMessage, data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError(errorMessage, 'Failed to connect to server');
        }
    });
}

// Helper functions
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    // Scroll to error message
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

// Toggle password visibility
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '🙈'; // Ocultar
            } else {
                input.type = 'password';
                this.textContent = '👁️'; // Mostrar
            }
        });
    });
}

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initPasswordToggles();
});

// Run auth check
checkAuth();

