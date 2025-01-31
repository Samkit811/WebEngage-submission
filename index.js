const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { format } = require("@fast-csv/format");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// Public directory to store CSV files
const PUBLIC_DIR = path.join(__dirname, "public");
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

app.get("/generate-csv", async (req, res) => {
    try {
        // Fetch data from the three APIs concurrently
        const [usersRes, postsRes, commentsRes] = await Promise.all([
            axios.get("https://jsonplaceholder.typicode.com/users").catch(error => {
                console.error("Error fetching users:", error.message || error);
                return { data: [] };  // Return empty array if the users API fails
            }),
            axios.get("https://jsonplaceholder.typicode.com/posts").catch(error => {
                console.error("Error fetching posts:", error.message || error);
                return { data: [] };  // Return empty array if the posts API fails
            }),
            axios.get("https://jsonplaceholder.typicode.com/comments").catch(error => {
                console.error("Error fetching comments:", error.message || error);
                return { data: [] };  // Return empty array if the comments API fails
            })
        ]);

        const users = usersRes.data;
        const posts = postsRes.data;
        const comments = commentsRes.data;

        // Validate the data structure of each API response
        if (!Array.isArray(users) || !Array.isArray(posts) || !Array.isArray(comments)) {
            console.error("Invalid data format received from one or more APIs");
            return res.status(500).json({ error: "Received invalid data format from external API" });
        }

        // Create a map of data by ID
        const userMap = new Map(users.map(user => [user.id, user.name]));
        const postMap = new Map(posts.map(post => [post.id, post.title]));
        const commentMap = new Map(comments.map(comment => [comment.id, comment.body]));

        // Prepare CSV data
        const csvData = [];
        const maxRows = Math.max(users.length, posts.length, comments.length);

        // Check if data size is reasonable
        // TODO: Adjust this threshold as needed
        if (maxRows > 50000) {
            console.warn("CSV data exceeds size limit, cannot process large data");
            return res.status(413).json({ error: "CSV data too large to process" });
        }

        for (let id = 1; id <= maxRows; id++) {
            csvData.push({
                name: userMap.get(id) || "N/A",
                title: postMap.get(id) || "N/A",
                body: commentMap.get(id) || "N/A"
            });
        }

        // Ensure the public directory exists before writing the file
        if (!fs.existsSync(PUBLIC_DIR)) {
            console.error("Public directory is missing or inaccessible.");
            return res.status(500).json({ error: "Server issue: Public directory missing." });
        }

        // Handle potential path resolution issues
        let filePath;
        try {
            const fileName = `data_${uuidv4()}.csv`;
            filePath = path.join(PUBLIC_DIR, fileName);
        } catch (err) {
            console.error("Error generating file path:", err.message || err);
            return res.status(500).json({ error: "Failed to generate file path" });
        }

        // Write CSV file
        const writeStream = fs.createWriteStream(filePath);
        const csvStream = format({ headers: true });

        // Handle file writing errors
        writeStream.on("error", (err) => {
            console.error("Error writing to file:", err.message || err);
            return res.status(500).json({ error: "Failed to write CSV file" });
        });

        csvStream.pipe(writeStream);
        csvData.forEach(row => csvStream.write(row));
        csvStream.end();

        // When the file is finished writing, redirect to the file
        writeStream.on("finish", () => {
            console.log("CSV file successfully created:", filePath);
            return res.json({ filePath: `localhost:3000/public/${path.basename(filePath)}`});
        });

    } catch (error) {
        console.error("Unexpected error occurred:", error.stack || error.message || error);
    
        // Axios-specific error handling
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The server responded with a status code outside the range of 2xx
                console.error(`Axios error: Received ${error.response.status} response from API`);
                return res.status(502).json({ error: `API responded with status ${error.response.status}` });
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Axios error: No response received from API");
                return res.status(503).json({ error: "API did not respond" });
            } else {
                // Some error occurred in setting up the request
                console.error("Axios error: Request setup issue", error.message);
                return res.status(500).json({ error: "Error in API request setup" });
            }
        }
    
        // General error handling for unexpected errors
        res.status(500).json({ error: "A server error occurred while processing your request. Please try again later." });
    }
    
});

// Serve files from the public directory
app.use("/public", express.static(PUBLIC_DIR));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
