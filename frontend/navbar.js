// This script dynamically updates the navigation bar based on the user's login status.
document.addEventListener('DOMContentLoaded', () => {
    // Fetch user information to determine if the user is logged in
    fetch('/api/user')
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            const navbar = document.getElementById('dynamicNavbar'); // Get the navbar element
            navbar.innerHTML = ''; // Clear any existing content in the navbar

            if (data.loggedIn) {
                // User is logged in, display account-specific options
                navbar.innerHTML = `
                    <li class="nav-item">
                        <a class="nav-link" href="profile.html">
                            <i class="bi bi-person-circle"></i> Account
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="displayAllListing.html">
                            <i class="bi bi-bag-fill"></i> Shop
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="cart.html">
                            <i class="bi bi-cart-fill"></i> Cart
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="home.html">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </a>
                    </li>
                `;
            } else {
                // User is not logged in, display options to sign up or log in
                navbar.innerHTML = `
                    <li class="nav-item">
                        <a class="nav-link" href="signUp.html">Sign Up</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="Login.html">Login</a>
                    </li>
                `;
            }
        })
        .catch(err => {
            // Handle any errors during the fetch request
            console.error('Error fetching user status:', err);
        });
});