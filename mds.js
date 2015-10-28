
var d3 = require('d3');
var numeric = require('numeric');

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

var mds = {};
exports = mds;

(function(mds) {
    "use strict";
    /// given a matrix of distances between some points, returns the
    /// point coordinates that best approximate the distances using
    /// classic multidimensional scaling
    mds.classic = function(distances, dimensions) {
        dimensions = dimensions || 2;

        // square distances
        var M = numeric.mul(-0.5, numeric.pow(distances, 2));

        // double centre the rows/columns
        function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
        var rowMeans = mean(M),
            colMeans = mean(numeric.transpose(M)),
            totalMean = mean(rowMeans);

        for (var i = 0; i < M.length; ++i) {
            for (var j =0; j < M[0].length; ++j) {
                M[i][j] += totalMean - rowMeans[i] - colMeans[j];
            }
        }

        // take the SVD of the double centred matrix, and return the
        // points from it
        var ret = numeric.svd(M),
            eigenValues = numeric.sqrt(ret.S);
        return ret.U.map(function(row) {
            return numeric.mul(row, eigenValues).splice(0, dimensions);
        });
    };

    /// draws a scatter plot of points, useful for displaying the output
    /// from mds.classic etc
    mds.drawD3ScatterPlot = function(element, xPos, yPos, labels, params) {
        params = params || {};
        var padding = params.padding || 32,
            w = params.w || document.documentElement.clientWidth - padding,
            h = params.h || document.documentElement.clientHeight - padding,
            xDomain = [Math.min.apply(null, xPos),
                       Math.max.apply(null, xPos)],
            yDomain = [Math.max.apply(null, yPos),
                       Math.min.apply(null, yPos)],
            pointRadius = params.pointRadius || 3;

        if (params.reverseX) {
            xDomain.reverse();
        }
        if (params.reverseY) {
            yDomain.reverse();
        }

        var xScale = d3.scale.linear().
                domain(xDomain)
                .range([padding, w - padding]),

            yScale = d3.scale.linear().
                domain(yDomain)
                .range([padding, h-padding]),

            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(params.xTicks || 7),

            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(params.yTicks || 7);

        var svg = element.append("svg")
                .attr("width", w)
                .attr("height", h);

        if (params.includeAxis) {
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + (h - padding + 2*pointRadius) + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (padding - 2*pointRadius) + ",0)")
                .call(yAxis);
        }

        var nodes = svg.selectAll("circle")
            .data(labels)
            .enter()
            .append("g");

        if (params.showImage) {
            var borderStyle = "fill:rgb(255,255,255);stroke-width:4;stroke:rgb(255,255,0)";
            var hiddenBorderStyle = "visibility:hidden;" + borderStyle;
            var rectSize = 80;
            var imageSize = 50;
            nodes.append("rect")
                .attr("class", "dataimageborder")
                .attr("width", rectSize)
                .attr("height", rectSize)
                .attr("x", function(d, i) { return xScale(xPos[i]); })
                .attr("y", function(d, i) { return yScale(yPos[i]); })
                .attr("style", hiddenBorderStyle);
            nodes.append("image")
                .attr("class", "dataimage")
                .attr("xlink:href", function(d) { return (d.image)? d.image:d; })
                .attr("width", imageSize)
                .attr("height", imageSize)
                .attr("x", function(d, i) { return xScale(xPos[i]); })
                .attr("y", function(d, i) { return yScale(yPos[i]); })
                .on("mouseover", function(){
                    d3.select(this).attr("width", rectSize).attr("height", rectSize);
                    d3.select(this.parentNode).moveToFront();
                    d3.select(this.parentNode).select("rect").attr("style",borderStyle);
                })
                .on("mouseout", function(){
                    d3.select(this).attr("width", imageSize).attr("height", imageSize);
                    d3.select(this.parentNode).select("rect").attr("style",hiddenBorderStyle);
                })
                .on("click", function(d,i){
                    if (d.onclick) {
                        d.onclick()
                    }
                });
        } else {
            nodes.append("circle")
                .attr("class", "datapoint")
                .attr("r", pointRadius)
                .attr("cx", function(d, i) { return xScale(xPos[i]); })
                .attr("cy", function(d, i) { return yScale(yPos[i]); })
                .on("click", function(d,i){
                        if (d.onclick) {
                            d.onclick()
                        }
                    });

            nodes.append("text")
                .attr("class", "label")
                .attr("text-anchor", "middle")
                .text(function(d) { return (d.label)? d.label:d; })
                .attr("x", function(d, i) { return xScale(xPos[i]); })
                .attr("y", function(d, i) { return yScale(yPos[i]) - 2 *pointRadius; });
        }
    };
}(mds));
