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
                    else{
                        trade.gainsValue = (trade.entry_price - trade.exit_price_max);
                        trade.gainsString = trade.gainsValue.toFixed(0) + " pts"
                    }
                } 
                else {
                    trade.gainsValue = Math.round(((trade.exit_price_max - trade.entry_price) / trade.entry_price) * 100)
                    trade.gainsString = trade.gainsValue.toFixed(0) + "%"
                   
                    if (trade.entry_price == 0){
                      trade.gainsValue = 0
                      trade.gainsString = trade.gainsValue.toFixed(0) + "%"
                    }
                    
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
  