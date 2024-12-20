// Function to validate the login form and send a request to the backend for authentication
async function validateForm(event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Get email and password values from the login form
    let email = document.forms["loginForm"]["email"].value; // Extract the value of the "email" field
    let password = document.forms["loginForm"]["password"].value; // Extract the value of the "password" field

    try {
        // Send a POST request to the login endpoint for authentication
        let response = await fetch('http://localhost:3000/login', {
            method: 'POST', // Use POST method for sending login credentials
            headers: { 'Content-Type': 'application/json' }, // Specify JSON content type
            body: JSON.stringify({ email, password }) // Send email and password in the request body as JSON
        });

        let result = await response.text(); // Parse the response as plain text

        if (response.ok) {
            // If login is successful, display a success message
            alert(result);
            window.location.href = 'profile.html'; // Redirect the user to the profile page
        } else {
            // If login fails, display the error message from the response
            alert(result);
        }
    } catch (err) {
        // Handle any unexpected errors during the fetch request
        console.error('Error:', err); // Log the error details for debugging
        alert('An error occurred. Please try again.'); // Notify the user of an error
    }
}
