# Express.js CSV Generator

This project is an Express.js application that fetches data from three different APIs, extracts specific fields, writes them into a CSV file, and automatically redirects users to download the generated file.

## Features
- Fetches data from three APIs:
  - Users: `https://jsonplaceholder.typicode.com/users`
  - Posts: `https://jsonplaceholder.typicode.com/posts`
  - Comments: `https://jsonplaceholder.typicode.com/comments`
- Extracts the following fields:
  - `name` from users API
  - `title` from posts API
  - `body` from comments API
- Maps extracted data by `id`
- Writes the data into a CSV file inside a `public/` directory
- Redirects the user to download the generated CSV file

## Prerequisites
- Node.js installed on your system

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Samkit811/WebEngage-submission
   cd WebEngage-submission
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```

## Running the Server

Start the Express server with:
```sh
node index.js
```

The server will run on:
```
http://localhost:3000
```

## Generating and Downloading the CSV File

1. Open a browser and visit:
   ```
   http://localhost:3000/generate-csv
   ```
2. The CSV file will be automatically generated and downloaded.

## Project Structure
```
.
├── public/          # Directory for storing generated CSV files
├── index.js         # Main Express server file
├── package.json     # Project dependencies
├── README.md        # Documentation
```

## Dependencies
- `express` - Web framework for Node.js
- `axios` - HTTP client for API requests
- `fs` - File system module to write CSV files
- `path` - For handling file paths
- `@fast-csv/format` - CSV generation library
- `uuid` - For generating unique filenames

## API Response Mapping
Each row in the CSV file corresponds to an `id` and contains:
| id | name  | title | body |
|----|-------|-------|------|
| 1  | Alice | Post1 | Comment1 |
| 2  | Bob   | Post2 | Comment2 |
| ...| ...   | ...   | ...   |

## Error Handling
- If an API request fails, the server responds with an error message.
- Ensures smooth CSV file writing and prevents crashes.

## License
This project is open-source and free to use.

