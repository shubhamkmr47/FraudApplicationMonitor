function plotMonitor(){

    var filename = "./../data/monitor.csv"
    var margin = {
            top: 10,
            right: 80,
            bottom: 100,
            left: 60
        },
        margin2 = {
            top: 430,
            right: 10,
            bottom: 20,
            left: 40
        },
        width = 600 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var bisectDate = d3.bisector(function(d) {
        return d.date;
    }).left;

    var xScale = d3.time.scale()
        .range([0, width]),

        xScale2 = d3.time.scale()
        .range([0, width]); // Duplicate xScale for brushing ref later

    var yScale = d3.scale.linear()
        .range([height, 0]);

    // 40 Custom DDV colors
    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom"),

        xAxis2 = d3.svg.axis() // xAxis for brush slider
        .scale(xScale2)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    var moni = d3.svg.line()
        .interpolate("cardinal")
        .x(function(d) {
            return xScale(d.date);
        })
        .y(function(d) {
            return yScale(d.rating);
        })
        .defined(function(d) {
            return d.rating;
        }); // Hiding line value defaults of 0 for missing data

    var info = [margin, margin2, width, height, height2, bisectDate,
        xScale, xScale2, yScale, color, xAxis, xAxis2, yAxis, moni];

    return(info);
}

function renderMonitor(info) {
    d3.select("#monitor svg").remove();

    data = info[0];
    margin = info[1];
    margin2 = info[2];
    width = info[3];
    height = info[4];
    height2 = info[5];
    bisectDate = info[6];
    xScale = info[7];
    xScale2 = info[8];
    yScale = info[9];
    color = info[10];
    xAxis = info[11];
    xAxis2 = info[12];
    yAxis = info[13];
    moni = info[14];
    label = info[15];
    // alert(label);

    var maxY; // Defined later to update yAxis
    var svg = d3.select("#monitor")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Create invisible rect for mouse tracking
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0)
        .attr("id", "mouse-tracker")
        .style("fill", "white");

    //for slider part-----------------------------------------------------------------------------------

    var context = svg.append("g") // Brushing context box container
        .attr("transform", "translate(" + 0 + "," + 410 + ")")
        .attr("class", "context");

    //append clip path for lines plotted, hiding those part out of bounds
    svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    color.domain(d3.keys(data[0]).filter(function(key) {
        return key !== "date";
    }));

    var categories = color.domain().map(function(name) {
        return {
            name: name, // "name": the csv headers except date
            values: data.map(function(d) { // "values": which has an array of the dates and ratings
                return {
                    date: d.date,
                    rating: +(d[name]),
                };
            }),
            visible: true
        };
    });

    xScale.domain(d3.extent(data, function(d) {
        return d.date;
    })); // extent = highest and lowest points, domain is data, range is bouding box

    yScale.domain([0, 100
    ]);

    xScale2.domain(xScale.domain());

    //for slider part-----------------------------------------------------------------------------------
    var brush = d3.svg.brush() //for slider bar at the bottom
        .x(xScale2)
        .on("brush", brushed);

    context.append("g")
        .attr("class", "x axis1")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    var contextArea = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) {
            return xScale2(d.date);
        }) // x is scaled to xScale2
        .y0(height2) // Bottom line begins at height2 (area chart not inverted)
        .y1(0); // Top line of area, 0 (area chart not inverted)

    //plot the rect as the bar at the bottom
    context.append("path") // Path is created using svg.area details
        .attr("class", "area")
        .attr("d", contextArea(categories[0].values)) // pass first categories data .values to area path generator
        .attr("fill", "#F1F1F2");

    //append the brush for the selection of subsection
    context.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("height", height2) // Make brush rects same height
        .attr("fill", "#E6E7E8");
    //end slider part-----------------------------------------------------------------------------------

    // draw line graph
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(label);


    var issue = svg.selectAll(".issue")
        .data(categories) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("class", "issue");

    issue.append("path")
        .attr("class", "moni")
        .style("pointer-events", "none") // Stop line interferring with cursor
        .attr("id", function(d) {
            return "moni-" + d.name.replace(" ", "").replace("/", "");
            // Give line id of line-(insert issue name, with any spaces replaced with no spaces)
        })
        .attr("d", function(d) {
            return d.visible ? moni(d.values) : null; // If array key "visible" = true then draw line, if not then don't
        })
        .attr("clip-path", "url(#clip)") //use clip path to make irrelevant part invisible
        .style("stroke", function(d) {
            return color(d.name);
        })
        ;

    // draw legend
    var legendSpace = 450 / categories.length;

    issue.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", width + (margin.right / 3) + 5)
        .attr("y", function(d, i) {
            return (legendSpace) + i * (legendSpace) - 80;
        }) // spacing
        .attr("fill", function(d) {
            return d.visible ? color(d.name) : "#F1F1F2"; // If array key "visible" = true then color rect, if not then make it grey
        })
        .attr("class", "legend-box")

    .on("click", function(d) { // On click make d.visible
        d.visible = !d.visible; // If array key for this data selection is "visible" = true then make it false, if false then make it true

        maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
        yScale.domain([0, maxY + 10]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
        svg.select(".y.axis")
            .transition()
            .call(yAxis);

        issue.select("path")
            .transition()
            .attr("d", function(d) {
                return d.visible ? moni(d.values) : null; // If d.visible is true then draw line for this d selection
            })

        issue.select("rect")
            .transition()
            .attr("fill", function(d) {
                return d.visible ? color(d.name) : "#F1F1F2";
            });
    })

    .on("mouseover", function(d) {

        d3.select(this)
            .transition()
            .attr("fill", function(d) {
                return color(d.name);
            });

        d3.select("#moni-" + d.name.replace(" ", "").replace("/", ""))
            .transition()
            .style("stroke-width", 2.5);
    })

    .on("mouseout", function(d) {

        d3.select(this)
            .transition()
            .attr("fill", function(d) {
                return d.visible ? color(d.name) : "#F1F1F2";
            });

        d3.select("#moni-" + d.name.replace(" ", "").replace("/", ""))
            .transition()
            .style("stroke-width", 1.5);
    })

    issue.append("text")
        .attr("x", width + (margin.right / 3) + 20)
        .attr("y", function(d, i) {
            return (legendSpace) + i * (legendSpace) - 72;
        }) // (return (11.25/2 =) 5.625) + i * (5.625)
        .text(function(d) {
            return d.name;
        });

    // Hover line
    var hoverLineGroup = svg.append("g")
        .attr("class", "hover-line");

    var hoverLine = hoverLineGroup // Create line with basic attributes
        .append("moni")
        .attr("id", "hover-line")
        .attr("x1", 10).attr("x2", 10)
        .attr("y1", 0).attr("y2", height + 10)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("opacity", 1e-6); // Set opacity to zero

    var hoverDate = hoverLineGroup
        .append('text')
        .attr("class", "hover-text")
        .attr("y", height - (height - 40)) // hover date text position
        .attr("x", width - 150) // hover date text position
        .style("fill", "#E6E7E8");

    var columnNames = d3.keys(data[0]) //grab the key values from your first data row
        //these are the same as your column names
        .slice(1); //remove the first column name (`date`);

    var focus = issue.select("g") // create group elements to house tooltip text
        .data(columnNames) // bind each column name date to each g element
        .enter().append("g") //create one <g> for each columnName
        .attr("class", "focus");

    focus.append("text") // http://stackoverflow.com/questions/22064083/d3-js-multi-series-chart-with-y-value-tracking
        .attr("class", "tooltip")
        .attr("x", width + 7) // position tooltips
        .attr("y", function(d, i) {
            return (legendSpace) + i * (legendSpace) - 72;
        }); // (return (11.25/2 =) 5.625) + i * (5.625) // position tooltips

    // Add mouseover events for hover line.
    d3.select("#mouse-tracker") // select chart plot background rect #mouse-tracker
        .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
        .on("mouseout", function() {
            hoverDate
                .text(null) // on mouseout remove text for hover date

            d3.select("#hover-line")
                .style("opacity", 1e-6); // On mouse out making line invisible
        });

    function mousemove() {
        var mouse_x = d3.mouse(this)[0]; // Finding mouse x position on rect
        var graph_x = xScale.invert(mouse_x); //

        var format = d3.time.format('%b %Y'); // Format hover date text to show three letter month and full year

        hoverDate.text(format(graph_x)); // scale mouse position to xScale date and format it to show month and year

        d3.select("#hover-line") // select hover-line and changing attributes to mouse position
            .attr("x1", mouse_x)
            .attr("x2", mouse_x)
            .style("opacity", 1); // Making line visible

        // Legend tooltips // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html

        var x0 = xScale.invert(d3.mouse(this)[0]),
            /* d3.mouse(this)[0] returns the x position on the screen of the mouse. xScale.invert function is reversing
            the process that we use to map the domain (date) to range (position on screen). So it takes the position on
            the screen and converts it into an equivalent date! */
            i = bisectDate(data, x0, 1),
            // use our bisectDate function that we declared earlier to find the index of our data array that is close to the mouse cursor
            /*It takes our data array and the date corresponding to the position of or mouse cursor and returns the
            index number of the data array which has a date that is higher than the cursor position.*/
            d0 = data[i - 1],
            d1 = data[i],
            /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor
            and d1 is the combination of date and close that is in the data array at the index to the right of the cursor.
             In other words we now have two variables that know the value and date above and below the date that corresponds
              to the position of the cursor.*/
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        /*The final line in this segment declares a new array d that is represents the date and close combination that is
         closest to the cursor. It is using the magic JavaScript short hand for an if statement that is essentially saying
          if the distance between the mouse cursor and the date and close combination on the left is greater than the distance
           between the mouse cursor and the date and close combination on the right then d is an array of the date and
            close on the right of the cursor (d1). Otherwise d is an array of the date and close on the left of the cursor (d0).*/

        //d is now the data row for the date closest to the mouse position

        focus.select("text").text(function(columnName) {
            if(d[columnName] > 100)
                return nFormatter(d[columnName], 1);
            return (d[columnName]);
        });
    };

    //for brusher of the slider bar at the bottom
    function brushed() {

        xScale.domain(brush.empty() ? xScale2.domain() : brush.extent());
        // If brush is empty then reset the Xscale domain to default, if
        // not then make it the brush extent

        svg.select(".x.axis") // replot xAxis with transition when brush used
            .transition()
            .call(xAxis);

        maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
        yScale.domain([0, maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true

        svg.select(".y.axis") // Redraw yAxis
            .transition()
            .call(yAxis);

        issue.select("path") // Redraw lines based on brush xAxis scale and domain
            .transition()
            .attr("d", function(d) {
                return d.visible ? moni(d.values) : null; // If d.visible is true then draw line for this d selection
            });
    };

    function findMaxY(data) { // Define function "findMaxY"
        var maxYValues = data.map(function(d) {
            if (d.visible) {
                return d3.max(d.values, function(value) { // Return max rating value
                    return value.rating;
                })
            }
        });
        return d3.max(maxYValues);
    }
}

function nFormatter(num, digits) {
  var si = [
    { value: 1E18, symbol: "E" },
    { value: 1E15, symbol: "P" },
    { value: 1E12, symbol: "T" },
    { value: 1E9,  symbol: "G" },
    { value: 1E6,  symbol: "M" },
    { value: 1E3,  symbol: "k" }
  ], rx = /\.0+$|(\.[0-9]*[1-9])0+$/, i;
  for (i = 0; i < si.length; i++) {
    if (num >= si[i].value) {
      return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
    }
  }
  return num.toFixed(digits).replace(rx, "$1");
}
