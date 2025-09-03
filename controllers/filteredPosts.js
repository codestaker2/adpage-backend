const { query } = require('../db');

const filteredPosts = async (req, res) => {
    console.log("req.body", req.body);

    const filters = req.body;  // Get the filters from the frontend

    // Build the SQL query dynamically based on the filters
    let query = "SELECT * FROM posts WHERE 1=1";
    let params = [];
    let placeholderIndex = 1;

    // Handle the colors filter (IN)
    if (filters.colors && filters.colors.length > 0) {
        query += " AND color IN (" + filters.colors.map((_, index) => `$${placeholderIndex + index}`).join(', ') + ")";
        params.push(...filters.colors);  // Add colors to the params list
        placeholderIndex += filters.colors.length;  // Increment the placeholder index
    }

    // Handle the service filter (IN)
    if (filters.services && filters.services.length > 0) {
        query += " AND service IN (" + filters.services.map((_, index) => `$${placeholderIndex + index}`).join(', ') + ")";
        params.push(...filters.services);  // Add service values to the params list
        placeholderIndex += filters.services.length;  // Increment the placeholder index
    }

    // Handle the location filter (IN)
    if (filters.locations && filters.locations.length > 0) {
        query += " AND location IN (" + filters.locations.map((_, index) => `$${placeholderIndex + index}`).join(', ') + ")";
        params.push(...filters.locations);  // Add location values to the params list
        placeholderIndex += filters.locations.length;  // Increment the placeholder index
    }

    // Handle the countries filter (IN)
    if (filters.countries && filters.countries.length > 0) {
        query += " AND country IN (" + filters.countries.map((_, index) => `$${placeholderIndex + index}`).join(', ') + ")";
        params.push(...filters.countries);  // Add country values to the params list
        placeholderIndex += filters.countries.length;  // Increment the placeholder index
    }

    // Handle the other filter (IN)
    if (filters.other && filters.other.length > 0) {
        query += " AND other IN (" + filters.other.map((_, index) => `$${placeholderIndex + index}`).join(', ') + ")";
        params.push(...filters.other);  // Add other values to the params list
        placeholderIndex += filters.other.length;  // Increment the placeholder index
    }

    return res.status(200).json(params)
}

module.exports = { filteredPosts }
