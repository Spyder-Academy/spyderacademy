
class TradeRecord {
    constructor(tradeid, userid, username, ticker, strike, expiration, entry_price, entry_date, notes, exit_price_max, exit_date_max) {
      this.tradeid = tradeid;
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

      this.gainsString = "OPEN";
      this.gainsValue = 0;
      this.trims = "OPEN";
    }
  
    static from_dict(id, source) {
        const trade = new TradeRecord(
            id,
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

        trade.tradeid = id;
  
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

            if (trade.exit_price_max !== null){

                trade.trims = trade.exit_price_max;

                if (trade.ticker === "ES" || trade.ticker === "MES" || trade.ticker === "MNQ" || trade.ticker === "NQ") {
                    if (trade.strike.toUpperCase().endsWith("LONG")) {
                        trade.gainsValue = (trade.exit_price_max - trade.entry_price) ;
                        trade.gains = trade.gainsValue.toFixed(0) + " pts"
                    } 
                    else if (trade.strike.toUpperCase().endsWith("SHORT")) {
                        trade.gainsValue = (trade.entry_price - trade.exit_price_max);
                        trade.gainsString = trade.gainsValue.toFixed(0) + " pts"
                    }
                } 
                else {
                    trade.gainsValue = Math.round(((trade.exit_price_max - trade.entry_price) / trade.entry_price) * 100)
                    trade.gainsString = trade.gainsValue.toFixed(0) + "%"
                }
            }
            else{
                trade.gainsString = "OPEN"
                trade.gainsValue = 0
                trade.trims = "OPEN"
            }
        }
      
  
        if ("exit_date_max" in source) {
            trade.exit_date_max = source["exit_date_max"];
        }
    
        return trade;
    }
  
    to_dict() {
      const dest = {
        tradeid: this.tradeid,
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
  
      if (this.tradeid) {
        dest.tradeid = this.tradeid;
      }

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
        tradeid=${this.tradeid},
        userid=${this.userid},
        username=${this.username},
        ticker=${this.ticker},
        strike=${this.strike},
        expiration=${this.expiration},
        entry_price=${this.entry_price},
        entry_date=${this.entry_date},
        notes=${this.notes},
        exit_price_max=${this.exit_price_max},
        exit_date_max=${this.exit_date_max},
        gains=${this.gains},
        gainsValue=${this.gainsValue},
        trims=${this.trims}
      )`;
    }
  }
  

class Trades {

    constructor() {
        // constructor
        this.firestore_db = firebase.firestore();
        this.filterByUser = null;
        this.closedTrades = this._getAllClosedTrades();

        this.chartHeatmap = null;
        this.chartScatterGains = null;
    }

    selectUser(username){
        this.filterByUser = username !== null ? username.toString() : null;
        this.closedTrades = this._getAllClosedTrades();
    }

    renderStats(){
        var self = this;
        var seriesData = {};

        // Execute the trades query
        this.closedTrades.then(tradesData => {
           
            var numTrades = 0;
            var numWins = 0;
            var totalGains = 0;
            tradesData.forEach(tradeEntry => {
                numTrades += 1;
                totalGains += tradeEntry.gainsValue;

                if (tradeEntry.gainsValue > 0) numWins += 1;
            });

            var winRate = Math.round((numWins / numTrades) * 100).toFixed(0)
            var avgGain = Math.round((totalGains / numTrades)).toFixed(0)

            $('#winRate').text(winRate + "%")
            $('#avgGain').text(avgGain + "%")
        });
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
                ranges: [
                  {
                    from: -30,
                    to: 0,
                    name: 'Red Day',
                    color: '#cc0000'
                  },
                  {
                    from: 0,
                    to: 0,
                    name: 'Even Day',
                    color: '#ffbd59'
                  },
                  {
                    from: 0.5,
                    to: 0.5,
                    name: 'No Trades Day',
                    color: '#FFFFFF'
                  },
                  {
                    from: 0.6,
                    to: 100,
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
        // Create a map to store the count of winners and losers for each date
        var self = this;
        var seriesData = {};

         // Initialize with at least the past 6 months
        var currentDate = new Date();
        for (var i = 0; i < 7; i++) {
            var month = currentDate.toLocaleString('default', { month: 'short' });
            var date = currentDate.getDate();
            var monthKey = month;

            if (!seriesData.hasOwnProperty(monthKey)) {
            seriesData[monthKey] = [];
            }
            seriesData[monthKey].push({ x: date, y: 0.5 });

            // Move to the previous month
            currentDate.setMonth(currentDate.getMonth() - 1);
        }


        // Execute the trades query
        this.closedTrades.then(tradesData => {
            tradesData.forEach(tradeEntry => {
                var isWinner = tradeEntry.gainsValue >= 0;
                var isLoser = tradeEntry.gainsValue < 0;
    
                // Extract the month and date from the exit date
                var month = tradeEntry.exit_date_max.toDate().toLocaleString('default', { month: 'short' });
                var date = tradeEntry.exit_date_max.toDate().getDate();
    
                // Create a unique key for each date
                var monthKey = month;
    
                // Update the Chart Series data for the specific month and date
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
            })

            // Add missing dates with a value of 0 for each month
            Object.values(seriesData).forEach((monthData) => {
                var allDates = monthData.map((data) => data.x);
                var minDate = 1;
                var maxDate = 31;
                for (var i = minDate; i <= maxDate; i++) {
                    if (!allDates.includes(i)) {
                        monthData.push({ x: i, y: 0.5 });
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

            series.reverse();

            this.renderHeatmap(series);
        })
        
    }

    renderTVChart(tradeid) {
        var el = document.getElementById("tv_chart_container");
        $(el).empty();
    
        var chart = LightweightCharts.createChart(el, {
            width: 600,
            height: 300,
            rightPriceScale: {
                visible: true,
                borderColor: 'rgba(197, 203, 206, 1)',
            },
            leftPriceScale: {
                visible: true,
                borderColor: 'rgba(197, 203, 206, 1)',
            },
            timeScale: {
                timeVisible: true,
                borderColor: '#ffffff',
            },
            rightPriceScale: {
                borderColor: '#ffffff',
            },
            layout: {
                background: {
                    type: 'solid',
                    color: '#ffffff',
                },
                textColor: '#000',
            },
            grid: {
                horzLines: {
                    color: '#ffffff',
                },
                vertLines: {
                    color: '#ffffff',
                },
            },
        });
    
        var candleStickSeries = chart.addCandlestickSeries({
            priceScaleId: 'right',
            upColor: 'rgb(38,166,154)',
            downColor: 'rgb(255,82,82)',
            wickUpColor: 'rgb(38,166,154)',
            wickDownColor: 'rgb(255,82,82)',
            borderVisible: false,
        });

        var optionsSeries = chart.addLineSeries({
            priceScaleId: 'left',
            color: 'rgba(4, 111, 232, 1)',
	        lineWidth: 2,
        });
    
        // Get the candle data from the database
        var candlesRef = this.firestore_db.collection("trades").doc(tradeid).collection("price_history").doc("underlying");
        var optionsRef = this.firestore_db.collection("trades").doc(tradeid).collection("price_history").doc("options_price");
    
        candlesRef.get().then((doc) => {
            var self = this;
            var candleData = [];
            var candles = doc.data().candles;
    
            candles.forEach((c) => {
                // Parse the string into a Date object
                var time = new Date(c.d);
    
                // Get the Unix timestamp in milliseconds
                var offset = dayjs(c.d).utcOffset() / 60;
                var timestamp = new Date(time).getTime() + (offset * 60 * 60 * 1000);
                var timestampInSeconds = Math.floor(timestamp / 1000);
    
                candleData.push({
                    time: timestampInSeconds,
                    open: c.o,
                    high: c.h,
                    low: c.l,
                    close: c.c
                });
            });
    
            candleStickSeries.setData(candleData);
    
            // Fetch options prices
            optionsRef.get().then((optionsDoc) => {
                var optionsData = optionsDoc.data().candles;
                var optionsSeriesData = [];
    
                optionsData.forEach((c) => {
                    // Parse the string into a Date object
                    var time = new Date(c.d);
    
                    // Get the Unix timestamp in milliseconds
                    var offset = dayjs(c.d).utcOffset() / 60;
                    var timestamp = new Date(time).getTime() + (offset * 60 * 60 * 1000);
                    var timestampInSeconds = Math.floor(timestamp / 1000);
    
                    optionsSeriesData.push({
                        time: timestampInSeconds,
                        value: c.c
                    });
                });
    
                // Add options series to the chart
                optionsSeries.setData(optionsSeriesData);

            }).catch((error) => {
                console.error("Error fetching options prices:", error);
            });
        }).then(() => {
            this.closedTrades.then(tradesData => {
                var tradeEntry = tradesData.find((data) => data.tradeid == tradeid)
    
                if (tradeEntry !== undefined) {
                    var markers = [];
    
                    var entryTime = Math.floor(tradeEntry.entry_date.toDate().getTime() / 1000)
                    var exitTime = Math.floor(tradeEntry.exit_date_max.toDate().getTime() / 1000)
    
                    // Convert to EDT
                    var offset = dayjs(tradeEntry.entry_date.toDate().toLocaleDateString()).utcOffset() / 60;
                    entryTime = Math.floor(new Date(entryTime).getTime() + (offset * 60 * 60 * 1000) / 1000);
                    exitTime = Math.floor(new Date(exitTime).getTime() + (offset * 60 * 60 * 1000) / 1000);
    
                    if (tradeEntry.exit_date_max != null) {
                        markers.push({
                            time: exitTime,
                            position: 'aboveBar',
                            color: '#e91e63',
                            shape: 'arrowDown',
                            text: 'Max Exit @ ' + tradeEntry.exit_price_max
                        });
                    }
    
                    if (tradeEntry.entry_price != null) {
                        markers.push({
                            time: entryTime,
                            position: 'belowBar',
                            color: '#2196F3',
                            shape: 'arrowUp',
                            text: 'Entered @ ' + tradeEntry.entry_price
                        });
                    }
    
                    candleStickSeries.setMarkers(markers);
                }
            });
        })
    }
    


    renderGainsBubbleChart() {
        self = this;

        this.closedTrades.then(tradesData => {
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
                x: trade.exit_date_max.toDate(),
                y: trade.gainsValue, 
                fillColor: self.filterByUser ? (trade.gainsValue < 0 ? '#FF0000' : "#BFE1CF") : null
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
            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.find(".traderName").text(trade.username)
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)
            tradeCardRow.find(".tradeLogo").attr("src", "https://www.getthatcashmoney.com/images/logos/" + trade.ticker.toUpperCase() + ".png")
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)

            $('#tradeRecap').append(tradeCardRow);
        });
    
    }
    
   
    // get the daily recap for today
    renderRecap(dateString = null){
        var self = this;

        if (dateString === null)
            dateString = new Date().setHours(0,0,0,0)

        var todayStart = new Date(dateString)
        this._getRecap(todayStart).then((tradesList) => {
                this.renderTradeRecap(tradesList, dateString)
            }
        );

    }

    _getOpenTrades(recap_date){
        var self = this;
        // Query for open trades
        var entryDate = new Date(recap_date);
        entryDate.setDate(entryDate.getDate() + 1);
        console.log("Query Firebase - getOpenTrades", recap_date)

        var trades_query = this.firestore_db.collection("trades");

        var trades_query_filter = trades_query.where("exit_date_max", "==", null).where("entry_date", "<=", entryDate);

        return new Promise((resolve, reject) => {
            trades_query_filter.get().then(
                function(trades_snapshot) {
                    // Retrieve the open trades (that have not expired)
                    var trades = []
                    trades_snapshot.forEach(
                        function(doc) {
                            var tradeEntry = TradeRecord.from_dict(doc.id, doc.data());

                            var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                            
                            if (!tradeEntry.isExpired(recap_date) && showTrade) {
                                trades.push(tradeEntry)
                            }
                        }
                    );

                    resolve (trades);
                }
            ).catch((error) => { reject(error); });
        });
    }

    _getClosedTrades(recap_date){
        var self = this;

        // Query for exited trades
        var trades_query = this.firestore_db.collection("trades");
        console.log("Query Firebase - getClosedTrades", recap_date)

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
                            var tradeEntry = TradeRecord.from_dict(doc.id, doc.data());

                            var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                            if (showTrade){
                                trades.push(tradeEntry)
                            }
                        }
                    );

                    resolve (trades);
                }
            ).catch((error) => { reject(error); });
        });
    }

    _getAllClosedTrades(){
        var self = this;

        console.log("Query Firebase - getAllClosedTrades")
        var trades_query = this.firestore_db.collection("trades");
        return trades_query
          .where('exit_date_max', '>=', new Date("05/22/2023"))
          .get()
          .then((querySnapshot) => {
                const data = [];
                
                querySnapshot.forEach((doc) => {
                    const tradeEntry =  TradeRecord.from_dict(doc.id, doc.data());

                    var showTrade = self.filterByUser == null || tradeEntry.userid == self.filterByUser
                    if (showTrade){
                        data.push(tradeEntry)
                    }
                });

                return data;
            });
    }


    // get the daily recap for the given date
    _getRecap(recap_date) {
        var todays_table = [];
        return new Promise((resolve) => {
            Promise.all([
                this._getOpenTrades(recap_date),
                this._getClosedTrades(recap_date)
            ]).then(([open_trades, closed_trades]) => {
                todays_table = open_trades.concat(closed_trades);
                
                // Sort the results
                todays_table = todays_table.sort(function(a, b) {
                    return b.gainsValue - a.gainsValue
                });
    
                resolve(todays_table);
            });
        });
    } // end getRecap





} // end class
