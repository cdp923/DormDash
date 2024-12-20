document.addEventListener('DOMContentLoaded', () => {
    // Select the container element where cart items will be displayed
    const cartContainer = document.getElementById('cartContainer');
    cartContainer.innerHTML = ''; // Clear any existing content in the cart container to prepare for new items

    // Fetch cart items for the logged-in user from the backend
    fetch('/api/user/cart')
        .then(response => response.json()) // Parse the JSON response
        .then(cartItems => {
            cartContainer.innerHTML = ''; // Clear the cart container to ensure it's clean before populating

            // Check if the cart is empty
            if (cartItems.length === 0) {
                // Display a message for users with no items in their cart
                cartContainer.innerHTML = '<p>Your cart is empty.</p>';
                return; // Exit the function as there is nothing to display
            }

            // Loop through each item in the cart and render its details dynamically
            cartItems.forEach(item => {
                const cartItemDiv = document.createElement('div'); // Create a div for each cart item
                cartItemDiv.className = 'cart-item card mb-3 p-3'; // Add Bootstrap classes for styling

                // Title: Display the title of the item
                const title = document.createElement('h5');
                title.textContent = item.title;

                // Description: Display the description of the item
                const description = document.createElement('p');
                description.innerHTML = `<strong>Description:</strong> ${item.description}`;

                // Price: Display the price of the item
                const price = document.createElement('p');
                price.innerHTML = `<strong>Price:</strong> $${item.price}`;

                // Condition: Display the condition of the item (e.g., New, Used)
                const condition = document.createElement('p');
                condition.innerHTML = `<strong>Condition:</strong> ${item.condition}`;

                // Location: Display the item's location (where it can be picked up/delivered)
                const location = document.createElement('p');
                location.innerHTML = `<strong>Location:</strong> ${item.location}`;

                // Contact Information: Display the seller's contact details
                const contactInfo = document.createElement('p');
                contactInfo.innerHTML = `<strong>Contact Info:</strong> ${item.contactInfo}`;

                // Payment Details: Include the seller's payment methods (CashApp, Venmo)
                const paymentDetails = document.createElement('p');
                paymentDetails.innerHTML = `<strong>Seller's Payment Info:</strong> 
                CashApp - ${item.seller.cashApp}, 
                Venmo - ${item.seller.venmo}`;

                // Conditional Rendering: Handle payment status and actions
                if (item.paymentStatus === 'paid') {
                    // If payment is marked as "paid," display a confirmation with the transaction ID
                    const paymentConfirmation = document.createElement('p');
                    paymentConfirmation.className = 'text-success mt-3'; // Style with Bootstrap classes
                    paymentConfirmation.innerHTML = `Payment made with Transaction ID: <strong>${item.transactionId}</strong>`;
                    cartItemDiv.appendChild(paymentConfirmation); // Append the confirmation text to the item div
                } else {
                    // Input for entering the transaction ID
                    const transactionIdInput = document.createElement('input');
                    transactionIdInput.type = 'text'; // Input type for text
                    transactionIdInput.placeholder = 'Enter Transaction ID'; // Placeholder text for guidance
                    transactionIdInput.className = 'form-control mt-2'; // Bootstrap styling

                    // Button for marking the item as paid
                    const markAsPaidBtn = document.createElement('button');
                    markAsPaidBtn.className = 'btn btn-secondary mt-2'; // Bootstrap classes for button styling
                    markAsPaidBtn.textContent = 'Mark as Paid'; // Button text
                    markAsPaidBtn.onclick = () => {
                        const transactionId = transactionIdInput.value; // Retrieve the entered transaction ID
                        handleMarkAsPaid(item._id, transactionId); // Call the handler function to mark the item as paid
                    };

                    // Button for removing the item from the cart
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'btn btn-danger btn-sm'; // Bootstrap classes for small, styled button
                    removeBtn.textContent = 'Remove'; // Button text
                    removeBtn.onclick = () => handleRemoveFromCart(item._id); // Call the remove handler function

                    // Append input and buttons to the item container
                    cartItemDiv.appendChild(transactionIdInput);
                    cartItemDiv.appendChild(markAsPaidBtn);
                    cartItemDiv.appendChild(removeBtn);
                }

                // Append all details of the item to its container div
                cartItemDiv.appendChild(title);
                cartItemDiv.appendChild(description);
                cartItemDiv.appendChild(price);
                cartItemDiv.appendChild(condition);
                cartItemDiv.appendChild(location);
                cartItemDiv.appendChild(contactInfo);
                cartItemDiv.appendChild(paymentDetails);

                // Add the completed item container to the main cart container
                cartContainer.appendChild(cartItemDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching cart:', error); // Log any errors that occur during the fetch request
        });

    // Placeholder for future checkout functionality (currently alerts the user)
    document.getElementById('checkoutButton').addEventListener('click', () => {
        alert('Checkout functionality coming soon!');
    });
});

// Function: Remove an item from the cart
function handleRemoveFromCart(listingId) {
    fetch(`/api/user/cart/remove`, {
        method: 'POST', // Use POST method for making modifications
        headers: { 'Content-Type': 'application/json' }, // Specify JSON format for the request body
        body: JSON.stringify({ listingId }) // Include the listing ID in the body
    })
        .then(response => {
            if (response.ok) {
                alert('Item removed from cart!'); // Notify the user of success
                location.reload(); // Reload the page to reflect the updated cart
            } else {
                alert('Failed to remove item from cart.'); // Notify the user of failure
            }
        })
        .catch(error => {
            console.error('Error removing item from cart:', error); // Log any errors that occur
        });
}

// Function: Mark an item as paid
function handleMarkAsPaid(listingId, transactionId) {
    // Validate the transaction ID before making the request
    if (!transactionId || !transactionId.trim()) {
        alert('Please enter a valid Transaction ID.');
        return; // Exit the function if validation fails
    }

    fetch('/api/listings/markAsPaid', {
        method: 'POST', // Use POST method for modifying data
        headers: { 'Content-Type': 'application/json' }, // Specify JSON format for the request body
        body: JSON.stringify({ listingId, transactionId: transactionId.trim() }) // Include the listing ID and transaction ID
    })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.text(); // Parse the error response
                throw new Error(errorData); // Throw an error for further handling
            }
            return response.text(); // Parse the success response as text
        })
        .then(message => {
            alert(message); // Notify the user of success
            location.reload(); // Refresh the page to reflect changes
        })
        .catch(error => {
            console.error('Error marking payment as paid:', error.message); // Log any errors that occur
            alert(`An error occurred: ${error.message}`); // Notify the user of failure
        });
}
