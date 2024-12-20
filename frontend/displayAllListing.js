document.addEventListener('DOMContentLoaded', () => {
    const listingContainer = document.getElementById('listingContainer'); // Main container for listings
    const searchBar = document.getElementById('searchBar'); // Search bar input field
    const searchButton = document.getElementById('searchButton'); // Search button
    let listings = []; // Array to store fetched listings for filtering

    // Fetch all listings from the backend
    fetch('/api/listings')
        .then(response => response.json())
        .then(data => {
            listings = data; // Store the fetched listings in memory
            displayListings(listings); // Render all listings initially
        })
        .catch(error => {
            console.error('Error fetching listings:', error); // Log errors during the fetch
        });

    // Display listings dynamically in the container
    function displayListings(filteredData) {
        const listingContainer = document.getElementById('listingContainer');
        listingContainer.innerHTML = ''; // Clear existing listings

        filteredData.forEach(listing => {
            // Create a responsive column for each listing
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-3 mb-4'; // Bootstrap grid classes
            col.setAttribute('data-id', listing._id); // Add unique identifier for dynamic updates

            // Create a card for each listing
            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm'; // Bootstrap card styling

            // Add listing image to the card
            const img = document.createElement('img');
            img.src = listing.image ? listing.image : 'defaultImage.jpeg'; // Fallback to a default image if no image exists
            img.alt = 'Listing Image'; // Alt text for accessibility
            img.className = 'card-img-top'; // Bootstrap class for card images

            // Card body to hold text details
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            // Add title
            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = listing.title;

            // Add description
            const description = document.createElement('p');
            description.className = 'card-text';
            description.textContent = listing.description;

            // Add price
            const price = document.createElement('p');
            price.className = 'card-text';
            price.innerHTML = `<strong>Price:</strong> $${listing.price || 'N/A'}`;

            // Add condition
            const condition = document.createElement('p');
            condition.className = 'card-text';
            condition.innerHTML = `<strong>Condition:</strong> ${listing.condition || 'Unknown'}`;

            // Add location
            const location = document.createElement('p');
            location.className = 'card-text';
            location.innerHTML = `<strong>Pickup Location:</strong> ${listing.location || 'Not specified'}`;

            // Add seller's name
            const seller = document.createElement('p');
            seller.className = 'card-text text-muted';
            seller.innerHTML = `<strong>Seller:</strong> ${listing.sellerName}`;

            // Add aggregate rating
            const rating = document.createElement("p");
            rating.className = "card-text text-success";
            if (listing.averageRating) {
                rating.innerHTML = `<strong>Seller's Rating:</strong> ${listing.averageRating.toFixed(1)} (${listing.reviewCount} reviews)`;
            } else {
                rating.textContent = "Seller has had no reviews yet";
            }

            // Add "Reserve" button
            const reserveBtn = document.createElement('button');
            reserveBtn.className = 'btn btn-secondary w-100'; // Bootstrap button classes
            reserveBtn.textContent = 'Reserve';
            reserveBtn.onclick = () => handleReserve(listing._id); // Attach reserve handler

            // Append all elements to the card body
            cardBody.appendChild(title); // Add title
            cardBody.appendChild(description); // Add description
            cardBody.appendChild(price); // Add price
            cardBody.appendChild(condition); // Add condition
            cardBody.appendChild(location); // Add location
            cardBody.appendChild(seller); // Add seller's name
            cardBody.appendChild(rating); // Add seller's rating
            cardBody.appendChild(reserveBtn); // Add reserve button

            // Append the image and card body to the card
            card.appendChild(img);
            card.appendChild(cardBody);

            // Add the card to the column
            col.appendChild(card);

            // Add the column to the main listing container
            listingContainer.appendChild(col);
        });
    }

    // Handle reservation of an item
    function handleReserve(listingId) {
        fetch(`/api/listings/reserve`, {
            method: 'POST', // Use POST for creating a reservation
            headers: { 'Content-Type': 'application/json' }, // Specify JSON format
            body: JSON.stringify({ listingId }) // Send the listing ID to the server
        })
            .then(response => {
                if (response.ok) {
                    alert('Item reserved successfully!'); // Notify the user of success
                    // Dynamically remove the reserved item from the displayed listings
                    const reservedItem = document.querySelector(`[data-id="${listingId}"]`);
                    if (reservedItem) {
                        reservedItem.remove(); // Remove the reserved item's DOM element
                    }
                } else {
                    alert('Failed to reserve item.'); // Notify the user of failure
                }
            })
            .catch(error => {
                console.error('Error reserving item:', error); // Log errors
                alert('An error occurred while reserving the item.'); // Notify the user of an error
            });
    }

    // Handle search functionality
    searchButton.addEventListener('click', () => {
        const searchText = searchBar.value.toLowerCase(); // Convert search text to lowercase
        const filteredListings = listings.filter(listing =>
            listing.title.toLowerCase().includes(searchText) || // Filter by title
            listing.description.toLowerCase().includes(searchText) // Filter by description
        );
        displayListings(filteredListings); // Display the filtered results
    });

    // Enable search functionality on pressing the "Enter" key
    searchBar.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            searchButton.click(); // Trigger search button click
        }
    });
});
