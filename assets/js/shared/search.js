function displayResults(results, store) {
    const searchResults = $('#results');
    let foundStocks = false;

    if (results.length) {
        let cards = '';
        var stockWidgetConfig = '';

        // Check if any of the results have a tag of 'stocks'
        for (const n in results) {
            const item = store[results[n].ref];
            if (item.ticker) {
                foundStocks = true;
                // Add only the widget container
                cards += `
                    <div class="col-12 pb-3">
                        <div class="card-body">
                            <div class="tradingview-widget-container">
                                <div id="tradingview-widget-container__widget"></div>
                            </div>
                        </div>
                    </div>
                `;

                // Create the configuration object

                // userTrades = new Trades();
                // userTrades.fetchIVData(item.ticker);

                stockWidgetConfig = {
                    "symbols": [
                        [
                            `${item.ticker}|1D` 
                        ]
                      ],
                      "chartOnly": false,
                      "width": "100%",
                      "height": 500,
                      "locale": "en",
                      "colorTheme": "light",
                      "autosize": false,
                      "showVolume": false,
                      "showMA": false,
                      "hideDateRanges": false,
                      "hideMarketStatus": false,
                      "hideSymbolLogo": false,
                      "scalePosition": "right",
                      "scaleMode": "Normal",
                      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
                      "fontSize": "10",
                      "noTimeScale": false,
                      "valuesTracking": "1",
                      "changeMode": "price-and-percent",
                      "chartType": "area",
                      "maLineColor": "#2962FF",
                      "maLineWidth": 1,
                      "maLength": 9,
                      "lineWidth": 2,
                      "lineType": 0,
                      "dateRanges": [
                        "1d|1",
                        "1m|30",
                        "3m|60",
                        "12m|1D",
                        "60m|1W",
                        "all|1M"
                      ]
                };

                break; // Stop checking once we find 'stocks'
            }
        }

        // Existing logic to build cards
        for (const n in results) {
            const item = store[results[n].ref]; 

            // Assuming item has a coverImage property for the image URL
            cards += `
                <div class="col-lg-6 col-12 pb-lg-3">
                    <a class="card border-1 p-4 text-decoration-none h-100"  href="${item.url}">
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

        // Dynamically create and append the TradingView script
        if (foundStocks) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
            script.async = true;
            script.innerHTML = JSON.stringify(stockWidgetConfig);
            document.getElementById('tradingview-widget-container__widget').appendChild(script);
        }
    } else {
        searchResults.text('No results found.');
    }
}

$(document).ready(function() {
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
});