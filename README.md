# COSC412 Group One Final Project

**Team Members:**  
- Connor Persaud  
- Erik Umoh  
- Taitusi Vadei  
- Jeryle Assension  

---

## Instructions for Running the Project  

### Prerequisites  

Before running the project, ensure you have the following software installed on your machine:  
1. **Node.js**: Download and install from [Node.js official website](https://nodejs.org/).  
2. **MongoDB**: Ensure MongoDB is installed and running. Download it from [MongoDB official website](https://www.mongodb.com/).  
3. **Git** : If cloning the repository via Git.  

### Installing Necessary Packages  

1. Clone the project repository to your local machine:  
   ```bash
   git clone https://github.com/Th3Jar/COSC412GroupOne.git
2. Navigate to the backend folder and install the required packages
   ```bash
   cd backend
   npm install

### Setting Up The Database and Other Environment Variables
1. Ensure MongoDB is running on your local machine or provide the URI of your cloud-hosted MongoDB
2. Create a .env file in the backend directory
3. Add the following key-value pairs to the .env file
   ```bash
   MONGO_URI = your_mongodb_conection_string
   PORT=3000
   SESSION_SECRET= secret_key_for_signing_the_session_ID_cookie

### A note about the AI chat bot
For the AI chat bot to work, 
1) Go to https://platform.openai.com/settings/organization/api-keys
2) Log in with an account
3) Create a key
4) Navigate to the botscript.js in the frontend directory
5) Paste this key at the first variable on top "API_KEY"

### Running the Backend Server
1. From the backend folder, start the server
   ```bash
   node app.js

### Navigating to the Application
1. Open your preferred browser
2. Go to "http://localhost:3000"
3. The application is now live and connected to the database.

### Stopping the Server
1. To stop the server, return to the terminal running the backend server and type Ctrl + C
