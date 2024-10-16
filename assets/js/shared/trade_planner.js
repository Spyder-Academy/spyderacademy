class TradePlanner {

  constructor() {
    this.red = "#ff3131";
    this.green = "#00bf63";
    this.yellow = "#ffde59";

    this.firestore_db = firebase.firestore();

    // Store the timestamp of the initial page load
    this.pageLoadTimestamp = new Date();
    this.authenticatedMember = null;
  }

  getAuthenticatedMemberDetails(callback) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            this.firestore_db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const memberProfile = doc.data();
                        // console.log("Member profile retrieved:", memberProfile);
                        this.authenticatedMember = memberProfile
                        this.authenticatedMember.uid = doc.id;

                        if (callback && typeof callback === 'function') {
                            callback(memberProfile);
                        }
                    } else {
                        console.log("No user profile found in Firestore for this UID");
                    }
                })
                .catch((error) => {
                    console.error("Error fetching user profile:", error);
                });
        } else {
            callback(null);
        }
    });
  }



  sortEarningsData(data) {
    data.sort((a, b) => {
      // Compare by date
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;

      // Compare by earnings time (premarket/postmarket)
      if (a.when === 'pre market' && b.when !== 'pre market') return -1;
      if (a.when !== 'pre market' && b.when === 'pre market') return 1;

      // Compare by market cap
      return b.marketCap - a.marketCap; // Descending order
    });
  }


  async renderEarningsCalendar(){
    var url = "https://api.spyderacademy.com/v1/earnings/calendar/";

    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response && response.length > 0) {

        this.sortEarningsData(response);

        response.forEach(function(item) {
          
          const symbol = item.symbol;
          const marketCap = item.marketCap;
          const when = item.when; // 'pre market' or 'post market'

          const [year, month, dd] = item.date.split("-").map(Number);
          const date = new Date(year, month - 1, dd, 5, 0, 0, 0);
          const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const logoUrl = `/images/logos/${symbol.toUpperCase()}.png`; 

  
          const logoHtml = `
              <div class="col-3 p-2">
                <div class="card bg-dark text-center p-0 w-100" onclick="selectEarningsSymbol('${symbol}')">
                    <div class="card-body p-0">
                        <div class="earnings-logo">
                            <img src="${logoUrl}" alt="${symbol}" title="${symbol}">
                        </div>
                        <!--<a href="/stocks/${symbol.toLowerCase()}/" class="stretched-link"></a>-->
                    </div>
                    <div class="card-footer px-0 m-0">${symbol}</div>
                </div>
              </div>
          `;
  
          $(`#earnings-${day} .date`).text(date.getDate());

          if (tickers.includes(symbol.toUpperCase())){
            if (when === 'pre market') {
                $(`#earnings-${day} .before-open .row`).append(logoHtml);
            } else {
                $(`#earnings-${day} .after-close .row`).append(logoHtml);
            }
          }
      });

      }
    } catch (error) {
      console.error('Error fetching Earnings Calendar from the API:', error);
    }

  }

  renderEarningsDetails(symbol){
     // Show the card by adding the 'show' class
     this.fetchFinancials(symbol);
     $('#earningsDetailsCard').removeClass('d-none');
     $('#earningsDetailsCard').addClass('show');
  }

  async renderEconomicCalendar(){
    var url = "https://api.spyderacademy.com/v1/macro/calendar/";

    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response && response.length > 0) {

        const currentYear = new Date().getFullYear();

        response.forEach(function(item) {
          const date = new Date(item["Date"] + " " + currentYear + ' 05:00:00 UTC-0400');
          const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          $(`#day-${day} .date`).text(date.getDate());

          item["Events"].forEach(function(event) {
            var highlightClass = ""
            if (event["Impact"] == "High"){
              highlightClass = "gradient-red"
            }

            const event_row = `
              <div class="row p-2 ${highlightClass} lg-rounded mb-1">
                  <div class="col-4 p-0 m-0 text-start text-nowrap" style="min-width: 80px;">${event.Time}</div>
                  <div class="col-8 p-0 m-0 text-start">${event.Release}</div>
              </div>
            `;

            $(`#day-${day} .container`).append(event_row);
          });
        });
      }
    } catch (error) {
      console.error('Error fetching Economic Calendar from the API:', error);
    }
  }


  async getClosePrice(ticker) {
    var sentTicker = ticker.toUpperCase();
    var url = "https://api.options.ai/expected-moves/" + sentTicker;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response && response.length > 0) {
        var item = response[0];
        var closePrice = (item.moveLower + item.moveAmount).toFixed(2);

        return closePrice

      } else {
        console.error('No data received from API.');
      }
    } catch (error) {
      console.error('Error fetching data from the API:', error);
    }
  }


  // Function to listen to new posts for a specific source
  async listenToNewFinXPosts(source) {
    const sourceRef = this.firestore_db.collection('finX').doc(source).collection('posts');

    sourceRef.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const post = change.doc.data();

          // Check if the post is created after the page load
          if (post.timestamp.toDate() > this.pageLoadTimestamp) {
            console.log("New post detected", post);
            this.renderPost(post, source);
          }
        }
      });
    });
  }
  // Function to listen to new posts for OI Tracker
  async listenToNewFlow() {
    const sourceRef = this.firestore_db.collection('flow');

    sourceRef.orderBy('created_date', 'desc').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const post = change.doc.data();

          // Check if the post is created after the page load
          if (post.created_date.toDate() > this.pageLoadTimestamp) {
            var flow_card = this.createFlowPost(post)
            
            //  append the flow card
            $("#WL_FlowTracker").prepend(flow_card);
          }
        }
      });
    });
  }

  // Function to render the new post
  renderPost(post, source) {
    // Append the post to the appropriate column based on the source
    let columnElement;
    switch (source) {
      case "TrendSpider":
        columnElement = $("#X_Charts");
        break;
      case "Banana3":
        columnElement = $("#X_TradeIdeas");
        break;
      case "Taylor":
      case "Trade Talk Media":
      case "Alex Jones Industrial Average":
        columnElement = $("#X_OptionsFlow");
        break;
      // Add more cases as needed
    }

    if (columnElement) {
      let tweetTemplate = this.createTweetTemplate(post); // Create the tweet template
      columnElement.prepend(tweetTemplate); // Prepend the new post to the top of the column
    }
  }



  async fetchXPosts() {
    $(".stock_tweets").empty()
    var url = `https://api.spyderacademy.com/v1/stock/tweets/`;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response && response.length > 0) {

        // Sort the tweets by timestamp in descending order
        response.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        var tweets_Charts = $("#X_Charts")
        var tweets_TradeIdeas = $("#X_TradeIdeas")
        var tweets_OptionsFlow = $("#X_OptionsFlow")

        // render the tweets in the correct columns
        response.forEach(tweet => {
          var tweet_template = this.createTweetTemplate(tweet)

          // append the tweet to the correct author element
          var author = tweet["author"]
          switch (author) {
            case "Javier 🤘":
            case "Jake Wujastyk":
            case "7 Star Setups":
            case "TrendSpider":
              tweets_Charts.append(tweet_template);
              break;

            case "Banana3":
              tweets_TradeIdeas.append(tweet_template);
              break;

            case "Taylor":
            case "Trade Talk Media":
            case "Alex Jones Industrial Average":
              tweets_OptionsFlow.append(tweet_template);
              break;
          }


        });

        this.init_tradingview_popovers();
        this.listenToNewFinXPosts("Javier 🤘")
        this.listenToNewFinXPosts("Jake Wujastyk")
        this.listenToNewFinXPosts("7 Star Setups")
        this.listenToNewFinXPosts("TrendSpider")
        this.listenToNewFinXPosts("Banana3")
        this.listenToNewFinXPosts("Taylor")
        this.listenToNewFinXPosts("Trade Talk Media")
        this.listenToNewFinXPosts("Alex Jones Industrial Average")

      } else {
        console.error('No data received from stock tweets API.');
      }
    } catch (error) {
      console.error('Error fetching data from the stock tweets API:', error);
    }

  }

  createTweetTemplate(tweet) {
    console.log("tweet", tweet)
    var author = tweet["author"]
    var symbol = tweet["symbol"]
    var message = tweet["message"].replace(/\n/g, "<br/>");
    var tweet_link = tweet["url"] ? tweet["url"] : ""
    var source = tweet["source"] ? tweet["source"] : "𝕏"
    var sourceClass = source == "𝕏" ? "twitter": "news"

    var price_difference = ""
    var price_difference_detail = ""
    var price_class = ""


    if (tweet["current_price"] && tweet["price_when_posted"]) {
      var current_price = tweet["current_price"]
      var price_when_posted = tweet["price_when_posted"]

      price_difference_detail = `Price when posted was $${price_when_posted}.  Currently trading at $${current_price}`

      if (current_price >= price_when_posted) {
        price_difference = "<i class='fa-regular fa-circle-up'></i> " + symbol.toUpperCase() + " is Up $" + Math.abs(current_price - price_when_posted).toFixed(2) + " since posted."
        price_class = "text-success"
      }
      else {
        price_difference = "<i class='fa-regular fa-circle-down'></i> " + symbol.toUpperCase() + " is Down $" + Math.abs(current_price - price_when_posted).toFixed(2) + " since posted."
        price_class = "text-danger"
      }

    }

    if (symbol) {
      // var symbolLink = `<a href='/stocks/${lowerSymbol}/'>$${symbol}</a>`;
      var symbolLink = `<a class="" href="/stocks/${symbol.toLowerCase()}/" data-toggle="popover" data-html="true" data-id_prefix="tweets" data-ticker="${symbol}">$${symbol}</a>`

      if (tickers.includes(symbol)) {
        message = message.replace(new RegExp(`\\$${symbol}`, 'g'), symbolLink);
      }
    }

    var image = tweet["image"]
    var timestamp = jQuery.type(tweet["timestamp"]) == "string" ? moment(tweet["timestamp"]) : moment(tweet["timestamp"].toDate())
    // var timestamp = tweet["timestamp"] instanceof FirebaseFirestore.Timestamp
    //                 ? tweet["timestamp"].toDate() // Firestore Timestamp to JavaScript Date
    //                 : moment(tweet["timestamp"]); // String to JavaScript Date

    // Calculate relative time and Eastern Time format
    var relativeTime = timestamp.fromNow();
    var easternTime = timestamp.tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a');

    var tweet_template = `
                <div class="card-body tweet-card post ${sourceClass}">
                    <div class="tweet-header">
                        <div>
                            <a href="${tweet_link}" target="_blank" class="text-decoration-none">${source} <strong>${author}</strong></a> <span class="text-muted"> - <span title="${easternTime}">${relativeTime}</span></span>
                        </div>
                    </div>
                    <div class="tweet-body">
                        <p>${message}</p>
                        ${image ? `<a href="${image}" target="_blank"><img src="${image}" style="border-radius: 15px" class="img-fluid" alt="Tweet Image"></a>` : ''}
                    </div>
                    <div class="tweet-footer text-muted">
                        ${price_difference ? `<div class="${price_class}" title="${price_difference_detail}">${price_difference}</div>` : ``}
                    </div>
                </div>
            `;

    return tweet_template
  }


  async  fetchRSSFeed(url) {
    const CORS_PROXY = 'https://api.allorigins.win/get?url=';
    const RSS_URL = encodeURIComponent(url);
    const response = await fetch(CORS_PROXY + RSS_URL);
    const data = await response.json();
    const parser = new RSSParser();
    const feed = await parser.parseString(data.contents);
    return feed;
  }

  async  displayRSSFeed() {
      const RSS_URL = 'https://news.google.com/rss/search?q={{ $symbol }}+stock&hl=en-US&gl=US&ceid=US:en';
      try {
          const feed = await fetchRSSFeed(RSS_URL);
          const feedContainer = document.getElementById('news-feed');
          feedContainer.replaceChildren();


          // Sort feed items by pubDate in descending order
          feed.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

          feed.items.forEach(item => {
              var title = item.title.split(" - ")[0]
              var source = item.title.split(" - ")[1]
              
              // var formattedTimestampStr = new Date(item.pubDate).toLocaleDateString()
              
              var timestamp = moment(item.pubDate)
              var relativeTime = timestamp.fromNow();
              var easternTime = timestamp.tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a');
              
              const itemElement = document.createElement('div');
              itemElement.className = 'col-12 ';
              itemElement.innerHTML = `
                  <div class="card-body tweet-card post h-100">
                      <div class="tweet-header">
                          <div>
                              <strong>${source}</strong> <span class="text-muted"> - <span title="${easternTime}" >${relativeTime}</span></span>
                          </div>
                      </div>
                      <div class="tweet-body">
                      <p>
                          <a href="${item.link}" target="_blank">${title}</a>
                      </p>
                      </div>
                  </div>
              `
              
              feedContainer.appendChild(itemElement);
          });
      } catch (error) {
          console.error('Error fetching RSS feed:', error);
      }
  }


  async showStockPulse(symbol, limit = 10) {
    // Clear the existing content
    $("#stock_social_row").empty();
  
    // Define the URLs for the API calls
    const tweets_url = `https://api.spyderacademy.com/v1/stock/tweets/?ticker=${symbol}`;
    const RSS_URL = `https://news.google.com/rss/search?q=${symbol}+stock&hl=en-US&gl=US&ceid=US:en`;
  
    // Fetch tweets and show them first
    let tweets_response = await $.ajax({ url: tweets_url, method: 'GET' });
  
    // Render the tweets
    this.renderPosts(tweets_response, limit);
  
    // Fetch RSS news feed
    let news_response = await this.fetchRSSFeed(RSS_URL);
  
    // Once news feed is ready, create the posts and splice them into the display
    let news_posts = [];
    news_response.items.forEach(item => {
      var post = {
        "author": item["title"],
        "symbol": symbol,
        "message": item["contentSnippet"],
        "url": item["link"],
        "timestamp": item["isoDate"],
        "source": "📰"
      };
      news_posts.push(post);
    });
  
    // Combine with tweets
    let combined_response = tweets_response.concat(news_posts);
  
    // Sort by timestamp in descending order
    // combined_response.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
    // Limit the number of posts
    // combined_response = combined_response.slice(0, limit);
  
    // Update the display by rendering the new combined response
    this.renderPosts(combined_response, limit);
  }

  // Function to render posts
  async renderPosts(posts, limit) {
    $("#stock_social_row").empty(); // Optionally, clear existing posts first

    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    posts = posts.slice(0, limit);


    posts.forEach(item => {
      var post_template = this.createTweetTemplate(item);
      var post_div = $("<div class='col-xl-3 col-md-6 col-12 p-0'><div class='card m-2'>" + post_template + "</div></div>");
      $("#stock_social_row").append(post_div);
    });

    // Initialize or re-layout Masonry
    var msnry = new Masonry('#stock_social_row', {
      percentPosition: false
    });

    // Layout Masonry after each image loads
    imagesLoaded('#stock_social_row').on('progress', function () {
      msnry.layout();
    });
  }

  async showStockTweets(symbol) {
    $("#stock_social_row").empty()
    var url = `https://api.spyderacademy.com/v1/stock/tweets/?ticker=${symbol}`;
    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response && response.length > 0) {
        $(".stock_social_row").removeClass("d-none")

        // Sort the tweets by timestamp in descending order
        response.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // render the tweets 
        response.forEach(tweet => {

          var tweet_template = this.createTweetTemplate(tweet);
          $("#stock_social_row").append(tweet_template);
        });

        this.init_tradingview_popovers()

      } else {
        // if there is no flow to display, show an empty card 
        var flow_card = `
                      <div class="col-12 social-card">
                        <div class="card-body tweet-card post">
                            <div class="tweet-header">
                                <div>
                                    <strong>Come Back Later</strong></span>
                                </div>
                            </div>
                            <div class="tweet-body">
                                <p>
                                  We don't currently have any 𝕏 Posts for ${ticker}.
                                </p>
                            </div>
                        </div>
                      </div>
                    `


        //  append the flow card
        $("#stock_social_row").append(flow_card);
        $(".stock_social_row").removeClass("d-none");
      }
    } catch (error) {
      console.error('Error fetching data from the stock tweets API:', error);
    }
  }

  convertContract(contractString) {
    // Split the string into parts
    let parts = contractString.split('_');
    let ticker = parts[0];
    let rest = parts[1];

    // Extract date, type, and strike price
    let year = rest.substring(0, 2);
    let month = rest.substring(2, 4);
    let day = rest.substring(4, 6);
    let type = rest.substring(6, 7).toLowerCase();
    let strikePrice = rest.substring(7);

    // Format the result string
    let formattedDate = `${month}/${day}/${year}`;
    let result = `${ticker} ${strikePrice}${type} ${formattedDate}`;

    return result;
  }


  createFlowPost(flow){

    function toTitleCase(str) {
      return str.replace(/(?:^|\s)\w/g, function (match) {
        return match.toUpperCase();
      });
    }

    var contract = flow["contract"]
    var parsedContract = this.convertContract(contract)
    
    var timestamp = jQuery.type(flow["created_date"]) == "string" ? moment(flow["created_date"]) : moment(flow["created_date"].toDate())
    var relativeTime = timestamp.fromNow();
    var easternTime = timestamp.tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a');

    var message = toTitleCase(flow["status"]).replaceAll("\n", "<br/>")


    var flow_tweet_author = flow["author"]
    var flow_tweet_url = flow["url"]
    var flow_tweet_msg = flow["post_message"]

    // create the flow card
    var flow_card = `
              <div class="card-body tweet-card post" id="flowCard_${contract.replace(".", "_")}">
                  <div class="tweet-header">
                      <div>
                          <strong><a href="/stocks/${flow["ticker"].toLowerCase()}/#flow">${parsedContract}</a></strong> <span class="text-muted"> - <span title="${easternTime}" >${relativeTime}</span></span>
                      </div>
                  </div>
                  <div class="tweet-body">
                    <p>
                      <a href="${flow_tweet_url}" target="_blank">${flow_tweet_author}</a> - ${flow_tweet_msg}<br/><br/>
                      ${message}
                    </p>
                  </div>
                  
              </div>
            `

    return flow_card

  }

  async fetchAllFlow() {
    var url = `https://api.spyderacademy.com/v1/stock/flow/`;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });

      if (response) {
        // loop through all flow returned
        response.forEach(flow => {
          // for each flow tracked
          // console.log(flow)
          var flow_card = this.createFlowPost(flow)
          //  append the flow card
          $("#WL_FlowTracker").append(flow_card);
        });

        this.listenToNewFlow()

        // loop back through the flow adding in the options pricing.
        await this.fetchOptionsPricing(response)
      }
    }
    catch (error) {
      throw error
    }
  }

  async fetchOptionsPricing(flow_list) {
    // console.log("fetch pricng for flow: ", flow)

    var unique_flow = []
    flow_list.forEach(f => {
      unique_flow.push({
        "contract": f["contract"],
        "created_date": f["created_date"]
      })
    });

    var url = `https://api.spyderacademy.com/v1/stock/options/price/`;

    try {
      let response = await $.ajax({
        url: url,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(unique_flow)
      });

      if (response) {
        // console.log(response)
        // update the flow tracker with latest pricing info

        response.forEach(flow_pricing => {
          if (flow_pricing["options_price"] && flow_pricing["options_price"].length > 0) {
            // get the flow for this contract
            var flow = flow_list.find(x => x["contract"] == flow_pricing["contract"])

            var price_when_posted = flow["options_price_when_posted"]

            var current_price = parseFloat(flow_pricing["options_price"][0]["close_price"])
            var today_low_price = parseFloat(flow_pricing["options_price"][0]["low_price"])
            var today_high_price = parseFloat(flow_pricing["options_price"][0]["high_price"])
            var price_difference = ((current_price - price_when_posted) / price_when_posted) * 100
            var updown = price_difference >= 0 ? "up" : "down"
            var updown_message = `This contract is currently ${updown} about ${Math.abs(price_difference).toFixed(0)}%.`

            var max_gain = ((Math.max(flow["max_price"], today_high_price) - price_when_posted) / price_when_posted) * 100
            var max_loss = ((Math.min(flow["min_price"], today_low_price) - price_when_posted) / price_when_posted) * 100

            var rating = undefined
            var rating_el = ""
            var rating = 0
            if (flow["rating"] != undefined) {
              rating = parseInt(flow["rating"])

              switch (Math.ceil((rating / 100) * 5)) {
                case 5:
                  rating_el = `<i class="fa-solid fa-fire text-secondary"></i>`
                  break;
                case 4:
                  rating_el = `<i class="fa-solid fa-star text-warning"></i>`
                  break;
                case 3:
                  rating_el = `<i class="fa-solid fa-star-half-stroke"></i>`
                  break;
                case 2:
                  rating_el = `<i class="fa-solid fa-face-meh"></i>`
                  break;
                case 1:
                  rating_el = `<i class="fa-solid fa-poop"></i>`
                  break;
              }
            }

            // update the html with the price details
            var flow_pricing_div = `
                    <div class="tweet-footer text-muted ${price_when_posted == undefined ? 'd-none' : ''}">
                        <div class="row w-100 ">
                          <div class="col-3 p-0 text-center" title="This contract has seen a Maximum Gain of ${max_gain.toFixed(0)}%"><i class="fa fa-money-bill-trend-up text-success"></i> ${max_gain.toFixed(0)}%</div>
                          <div class="col-3 p-0 text-center" title="The Lowest Price this contract has seen is ${max_loss.toFixed(0)}%"><i class="fa fa-sack-xmark pl-3 text-danger"></i> ${max_loss.toFixed(0)}%</div>
                          <div class="col-3 p-0 text-center" title="The Current Value of this contract is about ${price_difference.toFixed(0)}%"><i class="fa ${updown == 'up' ? 'fa-arrow-up' : 'fa-arrow-down'} pl-3 ${updown == 'up' ? 'text-success' : 'text-danger'}"></i> ${Math.abs(price_difference).toFixed(0)}% </div>
                          <div class="col-3 p-0 text-center" title="The Flow Strength is ${(Math.ceil((rating / 100) * 5))}/5")>${rating_el}</div>
                        </div>
                    </div>
                  `

            var updown_message = `<p class="${updown == 'up' ? 'text-success' : 'text-danger'}">${updown_message}</p>`


            // add the div to the appropriate flow card
            var contract = flow["contract"]
            $(`#flowCard_${contract.replace(".", "_")}`).append(flow_pricing_div)
            $(`#flowCard_${contract.replace(".", "_")} .tweet-body`).append(updown_message)
          }
        })

      }
    }
    catch (error) {
      throw error
    }
  }

  async fetchFlow(ticker) {
    var url = `https://api.spyderacademy.com/v1/stock/flow/?ticker=${ticker.toUpperCase()}`;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });


      if (response) {
        // loop through all flow returned for this ticker
        // console.log(response.json)
        response.forEach(flow => {
          // for each flow tracked
          // console.log("options price list", flow["options_price"])

          var contract = flow["contract"]
          var parsedContract = this.convertContract(contract)
          var timestamp = moment(flow["created_date"])
          var relativeTime = timestamp.fromNow();
          var easternTime = timestamp.tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a');

          var message = flow["status"].replaceAll("\n", "<br/>")

          var price_when_posted = flow["options_price_when_posted"]
          var current_price = 0
          var price_difference = 0
          var updown = "flat"
          var updown_message = ""
          var max_gain = 0
          var max_loss = 0

          if (price_when_posted != undefined) {
            var options_prices = flow["options_price"]
            var last_price = options_prices[options_prices.length - 1]

            let current_date = moment().tz("America/New_York").format('YYYY-MM-DD');
            // console.log(last_price, current_date)
            if (last_price["date"] == current_date) {
              current_price = parseFloat(last_price["close_price"])
              var today_low_price = parseFloat(last_price["low_price"])
              var today_high_price = parseFloat(last_price["high_price"])

              // console.log(current_price, last_price, flow, price_when_posted)

              price_difference = ((current_price - price_when_posted) / price_when_posted) * 100
              updown = price_difference >= 0 ? "up" : "down"
              updown_message = `This contract is currently ${updown} about ${Math.abs(price_difference).toFixed(0)}%.`

              max_gain = ((Math.max(flow["max_price"], today_high_price) - price_when_posted) / price_when_posted) * 100
              max_loss = ((Math.min(flow["min_price"], today_low_price) - price_when_posted) / price_when_posted) * 100
            }
          }

          var rating = undefined
          var rating_el = ""
          var rating = 0
          var stu_size = 0, stu_time = 0, stu_urgency = 0, stu_conviction = 0, stu_value = 0, exp_from_now = ""

          if (flow["rating"] != undefined) {
            rating = parseInt(flow["rating"])

            switch (Math.ceil((rating / 100) * 5)) {
              case 5:
                rating_el = `<i class="fa-solid fa-fire text-secondary"></i>`
                break;
              case 4:
                rating_el = `<i class="fa-solid fa-star text-warning"></i>`
                break;
              case 3:
                rating_el = `<i class="fa-solid fa-star-half-stroke"></i>`
                break;
              case 2:
                rating_el = `<i class="fa-solid fa-face-meh"></i>`
                break;
              case 1:
              case 0:
                rating_el = `<i class="fa-solid fa-poop"></i>`
                break;
            }


            function formatNumber(num) {
              if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
              } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
              }
              return num;
            }

            // Get the breakdown for STU
            if (flow["size_time_urgency"] !== undefined) {
              stu_size = (parseInt(flow["size_time_urgency"]["size_rating"]) / 5) * 100
              stu_value = formatNumber(parseInt(flow["size_time_urgency"]["total_size"]))
              stu_time = (parseInt(flow["size_time_urgency"]["time_rating"]) / 5) * 100
              stu_urgency = (parseInt(flow["size_time_urgency"]["urgency_rating"]) / 5) * 100
              stu_conviction = (parseInt(flow["size_time_urgency"]["conviction_rating"]) / 5) * 100
              var daysUntilExpiration = (parseInt(flow["size_time_urgency"]["days_until_expiration"]))
              var expirationDate = moment().add(daysUntilExpiration, 'day')
              exp_from_now = "Expires " + expirationDate.fromNow()

              var flow_image = flow["size_time_urgency"]["image_url"]

              message = message.replace("flow", `<a data-toggle="img_popover" href="${flow_image}" data-img="${flow_image}" target="_blank">flow</a>`)
            }
          }

          var flow_tweet_author = flow["author"]
          var flow_tweet_url = flow["url"]
          var flow_tweet_msg = flow["post_message"]

          // create the flow card
          var flow_card = `
                  <div class="col-xl-3 col-12 p-0 m-0">
                    <div class="social-card card m-1 border-1 lg-rounded">
                      <div class="card-body">
                          <div class="tweet-header">
                              <div>
                                  <strong>${parsedContract}</strong> <span class="text-muted"> - <span title="${easternTime}" >${relativeTime}</span></span>
                              </div>
                          </div>
                          <div class="tweet-body">
                              <div style="border-radius: 15px;">
                                  <div id="flow_chart_${contract.replace(".", "")}">
                              </div>
                              <p>
                                <a href="${flow_tweet_url}" target="_blank">Posted By ${flow_tweet_author}</a> - ${flow_tweet_msg}<br/><br/>
                                ${message}
                              </p>
                              <p class="${updown == 'up' ? 'text-success' : 'text-danger'}">${updown_message}</p>
                          </div>
                          <div class="tweet-footer text-muted ${price_when_posted == undefined ? 'd-none' : ''}">
                            <div class="row w-100">
                              <div class="col-3 p-0 text-center" title="This contract has seen a Maximum Gain of ${max_gain.toFixed(0)}%"><i class="fa fa-money-bill-trend-up text-success"></i> ${max_gain.toFixed(0)}%</div>
                              <div class="col-3 p-0 text-center" title="The Lowest Price this contract has seen is ${max_loss.toFixed(0)}%"><i class="fa fa-sack-xmark pl-3 text-danger"></i> ${max_loss.toFixed(0)}%</div>
                              <div class="col-3 p-0 text-center" title="The Current Value of this contract is about ${price_difference.toFixed(0)}%"><i class="fa ${updown == 'up' ? 'fa-arrow-up' : 'fa-arrow-down'} pl-3 ${updown == 'up' ? 'text-success' : 'text-danger'}"></i> ${Math.abs(price_difference).toFixed(0)}% </div>
                              <div class="col-3 p-0 text-center stu_popover" title="The Flow Strength is ${(Math.ceil((rating / 100) * 5))}/5" data-toggle="STU_popover" data-html="true" data-chart_id="stu_chart_${contract.replace(".", "")}" data-stu_size="${stu_size}" data-stu_time="${stu_time}" data-stu_urgency="${stu_urgency}" data-stu_conviction="${stu_conviction}" data-stu_value="${stu_value}" data-stu_exp_from_now="${exp_from_now}">${rating_el}</div>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                  `


          //  append the flow card
          $(".flow_tracker_row").append(flow_card);
          $(".flow_tracker_row").removeClass("d-none");

          this.init_tradingview_popovers()

          // Extract and align data for the chart
          let openInterestData = {};
          flow["open_interest"].forEach(oi => {
            let date = moment(oi.date).format('YYYY-MM-DD');
            openInterestData[date] = oi.open_interest;
          });

          let optionsPriceData = {};
          flow["options_price"].forEach(op => {
            let date = moment(op.date).format('YYYY-MM-DD');
            optionsPriceData[date] = op.close_price;
          });

          // console.log(openInterestData, optionsPriceData, flow["options_price"], flow)

          // Combine all dates from both openInterest and optionsPrice
          let allDates = [...new Set([...Object.keys(openInterestData), ...Object.keys(optionsPriceData)])];
          allDates.sort();

          let alignedOpenInterestData = allDates.map(date => openInterestData[date] || null);
          let alignedOptionsPriceData = allDates.map(date => optionsPriceData[date] || null);
          let labels = allDates.map(date => moment(date).format('DD MMM YYYY'));



          // create the apexChart for this card
          var options = {
            series: [{
              name: 'Open Interest',
              type: 'column',
              data: alignedOpenInterestData
            }, {
              name: 'Options Close Price',
              type: 'line',
              data: alignedOptionsPriceData
            }],
            chart: {
              height: 240, // Smaller height for sparkline
              type: 'line',
              sparkline: {
                enabled: true
              }
            },
            stroke: {
              curve: 'smooth',
              width: [0, 4]
            },
            fill: {
              opacity: [0.35, 1]
            },
            labels: labels,
            yaxis: [
              {
                title: {
                  text: 'Open Interest',
                },
              },
              {
                opposite: true,
                title: {
                  text: 'Options Close Price',
                },
              },
            ],
            markers: {
              size: 0
            },
            tooltip: {
              enabled: true, // Enable tooltips for better interaction
              shared: true, // Show tooltips for both series
              intersect: false, // Ensure tooltips don't overlap
              x: {
                formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
                  return labels[dataPointIndex];
                }
              },
              y: {
                formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
                  if (seriesIndex === 0) {
                    return value;
                  }
                  else if (value == null) {
                    return "$ -"
                  }
                  else {
                    return "$" + value;
                  }
                }
              }

            }
          };

          var chart = new ApexCharts(document.querySelector("#flow_chart_" + contract.replace(".", "")), options);
          chart.render();

          // Initialize Masonry
          var msnry = new Masonry('#flow_tracker_row', {
            percentPosition: false
          });

          // Layout Masonry after each image loads
          imagesLoaded('#flow_tracker_row').on('progress', function() {
            msnry.layout();
          });
        });
      }

      // if there is no flow to display, show an empty card 
      if (response.length == 0) {
        var flow_card = `
                    <div class="col-12 social-card">
                      <div class="card-body tweet-card post">
                          <div class="tweet-header">
                              <div>
                                  <strong>Come Back Later</strong></span>
                              </div>
                          </div>
                          <div class="tweet-body">
                              <p>
                                We currently aren't tracking any flow for ${ticker}.
                              </p>
                          </div>
                      </div>
                    </div>
                  `


        //  append the flow card
        $(".flow_tracker_row").removeClass("d-none");
        $("#flow_tracker_row").append(flow_card);
      }
    }
    catch (error) {
      console.log(error)
      throw error
    }
  }

  async renderLiveGammaChart(ticker) {
    console.log("render live chart for ", ticker)

    // Show the card by adding the 'show' class
    var tvChartEl = $(".tvChartHeader")[0]
    $(".tvChartHeader").empty()

    var chart = LightweightCharts.createChart(tvChartEl, {
        height: 600,
        rightPriceScale: {
            visible: true,
            borderVisible: false,
        },
        leftPriceScale: {
            visible: true,
            borderColor: '#0000000',
        },
        timeScale: {
            timeVisible: true,
            borderVisible: false,
        },
        rightPriceScale: {
            borderVisible: false,
        },
        layout: {
            background: {
                type: 'solid',
                color: 'black',
            },
            textColor: 'white',
        },
        crosshair: {
            horzLine: {
                visible: true,
                labelVisible: true,
            },
            vertLine: {
                visible: true,
                style: 0,
                width: 2,
                color: 'rgba(32, 38, 46, 0.1)',
                labelVisible: true,
            },
        },
        // hide the grid lines
        grid: {
            vertLines: {
                visible: false,
            },
            horzLines: {
                visible: false,
            },
        },
    });

    var priceSeries = chart.addCandlestickSeries({
        priceScaleId: 'left',
        overlay: true,
        lineWidth: 6,
        priceLineVisible: true, // Remove the horizontal line for the current close price
    });


    // Get the gamma data
    var jsonData = await this._fetchGEXOverlayData(ticker, 'week');

    const { stockSeries, gammaSeries, gexAnnotations, netGammaSeries, callGammaSeries, putGammaSeries } = this._prepareGEXOverlayChartData(jsonData);
    
    // add the price data to the chart
    var priceData = [];
    stockSeries.forEach((item) => {
      // convert a UTC date from firebase to a timestamp for Tradingview lightweight charts, and present in Eastern Time  
      var localTime = new Date(new Date(item.x).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      var timestampInSeconds = Math.floor(localTime.getTime() / 1000);
      
      priceData.push({
          time: timestampInSeconds,
          open: item.o,
          high: item.h,
          low: item.l,
          close: item.c
      });

    });
    priceSeries.setData(priceData);

    // add the net gamma series with a different y axis
    var netGammaSeriesData = [];
    netGammaSeries.forEach((item) => {  
      var localTime = new Date(new Date(item.x).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      var timestampInSeconds = Math.floor(localTime.getTime() / 1000);
      var price = item.y  

      netGammaSeriesData.push({
        time: timestampInSeconds, 
        value: price
      });
    });

    var netGammaSeriesChart = chart.addLineSeries({
      color: 'rgba(255, 255, 255, 0.7)',  // White color
      priceScaleId: 'right',
      overlay: true,
      priceLineVisible: false,
      lastValueVisible: true,
      lineWidth: 2,
      title: 'Net Gamma',
    });

    netGammaSeriesChart.setData(netGammaSeriesData);  

    // draw a horizontal line at 0
    const zeroLine = {
        price: 0,
        color: 'rgba(255, 255, 255, 0.7)',
        lineWidth: 2,
        lineStyle: 2, // LineStyle.Dashed
        axisLabelVisible: true,
        title: 'Gamma Zero Line',
    };
    
    netGammaSeriesChart.createPriceLine(zeroLine);
    

    // add the net call gamma series with a different y axis
    var netCallGammaSeriesData = [];
    callGammaSeries.forEach((item) => {  
      var localTime = new Date(new Date(item.x).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      var timestampInSeconds = Math.floor(localTime.getTime() / 1000);
      var price = item.y  

      netCallGammaSeriesData.push({
        time: timestampInSeconds, 
        value: price
      });
    });

    var netCallGammaSeriesChart = chart.addLineSeries({
      color: 'rgba(0, 255, 0, 0.7)',  // Green color
      priceScaleId: 'right',
      overlay: true,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Net Call Gamma',
    });

    netCallGammaSeriesChart.setData(netCallGammaSeriesData);  

    // add the net put gamma series with a different y axis
    var netPutGammaSeriesData = [];
    putGammaSeries.forEach((item) => {  
      var localTime = new Date(new Date(item.x).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      var timestampInSeconds = Math.floor(localTime.getTime() / 1000);
      var price = item.y  

      netPutGammaSeriesData.push({
        time: timestampInSeconds, 
        value: price
      });
    });

    var netPutGammaSeriesChart = chart.addLineSeries({
      color: 'rgba(255, 0, 0, 0.7)',  //  Red color
      priceScaleId: 'right',
      overlay: true,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'Net Put Gamma',
    });

    netPutGammaSeriesChart.setData(netPutGammaSeriesData); 

    // gamma series
    var gammaSeriesData = [];
    gammaSeries.forEach((item) => {  
      var localTime = new Date(new Date(item.x).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      var timestampInSeconds = Math.floor(localTime.getTime() / 1000);
      var price = item.y  

      gammaSeriesData.push({
        time: timestampInSeconds, 
        value: price  
      });
    });

    var gammaSeriesChart = chart.addLineSeries({
      color: 'rgba(255, 165, 0, 0.7)',  // Orange color
      priceScaleId: 'left',
      overlay: true,
      priceLineVisible: false,  
      lastValueVisible: true,
      lineWidth: 20,  // Make the line thicker
      lineType: window.LightweightCharts.LineType.WithGaps,
      title: 'Max Gamma',
    });

    // gammaSeriesChart.setData(gammaSeriesData);

    // make the point transparent if the next value changes
    gammaSeriesChart.setData(gammaSeriesData.map((point, index) => {
      if (index < gammaSeriesData.length - 1 && point.value != gammaSeriesData[index + 1].value) {
        return { time: point.time, value: point.value, color: 'transparent' };
      }
      return point;
    }));  

    chart.timeScale().fitContent();

    // add a firebase listener to update the chart when new gamma data is available
    var gammaRef = this.firestore_db.collection("gamma").doc(ticker).collection("snapshots").orderBy("created_date", "desc").limit(1);
    
    gammaRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          var gammaData = change.doc.data();
          var maxGamma = gammaData["max_gamma"]

          const estOffset = 4 * 60 * 60 * 1000; 
          var created_date = new Date((new Date(change.doc.id)).getTime() - estOffset);
          var timestampInSeconds = Math.floor(created_date.getTime() / 1000);

          // console.log("new gamma data", maxGamma, created_date)

          // update the chart with the new data
          gammaSeriesChart.update({time: timestampInSeconds, value: maxGamma["Strike"]})
          netGammaSeriesChart.update({time: timestampInSeconds, value: maxGamma["net_gamma"]})
          netCallGammaSeriesChart.update({time: timestampInSeconds, value: maxGamma["call_gamma"]})
          netPutGammaSeriesChart.update({time: timestampInSeconds, value: maxGamma["put_gamma"]})
          // use the last price from the price series
          var currentData = priceSeries.data()
          var lastClose = currentData[currentData.length - 1].close;
          priceSeries.update({time: timestampInSeconds, open: lastClose, high: maxGamma["Spot"], low: maxGamma["Spot"], close: maxGamma["Spot"]})
          
        }
      });
    });



  }
  

  isMarketOpen() {
    const now = new Date();
    const easternOffset = -4; // Eastern Daylight Time (EDT) offset in hours
    const utcNow = now.getTime() + (now.getTimezoneOffset() * 6000); // Convert current time to UTC
    const easternTime = new Date(utcNow + (3600000 * easternOffset)); // Convert UTC to Eastern Time
  
    const marketOpen = new Date(easternTime);
    marketOpen.setHours(9, 30, 0, 0); // Set the time to 9:30 AM Eastern
  
    return easternTime >= marketOpen;
  }

  async fetchIVData(ticker) {
    $("#iv_results").addClass("d-none");


    var sentTicker = ticker.toUpperCase();
    var url = `https://api.spyderacademy.com/v1/stock/implied_move/?ticker=${sentTicker}`;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });

      if (response) {
        var item = response;
        console.log("item", item)
        if (item == null){
          $(".gammaExpectedRange").hide()
          return
        }
        else{
          $(".gammaExpectedRange").removeClass("d-none")
        }

        var movePercent = (item.movePercent * 100).toFixed(2) + '%';
        var moveAmount = '$' + item.moveAmount.toFixed(2);
        var rangeTop = '$' + item.moveUpper.toFixed(2);
        var rangeBottom = '$' + item.moveLower.toFixed(2);
        var ivRange = rangeBottom + ' - ' + rangeTop;
        var closePrice = '$' + (item.moveLower + item.moveAmount).toFixed(2);

        var moveByDate = new Date(item.date)
        moveByDate.setUTCHours(5, 0, 0, 0)
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' };
        var moveBy = moveByDate.toLocaleDateString('en-US', options);

        const tsOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'America/New_York' };
        var timestamp = (new Date(item.timestamp)).toString('en-US', tsOptions);

        // Update the HTML elements
        $('.movePercent').text(movePercent);
        $('.moveAmount').text(moveAmount);
        $('.ivRange').text(ivRange);
        $('.closePrice').text(closePrice);
        $('.bullRange').text("$" + item.moveUpper.toFixed(2));
        $('.bearRange').text("$" + item.moveLower.toFixed(2));

        $('#expectedMoveBy').text(`By Market Close on ${moveBy}`)
        $('#expectedMoveBy').attr('title', `Expected Move as of ${timestamp}`)

        $("#iv_results").removeClass("d-none");

        if (item.movePercent < 0.005) {
          $("#expectedMoveChop").removeClass("d-none");
          $(".lowRangeDayWarning").removeClass("d-none");
        }

        // if we have the actuals, we can update the bullseyes
        if (this.isMarketOpen()) {
          if (item.actualHigh && item.actualHigh >= item.moveUpper) {
            $(".bullRangeHit").removeClass("d-none");
          }
          if (item.actualLow && item.actualLow <= item.moveLower) {
            $(".bearRangeHit").removeClass("d-none");
          }
        }

        return { "bears": item.moveLower.toFixed(2), "bulls": item.moveUpper.toFixed(2), "timestamp": item.timestamp }

      } else {
        console.error('No data received from API.');
      }
    } catch (error) {
      console.error('Error fetching Expected Move data from the API:', error);
      $("#expected_move_signal_card").hide();
    }
  }

  async fetchTradesFromPeopleIFollow(ticker = null){
    // get list of trades from people I follow

    // render this list.

    // listen for any new trade alerts for realtime update
    this.listenForTradesFromPeopleIFollow(ticker);
  }


  async listenForTradesFromPeopleIFollow(ticker = null) {
    // Assume currentUserId is the ID of the current user
    const user = firebase.auth().currentUser;
    var currentUserId = null;
    if (user == null) {
        // console.log("not currently logged in, default the follow list for not logged in users");
        currentUserId = "spyderacademy"; // default
    } else {
        // console.log("currently logged in", user.uid);
        currentUserId = user.uid;
    }

    // Reference to the user's document in Firestore
    const userDocRef = this.firestore_db.collection("users").doc(currentUserId);

    // Get the start of the current day (today at 00:00:00)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Flag to track if the no trades post is shown
    let noTradesPostShown = false;

    // Get a reference to the audio element
    const newTradeSound = document.getElementById("newTradeSound");

    // Listen to the user's "following" list
    userDocRef.onSnapshot((doc) => {
        if (doc.exists) {
            const following = doc.data().following || [];

            // console.log("follow list ", following)

            if (following.length > 0) {
                // Listen for new trades posted by users in the "following" list
                let tradesRef = this.firestore_db.collection("trades");

                if (ticker !== null) {
                    tradesRef = tradesRef
                        .where("uid", "in", following)
                        .where("ticker", "==", ticker.toUpperCase())
                        .orderBy("entry_date", "desc")
                        .limit(10);
                } else {
                    tradesRef = tradesRef
                        .where("uid", "in", following)
                        .where("entry_date", ">", startOfDay)
                        .orderBy("entry_date", "desc");
                }

                tradesRef.onSnapshot((snapshot) => {
                    let tradesFound = false;

                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            tradesFound = true;
                            const newTrade = change.doc.data();
                            // Update the UI or notify the user
                            const trade = TradeRecord.from_dict(change.doc.id, newTrade);
                            // console.log(newTrade, trade, change.doc.id)
                            const tradeRow = this.renderTrade(trade);
                            const tradePost = $("<div class='post border-0'>").append(tradeRow);

                            if (trade.entry_date > this.pageLoadTimestamp) {
                                $("#WL_Following").prepend(tradePost);

                                // Play sound when a new trade is added
                                if (newTradeSound) {
                                  newTradeSound.play().catch(error => console.error("Error playing sound:", error));
                                }
                            } else {
                                $("#WL_Following").append(tradePost);
                            }

                            
                        }
                    });

                    // Check if we need to show or hide the no trades post
                    if (tradesFound) {
                        $(".no-trades-post").remove(); // Remove the no trades post if trades are found
                    } else {
                        if (!noTradesPostShown) {
                            const noTradesAvailablePost = $(`
                                <div class='post border-0 no-trades-post'>
                                    <div class='tweet-header fw-bold'>Trade Social</div>
                                    <div class='tweet-body'>
                                        <p>There are no new ideas shared recently by the traders you follow.</p>
                                        <p class="text-center"><a class="p-3 fw-bold btn gradient-green  text-white lg-rounded" href="/profile/connections/">Discover more traders to follow!</a></p>
                                    </div>
                                </div>
                            `);

                            $("#WL_Following").append(noTradesAvailablePost);
                            noTradesPostShown = true;
                        }
                    }
                });
            } else {
                // If not following anyone, show the no trades post
                $(".no-trades-post").remove(); // Remove the no trades post if trades are found

                const notFollowingPost = $(`
                    <div class='post border-0 no-trades-post'>
                        <div class='tweet-header fw-bold'>Trade Social</div>
                        <div class='tweet-body'>
                            <p>You are currently not following any traders.</p>
                            <p class="text-center"><a class="p-3 fw-bold btn gradient-green  text-white lg-rounded" href="/profile/connections/">Discover traders to follow!</a></p>
                        </div>
                    </div>
                `);

                $("#WL_Following").append(notFollowingPost);
            }
        }
    });
  }



  renderTrade(trade){
    // console.log("render trade", trade, trade.tradeid)
    var tradeCard = $('.trade-card-template');

    var tradeCardRow = tradeCard.clone()
    tradeCardRow.removeClass("d-none")
    tradeCardRow.removeClass("template")
    tradeCardRow.removeClass("trade-card-template")
    tradeCardRow.find(".traderName").text(trade.username + " - " + moment((trade.entry_date)).fromNow())
    tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike + " " + trade.expiration)
    tradeCardRow.find(".tradeGain").text(trade.gainsString)
    tradeCardRow.find(".tradeNotes").text(trade.notes)
    tradeCardRow.find(".tradeLogo").attr("src", "/images/logos/" + trade.ticker.toUpperCase() + ".png")
    tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)
    tradeCardRow.find(".tradeRow").on("click", (e) => this.selectTrade(trade.tradeid, e))
    
    if (trade.gainsValue < 0){
      tradeCardRow.find(".trade_card").removeClass("gradient-green")
      tradeCardRow.find(".trade_card").addClass("gradient-red")
    }

    return tradeCardRow
  }

  async selectTrade(tradeid, event){
    // console.log("select trade", tradeid)
    event.stopPropagation();

    var tradeSocial = new TradeSocial()
    tradeSocial.renderTradeDetails(tradeid);
    
    $('#contractDetailsCard').removeClass('d-none');
    $('#contractDetailsCard').addClass('show');

    // Scroll to the top of the page
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Optional: adds a smooth scrolling effect
    });
  }

  async fetchBondAuctions() {
    const apiUrl = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/upcoming_auctions?fields=security_term,security_type,offering_amt,auction_date&sort=auction_date&format=json";

    try {
      let response = await $.ajax({ url: apiUrl, method: 'GET' });
      let currentDate = new Date().toISOString().split('T')[0]; // Get current date without time
      let bondData = response.data.filter(auction => auction.auction_date >= currentDate);
      let groupedAuctions = this.groupAuctionsByDate(bondData);
      this.renderBondCalendar(groupedAuctions);
    } catch (error) {
      console.error('Error fetching bond auction data:', error);
    }
  }

  groupAuctionsByDate(data) {
    let grouped = {};
    data.forEach(i => {
      let auctionDate = new Date(i.auction_date + 'T00:00:00-05:00'); // Appending timezone offset for EST

      let key = auctionDate.getFullYear() + '-'
        + String(auctionDate.getMonth() + 1).padStart(2, '0') + '-'
        + String(auctionDate.getDate()).padStart(2, '0');

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(i); // Add data to the specific date
    });
    return grouped;
  }

  renderBondCalendar(groupedAuctions) {
    // Basic weekly calendar rendering (further customization required)
    let calendarHtml = '';
    Object.keys(groupedAuctions).forEach(date => {

      let auctionDate = new Date(date + 'T00:00:00-05:00'); // Appending timezone offset for EST
      const dayName = auctionDate.toLocaleDateString('en-US', { weekday: 'long' });

      calendarHtml += `<div class="card shadow col-md-2 m-1 p-0 text-center"><div class="card-header">${dayName} ${date}</div>`;
      groupedAuctions[date].forEach(auction => {
        calendarHtml += `<div class='card-body'>${auction.security_term} ${auction.security_type}</div>`;
        // Additional auction details can be added here
      });
      calendarHtml += `</div>`;
    });
    calendarHtml += '</div>';
    $('#bondCalendar').html(calendarHtml);
  }


  async fetchEarningsCalendar(numDays = 5) {
    const apiUrl = "https://api.spyderacademy.com/v1/earnings/calendar/";
    let earningsData = await $.ajax({ url: apiUrl, method: 'GET' });
    this.displayEarningsData(earningsData);
  }

  formatMarketCap(marketCap) {
    return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
  }
  

  displayEarningsCalendarSkeleton(data) {
    let calendarHtml = '';

    // Get list of unique dates from data
    const earningsDateList = [...new Set(data.map(item => item.date))];

    // Get yesterdays's date
    var today = new Date()
    today.setHours(0, 0, 0, 0)

    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    var tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1);

    // var earningsDate = yesterday.setHours(0,0,0,0)
    var currentHour = (new Date()).getHours()

    // Show a table of companies that have earnings after hours today and pre market tomorrow
    for (const earningsDate of earningsDateList) {
      const earningsDt = new Date(earningsDate + 'T00:00:00-05:00');
      earningsDt.setHours(0, 0, 0, 0); // Set to beginning of the day in UTC

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dayName = earningsDt.toLocaleDateString('en-US', options);
      const formattedDate = earningsDt.toISOString().split('T')[0];


      var today = new Date()
      today.setHours(0, 0, 0, 0)

      var yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0)


      // Show earnings from last night (up until 11am)
      // and earnings for tonight afterhours
      // and earnings for tomorrow premarket
      var showEarnings = ((earningsDt >= yesterday && currentHour < 11) || ((earningsDt >= today)))
      // console.log(today, tomorrow, earningsDt, currentHour, showEarnings)

      if (!showEarnings) {
        continue; // Skip dates in the past
      }


      // Check if the day is a weekday
      calendarHtml += `<div class="row mb-3 m-0 p-0" id="earnings-${earningsDate}">`;
      calendarHtml += ` <div class="col-12">`;
      calendarHtml += `   <div class="card shadow m-0">`;
      calendarHtml += `     <div class="card-header">${dayName}</div>`;
      calendarHtml += `     <div class="card-body" id="earnings-data-${earningsDate}">`;
      calendarHtml += `       <div class="row">`;
      calendarHtml += `         <div class="col-lg-2 col-4 fw-bold">Symbol</div>`;
      calendarHtml += `         <div class="col-lg-2       fw-bold d-none d-md-block">Market Cap</div>`;
      calendarHtml += `         <div class="col-lg-2 col-4 fw-bold" title="The Implied Move going into Earnings. This value is set at market close on the date of earnings.">Exp Move</div>`;
      calendarHtml += `         <div class="col-lg-2       fw-bold d-none d-md-block">Bull/Bear Range</div>`;
      calendarHtml += `         <div class="col-lg-1       fw-bold d-none d-md-block">Vol</div>`;
      calendarHtml += `         <div class="col-lg-2 col-4 fw-bold d-md-block">Current Price</div>`;
      calendarHtml += `         <div class="col-lg-1       fw-bold d-none d-md-block"></div>`;
      calendarHtml += `       </div>`;
      calendarHtml += `     </div>`;
      calendarHtml += `   </div>`;
      calendarHtml += ` </div>`;
      calendarHtml += `</div>`;
    }




    // if there is no calendar to display, show the message that there are no earnings this week.
    if (calendarHtml == "") {
      calendarHtml += `<div class="row mb-3 m-0 p-0" id="earnings-empty">`;
      calendarHtml += ` <div class="col-12">`;
      calendarHtml += `   <div class="card shadow m-0">`;
      calendarHtml += `     <div class="card-body" id="earnings-data-empty">`;
      calendarHtml += `       <div class="row">`;
      calendarHtml += `         <div class="col-12">No More Major Earnings Scheduled This Week</div>`;
      calendarHtml += `       </div>`;
      calendarHtml += `     </div>`;
      calendarHtml += `   </div>`;
      calendarHtml += ` </div>`;
      calendarHtml += `</div>`;
    }

    $('#ivflushCalendar').html(calendarHtml);
  }





  async displayEarningsData(data) {
    this.displayEarningsCalendarSkeleton(data); // Display the calendar skeleton
    this.sortEarningsData(data); // Sort the data first



    // Create an object to store earnings data organized by weekday and time
    const earningsCalendar = {
      Monday: { premarket: [], afterhours: [] },
      Tuesday: { premarket: [], afterhours: [] },
      Wednesday: { premarket: [], afterhours: [] },
      Thursday: { premarket: [], afterhours: [] },
      Friday: { premarket: [], afterhours: [] },
    };

    for (const earning of data) {
      if (earning.marketCap >= 10000000000) {


        const earningsDt = new Date(earning.date + 'T00:00:00-05:00');
        earningsDt.setHours(0, 0, 0, 0); // Set to beginning of the day in UTC
        const options = { weekday: 'long' };
        const dayName = earningsDt.toLocaleDateString('en-US', options);

        if (tickers.includes(earning.symbol)) {
          if (earningsCalendar[dayName]) {
            if (earning.when === 'pre market') {
              earningsCalendar[dayName]['premarket'].push(earning.symbol);
            }
            else if (earning.when === 'post market') {
              earningsCalendar[dayName]['afterhours'].push(earning.symbol);
            }
          }
        }
      }
    }

    // display the earnings calendar
    await this.displayEarningsCalendarLogos(earningsCalendar)

    // display the IV Flush Candidates based on the earnings
    for (const earning of data) {
      if (earning.marketCap >= 10000000000 && (tickers.includes(earning.symbol))) {
        var implied_move = "";
        var implied_range = "";
        // var flushable = "";
        var current_price = earning.current_price ? earning.current_price : 0;
        var volume = ""
        var volumeDesc = ""
        var volumeColor = "#000"

        const formattedMarketCap = this.formatMarketCap(earning.marketCap);
        const whenClass = earning.when === 'post market' ? "bg-blue-light" : "";
        const whenIcon = earning.when === 'post market' ? "fa-moon" : "fa-sun";
        const symbol = earning.symbol.toLowerCase();

        const earningsDt = new Date(earning.date + 'T00:00:00-05:00');
        earningsDt.setHours(0, 0, 0, 0); // Set to beginning of the day in UTC

        var iv = earning.implied_move;
        if (iv) {
          implied_move = (iv.percent * 100).toFixed(2) + "%";
          implied_range = "$" + iv.lower.toFixed(2) + " - $" + iv.upper.toFixed(2);
          volume = (iv.volume_today / 1000000).toFixed(1) + "M";
          var avgVolume = (iv.volume_20d / 1000000).toFixed(1) + "M";

          if (iv.volume_today > iv.volume_20d) {
            volumeDesc = "Today's volume of " + volume + " is above the 20 day average volume of " + avgVolume + "."
            volumeColor = '#bfe1cf'
          }
          else {
            volumeDesc = "Today's volume of " + volume + " is below the 20 day average volume of " + avgVolume + "."
            volumeColor = '#a30000'
          }

          if (iv.volume_today <= 3000000) {
            volumeDesc += "\n\nVolume on $" + symbol.toUpperCase() + " is below 3M which indicates low demand, making it a poor IV flush candidate."
            volumeColor = '#a30000'
          }


        }

        var today = new Date()
        today.setHours(0, 0, 0, 0)

        var yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0)

        var showEarnings = ((earningsDt >= yesterday && earning.when === 'post market') || earningsDt >= today && earning.when === 'pre market')



        if (iv && showEarnings) {
          var isRocket = current_price > iv.upper
          var isTrash = current_price < iv.lower
          var isFlushable = current_price > iv.lower && current_price < iv.upper

          var icon = ""
          var moveDesc = ""
          var title = "IV Flush Candidate"
          if (isRocket) {
            moveDesc = "Huge buy up above its expected move!"
            icon = `<span title='${moveDesc}'>🚀</span>`
            title = "Exceeded The Expected Move"
          } else if (isTrash) {
            moveDesc = "Big sell off below its expected move!"
            icon = `<span title='${moveDesc}'>🩸</span>`
            title = "Exceeded The Expected Move"
          } else if (isFlushable && volumeColor == "#bfe1cf") {
            moveDesc = "Current price is still inside its implied move, and with good volume, making this a potential IV Flush Candidate!"
            icon = `<span title='${moveDesc}'>💦</span>`
            title = "IV Flush Candidate"
          } else if (isFlushable && volumeColor == "#a30000") {
            moveDesc = "Current price is still inside its implied move. But the volume on this name sucks."
            icon = `<span title='${moveDesc}'>🐌</span>`
            title = "IV Flush Candidate, but volume is low"
          } else {
            moveDesc = ""
            icon = ""
          }

          var price_difference = ""
          var price_class = ""
          var close_price = iv.upper - (iv.upper - iv.lower);
          if (current_price >= close_price) {
            price_difference = "<i class='fa-regular fa-circle-up'></i> " + earning.symbol.toUpperCase() + " is Up " + Math.abs(((current_price - close_price) / close_price) * 100).toFixed(2) + "% from the close."
            price_class = "text-success"
          }
          else {
            price_difference = "<i class='fa-regular fa-circle-down'></i> " + earning.symbol.toUpperCase() + " is Down " + Math.abs(((current_price - close_price) / close_price) * 100).toFixed(2) + "% from the close."
            price_class = "text-danger"
          }

          // render the list of IV Flush Candidates
          var tweet_template = `
                    <div class="card-body tweet-card post flush-candidate">
                        <div class="tweet-header">
                            <div>
                                <strong>${title}</strong>
                            </div>
                        </div>
                        <div class="tweet-body">
                          <p><a href="/stocks/${symbol}/" >${earning.symbol}</a> had an expected move of ${implied_move}, and its currently at $${current_price.toFixed(2)} ${icon}. </p>
                          <p>${moveDesc}</p>
                          <div class="tradingview-widget-container card p-1" style="border-radius: 15px; background-color: #000" ticker="${earning.symbol}">
                              <div id="tradingview_${earning.symbol.toLowerCase()}"></div>
                          </div>
                        </div>
                        <div class="tweet-footer text-muted">
                            ${price_difference ? `<div class="${price_class}">${price_difference}</div>` : ``}
                        </div>
                    </div>
                  `;

          $("#WL_Earnings").append(tweet_template);

          // Initialize TradingView widget immediately after appending
          var tickerSymbol = earning.symbol.toUpperCase();
          new TradingView.widget({
            "autosize": true,
            "symbol": tickerSymbol,
            "interval": "D",
            "timezone": "America/New_York",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "hide_top_toolbar": true,
            "hide_legend": true,
            "allow_symbol_change": false,
            "save_image": false,
            "calendar": false,
            "hide_volume": true,
            "support_host": "https://www.tradingview.com",
            "container_id": `tradingview_${tickerSymbol.toLowerCase()}`
          });
        }


        // Render the basic HTML structure first
        let earningsEntryHtml = `<div class="row ${whenClass} py-2" style="border-bottom: 1px solid rgba(0,0,0,0.3);" id="earning-${earning.symbol}">`;
        earningsEntryHtml += ` <div class="col-lg-2 col-4 "><a href="/stocks/${symbol}/" data-toggle="popover" data-id_prefix="flush" data-html="true" data-content="" data-ticker="${earning.symbol}">${earning.symbol}</a></div>`;
        earningsEntryHtml += ` <div class="col-lg-2 d-none d-md-block">${formattedMarketCap}</div>`;
        earningsEntryHtml += ` <div class="col-lg-2 col-4 " id="iv-move-${earning.symbol}">${implied_move}</div>`;
        earningsEntryHtml += ` <div class="col-lg-2 d-none d-md-block" id="iv-range-${earning.symbol}">${implied_range}</div>`;
        earningsEntryHtml += ` <div class="col-lg-1 d-none d-md-block" id="iv-volume-${earning.symbol}" style="color: ${volumeColor}" title="${volumeDesc}">${volume}</div>`;
        earningsEntryHtml += ` <div class="col-lg-2 col-4 " id="current-price-${earning.symbol}">$${current_price.toFixed(2)}</div>`;
        earningsEntryHtml += ` <div class="col-lg-1 d-none d-md-block"><i class="fa-solid ${whenIcon}"></i></div>`;
        earningsEntryHtml += `</div>`;

        // Check if the date is in the past
        // hide yesterdays earnings if we are past 11am
        // or it is for tomorrow
        if (iv && showEarnings) {
          $(`#earnings-data-${earning.date}`).append(earningsEntryHtml); // Append the data to the respective day

          var isRocket = current_price > iv.upper
          var isTrash = current_price < iv.lower
          var isFlushable = current_price > iv.lower && current_price < iv.upper

          var icon = ""
          if (isRocket)
            icon = "<span title='Huge buy up above its expected move!'>🚀</span>"
          else if (isTrash)
            icon = "<span title='Big sell off below its expected move!'>🩸</span>"
          else if (isFlushable && volumeColor == "#bfe1cf")
            icon = "<span title='Current price is still inside its implied move, and with good volume!'>💦</span>"
          else if (isFlushable && volumeColor == "#a30000")
            icon = "<span title='Current price is still inside its implied move. \n\nBut the volume on this name sucks!'>🐌</span>"
          else
            icon = ""

          $(`#current-price-${earning.symbol}`).html(`${iv ? "$" + current_price.toFixed(2) : ""} ${icon}`);
        }
      }
    }

    if ($(".flush-candidate").length === 0) {
      var tweet_template = `
              <div class="card-body tweet-card post">
                  <div class="tweet-header">
                      <div>
                          <strong>IV Flush (<a class="text-black" href="/education/how-to-trade-the-iv-flush-strategy/">Learn More</a>)</strong>
                      </div>
                  </div>
                  <div class="tweet-body">
                    <p>No IV Flush Candidates currently detected.</p>
                  </div>
              </div>
            `;

      $("#WL_Earnings").append(tweet_template);
    }

    // Add event listener to initialize the TradingView widget when the popover is shown
    this.init_tradingview_popovers();

  }

  async displayEarningsCalendarLogos(data) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    weekdays.forEach(day => {

      // new way with tweet cards
      var author = day
      var premarket = `<div class="py-1 ">Before Open</div>`
      var postmarket = `<div class="py-1 ">After Close</div>`
      if (data[day].premarket.length > 0) {
        data[day].premarket.forEach(symbol => {
          premarket += ` <div class="py-1"><a class="" style="text-decoration: none;" href="/stocks/${symbol.toLowerCase()}/" data-toggle="popover" data-ticker="${symbol}" data-id_prefix="earnings"><img class="p-0 m-0 " src="/images/logos/${symbol.toUpperCase()}.png" style="width: 25px;"></img> ${symbol}</a></div>`;
        });
      }

      // After hours row
      if (data[day].afterhours.length > 0) {
        data[day].afterhours.forEach(symbol => {
          postmarket += ` <div class="py-1"><a class="" style="text-decoration: none;" href="/stocks/${symbol.toLowerCase()}/" data-toggle="popover" data-ticker="${symbol}" data-id_prefix="earnings" "><img class="p-0 m-0 " src="/images/logos/${symbol.toUpperCase()}.png" style="width: 25px;"></img> ${symbol}</a></div>`;
        });
      }


      var tweet_template = `
              <div class="card-body tweet-card post">
                  <div class="tweet-header">
                      <div>
                          <strong>${author}</strong>
                      </div>
                  </div>
                  <div class="tweet-body">
                      <div class="row">
                        <div class="col-6">
                          ${premarket}
                        </div>
                        <div class="col-6">
                          ${postmarket}
                        </div>
                      </div>
                  </div>
              </div>
          `;

      if (data[day].premarket.length > 0 || data[day].afterhours.length > 0) {
        $("#WL_Earnings").append(tweet_template)
      }

      this.init_tradingview_popovers()
    });

  }

  async fetchScreener() {
    var url = `https://api.spyderacademy.com/v1/stock/screener/`;

    fetch(url)
      .then(response => response.json())
      .then(watchlist => {
        // console.log(watchlist);
        // lets do it the new way now with the list view instead
        $("#WL_Reversals").empty()
        watchlist.forEach(group => {
          if (group.tickers.length > 0) {
            group.tickers.forEach(ticker => {
              // add a card for each item
              var author = "Trade Scanner"
              var message = `<a href="/stocks/${ticker.ticker.toLowerCase()}/">$${ticker.ticker.toUpperCase()}</a> has a ${group.group}.`

              // Add image of the setup
              var imageName = ""
              var entryAction = ""

              switch (group.group) {
                case "hammer at lows":
                  imageName = "hammer.png"
                  entryAction = "Consider a long on a break above the high of the hammer."
                  break;
                case "shooting star at highs":
                  imageName = "shootingstar.png"
                  entryAction = "Consider a short on a break below the low of the hammer."
                  break;
                case "evening star at highs":
                  imageName = "eveningstar.png"
                  entryAction = "Consider a short on a break below the low of the indecision doji."
                  break;
                case "morning star at lows":
                  imageName = "morningstar.png"
                  entryAction = "Consider a long on a break above the high of the indecision doji."
                  break;
                case "hammer at highs":
                  imageName = "hangman.png"
                  entryAction = "Consider a short on a break below the low of the hammer."
                  break;
                case "inverted hammer at lows":
                  imageName = "bottoming.png"
                  entryAction = "Consider a long on a break above the high of the hammer."
                  break;
              }
              var imgSrc = `/images/stratcombos/${imageName}`;

              var tweet_template = `
                            <div class="card-body tweet-card post">
                                <div class="tweet-header">
                                    <div>
                                        <strong>${author}</strong>
                                    </div>
                                </div>
                                <div class="tweet-body">
                                    <p data-toggle="strat_popover" data-img="${imgSrc}">${message}<br/><br/>${entryAction}</p>
                                    <div class="tradingview-widget-container card p-1" style="border-radius: 15px; background-color: #000" ticker="${ticker.ticker}">
                                        <div id="tradingview_reversals_${ticker.ticker.toLowerCase()}"></div>
                                    </div>
                                </div>
                            </div>
                        `;

              $("#WL_Reversals").append(tweet_template)

              // Initialize TradingView widget immediately after appending
              var tickerSymbol = ticker.ticker.toUpperCase();
              new TradingView.widget({
                "autosize": true,
                "symbol": tickerSymbol,
                "interval": "D",
                "timezone": "America/New_York",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "hide_top_toolbar": true,
                "hide_legend": true,
                "allow_symbol_change": false,
                "save_image": false,
                "calendar": false,
                "hide_volume": true,
                "support_host": "https://www.tradingview.com",
                "container_id": `tradingview_reversals_${tickerSymbol.toLowerCase()}`
              });
            });
          }
        });

        if ($("#WL_Reversals").is(":empty")) {
          var tweet_template = `
              <div class="card-body tweet-card post">
                  <div class="tweet-header">
                      <div>
                          <strong>Trade Scanner</strong>
                      </div>
                  </div>
                  <div class="tweet-body">
                      <p>No reversal candles were detected by our scanner today.</p>
                  </div>
              </div>
          `;

          $("#WL_Reversals").append(tweet_template)
        }

      })
      .catch(error => {
        console.error('Error fetching screener data:', error);
      });
  }

  async init_tradingview_popovers() {
    // Initialize Bootstrap popovers
    $('[data-toggle="strat_popover"]').popover({
      trigger: 'hover',
      placement: 'auto',
      html: true,
      content: function () {
        var img_src = $(this).data('img');
        return `<div>
                          <img src="${img_src}" width="250px"></img>
                      </div>`;
      }
    });

    // Show the Image PopOvers
    $('[data-toggle="img_popover"]').popover({
      trigger: 'hover',
      placement: 'auto',
      html: true,
      template: '<div class="popover popover-image" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
      content: function () {
        var img_src = $(this).data('img');
        return `<div>
                          <img src="${img_src}" width="100%"></img>
                      </div>`;
      }
    });



    // Show the STU Flow PopOvers
    $('[data-toggle="STU_popover"]').popover({
      trigger: 'hover',
      placement: 'auto',
      html: true,
      content: function () {
        var stu_id = $(this).data('chart_id');
        var stu_value = $(this).data('stu_value');
        var stu_exp_from_now = $(this).data('stu_exp_from_now');

        var stu_size_rating = parseInt($(this).data('stu_size')) / 100 * 5;
        var stu_time_rating = parseInt($(this).data('stu_time')) / 100 * 5;
        var stu_conviction_rating = parseInt($(this).data('stu_conviction')) / 100 * 5;
        var stu_urgency_rating = parseInt($(this).data('stu_urgency')) / 100 * 5;


        // Generate explanation based on data
        let explanation = "";

        // Size explanation
        if (stu_size_rating >= 4) {
          explanation += `<i class="fa-solid fa-sack-dollar"></i> This flow has a really good size of $${stu_value} going into it.<br/>`;
        } else if (stu_size_rating >= 2) {
          explanation += `<i class="fa-solid fa-sack-dollar"></i> This flow has a moderate size of $${stu_value}.<br/>`;
        } else {
          explanation += `<i class="fa-solid fa-sack-dollar"></i> There isn't that much money going into this flow.<br/>`;
        }

        // Time explanation
        if (stu_time_rating >= 4) {
          explanation += `<i class="fa-regular fa-clock"></i> The flow ${stu_exp_from_now}, with decent time to work.<br/>`;
        } else if (stu_time_rating >= 2) {
          explanation += `<i class="fa-regular fa-clock"></i> There is an okay amount of time until expiration.<br/>`;
        } else {
          explanation += `<i class="fa-regular fa-clock"></i> There's not much time, so will need to work quickly.<br/>`;
        }

        // Conviction explanation
        if (stu_conviction_rating >= 4) {
          explanation += `<i class="fa-solid fa-bolt"></i> There's high conviction due to the size vs time.<br/>`;
        } else if (stu_conviction_rating >= 2) {
          explanation += `<i class="fa-solid fa-bolt"></i> There's moderate conviction due to the size vs time.<br/>`;
        } else {
          explanation += `<i class="fa-solid fa-bolt"></i> There's low conviction due to the size vs time.<br/>`;
        }

        // Urgency explanation
        if (stu_urgency_rating >= 4) {
          explanation += `<i class="fa-solid fa-person-running"></i> There's high urgency in the flow (A/AA Sweeps, exceeding OI).<br/>`;
        } else if (stu_urgency_rating >= 2) {
          explanation += `<i class="fa-solid fa-person-running"></i> There's moderate urgency shown in the flow (A/AA, Sweeps, OI).<br/>`;
        } else {
          explanation += `<i class="fa-solid fa-person-running"></i> There's lower urgency in the flow, making it less reliable.<br/>`;
        }

        return `<div class="container">
                      <div class="row">
                        <div class="col-12" id="${stu_id}"></div>
                      </div>
                      <div class="row">
                        <div class="col-6 text-center text-white">
                          <div class="p-2 m-1 bg-info w-100 rounded">$${stu_value}</div>
                        </div>
                        <div class="col-6 text-center text-white">
                          <div class="p-2 m-1 bg-success w-100 rounded">${stu_exp_from_now}</div>
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12 py-2">
                            ${explanation}
                        </div>
                      </div>
                    </div>`;
      }
    });

    // Show the popover and initialize the chart when the popover is shown
    $('[data-toggle="STU_popover"]').on('shown.bs.popover', function () {
      var chart_id = $(this).data('chart_id');
      var stu_size = parseInt($(this).data('stu_size'));
      var stu_time = parseInt($(this).data('stu_time'));
      var stu_urgency = parseInt($(this).data('stu_urgency'));
      var stu_conviction = parseInt($(this).data('stu_conviction'));

      var chartOptions = {
        chart: {
          type: 'radialBar'
        },
        series: [stu_size, stu_time, stu_urgency, stu_conviction],
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 270,
            hollow: {
              size: '30px',
              background: 'transparent',
              image: undefined,
            },
            dataLabels: {
              name: {
                show: false,
              },
              value: {
                show: false,
              }
            },
            track: {
              background: '#fff',
              strokeWidth: '90',
              margin: 0, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: -3,
                left: 0,
                blur: 4,
                opacity: 0.35
              }
            },
          }
        },

        labels: ['SIZE', 'TIME', 'URGENCY', 'CONVICTION'],
        stroke: {
          lineCap: 'round'
        },
        fill: {
          color: "#0396FF"
        },
        legend: {
          show: true,
          floating: false,
          fontSize: '8px',
          offsetX: 10,
          offsetY: -20,
          markers: {
            width: 8,
            height: 8,
          },
          labels: {
            useSeriesColors: true,
          },
          formatter: function (seriesName, opts) {
            return seriesName
          },
        },
        responsive: [{
          breakpoint: 480,
          options: {
            legend: {
              show: false
            }
          }
        }]
      };

      $("#" + chart_id).empty()
      var chart = new ApexCharts(document.querySelector("#" + chart_id), chartOptions);
      chart.render();
    });



    // Initialize Bootstrap popovers
    $('[data-toggle="popover"]').popover({
      trigger: 'hover',
      placement: 'right',
      html: true,
      content: function () {
        var ticker = $(this).data('ticker');
        var id_prefix = $(this).data('id_prefix');
        return `<div class="tradingview-widget-container">
                          <div id="tradingview_${id_prefix}_${ticker.toLowerCase()}"></div>
                      </div>`;
      }
    });

    // Add event listener to initialize the TradingView widget when the popover is shown
    $('[data-toggle="popover"]').on('shown.bs.popover', function () {
      var ticker = $(this).data('ticker').toUpperCase();
      var id_prefix = $(this).data('id_prefix');
      new TradingView.widget({
        "autosize": true,
        "symbol": ticker,
        "interval": "D",
        "timezone": "America/New_York",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "backgroundColor": "rgba(255, 255, 255, 1)",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": true,
        "hide_legend": true,
        "allow_symbol_change": false,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com",
        "container_id": "tradingview_" + id_prefix + "_" + ticker.toLowerCase()
      });
    });
  }




  async fetchEMASignals(ticker) {
    ticker = ticker.toUpperCase();
    var url = `https://api.spyderacademy.com/v1/stock/strategies/emas/?ticker=${ticker}`;

    fetch(url)
      .then(response => response.json())
      .then(emaData => {
        const emaList = $('#ema_signals .row');

        // if (emaData.length > 0) {
        //   $("#currentPriceWidget").html("$" + emaData[0].latest_price.toFixed(2))
        //   $("#currentPriceWidgetTimeValue").html((new Date()).toLocaleTimeString())
        // }
        // else {
        //   $("#currentPriceWidgetTime").hide()
        //   $("#ema_signal_card").hide()
        // }

        // const emaItemHeader = $("<div class='tweet-header'><strong>Moving Averages</strong></div>")
        // emaList.append(emaItemHeader);

        emaData.forEach(data => {
            // const status = data.latest_price > data.value ? 'Bullish' : 'Bearish';
            const statusClass = data.latest_price > data.value ? 'gradient-green' : 'gradient-red';

            // const emaItem = $("<div class='tweet-body'>")
            // var emaItemHTML = ""

            // if (status == "Bullish") {
            //   emaItemHTML = $(`<p>${data.ema}: <span style='color: ${statusClass}'>${status}</span> while above <span class='${statusClass}'>$${data.value.toFixed(2)}</span> </p>`);
            // }
            // else {
            //   emaItemHTML = $(`<p>${data.ema}: <span style='color: ${statusClass}'>${status}</span> while below <span class='${statusClass}'>$${data.value.toFixed(2)}</span> </p>`);
            // }
            // emaItem.html(emaItemHTML);

            var emaItem = $(`
              <div class="" style="width: 250px;">
                <div class="card trade_card border-1 p-2 mx-0 my-1 lg-rounded ${statusClass} text-white" >
                    <div class="card-body p-0 tradeRow">
                        <div class="container p-0">
                            <div class="row align-items-center">
                                <div class="col-12">
                                    <div class="row p-1">
                                        <div class="col-8 p-0 px-2 tradeContract text-nowrap ">${data.ema}</div>
                                        <div class="col-4 p-0 tradeGain text-nowrap text-center">$${data.value.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          `)
          emaList.append(emaItem);
        });
      })
      .catch(error => {
        console.error('Error fetching EMA data:', error)
        $("#ema_signal_card").hide()
      });
  }

  async fetchLeaderboardSignals(ticker) {
    ticker = ticker.toUpperCase();
    var url = `https://api.spyderacademy.com/v1/stock/options/leaderboard/?ticker=${ticker}`;

    fetch(url)
      .then(response => response.json())
      .then(optionsData => {
        const leaderboard = $('#leaderboardSignals');

        
        const item = $("<div class='tweet-body'>")
        var itemHtml = `
          <div class="col-12 p-0 earnings_calendar">
            <div class="card earnings-day lg-rounded" id="day-2">
                <div class="card-header">
                    <div class="day-title text-uppercase">Most Actively Traded Contracts</div>
                </div>
                <div class="card-body p-0 p-lg-3">
                    <div class="card bg-transparent text-center p-0 w-100" >
                        <div class="card-body p-0">
                            <div id='leaderboardRows' class="container p-0 m-0">
                              <div class="row mb-1">
                                <div class="col-6">CONTRACT</div>
                                <div class="col-3">VOLUME</div>
                                <div class="col-3">OI</div>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          `
        item.append(itemHtml)
        leaderboard.append(item)

        // run masonry
        var msnry = new Masonry('#flow_tracker_row', {
          percentPosition: false
        });
        msnry.layout();
    

      
        function parseContract(contractString) {
          // Split the string into parts
          let parts = contractString.split('_');
          let ticker = parts[0];
          let rest = parts[1];
      
          // Extract date, type, and strike price
          let year = rest.substring(0, 2);
          let month = rest.substring(2, 4);
          let day = rest.substring(4, 6);
          let type = rest.substring(6, 7).toLowerCase();
          let strikePrice = rest.substring(7);
      
          // Format the result string
          let formattedDate = `${month}/${day}/${year}`;
      
          return {
            "ticker": ticker,
            "type": type == "c" ? "call" : "put",
            "strike": strikePrice,
            "exp": formattedDate
          };
        }


        optionsData["top_contracts"].sort(function(a, b) {
          let strikePriceA = parseContract(a.contract)["strike"];
          let strikePriceB = parseContract(b.contract)["strike"];
          return strikePriceB - strikePriceA; // Sort from largest to smallest strike price
        });

        let highestVolumeContract = null;
        let mostLikelyWorthlessContract = null;
        
        optionsData["top_contracts"].forEach(data => {

          var highlight = ""
          if (data["volume_rank"] == 1){
            if (data["volume"] > 100000){
              highlight = "gradient-red"
            }
            else {
              highlight = "gradient-green"
            }
          }
          

          var con = parseContract(data["contract"])
          var con_type = con["type"] == "call" ? `<span class=''>${con["type"].toUpperCase()}</span>` : `<span class=''>${con["type"].toUpperCase()}</span>`

          var row = `
          <div class="row mb-1 ${highlight} lg-rounded">
            <div class="col-6">${con["ticker"]} ${con["strike"]} ${con_type} ${con["exp"]}</div>
            <div class="col-3">${data["volume"].toLocaleString()}</div>
            <div class="col-3">${data["open_interest"]}</div>
          </div>
          `
          
          // append rows for each con
          $("#leaderboardRows").append(row);

          if (!highestVolumeContract && data["volume"] > 100000) {
            highestVolumeContract = con;
          } 
          // if (data["volume"] < 100000 && (!mostLikelyWorthlessContract || data["volume"] > mostLikelyWorthlessContract.volume)) {
          //   mostLikelyWorthlessContract = con;
          // }

        });

        // let explanation = "";
        // if (highestVolumeContract) {
        //   explanation = `The ${highestVolumeContract.ticker} ${highestVolumeContract.strike}${highestVolumeContract.type.toUpperCase()} expiring on ${highestVolumeContract.exp} has the highest volume > 100k and is likely to close ITM.`;
        // }

        // else if (mostLikelyWorthlessContract) {
        //   explanation += ` The ${mostLikelyWorthlessContract.ticker} ${mostLikelyWorthlessContract.strike} ${mostLikelyWorthlessContract.type.toUpperCase()} is the highest out-of-the-money strike with low volume and is likely to expire worthless, along with all further OTM strikes.`;
        // }

        // // Append the explanation text to the leaderboard or wherever appropriate
        // var explanationDiv = `<div class="mt-3 p-2 explanation-text">${explanation}</div>`;
        // leaderboard.append(explanationDiv);

      })
      .catch(error => {
        console.error('Error fetching leaderboard data:', error)
        // $("#leaderboard_signal_card").hide()
      });
  }

  async fetchTheStratSignals(ticker) {
    ticker = ticker.toUpperCase();
    var url = `https://api.spyderacademy.com/v1/stock/strategies/thestrat/?ticker=${ticker}`;

    fetch(url)
      .then(response => response.json())
      .then(stratData => {
        const thestrat = $('#theStratSignals');
        var candleType = ""
        if (stratData.thestrat_candle_type == "1") {
          candleType = "Inside Bar"
        }
        else if (stratData.thestrat_candle_type == "2u") {
          candleType = "Higher High"
        }
        else if (stratData.thestrat_candle_type == "2d") {
          candleType = "Lower Low"
        }
        else if (stratData.thestrat_candle_type == "3") {
          candleType = "Broadening Formation"
        }

        if (stratData.candlestick_pattern != "") {
          candleType = candleType + " with " + stratData.candlestick_pattern
        }

        var comboImg = ""
        if (stratData.thestrat_combo == "2-1-2 Bullish Continuation or Bearish Reversal") {
          comboImg = '/images/stratcombos/212b.png'
        }
        else if (stratData.thestrat_combo == "2-1-2 Bullish Reversal or Bearish Continuation") {
          comboImg = '/images/stratcombos/212a.png'
        }
        else if (stratData.thestrat_combo == "3-1-2 Bullish or Bearish") {
          comboImg = '/images/stratcombos/312.png'
        }
        else if (stratData.thestrat_combo == "1-2-2 Bearish Reversal") {
          comboImg = '/images/stratcombos/122.png'
        }
        else if (stratData.thestrat_combo == "1-2-2 Bullish Reversal") {
          comboImg = '/images/stratcombos/122.png'
        }
        else if (stratData.thestrat_combo == "2-2 Bullish Reversal or Bearish Continuation") {
          comboImg = '/images/stratcombos/22a.png'
        }
        else if (stratData.thestrat_combo == "2-2 Bearish Reversal or Bullish Continuation") {
          comboImg = '/images/stratcombos/22b.png'
        }
        else if (stratData.thestrat_combo == "3-2 Continuation or Reversal") {
          comboImg = '/images/stratcombos/32.png'
        }
        else if (stratData.thestrat_combo == "3-2-2 Bullish Reversal") {
          comboImg = '/images/stratcombos/322.png'
        }
        else if (stratData.thestrat_combo == "3-2-2 Bearish Reversal") {
          comboImg = '/images/stratcombos/322.png'
        }


        // thestrat.append($(`<div class="tweet-header"><strong>Potential Daily Setup</strong></div>`));
        // thestrat.append($(`<div data-toggle="popover" data-ticker="${ticker}"><p>Daily Candle:<br/>${candleType}</p></div>`));
        // thestrat.append($(`<div data-toggle="strat_popover" data-img="${comboImg}"><p><strong>Potential Combo</strong>:<br/>${stratData.thestrat_combo}</p></div>`));
        var strategyExplanation = `
          <p>Yesterday's daily candle for ${ticker} was a <span class="fw-bold" data-toggle="popover" data-ticker="${ticker}">${candleType}</span>, setting up a potential <span class="fw-bold" data-toggle="strat_popover" data-img="${comboImg}">${stratData.thestrat_combo}</span> strategy.<br/><br/>
          
          Look for a long entry above yesterdays high at $${stratData.long_trigger}, or a short entry below yesterdays low at $${stratData.short_trigger}.</p>
          `

        thestrat.append($(strategyExplanation))

        var triggersTable = $(`<table class="table text-center text-white">`);
        var triggersHeader = $(`<thead class="thead-dark">`);
        var triggersHeaderRow = $(`<tr>`);
        var triggersTargetsHeader = $(`<th scope="col"></th>`);
        var triggersCallsHeader = $(`<th scope="col" class="gradient-green">Calls > $${stratData.long_trigger}</th>`);
        var triggersPutsHeader = $(`<th scope="col" class="gradient-red">Puts < $${stratData.short_trigger}</th>`);

        triggersHeaderRow.append(triggersTargetsHeader)
        triggersHeaderRow.append(triggersCallsHeader)
        triggersHeaderRow.append(triggersPutsHeader)

        triggersHeader.append(triggersHeaderRow)
        triggersTable.append(triggersHeader)

        // append the price targets
        for (var i = 0; i < 3; i++) {
          var callPriceTarget = stratData.long_targets[i] ? "$" + stratData.long_targets[i].toFixed(2) : ""
          var putPriceTarget = stratData.short_targets[i] ? "$" + stratData.short_targets[i].toFixed(2) : ""

          var targetRow = $(`<tr>`)
          var targetLabel = $(`<td>PT${i + 1}</td>`)
          var targetCall = $(`<td>${callPriceTarget}</td>`)
          var targetPut = $(`<td>${putPriceTarget}</td>`)

          targetRow.append(targetLabel)
          targetRow.append(targetCall)
          targetRow.append(targetPut)
          triggersTable.append(targetRow)
        }

        thestrat.append(triggersTable)

        // append the FTFC continuity table
        var ftfcTable = $(`<table class="table text-center text-white">`)
        var ftfcHeader = $(`<thead class="thead-dark">`);
        var ftfcHeaderRow = $(`<tr>`);
        var ftfcHeaderC = $(`<th scope="col">Timeframe Continuity</th>`);
        var ftfcHeaderD = $(`<th scope="col">D</th>`);
        var ftfcHeaderW = $(`<th scope="col">W</th>`);
        var ftfcHeaderM = $(`<th scope="col">M</th>`);
        ftfcHeaderRow.append(ftfcHeaderC)
        ftfcHeaderRow.append(ftfcHeaderD)
        ftfcHeaderRow.append(ftfcHeaderW)
        ftfcHeaderRow.append(ftfcHeaderM)
        ftfcHeader.append(ftfcHeaderRow)
        ftfcTable.append(ftfcHeader)

        var continuityStatus = "Neutral"
        if (stratData.continuity.is_continuous && stratData.continuity.daily_trend == "Up") {
          continuityStatus = "Bullish"
        }
        else if (stratData.continuity.is_continuous && stratData.continuity.daily_trend == "Down") {
          continuityStatus = "Bearish"
        }

        const bullishStyle = "class='gradient-green text-white'"
        const bearishStyle = "class='gradient-red text-white''"

        var dailyStyle = (stratData.continuity.daily_trend == "Up") ? bullishStyle : bearishStyle
        var weeklyStyle = (stratData.continuity.weekly_trend == "Up") ? bullishStyle : bearishStyle
        var monthlyStyle = (stratData.continuity.monthly_trend == "Up") ? bullishStyle : bearishStyle

        const upArrow = "&#x21E7;"
        const downArrow = "&#x21E9;"

        var dailyIcon = (stratData.continuity.daily_trend == "Up") ? upArrow : downArrow
        var weeklyIcon = (stratData.continuity.weekly_trend == "Up") ? upArrow : downArrow
        var monthlyIcon = (stratData.continuity.monthly_trend == "Up") ? upArrow : downArrow

        var ftfcRow = $(`<tr>`)
        var ftfcC = $(`<td>${continuityStatus}</td>`)
        var ftfcD = $(`<td ${dailyStyle}>${dailyIcon}</td>`)
        var ftfcW = $(`<td ${weeklyStyle}>${weeklyIcon}</td>`)
        var ftfcM = $(`<td ${monthlyStyle}>${monthlyIcon}</td>`)
        ftfcRow.append(ftfcC)
        ftfcRow.append(ftfcD)
        ftfcRow.append(ftfcW)
        ftfcRow.append(ftfcM)
        ftfcTable.append(ftfcRow)

        thestrat.append(ftfcTable)

        if (continuityStatus == "Neutral"){
          $("#header_technicalanalysis").addClass("bg-black")
        }
        else if (continuityStatus == "Bearish"){
          $("#header_technicalanalysis").addClass("gradient-red")
        }
        else if (continuityStatus == "Bullish"){
          $("#header_technicalanalysis").addClass("gradient-green")
        }

        // show the Chart Combos
        this.init_tradingview_popovers()
       
      })
      .catch(error => {
        console.error('Error fetching The Strat data:', error)
        $("#strat_signal_row").hide()
      });
  }

  // Function to fetch data from the API
  async fetchFinancialData(ticker) {
    var url = `https://api.spyderacademy.com/v1/earnings/income-statements/?ticker=${ticker}`;
    const response = await fetch(url);
    const data = await response.json();

    return data;
  }

  async fetchFinancials(ticker) {

    if (ticker.toUpperCase() in ["SPY", "QQQ", "SPX", "IWM"]) {
      return
    }


    const financial_data = await this.fetchFinancialData(ticker);

    if (Object.keys(financial_data).length === 0) {
      // no data, hide the section
      $(".tenq").empty()
    }

    this.renderIncomeStatement(financial_data["income_statements"], 0)  
    this.renderSankeyChart(financial_data["income_statements"], 0)

    // update the summaries row
    const cagr = financial_data.summaries["CAGR"]
    const gross_margin = financial_data.summaries["LTM_Gross_Margin"]
    const fcf_margin = financial_data.summaries["LTM_FCF_Margin"]
    $("#financials_cagr").text(cagr != null ? cagr + "%" : "-")
    $("#financials_ltm_gross_margin").text(gross_margin != 0 ? gross_margin + "%" : "-")
    $("#financials_ltm_fcf_margin").text(fcf_margin != 0 ? fcf_margin + "%" : "-")
    $("#financials_title").html(`<a class="text-white" href="/stocks/${ticker.toLowerCase()}/">$${ticker.toUpperCase()}</a> Financials`)

    // Prepare data for revenue chart
    let revenueData = financial_data["income_statements"].map(item => {
      return {
        x: item["calendar_date"],
        y: item["revenue"]
      };
    });

    // Prepare data for EPS chart
    let epsData = financial_data["income_statements"].map(item => {
      return {
        x: item["calendar_date"],
        y: item["earnings_per_share"],
        fillColor: item["earnings_per_share"] < 0 ? "#cc0003" : "#2ba02d"
      };
    });

    // Add the Apex chart for revenue to the container div #revenueChart
    var optionsRevenue = {
      series: [{
        name: 'Revenue',
        data: revenueData
      }],
      chart: {
        type: 'bar',
        height: 350,
        sparkline: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        events: {
          dataPointSelection: (event, chartContext, { dataPointIndex }) => {
            const index = dataPointIndex;
            this.renderSankeyChart(financial_data["income_statements"], index);
            this.renderIncomeStatement(financial_data["income_statements"], index);
          }
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          dataLabels: {
            position: 'top', // top, center, bottom
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (value) {
          if (value >= 1000000000) {
            return "$" + (value / 1000000000).toFixed(1) + 'B'; // Format values in billions
          } else if (value >= 1000000) {
            return "$" + (value / 1000000).toFixed(1) + 'M'; // Format values in millions
          } else if (value >= 1000) {
            return "$" + (value / 1000).toFixed(1) + 'K'; // Format values in thousands
          } else if (value == null) {
            return ""
          } else {
            return "$" + value.toFixed(2); // Format values below thousands
          }
        },
        offsetY: -30,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      tooltip: {
        x: {
          formatter: function (value) {
            const date = new Date(value);
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            return `Q${quarter} ${year}`;
          }
        }
      },
      grid: {
        show: false
      },
      xaxis: {
        type: 'datetime',
        labels: {
          formatter: function (value) {
            const date = new Date(value);
            const year = (date.getFullYear()).toString().substring(2);
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            return `Q${quarter} '${year}`;
          },
          rotate: -90,
          rotateAlways: true,
          trim: true,
          showDuplicates: false,
        }
      },
      yaxis: {
        labels: {
          show: false,
          formatter: function (value) {
            if (value >= 1000000000) {
              return "$" + (value / 1000000000).toFixed(1) + 'B'; // Format values in billions
            } else if (value >= 1000000) {
              return "$" + (value / 1000000).toFixed(1) + 'M'; // Format values in millions
            } else if (value >= 1000) {
              return "$" + (value / 1000).toFixed(1) + 'K'; // Format values in thousands
            } else if (value == null) {
              return ""
            } else {
              return "$" + value.toFixed(2); // Format values below thousands
            }
          }
        }
      }
    };


    var revenueChart = new ApexCharts(document.querySelector("#revenueChart"), optionsRevenue);
    revenueChart.render();

    // Add the Apex chart for EPS to the container div #epsChart
    var optionsEPS = {
      series: [{
        name: 'EPS',
        data: epsData
      }],
      chart: {
        type: 'scatter',
        height: 350,
        sparkline: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        events: {
          dataPointSelection: (event, chartContext, { dataPointIndex }) => {
            const index = dataPointIndex;
            this.renderSankeyChart(financial_data["income_statements"], index);
            this.renderIncomeStatement(financial_data["income_statements"], index);
          }
        }
      },

      tooltip: {
        x: {
          formatter: function (value) {
            const date = new Date(value);
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            return `Q${quarter} ${year}`;
          }
        }
      },
      grid: {
        show: false
      },
      xaxis: {
        type: 'datetime',
        labels: {
          formatter: function (value) {
            const date = new Date(value);
            const year = (date.getFullYear()).toString().substring(2);
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            return `Q${quarter} '${year}`;
          },
          show: false,
        }
      },
      yaxis: {
        forceNiceScale: true,
        labels: {
          formatter: function (value) {
            return `${value.toFixed(2)}`;
          }
        }
      },
      markers: {
        shape: ['circle'],
        size: 10,
      },
    };

    var epsElement = document.querySelector("#epsChart")
    if (epsElement !== null) {
      var epsChart = new ApexCharts(epsElement, optionsEPS);
      epsChart.render();
    }

    return financial_data
  }

  async renderIncomeStatement(financial_data, qtrIndex = 0) {
    var incomeStatementElement = $('#income_statement')
    if (incomeStatementElement == undefined) {
      return
    }

    function monetize(v, t = 0) {
      var pv = v
      v = Math.abs(parseFloat(v) || 0)
      if (v >= 1e6) {
        // millions, with commas
        pv = `${(parseFloat(v) / 1e6).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
      }
      
      return pv
    }

    function calc_yoy(thisQuarter, lastYearQuarter) {
      var yoy = ((thisQuarter - lastYearQuarter) / lastYearQuarter) * 100
      if (lastYearQuarter == 0 || isNaN(lastYearQuarter)) {
        return "-"
      }
      return yoy.toFixed(1) + "%"
    }

    function calc_qoq(thisQuarter, lastQuarter) {
      var qoq = ((thisQuarter - lastQuarter) / lastQuarter) * 100
      if (lastQuarter == 0 || isNaN(lastQuarter)) {
        return "-"
      }
      return qoq.toFixed(1) + "%"
    }

    // clear the table
    incomeStatementElement.empty()

    // add the header
    var headerRow = $('<tr>').append($('<th class="border-0 fs-4">').text('Key Financials'))
    incomeStatementElement.append(headerRow)

    // add the subheader
    var thisQuarter = financial_data[qtrIndex]
    var lastQuarter = financial_data[qtrIndex + 1]
    var lastYearQuarter = financial_data[qtrIndex + 4]

    var subheaderRow = $('<tr>')
    subheaderRow.append($('<th>').text('$ million unless stated otherwise'))
    subheaderRow.append($('<th>').text(lastYearQuarter.report_period))
    subheaderRow.append($('<th>').text(lastQuarter.report_period))
    subheaderRow.append($('<th class="highlight">').text(thisQuarter.report_period))
    subheaderRow.append($('<th>').text('YoY'))
    subheaderRow.append($('<th>').text('QoQ'))

    incomeStatementElement.append(subheaderRow)

    // add the data, formatted in the millions
    // revenue
    var revenueRow = $('<tr class="incoming">').append($('<td>').text('Total Revenue'))
    revenueRow.append($('<td>').text(monetize(lastYearQuarter.revenue)))
    revenueRow.append($('<td>').text(monetize(lastQuarter.revenue)))
    revenueRow.append($('<td class="highlight">>').text(monetize(thisQuarter.revenue)))
    revenueRow.append($('<td>').text(calc_yoy(thisQuarter.revenue, lastYearQuarter.revenue)))
    revenueRow.append($('<td>').text(calc_qoq(thisQuarter.revenue, lastQuarter.revenue)))

    // cost of revenue
    var costOfRevenueRow = $('<tr class="outgoing">').append($('<td>').text('Cost of Goods Sold'))
    costOfRevenueRow.append($('<td>').text(monetize(lastYearQuarter.cost_of_revenue)))
    costOfRevenueRow.append($('<td>').text(monetize(lastQuarter.cost_of_revenue)))
    costOfRevenueRow.append($('<td class="highlight">').text(monetize(thisQuarter.cost_of_revenue)))
    costOfRevenueRow.append($('<td>').text(calc_yoy(thisQuarter.cost_of_revenue, lastYearQuarter.cost_of_revenue)))
    costOfRevenueRow.append($('<td>').text(calc_qoq(thisQuarter.cost_of_revenue, lastQuarter.cost_of_revenue)))

    // gross profit 
    var grossProfitRow = $('<tr class="incoming">').append($('<td>').text('Gross Profit'))
    grossProfitRow.append($('<td>').text(monetize(lastYearQuarter.gross_profit)))
    grossProfitRow.append($('<td>').text(monetize(lastQuarter.gross_profit)))
    grossProfitRow.append($('<td class="highlight">').text(monetize(thisQuarter.gross_profit)))
    grossProfitRow.append($('<td>').text(calc_yoy(thisQuarter.gross_profit, lastYearQuarter.gross_profit)))
    grossProfitRow.append($('<td>').text(calc_qoq(thisQuarter.gross_profit, lastQuarter.gross_profit)))

      
    // operating expenses
    var operatingExpensesRow = $('<tr class="outgoing">').append($('<td>').text('Operating Expenses'))
    operatingExpensesRow.append($('<td>').text(monetize(lastYearQuarter.operating_expense)))
    operatingExpensesRow.append($('<td>').text(monetize(lastQuarter.operating_expense)))
    operatingExpensesRow.append($('<td class="highlight">').text(monetize(thisQuarter.operating_expense)))
    operatingExpensesRow.append($('<td>').text(calc_yoy(thisQuarter.operating_expense, lastYearQuarter.operating_expense)))
    operatingExpensesRow.append($('<td>').text(calc_qoq(thisQuarter.operating_expense, lastQuarter.operating_expense))) 

    
      
    // SG&A
    var sgaRow = $('<tr class="sub_row">').append($('<td>').text('SG&A'))
    sgaRow.append($('<td>').text(monetize(lastYearQuarter.selling_general_and_administrative_expenses)))
    sgaRow.append($('<td>').text(monetize(lastQuarter.selling_general_and_administrative_expenses)))
    sgaRow.append($('<td class="highlight">').text(monetize(thisQuarter.selling_general_and_administrative_expenses)))
    sgaRow.append($('<td>').text(calc_yoy(thisQuarter.selling_general_and_administrative_expenses, lastYearQuarter.selling_general_and_administrative_expenses)))
    sgaRow.append($('<td>').text(calc_qoq(thisQuarter.selling_general_and_administrative_expenses, lastQuarter.selling_general_and_administrative_expenses)))
      
    // R&D
    var rdRow = $('<tr class="sub_row">').append($('<td>').text('R&D'))
    rdRow.append($('<td>').text(monetize(lastYearQuarter.research_and_development)))
    rdRow.append($('<td>').text(monetize(lastQuarter.research_and_development)))
    rdRow.append($('<td class="highlight">').text(monetize(thisQuarter.research_and_development)))
    rdRow.append($('<td>').text(calc_yoy(thisQuarter.research_and_development, lastYearQuarter.research_and_development)))
    rdRow.append($('<td>').text(calc_qoq(thisQuarter.research_and_development, lastQuarter.research_and_development)))
      
    // Other Expenses
    var otherExpensesRow = $('<tr class="sub_row">').append($('<td>').text('Other Expenses'))
    otherExpensesRow.append($('<td>').text(monetize(lastYearQuarter.other_expenses)))
    otherExpensesRow.append($('<td>').text(monetize(lastQuarter.other_expenses)))
    otherExpensesRow.append($('<td class="highlight">').text(monetize(thisQuarter.other_expenses)))
    otherExpensesRow.append($('<td>').text(calc_yoy(thisQuarter.other_expenses, lastYearQuarter.other_expenses)))
    otherExpensesRow.append($('<td>').text(calc_qoq(thisQuarter.other_expenses, lastQuarter.other_expenses)))


    // operating income
    var operatingIncomeRow = $('<tr class="incoming">').append($('<td>').text('Operating Profit'))
    operatingIncomeRow.append($('<td>').text(monetize(lastYearQuarter.operating_income)))
    operatingIncomeRow.append($('<td>').text(monetize(lastQuarter.operating_income)))
    operatingIncomeRow.append($('<td class="highlight">').text(monetize(thisQuarter.operating_income)))
    operatingIncomeRow.append($('<td>').text(calc_yoy(thisQuarter.operating_income, lastYearQuarter.operating_income)))
    operatingIncomeRow.append($('<td>').text(calc_qoq(thisQuarter.operating_income, lastQuarter.operating_income)))

    // pretax income
    var pretaxIncomeRow = $('<tr class="incoming">').append($('<td>').text('Profit Before Tax (EBIT)'))
    pretaxIncomeRow.append($('<td>').text(monetize(lastYearQuarter.ebit)))
    pretaxIncomeRow.append($('<td>').text(monetize(lastQuarter.ebit)))
    pretaxIncomeRow.append($('<td class="highlight">').text(monetize(thisQuarter.ebit)))
    pretaxIncomeRow.append($('<td>').text(calc_yoy(thisQuarter.ebit, lastYearQuarter.ebit)))
    pretaxIncomeRow.append($('<td>').text(calc_qoq(thisQuarter.ebit, lastQuarter.ebit)))

    // tax
    var taxRow = $('<tr class="sub_row">').append($('<td>').text('Tax'))
    taxRow.append($('<td>').text(monetize(lastYearQuarter.income_tax_expense)))
    taxRow.append($('<td>').text(monetize(lastQuarter.income_tax_expense)))
    taxRow.append($('<td class="highlight">').text(monetize(thisQuarter.income_tax_expense)))
    taxRow.append($('<td>').text(calc_yoy(thisQuarter.income_tax_expense, lastYearQuarter.income_tax_expense)))
    taxRow.append($('<td>').text(calc_qoq(thisQuarter.income_tax_expense, lastQuarter.income_tax_expense))) 

    // interest expense
    var interestExpenseRow = $('<tr class="sub_row">').append($('<td>').text('Interest Expense'))
    interestExpenseRow.append($('<td>').text(monetize(lastYearQuarter.interest_expense)))
    interestExpenseRow.append($('<td>').text(monetize(lastQuarter.interest_expense)))
    interestExpenseRow.append($('<td class="highlight">').text(monetize(thisQuarter.interest_expense)))
    interestExpenseRow.append($('<td>').text(calc_yoy(thisQuarter.interest_expense, lastYearQuarter.interest_expense)))
    interestExpenseRow.append($('<td>').text(calc_qoq(thisQuarter.interest_expense, lastQuarter.interest_expense)))  
      
    // net income
    var netIncomeRow = $('<tr class="incoming">').append($('<td>').text('Profit After Tax (Net Income)'))
    netIncomeRow.append($('<td>').text(monetize(lastYearQuarter.net_income)))
    netIncomeRow.append($('<td>').text(monetize(lastQuarter.net_income)))
    netIncomeRow.append($('<td class="highlight">').text(monetize(thisQuarter.net_income)))
    netIncomeRow.append($('<td>').text(calc_yoy(thisQuarter.net_income, lastYearQuarter.net_income)))
    netIncomeRow.append($('<td>').text(calc_qoq(thisQuarter.net_income, lastQuarter.net_income))) 
    
    incomeStatementElement.append(revenueRow)
    incomeStatementElement.append(costOfRevenueRow)
    incomeStatementElement.append(grossProfitRow)
    incomeStatementElement.append(operatingExpensesRow)
    
    incomeStatementElement.append(sgaRow)
    incomeStatementElement.append(rdRow)
    incomeStatementElement.append(otherExpensesRow)

    incomeStatementElement.append(operatingIncomeRow)
    incomeStatementElement.append(pretaxIncomeRow)
    incomeStatementElement.append(taxRow)
    incomeStatementElement.append(interestExpenseRow)

    incomeStatementElement.append(netIncomeRow)
    
  } 

  

  // Function to process data and set chart options
  async renderSankeyChart(financial_data, qtrIndex = 0) {
    var chartElement = document.getElementById('sankey_chart')

    if (chartElement == undefined) {
      return
    }

    var chart = echarts.init(chartElement);

    const quarterlyEarningsList = financial_data;
    const quarterlyEarnings = quarterlyEarningsList[qtrIndex]

    var product_nodes = quarterlyEarnings.revenue_sources.filter(source =>
      !source.name.includes("Total ") &&
      !source.name.includes("All ")
    );

    product_nodes = product_nodes.map(source => ({
      "name": source.name,
      "value": parseFloat(source.value) || 0,
      "depth": 0,
      "itemStyle": { color: "#0065fe" }, label: { position: "top", color: "#0065fe" },
      "append": { name: "Amount", value: monetize(source.value, quarterlyEarnings.revenue) }
    }))

    product_nodes = product_nodes.reduce((acc, source) => {
      const existingNode = acc.find(node => (node.name === source.name));

      if (existingNode && source.value != 0) {
        existingNode.value = (parseFloat(source.value) || 0);
      }
      else {
        acc.push({
          "name": source.name,
          "value": parseFloat(source.value) || 0,
          "depth": 0,
          "itemStyle": { color: "#0065fe" },
          "label": { position: "top", color: "#0065fe" },
          "append": { name: "Amount", value: monetize(source.value, quarterlyEarnings.revenue) }
        });
      }

      return acc;
    }, []);

    product_nodes = product_nodes.sort((a, b) => b.value - a.value).slice(0, 5);

    function monetize(v, t = 0) {
      var pv = v
      v = Math.abs(parseFloat(v) || 0)
      if (v >= 1e9) {
        pv = `$${(parseFloat(v) / 1e9).toFixed(1)}B`
      }
      else if (v >= 1e6) {
        pv = `$${(parseFloat(v) / 1e6).toFixed(1)}M`
      }
      else if (v >= 1e3) {
        pv = `$${(parseFloat(v) / 1e3).toFixed(1)}K`
      }
      else {
        pv = `$${(parseFloat(v)).toFixed(1)}`
      }

      if (t == 0) {
        return pv
      }
      else {
        var pct = (parseFloat(v) / parseFloat(t)) * 100
        return `${pv} (${pct.toFixed(1)}%)`
      }
    }

    function get_income_color(v) {
      if (v > 0) { return "#2ba02d" }// green
      else { return "#cc0003" }// red
    }

    function get_expense_color(v) {
      if (v > 0) { return "#cc0003" }// green
      else { return "#2ba02d" }// red
    }

    function get_node(n, v, d, type) {
      const color = (type == "out") ? get_expense_color(v) : get_income_color(v);
      v = parseFloat(v) || 0

      return {
        "name": n,
        "value": Math.abs(v),
        "depth": d,
        "itemStyle": {
          color: color
        },
        "label": {
          position: type == "out" ? "bottom" : "top",
          align: "center",
          color: color,
          show: (v != 0 ? true : false)
        },
        append: {
          name: "Amount",
          value: monetize(v, quarterlyEarnings.revenue)
        }
      }
    }

    function get_link(s, d, v, type) {
      var color = ""
      v = (parseFloat(v) || 0)
      if (v == 0) {
        color = "transparent"
      }
      else {
        color = (type == "out") ? get_expense_color(v) : get_income_color(v);
      }
      return {
        "source": s,
        "target": d,
        "value": Math.abs(v),
        "lineStyle": {
          color: color,
          opacity: 0.5
        }
      }
    }

    // Extract nodes
    const nodes = [
      ...product_nodes,
      { "name": "1-1", "value": parseFloat(quarterlyEarnings.revenue) * 0.25, depth: 1, itemStyle: { color: "transparent" }, label: { show: false }, emphasis: { label: { show: false } } },
      get_node("Revenue", quarterlyEarnings.revenue, 1, "in"),

      { "name": "2-1", "value": parseFloat(quarterlyEarnings.revenue) * 0.15, depth: 2, itemStyle: { color: "transparent" }, label: { show: false } },
      get_node("Gross Profit", quarterlyEarnings.gross_profit, 2, "in"),
      get_node("COGS", quarterlyEarnings.cost_of_revenue, 2, "out"),

      { "name": "3-1", "value": parseFloat(quarterlyEarnings.revenue) * 0.10, depth: 3, itemStyle: { color: "transparent" }, label: { show: false } },
      get_node("Operating Income", quarterlyEarnings.operating_income, 3, "in"),
      get_node("Operating Expense", quarterlyEarnings.operating_expense, 3, "out"),

      { "name": "4-1", "value": parseFloat(quarterlyEarnings.revenue) * 0, depth: 4, itemStyle: { color: "transparent" }, label: { show: false } },
      get_node("PreTax Income", quarterlyEarnings.ebit, 4, "in"),

      { "name": "5-1", "value": parseFloat(quarterlyEarnings.revenue) * 0.00, depth: 5, itemStyle: { color: "transparent" }, label: { show: false } },
      get_node("Net Income", quarterlyEarnings.net_income, 5, "in"),
      get_node("Tax", quarterlyEarnings.income_tax_expense, 5, "out"),
      get_node("Interest Expense", quarterlyEarnings.interest_expense, 5, "out"),
      get_node("SG&A", quarterlyEarnings.selling_general_and_administrative_expenses, 5, "out"),
      get_node("R&D", quarterlyEarnings.research_and_development, 5, "out"),
      get_node("Other Expenses", quarterlyEarnings.other_expenses, 5, "out"),
    ];


    // Extract links
    var product_links = quarterlyEarnings.revenue_sources.filter(source =>
      !source.name.includes("Total ") &&
      !source.name.includes("All ")
    );

    product_links = product_links.reduce((acc, source) => {
      const existingNode = acc.find(node => node.source === source.name);

      if (existingNode && source.value != 0) {
        existingNode.value = (parseFloat(source.value) || 0);
      } else {
        acc.push({
          "source": source.name,
          "target": "Revenue",
          "value": parseFloat(source.value) || 0,
          "lineStyle": {
            "color": "#0065fe",
            "opacity": 0.5
          }
        });
      }

      return acc;
    }, []);

    product_links = product_links.sort((a, b) => b.value - a.value).slice(0, 5);

    // console.log(product_nodes, product_links)

    const links = [
      ...product_links,
      get_link("Revenue", "Gross Profit", quarterlyEarnings.gross_profit, "in"),
      get_link("Gross Profit", "Operating Income", quarterlyEarnings.operating_income, "in"),
      get_link("Gross Profit", "Operating Expense", quarterlyEarnings.operating_expense, "out"),
      get_link("Operating Income", "PreTax Income", quarterlyEarnings.ebit, "in"),
      get_link("PreTax Income", "Net Income", quarterlyEarnings.net_income, "in"),
      get_link("PreTax Income", "Tax", quarterlyEarnings.income_tax_expense, "out"),
      get_link("PreTax Income", "Interest Expense", quarterlyEarnings.interest_expense, "out"),
      get_link("Operating Expense", "SG&A", quarterlyEarnings.selling_general_and_administrative_expenses, "out"),
      get_link("Operating Expense", "R&D", quarterlyEarnings.research_and_development, "out"),
      get_link("Operating Expense", "Other Expenses", quarterlyEarnings.other_expenses, "out"),
      get_link("Revenue", "COGS", quarterlyEarnings.cost_of_revenue, "out"),
    ];

    // console.log("Data Node: ", nodes)
    // console.log("Data Links: ", links)
    // Define the chart options
    var option = {
      "mode": 1,
      "animation": false,
      title: {
        text: `How ${quarterlyEarnings.ticker} Makes Money (${quarterlyEarnings["report_period"]})`,
        left: 'center',
        textStyle: {
          fontSize: 30
        }
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
      },
      toolbox: {
        feature: {
          saveAsImage: {
            show: true,
            type: 'png',
            title: 'Save Chart - How {{$symbol}} Makes Money',
            name: 'how_{{$symbol}}_makes_money',
          }
        },
        bottom: 0
      },

      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: "adjacency",
            label: {
              show: true
            },
            lineStyle: {
              opacity: 0.5
            }
          },
          layoutIterations: 0,
          nodeGap: 50,
          left: 180,
          top: 160,
          bottom: 80,
          right: 180,
          lineStyle: {
            curveness: 0.7,
            color: 'source',
          },
          nodeAlign: 'justify',


          data: nodes,
          links: links,
          label: {
            formatter: function (params) {
              const name = params.name;
              const append = params.data.append;

              if (append !== undefined) {
                return [
                  `${name}`,
                  `{append|${append.value}}`
                ].join("\n")
              }
              else {
                return `${name}`
              }
            },
            rich: {
              append: {
                color: "#c0c0c0",
                fontSize: 12,
                padding: [2, 0, 0, 0]
              }
            },
            "show": true,
            "position": "right",
            "fontSize": "15",
          },

          itemStyle: {
            color: function (params) {
              const name = params.data.name;
              if (name === 'Revenue' || name === 'Gross Profit' || name === 'Operating Income' || name === 'Pretax Income' || name === 'Net Income') {
                return 'green';
              } else if (name.includes('Expense') || name.includes('Cost')) {
                return 'red';
              } else {
                return 'blue';
              }
            }
          },
        }
      ],
      // Adding the footer
      graphic: [
        {
          type: 'text',
          left: 'center',
          bottom: 10,
          style: {
            text: 'Created by Spyder Academy',
            fill: '#c0c0c0',
            fontSize: "15"
          }
        },
        {
          type: 'image',
          left: 'center',
          bottom: 30,
          style: {
            image: '/images/logo.png',
            width: 50,
            height: 50
          }
        },
        {
          type: 'image',
          left: 'center',
          top: 40,
          style: {
            image: `/images/logos/${quarterlyEarnings.ticker}.png`,
            width: 50,
            height: 50
          }
        }
      ]
    };

    // Use the specified chart configuration
    chart.setOption(option);

    // If on mobile, convert the chart to PNG
    setTimeout(() => {
      const base64 = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });

      // Hide the chart and show the image
      $('#sankey_chart').hide()
      const imgElement = $('#sankey_image');
      imgElement.attr("src", base64);

      $(".sankey_container").attr("style", "width: 100%;")
    }, 1000); // Delay to ensure the chart is rendered
  }



  async fetchGEXByStrike(ticker, chartid = "#gammaChart", idx = 0, historicals = false) {

    ticker = ticker.toUpperCase();

    try {
      const jsonData = await this._fetchGEXData(ticker, idx, historicals);
      if (jsonData && jsonData["data"].length > 0) {
        this._renderGEXByStrike(ticker, jsonData, chartid);
      } else {
        // console.log("No data to render.");
      }
    }
    catch (error) {
      console.log("Error retrieving Gamma Exposure")
      $("#market_pressure_signal_card").hide()
    }
  }

  

  isFetchingSnapshotData = false;
  async _fetchGEXData(ticker, idx = 0, historicals = false) {
    var url = `https://api.spyderacademy.com/v1/stock/gamma/snapshots/?ticker=${ticker}`;
    try {
      if (this.snapshotGexData == null && !this.isFetchingSnapshotData) {
        this.isFetchingSnapshotData = true;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        this.snapshotGexData = responseData

        // update the slider max and steps values
        $("#gex_slider").attr("max", this.snapshotGexData.length - 1);
        $("#gex_slider").attr("value", this.snapshotGexData.length - 1);
        $("#gex_slider").removeAttr("disabled");

        this.isFetchingSnapshotData = false;
      }

      var data = {}
      var timestamp = ""
      
      // Initialize min and max values
      var minStrike = Infinity;
      var maxStrike = -Infinity;
      var minGex = Infinity;
      var maxGex = -Infinity;
      var currentSpotPrice = 0;
      if (this.snapshotGexData[0]){
        currentSpotPrice = parseFloat(this.snapshotGexData[0]["max_gamma"]["Spot"]);
      }

      var snapshopIndex =  this.snapshotGexData[idx] != null ? idx : this.snapshotGexData.length - 1

      if (this.snapshotGexData[snapshopIndex] != null) {
        var snapshot = this.snapshotGexData[idx]

        data = snapshot["data"]
        timestamp = snapshot["timestamp"]

        // Iterate over all snapshots
        $.each(this.snapshotGexData, function(index, snapshot) {
          $.each(snapshot.data, function(i, dataPoint) {
              var strike = dataPoint.Strike;
              var gex = dataPoint.GEX;

              // Update min/max strike
              if (strike < minStrike) minStrike = strike;
              if (strike > maxStrike) maxStrike = strike;

              // Update min/max GEX
              if (gex < minGex) minGex = gex;
              if (gex > maxGex) maxGex = gex;
          });
        });
      }

      return {
        "data": data,
        "timestamp": timestamp,
        "minStrike": minStrike,
        "maxStrike": maxStrike,
        "minGEX": minGex,
        "maxGEX": maxGex,
        "currentSpot": currentSpotPrice
      };

    } catch (error) {
      console.error("Could not fetch Historical Gamma Snapshot Data:", error);
    }
  }

  async _renderGEXByStrike(ticker, gexData, chartid) {

    const jsonData = gexData["data"]
    const timestamp = gexData["timestamp"]

    let minGEX = gexData["minGEX"]
    let maxGEX = gexData["maxGEX"]
    let maxX = gexData["maxStrike"]
    let minX = gexData["minStrike"]

    // Add min and max strikes if they don't exist in the current dataset
    if (!jsonData.some(item => item.Strike === minX)) {
      jsonData.push({ Strike: minX, GEX: 0 });
    }
    if (jsonData && !jsonData.some(item => item.Strike === maxX)) {
        jsonData.push({ Strike: maxX, GEX: 0 });
    }

    // Sort the jsonData by Strike to ensure proper order on the x-axis
    jsonData.sort((a, b) => a.Strike - b.Strike);


    

    // Prepare your data for ApexCharts
    var seriesData = jsonData.map(
      function (item) {
        return {
          x: item.Strike,
          y: item.GEX,
          fillColor: item.GEX >= 0 ? '#00E396' : '#FF4560' // Green for positive, Red for negative
        };
      });

    
    let largestGEX = jsonData.reduce((prev, current) => {
      return Math.abs(prev.GEX) > Math.abs(current.GEX) ? prev : current;
    });

    

    let netGEX = jsonData.reduce((acc, item) => acc + item.GEX, 0);

    var currentSpotPrice = gexData["currentSpot"];

    // Determine the sentiment based on the sign of the GEX and the current spot price
    let bearbull = netGEX > 0 ? "Bullish" : netGEX < 0 ? "Bearish" : "Unavailable";

    if (largestGEX.GEX !== 0){
      $(".largestGammaLevelText").text("attracted to $" + largestGEX.Strike.toFixed(2));
    }
    else{
      $(".largestGammaLevelText").text("unavailable");
    }

    $(".gammaOutlook").text(bearbull);
    if (bearbull == "Bullish")
      $("#signalGammaOutlook").attr("style", "color: #29741D")
    else
      $("#signalGammaOutlook").attr("style", "color: #ad0000")

    var formattedTimestampStr = ""
    if (timestamp != "") {
      formattedTimestampStr = (new Date(timestamp)).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })

      formattedTimestampStr += " ET"
    }

    // var chartTitle = " "// ticker.toUpperCase() + " Market Pressure"
    var chartTitle = formattedTimestampStr

    var options = {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        animations: {
          enabled: false,
          easing: 'easeinout',
          speed: 300,
          animateGradually: {
              enabled: false,
          },
          dynamicAnimation: {
              enabled: true,
              speed: 350
          }
        },
      },
      series: [{
        name: 'GEX',
        data: seriesData
      }],
      plotOptions: {
        bar: {
          borderRadius: "5",
          colors: {
            ranges: [{
              from: -100,
              to: 0,
              color: '#FF4560'
            }, {
              from: 0,
              to: 100,
              color: '#00E396'
            }]
          }
        }
      },
      
      dataLabels: {
        enabled: false,
      },
      title: { text: chartTitle },
      // subtitle: { text: chartSubTitle },
      xaxis: {
        type: 'category',
        title: {
          text: 'Strike Price'
        },
        labels: {
          formatter: function (x) {
            return "$" + x.toFixed(0);
          }
        },
        min: minX,
        max: maxX
      },
      yaxis: {
        title: {
          text: 'Gamma Exposure (Bn$/%)'
        },
        min: minGEX * 1.5,
        max: maxGEX * 1.5,
        forceNiceScale: true,
        labels: {
          formatter: function (y) {
            return y.toFixed(3) + "%";
          }
        }
      },
      annotations: {
        xaxis: [{
          x: currentSpotPrice,
          borderColor: '#999',
          label: {
            borderColor: '#999',
            style: {
              color: '#fff',
              background: '#999'
            },
            orientation: 'horizontal',
            text: 'Current Price'
          }
        }]
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val.toFixed(3) + " GEX"
          }
        }
      }
    };



    if (this.chartGEX == null) {
      $(chartid).removeClass("d-none")
      $(chartid).empty()

      // this.chartGEX.destroy();
      document.querySelectorAll(chartid).forEach((element) => {
        this.chartGEX = new ApexCharts(element, options);
        this.chartGEX.render();
        $("#gammaChartContainer").addClass("ready")
      });

    }
    else {
      console.log("update the chart")
      this.chartGEX.updateOptions({
        title: { text: chartTitle },
        // subtitle: { text: chartSubTitle },
      });

      this.chartGEX.updateSeries([{
        data: seriesData,
      }])




    }

  }


  async fetchGEXOverlay(ticker, expectedMove = null) {
    // console.log("overlay data", expectedMove)
    ticker = ticker.toUpperCase();
    expectedMove = await this.fetchIVData(ticker);
    const jsonData = await this._fetchGEXOverlayData(ticker);
    
    if (ticker == "SPX") {
      $(".gammaOverlayContainer").hide()
    }
    else if (jsonData && jsonData.stock_price.length > 0) {
      this._renderGEXOverlay(ticker, jsonData, expectedMove);
    }
    else {
      console.log("No data to render.");
      $(".gammaChartOverlay").text("Gamma Price Overlay is currently unavailable")
    }
  }

  async _fetchGEXOverlayData(ticker, span='day') {
    const url = `https://api.spyderacademy.com/v1/stock/gamma/walls/?ticker=${ticker}&span=${span}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Could not fetch data:", error);
      $(".gammaOverlayContainer").hide()
    }
  }

  _prepareGEXOverlayChartData(data) {
    // Define the offset for EST (UTC-5 hours)
    const estOffset = 4 * 60 * 60 * 1000; // 5 hours in milliseconds

    // Prepare stock price series
    var stockSeries = {}
    stockSeries = data.stock_price.map(item => ({
      x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
      y: parseFloat(item.close_price),
      o: parseFloat(item.open_price),
      h: parseFloat(item.high_price),
      l: parseFloat(item.low_price),
      c: parseFloat(item.close_price)
    }));

    var gammaSeries = {}
    gammaSeries = data.stock_price.map(item => ({
      x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
      y: parseFloat(item.max_gamma)
    }));

    var netGammaSeries = {}
    netGammaSeries = data.stock_price.map(item => ({
      x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
      y: parseFloat(item.net_gamma),
    }));

    var callGammaSeries = {}
    callGammaSeries = data.stock_price.map(item => ({
      x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
      y: parseFloat(item.net_call_gamma)
    }));

    var putGammaSeries = {}
    putGammaSeries = data.stock_price.map(item => ({
      x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
      y: parseFloat(item.net_put_gamma)
    }));

    // Prepare GEX data series
    const gexAnnotations = data.gex_data.map(item => {
      const GEXValue = parseFloat(item.GEX);
      const borderWidth = Math.min(Math.abs(GEXValue) / Math.max(...data.gex_data.map(g => Math.abs(g.GEX))) * 3, 3); // Normalize and cap opacity between 0 and 1
      return {
        y: parseFloat(item.Strike),
        borderColor: GEXValue >= 0 ? "#00E396" : "#FF4560",
        borderWidth: borderWidth, // Thicker line
        label: {
          borderColor: GEXValue >= 0 ? "#00E396" : "#FF4560",
          style: {
            color: "#fff",
            background: GEXValue >= 0 ? "#00E396" : "#FF4560",
          },
          // text: `$${item.Strike.toFixed(2)}`,
          position: 'right'
        }
      };
    });

    return { stockSeries, gammaSeries, gexAnnotations, netGammaSeries, callGammaSeries, putGammaSeries};
  }

  async _renderGEXOverlay(ticker, jsonData, expectedMove = null) {

    const { stockSeries, gammaSeries, gexAnnotations, netGammaSeries, callGammaSeries, putGammaSeries } = this._prepareGEXOverlayChartData(jsonData);
    const forecastPoints = 0 // chart prediction (not using right now)

    let lastDataPoint = stockSeries[stockSeries.length - forecastPoints - 1];

    // Calculate the last timestamp plus some interval (e.g., next 5 minutes)
    const lastCloseDataPoint = stockSeries[stockSeries.length - forecastPoints - 1];
    const lastActualPrice = lastDataPoint.y;

    // is the market closed?
    const isMarketClosed = new Date(lastCloseDataPoint.x).getHours() >= 16;

    if (isMarketClosed) {
      // Market is closed, use the last data point
      lastCloseDataPoint = lastDataPoint;
    } else {
      // Market is open, find the last data point at or before 4 PM from the previous trading day
      // This will require iterating your stockSeries to find the appropriate point
      // Assuming stockSeries is sorted in ascending order by timestamp
      for (let i = stockSeries.length - 1; i >= 0; i--) {
        const dataPointDate = new Date(stockSeries[i].x);
        if (dataPointDate.getHours() == 16) {
          lastCloseDataPoint = stockSeries[i];
          lastActualPrice = lastCloseDataPoint
          break;
        }
      }
    }

    // Proceed to use lastCloseDataPoint for your calculations
    if (expectedMove === null) nextTimestamp = lastCloseDataPoint.x;
    expectedMove = expectedMove || { "bears": lastCloseDataPoint.y, "bulls": lastCloseDataPoint.y }; // Adjust to use lastCloseDataPoint

    const fourPM = new Date(lastDataPoint.x).setUTCHours(16)

    var nextTimestamp = lastDataPoint.x + (120 * 60 * 1000); // Adding 120 minutes (2hr)

    if (expectedMove === null) nextTimestamp = lastDataPoint.x
    expectedMove = expectedMove || { "bears": lastCloseDataPoint, "bulls": lastCloseDataPoint }; // Use the given expectedMove or fallback to default

    // Append the bull and bear projections to the stock series
    const bullProjection = {
      x: nextTimestamp,
      y: expectedMove.bulls,
    };
    const bearProjection = {
      x: nextTimestamp,
      y: expectedMove.bears,
    };


    // Assume that the last actual stock price will be the starting point for projections

    // Create new series for bull and bear projections
    const bullSeries = [{
      x: lastDataPoint.x, // Last actual timestamp
      y: lastActualPrice  // Last actual stock price
    }, bullProjection];

    const bearSeries = [{
      x: lastDataPoint.x, // Last actual timestamp
      y: lastActualPrice  // Last actual stock price
    }, bearProjection];

    // modify the gamma series to include null points to create breaks in the lines.
    let previousGamma = null;
    let previousTimestamp = null;
    const gammaSeriesWithBreaks = [];

    gammaSeries.forEach((point, index) => {
      if (previousTimestamp !== null && point.y !== previousGamma) {
        // Add a null value to create a break
        gammaSeriesWithBreaks.push({ x: point.x, y: point.y });
        // console.log('inserting null as changed gamma from/to ', previousGamma, point.y)
      }
      gammaSeriesWithBreaks.push({ x: point.x, y: isNaN(point.y) ? null : point.y });

      previousGamma = point.y;
      previousTimestamp = point.x;
    });

    // console.log(gammaSeries)
    // console.log(netGammaSeries)

    var options = {
      chart: {
        height: 375,
        type: 'area',
        stacked: false,
        toolbar: false,
        zoom: {
          type: 'x',
          enabled: false,
          autoScaleYaxis: true
        },
      },
      series: [
        {
          name: 'Stock Price',
          type: 'area',
          data: stockSeries,
        },
        {
          name: 'Bull Projection',
          type: 'line',
          data: bullSeries,
          dashArray: 5, // Dotted line for projection
        }, 
        {
          name: 'Bear Projection',
          type: 'line',
          data: bearSeries,
          dashArray: 5, // Dotted line for projection
        },
        {
          name: 'Net Gamma',
          type: 'line',
          data: netGammaSeries,
        },
        {
          name: 'Call Gamma',
          type: 'line',
          data: callGammaSeries,
        },
        {
          name: 'Put Gamma',
          type: 'line',
          data: putGammaSeries,
        },
        {
          name: 'Market Pressure',
          type: 'line',
          data: gammaSeriesWithBreaks,
        },
      ],
      markers: {
        size: [0, 0, 0, 0, 0, 0, 8], // Hide markers for projection lines
        shape: "square",
        strokeWidth: 0,
      },
      stroke: {
        width: [4, 4, 4, 1, 3, 3, 1], // Set stroke width for each series
        dashArray: [0, 5, 5, 0, 0, 0, 1], // Solid line for actual data, dotted lines for projections
        curve: ["smooth", "smooth", "smooth", "smooth", "smooth", "smooth", "straight"],
      },
      colors: ['#008FFB', '#00E396', '#FF4560', "#000000", "#00E396", "#FF4560", '#000000'],
      dataLabels: {
        enabled: false
      },
      // title: { text: ticker.toUpperCase() + " (5min) Market Pressure Walls" },
      xaxis: {
        type: 'datetime',
        tickPlacement: 'on',
        max: fourPM, // Set the max x-axis value to 4 PM
      },
      yaxis: [
        {
          seriesName: "Stock Price", // stock price
          title: {
            text: 'Price',
          },
          forceNiceScale: true,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2) ;
            },
          },
        },
        { seriesName: "Stock Price" }, // bull projection
        { seriesName: "Stock Price" }, // bear projection
        {
          seriesName: "Net Gamma", // net gamma
          opposite: true, // Display on the right side
          show: false,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2);
            },
          },
          min: Math.min(...putGammaSeries.map(item => item.y)) * 1.3, // Scale min to 90% of the lowest value
          max: Math.max(...callGammaSeries.map(item => item.y)) * 1.3  // Scale max to 110% of the highest value

        },
        { seriesName: "Net Gamma" }, // call gamma
        { seriesName: "Net Gamma" }, // put gamma
        { seriesName: "Stock Price" } // gamma walls
      ],
      forecastDataPoints: {
        count: forecastPoints
      },
      grid: {
        show: false, // This will hide both x and y gridlines
      },
      legend: { show: false },
      tooltip: {
        shared: true,
        intersect: false,
        x: {
          show: true,
          format: 'dd MMM yyyy HH:mm TT',
          formatter: undefined,
        },
        y: {
          formatter: function (val) {
            return (val).toFixed(2)
          }
        }
      },
      annotations: {
        yaxis: gexAnnotations
      },
    };

    $(".gammaChartOverlay").removeClass("d-none")
    $(".gammaChartOverlay").empty()

    if (this.chartGEXOverlay != null) this.chartGEXOverlay.destroy();

    document.querySelectorAll('.gammaChartOverlay').forEach((element) => {
      const chart = new ApexCharts(element, options);
      chart.render();
      $("#gammaOverlayContainer").addClass("ready")
    });

  }

  async render_price_widget(ticker) {
    var current_price = "-"
    var directionGradientClass = "gradient-green";
    var timestamp = new Date()
    var directionArrowClass = ""
    var change = "-"
    var pct = "-"
    
    // try to get the price from the API, if it fails, set the price to "-" then render the widget
    try {
      var url = `https://api.spyderacademy.com/v1/stock/stock_price/?ticker=${ticker}`;
      let response = await $.ajax({ url: url, method: 'GET' });

      if (response) {
        current_price = response[ticker].price.toFixed(2)

        directionGradientClass = response[ticker].change < 0 ? "gradient-red" : "gradient-green";
        timestamp = new Date(response[ticker].timestamp).toLocaleTimeString()
        directionArrowClass = response[ticker].change < 0 ? "fa-arrow-down" : "fa-arrow-up";
        change = Math.abs(response[ticker].change.toFixed(2))
        pct = Math.abs(response[ticker].pct)

        // render the widget
        $("#priceWidget").empty()
        $("#priceWidget").append(`
          <div class="card trade_card border-1 p-2 mx-0 my-0 lg-rounded ${directionGradientClass}" >
              <div class="card-body p-1 tradeRow">
                  <div class="container p-0">
                      <div class="row align-items-center">
                          <div class="col-lg-1 col-2 m-0">
                              <img class="tradeLogo" src="/images/logos/${ticker}.png" style="width: 3em; border-radius: 2em; border: 3px solid white;" />
                          </div>
                          <div class="col-lg-11 col-10 px-3">
                              <div class="row ">
                                  <div class="col-8 small lh-1 fw-bold text-uppercase traderName text-nowrap"></div>
                                  <div class="col-4"></div>
                              </div>
                              <div class="row">
                                  <div class="col-8 fs-3 lh-1 tradeContract text-nowrap ">${ticker}</div>
                                  <div class="col-4 fs-3 lh-1 tradeGain text-end">$${current_price}</div>
                              </div>
                              <div class="row">
                                  <div class="col-8 text-muted lh-1 priceTime text-uppercase " style="font-size: 0.6em;">as of ${timestamp}</div>
                                  <div class="col-4 small lh-1 priceChange text-end"><i class='fa ${directionArrowClass}'></i> ${change} (${pct}%)</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          `)
      }
    } 
    catch (error) {
      current_price = "-"
      directionGradientClass = "gradient-green";
      timestamp = new Date().toLocaleTimeString()
      directionArrowClass = ""
      change = "-"
      pct = "-"

      // render the empty widget without price info
      $("#priceWidget").empty()
      $("#priceWidget").append(`
        <div class="card trade_card border-1 p-2 mx-0 my-0 lg-rounded ${directionGradientClass}" >
            <div class="card-body p-1 tradeRow">
                <div class="container p-0">
                    <div class="row align-items-center">
                        <div class="col-lg-1 col-2 m-0">
                            <img class="tradeLogo" src="/images/logos/${ticker}.png" style="width: 3em; border-radius: 2em; border: 3px solid white;" />
                        </div>
                        <div class="col-lg-11 col-10 px-3">
                            <div class="row ">
                                <div class="col-8 small lh-1 fw-bold text-uppercase traderName text-nowrap"></div>
                                <div class="col-4"></div>
                            </div>
                            <div class="row">
                                <div class="col-8 fs-3 lh-1 tradeContract text-nowrap ">${ticker}</div>
                                <div class="col-4 fs-3 lh-1 tradeGain text-end"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `)
    }
    
    

  }

  async render_favorites() {
    var url = `https://api.spyderacademy.com/v1/users/watchlist/`;

    try {
      let response = await $.ajax({ url: url, method: 'GET' });
      if (response) {
        // iterate the response dictionary
        for (const [key, stock] of Object.entries(response)) {
          // Check if the card for this stock already exists
          let existingCard = $(`#favorites_card-${stock.symbol}`);

          if (existingCard.length > 0) {
            // Update existing card content
            existingCard.find(".symbol_price").text(stock.price.toFixed(2));

            var directionArrowClass = stock["change"] < 0 ? "fa-arrow-down" : "fa-arrow-up";
            existingCard.find(".symbol_change").html(`<i class='fa ${directionArrowClass}'></i> ${Math.abs(stock.change.toFixed(2))} (${Math.abs(stock.pct)}%)`);
            existingCard.find(".card").removeClass("gradient-red gradient-green").addClass(stock.change < 0 ? "gradient-red" : "gradient-green");
          } else {
            // Clone the template
            let card = $(".favorite_stocks_template").clone();
            card.removeClass('d-none');
            card.removeClass('favorite_stocks_template');
            card.attr('id', `favorites_card-${stock["symbol"]}`);

            // Set the properties
            card.find(".tradeLogo").attr("src", `/images/logos/${stock.symbol}.png`);
            card.find(".symbol_link").text(stock.symbol);
            card.find(".symbol_link").attr("href", `/stocks/${stock["symbol"].toLowerCase()}/`);
            card.find(".symbol_price").text(stock.price.toFixed(2));

            var directionArrowClass = stock["change"] < 0 ? "fa-arrow-down" : "fa-arrow-up";
            card.find(".symbol_change").html(`<i class='fa ${directionArrowClass}'></i> ${Math.abs(stock.change.toFixed(2))} (${Math.abs(stock.pct)}%)`);
            card.find(".card").addClass(stock.change < 0 ? "gradient-red" : "gradient-green");

            // Append the filled card to the container
            $("#favorite_stocks").append(card);
          }
        }
      }
    } catch (error) {
      console.error("Error rendering favorites:", error);
    }
  }




} // end TradePlanner
