// --------------------------------------
// 1. Imports and Middleware Setup
// --------------------------------------
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads

// --------------------------------------
// 2. Database Connection
// --------------------------------------

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB!"))
  .catch(err => console.error("Error connecting to MongoDB:", err));

// --------------------------------------
// 2. File Upload Configuration (Multer)
// --------------------------------------

// Set up Multer's memory storage for file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage }); // Configure Multer with memory storage

// --------------------------------------
// 3. Session Management
// --------------------------------------

// Import the `express-session` module to manage user sessions.
// Sessions are used to store user data between HTTP requests.
const session = require('express-session');

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET, // Secret key for signing the session ID cookie.
    resave: false, // Prevents session from being saved on each request if it hasn't been modified.
    saveUninitialized: true, // Saves a session even if it's new and has not been modified.
}));

// --------------------------------------
// 4. Authentication Middleware
// --------------------------------------

// A middleware function to check if the user is authenticated.
// If the user is logged in, their data should exist in `req.session.user`.
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        // If a session exists and the user is logged in, proceed to the next middleware or route handler.
        next();
    } else {
        // If the user is not authenticated, redirect them to the home page.
        res.redirect('/');
    }
}

// --------------------------------------
// 5. General Routes
// --------------------------------------

// Route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// // Route to display all listings
app.get('/frontPage', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/displayAllListing.html'));
});

// Route to create a listing
app.get('/createListing', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/createListing.html'));
});

// Route to edit profile
app.get('/editProfile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/editProfile.html'));
});

// --------------------------------------
// 6. Models
// --------------------------------------

// Define the schema for a listing in the application
const listingSchema = new mongoose.Schema({
    // Title of the item being listed
    // Example: "MacBook Pro 2020"
    title: { type: String, required: true },

    // Description of the item
    // Example: "Lightly used MacBook Pro with 16GB RAM, 512GB SSD"
    description: { type: String, required: true },

    // Image of the item (stored as a binary buffer)
    // Optional: Can be null if no image is uploaded
    image: { type: Buffer, required: false },

    // MIME type of the image (e.g., "image/png", "image/jpeg")
    // Helps in rendering the image in the frontend
    imageType: { type: String },

    // Contact information for the seller
    // Example: "Call or text: 555-1234"
    contactInfo: { type: String, required: true },

    // Price of the item
    // Example: 1200 (representing $1,200)
    // Must be a number and is required
    price: { type: Number, required: true },

    // Condition of the item
    // Must be one of the predefined values: "New", "Like New", or "Used"
    // Helps buyers understand the item's state
    condition: { type: String, enum: ['New', 'Like New', 'Used'], required: true },

    // Location or meetup details for exchanging the item
    // Example: "Towson University Campus, Library"
    location: { type: String, required: true },

    // Email of the seller who created the listing
    // Used to associate the listing with the seller
    user: { type: String, required: true },
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // Indicates whether the item is reserved
    // Default: false (item is available for reservation)
    reserved: { type: Boolean, default: false },

    // Email of the buyer who reserved the item
    // Default: null (no buyer has reserved the item yet)
    reservedBy: { type: String, default: null },

    // Payment transaction ID (generated during payment process)
    // Default: null (no transaction ID until the item is marked as paid)
    transactionId: { type: String, default: null },

    // Payment status of the item
    // Default: "unpaid" (item is not paid for until marked otherwise)
    paymentStatus: { type: String, default: "unpaid" },

    // Indicates whether the order is completed
    // Default: false (order is incomplete until the seller confirms receipt)
    completed: { type: Boolean, default: false },
});

// Compile the schema into a Mongoose model
// This creates a MongoDB collection named "Listings" (pluralized form of "Listing")
const Listing = mongoose.model('Listing', listingSchema);

// Define the schema for a user in the application
const userSchema = new mongoose.Schema({
    // Full name of the user
    // Example: "John Doe"
    name: { type: String, required: true },

    // Unique email address for the user
    // Example: "johndoe@students.towson.edu"
    email: { type: String, required: true, unique: true },

    // Password for user authentication
    // Example: "securePassword123" (should be hashed in production)
    password: { type: String, required: true },

    // Array of reservations received by the user (as a seller)
    // Each reservation links to a listing and the buyer's email
    reservations: [
        {
            // The listing reserved by a buyer (referenced by its ID)
            listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },

            // Email of the buyer who made the reservation
            buyerEmail: String,
        }
    ],

    // Array of listing IDs that the user (as a buyer) has added to their cart
    // Each entry references a `Listing` document
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

    // CashApp username of the user for receiving payments (optional)
    // Example: "$JohnDoe"
    cashApp: { type: String, default: null },

    // Venmo username of the user for receiving payments (optional)
    // Example: "@JohnDoe"
    venmo: { type: String, default: null },

    // Array of orders completed by the user (as a seller)
    orderHistory: [
        {
            // The listing associated with the completed order
            listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },

            // Email of the buyer who completed the order
            buyerEmail: String,

            // Transaction ID generated during payment
            transactionId: String,

            // Date when the order was marked as completed
            completionDate: { type: Date, default: Date.now },
        }
    ],

    // Array of payments made by the user (as a buyer)
    paymentHistory: [
        {
            // The listing associated with the payment
            listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },

            // Email of the seller who received the payment
            sellerEmail: String,

            // Transaction ID generated during payment
            transactionId: String,

            // Date when the payment was made
            completionDate: { type: Date, default: Date.now },
        }
    ],
});

// Compile the schema into a Mongoose model
// This creates a MongoDB collection named "Users" (pluralized form of "User")
const User = mongoose.model('User', userSchema);


// Review Schema
const reviewSchema = new mongoose.Schema({
    // Seller being reviewed (referenced by email or ID)
    sellerEmail: { type: String, required: true },

    // Buyer leaving the review (referenced by email)
    reviewerEmail: { type: String, required: true },

    // Numeric rating (1–5)
    rating: { type: Number, required: true, min: 1, max: 5 },

    // Optional text comment
    comment: { type: String, default: '' },

    // Timestamp of when the review was created
    date: { type: Date, default: Date.now },

    transactionId: { type: String, required: true }, // Transaction ID the review is tied to
});

// Create Review model
const Review = mongoose.model('Review', reviewSchema);

// --------------------------------------
// Other Routes
// --------------------------------------

// ---------------------------------------------
// Route: GET /api/listings
// Purpose: Fetch listings from the database,
// optionally filtered by a search query.
// ---------------------------------------------

app.get('/api/listings', async (req, res) => {
    try {
        const searchQuery = req.query.search || ''; // Retrieve the search query from request, default to an empty string

        // Fetch listings from the database
        // - Filter by unreserved items (`reserved: false`)
        // - Search by title or description matching the query
        const listings = await Listing.find({
            reserved: false, // Ensure only unreserved items are fetched
            $or: [
                {
                    title: {
                        $regex: searchQuery,
                        $options: 'i' // Case-insensitive search for titles
                    }
                },
                {
                    description: {
                        $regex: searchQuery,
                        $options: 'i' // Case-insensitive search for descriptions
                    }
                }
            ]
        });

        // Fetch aggregate ratings
        const aggregateRatings = await Review.aggregate([
            {
                $group: {
                    _id: "$sellerEmail",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        // Convert ratings into a dictionary for easy lookup
        const ratingMap = aggregateRatings.reduce((map, { _id, averageRating, reviewCount }) => {
            map[_id] = { averageRating, reviewCount };
            return map;
        }, {});

        const Listings = await Promise.all(
            listings.map(async (listing) => {
                // Find the seller's name based on the email in the `user` field
                const seller = await User.findOne({ email: listing.user });
                const sellerEmail = seller?.email || "Unknown";
                const sellerName = seller?.name || "Unknown";
                const ratings = ratingMap[sellerEmail] || { averageRating: null, reviewCount: 0 };

                return {
                    _id: listing._id,
                    title: listing.title,
                    description: listing.description,
                    price: listing.price,
                    condition: listing.condition,
                    location: listing.location,
                    contactInfo: listing.contactInfo,
                    image: listing.image
                        ? `data:${listing.imageType};base64,${listing.image.toString('base64')}`
                        : null,
                    sellerName,
                    sellerEmail,
                    averageRating: ratings.averageRating,
                    reviewCount: ratings.reviewCount,
                };
            })
        );

        res.json(Listings);
    } catch (err) {
        console.error('Error fetching listings:', err); // Log any server errors
        res.status(500).send('Error fetching listings'); // Respond with a 500 status if an error occurs
    }
});

// --------------------------------------------------------
// Route: POST /createListing
// Purpose: Create a new listing with image upload and validation
// Middleware: Multer (for handling image uploads)
// --------------------------------------------------------

app.post('/createListing', upload.single('image'), (req, res) => {
    // Get the logged-in user's email from the session
    const email = req.session.user.email;

    // ---------------------------------------------
    // Step 1: Validate input fields
    // ---------------------------------------------

    // Validate the price field to ensure it's a positive number
    const price = parseFloat(req.body.price);
    if (isNaN(price) || price <= 0) {
        return res.status(400).send('Invalid price. It must be a positive number.');
    }

    // Validate the condition field to ensure it matches one of the valid values
    const condition = req.body.condition;
    const validConditions = ['New', 'Like New', 'Used'];
    if (!validConditions.includes(condition)) {
        return res.status(400).send('Invalid condition. It must be one of: New, Like New, Used.');
    }

    // Validate the location field to ensure it's not empty or undefined
    const location = req.body.location;
    if (!location || location.trim().length === 0) {
        return res.status(400).send('Location details are required.');
    }

    // ---------------------------------------------
    // Step 2: Create a new listing object
    // ---------------------------------------------

    const newListing = new Listing({
        title: req.body.title, // Item title provided by the user
        description: req.body.description, // Item description provided by the user
        image: req.file ? req.file.buffer : null, // Image buffer if an image is uploaded
        imageType: req.file ? req.file.mimetype : null, // Image MIME type (e.g., "image/jpeg")
        contactInfo: req.body.contactInfo, // Seller's contact details
        price: price, // Validated price of the item
        condition: condition, // Validated condition of the item
        location: location.trim(), // Validated and trimmed location details
        user: email // Associate the listing with the logged-in user's email
    });

    // ---------------------------------------------
    // Step 3: Save the listing to the database
    // ---------------------------------------------

    newListing.save()
        .then(() => {
            // Respond with success message if the listing is saved
            res.status(201).send('Listing created successfully!');
        })
        .catch(err => {
            // Log the error and respond with an error message
            console.error(err);
            res.status(400).send('Error creating listing: ' + err.message);
        });
});

// Route for Users

// ---------------------------------------------------------
// Route: POST /signup
// Purpose: Register a new user with optional payment details
// ---------------------------------------------------------

app.post('/signup', async (req, res) => {
    try {
        // Extract user details from the request body
        const { fullName, email, password, cashApp, venmo } = req.body;

        // ---------------------------------------------
        // Step 1: Validate input fields
        // ---------------------------------------------

        // Validate the email to ensure it ends with '@students.towson.edu'
        if (!email.endsWith('@students.towson.edu')) {
            return res.status(400).send('Invalid email. Must be a TU email.'); // Return error if validation fails
        }

        // Validate the CashApp username (if provided) to ensure it starts with '$'
        if (cashApp && !cashApp.startsWith('$')) {
            return res.status(400).send('Invalid CashApp username. It must start with "$".');
        }

        // Validate the Venmo username (if provided) to ensure it starts with '@'
        if (venmo && !venmo.startsWith('@')) {
            return res.status(400).send('Invalid Venmo username. It must start with "@".');
        }

        // ---------------------------------------------
        // Step 2: Create a new user object
        // ---------------------------------------------

        // Construct a new User document
        const newUser = new User({
            name: fullName, // User's full name
            email, // User's email
            password, // User's password (plain-text; should ideally be hashed)
            cashApp: cashApp || null, // Optional CashApp username (default to null if not provided)
            venmo: venmo || null // Optional Venmo username (default to null if not provided)
        });

        // ---------------------------------------------
        // Step 3: Save the user to the database
        // ---------------------------------------------

        await newUser.save(); // Save the user to the database

        // Respond with a success message
        res.status(201).send('User signed up successfully!');
    } catch (err) {
        // Handle errors (e.g., validation or database errors)
        console.error(err); // Log the error details
        res.status(400).send('Error signing up: ' + err.message); // Respond with the error message
    }
});


// ---------------------------------------------------------
// Route: POST /login
// Purpose: Authenticate a user and start a session
// ---------------------------------------------------------

app.post('/login', async (req, res) => {
    try {
        // ---------------------------------------------
        // Step 1: Extract user credentials
        // ---------------------------------------------
        const { email, password } = req.body; // Extract email and password from the request body

        // ---------------------------------------------
        // Step 2: Validate the user's credentials
        // ---------------------------------------------

        // Search for a user in the database with the provided email
        const user = await User.findOne({ email });

        // If no user is found or the password does not match, return an error
        if (!user || user.password !== password) {
            return res.status(401).send('Invalid credentials'); // Respond with "Unauthorized"
        }

        // ---------------------------------------------
        // Step 3: Start a session
        // ---------------------------------------------

        // Save the user's email in the session to indicate they are logged in
        req.session.user = { email }; // Only storing email for simplicity; more user info can be stored if needed

        // Respond with a success message
        res.status(200).send('Login successful!');

        // Optional: Redirect to the front page (commented out)
        //res.redirect('/frontPage');
    } catch (err) {
        // ---------------------------------------------
        // Step 4: Handle errors
        // ---------------------------------------------

        // Log any server-side errors for debugging
        console.error('Error during login:', err);

        // Respond with a generic error message and status code
        res.status(500).send('Error logging in: ' + err.message);
    }
});

// ---------------------------------------------------------
// Route: GET /logout
// Purpose: End the user's session and log them out
// ---------------------------------------------------------

app.get('/logout', (req, res) => {
    // ---------------------------------------------
    // Step 1: Destroy the current session
    // ---------------------------------------------

    req.session.destroy(err => {
        if (err) {
            // If an error occurs while destroying the session, log the error and respond with a 500 status
            console.error('Error during logout:', err);
            return res.status(500).send('Error logging out');
        }

        // ---------------------------------------------
        // Step 2: Redirect to the home page
        // ---------------------------------------------

        // If the session is successfully destroyed, redirect the user to the home page
        res.redirect('/home');
    });
});


// Routes for Profile

// ---------------------------------------------------------
// Route: GET /api/user/profile
// Purpose: Fetch the logged-in user's profile data
// ---------------------------------------------------------

app.get('/api/user/profile', (req, res) => {
    // ---------------------------------------------
    // Step 1: Check if the user is logged in
    // ---------------------------------------------

    if (req.session && req.session.user) {
        // Extract the user's email from the session
        const email = req.session.user.email;

        // ---------------------------------------------
        // Step 2: Find the user in the database by email
        // ---------------------------------------------

        User.findOne({ email })
            .then(user => {
                if (!user) {
                    // If the user is not found, return a 404 status
                    return res.status(404).send('User not found');
                }

                // ---------------------------------------------
                // Step 3: Prepare and send the profile data
                // ---------------------------------------------

                res.json({
                    name: user.name, // User's full name
                    email: user.email, // User's email address
                    cashApp: user.cashApp || null, // User's CashApp username or null if not set
                    venmo: user.venmo || null, // User's Venmo username or null if not set
                    listings: [] // Placeholder for future logic to include user-specific listings
                });
            })
            .catch(err => {
                // If an error occurs during the database query, log it and return a 500 status
                console.error('Error fetching profile:', err);
                res.status(500).send('Error fetching profile: ' + err.message);
            });
    } else {
        // ---------------------------------------------
        // Step 4: Handle unauthorized access
        // ---------------------------------------------

        // If the user is not logged in, return a 401 Unauthorized status
        res.status(401).send('Unauthorized');
    }
});

// ---------------------------------------------------------
// Route: POST /api/user/profile/update
// Purpose: Update the logged-in user's profile information
// Middleware: isAuthenticated - Ensures only logged-in users can access this route
// ---------------------------------------------------------

app.post('/api/user/profile/update', isAuthenticated, async (req, res) => {
    // Extract the profile update details from the request body
    const { fullName, newEmail, newPassword, cashApp, venmo } = req.body;

    // Retrieve the currently logged-in user's email from the session
    const email = req.session.user.email;

    try {
        // ---------------------------------------------
        // Step 1: Find the user in the database
        // ---------------------------------------------

        const user = await User.findOne({ email }); // Search for the user by their current email
        if (!user) {
            // If the user is not found, return a 404 status
            return res.status(404).send({ message: 'User not found' });
        }

        // ---------------------------------------------
        // Step 2: Validate optional payment inputs
        // ---------------------------------------------

        if (cashApp && !cashApp.startsWith('$')) {
            // If the CashApp username is invalid, return a 400 status
            return res.status(400).send({ message: 'Invalid CashApp username. It must start with "$".' });
        }
        if (venmo && !venmo.startsWith('@')) {
            // If the Venmo username is invalid, return a 400 status
            return res.status(400).send({ message: 'Invalid Venmo username. It must start with "@".' });
        }

        // ---------------------------------------------
        // Step 3: Update the user's profile details
        // ---------------------------------------------

        user.name = fullName || user.name; // Update the full name if provided
        user.email = newEmail || user.email; // Update the email if provided
        user.cashApp = cashApp || user.cashApp; // Update the CashApp username if provided
        user.venmo = venmo || user.venmo; // Update the Venmo username if provided

        // Check if a new password is provided
        if (newPassword) {
            user.password = newPassword; // Update the password (consider hashing for security)
        }

        // ---------------------------------------------
        // Step 4: Save the updated user information
        // ---------------------------------------------

        await user.save(); // Save the updated user to the database

        // ---------------------------------------------
        // Step 5: Update session email if it was changed
        // ---------------------------------------------

        if (newEmail && newEmail !== email) {
            req.session.user.email = newEmail; // Update the session with the new email
        }

        // ---------------------------------------------
        // Step 6: Respond with success message
        // ---------------------------------------------

        res.status(200).send({ message: 'Profile updated successfully' });
    } catch (err) {
        // Log the error and send a 500 status with an error message
        console.error('Error updating profile:', err);
        res.status(500).send({ message: 'Error updating profile: ' + err.message });
    }
});


// ------------------------------------------------------------------------
// Route: GET /api/user/listings
// Purpose: Fetch all listings
// Middleware: isAuthenticated - Ensures only logged-in users can access this route
// ------------------------------------------------------------------------

app.get('/api/user/listings', isAuthenticated, (req, res) => {
    // Retrieve the email of the currently logged-in user from the session
    const email = req.session.user.email;

    // Query the Listing model to fetch all listings associated with this user
    Listing.find({ user: email }) // Filter listings where the `user` field matches the logged-in user's email
        .then(listings => {
            // Send the retrieved listings as a JSON response
            res.json(listings);
        })
        .catch(err => {
            // Handle any errors during the database query
            // Log the error and send a 500 Internal Server Error status with the error message
            res.status(500).send('Error fetching listings: ' + err.message);
        });
});

// ------------------------------------------------------------------------
// Route: GET /api/user
// Purpose: Check the authentication status of the currently connected user
// Description: Determines if the user is logged in by checking the session data.
// ------------------------------------------------------------------------

app.get('/api/user', (req, res) => {
    // Check if the session exists and contains user information
    if (req.session && req.session.user) {
        // If the user is logged in, send a JSON response with the login status and user data
        res.json({
            loggedIn: true, // Indicates the user is logged in
            user: req.session.user // Includes user information (e.g., email)
        });
    } else {
        // If the user is not logged in, send a JSON response indicating they are not authenticated
        res.json({
            loggedIn: false // Indicates the user is not logged in
        });
    }
});

// -----------------------------------------------------------------------------
// Route: POST /api/listings/reserve
// Middleware: isAuthenticated
// Purpose: Allow a logged-in user to reserve a listing, update the listing's
//          status, and reflect the reservation in both buyer and seller data.
// -----------------------------------------------------------------------------

app.post('/api/listings/reserve', isAuthenticated, async (req, res) => {
    // Extract the listing ID from the request body and buyer's email from the session
    const { listingId } = req.body;
    const buyerEmail = req.session.user.email;

    try {
        // 1. Find the listing to be reserved
        const listing = await Listing.findById(listingId);

        // Handle cases where the listing doesn't exist
        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        // Handle cases where the listing is already reserved
        if (listing.reserved) {
            return res.status(400).send('Listing is already reserved');
        }

        // 2. Mark the listing as reserved and associate it with the buyer's email
        listing.reserved = true;
        listing.reservedBy = buyerEmail;
        await listing.save(); // Save changes to the listing

        // 3. Add the listing to the buyer's cart
        const buyer = await User.findOneAndUpdate(
            { email: buyerEmail }, // Locate the buyer by email
            { $addToSet: { cart: listingId } }, // Add the listing to the cart if it's not already there
            { new: true } // Return the updated user document
        );

        // 4. Add the reservation details to the seller's dashboard
        const seller = await User.findOneAndUpdate(
            { email: listing.user }, // Locate the seller by their email
            {
                $addToSet: {
                    reservations: { listingId, buyerEmail } // Add reservation details
                }
            },
            { new: true } // Return the updated user document
        );

        // Respond with success
        res.status(200).send('Item reserved successfully');
    } catch (err) {
        // Log any errors and respond with an appropriate status code and message
        console.error('Error reserving item:', err);
        res.status(500).send('Error reserving item');
    }
});

// -----------------------------------------------------------------------------
// Route: GET /api/user/reservations
// Middleware: isAuthenticated
// Purpose: Fetch all reservations received by the logged-in seller, enrich them
//          with additional buyer information, and return the data to the client.
// -----------------------------------------------------------------------------

app.get('/api/user/reservations', isAuthenticated, async (req, res) => {
    try {
        // Retrieve the logged-in seller's email from the session
        const sellerEmail = req.session.user.email;

        // 1. Find the seller in the database and populate the `reservations` field
        //    The `populate` method fetches the full `listingId` details for each reservation.
        const seller = await User.findOne({ email: sellerEmail }).populate('reservations.listingId');

        // If the seller is not found, return a 404 error
        if (!seller) return res.status(404).send('Seller not found');

        // 2. Enrich the reservations with additional buyer information
        //    This includes fetching the buyer's name based on their email.
        const enrichedReservations = await Promise.all(
            seller.reservations.map(async (reservation) => {
                const buyer = await User.findOne({ email: reservation.buyerEmail }); // Fetch buyer's details by email
                return {
                    ...reservation.toObject(), // Convert reservation document to a plain object
                    buyerName: buyer?.name || 'Unknown Buyer', // Include the buyer's name or default to "Unknown Buyer"
                };
            })
        );

        // 3. Respond with the enriched reservations
        res.json(enrichedReservations);
    } catch (err) {
        // Log any errors and respond with a 500 Internal Server Error
        console.error('Error fetching reservations:', err);
        res.status(500).send('Error fetching reservations');
    }
});

// -----------------------------------------------------------------------------
// Route: GET /api/user/cart
// Middleware: isAuthenticated
// Purpose: Retrieve the logged-in user's cart, enrich the data with additional
//          seller information, and return the enriched data to the client.
// -----------------------------------------------------------------------------

app.get('/api/user/cart', isAuthenticated, async (req, res) => {
    try {
        // 1. Retrieve the logged-in buyer's email from the session
        const buyerEmail = req.session.user.email;

        // 2. Find the buyer in the database and populate the `cart` field
        //    The `populate` method fetches the full details of each listing in the cart.
        const buyer = await User.findOne({ email: buyerEmail }).populate('cart');

        // If the buyer is not found, return a 404 error
        if (!buyer) return res.status(404).send('User not found');

        // 3. Enrich each listing in the cart with additional seller details
        const cartItems = await Promise.all(
            buyer.cart.map(async (listing) => {
                // Fetch the seller's details using the `user` field in the listing
                const seller = await User.findOne({ email: listing.user });

                // Return the enriched cart item details
                return {
                    _id: listing._id, // Listing ID
                    title: listing.title, // Listing title
                    description: listing.description, // Listing description
                    price: listing.price, // Listing price
                    condition: listing.condition, // Listing condition
                    location: listing.location, // Listing location
                    contactInfo: listing.contactInfo, // Seller's contact information
                    image: listing.image
                        ? `data:${listing.imageType};base64,${listing.image.toString('base64')}`
                        : null, // Base64 encode the image if it exists
                    paymentStatus: listing.paymentStatus || 'unpaid', // Payment status (default: unpaid)
                    transactionId: listing.transactionId || null, // Transaction ID (if available)
                    seller: {
                        cashApp: seller?.cashApp || 'Not provided', // Seller's CashApp username (default: Not provided)
                        venmo: seller?.venmo || 'Not provided', // Seller's Venmo username (default: Not provided)
                        name: seller?.name || 'Unknown', // Seller's name (default: Unknown)
                    },
                };
            })
        );

        // 4. Respond with the enriched cart items as JSON
        res.json(cartItems);
    } catch (err) {
        // Log any errors and respond with a 500 Internal Server Error
        console.error('Error fetching cart items:', err);
        res.status(500).send('Error fetching cart');
    }
});

// -----------------------------------------------------------------------------
// Route: POST /api/user/cart/remove
// Middleware: isAuthenticated
// Purpose: Remove a specific listing from the buyer's cart, unmark the listing
//          as reserved, and update the seller's reservations.
// -----------------------------------------------------------------------------

app.post('/api/user/cart/remove', isAuthenticated, async (req, res) => {
    // Extract the listing ID from the request body
    const { listingId } = req.body;

    // Get the buyer's email from the session
    const buyerEmail = req.session.user.email;

    try {
        // Step 1: Remove the listing from the buyer's cart
        const buyer = await User.findOneAndUpdate(
            { email: buyerEmail }, // Find the buyer by email
            { $pull: { cart: listingId } }, // Remove the listing ID from the cart array
            { new: true } // Return the updated buyer document
        );

        // If the buyer is not found, return a 404 error
        if (!buyer) return res.status(404).send('User not found');

        // Step 2: Find the listing and unmark it as reserved
        const listing = await Listing.findById(listingId);
        if (!listing) return res.status(404).send('Listing not found');

        // Update the listing to remove the reservation
        listing.reserved = false; // Mark as not reserved
        listing.reservedBy = null; // Clear the buyer's email
        await listing.save();

        // Step 3: Remove the reservation from the seller's reservations
        const seller = await User.findOneAndUpdate(
            { email: listing.user }, // Find the seller by the listing's user field
            { $pull: { reservations: { listingId: listingId } } } // Remove the reservation from the seller's array
        );

        // If the seller is not found, return a 404 error
        if (!seller) return res.status(404).send('Seller not found');

        // Step 4: Respond with a success message
        res.status(200).send('Item removed from cart and unmarked as reserved');
    } catch (err) {
        // Log any errors that occur and respond with a 500 Internal Server Error
        console.error('Error removing item from cart:', err);
        res.status(500).send('Error removing item from cart');
    }
});

// -----------------------------------------------------------------------------
// Route: POST /api/listings/markAsPaid
// Middleware: isAuthenticated
// Purpose: Mark a reserved listing as paid by the buyer and update the buyer's
//          payment history.
// -----------------------------------------------------------------------------
app.post('/api/listings/markAsPaid', isAuthenticated, async (req, res) => {
    // Extract listing ID and transaction ID from the request body
    const { listingId, transactionId } = req.body;

    // Get the buyer's email from the session
    const buyerEmail = req.session.user.email;

    try {
        // Step 1: Validate the transaction ID
        if (!transactionId || transactionId.trim() === '') {
            return res.status(400).send('Transaction ID is required'); // Respond with 400 Bad Request if invalid
        }

        // Step 2: Find the listing by ID and validate the buyer
        const listing = await Listing.findById(listingId); // Find the listing by its unique ID
        if (!listing) return res.status(404).send('Listing not found'); // Respond with 404 if the listing does not exist
        if (listing.reservedBy !== buyerEmail) {
            return res.status(403).send('Unauthorized action'); // Respond with 403 if the buyer does not match
        }

        // Step 3: Update the listing's payment status
        listing.transactionId = transactionId; // Save the transaction ID
        listing.paymentStatus = 'paid'; // Mark the listing as paid
        await listing.save(); // Save the updated listing to the database

        // Step 4: Update the buyer's payment history
        await User.findOneAndUpdate(
            { email: buyerEmail }, // Find the buyer by email
            {
                $pull: { cart: listingId }, // Remove the listing from the buyer's cart
                $push: { // Add the payment details to the buyer's payment history
                    paymentHistory: {
                        listingId, // Reference to the listing
                        sellerEmail: listing.user, // The seller's email
                        transactionId, // The transaction ID provided by the buyer
                        completionDate: new Date(), // The date when the payment was marked
                    }
                }
            }
        );

        // Step 5: Respond with a success message
        res.status(200).send('Payment marked as paid');
    } catch (err) {
        // Log the error and respond with a 500 Internal Server Error
        console.error('Error marking payment as paid:', err);
        res.status(500).send('Error marking payment as paid');
    }
});

// -----------------------------------------------------------------------------
// Route: POST /api/listings/markAsReceived
// Middleware: isAuthenticated
// Purpose: Mark a reserved listing as received by the seller, update the seller's
//          order history, and clean up reservations.
// -----------------------------------------------------------------------------

app.post('/api/listings/markAsReceived', isAuthenticated, async (req, res) => {
    // Extract the listing ID from the request body
    const { listingId } = req.body;

    // Get the seller's email from the session
    const sellerEmail = req.session.user.email;

    try {
        // Step 1: Find the listing by ID and validate the seller
        const listing = await Listing.findById(listingId); // Find the listing by its unique ID
        if (!listing) return res.status(404).send('Listing not found'); // Respond with 404 if listing doesn't exist
        if (listing.user !== sellerEmail) {
            return res.status(403).send('Unauthorized action'); // Respond with 403 if the seller doesn't match
        }

        // Step 2: Mark the listing as completed
        listing.paymentStatus = 'completed'; // Update payment status to "completed"
        listing.completed = true; // Mark the order as completed
        // listing.reserved = false; // Remove the reservation status
        await listing.save(); // Save the updated listing to the database

        // Step 3: Get the buyer's email from the listing
        const buyerEmail = listing.reservedBy;

        // Step 4: Remove the listing from the buyer's cart
        await User.findOneAndUpdate(
            { email: buyerEmail }, // Find the buyer by email
            { $pull: { cart: listingId } } // Remove the listing ID from the cart array
        );

        // Step 5: Remove the listing from the seller's reservations
        await User.findOneAndUpdate(
            { email: sellerEmail }, // Find the seller by email
            { $pull: { reservations: { listingId } } } // Remove the reservation matching the listing ID
        );

        // Step 6: Add the completed listing to the seller's order history
        await User.findOneAndUpdate(
            { email: sellerEmail }, // Find the seller by email
            {
                $pull: { reservations: { listingId } }, // Clean up from reservations (redundant but ensures consistency)
                $push: { // Add the completed order details to the order history
                    orderHistory: {
                        listingId, // Reference to the listing
                        buyerEmail, // Email of the buyer
                        transactionId: listing.transactionId, // Transaction ID from the listing
                        completionDate: new Date(), // Timestamp of the completion
                    }
                }
            }
        );

        // Step 7: Respond with a success message
        res.status(200).send('Order marked as received and completed');
    } catch (err) {
        // Log the error and respond with a 500 Internal Server Error
        console.error('Error marking as received:', err);
        res.status(500).send('Error marking as received');
    }
});

// Payment History and Payment Order

// -----------------------------------------------------------------------------
// Route: GET /api/user/orderHistory
// Middleware: isAuthenticated
// Purpose: Retrieve the seller's order history, including enriched details of
//          completed listings and their associated buyers.
// -----------------------------------------------------------------------------

app.get('/api/user/orderHistory', isAuthenticated, async (req, res) => {
    try {
        // Step 1: Extract seller's email from the session
        const sellerEmail = req.session.user.email;

        // Step 2: Find the seller in the database and populate the 'orderHistory' field
        // The 'populate' method retrieves the full 'listingId' details for each order
        const seller = await User.findOne({ email: sellerEmail }).populate('orderHistory.listingId');
        if (!seller) return res.status(404).send('Seller not found'); // Respond with 404 if the seller doesn't exist

        // Step 3: Transform the order history with enriched details for the frontend
        const enrichedOrderHistory = seller.orderHistory.map(order => ({
            listingTitle: order.listingId?.title || 'Unknown Listing', // Use listing title if available, else "Unknown Listing"
            buyerEmail: order.buyerEmail || 'Unknown Buyer', // Use buyer's name if available, else "Unknown Buyer"
            transactionId: order.transactionId, // Include transaction ID for the order
            completionDate: order.completionDate, // Include the completion date
        }));

        // Step 4: Send the enriched order history as a JSON response
        res.json(enrichedOrderHistory);
    } catch (err) {
        // Step 5: Handle and log any errors during the operation
        console.error('Error fetching order history:', err);
        res.status(500).send('Error fetching order history'); // Respond with a 500 status for server errors
    }
});


// -----------------------------------------------------------------------------
// Route: GET /api/user/paymentHistory
// Middleware: isAuthenticated
// Purpose: Retrieve the payment history for the buyer, including enriched details
//          of listings they have paid for and associated seller details.
// -----------------------------------------------------------------------------

app.get('/api/user/paymentHistory', isAuthenticated, async (req, res) => {
    try {
        // Step 1: Extract buyer's email from the session
        const buyerEmail = req.session.user.email;

        // Step 2: Find the buyer in the database and populate their 'paymentHistory' field
        // The 'populate' method retrieves full 'listingId' details for each payment entry
        const buyer = await User.findOne({ email: buyerEmail }).populate('paymentHistory.listingId');
        if (!buyer) return res.status(404).send('Buyer not found'); // Respond with 404 if the buyer doesn't exist

        // Step 3: Transform the payment history with enriched details for the frontend
        const enrichedPaymentHistory = buyer.paymentHistory.map(payment => ({
            listingTitle: payment.listingId?.title || 'Unknown Listing', // Use listing title if available, else "Unknown Listing"
            sellerEmail: payment.sellerEmail || 'Unknown Seller', // Use sellerEmail directly
            transactionId: payment.transactionId, // Include transaction ID for the payment
            completionDate: payment.completionDate, // Include the payment completion date
        }));

        // Step 4: Send the enriched payment history as a JSON response
        res.json(enrichedPaymentHistory);
    } catch (err) {
        // Step 5: Handle and log any errors during the operation
        console.error('Error fetching payment history:', err);
        res.status(500).send('Error fetching payment history'); // Respond with a 500 status for server errors
    }
});

// -----------------------------------------------------------------------------
// Route: DELETE /api/listings/:id
// Middleware: isAuthenticated
// Purpose: Delete a listing by its ID, validate deletion conditions, and
//          cascade delete related dependencies like reservations, cart entries,
//          and payment history.
// -----------------------------------------------------------------------------

app.delete('/api/listings/:id', isAuthenticated, async (req, res) => {
    // Extract the listing ID from the route parameters
    const { id } = req.params;

    try {
        // Step 1: Fetch the listing by its ID
        const listing = await Listing.findById(id); // Retrieve the listing document from the database

        // Step 2: Check if the listing exists
        if (!listing) {
            return res.status(404).send('Listing not found'); // Respond with 404 if the listing is not found
        }

        // Step 3: Validate conditions for deletion
        if (listing.completed) {
            // Most restrictive condition: transaction is completed
            return res.status(400).send('Listing cannot be deleted because the transaction is completed.');
        }

        if (listing.paymentStatus === 'paid' || listing.paymentStatus === 'completed') {
            // Next most restrictive: payment has been made
            return res.status(400).send('Listing cannot be deleted because it has been paid for.');
        }

        if (listing.reserved) {
            // Least restrictive: reserved but not yet paid
            return res.status(400).send('Listing cannot be deleted because it is reserved.');
        }

        // Step 4: Proceed with deletion if validation passes
        await Listing.findByIdAndDelete(id); // Delete the listing document from the database

        // Step 5: Cascade delete related dependencies
        // Remove the listing from the payment history of all users
        await User.updateMany(
            { 'paymentHistory.listingId': id }, // Match users with the listing in their payment history
            { $pull: { paymentHistory: { listingId: id } } } // Remove the specific payment history entry
        );

        // Remove the listing from the reservations of all users
        await User.updateMany(
            { 'reservations.listingId': id }, // Match users with the listing in their reservations
            { $pull: { reservations: { listingId: id } } } // Remove the specific reservation entry
        );

        // Remove the listing from the cart of all users
        await User.updateMany(
            { cart: id }, // Match users with the listing in their cart
            { $pull: { cart: id } } // Remove the listing from the cart array
        );

        // Step 6: Respond with a success message
        res.status(200).send('Listing deleted successfully'); // Indicate successful deletion
    } catch (err) {
        // Log the error and respond with a 500 Internal Server Error
        console.error('Error deleting listing:', err);
        res.status(500).send('Error deleting listing');
    }
});

// -----------------------------------------------------------------------------
// Route: POST /api/user/reviews
// Middleware: isAuthenticated
// Purpose: Allow an authenticated user to add a review for a seller. The review
//          includes details like transaction ID, seller email, rating, and an
//          optional comment. Validates input, prevents duplicate reviews, and
//          saves the review to the database.
// -----------------------------------------------------------------------------

app.post('/api/user/reviews', isAuthenticated, async (req, res) => {
    try {
        // Step 1: Extract review details from the request body
        const { transactionId, sellerEmail, rating, comment } = req.body;

        // Step 2: Get the reviewer's email from the session (authenticated user)
        const reviewerEmail = req.session.user.email; // Retrieve the authenticated user's email

        // Step 3: Validate inputs
        if (!transactionId || !sellerEmail || !rating || rating < 1 || rating > 5) {
            // Ensure all required fields are provided and rating is within the range of 1 to 5
            return res.status(400).send('Invalid review data. Ensure all fields are provided and rating is between 1 and 5.');
        }

        // Step 4: Check if the seller exists in the database
        const seller = await User.findOne({ email: sellerEmail }); // Find the seller by their email
        if (!seller) {
            // Respond with 404 if the seller is not found
            return res.status(404).send('Seller not found.');
        }

        // Step 5: Ensure the review does not already exist for this transaction
        const existingReview = await Review.findOne({ transactionId }); // Check for existing reviews for the transaction
        if (existingReview) {
            return res.status(400).send('Review already exists for this transaction.');
        }

        // Step 6: Create a new review document
        const newReview = new Review({
            transactionId, // Unique identifier for the transaction
            sellerEmail, // Email of the seller being reviewed
            reviewerEmail, // Email of the user submitting the review
            rating, // Numeric rating given by the reviewer
            comment: comment || '', // Optional comment (default to an empty string if not provided)
        });

        // Step 7: Save the new review to the database
        await newReview.save(); // Persist the review document to the database

        // Step 8: Respond with a success message
        res.status(201).send('Review added successfully.'); // Indicate that the review was created successfully
    } catch (err) {
        // Step 9: Handle and log server errors
        console.error('Error adding review:', err); // Log the error for debugging
        res.status(500).send('An error occurred while adding the review.'); // Respond with a generic error message
    }
});

// -----------------------------------------------------------------------------
// Route: GET /api/user/reviews/:sellerEmail
// Purpose: Fetch all reviews for a specific seller identified by their email.
//          Validates the seller's existence before querying the reviews and
//          returns reviews sorted by most recent first.
// -----------------------------------------------------------------------------

app.get('/api/user/reviews/:sellerEmail', async (req, res) => {
    try {
        // Step 1: Extract the seller's email from the route parameters
        const { sellerEmail } = req.params; // Get the seller's email from the URL

        // Step 2: Validate that the seller exists
        const sellerExists = await User.findOne({ email: sellerEmail }); // Check if the seller exists in the database
        if (!sellerExists) {
            // Respond with 404 if the seller does not exist
            return res.status(404).send('Seller not found.');
        }

        // Step 3: Fetch all reviews for the seller
        const reviews = await Review.find({ sellerEmail }) // Query reviews for the given seller's email
            .sort({ date: -1 }); // Sort reviews by date in descending order (most recent first)

        // Step 4: Check if there are any reviews
        if (reviews.length === 0) {
            // If no reviews exist, respond with an empty array
            return res.status(200).json([]);
        }

        // Step 5: Respond with the seller's reviews
        res.status(200).json(reviews); // Return the reviews as a JSON response
    } catch (err) {
        // Step 6: Handle and log server errors
        console.error('Error fetching reviews:', err); // Log the error for debugging
        res.status(500).send('An error occurred while fetching the reviews.'); // Respond with a 500 Internal Server Error
    }
});

// -----------------------------------------------------------------------------
// Route: GET /api/reviews/seller
// Middleware: isAuthenticated
// Purpose: Fetch all reviews for the currently logged-in seller. Validates the
//          seller's identity using the session and returns reviews sorted by
//          most recent first.
// -----------------------------------------------------------------------------

app.get('/api/reviews/seller', isAuthenticated, async (req, res) => {
    // Step 1: Retrieve the email of the logged-in seller from the session
    const sellerEmail = req.session.user.email; // Extract the authenticated seller's email from the session data

    try {
        // Step 2: Query the `Review` model to find all reviews for the seller
        const reviews = await Review.find({ sellerEmail }) // Fetch reviews matching the seller's email
            .sort({ date: -1 }); // Sort reviews by date in descending order (most recent first)

        // Step 3: Check if there are any reviews
        if (reviews.length === 0) {
            // If no reviews exist, respond with an empty array
            return res.status(200).json([]);
        }

        // Step 4: Respond with the retrieved reviews
        res.status(200).json(reviews); // Send the reviews as a JSON response
    } catch (err) {
        // Step 5: Handle and log server errors
        console.error('Error fetching seller reviews:', err); // Log the error for debugging
        res.status(500).send('An error occurred while fetching reviews.'); // Respond with a 500 Internal Server Error
    }
});

// -----------------------------------------------------------------------------
// Route: GET /api/reviews/aggregate-ratings
// Purpose: Fetch aggregate ratings for sellers, including the average rating
//          and total number of reviews for each seller. Uses MongoDB aggregation
//          to compute and format the results.
// -----------------------------------------------------------------------------

app.get('/api/reviews/aggregate-ratings', async (req, res) => {
    try {
        // Step 1: Use MongoDB aggregation to calculate average rating and review count
        const aggregateRatings = await Review.aggregate([
            {
                // Group reviews by sellerEmail
                $group: {
                    _id: "$sellerEmail", // Group by sellerEmail
                    averageRating: { $avg: "$rating" }, // Calculate average rating of reviews
                    reviewCount: { $sum: 1 } // Count the total number of reviews for each seller
                }
            },
            {
                // Step 2: Format the output to rename _id to sellerEmail
                $project: {
                    sellerEmail: "$_id", // Rename _id to sellerEmail for clarity
                    averageRating: { $round: ["$averageRating", 1] }, // Round average rating to 1 decimal place
                    reviewCount: 1, // Include the count of reviews
                    _id: 0 // Exclude the _id field from the output
                }
            }
        ]);

        // Step 3: Respond with the aggregated ratings
        res.json(aggregateRatings); // Send the aggregated results as JSON
    } catch (err) {
        // Step 4: Handle and log server errors
        console.error('Error fetching aggregate ratings:', err); // Log the error for debugging
        res.status(500).send('Error fetching aggregate ratings'); // Respond with a 500 Internal Server Error
    }
});

// -----------------------------------------------------------------------------
// Route: PUT /api/listings/:id
// Middleware: isAuthenticated
// Purpose: Update an existing listing by its ID. Accepts new values for title,
//          description, price, condition, and location. Returns the updated
//          listing or an error if the update fails.
// -----------------------------------------------------------------------------

app.put('/api/listings/:id', isAuthenticated, async (req, res) => {
    // Step 1: Extract the listing ID from the route parameters
    const { id } = req.params; // Get the listing ID from the URL

    // Step 2: Extract the updated listing details from the request body
    const { title, description, price, condition, location } = req.body; // Extract fields to be updated

    try {
        // Step 3: Find the listing by its ID and update it with the new values
        const updatedListing = await Listing.findByIdAndUpdate(
            id, // The ID of the listing to update
            { title, description, price, condition, location }, // New values for the listing fields
            { new: true, runValidators: true } // Options: return the updated document and validate the inputs
        );

        // Step 4: Check if the listing exists
        if (!updatedListing) {
            // Respond with 404 if the listing is not found
            return res.status(404).send('Listing not found');
        }

        // Step 5: Respond with the updated listing
        res.status(200).json(updatedListing); // Return the updated listing as a JSON response
    } catch (err) {
        // Step 6: Handle and log server errors
        console.error('Error updating listing:', err); // Log the error for debugging
        res.status(500).send('Error updating listing'); // Respond with a 500 Internal Server Error
    }
});

app.listen(PORT, () => {
    console.log(`Dorm Dash app is listening at http://localhost:${PORT}`);
});
