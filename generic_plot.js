/**
 * Created by srinath on 12/13/14.
 */

/**
 * IGViz = Interactive Generic Visualization
 * Following object holds all the state
 * @type {Object}
 */

var igViz = new Object();

igViz.setDataTable = function (dataTable) {
    this.dataTable = dataTable;
};


igViz.plot = function (divId, chartConfig) {
    if ("scatter" == chartConfig.chartType) {
        drawScatterPlot(divId, chartConfig, this.dataTable)
    } else if ("bar" == chartConfig.chartType) {
        drawBarChart(divId, chartConfig, this.dataTable)
    } else if ("singleNumber" == chartConfig.chartType) {
        drawSingleNumberDiagram(divId, chartConfig, this.dataTable);
    } else if ("normalizationCurve" == chartConfig.chartType) {
        drawNormalizationCurve(divId, chartConfig, this.dataTable);
    } else if ("tableChart" == chartConfig.chartType) {
        drawTableChart(divId, chartConfig, this.dataTable);
    }
    else if ("lineChart" == chartConfig.chartType) {
        drawLineChart(divId, chartConfig, this.dataTable)
    }
    else if ("map" == chartConfig.chartType) {                            //add this
        drawMapDiagram(divId, chartConfig, this.dataTable)
    }
    else if ("groupBar" == chartConfig.chartType) {
        drawGroupBarChart(divId, chartConfig, this.dataTable)
    }
    else {
        console.error("Unknown chart type " + chartConfig.chartType);
        return 0;
    }
};

function drawScatterPlot(divId, chartConfig, dataTable) {
    //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var plotCtx = createScales(dataset, chartConfig, dataTable);
    var xScale = plotCtx.xScale;
    var yScale = plotCtx.yScale;
    var rScale = plotCtx.rScale;
    var colorScale = plotCtx.colorScale;

    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();

    //Create SVG element
    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", w)
        .attr("height", h);
    svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", w).attr("height", h)
        .attr("fill", "rgba(222,235,247, 0.5)")

    createXYAxises(svg, plotCtx, chartConfig, dataTable);

    //Now we really drwa by creating circles. The layout is done such a way that (0,0)
    // starts from bottom left corner as usual.
    var group1 = svg.append("g")
        .attr("id", "circles")
        .selectAll("g")
        .data(dataset)
        .enter()
        .append("g");
    configurePoints(group1, xScale, yScale, rScale, colorScale);
    configurePointLabels(group1, xScale, yScale);
}

function drawBarChart(divId, chartConfig, dataTable) {
    var width = chartConfig.chartWidth;
    var height = chartConfig.chartHight;
    var padding = chartConfig.padding;

    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var plotCtx = createScales(dataset, chartConfig, dataTable);
    var xScale = plotCtx.xScale;
    var yScale = plotCtx.yScale;


    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();


    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", width)
        .attr("height", height);

    createXYAxises(svg, plotCtx, chartConfig, dataTable);

    //Now we really drwa by creating rectangles. The layout is done such a way that (0,0)
    // starts from bottom left corner as usual.
    //TODO handle multiple column groups using color
    //http://bl.ocks.org/mbostock/3887051
    svg.selectAll(".bar")
        .data(dataset)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            //console.log(d.data[d.config.xAxisData]);
            return xScale(d.data[d.config.xAxisData]);
        })
        .attr("width", xScale.rangeBand())
        .attr("y", function (d) {
            return yScale(d.data[d.config.yAxisData]);
        })
        .attr("height", function (d) {
            return height - yScale(d.data[d.config.yAxisData]) - padding;
        });
}

function drawGroupBarChart(divId, chartConfig, dataTable) {
    var width = chartConfig.chartWidth;
    var height = chartConfig.chartHight;
    var padding = chartConfig.padding;

    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var plotCtx = createScales(dataset, chartConfig, dataTable);
    var xScale = plotCtx.xScale;
    var yScale = plotCtx.yScale;


    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();


    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", width)
        .attr("height", height);

    createXYAxises(svg, plotCtx, chartConfig, dataTable);

    //Now we really drwa by creating rectangles. The layout is done such a way that (0,0)
    // starts from bottom left corner as usual.
    //TODO handle multiple column groups using color
    //http://bl.ocks.org/mbostock/3887051
    svg.selectAll(".bar")
        .data(dataset)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            //console.log(d.data[d.config.xAxisData]);
            return xScale(d.data[d.config.xAxisData]);
        })
        .attr("width", xScale.rangeBand())
        .attr("y", function (d) {
            return yScale(d.data[d.config.yAxisData]);
        })
        .attr("height", function (d) {
            return height - yScale(d.data[d.config.yAxisData]) - padding;
        });
}

/**
 * By : Fawsan M. <--fawsanm@wso2.com-->
 * function to draw the Single Number Diagram
 * @param divId
 * @param chartConfig
 * @param dataTable
 */
function drawSingleNumberDiagram(divId, chartConfig, dataTable) {

    //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    //configure font sizes
    var MAX_FONT_SIZE = 40;
    var AVG_FONT_SIZE = 70;
    var MIN_FONT_SIZE = 40;

    //div elements to append single number diagram components
    var minDiv = "minValue";
    var maxDiv = "maxValue";
    var avgDiv = "avgValue";


    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();

    //Create SVG element
    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", w)
        .attr("height", h);


    //  getting a reference to the data
    var tableData = dataTable.data;

    //parse a column to calculate the data for the single number diagram
    var selectedColumn = parseColumnFrom2DArray(tableData, dataset[0].config.xAxisData);

    //appending a group to the diagram
    var SingleNumberDiagram = svg
            .append("g")
        ;

        
         svg.append("rect")
         .attr("id","rect")
        .attr("x", 0)
        .attr("y",0)
        .attr("width", w)
        .attr("height", h)



        //Minimum value goes here
    SingleNumberDiagram.append("text")
        .attr("id",minDiv)
        .text("Max: "+getMax(selectedColumn))
        //.text(50)
        .attr("font-size", MIN_FONT_SIZE)
        .attr("x", 3*w/4)
        .attr("y", h/4)
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("lignment-baseline", "middle")
    ;

    //Average value goes here
    SingleNumberDiagram.append("text")
        .attr("id", avgDiv)
        .text(getAvg(selectedColumn))
        .attr("font-size", AVG_FONT_SIZE)
        .attr("x", w/2)
        .attr("y", h/2 + d3.select("#"+avgDiv).attr("font-size")/5)
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("lignment-baseline", "middle")
    ;

    //Maximum value goes here
    SingleNumberDiagram.append("text")
        .attr("id",maxDiv)
        .text("Min: "+getMin(selectedColumn))
        .attr("font-size", MAX_FONT_SIZE)
        .attr("x", 3*w/4)
        .attr("y", 3*h/4)
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("lignment-baseline", "middle")
    ;


}

/**
 * By : Fawsan M. <--fawsanm@wso2.com-->
 * Function to draw the Normalization Curve
 * @param divId
 * @param chartConfig
 * @param dataTable
 */
function drawNormalizationCurve(divId, chartConfig, dataTable) {

    //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    var margin = {top: 10, right: 10, bottom: 10, left: 0};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var tableData = dataTable.data;

    var mathsColumn = parseColumnFrom2DArray(tableData, dataset[0].config.xAxisData);

    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();

    // //Create SVG element
    // var svg = d3.select(divId)
    //     .append("svg")
    //     .attr("id", svgID.replace("#", ""))
    //     .attr("width", w)
    //     .attr("height", h)
    //     .append("g")
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

         //Create SVG element
    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#",""))
        .attr("width", w)
        .attr("height", h)
        ;


         svg.append("rect")
         .attr("id","rect")
        .attr("x", 0)
        .attr("width", w)
        .attr("height",h)    
        


    var normalizedCoordinates = NormalizationCoordinates(mathsColumn.sort(function (a, b) {
        return a - b
    }));
    //console.log(normalizedCoordinates);


    // Set the ranges
    var x = d3.time.scale().range([0, w]);
    var y = d3.scale.linear().range([h, 0]);

    // Define the x axis
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(0);


    // Define the line
    var valueLines = d3.svg.line()
        .x(function (d) {
            return x(d.x);
        })
        .y(function (d) {
            return y(d.y);
        });

  // Adds the svg canvas
    var normalizationCurve = svg
                            .append("g")
                            .attr("transform","translate(" + margin.left + "," + margin.top+")");

    // Scale the range of the data
    x.domain(d3.extent(normalizedCoordinates, function (d) {
        return d.x;
    }));
    y.domain([0, d3.max(normalizedCoordinates, function (d) {
        return d.y;
    })]);

    // Add the valueLines path.
    normalizationCurve.append("path")
        .attr("class", "line")
        .attr("d", valueLines(normalizedCoordinates));

    // Add the X Axis
    normalizationCurve.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
    ;


}

/**
 * By : Fawsan M. <--fawsanm@wso2.com-->
 * Function to draw the Table
 * @param divId
 * @param chartConfig
 * @param dataTable
 */
function drawTableChart(divId, chartConfig, dataTable) {


    //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    //var svgID = divId+"_svg";
    //Remove current SVG if it is already there
    //d3.select(svgID).remove();

    //remove the current table if it is already exist
    d3.select(divId).select("table").remove();


    var rowLabel = dataTable.metadata.names;
    //sriRowLabel.unshift('-');

    var tableData = dataTable.data;

    //var rowLabel = ['-', 'Math', 'Science', 'History', 'English', 'IT', 'Health', 'Social','Politics', 'Physics'];

    //Using RGB color code to represent colors
    //Because the alpha() function use these property change the contrast of the color
    //

    var colors = [
        {r: 255, g: 0, b: 0},
        {r: 0, g: 255, b: 0},
        {r: 200, g: 100, b: 100},
        {r: 200, g: 255, b: 250},
        {r: 255, g: 140, b: 100},
        {r: 230, g: 100, b: 250},
        {r: 0, g: 138, b: 230},
        {r: 165, g: 42, b: 42},
        {r: 127, g: 0, b: 255},
        {r: 0, g: 255, b: 255}
    ];

    //function to change the color depth
    //default domain is set to [0, 100], but it can be changed according to the dataset
    var alpha = d3.scale.linear().domain([0, 100]).range([0, 1]);

    //append the Table to the div
    var table = d3.select(divId).append("table").attr('class', 'table table-bordered');


    var colorRows = d3.scale.linear()
        .domain([2.5, 4])
        .range(['#F5BFE8', '#E305AF']);

    var fontSize = d3.scale.linear()
            .domain([0, 100])
            .range([15, 20])
        ;

    //create the table head
    thead = table.append("thead");

    //create the table body
    tbody = table.append("tbody")

    //Append the header to the table
    thead.append("tr")
        .selectAll("th")
        .data(rowLabel)
        .enter()
        .append("th")
        .text(function (d) {
            return d;
        });


    $(document).ready(function () {


        var isColorBasedSet = $('#colorBasedValue').prop('checked')
        var isFontBasedSet = $('#fontSizeBasedValue').prop('checked')

        var rows = tbody.selectAll("tr")
            .data(tableData)
            .enter()
            .append("tr")

        var cells;

        if (isColorBasedSet == true && isFontBasedSet == true) {


            //adding the  data to the table rows
            cells = rows.selectAll("td")

                //Lets do a callback when we get each array from the data set
                .data(function (d, i) {
                    return d;
                })
                //select the table rows (<tr>) and append table data (<td>)
                .enter()
                .append("td")
                .text(function (d, i) {
                    return d;
                })
                .style("font-size", function (d, i) {


                    fontSize.domain([
                        getMin(parseColumnFrom2DArray(tableData, i)),
                        getMax(parseColumnFrom2DArray(tableData, i))]);
                    return fontSize(d) + "px";
                })
                .style('background-color', function (d, i) {

                    //This is where the color is decided for the cell
                    //The domain set according to the data set we have now
                    //Minimum & maximum values for the particular data column is used as the domain
                    alpha.domain([getMin(parseColumnFrom2DArray(tableData, i)), getMax(parseColumnFrom2DArray(tableData, i))]);

                    //return the color for the cell
                    return 'rgba(' + colors[i].r + ',' + colors[i].g + ',' + colors[i].b + ',' + alpha(d) + ')';

                })
            ;

        } else if (isColorBasedSet && !isFontBasedSet) {

            //adding the  data to the table rows
            cells = rows.selectAll("td")

                //Lets do a callback when we get each array from the data set
                .data(function (d, i) {
                    return d;
                })
                //select the table rows (<tr>) and append table data (<td>)
                .enter()
                .append("td")
                .text(function (d, i) {
                    return d;
                })
                .style('background-color', function (d, i) {

                    //This is where the color is decided for the cell
                    //The domain set according to the data set we have now
                    //Minimum & maximum values for the particular data column is used as the domain
                    alpha.domain([
                        getMin(parseColumnFrom2DArray(tableData, i)),
                        getMax(parseColumnFrom2DArray(tableData, i))]);

                    //return the color for the cell
                    return 'rgba(' + colors[i].r + ',' + colors[i].g + ',' + colors[i].b + ',' + alpha(d) + ')';

                })
            ;

        }
        else if (!isColorBasedSet && isFontBasedSet) {

            //adding the  data to the table rows
            cells = rows.selectAll("td")

                //Lets do a callback when we get each array from the data set
                .data(function (d, i) {
                    return d;
                })
                //select the table rows (<tr>) and append table data (<td>)
                .enter()
                .append("td")
                .text(function (d, i) {
                    return d;
                })
                .style("font-size", function (d, i) {

                    fontSize.domain([
                        getMin(parseColumnFrom2DArray(tableData, i)),
                        getMax(parseColumnFrom2DArray(tableData, i))]);
                    return fontSize(d) + "px";
                });

        }
        else {

            //appending the rows inside the table body
            rows.style('background-color', function (d, i) {

                colorRows.domain([
                    getMin(parseColumnFrom2DArray(tableData, chartConfig.xAxisData)),
                    getMax(parseColumnFrom2DArray(tableData, chartConfig.xAxisData))
                ]);
                return colorRows(d[chartConfig.xAxisData]);
            })
                .style("font-size", function (d, i) {

                    fontSize.domain([
                        getMin(parseColumnFrom2DArray(tableData, i)),
                        getMax(parseColumnFrom2DArray(tableData, i))]);
                    return fontSize(d) + "px";
                })
            ;


            //adding the  data to the table rows
            cells = rows.selectAll("td")
                //Lets do a callback when we get each array from the data set
                .data(function (d, i) {
                    return d;
                })
                //select the table rows (<tr>) and append table data (<td>)
                .enter()
                .append("td")
                .text(function (d, i) {
                    return d;
                })


        }

    });

}

function drawLineChart(divId, chartConfig, dataTable) {
    //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d) {
        return {"data": d, "config": chartConfig}
    });

    var plotCtx = createScales(dataset, chartConfig, dataTable);
    var xScale = plotCtx.xScale;
    var yScale = plotCtx.yScale;
    var rScale = plotCtx.rScale;
    var colorScale = plotCtx.colorScale;

    //console.log(rScale);

    var svgID = divId + "_svg";
    //Remove current SVG if it is already there
    d3.select(svgID).remove();

    //Create SVG element
    var svg = d3.select(divId)
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", w)
        .attr("height", h);
    svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", w).attr("height", h)
        .attr("fill", "rgba(222,235,247, 0.5)")


    createXYAxises(svg, plotCtx, chartConfig, dataTable);


    configurePoints(group1, xScale, yScale, rScale, colorScale);


}


/**
 * Util Methods
 */

/**
 * Creates correct scales based on x,y axis data columns, this leaving padding space around in SVG.
 * @param dataset
 * @param chartConfig
 * @param dataTable
 * @returns {{xScale: *, yScale: *, rScale: *, colorScale: *}}
 */
function createScales(dataset, chartConfig, dataTable) {
    //Create scale functions

    var xScale;
    var yScale;
    var colorScale;
    if (dataTable.metadata.types[chartConfig.xAxisData] == 'N') {
        xScale = d3.scale.linear()
            .domain([0, d3.max(dataset, function (d) {
                return d.data[d.config.xAxisData];
            })])
            .range([chartConfig.padding, chartConfig.chartWidth - chartConfig.padding]);
    } else {
        xScale = d3.scale.ordinal()
            .domain(dataset.map(function (d) {
                return d.data[chartConfig.xAxisData];
            }))
            .rangeRoundBands([chartConfig.padding, chartConfig.chartWidth - chartConfig.padding], .1)
    }

    //TODO hanle case r and color are missing

    if (dataTable.metadata.types[chartConfig.yAxisData] == 'N') {
        yScale = d3.scale.linear()
            .domain([0, d3.max(dataset, function (d) {
                return d.data[d.config.yAxisData];
            })])
            .range([chartConfig.chartHight - chartConfig.padding, chartConfig.padding]);
        //var yScale = d3.scale.linear()
        //    .range([height, 0])
        //    .domain([0, d3.max(dataset, function(d) { return d.data[d.config.yAxisData]; })])
    } else {
        yScale = d3.scale.ordinal()
            .rangeRoundBands([0, chartConfig.chartWidth], .1)
            .domain(dataset.map(function (d) {
                return d.data[chartConfig.yAxisData];
            }))
    }


    //this is used to scale the size of the point, it will value between 0-20
    var rScale = d3.scale.linear()
        .domain([0, d3.max(dataset, function (d) {
            return d.config.pointSize ? d.data[d.config.pointSize] : 20;
        })])
        .range([0, 20]);

    //TODO have to handle the case color scale is categorical : Done
    //http://synthesis.sbecker.net/articles/2012/07/16/learning-d3-part-6-scales-colors
    // add color to circles see https://www.dashingd3js.com/svg-basic-shapes-and-d3js
    //add legend http://zeroviscosity.com/d3-js-step-by-step/step-3-adding-a-legend
    if (dataTable.metadata.types[chartConfig.pointColor] == 'N') {
        colorScale = d3.scale.linear()
            .domain([-1, d3.max(dataset, function (d) {
                return d.config.pointColor ? d.data[d.config.pointColor] : 20;
            })])
            .range(["blue", "green"]);
    } else {
        colorScale = d3.scale.category20c();
    }

    //TODO add legend


    return {"xScale": xScale, "yScale": yScale, "rScale": rScale, "colorScale": colorScale}
}

/**
 * Create XY axis and axis labels
 * @param svg
 * @param plotCtx
 * @param chartConfig
 * @param dataTable
 */

function createXYAxises(svg, plotCtx, chartConfig, dataTable) {
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;
    var padding = chartConfig.padding;

    //Define X axis
    var xAxis = d3.svg.axis()
        .scale(plotCtx.xScale)
        .orient("bottom")
        .ticks(5);

    //Define Y axis
    var yAxis = d3.svg.axis()
        .scale(plotCtx.yScale)
        .orient("left")
        .ticks(5);

    //Create X axis
    var axis = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //if categroical, we slant the text
    if (dataTable.metadata.types[chartConfig.xAxisData] == 'C') {
        axis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
                return "rotate(-65)"
            });
    }

    axis.append("text")
        .style("font-size", "20px")
        .attr("y", 20)
        .attr("x", w - padding / 5)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(dataTable.metadata.names[chartConfig.xAxisData]);


    //Create Y axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (padding) + ",0)")
        .call(yAxis)
        .append("text")
        .style("font-size", "20px")
        .attr("y", 6)
        .attr("x", -10)
        .attr("transform", "rotate(-90)")
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(dataTable.metadata.names[chartConfig.yAxisData]);
}


/**
 * Configure a point and set size and color
 * @param group1
 * @param xScale
 * @param yScale
 * @param rScale
 * @param colorScale
 */
function configurePoints(group1, xScale, yScale, rScale, colorScale) {
    //TODO have to handle the case color scale is categorical
    group1.append("circle")
        .attr("cx", function (d) {
            return xScale(d.data[d.config.xAxisData]);
        })
        .attr("cy", function (d) {
            return yScale(d.data[d.config.yAxisData]);
        })
        .attr("r", function (d) {
            if (d.config.pointSize != -1) {
                return rScale(d.data[d.config.pointSize]);
            } else {
                return 5;
            }
        })
        .style("fill", function (d) {
            if (d.config.pointColor != -1) {
                return colorScale(d.data[d.config.pointColor]);
            } else {
                return 2;
            }
        });
}


/**
 * Methods for the base.html
 */
/**
 * Add text to each point
 * @param group1
 * @param xScale
 * @param yScale
 */

function configurePointLabels(group1, xScale, yScale) {
    //TODO make this nicer
    group1.append("text")
        .attr("x", function (d) {
            return xScale(d.data[d.config.xAxisData]);
        })
        .attr("y", function (d) {
            return yScale(d.data[d.config.yAxisData]) - 10;
        })
        .style("font-family", "sans-serif")
        .style("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function (d) {
            if (d.config.pointLabel != -1) {
                return d.data[d.config.pointLabel];
            } else {
                return "3";
            }
        });
}

function redrawClicked(formID, targetChartId) {
    var form = document.getElementById(formID)
    //-1 means that dimension is disabled

    if (typeof form.xAxis == 'undefined') {
        // the variable is defined
        form.xAxis = 0;
    }
    if (typeof form.yAxis == 'undefined') {
        // the variable is defined
        form.yAxis = 0;
    }
    if (typeof form.pointColor == 'undefined') {
        // the variable is defined
        form.pointColor = 0;
    }
    if (typeof form.pointSize == 'undefined') {
        // the variable is defined
        form.pointSize = 0;
    }


    var chartConfig = {
        "title": "Title",
        "xLog": false,
        "yLog": false,
        "xAxisData": form.xAxis.value,
        "yAxisData": form.yAxis.value,
        "yAxis2Data": getValue("yAxis2"),
        "yAxis3Data": getValue("yAxis3"),
        "mapLocation": getValue('mapLocation'),
        "pointColor": form.pointColor.value,
        "pointSize": form.pointSize.value,
        "pointLabel": 0,
        "chartWidth": 600,
        "chartHight": 400,
        "padding": 60,
        "chartType": targetChartId.replace("#", "")
    }

    function getValue(item) {                                //add this
        try {
            switch (item) {
                case 'xAxis':
                    return form.xAxis.value;
                    break;
                case 'yAxis':
                    return form.yAxis.value;
                    break;
                case 'yAxis2':
                    return form.yAxis2.value;
                    break;
                case 'yAxis3':
                    return form.yAxis3.value;
                    break;
                case 'mapLocation':
                    return form.mapLocation.value;
                    break;
                case 'pointColor':
                    return form.pointColor.value;
                    break;
                case 'pointSize':
                    return form.pointSize.value;
                    break;

            }
        } catch (err) {
            return -1;
        }
        ;
    }

    igViz.plot(targetChartId, chartConfig);
}

function createForm(dataTable, formID, chartType) {
    if (chartType == "scatter") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("yAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointColor", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointSize", dataTable, 'N', formID);
    } else if (chartType == "bar") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'C', formID);
        createSelectFeildWithColumnNames("yAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointColor", dataTable, 'C', formID);
        //here - means select nothing
        createSelectFeildWithColumnNames("pointSize", dataTable, '-', formID);
    } else if (chartType == "singleNumber") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'N', formID);
        //createSelectFeildWithColumnNames("yAxis", dataTable, '-', formID);
        //createSelectFeildWithColumnNames("pointColor", dataTable, '-', formID);
        //createSelectFeildWithColumnNames("pointSize", dataTable, '-', formID);
    } else if (chartType == "tableChart") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'N', formID);

        createCheckBoxWithLabel("rowBased", "Row Based Styles", formID)
        createCheckBoxWithLabel("colorBasedValue", "Draw Based on Color", formID)
        createCheckBoxWithLabel("fontSizeBasedValue", "Draw Based on Font", formID)
        //createSelectFeildWithColumnNames("yAxis", dataTable, '-', formID);
        //createSelectFeildWithColumnNames("pointColor", dataTable, '-', formID);
        //createSelectFeildWithColumnNames("pointSize", dataTable, '-', formID);
    }
    else if (chartType == "lineChart") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("yAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("yAxis2", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("yAxis3", dataTable, 'N', formID);
    }
    else if (chartType == "map") {                                                      ////add this
        createSelectFeildWithColumnNames("mapLocation", dataTable, 'C', formID);
        createSelectFeildWithColumnNames("pointColor", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointSize", dataTable, 'N', formID);
    }
    else if (chartType == "groupBar") {
        createSelectFeildWithColumnNames("xAxis", dataTable, 'C', formID);
        createSelectFeildWithColumnNames("yAxis", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointColor", dataTable, 'N', formID);
        createSelectFeildWithColumnNames("pointSize", dataTable, '-', formID);
    }
    else {
        console.error("Unknown chart type " + chartType)
    }
}

function createSelectFeildWithColumnNames(name, dataTable, type, formID) {
    //TODO populate feidls
    var selectedNames = [];											//Initialize empty array
    var namesLength = dataTable.metadata.names.length;										//Number of dummy data points to create
    for (var i = 0; i < namesLength; i++) {					//Loop numDataPoints times
        if (dataTable.metadata.types[i] == type || type == 'A') {
            selectedNames.push({"name": dataTable.metadata.names[i], "index": i});
        }
    }

    var form = d3.select(formID);
    form.append("text")
        .attr("class", "list-group")
        .text(name);

    var select = form.append("select").attr("class", "control-label list-group-item btn btn-default");

    select.attr("name", name)
        .selectAll("option")
        .data(selectedNames)
        .enter().append("option")
        .attr("value", function (d) {
            return d.index;
        })
        .text(function (d) {
            return d.name;
        });

    select.append("option")
        .attr("value", "-1")
        .text("Node");
    form.append("br");
}

function createCheckBoxWithLabel(name, label, formID) {

    var form = d3.select(formID);
    var checkBox = form.append("div");

    checkBox
        .append("input")
        .attr("class", "list-group")
        .attr("type", "checkbox")
        .attr("id", name)
        .attr("value", 0)
        .attr("name", name);
    ;
    checkBox
        .append("label")
        .attr("for", "id")
        .attr("class", "list-group")
        .text(label)
    ;


}

function drawMapDiagram(divId, chartConfig, dataTable) {   //add this
                                                           //Width and height
    var w = chartConfig.chartWidth;
    var h = chartConfig.chartHight;

    //prepare the dataset (all plot methods should use { "data":dataLine, "config":chartConfig } format
    //so you can use util methods
    var dataset = dataTable.data.map(function (d, i) {
        return {"data": d, "config": chartConfig, "name": dataTable.metadata.names[i]}
    });

    var tempArray = [];
    var mainArray = [];

    var locIndex = dataset[0].config.mapLocation;
    var pColIndex = dataset[0].config.pointColor;
    var pSizIndex = dataset[0].config.pointSize;
    tempArray.push(dataset[locIndex].name, dataset[pColIndex].name, dataset[pSizIndex].name);
    mainArray.push(tempArray);

    for (var counter = 0; counter < dataset.length; counter++) {
        tempArray = [];
        tempArray.push(dataset[counter].data[locIndex], dataset[counter].data[pColIndex], dataset[counter].data[pSizIndex]);
        mainArray.push(tempArray);
    }

    var mainStrArray = [];

    for (var i = 0; i < mainArray.length; i++) {
        var tempArr = mainArray[i];
        var str = '';
        for (var j = 1; j < tempArr.length; j++) {
            str += mainArray[0][j] + ':' + tempArr[j] + ' , '
        }
        str = str.substring(0, str.length - 3);
        str = mainArray[i][0].toUpperCase() + "\n" + str;
        tempArray = [];
        tempArray.push(mainArray[i][0]);
        tempArray.push(str);
        mainStrArray.push(tempArray);
    }
    ;

    document.getElementById('chart_div').setAttribute("style", "width: " + w + "px; height: " + h + "px;");

    update(mainStrArray, mainArray);

}

function clearBox(elementID) {                        //add this
    var div = document.getElementById(elementID);
}

var mode = 'markers';
var selecter = '<option value="5">' + 'dodan' + '</option>';
var regionO = 'world';
LoadMap();

function LoadMap() {
    google.load('visualization', '1', {'packages': ['map', 'geochart']});
}

function update(arrayStr, array) {

    var dropDown = document.getElementById("mapType");        //select dropdown box Element
    var option = dropDown.options[dropDown.selectedIndex].text;     //get Text selected in drop down box to the 'Option' variable

    var dropDownReg = document.getElementById("regionType");        //select dropdown box Element
    regionO = dropDownReg.options[dropDownReg.selectedIndex].value;     //get Text selected in drop down box to the 'Option' variable


    if (option == 'Satellite Map') {
        mode = 'satellite';
        drawMap(arrayStr);

    }
    if (option == 'Regions Chart') {
        mode = 'regions'
        drawMarkersMap(array);
    }
    if (option == 'Markers Chart') {
        mode = 'markers'
        drawMarkersMap(array);
    }
    if (option == 'Terrain Map') {
        mode = 'terrain';
        drawMap(arrayStr);
    }
    if (option == 'Normal Map') {
        mode = 'normal';
        drawMap(arrayStr);
    }
}


function drawMap(array) {
    var data = google.visualization.arrayToDataTable(array
        // ['City', 'Population'],
        // ['Bandarawela', 'Bandarawela:2761477'],
        // ['Jaffna', 'Jaffna:1924110'],
        // ['Kandy', 'Kandy:959574']
    );

    var options = {showTip: true, useMapTypeControl: true, mapType: mode};

    var map = new google.visualization.Map(document.getElementById('chart_div'));
    map.draw(data, options);
}
;

function drawMarkersMap(array) {
    var data = google.visualization.arrayToDataTable(array);

    var options = {
        region: regionO,
        displayMode: mode,
        colorAxis: {colors: ['red', 'blue']},
        magnifyingGlass: {enable: true, zoomFactor: 3.0},
        enableRegionInteractivity: true,
        //legend:{textStyle: {color: 'blue', fontSize: 16}}
    };

    var chart = new google.visualization.GeoChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}
;


function drawLineChart(divId, chartConfig, dataTable) {

    var w = chartConfig.chartWidth;     //Width and height and margins
    var h = chartConfig.chartHight;
    var margin = {top: 20, right: 80, bottom: 30, left: 50};

    var dataSet = dataTable.data.map(function (d) { //extract dataset
        return {"data": d, "config": chartConfig}
    });

    var xAxisID = dataSet[0].config.xAxisData;              //Identifying the Column number corresponding to the selected fields from the form
    var yAxisID = dataSet[0].config.yAxisData;
    var yAxis2ID = dataSet[0].config.yAxis2Data;
    var yAxis3ID = dataSet[0].config.yAxis3Data;

    var xAxisName = dataTable.metadata.names[xAxisID];                    //Identify Column Names of the columns selected from the form
    var yAxisName = dataTable.metadata.names[yAxisID];
    var yAxis2Name = dataTable.metadata.names[yAxis2ID];
    var yAxis3Name = dataTable.metadata.names[yAxis3ID];

    var columnNames = [xAxisName, yAxisName, yAxis2Name, yAxis3Name];

    dataSet.sort(function (a, b) {                             //sort the data set with respect to the x coordinates
        return a.data[xAxisID] - b.data[xAxisID];
    });

    var data = [];//empty array to load the selected data and organize in the required format
    for (var i = 0; i < dataSet.length; i++) {
        data.push({
            key: dataSet[i].data[xAxisID],      //x axis data
            y1: dataSet[i].data[yAxisID],       //y axis 1 data
            y2: dataSet[i].data[yAxis2ID],      //y axis 2 data
            y3: dataSet[i].data[yAxis3ID]       //y axis 3 data
        });
    }

    var svgID = divId + "_svg";     //svg container in which the chart shall be drawn
    d3.select(svgID).remove();      //Remove current SVG if it is already there

    var svg = d3.select(divId)      //Create SVG element
        .append("svg")
        .attr("id", svgID.replace("#", ""))
        .attr("width", w + 100)     //width
        .attr("height", h + 50)     //height
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");    //move to the middle of the screen in given dimensions

    svg.append("rect")              //a colored rectangle to decorate the chart
        .attr("x", 0).attr("y", 0)
        .attr("width", w).attr("height", h)     //width and height
        .attr("fill", "rgba(222,235,247, 0.5)") //color

    var dropDown = document.getElementById("interpolateOp");        //select dropdown box Element
    var option = dropDown.options[dropDown.selectedIndex].text;     //get Text selected in drop down box to the 'Option' variable
    var mode=option;    //interpolation mode(linear, basis, step before, step after, cardinal etc

    var ordinal = d3.scale.ordinal();   //scale to map y coordinates

    var x = d3.scale.linear()           //scale for x axis
        .range([0, w]);

    var y = d3.scale.linear()           //scale for y axis
        .range([h, 0]);

    var xAxis = d3.svg.axis()           //define x axis
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()           //define y axis
        .scale(y)
        .orient("left");

    var line = d3.svg.line()            //svg element to connect the coordinates as a path
        .x(function (d) {
            return x(d.key);            //scale x coordinates
        })
        .y(function (d) {
            return y(d.value);          //scale y coordinates
        });

    ordinal.domain(d3.keys(data[0]).filter(function (d) {
        return d !== "key";                                   //get key list as the scale domain except the one which is exactly "key" as it should be the x variable set
    }));

    x.domain(d3.extent(data, function (d) {
        return d.key;                                         //define the domain of x scale
    }));

    var graphs = ordinal.domain().map(function (name) {          //organize data in the format, {name,{key,value}}, {key,value}-values
        return {
            name: name,
            values: data.map(function (d) {
                return {key: d.key, value: +d[name]};
            })
        };
    });

    y.domain([          //define the domain of y scale i.e- minimum value of all y coordinates to max of all y coordinates
        d3.min(graphs, function (c) {
            return d3.min(c.values, function (v) {
                return v.value;
            });
        }),
        d3.max(graphs, function (c) {
            return d3.max(c.values, function (v) {
                return v.value;
            });
        })
    ]);

    svg.append("g")         //append x axis to the chart and move(translate to the bottom
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .append("text")         //append the label for the x axis
        .attr("x", w)       //move to the right hand end
        .attr("y", 25)      //set as -10 to move on top of the x axis
        .style("text-anchor", "end")
        .style("font-weight", "bold")
        .text(columnNames[0]);

    svg.append("g")             //append y axis
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")         //y axis label
        .attr("transform", "rotate(-90)")   //rotate 90 degrees
        .attr("y", 6)
        .attr("dy", ".71em")    //distance from y axis to the label
        .style("text-anchor", "end")
        .style("font-weight", "bold")
        .text("Value");

    var graph = svg.selectAll(".graph")     //create graphs for the data set
        .data(graphs)
        .enter().append("g")
        .attr("class", "label");    //change text style

    graph.append("path")                    //add path to the graphs
        .attr("class", "line")
        .attr("d", function (d) {
            return line.interpolate(mode)(d.values);    //interpolate in given mode and render line
        })
        .style("stroke", function (d, i) {
            return getColor(i % 4)              //get different colors for each graph
        });

    graph.append("text")
        .datum(function (d) {       //to bind data to a single svg element
            return {name: d.name, value: d.values[d.values.length - 1]};
        })
        .attr("transform", function (d) {     //show the label of each graph at the end of each ones last value coordinate
            return "translate(" + x(d.value.key) + "," + y(d.value.value) + ")";
        })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function (d, i) {
            return columnNames[i + 1];
        });

    function getColor(count) {  //returns different colors for each data set

        //Select colors from each color picker Element
        var c1 = document.getElementById("color1");
        var c2 = document.getElementById("color2");
        var c3 = document.getElementById("color3");
        var c4 = document.getElementById("color4");

        count = count % 4;
        if (count == 0)
            return "#" + c1.color;
        if (count == 1)
            return "#" + c2.color;
        if (count == 2)
            return "#" + c3.color;
        if (count == 3)
            return "#" + c4.color;
        else
            return d3.rgb(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));  //random color for 5th chart onwards
    }
}