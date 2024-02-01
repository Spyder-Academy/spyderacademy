function displayResults(results, store) {
    const searchResults = $('#results');
    if (results.length) {
        let cards = '';
        // Iterate and build card elements
        for (const n in results) {
            const item = store[results[n].ref];
            // Assuming item has a coverImage property for the image URL
            cards += `
                <div class="col-lg-6 col-12 pb-3">
                    <a class="card shadow border-0 p-4 text-decoration-none h-100" style="border-radius: 15px;" href="${item.url}">
                        <div class="card-body">
                            <h5 class="card-title fw-semibold">${item.title}</h5>`;

                            // Conditionally display author or level if available
                            if (item.level) {
                                cards += `<p class="card-text text-danger">${item.level} Course</p>`;
                            }
                            else if (item.author) {
                                cards += `<p class="card-text text-danger">By ${item.author}</p>`;
                            } 

                            // Assuming item.summary is available
                            cards += `
                            <p class="card-text text-black-61">${item.summary || item.content.substring(0, 150) + '...'}</p>
                        </div>
                    </a>
                </div>`;
        }
        searchResults.html(cards); // Use .html() to replace existing content
    } else {
        searchResults.text('No results found.');
    }
}

  
// Get the query parameter(s)
const params = new URLSearchParams(window.location.search)
const query = params.get('query')

  // Perform a search if there is a query
if (query) {

    // Retain the search input in the form when displaying results
    document.getElementById('search-input').setAttribute('value', query)

  
    const idx = lunr(function () {
      this.ref('id')
      this.field('title', {
        boost: 15
      })
      this.field('tags')
      this.field('author')
      this.field('level')
      this.field('content', {
        boost: 10
      })
  
      for (const key in window.store) {
        this.add({
          id: key,
          title: window.store[key].title,
          author: window.store[key].author,
          level: window.store[key].level,
          tags: window.store[key].category,
          content: window.store[key].content
        })
      }
    })
  
    // Perform the search
    const results = idx.search(query)
    // Update the list with results
    displayResults(results, window.store)
}