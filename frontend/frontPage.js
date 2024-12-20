document.addEventListener('DOMContentLoaded', () => {
    const listingContainer = document.getElementById('listingContainer');

    fetch('/api/listings')
        .then(response => response.json())
        .then(data => {
            data.forEach(listing => {
                const listingDiv = document.createElement('div');
                listingDiv.className = 'listing';

                const img = document.createElement('img');
                img.src = listing.image ? listing.image : 'defaultImage.jpeg';
                img.alt = 'Listing Image';

                const title = document.createElement('h2');
                title.textContent = listing.title;

                const description = document.createElement('p');
                description.textContent = listing.description;

                const contactBtn = document.createElement('button');
                contactBtn.className = 'contactBtn';
                contactBtn.textContent = 'Contact seller';
                contactBtn.onclick = () => alert('Contact seller at: ' + listing.contactInfo);

                listingDiv.appendChild(img);
                listingDiv.appendChild(title);
                listingDiv.appendChild(description);
                listingDiv.appendChild(contactBtn);

                listingContainer.appendChild(listingDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching listings:', error);
        });
});