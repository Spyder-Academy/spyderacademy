class TradeSocial {

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
        this.snapshotGexData = null

        this.tradesCollection = this.firestore_db.collection("trades");

        this.authenticatedMember = null;
        // this.getAuthenticatedMemberDetails();


        this.red = "#ff3131";
        this.green = "#00bf63";
        this.yellow = "#ffde59";


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
              console.log("User is not logged in");
          }
      });
    }

    async getMemberDetails(handle){

      if (handle){
        var url = `https://us-central1-spyder-academy.cloudfunctions.net/user/?handle=${handle}`;

        try {
          let response = await $.ajax({url: url, method: 'GET'});
            
          return response;
        }
        catch (error) {
          console.error('Error fetching data from API:', url, error);
        }
      }
      else{
        console.log("no handle for get member provided")
        return {}
      }
    }


    async getMemberTrades(handle) {
      const cacheKey = `trades_${handle}`;
      const cacheExpiryKey = `${cacheKey}_expiry`;
  
      // Check if trades are in local storage and not expired
      const cachedTrades = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(cacheExpiryKey);
  
      if (cachedTrades && cacheExpiry) {
          const now = new Date().getTime();
          if (now < cacheExpiry) {
              console.log('Returning cached trades');
              return JSON.parse(cachedTrades).map(trade => TradeRecord.from_dict(trade["trade_id"], trade));
          } else {
              // Remove expired cache
              localStorage.removeItem(cacheKey);
              localStorage.removeItem(cacheExpiryKey);
          }
      }
  
      // If not cached or expired, fetch from API
      let url = `https://us-central1-spyder-academy.cloudfunctions.net/user_trades/`;
      if (handle) {
          url = `https://us-central1-spyder-academy.cloudfunctions.net/user_trades/?handle=${handle}`;
      }
  
      try {
          let response = await $.ajax({ url: url, method: 'GET' });
          if (response && response.length > 0) {
              // Store trades in local storage
              localStorage.setItem(cacheKey, JSON.stringify(response));
              // Set cache expiry time (60 minutes from now)
              const expiryTime = new Date().getTime() + 60 * 60 * 1000;
              localStorage.setItem(cacheExpiryKey, expiryTime);
  
              let tradeRecords = response.map(trade => TradeRecord.from_dict(trade["trade_id"], trade));
              return tradeRecords;
          }
  
          return [];
  
      } catch (error) {
          console.error('Error fetching data from API:', url, error);
          return []; // Return empty array in case of error
      }
  }

  
  

  async renderProfileCard(userData, tradesData) {
    if (userData.handle !== undefined) {
        // Update card background image (banner)
        $("#profile_banner").css('background-image', `url('${userData.banner}')`);

        // Update avatar image
        $("#profile_avatar").attr('src', userData.avatar);

        // Update name and handle
        $("#profile_name").text(userData.name);
        $("#profile_handle").html(`#${userData.handle}`);

        if (this.authenticatedMember !== null && userData.uid === this.authenticatedMember.uid) {
            $("#profile_handle").append($("<span class='edit_profile_btn btn px-1 text-muted'><i class='fa fa-pen'></i></span>").click(() => {
                this.showEditProfileCard();
            }));
        }

        // Render social links
        userData.socials.forEach(obj => {
            for (const [key, value] of Object.entries(obj)) {
                let socialBtn = "";
                switch (key) {
                    case "x":
                      if (value != ""){
                        socialBtn = `<a href="https://www.x.com/${value}" target="_blank" class="btn btn-outline-primary btn-sm m-1"><i class="fab fa-x-twitter"></i></a>`;
                      }
                      break;
                    case "discord":
                      if (value != ""){
                        socialBtn = `<a href="https://www.discord.com/users/${value}" target="_blank" class="btn btn-outline-primary btn-sm m-1"><i class="fab fa-discord"></i></a>`;
                      }
                      break;
                }
                $("#profile_socials").append(socialBtn);
            }
        });

        if (userData.badges.length > 0) {
            this.renderBadges(userData.badges);
            $("#profile_badges_row").removeClass("d-none");
        }

        $("#user_profile_card").removeClass("d-none");
    }

    this.renderStats(tradesData);
  }

  renderBadges(badges) {
      badges.forEach(obj => {
          for (const [key, value] of Object.entries(obj)) {
              $("#profile_badges").append(`<div class="col-3"><img src="/images/badges/badge_${key}.png" class="rounded-circle img-fluid" /></div>`);
          }
      });
  }

  renderStats(tradesData) {
      const numTrades = tradesData.length;
      const numWins = tradesData.filter(tradeEntry => tradeEntry.gainsValue >= 0).length;
      const numLosses = tradesData.filter(tradeEntry => tradeEntry.gainsValue < 0).length;
      const totalGains = tradesData.reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);
      const numBags = tradesData.filter(tradeEntry => tradeEntry.gainsValue >= 100).length;

      const totalGainsFromWins = tradesData
          .filter(tradeEntry => tradeEntry.gainsValue >= 0)
          .reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);

      const totalLossFromLosses = tradesData
          .filter(tradeEntry => tradeEntry.gainsValue < 0)
          .reduce((acc, tradeEntry) => acc + tradeEntry.gainsValue, 0);

      const profitFactor = (numWins / numLosses).toFixed(1);

      const avgGain = numTrades > 0 ? `${Math.round(totalGains / numTrades)}%` : "-";
      const avgLoss = numLosses > 0 ? Math.round(totalLossFromLosses / numLosses).toFixed(0) : "-";
      const avgWin = numWins > 0 ? Math.round(totalGainsFromWins / numWins).toFixed(0) : "-";

      const winRate = numTrades > 0 ? `${Math.round((numWins / numTrades) * 100)}%` : '-';
      const winFactor = numLosses > 0 ? profitFactor : "-";

      $("#winRate").text(winRate);
      $("#avgGain").text(avgGain);
      $('#numTrades').text(numTrades);
      $("#profitFactor").text(numBags);

      if (avgLoss !== "-" && avgWin !== "-") {
          if (Math.abs(avgLoss) > Math.abs(avgWin)) {
              this.addRecommendation(`Your avg loss (${Math.abs(avgLoss)}%) is greater than your avg win (${avgWin}%). Try cutting losers earlier.`, $("#chart_wins_losses"));
          } else {
              this.addRecommendation(`Nice! Your avg loss (${Math.abs(avgLoss)}%) is lower than your avg win (${avgWin}%).`, $("#chart_wins_losses"));
          }
      }
  }

  async showEditProfileCard() {
    console.log("show edit profile card");

    // Show the modal
    $("#editProfileModal").modal("show");

    // Prepopulate values
    $("#editProfileName").val(this.authenticatedMember.name.toUpperCase());
    $("#editProfileHandle").val(this.authenticatedMember.handle.toLowerCase());
    $("#editProfileBanner").attr("src", this.authenticatedMember.banner);
    $("#editProfileAvatar").attr("src", this.authenticatedMember.avatar);

    if (this.authenticatedMember.discoverable == true){
      $("#btnDiscoverable").attr("checked", "checked");
      $("#discoverabilityStatus").text("Your profile can be discovered and followed.")
    }
    else{
      $("#btnPrivate").attr("checked", "checked");
      $("#discoverabilityStatus").text("Your profile is currently private.")
    }

    // Update discoverability status in Firestore when toggled
    $(".btn-check[name='btnDiscoverability']").on('change', async () => {
      const discoverable = $("#btnDiscoverable").is(":checked");

      try {
          await firebase.firestore().collection('users')
              .doc(this.authenticatedMember.uid)
              .update({
                  discoverable: discoverable
              });
          console.log("Discoverability updated successfully");

          // Update status text
          if (discoverable) {
              $("#discoverabilityStatus").text("Your profile can be discovered and followed.");
          } else {
              $("#discoverabilityStatus").text("Your profile is currently private.");
          }
      } catch (error) {
          console.error("Error updating discoverability:", error);
      }
    });


    this.authenticatedMember.socials.forEach(obj => {
        for (const [key, value] of Object.entries(obj)) {
            switch (key) {
                case "x":
                    $("#editSocialTwitter").val(value);
                    break;
                case "discord":
                    $("#editSocialDiscord").val(value);
                    break;
            }
        }
    });

    const MAX_FILE_SIZE_MB = 0.5; // Set maximum file size in MB
    const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes


    // Remove previous event listeners to prevent multiple bindings
    $('#profileAvatarInput').off('change').on('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          if (file.size > MAX_FILE_SIZE) {
            $("#validationErrors").text(`Avatar file size should not exceed ${MAX_FILE_SIZE_MB} MB.`);
            $('#profileAvatarInput').val(""); // Clear the file input
            return;
          }

            const reader = new FileReader();
            reader.onload = (e) => {
                $('#editProfileAvatar').attr("src", e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $('#profileBannerInput').off('change').on('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
              $("#validationErrors").text(`Banner file size should not exceed ${MAX_FILE_SIZE_MB} MB.`);
              $('#profileBannerInput').val(""); // Clear the file input
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                $('#editProfileBanner').attr("src", e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Save changes
    $("#saveProfileChanges").off('click').on('click', async () => {
        const avatar = $("#editProfileAvatar").attr("src");
        const banner = $("#editProfileBanner").attr("src");
        const name = $("#editProfileName").val();
        const handle = $("#editProfileHandle").val();
        const x = $("#editSocialTwitter").val().toLowerCase().replace("https://x.com/", "");
        const discord = $("#editSocialDiscord").val().toLowerCase();

        try {
            // Update Firebase with the new profile information
            await firebase.firestore().collection('users')
                .doc(this.authenticatedMember.uid)
                .update({
                    banner: banner,
                    avatar: avatar,
                    handle: handle,
                    name: name,
                    avatar: avatar,
                    banner: banner,
                    socials: [
                        { x: x, discord: discord }
                    ]
                });
            console.log("Profile updated successfully");

            // Close the modal after saving
            $("#editProfileModal").modal("hide");

            // Refresh the Profile Page
            window.location = "/profile"

        } catch (error) {
            console.error("Error updating profile:", error);
        }
    });
  }




    async renderDayOfTheWeekRadar(tradesData){
        if (tradesData.length == 0){
          return
        }

        // Calculate the win percentages by the day of the week
        var winPercentages = [0, 0, 0, 0, 0]; // Initialize an array to hold the win percentages for each weekday (Monday to Friday)
        var totalTradesByDay = [0, 0, 0, 0, 0]; // Initialize an array to hold the total trades for each weekday

        // Iterate through each trade
        tradesData.forEach(function(trade) {
            var exitDate = new Date(trade.exit_date_max);
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
          colors: [this.green],
          markers: {
            size: 4,
            colors: ['#fff'],
            strokeColor: this.green,
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
        // if (this.tradeGainsDOWRadar != null) this.tradeGainsDOWRadar.destroy();
        var tradeGainsDOWRadar = new ApexCharts(document.querySelector("#chartGainsDOWRadar"), radarChartOptions);
        tradeGainsDOWRadar.render();
        
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
        
        this.addRecommendation(`${weakestDayOfWeek} is your weakest day of the week.  Consider trading lighter on ${weakestDayOfWeek}s.`, $("#chart_daily_radar"))


        
    }

    async renderDrawDownsChart(tradesData){

      if (tradesData.length == 0){
        return
      }

      // Categorize drawdowns
      var drawdownWinCategories = {
        "0%": 0,
        "1-10%": 0,
        "11-20%": 0,
        "21-30%": 0,
        "31-40%": 0,
        "41-50%": 0,
        "51%+": 0,
        // Add more categories here...
      };

      var drawdownLossCategories = {
        "0%": 0,
        "1-10%": 0,
        "11-20%": 0,
        "21-30%": 0,
        "31-40%": 0,
        "41-50%": 0,
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
          } else if (drawdown < -30  && drawdown >= -40) {
            drawdownWinCategories["31-40%"]++;
          } else if (drawdown < -40  && drawdown >= -50) {
            drawdownWinCategories["41-50%"]++;
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
          } else if (drawdown < -30  && drawdown >= -40) {
            drawdownLossCategories["31-40%"]++;
          } else if (drawdown < -40  && drawdown >= -50) {
            drawdownLossCategories["41-50%"]++;
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
            name: 'Trades that went green (from red)',
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
        colors: [ this.green, this.red],
      };


      // Render the bar chart
      // if (this.chartDrawdowns != null) this.chartDrawdowns.destroy();

      var chartDrawdowns = new ApexCharts(document.querySelector("#chartDrawdowns"), chartData);
      chartDrawdowns.render();

      // Generate a recommendation based on the data
      var recommendedStop = '';
      var maxCategory = '';

      // Find the most common drawdown category before a trade goes green
      maxCategory = Object.keys(drawdownWinCategories).reduce((a, b) => drawdownLossCategories[a] > drawdownWinCategories[b] ? a : b);

      // Set the recommendation based on the most common category
      if (maxCategory === "0%") {
        recommendedStop = "Consider setting your stop-loss close to your entry point, as most winning trades didn't experience a significant drawdown.";
      } else if (maxCategory === "1-10%") {
        recommendedStop = "Consider setting your stop-loss within the 1-10% drawdown range, as this is where most trades recovered.";
      } else if (maxCategory === "11-20%") {
        recommendedStop = "Consider setting your stop-loss within the 11-20% drawdown range, as many trades recovered within this range.";
      } else if (maxCategory === "21-30%") {
        recommendedStop = "Consider setting your stop-loss within the 21-30% drawdown range, as some trades recovered within this range.";
      } else if (maxCategory === "31-40%") {
        recommendedStop = "Consider setting your stop-loss within the 31-40% drawdown range, as only a few trades recovered from this deep of a drawdown.";
      } else if (maxCategory === "41-50%") {
        recommendedStop = "Consider setting your stop-loss within the 41-50% drawdown range, as only a few trades recovered from this deep of a drawdown.";
      } else if (maxCategory === "51%+") {
        recommendedStop = "Consider setting your stop-loss before reaching a 51% drawdown, as very few trades recover from such a large loss.";
      }

      // Display the recommendation
      this.addRecommendation(recommendedStop, $("#chart_drawdown_turnaround"))
    }


    async renderHeatmap(trades, seriesData){

        var calendarRow = $("<div class='row'></div>")
        var calendarHeader = $("<div class='col-10'><h2 class='text-uppercase p-3'>" + "DAILY CALENDAR" + "</h2></div>")
        calendarRow.append(calendarHeader);
        $('#tradeHeatmap').append(calendarRow);

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
                    color: this.red
                  },
                  {
                    from: 0,
                    to: 0,
                    name: 'Even Day',
                    color: this.yellow
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
                    color: this.green
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
            self.renderTradeRecap(trades, selectedDate);
        });
      
        this.chartHeatmap.render();
    }


    isDataExpired(timestamp) {
      const now = new Date().getTime();
      return now - timestamp > 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    }

    // async renderTrims(trades) {
    //   var self = this;
    //   var upsideTradeData = [];
    //   var downsideTradeData = [];

    //   var tradeMaxLoss = [];
    //   var exitPriceCache = {}; // In-memory cache for exit prices

    //   for (const trade of trades) {
    //     var tradeId = trade.tradeid;
    //     var entryPrice = trade.entry_price;
    
    //     var exitsRef = this.tradesCollection.doc(tradeId).collection("exits");
    
    //     if (trade.exit_price_max != null)
    //     {
    //       try {

    //         // Check if exit prices are already cached for this trade
    //         var exitPrices = null;
    //         let cachedData = localStorage.getItem(tradeId);
    //         if (cachedData) {
    //           cachedData = JSON.parse(cachedData);
    //           if (!self.isDataExpired(cachedData.timestamp)) {
    //             // Use cached data if it's still valid
    //             exitPrices = cachedData.exitPrices;
    //           } else {
    //             // Fetch exit prices from Firebase and update the cache
    //             const querySnapshot = await exitsRef.get();
    //             exitPrices = querySnapshot.docs.map(doc => doc.data()["price"]).sort();
                
    //             const cachedData = { exitPrices: exitPrices, timestamp: new Date().getTime() };
    //             localStorage.setItem(tradeId, JSON.stringify(cachedData));
    //           }
    //         } else {
    //           // Fetch exit prices from Firebase and cache them with timestamp
    //           const querySnapshot = await exitsRef.get();
    //           exitPrices = querySnapshot.docs.map(doc => doc.data()["price"]).sort();
              
    //           const cachedData = { exitPrices: exitPrices, timestamp: new Date().getTime() };
    //           localStorage.setItem(tradeId, JSON.stringify(cachedData));
    //         }

    //         // console.log(exitPrices)
            
    //         // Calculate statistics for the trade
    //         const percentageGainLoss = exitPrices.map(trimPrice => Math.round(((trimPrice - entryPrice) / entryPrice * 100)));

    //         // Add value 0 to the dataset
    //         percentageGainLoss.push(0);

    //         const sortedValues = percentageGainLoss.slice().sort((a, b) => a - b);

    //         // len will always be 2+ (since one real trim, and we injected a 0)
    //         const len = sortedValues.length;
            
    //         const q1Val =  sortedValues[1] // second trim
    //         const medianVal =  sortedValues[Math.ceil((len - 1)/2)]; // middle trim
    //         const q3Val =  len > 2 ? sortedValues[len - 2] : sortedValues[len - 1] // second to last trim, or last if only one trim
            
    //         var minVal =  (sortedValues[0]);
    //         var maxVal =  (sortedValues[len - 1]);

    //         if (maxVal == 0){
    //           maxVal = 0.001
    //         }
      
    //         var keyValue = trade.username + " " + trade.ticker + " " + trade.strike

    //         upsideTradeData.push(
    //           {
    //             x: keyValue,
    //             y: maxVal,
    //             goals: [
    //               {
    //                   name: "First Trim",
    //                   value: sortedValues[1],
    //                   strokeWidth: 2,
    //                   strokeColor: '#775DD0',
    //               }
    //             ]
    //           });
           
    //         downsideTradeData.push(
    //           {
    //             x: keyValue,
    //             y: minVal
    //           });


           

    //       } catch (error) {
    //         console.error("Error fetching exit data for trade:", tradeId, error);
    //       }
    //     }
    //   }

    //   console.log(upsideTradeData)


    //   var options = {
    //     series: [
    //       {
    //         name: 'Max Trim',
    //         data: upsideTradeData
    //       },
    //       {
    //         name: 'Downside Trims',
    //         data: downsideTradeData
    //       }
    //     ],
    //     chart: {
    //       height: 400,
    //       type: 'bar',
    //       stacked: true,
    //       toolbar: false,
    //     },
    //     xaxis: {
    //       title: {
    //         text: "Trim Percentage"
    //       }
    //     },
    //     yaxis: {
    //       min: -100,
    //     },
    //     plotOptions: {
    //       bar: {
    //         horizontal: true,
    //       }
    //     },
    //     colors: [this.green, this.red],
    //     dataLabels: {
    //     enabled: false
    //     },
    //     tooltip: {
    //       shared: false,
    //       x: {
    //         formatter: function (val) {
    //           return val
    //         }
    //       },
    //       y: {
    //         formatter: function (val) {
    //           return Math.abs(val) + "%"
    //         }
    //       }
    //     },
    //     legend: {
    //       show: false,
    //       showForSingleSeries: true,
    //       customLegendItems: ['Max Trim', 'First Trim'],
    //       markers: {
    //         fillColors: [this.green, this.red]
    //       }
    //     }
    //   };
    
    //   if (this.chartTrims != null) {
    //     this.chartTrims.destroy();
    //   }
    
    //   this.chartTrims = new ApexCharts(document.querySelector("#tradeTrims"), options);
    //   this.chartTrims.render();
    // }
    

    async addRecommendation(notes, parentEl = null){
      const addRecs = true //firebase.auth().currentUser
      if (addRecs){
        var newItem = $(".ai-template").clone()
        newItem.text(notes)
        newItem.removeClass("d-none")
        newItem.removeClass("ai-template")
        
        $("#aiRecommendations").append(newItem);

        if (parentEl != null){
          var lineItem = $(".ai-template").clone()
          lineItem.text("✨ " + notes)
          lineItem.removeClass("d-none")
          lineItem.removeClass("ai-template")

          parentEl.append(lineItem)
        }
      }
    }

    async renderCalendar(tradesData) {
      // Create a map to store the count of winners and losers for each date
      var self = this;
      var seriesData = {};

      if (tradesData.length == 0){
        return
      }
  
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
      tradesData.forEach(tradeEntry => {
          var isWinner = tradeEntry.gainsValue >= 0;
          var isLoser = tradeEntry.gainsValue < 0;

          if (tradeEntry.exit_date_max != null)
          {
            // Extract the month, date, and year from the exit date
            var exit_date = (new Date(tradeEntry.exit_date_max))
            var month = exit_date.getMonth(); //toLocaleString('default', { month: 'short' });
            var year = exit_date.getFullYear();
            var date = exit_date.getDate();
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
      

      this.renderHeatmap(tradesData, series);
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

        // TODO: Move this to the API
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
                    var actionButtons = $("<p>")
                    actionButtons.append("<a class='secondary' href='#' onclick='showNewTradeExecution(\"" + tradeEntry.tradeid + "\", \"" + tradeEntry.ticker.toUpperCase() + " " + tradeEntry.strike.toUpperCase() + "\");'>" + "<i class='fas fa-plus'></i> Exit Trade" + "</a>");
                    actionButtons.append("<span>  |  </span");
                    actionButtons.append("<a class='secondary' href='#' onclick='deleteTrade(\"" + tradeEntry.tradeid + "\");'>" + "<i class='fas fa-trash'></i> Delete Trade" + "</a>");

                    entryNotesEl.append(actionButtons)
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

    renderTradeDetails(tradeid) {

      // Show the card by adding the 'show' class
      $('#contractDetailsCard').addClass('show');
      $('#contractDetailsCard').removeClass('d-none');

      var tvChartEl = $(".tvChartHeader")[0]
      $(".contract_banner").hide()
      $(".tvChartHeader").empty()
      $(".entryExitNotes").hide()

      
  
      var chart = LightweightCharts.createChart(tvChartEl, {
          height: 300,
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

              chart.timeScale().fitContent();

              var entryNotesEl = $(".entryExitNotes")

              entryExitNotes = entryExitNotes.sort(function(a, b) {
                  return a["date_time"].toDate() - b["date_time"].toDate() 
              });

              tradeRef.get().then((doc) => {
                console.log(doc.id, doc.data())
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

                // fill in the trade details
                var tradeCardRow = $('#contractDetailsCard')
                
                tradeCardRow.find(".traderName").text(tradeEntry.username + " - " + moment(tradeEntry.entry_date.toDate()).fromNow())
                tradeCardRow.find(".tradeContract").text(tradeEntry.ticker + " " + tradeEntry.strike + " " + tradeEntry.expiration)
                tradeCardRow.find(".tradeGain").text(tradeEntry.gainsString)
                tradeCardRow.find(".tradeNotes").text(tradeEntry.notes)
                var stock_image = "/images/logos/" + tradeEntry.ticker.toUpperCase() + ".png"
                tradeCardRow.find(".tradeLogo").attr("src", stock_image)
                tradeCardRow.find(".contract_banner").show()

                if (tradeEntry.gainsValue < 0){
                  tradeCardRow.find(".trade_card").removeClass("gradient-green")
                  tradeCardRow.find(".trade_card").addClass("gradient-red")
                }
                else if (tradeEntry.gainsValue >= 0){
                  tradeCardRow.find(".trade_card").addClass("gradient-green")
                  tradeCardRow.find(".trade_card").removeClass("gradient-red")
                }
            
                $(".entryExitNotes").show()
                
              });
          });
      })
  }
    


    renderWinsVsLossesChart(tradesData) {

      if (tradesData.length == 0){
        return
      }
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
        colors: [ this.green, this.red],
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
      // if (this.chartWinsVsLosses != null) this.chartWinsVsLosses.destroy();
      var chartWinsVsLosses = new ApexCharts(document.querySelector("#chartWinsVsLosses"), chartData);
      chartWinsVsLosses.render();
    }

    async renderScoreboard(tradesData){
      $('#tradeScoreboard').empty()

      if (tradesData.length == 0){
        return
      }

      var scoreboardRow = $("<div class='row'></div>")
      var scoreboardHeader = $("<div class='col-10'><h2 class='text-uppercase p-3'>" + "TOP WINNERS" + "</h2></div>")
      scoreboardRow.append(scoreboardHeader);
      $('#tradeScoreboard').append(scoreboardRow);

      
      var tradeCard = $('.trade-card-template');

      // Create a copy of the array before sorting
      var tradesDataCopy = [...tradesData];

      // Fix sorting logic
      tradesDataCopy.sort((a, b) => b.gainsValue - a.gainsValue);
                          
      // filter out Mr Woofers (958441217073483800) and Link (693307698229280818) from the Leaderboard
      tradesDataCopy = tradesDataCopy.filter(tradeEntry => ![958441217073483800, 693307698229280818].includes(tradeEntry.userid));

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
          tradeCardRow.find(".traderName").text(trade.username + " on " + (new Date(trade.exit_date_max)).toLocaleDateString())
          tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike + " " + trade.expiration)
          tradeCardRow.find(".tradeGain").text(trade.gainsString)
          tradeCardRow.find(".tradeNotes").text(trade.notes)

          var king_image = "/images/logos/" + trade.ticker.toUpperCase() + ".png"
          tradeCardRow.find(".tradeLogo").attr("src", king_image)
          tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)

          $('#tradeScoreboard').append(tradeCardRow);
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
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike + " " + trade.expiration)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)

            var king_image = "/images/logos/" + trade.ticker.toUpperCase() + ".png"
            tradeCardRow.find(".tradeLogo").attr("src", king_image)
            tradeCardRow.find(".tradeLogo").attr("alt", trade.ticker.toUpperCase())
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)
            tradeCardRow.find(".tradeRow").removeAttr("onclick")
            tradeCardRow.find(".stockLink").attr("href", "/stocks/" + trade.ticker.toLowerCase() + "/")
            tradeCardRow.find(".stockLink").attr("title", trade.ticker + " | Stock and Overview")

            $(parentElement).append(tradeCardRow);
        });
      });
    }

    async renderTradeRecap(trades, recap_date) {
        $('#tradeRecap').empty();
        $("#memberTrades").show();
    
        recap_date = recap_date.toDateString() + " 00:00:00 (UTC -4)";
        var date = new Date(recap_date);
        var formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
        // Create the header row with flexbox classes for alignment
        var recapRow = $("<div class='row d-flex align-items-center justify-content-between'></div>");
        
        // Date header on the left
        var recapHeader = $("<div class='col'><h2 class='text-left text-uppercase text-nowrap p-3 m-0'>" + formattedDate + "</h2></div>");
        recapRow.append(recapHeader);
    
        // Buttons on the right (conditionally rendered if isUserMode)
        var isUserMode = false;//window.location.hash.substring(1) == ""; // Are we looking at our own profile (which means no handle in the url)
        if (isUserMode) {
          var buttons = $("<div class='col-sm-12 col-lg-auto text-center'></div>");
          var addTradeButton = $("<button class='btn gradient-green m-1 lg-rounded text-white text-uppercase' title='Share Trade Idea'>Share a Trade Idea</button>");
          
          // Use an arrow function to correctly bind `this` to the TradePlanner instance
          addTradeButton.on('click', () => {
              this.showManualTradeModal();
          });
      
          buttons.append(addTradeButton);
          recapRow.append(buttons);
        }
    
        $('#tradeRecap').append(recapRow);

    
        // Filter trades by recap_date or open trades (where exit_date_max is null)
        var filteredTrades = trades.filter(function(trade) {
          var exitDate = trade.exit_date_max ? new Date(trade.exit_date_max) : null;
          var entryDate = trade.entry_date ? new Date(trade.entry_date).setHours(0, 0, 0, 0) : null;

          // Compare dates, accounting for timezones
          var exitedToday = exitDate && exitDate.toDateString() === new Date(recap_date).toDateString();
          var stillOpen = exitDate === null && entryDate <= (new Date(recap_date)).setHours(23, 59, 59, 999)

          return exitedToday || stillOpen
        });


        var tradeCard = $('.trade-card-template');
        
        // Create table rows for each trade
        filteredTrades.forEach(function(trade) {
            var tradeCardRow = tradeCard.clone()
            tradeCardRow.removeClass("d-none")
            tradeCardRow.removeClass("template")
            tradeCardRow.removeClass("trade-card-template")
            tradeCardRow.find(".traderName").text(trade.username + " - " + moment(new Date(trade.entry_date)).fromNow())
            tradeCardRow.find(".tradeContract").text(trade.ticker + " " + trade.strike + " " + trade.expiration)
            tradeCardRow.find(".tradeGain").text(trade.gainsString)
            tradeCardRow.find(".tradeNotes").text(trade.notes)
            tradeCardRow.find(".tradeLogo").attr("src", "/images/logos/" + trade.ticker.toUpperCase() + ".png")
            tradeCardRow.find(".tradeRow").attr("tradeid", trade.tradeid)
            
            if (trade.gainsValue < 0){
              tradeCardRow.find(".trade_card").removeClass("gradient-green")
              tradeCardRow.find(".trade_card").addClass("gradient-red")
            }

            $('#tradeRecap').append(tradeCardRow);
        });

        if (filteredTrades.length == 0){
          // no trades taken
          var tradeCardRow = tradeCard.clone()
          tradeCardRow.removeClass("d-none")
          tradeCardRow.removeClass("template")
          tradeCardRow.removeClass("trade-card-template")
          tradeCardRow.find(".card").removeClass("gradient-green")

          tradeCardRow.find(".traderName").text(" - ")
          tradeCardRow.find(".tradeContract").text("NO TRADES POSTED")
          tradeCardRow.find(".tradeGain").text(" ")
          tradeCardRow.find(".tradeNotes").text("Did Not Post a Trade Today")
          tradeCardRow.find(".tradeLogo").attr("src", "/images/logos/SPDR.png")
          tradeCardRow.find(".tradeRow").attr("tradeid", "")
          tradeCardRow.find(".tradeRow").removeAttr("onclick")


          $('#tradeRecap').append(tradeCardRow);
        }

    
    }

    showManualTradeModal(){
      // Show the modal
      $("#postTradeModal").modal("show");
      
      // Attach event listener for input changes
      $('#txtInCommand').off('input').on('input', (event) => {
        const command = $(event.target).val();
        const parsedData = this.parseEntryCommand(command);

        // Update the modal with the parsed data
        if (tickers.includes(parsedData.symbol.toUpperCase())){
          $("#parsedTradeLogo").attr("src", "/images/logos/" + parsedData.symbol.toUpperCase() + ".png")
        }
        else{
          $("#parsedTradeLogo").attr("src", "/images/logos/SPDR.png")
        }
        
        $('#parsedTraderName').text(this.authenticatedMember.name);
        $('#parsedSymbol').text(parsedData.symbol || 'SYMBOL');
        $('#parsedOption').text(parsedData.option || 'STRIKE');
        $('#parsedPrice').text(parsedData.price || 'PRICE');
        $('#parsedExpiration').text(parsedData.expiration || 'EXP');
        $('#parsedNotes').text(parsedData.notes || 'NOTES');

        if (!parsedData.symbol){
          $('#parsedSymbol').addClass('text-danger');
        }
        else{
          $('#parsedSymbol').removeClass('text-danger');
        }
        
        if (!parsedData.option){
          $('#parsedOption').addClass('text-danger');
        }
        else{
          $('#parsedOption').removeClass('text-danger');
        }
        
        if (!parsedData.price){
          $('#parsedPrice').addClass('text-danger');
        }
        else{
          $('#parsedPrice').removeClass('text-danger');
        }

        if (!parsedData.expiration){
          $('#parsedExpiration').addClass('text-danger');
        }
        else{
          $('#parsedExpiration').removeClass('text-danger');
        }

      });

      // Ensure the form is reset
      $('#postTradeModal').on('hidden.bs.modal', () => {
        $('#txtInCommand').val('');
        $('#parsedTraderName').text(this.authenticatedMember.name);
        $("#parsedTradeLogo").attr("src", "/images/logos/SPDR.png")
        $('#parsedSymbol').text('SYMBOL');
        $('#parsedOption').text('STRIKE');
        $('#parsedPrice').text('PRICE');
        $('#parsedExpiration').text('EXP');
        $('#parsedNotes').text('NOTES');
      });

      $('#saveTrade').off('click').on('click', () => {
        this.handleSaveTrade();
      });

    }

    parseEntryCommand(command) {
        const symbolPattern = /(\w+)/;
        const optionPattern = /([\d.]+[cpCP]|LONG|SHORT|long|short)/;
        const pricePattern = /(@|at|AT) ([\d\.]+)/i;
        const expirationPattern = /\d+\/\d+/;
        const notesPattern = /(@|at|AT) [\d\.]+ (.+)/i;

        const symbolMatch = symbolPattern.exec(command);
        const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : '';

        const optionMatch = optionPattern.exec(command);
        const option = optionMatch ? optionMatch[1].toUpperCase() : '';

        const priceMatch = pricePattern.exec(command);
        const price = priceMatch ? parseFloat(priceMatch[2]).toFixed(2) : '';

        const expirationMatch = expirationPattern.exec(command);
        let expiration = expirationMatch ? expirationMatch[0] : '';
        
        // Set expiration logic
        const today = new Date();
        const friday = new Date(today);
        friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7)); // Find next Friday

        const todayStr = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        const fridayStr = friday.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });


        if (!expiration) {
            if (["SPY", "SPX", "QQQ"].includes(symbol)) {
                expiration = todayStr;
            } else if (["ES", "MES", "NQ", "MNQ", "RTY", "MCL"].includes(symbol)) {
                expiration = "";
            } else {
                expiration = fridayStr;
            }
        } else {
            // Ensure expiration is in MM/DD format
            const expirationParts = expiration.split('/');
            if (expirationParts.length === 2) {
                expiration = expirationParts.join('/'); // MM/DD format
            }
        }

        const notesMatch = notesPattern.exec(command);
        const notes = notesMatch ? notesMatch[2].trim().replace(expiration, '').replace(expirationMatch, "").replace("exp", "") : '';

        return { symbol, option, price, expiration, notes };
    }

    handleSaveTrade(){
      const command = $('#txtInCommand').val();
      const parsedData = this.parseEntryCommand(command);

      if (parsedData.symbol && parsedData.option && parsedData.price) {
        this.submitTrade(
            parsedData.symbol,
            parsedData.option,
            parsedData.price,
            parsedData.expiration,
            parsedData.notes
        );
      } else {
          if (!parsedData.symbol){
            $('#tradeErrorMessage').text('Please enter a valid symbol.').show();
          }
          else if (!parsedData.option){
            $('#tradeErrorMessage').text('Please enter a valid strike price.').show();
          }
          else if (!parsedData.price){
            $('#tradeErrorMessage').text('Please enter a valid entry price.').show();
          }
          else if (!parsedData.expiration){
            $('#tradeErrorMessage').text('Please enter a valid expiration.').show();
          }
          else{
            $('#tradeErrorMessage').text('Please complete all required fields.').show();
          }
      }
    }


    submitTrade(symbol, strike, price, expiration, notes) {

      // save the trade to firebase
      const tradeEntry = {
       "entry_date": new Date(),
       "entry_price":  parseFloat(price),
       "exit_date_max": null,
       "exit_price_max": null,
       "expiration": expiration,
       "notes": notes,
       "strike": strike,
       "ticker": symbol.toUpperCase(),
       "uid": this.authenticatedMember.uid,
       "userid": this.authenticatedMember.handle,
       "username": this.authenticatedMember.name
      }

      console.log("save trade", tradeEntry)

      // Add the trade entry to Firestore
      this.firestore_db.collection("trades").add(tradeEntry)
        .then((docRef) => {
            console.log("Trade entry added with ID: ", docRef.id);

            // Add the entries subcollection
            return this.firestore_db.collection("trades").doc(docRef.id).collection("entries").add({
                "date_time": new Date(),
                "notes": notes,
                "price": parseFloat(price),
                "uid": this.authenticatedMember.uid,
      });
        })
        .then(() => {
            console.log("Trade entry added to subcollection.");

            // invalidate the cache
            var cachekey = `trades_${this.authenticatedMember.handle}`
            localStorage.removeItem(cachekey);
            window.location = '/profile/'
            
            // Close the modal
            $("#postTradeModal").modal("hide");
        })
        .catch((error) => {
            console.error("Error adding trade: ", error);
            $('#tradeErrorMessage').text('Failed to post trade. Please try again.').show();
        });


    }
  
    
   
    formatDate(date) {
      // Function to format date as "YYYY-MM-DD"
      var year = "20" + date.slice(0, 2);
      var month = date.slice(2, 4);
      var day = date.slice(4, 6);
      return year + '-' + month + '-' + day;
    }

    // parseEntryCommand(command) {
    //   console.log("parsing", command)

    //   // Define regex patterns to match symbol, option, price, expiration, and notes
    //   const symbolPattern = /(\w+)/;
    //   const optionPattern = /([\d.]+[cpCP]|LONG|SHORT|long|short)/;
    //   const pricePattern = /(@|at|AT) ([\d\.]+)/i;
    //   const expirationPattern = /\d+\/\d+/;
    //   const notesPattern = /(@|at|AT) [\d\.]+ (.+)/i;
    
    //   // Use regex to extract symbol, option, price, expiration, and notes from command
    //   const symbol = command.match(symbolPattern)[1].toUpperCase();
    //   const strike = command.match(optionPattern)[1].toUpperCase();
    //   const price = parseFloat(command.match(pricePattern)[2]);
    
    //   const expirationMatch = command.match(expirationPattern);
    //   const expirationStr = expirationMatch ? expirationMatch[0] : null;
    
    //   const notesMatch = command.match(notesPattern);
    //   const notes = notesMatch ? notesMatch[2].trim() : null;
    
    //   // Parse the expiration date if it is provided, otherwise set it to default
    //   let expiration;
    //   if (expirationStr) {
    //     // Check if expiration_str includes a year
    //     if (expirationStr.split('/').length === 3) {
    //       expiration = new Date(expirationStr.replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3'));
    //     } else {
    //       // Append the current year to the expiration_str
    //       const yearNow = new Date().getFullYear();
    //       const tempDate = new Date(`${expirationStr}/${yearNow}`);
    //       // If the tempDate has already passed, use next year; otherwise, use this year
    //       if (tempDate < new Date()) {
    //         expiration = new Date(`${expirationStr}/${yearNow + 1}`);
    //       } else {
    //         expiration = tempDate;
    //       }
    //     }

    //     expiration = expiration.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"
    //   } else {
    //     const today = new Date();
    //     const todayStr = today.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"
        
    //     const friday = new Date(today.getTime() + (5 - today.getDay()) % 7 * 24 * 60 * 60 * 1000);
    //     friday.setHours(0, 0, 0, 0); // Set the time to 00:00:00 (midnight)
    //     const fridayStr = friday.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"


    //     if (["SPY", "SPX", "QQQ"].includes(symbol)) {
    //       expiration = todayStr;
    //     } else if (["ES", "MES", "NQ", "MNQ", "RTY", "MCL"].includes(symbol)) {
    //       expiration = "";
    //     } else {
    //       expiration = fridayStr;
    //     }
    //   }
    
    //   // Return the parsed values as an array
    //   return {
    //     "symbol": symbol, 
    //     "strike": strike, 
    //     "price": price, 
    //     "expiration": expiration, 
    //     "notes": notes
    //   };
    // }

    // parseExitCommand(command) {
    //   console.log("parsing", command)

    //   const pricePattern = /([\d\.]+)/i;
    //   const notesPattern = /[\d\.]+ (.+)/i;

    //   const price = parseFloat(command.match(pricePattern)[1]);
    //   const notesMatch = command.match(notesPattern);
    //   const notes = notesMatch ? notesMatch[1].trim() : null;

    //   return {
    //     "price": price, 
    //     "notes": notes
    //   };
    // }

    // addManualTrade(){
    //   if (this.userLoggedIn && this.userMode){
    //     var tradeEntryCommand = $("#txtInCommand").val()
    //     var objTrade = this.parseEntryCommand(tradeEntryCommand)
    //     console.log(objTrade)

    //     var email = firebase.auth().currentUser.email
    //     var userid = firebase.auth().currentUser.uid

    //     // Create a new entry in the database for this user's trade
    //     var userDocRef = this.firestore_db.collection("users").doc(email);
    //     var tradesCollection = userDocRef.collection('trades');

    //     // Define the data to be saved
    //     var tradeData = {
    //         "entry_date": new Date(),
    //         // "num_contracts": tradeNumCons,
    //         "entry_price": objTrade.price,
    //         "exit_date_max": null,
    //         "exit_price_max": null,
    //         "expiration": objTrade.expiration,
    //         "notes": objTrade.notes,
    //         "strike": objTrade.strike,
    //         "ticker": objTrade.symbol,
    //         "userid": userid,
    //         "username": email,
    //     };

    //     // create the entry record also
    //     var entryData = {
    //       "date_time": tradeData.entry_date,
    //       "notes": tradeData.notes,
    //       "price": tradeData.entry_price,
    //       // "num_contracts": tradeNumCons
    //     }


    //     // Add a new document to the "trades" subcollection
    //     tradesCollection.add(tradeData)
    //       .then(function(docRef){
    //         var trade_id = docRef.id

    //         // create the trade entry record
    //         tradesCollection.doc(trade_id).collection("entries").add(entryData)

    //         return true;
    //       })
    //   }
    //   else{
    //     $('#tradeErrorMessage').text("User not logged in.");
    //     return false;
    //   }
      
    //   $('#tradeErrorMessage').text("Saving Trade");
    //   return true;
    // }

    async addExecutionTrade() {
      if (this.userLoggedIn && this.userMode) {
          try {
              // Create the trade exit (or average in) trade record
              var tradeID = $("#txtTradeExecutionID").val();

              var objTradeExit = this.parseExitCommand($("#txtOutCommand").val())

              // Create the exit/trim record
              var tradeExitData = {
                  "date_time": new Date(),
                  "notes": objTradeExit.notes,
                  "price": objTradeExit.price,
                  // "num_contracts": tradeNumCons
              }

              console.log("Saving trim for ", tradeID, objTradeExit)

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




  async list_users() {
    // $(".discover_cards").empty();
    var url = `https://us-central1-spyder-academy.cloudfunctions.net/user_recommendations/`;

    try {
        let response = await $.ajax({ url: url, method: 'GET' });
        if (response && response.length > 0) {
            $(".discover_cards").empty();

            // render the users 
            response.forEach(user => {
                // console.log(user)
                // Clone the profile card template
                let profileCard = $(".profile-card-template").clone()
                profileCard.removeClass('d-none');
                profileCard.removeClass('profile-card-template');
                
                // Update card background image (banner)
                profileCard.find(".card-up").css('background-image', `url('${user.banner}')`);

                // Update avatar image
                profileCard.find(".avatar img").attr('src', user.avatar);

                // Update name and handle
                profileCard.find("h5").text(user.name);
                profileCard.find("p.text-white").text("@" + user.handle);

                // Update view/follow links
                profileCard.find(".view_button").attr('href', `/profile/#${user.handle}`).text('VIEW');

                var followingList = this.authenticatedMember["following"];
                var followBtn = profileCard.find(".follow_button")
                console.log(user.uid, followingList, user.uid in followingList)
                if (this.authenticatedMember !== null && followingList.includes(user.uid)){
                  followBtn.click((e) => {
                    e.preventDefault();  
                    this.unfollow_member(`${user.uid}`);
                  });
                  followBtn.text("Following")
                  followBtn.addClass("gradient-green")

                  // Change text to "Unfollow" on hover
                  followBtn.hover(
                      function() {
                          $(this).removeClass("gradient-green");
                          $(this).addClass("btn-danger");
                          $(this).text("Unfollow");
                      },
                      function() {
                          $(this).text("Following");
                          $(this).removeClass("btn-danger");
                          $(this).addClass("gradient-green");
                      }
                  );
                }
                else {
                  followBtn.click((e) => {
                    e.preventDefault();  
                    this.follow_member(`${user.uid}`);
                  });
                  followBtn.text("Follow")
                  followBtn.addClass("btn-warning")
                }

                // Update followers count
                profileCard.find("#numFollowers").text(user.followers.length);

                // You can also update win rate if it's available in the user data
                if (user.stats["win_rate"] != undefined){
                  profileCard.find("#winRate").text(user.stats["win_rate"].toFixed(0) + "%");

                  // display a gold card if the user has a winrate > 80% with over 100 posted trades
                  if (user.stats["win_rate"] > 70 && user.stats["num_trades"] > 100){
                    profileCard.find(".gradient-profile-card").addClass('gold-card');
                  }
              
                }

                // Iterate through each object in the array
                user.badges.forEach(obj => {
                  // Iterate through each key-value pair in the object
                  for (const [key, value] of Object.entries(obj)) {
                      // console.log(`Key: ${key}, Value: ${value}`);
                      profileCard.find(".badges").append($(`<div class="col-3"><img src="/images/badges/badge_${key}.png" class="rounded-circle img-fluid" /></div>`));
                  }
                });

                

                // Append the filled card to the container
                $(".discover_cards").append(profileCard);
            });
        }
    } catch (e) {
        console.log(e);
    }
  }


  async follow_member(uid) {
    try {
        console.log("Authenticated Member", this.authenticatedMember);
        console.log("Follow Member", uid);

        // Add the UID to the following list
        this.authenticatedMember.following.push(uid);

        // Update Firebase with the new following list
        await firebase.firestore().collection('users')
            .doc(this.authenticatedMember.uid)
            .update({
                following: this.authenticatedMember.following
            });

        await this.list_users()

        console.log(`Successfully followed ${uid}`);

    } catch (error) {
        console.error("Error following member:", error);
    }
  }

  async unfollow_member(uid) {
      try {
          console.log("Unfollow Member", uid);

          // Remove the UID from the following list
          this.authenticatedMember.following = this.authenticatedMember.following.filter(followingUid => followingUid !== uid);

          // Update Firebase with the updated following list
          await firebase.firestore().collection('users')
              .doc(this.authenticatedMember.uid)
              .update({
                  following: this.authenticatedMember.following
              });

          await this.list_users()
          console.log(`Successfully unfollowed ${uid}`);

      } catch (error) {
          console.error("Error unfollowing member:", error);
      }
  }


  
  
} // end class