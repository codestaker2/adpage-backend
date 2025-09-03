const { query } = require('../db');

const getSearch = async (req, res) => {
  let search = req.query.search; // Get the search term from the query parameters
  let page = parseInt(req.query.page) || 1; // Default page is 1
  let pageSize = parseInt(req.query.pageSize) || 10; // Default page size is 10
  console.log(req.query);

  // Calculate the offset for pagination
  let offset = (page - 1) * pageSize;

  console.log("Original results:", search);
  console.log("Page:", page, "Page size:", pageSize, "Offset:", offset);

  // If no search term (empty or missing), return all posts with pagination
  if (!search || search.trim() === "") {
    try {
      const allPostsSql = `
        SELECT title, content, location
        FROM posts
        LIMIT $1 OFFSET $2;  -- Apply pagination
      `;
      const allPostsResult = await query(allPostsSql, [pageSize, offset]);
      return res.json({
        searchData: allPostsResult.rows,
        searchTerm: "",
        page,
        pageSize
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while fetching all posts' });
    }
  }

  // Format the search term for full-text search
  const formattedResults = search?.split(' ').join(' & ');

  try {
    // Attempt Fuzzy Search using Trigram similarity (ILIKE)
    const fuzzySearchSql = `
      SELECT title, content, location,
             SIMILARITY(title, $1) AS title_similarity,
             SIMILARITY(content, $1) AS content_similarity,
             SIMILARITY(location, $1) AS location_similarity
      FROM posts
      WHERE title % $1 OR content % $1 OR location % $1
      ORDER BY
        (SIMILARITY(title, $1) * 2 +
         SIMILARITY(content, $1) * 1 +
         SIMILARITY(location, $1) * 0.5) DESC
      LIMIT $2 OFFSET $3;  -- Apply pagination
    `;
    const fuzzySearchResult = await query(fuzzySearchSql, [search, pageSize, offset]);
   // If fuzzy search yields results, return them
    if (fuzzySearchResult.rows.length > 0) {
      return res.json({
        searchData: fuzzySearchResult.rows,
        searchTerm: search,
        page,
        pageSize
      });
    }

    // If no fuzzy search results, fallback to Full-Text Search with to_tsquery
    const fullTextSearchSql = `
      SELECT title, content, location,
             ts_rank_cd(document, to_tsquery($1)) AS rank
      FROM posts
      WHERE document @@ to_tsquery($1)
      ORDER BY rank DESC  -- Sort by relevance
      LIMIT $2 OFFSET $3;  -- Apply pagination
    `;
    const fullTextSearchResult = await query(fullTextSearchSql, [formattedResults, pageSize, offset]);

    // If full-text search doesn't return results, fall back to direct ILIKE search for exact match
    if (fullTextSearchResult.rows.length === 0) {
      const exactMatchSql = `
        SELECT title, content, location
        FROM posts
        WHERE title ILIKE $1 OR content ILIKE $1 OR location ILIKE $1
        LIMIT $2 OFFSET $3; -- Apply pagination
      `;
      const exactMatchResult = await query(exactMatchSql, [search, pageSize, offset]);
      return res.json({
        searchData: exactMatchResult.rows,
        searchTerm: search,
        page,
        pageSize
      });
    }

    // Return full-text search results or empty array if no results
    return res.json({
      searchData: fullTextSearchResult.rows,
      searchTerm: search,
      page,
      pageSize
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
};

module.exports = { getSearch };
