function plotClusters() {
    var filename = "./../data/slider_new.json";

    var margin = {
            top: 30,
            right: 30,
            bottom: 30,
            left: 40
        },
        width = 600 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, 100])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, 100])
        .range([height, 0]);

    var div = d3.select("body")
        .append("div");

    var fill = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var file;
    d3.json(filename, function(error, data) {
        file = data
        render(file, data, "parent", margin, width, height, x, y, div, fill, xAxis, yAxis);
    });
}

function render(file, data, child, margin, width, height, x, y, div, fill, xAxis, yAxis) {

    d3.select("svg").remove();

    var zoom = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([1, 1000])
        .on("zoom", zoomed);

    var svg = d3.select("#chart")
        .append("svg")
        .attr("class", "chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

    //edge
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
        });

    //circles
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("stroke-dasharray", function(d) {
            return d.net1 * 3;
        })
        .on("dblclick", function(d) {
            reset();
            var index = $("#slider").val(), c = "child";
            if(c in d){
                render(file, JSON.parse(d[c]), "child", margin, width, height, x, y, div, fill, xAxis, yAxis, zoom);
            }
            else{
                render(file, file, "parent", margin, width, height, x, y, div, fill, xAxis, yAxis, zoom);
            }
        })
        .style("opacity", function(d) {
            if ("cpu1" in d && !("score1" in d))
                return 0.8;
            return 0;
        })
        .style("display", function(d) {
            if ("score1" in d)
                return "none";
        })
        .style("fill",
            function(d) {
                return fill(d.type1);
            })
        .attr("r",
            function(d) {
                var val = 5;
                if (d["io1"] > 1000000)
                    val = 20;
                else if (d["io1"] > 100000)
                    val = 16;
                else if (d["io1"] > 10000)
                    val = 12;
                else if (d["io1"] > 1000)
                    val = 8;
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

    svg.selectAll(".name")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "name")
        .attr("x",
            function(d) {
                var val = 0;
                if ("cpu1" in d)
                    val = d.cpu1;
                return x(val) + 10;
            })
        .attr("y",
            function(d) {
                var val = 0;
                if ("ram1" in d)
                    val = d.ram1;
                return y(val);
            })
        .text(function(d) {
            if("cpu1" in d)
                return d.name;
        })

    svg.selectAll(".point")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "point")
        .attr("stroke-dasharray", function(d) {
            return d.net1 * 3;
        })
        .style("fill",
            function(d) {
                var index = $("#slider").val(),
                    score = "score" + index;
                return fill(d.type1);
            })
        .style("opacity", function(d) {
            if ("cpu1" in d && ("score1" in d))
                return 0.8;
            return 0;
        })
        .style("display", function(d) {
            if (!("score1" in d))
                return "none";
            // return 0;
        })
        .attr("d", d3.svg.symbol().type("triangle-up").size(function(d) {
            var val = 70;
            if (d["io1"] > 1000000)
                val = 400;
            else if (d["io1"] > 100000)
                val = 300;
            else if (d["io1"] > 10000)
                val = 200;
            else if (d["io1"] > 1000)
                val = 100;
            return val;
        }))
        .attr("transform", function(d) {
            if ("cpu1" in d)
                return "translate(" + x(d.cpu1) + "," + y(d.ram1) + ")";
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
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
        .style("stroke", "#000");

    var running = false;
    var timer;

    $("#play").on("click", function() {

        var duration = 2000,
            maxstep = 20,
            minstep = 1;

        if (running == true) {

            $("#play").html(">");
            running = false;
            clearInterval(timer);
        } else if (running == false) {

            $("#play").html("||");

            sliderValue = $("#slider").val();

            timer = setInterval(function() {
                if (sliderValue < maxstep) {
                    sliderValue++;
                    $("#slider").val(sliderValue);
                    $('#range').html(sliderValue);
                } else {
                    $("#play").html(">");
                    running = false;
                }
                $("#slider").val(sliderValue);
                update();

            }, duration);
            running = true;
        }

    });

    $("#slider").on("change", function() {
        $("#range").html($("#slider").val());
        update();
        clearInterval(timer);
        $("#play").html(">");
    });

    update = function() {
        var index = $("#slider").val(),
            cpu = "cpu" + index,
            ram = "ram" + index,
            t = "target" + index,
            net = "net" + index,
            score = "score" + index,
            type = "type" + index,
            io = "io" + index,
            child = "child" + index;

        d3.select(".yaxis")
            .call(yAxis);

        d3.select(".xaxis")
            .call(xAxis);

        d3.selectAll(".line")
            .attr("x1", function(d) {
                if (cpu in d)
                    return x(d[cpu]);
                return x(0);
            })
            .attr("y1", function(d) {
                if (ram in d)
                    return y(d[ram]);
                return y(0);
            })
            .attr("x2", function(d) {
                var xval = 0;
                if (t in d && cpu in data[d[t]])
                    xval = data[d[t]][cpu];
                return x(xval);
            })
            .attr("y2", function(d) {
                var yval = 0;
                if (t in d && ram in data[d[t]])
                    yval = data[d[t]][ram];
                return y(yval);
            })
            .style("opacity", function(d) {
                if (cpu in d && ram in d && t in d && cpu in data[d[t]] && ram in data[d[t]])
                    return 1;
                return 0;
            });

        d3.selectAll(".dot")
            .attr("r",
                function(d) {
                    var val = 5;
                    if (d[io] > 1000000)
                        val = 20;
                    else if (d[io] > 100000)
                        val = 16;
                    else if (d[io] > 10000)
                        val = 12;
                    else if (d[io] > 1000)
                        val = 8;
                    return val;
                })
            .attr("cy", function(d) {
                var yval = 0;
                if (ram in d)
                    yval = d[ram];
                return y(yval);
            })
            .attr("cx", function(d) {
                var xval = 0;
                if (cpu in d)
                    xval = d[cpu];
                return x(xval);
            })
            .attr("stroke-dasharray", function(d) {
                return d[net] * 3;
            })
            .style("fill",
                function(d) {
                    return fill(d[type]);
                })
            .style("opacity", function(d) {
                if (ram in d && cpu in d  && !(score in d)) {
                    return 0.8;
                }
                return 0;
            })
            .style("display", function(d) {
                if (score in d)
                    return "none";
            });

        svg.selectAll(".point")
            .attr("stroke-dasharray", function(d) {
                return d[net] * 3;
            })
            .style("fill",
                function(d) {
                    return fill(d[type]);
                })
            .style("opacity", function(d) {
                if (ram in d && cpu in d && (score in d)) {
                    return 0.8;
                }
                return 0;
            })
            .style("display", function(d) {
                if (!(score in d))
                    return "none";
            })
            .attr("d", d3.svg.symbol().type("triangle-up").size(function(d) {
                var val = 140;
                if (d[io] > 1000000)
                    val = 600;
                else if (d[io] > 100000)
                    val = 400;
                else if (d[io] > 10000)
                    val = 300;
                else if (d[io] > 1000)
                    val = 200;
                return val;
            }))
            .attr("transform", function(d) {
                if (cpu in d)
                    return "translate(" + x(d[cpu]) + "," + y(d[ram]) + ")";
            });

        svg.selectAll(".name")
            .attr("x",
                function(d) {
                    if (cpu in d)
                        return x(d[cpu]) + 10;
                })
            .attr("y",
                function(d) {
                    if (ram in d)
                        return y(d[ram])+ 2;
                })
            .text(function(d) {
                return d.name;
            })
            .attr("display",
                function(d) {
                    if (!(cpu in d))
                        return "none";
            })
    };


    d3.select("#range").on("click", reset);

    function zoomed() {
        update();
        svg.select(".xaxis").call(xAxis);
        svg.select(".yaxis").call(yAxis);
    }

    function reset() {
        d3.transition().duration(750).tween("zoom", function() {
            var ix = d3.interpolate(x.domain(), [0, 100]),
                iy = d3.interpolate(y.domain(), [0, 100]);
            return function(t) {
                zoom.x(x.domain(ix(t))).y(y.domain(iy(t)));
                zoomed();
            };
        });
    }
}
