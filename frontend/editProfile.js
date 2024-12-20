document.addEventListener('DOMContentLoaded', () => {
    // Fetch current user details and populate form fields
    fetch('/api/user/profile')
        .then(response => response.json())
        .then(data => {
            // Pre-fill the form with current profile details
            document.getElementById('editFullName').value = data.name; // User's full name
            document.getElementById('editEmail').value = data.email; // User's email
            document.getElementById('editCashApp').value = data.cashApp || ''; // Populate CashApp username or default to empty string
            document.getElementById('editVenmo').value = data.venmo || ''; // Populate Venmo username or default to empty string
        })
        .catch(err => console.error('Error fetching profile:', err)); // Log any errors

    // Handle form submission for updating profile
    document.getElementById('editProfileForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        // Get values from the form fields
        const fullName = document.getElementById('editFullName').value; // Updated full name
        const newEmail = document.getElementById('editEmail').value; // Updated email
        const newPassword = document.getElementById('editPassword').value; // Updated password (if provided)
        const cashApp = document.getElementById('editCashApp').value.trim(); // Trim whitespace from CashApp username
        const venmo = document.getElementById('editVenmo').value.trim(); // Trim whitespace from Venmo username

        // Validate CashApp and Venmo usernames
        if (cashApp && !cashApp.startsWith('$')) {
            // Display alert if CashApp username does not start with "$"
            alert('Invalid CashApp username. It must start with "$".');
            return; // Exit early to avoid making the API request
        }
        if (venmo && !venmo.startsWith('@')) {
            // Display alert if Venmo username does not start with "@"
            alert('Invalid Venmo username. It must start with "@".');
            return; // Exit early to avoid making the API request
        }

        try {
            // Make a POST request to update the profile
            const response = await fetch('/api/user/profile/update', {
                method: 'POST', // Use POST method for updating data
                headers: { 'Content-Type': 'application/json' }, // Specify JSON content type
                body: JSON.stringify({ fullName, newEmail, newPassword, cashApp, venmo }) // Send updated details in the request body
            });

            const result = await response.json(); // Parse the response JSON
            if (response.ok) {
                // If the update is successful, display a success message
                alert(result.message);
                window.location.href = 'profile.html'; // Redirect back to the profile page
            } else {
                // If the update fails, display an error message
                alert('Error: ' + result.message);
            }
        } catch (err) {
            console.error('Error updating profile:', err); // Log any errors
            alert('An error occurred. Please try again.'); // Display a general error message
        }
    });
});