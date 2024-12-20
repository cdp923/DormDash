async function validateForm(event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Extract form values
    let fullName = document.forms["signUpForm"]["fullName"].value; // Get the full name
    let email = document.forms["signUpForm"]["email"].value; // Get the email address
    let password = document.forms["signUpForm"]["password"].value; // Get the password
    let checkPassword = document.forms["signUpForm"]["checkPassword"].value; // Confirm the password
    let cashApp = document.forms["signUpForm"]["cashApp"].value.trim(); // Get the CashApp username, trim spaces
    let venmo = document.forms["signUpForm"]["venmo"].value.trim(); // Get the Venmo username, trim spaces

    // Validate passwords match
    if (password !== checkPassword) {
        alert("Passwords do not match!"); // Notify user of mismatch
        return false; // Stop further execution
    }

    // Validate CashApp username if provided
    if (cashApp && !cashApp.startsWith('$')) {
        alert('CashApp username must start with "$".'); // Notify user of invalid format
        return false; // Stop further execution
    }

    // Validate Venmo username if provided
    if (venmo && !venmo.startsWith('@')) {
        alert('Venmo username must start with "@".'); // Notify user of invalid format
        return false; // Stop further execution
    }

    try {
        // Send form data to the backend
        let response = await fetch('http://localhost:3000/signup', {
            method: 'POST', // Use POST to send data
            headers: { 'Content-Type': 'application/json' }, // Specify JSON format
            body: JSON.stringify({ fullName, email, password, cashApp, venmo }) // Include user details
        });

        let result = await response.text(); // Parse the response as text
        if (response.ok) {
            alert(result); // Notify user of successful sign-up
            window.location.href = 'Login.html'; // Redirect to login page
        } else {
            alert(result); // Display error message from the server
        }
    } catch (err) {
        // Handle unexpected errors
        console.error('Error:', err); // Log error details for debugging
        alert('An error occurred. Please try again.'); // Notify user of the error
    }
}
