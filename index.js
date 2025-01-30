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
            axios.get("https://jsonplaceholder.typicode.com/users"),
            axios.get("https://jsonplaceholder.typicode.com/posts"),
            axios.get("https://jsonplaceholder.typicode.com/comments")
        ]);

        const users = usersRes.data;
        const posts = postsRes.data;
        const comments = commentsRes.data;

        // Create a map of data by ID
        const userMap = new Map(users.map(user => [user.id, user.name]));
        const postMap = new Map(posts.map(post => [post.id, post.title]));
        const commentMap = new Map(comments.map(comment => [comment.id, comment.body]));

        // Prepare CSV data
        const csvData = [];
        const maxRows = Math.max(users.length, posts.length, comments.length);

        for (let id = 1; id <= maxRows; id++) {
            csvData.push({
                name: userMap.get(id) || "N/A",
                title: postMap.get(id) || "N/A",
                body: commentMap.get(id) || "N/A"
            });
        }

        // Generate unique filename
        const fileName = `data_${uuidv4()}.csv`;
        const filePath = path.join(PUBLIC_DIR, fileName);

        // Write CSV file
        const writeStream = fs.createWriteStream(filePath);
        const csvStream = format({ headers: true });

        csvStream.pipe(writeStream);
        csvData.forEach(row => csvStream.write(row));
        csvStream.end();

        writeStream.on("finish", () => {
            res.redirect(`/public/${fileName}`);
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to generate CSV file" });
    }
});

// Serve files from the public directory
app.use("/public", express.static(PUBLIC_DIR));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
