
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

                if (trade.ticker === "ES" || trade.ticker === "MES" || trade.ticker === "MNQ" || trade.ticker === "NQ") {
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

    }

    selectUser(username){
        this.filterByUser = username !== null ? username.toString() : null;
        this.closedTrades = this._getAllClosedTrades();
    }

    updateCharts(){
        this.userLoggedIn = firebase.auth().currentUser;
        this.clearRecommendations();

        this.renderStats();
        this.renderCalendar();
        this.renderGainsBubbleChart();
        this.renderRecap();
        this.renderDrawDowns();
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
            $("#profitFactor").text(winFactor + " (" + numBags + "💰)");

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


            // Calculate rolling average data for average gain chart
            var rollingAvgData = [];
            var rollingSum = 0;
            for (var i = 0; i < tradesData.length; i++) {
                if (i > 20){
                    rollingSum += tradesData[i].gainsValue;
                    var rollingAvg = rollingSum / (i + 1 - 20);
                    rollingAvgData.push(rollingAvg.toFixed(0));
                }
            }

            var avgGainsChartOptions = {
                chart: {
                  id: 'avgGainChart',
                  group: 'sparks',
                  type: 'line',
                  height: 80,
                  sparkline: {
                    enabled: true
                  },
                  dropShadow: {
                    enabled: true,
                    top: 1,
                    left: 1,
                    blur: 2,
                    opacity: 0.2,
                  }
                },
                series: [
                    {
                      name: 'Average Gain',
                      data: rollingAvgData,
                    },
                ],
                stroke: {
                  curve: 'smooth',
                  width: 3,
                },
                markers: {
                  size: 0
                },
                grid: {
                  padding: {
                    top: 10,
                    bottom: 10,
                    left: 65
                  }
                },
                colors: ['#fff'],
                tooltip: {
                  x: {
                    show: false
                  },
                  y: {
                    title: {
                      formatter: function formatter(val) {
                        return val + '%';
                      }
                    }
                  }
                }
              }

            if (this.chartAvgGains != null) this.chartAvgGains.destroy();
            this.chartAvgGains = new ApexCharts(document.querySelector("#avgGainChart"), avgGainsChartOptions);
            this.chartAvgGains.render();
        


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
                    height: 350,
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
              height: 350,
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

        // console.log("Daily Performance", JSON.stringify(seriesData, null, 2));


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

            var selectedDate = new Date(seriesData[selectedSeries].name + " " + selectedIndex + " 2023");
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
      var tradeData = [];
      var tradeMaxLoss = [];
      var exitPriceCache = {}; // In-memory cache for exit prices

      
      for (const trade of trades) {
        var tradeId = trade.tradeid;
        var entryPrice = trade.entry_price;
    
        var exitsRef = this.firestore_db.collection("trades").doc(tradeId).collection("exits");
    
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
            
            const minVal =  (sortedValues[0]);
            var maxVal =  (sortedValues[len - 1]);

            if (maxVal == 0){
              maxVal = 0.001
            }
      
            tradeData.push({
              x: trade.username + " " + trade.ticker + " " + trade.strike,
              y: [minVal, q1Val, medianVal, q3Val, maxVal],
            });

           

          } catch (error) {
            console.error("Error fetching exit data for trade:", tradeId, error);
          }
        }
      }

      var options = {
        title: { text: "TRIM LEVELS"},
        chart: {
          type: "boxPlot",
          height: 400,
          toolbar: {show: false},
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '50%'
          },
          boxPlot: {
            colors: {
              upper: '#e9ecef',
              lower: '#f8f9fa'
            }
          }
        },
        stroke: {
          colors: ['#6c757d']
        },
        series: [
          {
            data: tradeData
          },
        ],
        yaxis: {
          min: -100,
          forceNiceScale: true,
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
        var tradeRef = this.firestore_db.collection("trades").doc(tradeid);
        var candlesRef = this.firestore_db.collection("trades").doc(tradeid).collection("price_history").doc("underlying").collection("candles");
        var optionsRef = this.firestore_db.collection("trades").doc(tradeid).collection("price_history").doc("options_price").collection("candles");
        var entriesRef = this.firestore_db.collection("trades").doc(tradeid).collection("entries");
        var exitsRef = this.firestore_db.collection("trades").doc(tradeid).collection("exits");
    
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
        var self = this;

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
                fillColor: trade.gainsValue < 0 ? '#FF0000' : ( trade.gainsValue >= 100  ? "GOLD"  : "#BFE1CF" )
              })),
            };
            seriesData.push(series);
          }

          let maxYValue = Number.NEGATIVE_INFINITY;
          for (const series of seriesData) {
            for (const dataPoint of series.data) {
              if (dataPoint.y > maxYValue) {
                maxYValue = dataPoint.y;
              }
            }
          }

          // console.log("Gains vs Losses", JSON.stringify(seriesData, null, 2));




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
                        var dateClicked = seriesData[config.seriesIndex].data[config.dataPointIndex].x
                        self.renderRecap(dateClicked)
                    }
                  }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            title: { text: "GAINS vs LOSSES"},
            xaxis: {
                type: 'datetime',
              },
            yaxis: {
                min: -100,
                max: Math.ceil(Math.min(1000, maxYValue) / 100) * 100,
                tickAmount: 20,
                forceNiceScale: false,
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
        
        var recapRow = $("<div class='row'></div>")
 
        var recapHeader = $("<div class='col-10'><h2 class='text-uppercase p-3'>" + formattedDate + "</h2></div>")
        recapRow.append(recapHeader);

        if (this.filterByUser !== null && this.filterByUser.toLowerCase() == this.userLoggedIn.email.toLowerCase()){
          var recapButton = $("<div class='col-2 d-flex justify-content-center align-items-center'><button class='btn btn-primary btn-circle' title='Coming Soon'>+</button></div>")
          recapRow.append(recapButton)
        }

        $('#tradeRecap').append(recapRow);        

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

        this.renderTrims(trades)
    
    }
    
   
    // get the daily recap for today
    renderRecap(dateString = null){
        var self = this;

        if (dateString === null){
            // use today
            dateString = new Date().setHours(0,0,0,0)
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
        // recapDateStart.setHours(recapDateStart.getHours() - 4);

        var recapDateEnd = new Date(recap_date);
        recapDateEnd.setUTCHours(23, 59, 59, 999);
        // recapDateEnd.setHours(recapDateEnd.getHours() - 4);
        var trades_query_filter = trades_query.where("exit_date_max", ">=", new Date(recapDateStart)).where("exit_date_max", "<=", new Date(recapDateEnd));
        // console.log(recapDateEnd)

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





} // end class
