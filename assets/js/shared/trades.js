
class TradeRecord {
    constructor(tradeid, userid, username, ticker, strike, expiration, entry_price, entry_date, notes, exit_price_max, exit_date_max, drawdown_max) {
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
      this.drawdown_max = drawdown_max;
      this.gainsString = "OPEN";
      this.gainsValue = 0;
      this.trims = "OPEN";
      this.drawdownValue = "";
      this.drawdown_max_percentage = 0;
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
            source["exit_date_max"],
            source["drawdown_max"]
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

        if ("drawdown_max" in source) {
          trade.drawdown_max = source["drawdown_max"];
          if (trade.drawdown_max) {

            trade.drawdown_max_percentage = Math.round(((trade.drawdown_max - trade.entry_price) / trade.entry_price) * 100)
            if (trade.drawdown_max_percentage > 0){
              trade.drawdown_max_percentage = 0;
            }

            trade.drawdownValue = trade.drawdown_max_percentage.toFixed(0) + "% ($" + trade.drawdown_max.toFixed(2) + ")"
          }
          else{
            trade.drawdown_max_percentage = 0;
            trade.drawdownValue = "";
          }
        }
    
        if ("exit_price_max" in source) {
            trade.exit_price_max = source["exit_price_max"];

            if (trade.exit_price_max !== null){

                trade.trims = trade.exit_price_max;

                if (trade.ticker === "ES" || trade.ticker === "MES" || trade.ticker === "MNQ" || trade.ticker === "NQ" || trade.ticker === "RTY" || trade.ticker === "MCL" || trade.ticker === "MYM") {
                    if (trade.strike.toUpperCase().endsWith("LONG")) {
                        trade.gainsValue = (trade.exit_price_max - trade.entry_price) ;
                        trade.gainsString = trade.gainsValue.toFixed(0) + " pts"
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
        drawdown_max: this.drawdown_max
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

      if (this.drawdown_max) {
        dest.drawdown_max = this.drawdown_max;
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
        var expiration_year = parseInt(this.entry_date.toDate().getFullYear()) // hack until i fix the exp dates in the db to include the year!


        // console.log("Expiration Date: :", expiration_year)
        var expiration_date_obj = new Date(expiration_year, expiration_month, expiration_day);
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
        drawdown_max=${this.drawdown_max}
      )`;
    }
  }
  

class Trades {

    constructor() {
        // constructor
        this.firestore_db = firebase.firestore();
        this.filterByUser = null;
        // this.closedTrades = this._getAllClosedTrades();

        this.chartHeatmap = null;
        this.chartScatterGains = null;
        this.chartAvgGains = null;
        this.chartWinRate = null;
        this.tradeGainsDOWRadar = null;
        this.chartTrims = null;
        this.chartDrawdowns = null;

        this.tradesCollection = this.firestore_db.collection("trades");
        this.userMode = false;

    }

    selectUser(username){
        this.filterByUser = username !== null ? username.toString() : null;

        if (this.filterByUser !== null && this.userLoggedIn !== null && this.filterByUser.toLowerCase() == this.userLoggedIn.uid.toLowerCase()){
          this.tradesCollection =  this.firestore_db.collection("users").doc(this.userLoggedIn.email).collection("trades")
          this.userMode = true;
        }
        else{
          this.tradesCollection = this.firestore_db.collection("trades")
          this.userMode = false;
        }

        this.closedTrades = this._getAllClosedTrades();
    }

    updateCharts(){
        this.userLoggedIn = firebase.auth().currentUser;
        this.clearAll();
        this.clearRecommendations();

        this.renderStats();
        this.renderCalendar();
        this.renderScoreboard();
        this.renderGainsBubbleChart();
        this.renderRecap();
        this.renderDrawDowns();
    }

    clearAll(){
      // clear stats
      $("#winRate").text("");
      $("#avgGain").text("");
      $('#numTrades').text("")
      $("#profitFactor").text("");

      $("#memberTrades").hide()
      $("#tradeAnalytics").hide()
    }

    renderStats(){
        var self = this;
        var seriesData = {};

        // Execute the trades query
        this.closedTrades.then(tradesData => {
           
            var numTrades = tradesData.length;
            var numWins = tradesData.filter(tradeEntry => tradeEntry.gainsValue >= 0).length;
            var numLosses = tradesData.filter(tradeEntry => tradeEntry.gainsValue < 0).length;
            var totalGains = tradesData.reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);
            var numBags = tradesData.filter(tradeEntry => tradeEntry.gainsValue >= 100).length;

            var totalGainsFromWins = tradesData
                .filter(tradeEntry => tradeEntry.gainsValue >= 0)
                .reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);

            var totalLossFromLosses = tradesData
                .filter(tradeEntry => tradeEntry.gainsValue < 0)
                .reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);
           
            var profitFactor = (numWins / numLosses).toFixed(1)
            
            var avgGain = Math.round((totalGains / numTrades)).toFixed(0);
            var avgLoss = Math.round((totalLossFromLosses / numLosses)).toFixed(0);
            var avgWin = Math.round((totalGainsFromWins / numWins)).toFixed(0);

            var winRate = numTrades > 0 ? `${Math.round((numWins / numTrades) * 100)}%` : '-'
            var winFactor = numLosses > 0 ? profitFactor : "-"
            var avgGain = numTrades > 0 ? `${avgGain}%` : "-"

            $("#winRate").text(winRate);
            $("#avgGain").text(avgGain);
            $('#numTrades').text(numTrades + "Trades")
            $("#profitFactor").text( numBags + "💰");

            if (numTrades == 0){
              $("#tradeAnalytics").hide()
            }
            else{
              $("#tradeAnalytics").show()
            }

            // show the donut of the wins vs losses
            var winRateChartOptions = {
                chart: {
                  id: 'winRateChart',
                  group: 'sparks',
                  type: 'donut',
                  height: 70,
                  sparkline: {
                    enabled: true
                  },
                },
                series: [numWins, numLosses],
                labels: ['Wins', 'Losses'],
                colors: ['#4caf50', '#f44336'],
              }

            if (this.chartWinRate != null) this.chartWinRate.destroy();
            this.chartWinRate = new ApexCharts(document.querySelector("#winRateChart"), winRateChartOptions);
            this.chartWinRate.render();


            // // Calculate rolling average data for average gain chart
            // var rollingAvgData = [];
            // var rollingSum = 0;
            // for (var i = 0; i < tradesData.length; i++) {
            //     if (i > 20){
            //         rollingSum += tradesData[i].gainsValue;
            //         var rollingAvg = rollingSum / (i + 1 - 20);
            //         rollingAvgData.push(rollingAvg.toFixed(0));
            //     }
            // }

            // var avgGainsChartOptions = {
            //     chart: {
            //       id: 'avgGainChart',
            //       group: 'sparks',
            //       type: 'line',
            //       height: 80,
            //       sparkline: {
            //         enabled: true
            //       },
            //       dropShadow: {
            //         enabled: true,
            //         top: 1,
            //         left: 1,
            //         blur: 2,
            //         opacity: 0.2,
            //       }
            //     },
            //     series: [
            //         {
            //           name: 'Average Gain',
            //           data: rollingAvgData,
            //         },
            //     ],
            //     stroke: {
            //       curve: 'smooth',
            //       width: 3,
            //     },
            //     markers: {
            //       size: 0
            //     },
            //     grid: {
            //       padding: {
            //         top: 10,
            //         bottom: 10,
            //         left: 65
            //       }
            //     },
            //     colors: ['#fff'],
            //     tooltip: {
            //       x: {
            //         show: false
            //       },
            //       y: {
            //         title: {
            //           formatter: function formatter(val) {
            //             return val + '%';
            //           }
            //         }
            //       }
            //     }
            //   }

            // if (this.chartAvgGains != null) this.chartAvgGains.destroy();
            // this.chartAvgGains = new ApexCharts(document.querySelector("#avgGainChart"), avgGainsChartOptions);
            // this.chartAvgGains.render();
        


            // Calculate the win percentages by the day of the week
            var winPercentages = [0, 0, 0, 0, 0]; // Initialize an array to hold the win percentages for each weekday (Monday to Friday)
            var totalTradesByDay = [0, 0, 0, 0, 0]; // Initialize an array to hold the total trades for each weekday

            // Iterate through each trade
            tradesData.forEach(function(trade) {
                var exitDate = trade.exit_date_max.toDate();
                var dayOfWeek = exitDate.getDay(); // Get the day of the week (0-6, where 0 is Sunday)
                
                // Exclude Sunday (0) and Saturday (6)
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    dayOfWeek--; // Adjust the index to start from 0 for Monday
                    totalTradesByDay[dayOfWeek]++; // Increment the total trades for the corresponding day
                    
                    if (trade.gainsValue >= 0) {
                        winPercentages[dayOfWeek]++; // Increment the win count for the corresponding day
                    }
                }
            });

            // Calculate win percentages
            var tradeWinPercentages = [];
            for (var i = 0; i < winPercentages.length; i++) {
                var totalTrades = totalTradesByDay[i];
                var winCount = winPercentages[i];
                var winPercentage = Math.round((winCount / totalTrades) * 100, 1) || 0; // Calculate the win percentage (handle divide by zero case)
                tradeWinPercentages.push(winPercentage);
            }

            // Radar plot configuration
            var radarChartOptions = {
                series: [{
                    name: 'Win Percentage',
                    data: tradeWinPercentages,
                }],
                chart: {
                    height: 400,
                    type: 'radar',
                    toolbar: {
                        show: false,
                    }
                },
              dataLabels: {
                enabled: true
              },
              plotOptions: {
                radar: {
                  size: 140,
                  polygons: {
                    strokeColors: '#e9e9e9',
                    fill: {
                      colors: ['#f8f8f8', '#fff']
                    }
                  }
                }
              },
              title: {
                text: 'WIN RATE BY DAY OF THE WEEK'
              },
              colors: ['#FF4560'],
              markers: {
                size: 4,
                colors: ['#fff'],
                strokeColor: '#FF4560',
                strokeWidth: 2,
              },
              tooltip: {
                y: {
                  formatter: function(val) {
                    return val + "%"
                  }
                }
              },
              xaxis: {
                categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
              },
              yaxis: {
                tickAmount: 7,
                labels: {
                  formatter: function(val, i) {
                    if (i % 2 === 0) {
                      return val
                    } else {
                      return ''
                    }
                  }
                }
              }
              };

            // Create the radar chart
            if (this.tradeGainsDOWRadar != null) this.tradeGainsDOWRadar.destroy();
            
            this.tradeGainsDOWRadar = new ApexCharts(document.querySelector("#tradeGainsDOWRadar"), radarChartOptions);
            
            this.tradeGainsDOWRadar.render();
            
            // add ai recommendations
            var weakestDayIndex = 0;
            var weakestDayPercentage = tradeWinPercentages[0];

            for (var i = 1; i < tradeWinPercentages.length; i++) {
              if (tradeWinPercentages[i] < weakestDayPercentage) {
                weakestDayIndex = i;
                weakestDayPercentage = tradeWinPercentages[i];
              }
            }
            
            var weakestDayOfWeek;
            switch (weakestDayIndex) {
              case 0:
                weakestDayOfWeek = "Monday";
                break;
              case 1:
                weakestDayOfWeek = "Tuesday";
                break;
              case 2:
                weakestDayOfWeek = "Wednesday";
                break;
              case 3:
                weakestDayOfWeek = "Thursday";
                break;
              case 4:
                weakestDayOfWeek = "Friday";
                break;
              default:
                weakestDayOfWeek = "Unknown";
            }
            
            this.addRecommendation("🤖" + weakestDayOfWeek + " is your weakest day of the week.  Consider trading lighter on that day.")


            // check if avg loss is > avg win
            if (Math.abs(avgLoss) > Math.abs(avgWin)){
              this.addRecommendation("🤖 Your avg loss (" + Math.abs(avgLoss) + "%) is greater than your avg win (" + avgWin + "%).  Try cutting losers faster.")
            }
            else{
              this.addRecommendation("✅ Nice! Your avg loss (" + Math.abs(avgLoss) + "%) is less than your avg win (" + avgWin + "%).")
            }


            // what is the average drawdown on losing trades?

          
        });
    }

    renderDrawDowns(trades){
      this.closedTrades.then(tradesData => {

          // get the counts of winning trades/losing trades based on range of drawdown.

          // Categorize drawdowns
          var drawdownWinCategories = {
            "0%": 0,
            "1-10%": 0,
            "11-20%": 0,
            "21-30%": 0,
            "31-50%": 0,
            "51%+": 0,
            // Add more categories here...
          };

          var drawdownLossCategories = {
            "0%": 0,
            "1-10%": 0,
            "11-20%": 0,
            "21-30%": 0,
            "31-50%": 0,
            "51%+": 0,
            // Add more categories here...
          };

          // Iterate through trade records
          $.each(tradesData, function(index, trade) {
            var drawdown = trade.drawdown_max_percentage;

            if (trade.gainsValue >= 0){
              if (trade.drawdown_max && drawdown >= 0) {
                drawdownWinCategories["0%"]++;
              } else if (drawdown < -1 && drawdown >= -10) {
                drawdownWinCategories["1-10%"]++;
              } else if (drawdown < -10  && drawdown >= -20) {
                drawdownWinCategories["11-20%"]++;
              } else if (drawdown < -20  && drawdown >= -30) {
                drawdownWinCategories["21-30%"]++;
              } else if (drawdown < -30  && drawdown >= -50) {
                drawdownWinCategories["31-50%"]++;
              } else if (drawdown < -50) {
                drawdownWinCategories["51%+"]++;
              }
              // Add more conditions for other categories...
            }

            else if (trade.gainsValue < 0){
              if (trade.drawdown_max && drawdown >= 0) {
                drawdownLossCategories["0%"]++;
              } else if (drawdown < -1 && drawdown >= -10) {
                drawdownLossCategories["1-10%"]++;
              } else if (drawdown < -10  && drawdown >= -20) {
                drawdownLossCategories["11-20%"]++;
              } else if (drawdown < -20  && drawdown >= -30) {
                drawdownLossCategories["21-30%"]++;
              } else if (drawdown < -30  && drawdown >= -50) {
                drawdownLossCategories["31-50%"]++;
              } else if (drawdown < -50) {
                drawdownLossCategories["51%+"]++;
              }
              // Add more conditions for other categories...
            }
          });

          // Prepare data for ApexCharts
          var chartData = {
            chart: {
              type: 'bar',
              height: 400,
              toolbar: {
                show: false,
              }
            },
            series: [
              {
                name: 'Trades that went green',
                data: Object.values(drawdownWinCategories),
              },
              {
                name: 'Trades that were cut red',
                data: Object.values(drawdownLossCategories),
              }
            ],
            xaxis: {
              categories: Object.keys(drawdownWinCategories),
            },
            colors: [ "#BFE1CF", "#cc0000"],
            title: { text: "WINS AFTER A DRAWDOWN"},
          };

          // Render the bar chart
          if (this.chartDrawdowns != null) this.chartDrawdowns.destroy();

          this.chartDrawdowns = new ApexCharts(document.querySelector("#tradeDrawdowns"), chartData);
          this.chartDrawdowns.render();


      });
    }


    renderHeatmap(seriesData){
        
        var options = {
          series: seriesData,
          chart: {
                height: 400,
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

            // console.log(config)

            //var selectedDate = new Date(seriesData[selectedSeries].name + " " + selectedIndex + " 2023");
            var [month, year] = seriesData[selectedSeries].name.split(" ");

            var monthMap = {Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12}
            // console.log(monthMap[month], selectedIndex, year)

            var selectedDate = new Date(year, monthMap[month] - 1, selectedIndex);

            // Call the getTodaysRecap() function with the selected date
            self.renderRecap(selectedDate.setHours(0,0,0,0));
        });
      
        this.chartHeatmap.render();

        
    }


    isDataExpired(timestamp) {
      const now = new Date().getTime();
      return now - timestamp > 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    }

    async renderTrims(trades) {
      var self = this;
      var upsideTradeData = [];
      var downsideTradeData = [];

      var tradeMaxLoss = [];
      var exitPriceCache = {}; // In-memory cache for exit prices

      for (const trade of trades) {
        var tradeId = trade.tradeid;
        var entryPrice = trade.entry_price;
    
        var exitsRef = this.tradesCollection.doc(tradeId).collection("exits");
    
        if (trade.exit_price_max != null)
        {
          try {

            // Check if exit prices are already cached for this trade
            var exitPrices = null;
            let cachedData = localStorage.getItem(tradeId);
            if (cachedData) {
              cachedData = JSON.parse(cachedData);
              if (!self.isDataExpired(cachedData.timestamp)) {
                // Use cached data if it's still valid
                exitPrices = cachedData.exitPrices;
              } else {
                // Fetch exit prices from Firebase and update the cache
                const querySnapshot = await exitsRef.get();
                exitPrices = querySnapshot.docs.map(doc => doc.data()["price"]).sort();
                
                const cachedData = { exitPrices: exitPrices, timestamp: new Date().getTime() };
                localStorage.setItem(tradeId, JSON.stringify(cachedData));
              }
            } else {
              // Fetch exit prices from Firebase and cache them with timestamp
              const querySnapshot = await exitsRef.get();
              exitPrices = querySnapshot.docs.map(doc => doc.data()["price"]).sort();
              
              const cachedData = { exitPrices: exitPrices, timestamp: new Date().getTime() };
              localStorage.setItem(tradeId, JSON.stringify(cachedData));
            }

            // console.log(exitPrices)
            
            // Calculate statistics for the trade
            const percentageGainLoss = exitPrices.map(trimPrice => Math.round(((trimPrice - entryPrice) / entryPrice * 100)));

            // Add value 0 to the dataset
            percentageGainLoss.push(0);

            const sortedValues = percentageGainLoss.slice().sort((a, b) => a - b);

            // len will always be 2+ (since one real trim, and we injected a 0)
            const len = sortedValues.length;
            
            const q1Val =  sortedValues[1] // second trim
            const medianVal =  sortedValues[Math.ceil((len - 1)/2)]; // middle trim
            const q3Val =  len > 2 ? sortedValues[len - 2] : sortedValues[len - 1] // second to last trim, or last if only one trim
            
            var minVal =  (sortedValues[0]);
            var maxVal =  (sortedValues[len - 1]);

            if (maxVal == 0){
              maxVal = 0.001
            }
      
            var keyValue = trade.username + " " + trade.ticker + " " + trade.strike

            upsideTradeData.push(
              {
                x: keyValue,
                y: maxVal,
                goals: [
                  {
                      name: "First Trim",
                      value: sortedValues[1],
                      strokeWidth: 2,
                      strokeColor: '#775DD0',
                  }
                ]
              });
           
            downsideTradeData.push(
              {
                x: keyValue,
                y: minVal
              });


           

          } catch (error) {
            console.error("Error fetching exit data for trade:", tradeId, error);
          }
        }
      }

      console.log(upsideTradeData)


      var options = {
        series: [
          {
            name: 'Max Trim',
            data: upsideTradeData
          },
          {
            name: 'Downside Trims',
            data: downsideTradeData
          }
        ],
        chart: {
          height: 400,
          type: 'bar',
          stacked: true,
          toolbar: false,
        },
        title: {
          text: "TRIM LEVELS"
        },
        xaxis: {
          title: {
            text: "Trim Percentage"
          }
        },
        yaxis: {
          min: -100,
        },
        plotOptions: {
          bar: {
            horizontal: true,
          }
        },
        colors: ['#BFE1CF', '#FF4560'],
        dataLabels: {
        enabled: false
        },
        tooltip: {
          shared: false,
          x: {
            formatter: function (val) {
              return val
            }
          },
          y: {
            formatter: function (val) {
              return Math.abs(val) + "%"
            }
          }
        },
        legend: {
          show: false,
          showForSingleSeries: true,
          customLegendItems: ['Max Trim', 'First Trim'],
          markers: {
            fillColors: ['#BFE1CF', '#CC0000']
          }
        }
      };
    
      if (this.chartTrims != null) {
        this.chartTrims.destroy();
      }
    
      this.chartTrims = new ApexCharts(document.querySelector("#tradeTrims"), options);
      this.chartTrims.render();
    }
    

    clearRecommendations() {
      $("#aiRecommendations").empty();

      if (!firebase.auth().currentUser){
        $(".membersAI").show();
        $("#aiRecommendations").hide()
      }else{
        $(".membersAI").hide();
        $("#aiRecommendations").show()
      }

    }

    addRecommendation(notes){
      if (firebase.auth().currentUser){
        var newItem = $(".ai-template").clone()
        newItem.text(notes)
        newItem.removeClass("d-none")
        newItem.removeClass("ai-template")
        
        $("#aiRecommendations").append(newItem);
      }
    }

    renderCalendar() {
      // Create a map to store the count of winners and losers for each date
      var self = this;
      var seriesData = {};
  
      // Initialize with at least the past 6 months
      var currentDate = new Date();
      for (var i = 0; i < 7; i++) {
          var month = currentDate.getMonth(); //toLocaleString('default', { month: 'short' });
          var year = currentDate.getFullYear();
          var date = currentDate.getDate();
          var monthKey = new Date(year, month, 1); // Include the year in the key
  
          if (!seriesData.hasOwnProperty(monthKey)) {
              seriesData[monthKey] = [];
          }
          // seriesData[monthKey].push({ x: date, y: 0.5 });
  
          // Move to the previous month
          currentDate.setMonth(currentDate.getMonth());
      }
  
      // Execute the trades query
      this.closedTrades.then(tradesData => {
          tradesData.forEach(tradeEntry => {
              var isWinner = tradeEntry.gainsValue >= 0;
              var isLoser = tradeEntry.gainsValue < 0;
  
              // Extract the month, date, and year from the exit date
              var month = tradeEntry.exit_date_max.toDate().getMonth(); //toLocaleString('default', { month: 'short' });
              var year = tradeEntry.exit_date_max.toDate().getFullYear();
              var date = tradeEntry.exit_date_max.toDate().getDate();
              var monthKey = new Date(year, month, 1); // Include the year in the key
  
              // Create a unique key for each date
              if (seriesData.hasOwnProperty(monthKey)) {
                  var monthData = seriesData[monthKey];
  
                  // Find the index of the date in the monthData array
                  var dateIndex = monthData.findIndex((data) => data.x === date);
  
                  if (dateIndex !== -1) {
                      if (isWinner) {
                          monthData[dateIndex].y += 1; // Increment winners count
                      } else if (isLoser) {
                          monthData[dateIndex].y -= 1; // Decrement losers count
                      }
                  } else {
                      monthData.push({ x: date, y: isWinner ? 1 : -1 });
                  }
              } else {
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
  
          // console.log("seriesData", seriesData)
          // Convert the seriesData object to an array of series
          var series = Object.entries(seriesData).map(([key, value]) => ({
              name: key,
              data: value,
          }));
  
          // Sort the series array by date within each series
          series.forEach((seriesItem) => {
              seriesItem.data.sort((a, b) => a.x - b.x);
          });

          // sort the series (months) themselves
          series = series.sort((a, b) => new Date(a.name) - new Date(b.name))
          // console.log("sorted seriesData", series)
  
          // series.reverse();

          // Update the name property of each element in the series array
          series.forEach((item) => {
            item.name = new Date(item.name).toLocaleString('default', { month: 'short' }) + ' ' + new Date(item.name).getFullYear();
          });
         

          this.renderHeatmap(series);
      })
    }
  

    renderTVChart(parentEl, tradeid) {
        var el = $(parentEl).find(".tvChartHeader")[0]
       
        if (!$(el).hasClass("d-none")){
            // chart is currently visible, so ignore the redraw
            return;
        }

        // otherwise continue to show this chart
        $(el).empty()
        $('.tvChartHeader').addClass("d-none"); // hide all other charts
        $('.entryExitNotes').addClass("d-none"); // hide all other charts
        $(el).removeClass("d-none");

    
        var chart = LightweightCharts.createChart(el, {
            height: 300,
            rightPriceScale: {
                visible: true,
                borderVisible: false,
            },
            leftPriceScale: {
                visible: true,
                borderColor: '#ffffff',
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
                    color: 'white',
                },
                textColor: 'black',
            },
            crosshair: {
                horzLine: {
                    visible: false,
                    labelVisible: false,
                },
                vertLine: {
                    visible: true,
                    style: 0,
                    width: 2,
                    color: 'rgba(32, 38, 46, 0.1)',
                    labelVisible: false,
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
    
        var candleStickSeries = chart.addCandlestickSeries({
            priceScaleId: 'right',
            upColor: 'rgb(38,166,154)',
            downColor: 'rgb(255,82,82)',
            wickUpColor: 'rgb(38,166,154)',
            wickDownColor: 'rgb(255,82,82)',
            borderVisible: false,
            overlay: true,
        });

        var optionsSeries = chart.addCandlestickSeries({
            priceScaleId: 'left',
            upColor: 'blue',
            downColor: 'blue',
            wickUpColor: 'blue',
            wickDownColor: 'blue',
	        lineWidth: 2,
            overlay: true,
        });

        // Get the candle data from the database
        var tradeRef = this.tradesCollection.doc(tradeid);
        var candlesRef = this.tradesCollection.doc(tradeid).collection("price_history").doc("underlying").collection("candles");
        var optionsRef = this.tradesCollection.doc(tradeid).collection("price_history").doc("options_price").collection("candles");
        var entriesRef = this.tradesCollection.doc(tradeid).collection("entries");
        var exitsRef = this.tradesCollection.doc(tradeid).collection("exits");
    
        var hasData = false;
        
        candlesRef.get().then((querySnapshot) => {
            var self = this;
            var candleData = [];
            // var candles = doc.data().candles;
    
            querySnapshot.forEach((doc) => {
                var c = doc.data();
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

                hasData = true;
            });
    
            candleStickSeries.setData(candleData);
        });
    
        // Fetch options prices
        optionsRef.get().then((querySnapshot) => {
            // var optionsData = optionsDoc.data().candles;

            var optionsSeriesData = [];

            querySnapshot.forEach((doc) => {
                // Parse the string into a Date object
                var c = doc.data();
                var time = new Date(c.d);

                // Get the Unix timestamp in milliseconds
                var offset = dayjs(c.d).utcOffset() / 60;
                var timestamp = new Date(time).getTime() + (offset * 60 * 60 * 1000);
                var timestampInSeconds = Math.floor(timestamp / 1000);

                optionsSeriesData.push({
                    time: timestampInSeconds,
                    open: c.o,
                    high: c.h,
                    low: c.l,
                    close: c.c
                });

                hasData = true;
            });

            // Add options series to the chart
            optionsSeries.setData(optionsSeriesData);

        });

        var markers = [];
        var entryExitNotes = [];
        var offset = 0;

        // Fetch entries data
        entriesRef.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                var entryData = doc.data();
                var entryTime = Math.floor(entryData["date_time"].toDate().getTime() / 1000);
                var entryPrice = entryData["price"]; 
                var entryNotes = entryData["notes"];
                entryData["action"] = "ADDED"

                offset = dayjs(entryData["date_time"].toDate().toLocaleDateString()).utcOffset() / 60;

                // Convert to EDT
                entryTime = Math.floor(entryTime + (offset * 60 * 60 * 1000) / 1000);

                // Create entry marker object
                var entryMarker = {
                    time: entryTime,
                    position: 'belowBar',
                    color: '#2196F3',
                    shape: 'arrowUp',
                    text: parseFloat(entryPrice).toFixed(2)
                };
                markers.push(entryMarker);
                entryExitNotes.push(entryData)
            });
        }).then(() => {
            // Fetch exits data
            exitsRef.get().then((querySnapshot) => {
                // var exitMarkers = [];
                querySnapshot.forEach((doc) => {
                    var exitData = doc.data();
                    var exitTime = Math.floor(exitData["date_time"].toDate().getTime() / 1000);
                    var exitPrice = exitData["price"]; 
                    var exitNotes = exitData["notes"];
                    exitData["action"] = "TRIMMED"

                    offset = dayjs(exitData["date_time"].toDate().toLocaleDateString()).utcOffset() / 60;

                    // Convert to EDT
                    exitTime = Math.floor(exitTime + (offset * 60 * 60 * 1000) / 1000);

                    // Create exit marker object
                    var exitMarker = {
                        time: exitTime,
                        position: 'aboveBar',
                        color: '#e91e63',
                        shape: 'arrowDown',
                        text: parseFloat(exitPrice).toFixed(2) 
                    };

                    markers.push(exitMarker);
                    entryExitNotes.push(exitData)
                });
            }).then(() => {
                optionsSeries.setMarkers(markers);

                const toolTipWidth = 106;
                // Create and style the tooltip html element
                const toolTip = document.createElement('div');
                toolTip.style = `width: ${toolTipWidth}px; height: 300px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px 4px 0px 0px; border-bottom: none; box-shadow: 0 2px 5px 0 rgba(117, 134, 150, 0.45);font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
                toolTip.style.background = `rgba(${'255, 255, 255'}, 0.25)`;
                toolTip.style.color = 'black';
                toolTip.style.borderColor = 'rgba( 239, 83, 80, 1)';
                el.appendChild(toolTip);

                // update tooltip
                chart.subscribeCrosshairMove(param => {
                    if (
                        param.point === undefined ||
                        !param.time ||
                        param.point.x < 0 ||
                        param.point.x > el.clientWidth ||
                        param.point.y < 0 ||
                        param.point.y > el.clientHeight
                    ) {
                        toolTip.style.display = 'none';
                    } else {
                        // time will be in the same format that we supplied to setData.
                        // thus it will be YYYY-MM-DD
                        const dateStr = new Date((param.time * 1000) - (offset * 60 * 60 * 1000)).toLocaleString();
                        toolTip.style.display = 'block';
                        const stockData = param.seriesData.get(candleStickSeries);
                        const stockPrice = stockData.value !== undefined ? stockData.value : stockData.close;
                        const optionsData = param.seriesData.get(optionsSeries);
                        const optionsPrice = optionsData.value !== undefined ? optionsData.value : optionsData.close;
                        const ticker = $(parentEl).find('.tradeContract').text()
                        toolTip.innerHTML = `<div class="h6 nowrap" style="color: ${'rgba( 239, 83, 80, 1)'}">`+ ticker + `</div>` + 
                            `<div style="font-size: 20px; margin: 4px 0px; color: ${'black'}">$ ${(Math.round(100 * stockPrice) / 100).toFixed(2)}</div>` +
                            `<div style="font-size: 20px; margin: 4px 0px; color: ${'blue'}">$ ${(Math.round(100 * optionsPrice) / 100).toFixed(2)}</div>` +
                            `<div style="color: ${'black'}">${dateStr}</div>`;
                            
                            

                        let left = param.point.x; // relative to timeScale
                        const timeScaleWidth = chart.timeScale().width();
                        const priceScaleWidth = chart.priceScale('left').width();
                        const halfTooltipWidth = toolTipWidth / 2;
                        left += priceScaleWidth - halfTooltipWidth;
                        left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
                        left = Math.max(left, priceScaleWidth);

                        toolTip.style.left = left + 'px';
                        toolTip.style.top = 0 + 'px';
                    }
                });

                chart.timeScale().fitContent();

                if (hasData == false){
                  $(el).hide();
                }

                var entryNotesEl = $(parentEl).find(".entryExitNotes")
                entryNotesEl.removeClass("d-none");

                entryExitNotes = entryExitNotes.sort(function(a, b) {
                    return a["date_time"].toDate() - b["date_time"].toDate() 
                });

                tradeRef.get().then((doc) => {
                  var tradeEntry = TradeRecord.from_dict(doc.id, doc.data());

                  entryNotesEl.empty();
                  entryNotesEl.append("<h4>TRADE HISTORY</h4>")
                  entryExitNotes.forEach((t) => {
                      var direction = t["action"]
                      var entryNotes = "<strong>" + t["date_time"].toDate().toLocaleString() + "</strong><br/>" + direction + " at $" + parseFloat(t.price).toFixed(2)
                      var entryReason = " | " + t.notes
                      if (t.notes == null){
                        entryReason = ""
                      }

                      var entryNotesP = $("<p>")
                      entryNotesP.append(entryNotes)
                      entryNotesP.append(entryReason)
                      entryNotesEl.append(entryNotesP)
                  })

                  // append a line for max drawdown informaton
                  if (tradeEntry.drawdownValue != ""){
                    entryNotesEl.append("<p><strong>" + "Max Drawdown" + "</strong><br/>" + tradeEntry.drawdownValue + "</p>")
                  }

                  // link button to add an execution (eg average in, trim)
                  if (this.userMode){
                    entryNotesEl.append("<p><a class='secondary' href='#' onclick='showNewTradeExecution(\"" + tradeEntry.tradeid + "\", \"" + tradeEntry.ticker.toUpperCase() + " " + tradeEntry.strike.toUpperCase() + "\");'>" + "Add Execution" + "</a></p>");
                  }

                  
                });

                
    
            });
        })

        var chartWidth = chart.width

        // Append the fullscreen button
        var fullscreenButton = $('<button>', {
            class: 'btn fullscreen_button text-end',
            style: "width: 2em;",
            click: toggleFullscreen
        });

        fullscreenButton.append($('<i/>').addClass('fa fa-expand'));
       
        // Append the contianer for the  buttons
        var buttons = $("<div class='p-3' style='display: flex; justify-content: space-between;'>");
        buttons.append("<a href='/attribution/' class='text-muted text-decoration-none small' style='width: 20em;'>Powered by TradingView</a>");
        buttons.append(fullscreenButton);

        $('.tvChartHeader').append(buttons);

        // Function to toggle fullscreen
        function toggleFullscreen() {
            $('.tvChartHeader').toggleClass('fullscreen');

            // Update the chart size after toggling fullscreen
            if ($('.tvChartHeader').hasClass('fullscreen')) {
                chart.resize(window.innerWidth * 0.9, window.innerHeight * 0.9);
                chart.timeScale().fitContent();
            } else {
                $(el).empty()
                $('.tvChartHeader').addClass("d-none"); // hide all other charts
                $('.entryExitNotes').addClass("d-none"); // hide all other charts
            }
        }
    }
    


    renderGainsBubbleChart() {
      this.closedTrades.then(tradesData => {

        // get the counts of winning trades/losing trades based on range of drawdown.

        // Categorize drawdowns
        var gainsCategories = {
          "0-20%": 0,
          "21-50%": 0,
          "51-100%": 0,
          "101-500%": 0,
          "501-1000%": 0,
          "1000%+": 0,
          // Add more categories here...
        };

        var lossCategories = {
          "0-20%": 0,
          "21-50%": 0,
          "51-100%": 0,
          "101-500%": 0,
          "501-1000%": 0,
          "1000%+": 0,
        };

        // Iterate through trade records
        $.each(tradesData, function(index, trade) {
          var gain = trade.gainsValue;

          if (trade.gainsValue >= 0){
            if (gain >= 0 && gain <= 20) {
              gainsCategories["0-20%"]++;
            } else if (gain > 20 && gain <= 50) {
              gainsCategories["21-50%"]++;
            } else if (gain > 50  && gain <= 100) {
              gainsCategories["51-100%"]++;
            } else if (gain > 100  && gain <= 500) {
              gainsCategories["101-500%"]++;
            } else if (gain > 500  && gain <= 1000) {
              gainsCategories["501-1000%"]++;
            } else if (gain > 1000) {
              gainsCategories["1000%+"]++;
            }
            // Add more conditions for other categories...
          }

          else if (trade.gainsValue < 0){
            if (gain < 0 && gain >= -20) {
              lossCategories["0-20%"]--;
            } else if (gain < -20 && gain >= -50) {
              lossCategories["21-50%"]--;
            } else if (gain < -50  && gain >= -100) {
              lossCategories["51-100%"]--;
            } 
            // Add more conditions for other categories...
          }
        });

        // Prepare data for ApexCharts
        var chartData = {
          chart: {
            type: 'bar',
            height: 400,
            stacked: true,
            toolbar: {
              show: false,
            }
          },
          series: [
            {
              name: 'Winning Trades',
              data: Object.values(gainsCategories),
            },
            {
              name: 'Losing Trades',
              data: Object.values(lossCategories),
            }
          ],
          xaxis: {
            categories: [
              "0-20%",
              "21-50%",
              "51-100%",
              "101-500%",
              "501-1000%",
              "1000%+",
          ],
          },
          colors: [ "#BFE1CF", "#cc0000"],
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: '80%',
            },
            stroke: {
              width: 1,
              colors: ["#fff"]
            },
          },
          dataLabels: {
            enabled: false
          },
          title: { text: "TOTAL WINS AND LOSSES"},
          labels: {
            formatter: function (val) {
              return Math.abs(Math.round(val)) 
            }
          },
          tooltip: {
            shared: false,
            x: {
              formatter: function (val) {
                return val
              }
            },
            y: {
              formatter: function (val) {
                return Math.abs(val) 
              }
            }
          },
        };

        // Render the gains chart
        if (this.chartScatterGains != null) this.chartScatterGains.destroy();

        this.chartScatterGains = new ApexCharts(document.querySelector("#tradeGainsBubble"), chartData);
        this.chartScatterGains.render();
      });
    }

    renderScoreboard(){
      this.closedTrades.then(tradesData => {
        $('#tradeScoreboard').empty()

        var scoreboardRow = $("<div class='row'></div>")
        var scoreboardHeader = $("<div class='col-10'><h2 class='text-uppercase p-3'>" + "LEADERBOARD" + "</h2></div>")
        scoreboardRow.append(scoreboardHeader);
        $('#tradeScoreboard').append(scoreboardRow);

        
        var tradeCard = $('.trade-card-template');

        // Create a copy of the array before sorting
        var tradesDataCopy = [...tradesData];

        // Fix sorting logic
        tradesDataCopy.sort((a, b) => b.gainsValue - a.gainsValue);
                           
        // filter out Mr Woofers (958441217073483800) from the Leaderboard
        tradesDataCopy = tradesDataCopy.filter(tradeEntry => tradeEntry.userid !== 958441217073483800)

        // Get the top 10 trades
        var tradesDataTop = tradesDataCopy.slice(0, 5);


        // Create table rows for each trade
        tradesDataTop.forEach(function(trade) {
            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("trade-card-template")
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.removeClass("col-lg-6")
            tradeCardRow.addClass("col-lg-12")
            tradeCardRow.find(".traderName").text(trade.username + " on " + trade.exit_date_max.toDate().toLocaleDateString())
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)

            var king_image = "/images/logos/" + trade.ticker.toUpperCase() + ".png"
            if (trade.username.toUpperCase() == "LINKSNIPES"){
              king_image = "/images/teachers-linksnipes.png"
            }
            else if (trade.username.toUpperCase().startsWith("MRWOOFERS") || trade.username.toUpperCase().startsWith("MR WOOFERS")){
              king_image = "/images/teachers-mrwoofers.png"
            }
            else if (trade.username.toUpperCase() == "SITH"){
              king_image = "/images/teachers-sith.png"
            }
            else if (trade.username.toUpperCase().startsWith("PAULDOZER")){
              king_image = "/images/teachers-pauldozer.png"
            }
            else if (trade.username.toUpperCase() == "GOBI"){
              king_image = "/images/teachers-gobi.png"
            }
            else if (trade.username.toUpperCase() == "CASHMONEYTRADES"){
              king_image = "/images/teachers-cash.png"
            }
            else if (trade.username.toUpperCase() == "WOODY"){
              king_image = "/images/teachers-woody.png"
            }
            tradeCardRow.find(".tradeLogo").attr("src", king_image)
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)
            tradeCardRow.find(".tradeRow").removeAttr("onclick")

            $('#tradeScoreboard').append(tradeCardRow);
        });
      });
    }

    async renderTopRecentTrades(isCarousel = false, parentElement, templateElement){
      this._getRecentlyClosedTrades().then(tradesData => {
        $(parentElement).empty()

        var scoreboardRow = $("<div class='row'></div>")
        $(parentElement).append(scoreboardRow);

        
        var tradeCard = $(templateElement);

        // Create a copy of the array before sorting
        var tradesDataCopy = [...tradesData];

         // Sort trades by most recent exit date
         tradesDataCopy.sort((a, b) => b.exit_date_max.toDate() - a.exit_date_max.toDate());

        // Filter trades with gain > 0 and then sort by gain within each date
        var filteredAndSortedTrades = tradesDataCopy
          .filter(trade => trade.gainsValue > 20)
          .sort((a, b) => {
            if (a.exit_date_max.toDate().getDate() === b.exit_date_max.toDate().getDate()) {
              return b.gainsValue - a.gainsValue; // Sort by gain if dates are the same
            }
            return b.exit_date_max.toDate() - a.exit_date_max.toDate(); // Otherwise, keep date sort
          });

        // Get the top 10 most recent trades with positive gains
        var tradesDataTop = filteredAndSortedTrades.slice(0, 7);


        // Create table rows for each trade
        tradesDataTop.forEach(function(trade, index) {
            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("trade-card-template")
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.removeClass("col-lg-6")
            tradeCardRow.addClass("col-lg-12")
            
            if (isCarousel) {
              tradeCardRow.addClass("carousel-item")
              tradeCardRow.addClass("pb-5")
              if (index === 0) {
                tradeCardRow.addClass("active")
              }
            }

            var hoursAgo = Math.abs(new Date() - trade.exit_date_max.toDate()) / 36e5; // 36e5 is the number of milliseconds in one hour
            var timeAgoText = Math.floor(hoursAgo) + " hours ago";

            if (hoursAgo > 24){
              if (Math.floor(hoursAgo / 24) == 1) 
                timeAgoText = Math.floor(hoursAgo / 24) + " day ago";
              else
              timeAgoText = Math.floor(hoursAgo / 24) + " days ago";
            }
            else{
              if (Math.floor(hoursAgo) == 1) 
                timeAgoText = Math.floor(hoursAgo) + " hour ago";
              else 
                timeAgoText = Math.floor(hoursAgo) + " hours ago";
          }

            tradeCardRow.find(".traderName").text(timeAgoText)
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)

            var king_image = "/images/logos/" + trade.ticker.toUpperCase() + ".png"
            tradeCardRow.find(".tradeLogo").attr("src", king_image)
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)
            tradeCardRow.find(".tradeRow").removeAttr("onclick")
            tradeCardRow.find(".stockLink").attr("href", "/stocks/" + trade.ticker.toLowerCase() + "/")
            tradeCardRow.find(".stockLink").attr("title", trade.ticker + " | Stock and Overview")

            $(parentElement).append(tradeCardRow);
        });
      });
    }

    renderTradeRecap(trades, recap_date){
        $('#tradeRecap').empty()
        $("#memberTrades").show()

        
        var date = new Date(recap_date);
        var formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        
        var recapRow = $("<div class='row'></div>")
 
        var recapHeader = $("<div class='col-10'><h2 class='text-uppercase p-3'>" + formattedDate + "</h2></div>")
        recapRow.append(recapHeader);

        if (this.userMode){
          var buttons = $("<div class='col-2 d-flex justify-content-end'></div")
          var addTradeButton = $("<button class='btn btn-primary btn-circle m-1' title='Add Trade' onclick='showManualTradeModal();'><i class='fa fa-plus'></i></button>")
          var importButton = $("<button class='btn btn-primary btn-circle m-1' title='Import Trades' onclick='showImportTradeModal();'><i class='fa fa-file-import'></i></button>")
          
          buttons.append(addTradeButton)
          buttons.append(importButton)
          recapRow.append(buttons)
        }

        $('#tradeRecap').append(recapRow);        

        var tradeCard = $('.trade-card-template');
        
        // Create table rows for each trade
        trades.forEach(function(trade) {
            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.removeClass("trade-card-template")
            tradeCardRow.find(".traderName").text(trade.username)
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)
            tradeCardRow.find(".tradeLogo").attr("src", "/images/logos/" + trade.ticker.toUpperCase() + ".png")
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)

            $('#tradeRecap').append(tradeCardRow);
        });

        this.renderTrims(trades)
    
    }
    
   
    // get the daily recap for today
    renderRecap(dateString = null){
        var self = this;

        if (dateString === null){
            var today = new Date()
            if (this.userLoggedIn){
              // use today
              dateString = today.setHours(0,0,0,0)
            }
            else{
              // use yesterday
              var yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);

              dateString = yesterday.setHours(0,0,0,0)
            }
            // console.log(dateString)
            
        }

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

        
        var trades_query_filter = this.tradesCollection.where("exit_date_max", "==", null).where("entry_date", "<=", entryDate);

        return new Promise((resolve, reject) => {
            trades_query_filter.get().then(
                function(trades_snapshot) {
                    // Retrieve the open trades (that have not expired)
                    var trades = []
                    trades_snapshot.forEach(
                        function(doc) {
                            var tradeEntry = TradeRecord.from_dict(doc.id, doc.data());
                            // console.log(tradeEntry)

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
        console.log("Query Firebase - getClosedTrades", recap_date)

        var recapDateStart = new Date(recap_date);
        recapDateStart.setUTCHours(0, 0, 0, 0);
        // recapDateStart.setHours(recapDateStart.getHours() - 4);

        var recapDateEnd = new Date(recap_date);
        recapDateEnd.setUTCHours(23, 59, 59, 999);
        // recapDateEnd.setHours(recapDateEnd.getHours() - 4);
        var trades_query_filter = this.tradesCollection.where("exit_date_max", ">=", new Date(recapDateStart)).where("exit_date_max", "<=", new Date(recapDateEnd));
        // console.log(recapDateEnd)

        return new Promise((resolve, reject) => {
            trades_query_filter.get().then(
                function(trades_snapshot) {
                    // Retrieve the open trades (that have not expired)
                    var trades = []
                    trades_snapshot.forEach(
                        function(doc) {
                            var tradeEntry = TradeRecord.from_dict(doc.id, doc.data());

                            var showTrade = (self.filterByUser == null)|| (tradeEntry.userid == self.filterByUser)
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
        var trades_query = this.tradesCollection
        return trades_query
          .where('exit_date_max', '>=', new Date("05/22/2023"))
          .get()
          .then((querySnapshot) => {
                const data = [];
                
                querySnapshot.forEach((doc) => {
                    const tradeEntry =  TradeRecord.from_dict(doc.id, doc.data());

                    var showTrade = (self.filterByUser == null)|| (tradeEntry.userid == self.filterByUser)
                    if (showTrade){
                        data.push(tradeEntry)
                    }
                });

                return data;
            });
    }

    _getRecentlyClosedTrades(){
      var self = this;

      console.log("Query Firebase - getRecentlyClosedTrades")

      var twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Subtract 14 days

      
      var trades_query = this.tradesCollection
      return trades_query
        .where('exit_date_max', '>=', twoWeeksAgo)
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
      console.log("Get Recap For", new Date(recap_date))
        if (!this.userLoggedIn && recap_date.getDate() == (new Date()).getDate()){
          return new Promise((resolve) => { 
            $(".membersOnlyContent").hide();
            $(".membersOnlyFiller").show();
            
            resolve([])
           });
        }

        var todays_table = [];
        return new Promise((resolve) => {
            Promise.all([
                this._getOpenTrades(recap_date),
                this._getClosedTrades(recap_date)
            ]).then(([open_trades, closed_trades]) => {

                $(".membersOnlyContent").show();
                $(".membersOnlyFiller").hide();
                todays_table = open_trades.concat(closed_trades);
                
                // Sort the results
                todays_table = todays_table.sort(function(a, b) {
                    return b.gainsValue - a.gainsValue
                });
    
                resolve(todays_table);
            });
        });
    } // end getRecap

    calculateFridayDate() {
      // Function to calculate the next Friday date
      var currentDate = new Date();
      
      // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      var currentDayOfWeek = currentDate.getDay();
  
      // Calculate the number of days until the next Friday
      var daysUntilNextFriday = 5 - currentDayOfWeek;
  
      if (daysUntilNextFriday <= 0) {
          // If today is Friday or a later day, add 7 days to get to the next Friday
          daysUntilNextFriday += 7;
      }
  
      // Create a new Date object for the next Friday
      var nextFridayDate = new Date(currentDate);
      nextFridayDate.setDate(currentDate.getDate() + daysUntilNextFriday);
  
      // Format the date as "YYYY-MM-DD"
      var formattedDate = nextFridayDate.toISOString().split('T')[0];
  
      return formattedDate;
    }
  
    formatDate(date) {
      // Function to format date as "YYYY-MM-DD"
      var year = "20" + date.slice(0, 2);
      var month = date.slice(2, 4);
      var day = date.slice(4, 6);
      return year + '-' + month + '-' + day;
    }

    

    addManualTrade(){
      if (this.userLoggedIn && this.userMode){
        var tradeContract = $("#txtTradeContract").val().toUpperCase()
        var tradeEntryDate = $("#txtTradeEntryDate").val()
        var tradeEntryTime = $("#txtTradeEntryTime").val()
        var tradeDatetime = new Date(tradeEntryDate + ' ' + tradeEntryTime);
        console.log(tradeDatetime)

        var tradePrice = $("#txtTradePrice").val()
        var tradeNumCons = $("#txtTradeNumContracts").val()
        var tradeNotes = $("#txtTradeNotes").val()

        var email = firebase.auth().currentUser.email
        var userid = firebase.auth().currentUser.uid

        // Regular expressions to match the two possible formats
        var format1Pattern = /^(\w+)\s+(\d+)(C|P)$/;  // Matches "TSLA 300C"
        var format2Pattern = /^(\w+)\s+(\d{6})(C|P)(\d+)$/;  // Matches "TSLA 230908C300"

        // Check if the input matches the first format
        var format1Match = tradeContract.match(format1Pattern);
        if (format1Match) {
          // Assign values for format 1
          var tradeTicker = format1Match[1];
          var tradeStrike = format1Match[2] + format1Match[3];

          if (tradeTicker in ["SPY", "QQQ", "SPX"]){
            var tradeExp = new Date().toISOString().split('T')[0]; // expires today 0dte default
          }
          else if (tradeTicker in ["MES", "ES", "MNQ", "NQ", "MYM", "RTY", "MCL"]){
            var tradeExp = null // futures dont expire
          }
          else{
            var tradeExp = this.calculateFridayDate();  // Function to calculate this coming Friday date
          }
        } else {
            // Check if the input matches the second format
            var format2Match = tradeContract.match(format2Pattern);

            if (format2Match) {
                // Assign values for format 2
                var tradeTicker = format2Match[1];
                var expirationDate = format2Match[2];
                var tradeStrike = format2Match[4] + format2Match[3];
                var tradeExp = this.formatDate(expirationDate);  // Function to format date as "YYYY-MM-DD"
            } else {
                $('#tradeErrorMessage').text("Invalid trade contract format");
                return false;  // Exit the function if the format is invalid
            }
        }
        

        // Create a new entry in the database for this user's trade
        var userDocRef = this.firestore_db.collection("users").doc(email);
        var tradesCollection = userDocRef.collection('trades');

        // Define the data to be saved
        var tradeData = {
            "entry_date": tradeDatetime,
            "num_contracts": tradeNumCons,
            "entry_price": tradePrice,
            "exit_date_max": null,
            "exit_price_max": null,
            "expiration": tradeExp,
            "notes": tradeNotes,
            "strike": tradeStrike,
            "ticker": tradeTicker,
            "userid": userid,
            "username": email,
        };

        // create the entry record also
        var entryData = {
          "date_time": tradeDatetime,
          "notes": tradeNotes,
          "price": tradePrice,
          "num_contracts": tradeNumCons
        }


        // Add a new document to the "trades" subcollection
        tradesCollection.add(tradeData)
          .then(function(docRef){
            var trade_id = docRef.id

            // create the trade entry record
            tradesCollection.doc(trade_id).collection("entries").add(entryData)

            return true;
          })
      }
      else{
        $('#tradeErrorMessage').text("User not logged in.");
        return false;
      }
      
      $('#tradeErrorMessage').text("Saving Trade");
      return true;
    }

    async addExecutionTrade() {
      if (this.userLoggedIn && this.userMode) {
          try {
              // Create the trade exit (or average in) trade record
              var tradeID = $("#txtTradeExecutionID").val();
              var tradeExecutionAction = $("#txtTradeExecutionAction").val()
              var tradeExecutionDate = $("#txtTradeExecutionDate").val();
              var tradeExecutionTime = $("#txtTradeExecutionTime").val();
              var tradeDatetime = new Date(tradeExecutionDate + ' ' + tradeExecutionTime);
              var tradeNumCons = $("#txtTradeExecutionContracts").val();
              var tradePrice = $("#txtTradeExecutionPrice").val();
              var tradeNotes = $("#txtTradeExecutionNotes").val();
  
              if (tradeExecutionAction == "TRIM") {
                  // Create the exit/trim record
                  var tradeExitData = {
                      "date_time": tradeDatetime,
                      "notes": tradeNotes,
                      "price": tradePrice,
                      "num_contracts": tradeNumCons
                  }
  
                  console.log("Saving trim for ", tradeID, tradeExitData)
  
                  var tradeDocRef = this.tradesCollection.doc(tradeID);
                  var exitCollectionRef = tradeDocRef.collection("exits");
  
                  // Add the trade exit data
                  await exitCollectionRef.add(tradeExitData);
  
                  // Query the exits subcollection to find the maximum exit price
                  var exitQuery = exitCollectionRef.orderBy('price', 'desc').limit(1);
  
                  var querySnapshot = await exitQuery.get();
  
                  var maxExitPrice = null;
                  var maxExitDate = null;
  
                  querySnapshot.forEach(function(exitDoc) {
                      maxExitPrice = exitDoc.get('price');
                      maxExitDate = exitDoc.get('date_time');
                  });
  
                  // Update the parent document with the max exit price and date
                  await tradeDocRef.update({
                      exit_price_max: maxExitPrice,
                      exit_date_max: maxExitDate
                  });
  
                  console.log('Max exit price and date updated successfully');
                  return true;
              } else if (tradeExecutionAction == "AVG IN") {
                  // Create the averaged in entry record
                  // Create the exit/trim record
                  var tradeEntryData = {
                    "date_time": tradeDatetime,
                    "notes": tradeNotes,
                    "price": tradePrice,
                    "num_contracts": tradeNumCons
                  }

                  console.log("Saving Avg In for ", tradeID, tradeEntryData)

                  var tradeDocRef = this.tradesCollection.doc(tradeID);
                  var entryCollectionRef = tradeDocRef.collection("entries");

                  // Add the trade exit data
                  await entryCollectionRef.add(tradeEntryData);

                  // Update the parent document with the entry price
                  await tradeDocRef.update({
                      entry_price: tradePrice
                  });

                  console.log('Entry price updated successfully');
                  return true;
              } else {
                  $('#tradeExecutionErrorMessage').text("Unknown Action");
                  return false;
              }
          } catch (error) {
              console.error('Error in addExecutionTrade:', error);
              return false;
          }
      } else {
          $('#tradeExecutionErrorMessage').text("User not logged in.");
          return false;
      }
  }

  formatETradeDate(inputDate) {
    // Split the input date string into parts
    const parts = inputDate.split('-');
  
    // Convert the month abbreviation to a numeric month
    const monthAbbreviation = parts[0];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months.findIndex(abbr => abbr === monthAbbreviation);
    
    if (month === -1) {
      // Invalid month abbreviation
      return null;
    }
  
    // Extract the day and year
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
  
    // Calculate the full year (considering years below 100)
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
  
    // Create a date object with the extracted values
    const date = new Date(fullYear, month, day);
  
    // Format the date as "YYYY-MM-DD"
    const formattedDate = date.toISOString().split('T')[0];
  
    return formattedDate;
  }
  

  importTradesFromETrade(csvData) {
    if (this.userLoggedIn && this.userMode) {

      // Create a new entry in the database for this user's trade
      var userDocRef = this.firestore_db.collection("users").doc(firebase.auth().currentUser.email);
      var tradesCollection = userDocRef.collection('trades');

      // Split the CSV data into lines
      const lines = csvData.split('\n');
  
      // Define regular expressions to extract relevant data
      const symbolPattern = /"Symbol","(.+?)"/;
      const timePattern = /"Time","(.+?)"/;
      const fillPattern = /"Fill","(.+?)"/;
      const descriptionPattern = /"Description","(.+?)"/;
      const statusPattern = /"Status","(.+?)"/;
      const accountPattern = /"Account","(.+?)"/;
      const idPattern = /"ID","(.+?)"/;
  
      const trades = [];
  
      // Loop through each line of CSV data (excluding header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Extract trade details using regular expressions
          const symbolMatch = line.match(symbolPattern);
          const timeMatch = line.match(timePattern);
          const fillMatch = line.match(fillPattern);
          const descriptionMatch = line.match(descriptionPattern);
          const statusMatch = line.match(statusPattern);
          const accountMatch = line.match(accountPattern);
          const idMatch = line.match(idPattern);
  
          if (symbolMatch && timeMatch && fillMatch && descriptionMatch && statusMatch) {
            // Extract relevant trade details
            const tradeTicker = symbolMatch[1];
            const tradeDatetime = new Date(timeMatch[1]);
            const tradeNumCons = fillMatch[1].split(" @ ")[0]; // '7 @ 2.12'
            const tradePrice = fillMatch[1].split(" @ ")[1]; // '7 @ 2.12'
            const description = descriptionMatch[1].split(" "); // "Sell 7 Sep-22-23 415 Puts @ 2.12 Stop to Close"
            const tradeStrikePrice = description[3] 
            const tradeExp = this.formatETradeDate(description[2])
            
            var tradeStrikeDirection = ""
            if (description[4] == "Puts"){
              tradeStrikeDirection = "P"
            }
            else if (description[4] == "Calls"){
              tradeStrikeDirection = "C"
            }

            const tradeStrike = tradeStrikePrice + tradeStrikeDirection
            const tradeNotes = description
            const tradeStatus = statusMatch[1]; // "Filled"
  
            if (tradeStatus == "Filled" &&  description[0] == "Buy"){
                // Create a trade entry object
                var tradeData = {
                  "entry_date": tradeDatetime,
                  "num_contracts": tradeNumCons,
                  "entry_price": tradePrice,
                  "exit_date_max": null,
                  "exit_price_max": null,
                  "expiration": tradeExp,
                  "notes": tradeNotes,
                  "strike": tradeStrike,
                  "ticker": tradeTicker,
                  "userid":  firebase.auth().currentUser.uid,
                  "username": firebase.auth().currentUser.email,
                };

                var entryData = {
                  "date_time": tradeDatetime,
                  "notes": tradeNotes,
                  "price": tradePrice,
                  "num_contracts": tradeNumCons
                }

                // Add a new document to the "trades" subcollection
                tradesCollection.add(tradeData)
                .then(function(docRef){
                  var trade_id = docRef.id

                  // create the trade entry record
                  tradesCollection.doc(trade_id).collection("entries").add(entryData)
                })
        
              }
            }

            if (tradeStatus == "Filled" &&  description[0] == "Sell"){
              // this is an exit.  Match it to an existing entry trade
              
            }
          }
        }
      }
  }
  

 

  async deleteTrade(){
    if (this.userLoggedIn && this.userMode) {
      var tradeID = $("#txtTradeExecutionID").val();

      var tradeDocRef = this.tradesCollection.doc(tradeID);

      // Add the trade exit data
      await tradeDocRef.delete()
      .then(() => {
        return true;
      })

      return true;
    }
    else {
      $('#tradeExecutionErrorMessage').text("User not logged in.");
      return false;
    } 
  }


  async fetchIVData(ticker) {
    $("#iv_results").addClass("d-none");

    var sentTicker = ticker.toUpperCase();
    var url = "https://api.options.ai/expected-moves/" + sentTicker;

    try {
      let response = await $.ajax({url: url, method: 'GET'});
      if (response && response.length > 0) {
        var item = response[0];
        var movePercent = (item.movePercent * 100).toFixed(2) + '%';
        var moveAmount = '$' + item.moveAmount.toFixed(2);
        var rangeTop = '$' + item.moveUpper.toFixed(2);
        var rangeBottom = '$' + item.moveLower.toFixed(2);
        var ivRange = rangeBottom + ' - ' + rangeTop;
        var closePrice = '$' + (item.moveLower + item.moveAmount).toFixed(2);

        // Update the HTML elements
        $('.movePercent').text(movePercent);
        $('.moveAmount').text("(" + moveAmount + ")");
        $('.ivRange').text(ivRange);
        $('.closePrice').text(closePrice);
        $('.bullRange').text("$" + item.moveUpper.toFixed(2));
        $('.bearRange').text("$" + item.moveLower.toFixed(2));

        $("#iv_results").removeClass("d-none");

        return {"bears": item.moveLower.toFixed(2), "bulls": item.moveUpper.toFixed(2)}

      } else {
        console.error('No data received from API.');
      }
    } catch (error) {
      console.error('Error fetching data from the API:', error);
    }
  }

  async fetchIVMove(ticker) {
    var sentTicker = ticker.toUpperCase();
    var url = "https://api.options.ai/expected-moves/" + sentTicker;

    try {
      let response = await $.ajax({url: url, method: 'GET'});
      if (response && response.length > 0) {
        var item = response[0];
        var movePercent = (item.movePercent * 100).toFixed(2) + '%';
        var moveAmount = '$' + item.moveAmount.toFixed(2);
        var rangeTop = '$' + item.moveUpper.toFixed(2);
        var rangeBottom = '$' + item.moveLower.toFixed(2);
        var ivRange = rangeBottom + ' - ' + rangeTop;
        var closePrice = '$' + (item.moveLower + item.moveAmount).toFixed(2);

        return {
          movePercent: movePercent, 
          moveAmount: moveAmount, 
          rangeTop: rangeTop, 
          rangeBottom: rangeBottom, 
          ivRange: ivRange, 
          closePrice: closePrice
        };
      } 
    } catch (error) {
      console.error('Error fetching data from the API:', error);
    }
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


  async fetchEarningsCalendar() {
    const apiUrlThisWeek = "https://production-market-api.herokuapp.com/earnings/this-week";
    const apiUrlNextWeek = "https://production-market-api.herokuapp.com/earnings/next-week";

    try {
      let responseOne = await $.ajax({ url: apiUrlThisWeek, method: 'GET' });
      let responseTwo = await $.ajax({ url: apiUrlNextWeek, method: 'GET' });
      
      let earningsData = responseOne.concat(responseTwo); // Directly use the response data

      await this.displayEarningsData(earningsData);
      await this.updateIVData(earningsData); // Step 2: Asynchronously update with IV data

    } catch (error) {
      console.error('Error fetching earnings data:', error);
    }
  }

  formatMarketCap(marketCap) {
    return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
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

  displayEarningsCalendarSkeleton(data) {
    let startDate = new Date();
    // If today is Sunday (0), set to Monday. If it's Saturday (6), also adjust to next Monday.
    if (startDate.getDay() === 0) {
        startDate.setDate(startDate.getDate() + 1); // Next day (Monday)
    } else if (startDate.getDay() === 6) {
        startDate.setDate(startDate.getDate() + 2); // Skip to Monday
    }

    let calendarHtml = '';
    let weekdaysAdded = 0;

    // Loop until 5 weekdays have been added
    while (weekdaysAdded < 5) {
        const dayOfWeek = startDate.getDay();
        const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = startDate.toISOString().split('T')[0];

        // Check if the day is a weekday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Add to calendarHtml
            calendarHtml += `<div class="row mb-3" id="earnings-${formattedDate}">`;
            calendarHtml += ` <div class="col-12">`;
            calendarHtml += `   <div class="card shadow m-0">`;
            calendarHtml += `     <div class="card-header">${dayName} ${formattedDate}</div>`;
            calendarHtml += `     <div class="card-body" id="earnings-data-${formattedDate}">`;
            calendarHtml += `       <div class="row">`;
            calendarHtml += `         <div class="col-lg-2 col-6 fw-bold">Symbol</div>`;
            calendarHtml += `         <div class="col-lg-2 col-6 fw-bold d-none d-md-block">Market Cap</div>`;
            calendarHtml += `         <div class="col-lg-3 col-6 fw-bold">Implied Move</div>`;
            calendarHtml += `         <div class="col-lg-4 col-6 fw-bold d-none d-md-block">Bull/Bear Range</div>`;
            calendarHtml += `         <div class="col-lg-1 col-6 fw-bold d-none d-md-block"></div>`;      
            calendarHtml += `       </div>`;
            calendarHtml += `     </div>`;
            calendarHtml += `   </div>`;
            calendarHtml += ` </div>`;
            calendarHtml += `</div>`;
            weekdaysAdded++; // Only increment on weekdays
        }

        // Always move to the next day
        startDate.setDate(startDate.getDate() + 1);
    }

    $('#earningsCalendar').html(calendarHtml);
  }


  
  async displayEarningsData(data) {
    this.displayEarningsCalendarSkeleton(data); // Display the calendar skeleton
    this.sortEarningsData(data); // Sort the data first
  
    for (const earning of data) {
      if (earning.marketCap >= 50000000000) {
        const formattedMarketCap = this.formatMarketCap(earning.marketCap);
        const whenClass = earning.when === 'post market' ? "bg-blue-light" : "";
        const whenIcon = earning.when === 'post market' ? "fa-moon" : "fa-sun";
  
        let earningsEntryHtml = `<div class="row ${whenClass} py-2" style="border-bottom: 1px solid rgba(0,0,0,0.3);" id="earning-${earning.symbol}">`;
        earningsEntryHtml += ` <div class="col-lg-2 col-6 ">${earning.symbol}</div>`;
        earningsEntryHtml += ` <div class="col-lg-2 col-6  d-none d-md-block">${formattedMarketCap}</div>`;
        earningsEntryHtml += ` <div class="col-lg-3 col-6 " id="iv-move-${earning.symbol}">Loading...</div>`;
        earningsEntryHtml += ` <div class="col-lg-4 col-6  d-none d-md-block" id="iv-range-${earning.symbol}"></div>`; // Placeholder for IV range
        earningsEntryHtml += ` <div class="col-lg-1 col-6  d-none d-md-block"><i class="fa-solid ${whenIcon}"></i></div>`;
        earningsEntryHtml += `</div>`;
  
        $(`#earnings-data-${earning.date}`).append(earningsEntryHtml); // Append the data to the respective day
      }
    }
  }

  async updateIVData(data) {
    for (const earning of data) {
      // Parse the earning's date string to a Date object
      let earningDate = new Date(earning.date);

      // Get today's date without the time part
      let today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate yesterday and tomorrow's dates based on today
      let yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (earning.marketCap >= 50000000000 && earningDate >= yesterday && earningDate <= tomorrow) {
        const iv = await this.fetchIVMove(earning.symbol); // Fetch data asynchronously
        if (iv && iv.movePercent != "0.00%"){
          $(`#iv-move-${earning.symbol}`).text(`${iv.movePercent} (${iv.moveAmount})`); // Update IV data
          $(`#iv-range-${earning.symbol}`).text(`${iv.rangeBottom} - ${iv.rangeTop}`);  // Update IV data
        }
        else{
          $(`#iv-move-${earning.symbol}`).text(`N/A`); // Update IV data
          $(`#iv-range-${earning.symbol}`).text(`N/A`);  // Update IV data
        }
      }
      else{
        $(`#iv-move-${earning.symbol}`).text(`TBD`); // Update IV data
        $(`#iv-range-${earning.symbol}`).text(`TBD`);  // Update IV data
      }
    }
  }

  async fetchGEXByStrike(ticker, chartid="#gammaChart") {

    ticker = ticker.toUpperCase();
    const jsonData = await this._fetchGEXData(ticker);
    if (jsonData) {
      this._renderGEXByStrike(ticker, jsonData, chartid);
    } else {
        console.log("No data to render.");
    }
  }

  async _fetchGEXData(ticker) {
    const url = `https://us-central1-spyder-academy.cloudfunctions.net/gex?ticker=${ticker}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch data:", error);
    }
  }

  async _renderGEXByStrike(ticker, jsonData, chartid) {

    // Prepare your data for ApexCharts
    var seriesData = jsonData.map(
      function(item) {
        return {
            x: item.Strike,
            y: item.GEX,
            fillColor: item.GEX >= 0 ? '#00E396' : '#FF4560' // Green for positive, Red for negative
        };
    });

    // Find the item with the largest absolute GEX value
    let maxGEXItem = jsonData.reduce((prev, current) => {
      return (Math.abs(prev.GEX) > Math.abs(current.GEX)) ? prev : current;
    });
    let netGEX = jsonData.reduce((acc, item) => acc + item.GEX, 0);

    var currentSpotPrice = jsonData[0].Spot;

    // Determine the sentiment based on the sign of the GEX and the current spot price
    let bearbull = netGEX > 0 ? "Bullish" : netGEX < 0 ? "Bearish" : "Neutral";

    // if (maxGEXItem.GEX > 0) {
    //   // If largest GEX is positive (call gamma)
    //   bearbull =  "Bullish";
    // } else {
    //   // If largest GEX is negative (put gamma)
    //   bearbull =  "Bearish";
    // }

    $(".largestGammaLevelText").text("$" + maxGEXItem.Strike.toFixed(2));
    $(".gammaOutlook").text(bearbull);




    var options = {
      chart: {
          type: 'bar',
          height: 350,
          toolbar: {
            show: false,
          }
      },
      series: [{
          name: 'GEX',
          data: seriesData
      }],
      plotOptions: {
          bar: {
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
      title: { text: ticker.toUpperCase() + " Gamma Exposure By Strike"},
      xaxis: {
          type: 'category',
          title: {
              text: 'Strike Price'
          },
          labels: {
            formatter: function (x) {
              return "$" + x.toFixed(0) ;
            }
          }
      },
      yaxis: {
          title: {
              text: 'Gamma Exposure (Bn$/%)'
          },
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

    $(chartid).removeClass("d-none")
    $(chartid).empty()
    
    if (this.chartGEX != null) this.chartGEX.destroy();

    this.chartGEX = new ApexCharts(document.querySelector(chartid), options);
    this.chartGEX.render();
  }

  async fetchGEXOverlay(ticker, expectedMove = null) {
    ticker = ticker.toUpperCase();
    const jsonData = await this._fetchGEXOverlayData(ticker);
    if (jsonData) {
      this._renderGEXOverlay(ticker, jsonData, expectedMove);
    } else {
        console.log("No data to render.");
    }
  }

  async _fetchGEXOverlayData(ticker) {
    const url = `https://us-central1-spyder-academy.cloudfunctions.net/gex_overlay?ticker=${ticker}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch data:", error);
    }
  }

  _prepareGEXOverlayChartData(data) {
    // Define the offset for EST (UTC-5 hours)
    const estOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    
    // Prepare stock price series
    const stockSeries = data.stock_price.map(item => ({
        x: new Date(new Date(item.begins_at).getTime() - estOffset).getTime(),
        y: parseFloat(item.close_price)
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
              text: `$${item.Strike.toFixed(2)}`,
              position: 'center'
          }
      };
    });


    return { stockSeries, gexAnnotations };
  }

  async _renderGEXOverlay(ticker, jsonData, expectedMove = null) {

    const { stockSeries, gexAnnotations } = this._prepareGEXOverlayChartData(jsonData);
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

    

    var nextTimestamp = lastDataPoint.x + (120 * 60 * 1000); // Adding 120 minutes (2hr)

    if (expectedMove === null) nextTimestamp = lastDataPoint.x 
    expectedMove = expectedMove || {"bears": lastCloseDataPoint, "bulls": lastCloseDataPoint}; // Use the given expectedMove or fallback to default

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
    
    var options = {
      chart: {
          height: 350,
          type: 'area',
          stacked: false,
          toolbar: false,
          zoom: {
            type: 'x',
            enabled: true,
            autoScaleYaxis: true
          },
      },
      series: [{
          name: 'Stock Price',
          type: 'area',
          data: stockSeries
        },
        {
          name: 'Bull Projection',
          type: 'line',
          data: bullSeries,
          dashArray: 5, // Dotted line for projection
        }, {
          name: 'Bear Projection',
          type: 'line',
          data: bearSeries,
          dashArray: 5, // Dotted line for projection
        }
      ],
      markers: {
        size: 0, // Hide markers for projection lines
      },
      stroke: {
        width: [4, 4, 4], // Set stroke width for each series
        dashArray: [0, 5, 5], // Solid line for actual data, dotted lines for projections
        curve: "smooth",
      },
      colors: ['#008FFB', '#00E396', '#FF4560'],
      dataLabels: {
        enabled: false
      },
      title: { text: ticker.toUpperCase() + " (5min) Gamma Exposure Overlay with Expected Move Projection"},
      xaxis: {
          type: 'datetime',
          tickPlacement: 'on'
      },
      yaxis: [{
          title: {
              text: 'Price',
          },
          forceNiceScale: true,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2);
            },
          },
      }],
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

    $("#gammaChartOverlay").removeClass("d-none")
    $("#gammaChartOverlay").empty()
    
    if (this.chartGEXOverlay != null) this.chartGEXOverlay.destroy();
    this.chartGEXOverlay = new ApexCharts(document.querySelector("#gammaChartOverlay"), options);
    this.chartGEXOverlay.render();
  }
  
  
} // end class
