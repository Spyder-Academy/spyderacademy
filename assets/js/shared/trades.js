// Reference to the Firestore database
    
// Fetch the first record from the database
// db.collection("trades").limit(1).get()
//   .then(function(querySnapshot) {
//     // Access the data from the query snapshot
//     querySnapshot.forEach(function(doc) {
//       var data = doc.data();
//       // Display the data on the page
//       var dataContainer = document.getElementById('data-container');
//       dataContainer.innerHTML = JSON.stringify(data);
//     });
//   })
//   .catch(function(error) {
//     console.error('Error fetching data:', error);
//   });

class TradeRecord {
    constructor(userid, username, ticker, strike, expiration, entry_price, entry_date, notes, exit_price_max, exit_date_max) {
      this.userid = userid;
      this.username = username;
      this.ticker = ticker;
      this.strike = strike;
      this.expiration = expiration;
      this.entry_price = entry_price;
      this.entry_date = entry_date;
      this.notes = notes;
      this.exit_price_max = exit_price_max;
      this.exit_date_max = exit_date_max;
    }
  
    static from_dict(source) {
      const trade = new TradeRecord(
        source["userid"],
        source["username"],
        source["ticker"],
        source["strike"],
        source["expiration"],
        source["entry_price"],
        source["entry_date"],
        source["notes"],
        source["exit_price_max"],
        source["exit_date_max"]
      );
  
      if ("userid" in source) {
        trade.userid = source["userid"];
      }
  
      if ("username" in source) {
        trade.username = source["username"];
      }
  
      if ("ticker" in source) {
        trade.ticker = source["ticker"];
      }
  
      if ("strike" in source) {
        trade.strike = source["strike"];
      }
  
      if ("expiration" in source) {
        trade.expiration = source["expiration"];
      }
  
      if ("entry_price" in source) {
        trade.entry_price = source["entry_price"];
      }
  
      if ("entry_date" in source) {
        trade.entry_date = source["entry_date"];
      }
  
      if ("notes" in source) {
        trade.notes = source["notes"];
      }
  
      if ("exit_price_max" in source) {
        trade.exit_price_max = source["exit_price_max"];
      }
  
      if ("exit_date_max" in source) {
        trade.exit_date_max = source["exit_date_max"];
      }
  
      return trade;
    }
  
    to_dict() {
      const dest = {
        userid: this.userid,
        username: this.username,
        ticker: this.ticker,
        strike: this.strike,
        expiration: this.expiration,
        entry_price: this.entry_price,
        entry_date: this.entry_date,
        notes: this.notes,
        exit_price_max: this.exit_price_max,
        exit_date_max: this.exit_date_max,
      };
  
      if (this.userid) {
        dest.userid = this.userid;
      }
  
      if (this.username) {
        dest.username = this.username;
      }
  
      if (this.ticker) {
        dest.ticker = this.ticker;
      }
  
      if (this.strike) {
        dest.strike = this.strike;
      }
  
      if (this.expiration) {
        dest.expiration = this.expiration;
      }
  
      if (this.entry_price) {
        dest.entry_price = this.entry_price;
      }
  
      if (this.entry_date) {
        dest.entry_date = this.entry_date;
      }
  
      if (this.notes) {
        dest.notes = this.notes;
      }
  
      if (this.exit_price_max) {
        dest.exit_price_max = this.exit_price_max;
      }
  
      if (this.exit_date_max) {
        dest.exit_date_max = this.exit_date_max;
      }
  
      return dest;
    }

    isExpired(from_date){
        // Get the current date
        var current_date = new Date(from_date);
            
        // Parse the expiration date string
        var expiration_date_parts = this.expiration.split("/");
        var expiration_month = parseInt(expiration_date_parts[0]) - 1; // Month is 0-based in JavaScript
        var expiration_day = parseInt(expiration_date_parts[1]);

        var expiration_date_obj = new Date(current_date.getFullYear(), expiration_month, expiration_day);

        // Compare the expiration date with the current date
        if (expiration_date_obj < current_date) {
            return true;
        } else {
            return false;
        }
    }
  
    toString() {
      return `TradeRecord(
        userid=${this.userid},
        username=${this.username},
        ticker=${this.ticker},
        strike=${this.strike},
        expiration=${this.expiration},
        entry_price=${this.entry_price},
        entry_date=${this.entry_date},
        notes=${this.notes},
        exit_price_max=${this.exit_price_max},
        exit_date_max=${this.exit_date_max}
      )`;
    }
  }
  

class Trades {

    constructor() {
        // constructor
        this.firestore_db = firebase.firestore();
        this.filterByUser = null;

        this.chartHeatmap = null;
        this.chartScatterGains = null;
    }

    selectUser(username){
        this.filterByUser = username !== null ? username.toString() : null;
    }

    renderHeatmap(seriesData){
        var options = {
          series: seriesData,
          chart: {
                height: 350,
                type: 'heatmap',
                toolbar: {
                    show: false,
                }
          },
          xaxis:{
            labels: {
                show: false
            }
          },
          tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
              return '<div class="tooltip">' +
                '<span class="tooltip-title">' + dataPointIndex + '</span>' +
                '</div>';
            }
          },
          plotOptions: {
            heatmap: {
              shadeIntensity: 0.5,
              radius: 0,
              useFillColorAsStroke: false,
              reverseNegativeShade: true,
              colorScale: {
                ranges: [{
                    from: -30,
                    to: -1,
                    name: 'Red Day',
                    color: '#cc0000'
                  },
                  {
                    from: 0,
                    to: 0,
                    name: 'No Trades',
                    color: '#FFFFFF'
                  },
                  {
                    from: 1,
                    to: 29,
                    name: 'Green Day',
                    color: '#90EE90'
                  },
                  {
                    from: 30,
                    to: 55,
                    name: 'Super Green Day',
                    color: '#29741d'
                  }
                ]
              }
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            width: 1,
          },
          legend: {
            show: false
          },
        title: { text: "DAILY PERFORMANCE"},
        };
  
        if (this.chartHeatmap != null) this.chartHeatmap.destroy();

        this.chartHeatmap = new ApexCharts(document.querySelector("#tradeHeatmap"), options);

        var self = this;

        // Add an event listener to the ApexCharts instance
        this.chartHeatmap.addEventListener('dataPointSelection', function(event, chartContext, config) {
            // Extract the selected date from the clicked data point
            var selectedIndex = config.dataPointIndex + 1
            var selectedSeries = config.seriesIndex

            var selectedDate = new Date(seriesData[selectedSeries].name + " " + selectedIndex + " 2023");
            // Call the getTodaysRecap() function with the selected date
            self.renderRecap(selectedDate.setHours(0,0,0,0));
        });
        
        this.chartHeatmap.render();
    }

    renderCalendar(){
        // Query Firestore for trades collection
        var tradesRef = this.firestore_db.collection('trades');
        var self = this;
        

        // Retrieve trades where trades occurred
        var tradesQuery = tradesRef.where('exit_date_max', '>=', new Date("05/22/2023"));

        // Create a map to store the count of winners and losers for each date
        var seriesData = {};

        // Execute the trades query
        tradesQuery.get().then((querySnapshot) => {
            // Iterate over the query snapshot
            querySnapshot.forEach((doc) => {
                var tradeEntry = TradeRecord.from_dict(doc.data());
                var exitDate = tradeEntry.exit_date_max.toDate().setHours(0, 0, 0, 0);

                var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                if (showTrade){
                    // Determine if the trade is a winner or loser
                    var gain = ((tradeEntry.exit_price_max - tradeEntry.entry_price) / tradeEntry.entry_price) * 100
                    var isWinner = gain > 0;
                    var isLoser = gain < 0;

                    // Extract the month and date from the exit date
                    var month = new Date(exitDate).toLocaleString('default', { month: 'short' });
                    var date = new Date(exitDate).getDate();

                // Create a unique key for each date
                    var monthKey = month;

                // Update the series data for the specific month and date
                    if (seriesData.hasOwnProperty(monthKey)) {
                        var monthData = seriesData[monthKey];
                
                        // Find the index of the date in the monthData array
                        var dateIndex = monthData.findIndex((data) => data.x === date);
                
                        if (dateIndex !== -1) {
                            if (isWinner) {
                                monthData[dateIndex].y += 1; // Increment winners count
                            } 
                            else if (isLoser) {
                                monthData[dateIndex].y -= 1; // Decrement losers count
                            }
                        } 
                        else {
                            monthData.push({ x: date, y: isWinner ? 1 : -1 });
                        }
                    } 
                    else {
                        seriesData[monthKey] = [{ x: date, y: isWinner ? 1 : -1 }];
                    }
                }
            });
            
            

            // Add missing dates with a value of 0 for each month
            Object.values(seriesData).forEach((monthData) => {
                var allDates = monthData.map((data) => data.x);
                var minDate = 1;
                var maxDate = 31;
                for (var i = minDate; i <= maxDate; i++) {
                    if (!allDates.includes(i)) {
                        monthData.push({ x: i, y: null });
                    }
                }
            });

            // Convert the seriesData object to an array of series
            var series = Object.entries(seriesData).map(([key, value]) => ({
                name: key,
                data: value
            }));

            // Sort the series array by date within each series
            series.forEach((seriesItem) => {
                seriesItem.data.sort((a, b) => a.x - b.x);
            });

            this.renderHeatmap(series);

        });

    }


    getGainsBubble() {
        var self = this;
        var trades_query = this.firestore_db.collection("trades");

        return trades_query
          .where('exit_date_max', '>=', new Date("05/22/2023"))
          .get()
          .then((querySnapshot) => {
            const data = [];
            
            querySnapshot.forEach((doc) => {
              const tradeData =  TradeRecord.from_dict(doc.data());

              var showTrade = self.filterByUser == null || tradeData.userid == self.filterByUser
              if (showTrade){
                data.push({
                    userid: tradeData.userid,
                    username: tradeData.username,
                    exit_date: tradeData.exit_date_max.toDate(),
                    gain: Math.round(((tradeData.exit_price_max - tradeData.entry_price) / tradeData.entry_price) * 100, 0),
                });
                }
            });
            
            return data;
          });
    }

    renderGainsBubbleChart() {
        self = this;
        
        this.getGainsBubble().then((tradesData) => {
          const seriesData = [];
          
          // Group trades by userid
          const tradesByUser = tradesData.reduce((acc, trade) => {
            if (!acc[trade.userid]) {
              acc[trade.userid] = [];
            }
            acc[trade.userid].push(trade);
            return acc;
          }, {});
          
          // Create series data for each username
          for (const userid in tradesByUser) {

            const trades = tradesByUser[userid];
            const series = {
              name: tradesData.find((data) => data.userid == userid).username,
              data: trades.map((trade) => ({
                x: trade.exit_date,
                y: trade.gain, 
              })),
            };
            seriesData.push(series);
          }
          

          // Configure and render the Bubble Chart
          const options = {
            series: seriesData,
            chart: {
                type: 'scatter',
                zoom: {
                    type: 'xy'
                },
                toolbar: {show: false},
                events: {
                    dataPointSelection: (event, chartContext, config) => {
                        var dateClicked = seriesData[0].data[config.dataPointIndex].x
                        self.renderRecap(dateClicked)
                    }
                  }
            },
            dataLabels: { enabled: false },
            title: { text: "GAINS vs LOSSES"},
            xaxis: {
                type: 'datetime',
              },
            yaxis: {
                min: -100,
                tickAmount: 10,
                forceNiceScale: true,
                labels: {
                    formatter: function (value) {
                      return value + "%";
                    }
                  },
            }
            // Additional chart configurations...
          };

          if (this.chartScatterGains != null) this.chartScatterGains.destroy();


          this.chartScatterGains = new ApexCharts(
            document.querySelector("#tradeGainsBubble"),
            options
          );

          this.chartScatterGains.render();
        });
    }

    renderTradeRecap(trades, recap_date){
        $('#tradeRecap').empty()
        
        var date = new Date(recap_date);
        var formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        $('#tradeRecap').append("<h2 class='text-uppercase p-3'>" + formattedDate + "</h2>");        

        var tradeCard = $('.trade-card-template');
        
        // Create table rows for each trade
        trades.forEach(function(trade) {
            var username = trade[0];
            var ticker = trade[1];
            var strike = trade[2];
            var entryPrice = trade[3];
            var expiration = trade[4];
            var tradeGain = trade[5];
            var exitPrices = trade[6];
            var notes = trade[7];

            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.find(".traderName").text(username)
            tradeCardRow.find(".tradeContract").text(ticker + " " + strike)
            tradeCardRow.find(".tradeGain").text(tradeGain)
            tradeCardRow.find(".tradeNotes").text(notes)
            tradeCardRow.find(".tradeLogo").attr("src", "https://www.getthatcashmoney.com/images/logos/" + ticker.toUpperCase() + ".png")

            $('#tradeRecap').append(tradeCardRow);
        });
    
    }
    
   
    // get the daily recap for today
    renderRecap(dateString = null){
        var self = this;

        if (dateString === null)
            dateString = new Date().setHours(0,0,0,0)

        var todayStart = new Date(dateString)
        this.getRecap(todayStart).then((tradesList) => {
                this.renderTradeRecap(tradesList, dateString)
            }
        );

    }

    getOpenTrades(recap_date){
        var self = this;
        // Query for open trades
        var entryDate = new Date(recap_date);
        entryDate.setDate(entryDate.getDate() + 1);

        var trades_query = this.firestore_db.collection("trades");

        var trades_query_filter = trades_query.where("exit_date_max", "==", null).where("entry_date", "<=", entryDate);

        return new Promise((resolve, reject) => {
            trades_query_filter.get().then(
                function(trades_snapshot) {
                    // Retrieve the open trades (that have not expired)
                    var trades = []
                    trades_snapshot.forEach(
                        function(doc) {
                            var tradeEntry = TradeRecord.from_dict(doc.data());
                            var tradeGain = "OPEN";
                            var exit_prices_str = "OPEN";

                            var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                            
                            if (!tradeEntry.isExpired(recap_date) && showTrade) {
                                trades.push([tradeEntry.username, tradeEntry.ticker, tradeEntry.strike, tradeEntry.entry_price.toString(), tradeEntry.expiration, tradeGain, exit_prices_str, tradeEntry.notes]);
                            }
                        }
                    );

                    resolve (trades);
                }
            ).catch((error) => { reject(error); });
        });
    }

    getClosedTrades(recap_date){
        var self = this;

        // Query for exited trades
        var trades_query = this.firestore_db.collection("trades");
    

        var recapDateStart = new Date(recap_date);
        recapDateStart.setUTCHours(0, 0, 0, 0);
        recapDateStart.setHours(recapDateStart.getHours() - 4);

        var recapDateEnd = new Date(recap_date);
        recapDateEnd.setUTCHours(23, 59, 59, 999);
        recapDateEnd.setHours(recapDateEnd.getHours() - 4);
        var trades_query_filter = trades_query.where("exit_date_max", ">=", new Date(recapDateStart)).where("exit_date_max", "<=", new Date(recapDateEnd));

        return new Promise((resolve, reject) => {
            trades_query_filter.get().then(
                function(trades_snapshot) {
                    // Retrieve the open trades (that have not expired)
                    var trades = []
                    trades_snapshot.forEach(
                        function(doc) {
                            var tradeEntry = TradeRecord.from_dict(doc.data());
                            var tradeGain, exit_prices_str;
                
                            if (tradeEntry.ticker === "ES" || tradeEntry.ticker === "MES" || tradeEntry.ticker === "MNQ" || tradeEntry.ticker === "NQ") {
                                if (tradeEntry.strike.toUpperCase().endsWith("LONG")) {
                                    tradeGain = (tradeEntry.exit_price_max - tradeEntry.entry_price) + " pts";
                                } 
                                else if (tradeEntry.strike.toUpperCase().endsWith("SHORT")) {
                                    tradeGain = (tradeEntry.entry_price - tradeEntry.exit_price_max) + " pts";
                                }
                            } 
                            else {
                                tradeGain = (((tradeEntry.exit_price_max - tradeEntry.entry_price) / tradeEntry.entry_price) * 100).toFixed(0) + "%";
                            }

                            var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                            if (showTrade){
                                trades.push([tradeEntry.username, tradeEntry.ticker, tradeEntry.strike, tradeEntry.entry_price.toString(), tradeEntry.expiration, tradeGain, exit_prices_str, tradeEntry.notes]);
                            }
                        }
                    );

                    resolve (trades);
                }
            ).catch((error) => { reject(error); });
        });
    }

    // get the daily recap for the given date
    getRecap(recap_date) {
        var todays_table = [];
    
        // if (user_id) {
        //     trades_query = trades_query.where("userid", "==", user_id);
        // }

        return new Promise((resolve) => {
            Promise.all([
                this.getOpenTrades(recap_date),
                this.getClosedTrades(recap_date)
            ]).then(([open_trades, closed_trades]) => {
                todays_table = open_trades.concat(closed_trades);
                
                // Sort the results
                todays_table = todays_table.sort(function(a, b) {
                    return parseFloat(b[5].replace("%", "").replace(" pts", "").replace("OPEN", "0")) - parseFloat(a[5].replace("%", "").replace(" pts", "").replace("OPEN", "0"));
                });
    
                resolve(todays_table);
            });
        });
        
    
    } // end getRecap



} // end class
