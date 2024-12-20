$(document).ready(function () {
    $('#listingForm').on('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(this); // Capture the form data

        $.ajax({
            type: 'POST', // HTTP POST request
            url: '/createListing', // Endpoint to handle the listing creation
            data: formData, // Send the form data
            processData: false, // Don't process the data (for file uploads)
            contentType: false, // Don't set content-type (for file uploads)
            success: function (response) {
                alert('Listing created successfully!'); // Notify user of success
                $('#listingForm')[0].reset(); // Reset the form fields
            },
            error: function (error) {
                alert('Error creating listing: ' + error.responseText); // Notify user of error
            }
        });
    });
});
