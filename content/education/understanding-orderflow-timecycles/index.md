---
author: "CashMoneyTrades"
title: "Understanding Orderflow and 90m Time Cycles"
date: 2024-06-20T00:00:00-04:00
description: "Learn how to read the chart with 90m Time Cycles and Order Flow to understand how Market Maker algorithms manipulate the market with their algo's."
course: "Trading Strategies"
time: "5 min"
tags:
  - "Strategies"
  - "TradingView"
---


90m Time Cycles are windows of time where the algo's shift with their buy and sell algorithms.  It provides the trader with multiple windows of opportunity throughout the day to determine trend direction and reversals.

## Introducing 90m Cycles

Recently, [@zeussy_mmxm](https://x.com/zeussy_mmxm) has been taking 𝕏 by storm with his concept of 90m Cycles and Order Flow.  

If you havent watched his video on this topic, please watch it before delving into this post.

<div class="d-flex p-5 w-100 justify-content-center align-center">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/mQ6p6V4GhY0?si=EjWZIbWOd5QJSIN_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>


So, now that you have watched the video, let's provide the Spyder Academy take on how we trade these concepts.

#### What are 90m Cycles?

90m Cycles are windows of time where the algo's shift with their buy and sell algorithms.

It is broken down into the following sessions:

**MORNING SESSION**
- 7:00am - 8:30am 
- 8:30am - 10:00am 
- 10:00am - 11:30am 

**AFTERNOON SESSION**
- 11:30am - 1:00pm 
- 1:00pm - 2:30pm
- 2:30pm - 4:00pm

Generally, you will find key data events tend to occur during the boundaries of these sessions.  

For example, 
- 8:30am - We usually get CPI/PPI/Jobs numbers in premarket.  
- 10:00am - We will get data like Home Sales.  
- 11:30am - Treasury Bill auctions occur.
- 1:00pm - Treasury Bond Auctions occur.  
- 2:30pm - Then on FOMC days, the Fed Chair begins his remarks, and most days the Market Makers are returning from the pub and power hour starts where price action becomes volatile again.

Due to these high impactful events, the boundaries of the cycle times occur at key moments where reversals can occur.

Each cycle has **Accumulation**, **Manipulation**, and **Distribution** characteristics, as defined by Wyckoff Market Phases.

![Wyckoff Market Phases](images/wyckoff.jpeg)

In this diagram, you can see the market moves in phases.  

There is **Accumulation** where the market is filling their factories with the stock.  

There may be **Manipulation** where they drop the price below the support level, before ripping upwards.  

Eventually, the market finds a buying climax within the timeframe, and the market will start to **Distribute** (buyers run out, sellers stepping in).  

Again, there may be market **Manipulation** here where there is a failed rally/breakout, before moving lower again.

The time cycles help us see these market phases and identify the key pivot areas for when to get into a trade.

### How do I draw the 90m Cycles?

Using your trading platform (eg TradingView), draw vertical boundaries at each of these time windows (7am, 830am, 10am, 1130am, 1pm, 230pm, 4pm).  That will allow you to see when each 90m cycle starts and ends.

Then, each time a new cycle starts, mark a horizontal line at the high and low of that previous cycle.  This marks your Cycle High (PxH) and Cycle Low (PxL), also known as your **Key Pivot Points**.

With 90m Cycles we usually look at the previous two cycles to make our trading decisions.

A nice advantage of these time cycles is that even if you miss an initial move on a strong trend day, every 90 minutes you have an opportunity to determine where price is likely to move to (continuation/reversal) and determine your trade entry.

![Marking 90m Cycles](images/marking_cycles.png)

### How do I trade these 90m Cycle levels?

Great, now that you have your 90m cycle time boundaries, and you have your highs and lows marked, there are a few ways to trade this.  I personally use the 3 minute chart (5 minute works great too!).  Look for a candle close over the level, followed by a retest or continuation to confirm the move.

#### Continuations

**BREAK HOOK AND GO OFF THE PREVOUS CYCLE HIGH/LOW**

If Price is **Bullish**, Price should find **support** at the previous cycle high after breaking above it.

![Bullish Continuation](images/bullish_continuation.png)

If Price is **Bearish**, Price should find **resistance** at the previous cycle low after breaking below it.

![Bearish Continuation](images/bearish_continuation.png)


#### Reversals

**RECLAIM/BOUNCE OFF THE PREVOUS CYCLE HIGH/LOW**

If Price was **Bullish**, but **does not find support** after breaking above the previous cycle high, then it's a sign that OrderFlow is potentially changing.  A reclaim below the previous cycle high is a good signal to enter a short.

If Price was **Bearish**, but **does not find resistance** at the previous cycle low after breaking below it, then its a sign that OrderFlow is potentially changing.  A reclaim above the previous cycle low is a good signal to enter a long.

![Reversal](images/reversals.png)


#### Price Targets

Once you enter a trade, a stop out will be when the previous cycle level is reclaimed (invalidating your entry).  Your price targets should be the next cycle level up as you look back on your chart.

For Example, if you entered a short on the break of the 830am Cycle Low, then your target may be the low from the 7am cycle, or even the lows from a cycle from the previous day.  Likewise if you went long.  Always look back at previous cycle levels to find your targets.

#### Isn't this basically #TheStrat?

Yeh sort of!  90 minute cycles are analagous to using 90m candles, and then applying TheStrat concepts to it to entry combo's and targets.

![The Strat](images/thestrat.png)

The high/low of each 90m cycle is basically the high/low of a 90m candle in TheStrat.  You are entering on the breakouts of these 90m candles (90m Cycles) and targeting a previous 90m candle level.

I like to keep TheStrat combo cheat sheet handy, and look for these same patterns with these 90m cycles.

#### What about FakeOuts?

Like any strategy, nothing works 100% of the time.  These cycle times can get fake outs.  But since you enter near a well defined level, your losses are limited (get out quickly when the level is invalidated), and targets where the next level is decently away can then be rewarding.

![Fakeouts](images/fakeouts.png)

I won't use Cycle Times in isolation.  Keep an eye on other indicators like where PreMarket High/Low is, Previous Day High/Low, Weekly and Monthly levels.  Things like the 9ema etc. Momentum and Volume. All of these act as secondary levels of confirmation to enter a trade, but make sure if the level is invalidated you take your stop.

#### How strict is the stop rule?

My rule is usually a 3 minute close below the level and i will set a hard stop to prevent a lower low.  On the Zeussy video, he will set a range box using the 1 minute high and low candle that made that cycle high/low.  Then use that range box as a fuzzier support/resistance level.

Always trade to your risk tolerance.

#### Exclusive Trading View Indicator for 90min Time Cycles

If you are a paid member of the Spyder Academy classroom, then you will have access to our **exclusive members only** TradingView Indicator available that will plot these 90m cycles and each cycle high/low automatically for you.

Just connect your TradingView account with your Whop account, and claim the indicator "Orderflow Time Cycles".

Our TradingView indicator for 90m Time Cycles streamlines the plotting of the cycle highs and lows, so you can focus on the price action and your trade entries/exits.