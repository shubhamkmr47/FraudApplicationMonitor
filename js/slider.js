function plotClusters() {

    var filename = "./../data/slider.json";

    var margin = {
            top: 30,
            right: 30,
            bottom: 30,
            left: 30
        },
        width = 600 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom,
        maxX = 0,
        maxY = 0;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var div = d3.select("body")
        .append("div");

    var fill = d3.scale.category10();
    // var fill = d3.scale.category20();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#chart")
        .append("svg")
        .attr("class", "chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Process:</strong> <span style='color:red'>" + d.name + "</span>";
        })
    svg.call(tip);

    d3.json(filename, function(error, data) {

        maxX = d3.max(data, function(d) {
            return d.cpu1;
        });
        maxY = d3.max(data, function(d) {
            return d.ram1;
        });
        // alert(a);

        x.domain([0, Math.min(100, maxX + 5)]).nice();
        y.domain([0, Math.min(100, maxY + 5)]).nice();

        //x axis
        svg.append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("CPU");

        //y axis
        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.8em")
            .style("text-anchor", "end")
            .text("RAM")

        svg.selectAll(".line")
            .data(data)
            .enter()
            .append("line")
            .attr("class", "line")
            .style("stroke", "#000")
            .style("marker-end", "url(#suit)")
            .attr("x1", function(d) {
                var index = $("#slider").val();
                var xval = "cpu" + index;
                if (xval in d)
                    return x(d[xval]);
                return x(0);
            })
            .attr("y1", function(d) {
                var index = $("#slider").val();
                var yval = "ram" + index;
                if (yval in d)
                    return y(d[yval]);
                return y(0);
            })
            .attr("x2", function(d) {
                var index = $("#slider").val();
                var t = "target" + index,
                    xval = "cpu" + index;
                if (t in d && xval in data[d[t]])
                    xval = data[d[t]][xval];
                else
                    xval = 0;
                return x(xval);
            })
            .attr("y2", function(d) {

                var index = $("#slider").val();
                var t = "target" + index,
                    yval = "ram" + index;
                if (t in d && yval in data[d[t]])
                    yval = data[d[t]][yval];
                else
                    yval = 0;
                return y(yval);
            })
            .style("opacity", function(d) {
                var index = $("#slider").val(),
                    t = "target" + index;
                var x = "cpu" + index,
                    y = "ram" + index;
                if (x in d && y in d && t in d && x in data[d[t]] && y in data[d[t]]) {
                    return 1;
                }
                return 0;
            })

        //circles
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r",
                function(d) {
                    var val = 7;
                    if (d["io1"] > 100000000)
                        val = 15;
                    else if (d["io1"] > 10000000)
                        val = 14
                    else if (d["io1"] > 1000000)
                        val = 13
                    else if (d["io1"] > 100000)
                        val = 11
                    else if (d["io1"] > 100000)
                        val = 9
                    return val;
                })
            .attr("cx",
                function(d) {
                    var val = 0;
                    if ("cpu1" in d)
                        val = d.cpu1;
                    return x(val);
                })
            .attr("cy",
                function(d) {
                    var val = 0;
                    if ("ram1" in d)
                        val = d.ram1;
                    return y(val);
                })
            .attr("stroke-dasharray", function(d) {
                return d.net1*2;
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .style("fill",
                function(d) {
                    return fill(d.type1);
                })
            .style("opacity", function(d) {
                if ("cpu1" in d)
                    return 0.8;
                return 0;
            });

        svg.append("defs").selectAll("marker")
            .data(["suit", "licensing", "resolved"])
            .enter()
            .append("marker")
            .attr("id", function(d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 22)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 12)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
            .style("stroke", "#000");

        var timer;

        $("#slider").on("change", function() {
            update();
            // update2();
            $("#range").html($("#slider").val());
            clearInterval(timer);
        });

        update = function() {
            var index = $("#slider").val(),
                xval = "cpu" + index,
                yval = "ram" + index;
            maxX = d3.max(data, function(d) {
                return d[xval];
            });
            maxY = d3.max(data, function(d) {
                return d[yval];
            });
            x.domain([0, Math.min(100, maxX + 5)]).nice();
            y.domain([0, Math.min(100, maxY + 5)]).nice();

            d3.select(".yaxis")
                .transition().duration(2000)
                .call(yAxis);

            d3.select(".xaxis")
                .transition().duration(2000)
                .call(xAxis);

            d3.selectAll(".line")
                .transition().duration(2000)
                .attr("x1", function(d) {
                    var xval = "cpu" + index;
                    if (xval in d)
                        return x(d[xval]);
                    return x(0);
                })
                .attr("y1", function(d) {
                    var yval = "ram" + index;
                    if (yval in d)
                        return y(d[yval]);
                    return y(0);
                })
                .attr("x2", function(d) {
                    var t = "target" + index,
                        xval = "cpu" + index;
                    if (t in d && xval in data[d[t]])
                        xval = data[d[t]][xval];
                    else
                        xval = 0;
                    return x(xval);
                })
                .attr("y2", function(d) {
                    var t = "target" + index,
                        yval = "ram" + index;
                    if (t in d && yval in data[d[t]])
                        yval = data[d[t]][yval];
                    else
                        yval = 0;
                    return y(yval);
                })
                .style("opacity", function(d) {
                    var index = $("#slider").val(),
                        t = "target" + index;
                    var x = "cpu" + index,
                        y = "ram" + index;
                    if (x in d && y in d && t in d && x in data[d[t]] && y in data[d[t]]) {
                        // alert(d["name"] + "  = " + d[x] + " " + " " + d[y] + " | " + data[d[t]][x] + " " + data[d[t]][y]);
                        return 1;
                    }
                    return 0;
                });
            d3.selectAll(".dot")
                // .transition()
                // .duration(1000)
                .transition().duration(2000)
                .attr("r",
                    function(d) {
                        var val = 7;
                        if (d["io1"] > 100000000)
                            val = 15;
                        else if (d["io1"] > 10000000)
                            val = 14;
                        else if (d["io1"] > 1000000)
                            val = 13;
                        else if (d["io1"] > 100000)
                            val = 11;
                        else if (d["io1"] > 100000)
                            val = 9;
                        return val;
                    })
                .attr("cy", function(d) {
                    var index = $("#slider").val(),
                        val = 0;
                    index = "ram" + index;
                    if (index in d)
                        val = d[index];
                    maxY = Math.max(maxY, val);
                    return y(val);
                })
                .attr("cx", function(d) {
                    var index = $("#slider").val(),
                        val = 0;
                    index = "cpu" + index;
                    if (index in d)
                        val = d[index];
                    maxX = Math.max(maxX, val);
                    return x(val);
                })
                .attr("stroke-dasharray", function(d) {
                    var index = $("#slider").val(),
                        val = "net" + index;
                    return d[val]*2;
                })
                .style("fill",
                    function(d) {
                        var index = $("#slider").val();
                        index = "type" + index;
                        return fill(d[index]);
                    })
                .style("opacity", function(d) {
                    var index = $("#slider").val();
                    var ram = "ram" + index,
                        cpu = "cpu" + index;
                    if (ram in d && cpu in d) {
                        return 0.8;
                    }
                    return 0;
                });

        };
    });
}
