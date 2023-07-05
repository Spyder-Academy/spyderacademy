TradingView.onready(function () {
    const widget = window.tvWidget;

    // Define your trade entry point
    const entryPrice = 190.0; // Replace with your entry price

    // Add arrow annotation at the entry point
    widget.chart().createShape({
        time: widget.chart().getVisibleRange().to, // Use current visible range or specify the desired time
        price: entryPrice,
        text: "Entry",
        overrides: {
            arrow: {
                show: true,
                color: "#FF0000", // Customize the color of the arrow
            },
        },
    });
});
