document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display user profile information
    fetch('/api/user/profile')
        .then(response => response.json())
        .then(data => {
            // Populate user details in the UI
            document.getElementById('userName').textContent = data.name;
            document.getElementById('userEmail').textContent = data.email;

            // Display payment details for CashApp and Venmo
            document.getElementById('cashAppUsername').textContent = data.cashApp || 'Not provided';
            document.getElementById('venmoUsername').textContent = data.venmo || 'Not provided';
        })
        .catch(err => console.error('Error fetching profile:', err));

    // Fetch and display user listings
    fetch('/api/user/listings')
        .then(response => response.json())
        .then(listings => {
            const listingsContainer = document.getElementById('userListings');
            listingsContainer.innerHTML = ''; // Clear existing listings

            // Handle case when no listings are available
            if (listings.length === 0) {
                listingsContainer.innerHTML = '<p class="text-muted">No listings created.</p>';
                return;
            }

            // Dynamically add each listing to the UI
            listings.forEach(listing => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

                // Display the listing title
                const titleSpan = document.createElement('span');
                titleSpan.textContent = listing.title;

                // Create a container for action buttons
                const actionButtons = document.createElement('div');

                // "Delete" Button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-outline-danger btn-sm'; // Add Bootstrap styles
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => handleDeleteListing(listing._id, listItem); // Attach event handler

                // Append buttons to the action container
                actionButtons.appendChild(deleteBtn);

                // Append title and action buttons to the list item
                listItem.appendChild(titleSpan);
                listItem.appendChild(actionButtons);

                // Append the list item to the container
                listingsContainer.appendChild(listItem);
            });
        })
        .catch(err => console.error('Error fetching listings:', err));

        // Fetch and display reservations received (for sellers)
        fetch('/api/user/reservations')
            .then(response => response.json())
            .then(reservations => {
                const reservationsContainer = document.getElementById('reservationsContainer');
                reservationsContainer.innerHTML = ''; // Clear existing reservations

                // Handle case when no reservations are available
                if (reservations.length === 0) {
                    reservationsContainer.innerHTML = '<p>No reservations received yet.</p>';
                    return;
                }

                // Dynamically display reservations
                reservations.forEach(reservation => {
                    const reservationDiv = document.createElement('div');
                    reservationDiv.className = 'reservation-item card mb-3 p-3';

                    reservationDiv.innerHTML = `
                        <h5>${reservation.listingId.title}</h5>
                        <p><strong>Reserved by:</strong> ${reservation.buyerName || 'Unknown Buyer'}</p>
                        <p><strong>Description:</strong> ${reservation.listingId.description}</p>
                        <p><strong>Transaction ID:</strong> ${reservation.listingId.transactionId || 'Not provided'}</p>
                        <p><strong>Payment Status:</strong> ${reservation.listingId.paymentStatus || 'Not Paid'}</p>
                    `;

                    // Conditionally render "Mark as Received" button for paid items
                    if (reservation.listingId.paymentStatus === 'paid') {
                        const markAsReceivedBtn = document.createElement('button');
                        markAsReceivedBtn.className = 'btn btn-success mt-2';
                        markAsReceivedBtn.textContent = 'Mark as Received';
                        markAsReceivedBtn.onclick = () =>
                            handleMarkAsReceived(reservation.listingId._id, reservationDiv);

                        reservationDiv.appendChild(markAsReceivedBtn);
                    }

                    // Add confirmation message for completed payments
                    if (reservation.listingId.paymentStatus === 'completed') {
                        const completedMsg = document.createElement('p');
                        completedMsg.className = 'text-success mt-2';
                        completedMsg.textContent = `Payment has been received for this item. Please deliver item to ${reservation.buyerName}.`;

                        reservationDiv.appendChild(completedMsg);
                    }

                    reservationsContainer.appendChild(reservationDiv);
                });
            })
            .catch(error => console.error('Error fetching reservations:', error));

        let userReviews = []; // Store user's reviews globally for easy access

        // Fetch user reviews
        fetch('/api/user/reviews')
            .then(response => response.json())
            .then(reviews => {
                userReviews = reviews; // Cache reviews for reference
            })
            .catch(error => console.error('Error fetching user reviews:', error));

        // Fetch and display payment history for buyers
        fetch('/api/user/paymentHistory')
            .then(response => response.json())
            .then(paymentHistory => {
                const paymentHistoryContainer = document.getElementById('paymentHistoryContainer');
                paymentHistoryContainer.innerHTML = ''; // Clear existing payment history

                // Handle case when no payment history is available
                if (paymentHistory.length === 0) {
                    paymentHistoryContainer.innerHTML = '<p>No payment history available.</p>';
                    return;
                }

                // Dynamically display payment history
                paymentHistory.forEach(payment => {
                    const paymentDiv = document.createElement('div');
                    paymentDiv.className = 'payment-item card mb-3 p-3';

                    paymentDiv.innerHTML = `
                        <h5>${payment.listingTitle}</h5>
                        <p><strong>Seller Email:</strong> ${payment.sellerEmail}</p>
                        <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
                        <p><strong>Completion Date:</strong> ${new Date(payment.completionDate).toLocaleDateString()}</p>
                    `;

                    // Check if this transaction has already been reviewed
                    const existingReview = userReviews.find(review => review.transactionId === payment.transactionId);

                    if (existingReview) {
                        // Show "Review made" if a review exists
                        const reviewedText = document.createElement('p');
                        reviewedText.className = 'text-success mt-2';
                        reviewedText.textContent = 'Review made for this item.';
                        paymentDiv.appendChild(reviewedText);
                    } else {
                        // Show "Leave Review" button otherwise
                        const reviewButton = document.createElement('button');
                        reviewButton.className = 'btn btn-secondary btn-sm mt-2';
                        reviewButton.textContent = 'Leave Review for Seller';
                        reviewButton.setAttribute('data-bs-toggle', 'modal');
                        reviewButton.setAttribute('data-bs-target', '#reviewModal');
                        reviewButton.setAttribute('data-seller-email', payment.sellerEmail);
                        reviewButton.setAttribute('data-transaction-id', payment.transactionId);

                        reviewButton.addEventListener('click', (e) => {
                            document.getElementById('sellerEmail').value = payment.sellerEmail; // Use updated field
                            document.getElementById('transactionId').value = payment.transactionId;
                        });

                        paymentDiv.appendChild(reviewButton);
                    }

                    paymentHistoryContainer.appendChild(paymentDiv);
                });
            })
            .catch(error => console.error('Error fetching payment history:', error));

        // Fetch and display order history for sellers
        fetch('/api/user/orderHistory')
            .then(response => response.json())
            .then(orderHistory => {
                const orderHistoryContainer = document.getElementById('orderHistoryContainer');
                orderHistoryContainer.innerHTML = ''; // Clear existing order history

                // Handle case when no order history is available
                if (orderHistory.length === 0) {
                    orderHistoryContainer.innerHTML = '<p>No order history available.</p>';
                    return;
                }

                // Dynamically display order history
                orderHistory.forEach(order => {
                    const orderDiv = document.createElement('div');
                    orderDiv.className = 'order-item card mb-3 p-3';

                    orderDiv.innerHTML = `
                        <h5>${order.listingTitle}</h5>
                        <p><strong>Buyer Email:</strong> ${order.buyerEmail}</p>
                        <p><strong>Transaction ID:</strong> ${order.transactionId}</p>
                        <p><strong>Completion Date:</strong> ${new Date(order.completionDate).toLocaleDateString()}</p>
                    `;

                    orderHistoryContainer.appendChild(orderDiv);
                });
            })
            .catch(error => console.error('Error fetching order history:', error));

    // Fetch and display seller reviews
    fetch('/api/reviews/seller')
        .then(response => response.json())
        .then(reviews => {
            const reviewsContainer = document.getElementById('sellerReviewsContainer');
            reviewsContainer.innerHTML = ''; // Clear existing reviews

            // Handle case when no reviews are available
            if (reviews.length === 0) {
                reviewsContainer.innerHTML = '<p>No reviews available.</p>';
                return;
            }

            // Dynamically display reviews
            reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-item card mb-3 p-3';

                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                reviewCard.innerHTML = `
                <h5>${stars}</h5>
                <p><strong>From:</strong> ${review.reviewerEmail || 'Anonymous'}</p>
                <p>${review.comment || 'No comment provided.'}</p>
                <p class="text-muted"><small>${new Date(review.date).toLocaleDateString()}</small></p>
            `;

                reviewsContainer.appendChild(reviewCard);
            });
        })
        .catch(error => console.error('Error fetching seller reviews:', error));
});

// Open the review modal and populate seller info
function openReviewModal(sellerEmail) {
    document.getElementById('sellerEmail').value = sellerEmail; // Set seller email in hidden field
    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal')); // Create a Bootstrap modal instance
    reviewModal.show(); // Show the modal
}

// Handle marking an item as received
function handleMarkAsReceived(listingId, reservationDiv) {
    fetch('/api/listings/markAsReceived', {
        method: 'POST', // Use POST method for modifying data
        headers: { 'Content-Type': 'application/json' }, // Specify JSON format for the request body
        body: JSON.stringify({ listingId }) // Include the listing ID in the request body
    })
        .then(async response => {
            if (!response.ok) {
                const errorMessage = await response.text(); // Parse the error response
                throw new Error(errorMessage); // Throw an error for further handling
            }
            return response.text(); // Parse the success response as text
        })
        .then(message => {
            alert(message); // Notify the user of success

            // Update the UI dynamically to indicate the item has been marked as received
            reservationDiv.querySelector('button').remove(); // Remove the "Mark as Received" button

            const completedMsg = document.createElement('p');
            completedMsg.className = 'text-success mt-2'; // Add success styling
            completedMsg.textContent = 'Payment has been received for this item. Please deliver the item to the buyer.';

            reservationDiv.appendChild(completedMsg); // Add confirmation message
        })
        .catch(error => {
            console.error('Error marking as received:', error.message); // Log errors
            alert(`An error occurred: ${error.message}`); // Notify the user of failure
        });
}

// Function to handle deleting a listing
function handleDeleteListing(listingId, listItem) {
    // Confirm with the user before proceeding with deletion
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
        return;
    }

    // Send a DELETE request to the backend
    fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
    })
        .then(async (response) => {
            if (!response.ok) {
                // Parse the error message from the response
                const errorMessage = await response.text();
                throw new Error(errorMessage); // Throw the error for further handling
            }

            // Notify the user of successful deletion
            alert('Listing deleted successfully!');

            // Remove the list item from the UI
            listItem.remove();
        })
        .catch((err) => {
            // Log and display error messages
            console.error('Error deleting listing:', err.message);

            // Display relevant error messages based on backend validation
            if (err.message.includes('reserved')) {
                alert('This listing cannot be deleted because it is reserved.');
            } else if (err.message.includes('paid')) {
                alert('This listing cannot be deleted because it has been paid for.');
            } else if (err.message.includes('completed')) {
                alert('This listing cannot be deleted because the transaction is completed.');
            } else {
                alert(`Error: ${err.message}`); // Generic error message for other cases
            }
        });
}

// Handle submitting the review
document.getElementById('submitReviewBtn').addEventListener('click', () => {
    const sellerEmail = document.getElementById('sellerEmail').value; // Seller email from the hidden field
    const rating = document.getElementById('rating').value; // Selected rating
    const comment = document.getElementById('reviewContent').value.trim(); // Review text
    const transactionId = document.getElementById('transactionId').value; // Retrieve transaction ID

    // Basic validation
    if (!rating || !comment) {
        alert('Please fill out all fields before submitting your review.');
        return;
    }

    // Send review data to the backend
    fetch('/api/user/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, sellerEmail, rating, comment })
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.text(); // Parse success message
        })
        .then(message => {
            alert(message); // Notify the user of success
            document.getElementById('reviewForm').reset(); // Reset the form
            const reviewModal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            reviewModal.hide(); // Hide the modal
        })
        .catch(error => {
            console.error('Error submitting review:', error.message);
            alert(`Error: ${error.message}`);
        });
});