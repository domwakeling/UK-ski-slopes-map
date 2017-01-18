var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
};

var mouseOrig;
var anglesOrig = [4.5, -54.65, -2]; //[3, -54.25, -3]
var anglesCurr = [4.5, -54.65, -2];
var zoomCurr = 3250;
var zoomMin = 3250;
var zoomMax = 10000;
var mSc = 20;  //mouse scale for rotations
var zoomFac = 200; // factor for zoom sensitivity (higher = less sensitive)

var width = 450 - margin.left - margin.right; // base number needs to match wrapper
var height = 550 - margin.top - margin.bottom;

//var projection = d3.geoOrthographic()
var projection = d3.geoMercator()
    .scale(zoomCurr)
    .clipAngle(90)
    .translate([width / 2, height / 2])
    .rotate(anglesCurr);

var path = d3.geoPath()
    .projection(projection);

var circle = d3.geoCircle();

var graticule = d3.geoGraticule();

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var g = chart.append("g");

// define tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// URLs for [1] a 110-m map stored in a GitHub repo and [2] the slopes data in a GitHub repo
var url1 = "https://raw.githubusercontent.com/domwakeling/UK-ski-slopes-map/master/world.json";
var url2 = "https://raw.githubusercontent.com/domwakeling/UK-ski-slopes-map/master/skislopes.json";

d3.queue(2)
    .defer(d3.json, url1)
    .defer(d3.json, url2)
    .await(function(error, topology, slopes) {
        if (error) {console.log(error); throw error;}
        renderMap(topology, slopes);
    });

function renderMap(topology, slopes) {
    g.selectAll("path.country")
		.data(topology.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path);

    chart.on("mousedown", mouseDown)
        .on("mousewheel", zoomed);

    d3.select(window)
        .on("mousemove", mouseMoved)
        .on("mouseup", mouseUp);

    renderslopes(slopes);
}

function renderslopes(slopes) {

    var slopesFixed = slopes.features.filter(function(d) {
        return d.geometry != null
    }); // remove anything with no coordinates

    g.selectAll("path.slopes")
        .data(slopesFixed)
        .enter()
        .append("path")
        .datum(function(d) {
            var slopeObj = circle.radius(0.07).center(d.geometry.coordinates)();
            slopeObj.name = d.properties.name;
            return slopeObj;
        })
        .attr("class", "slopes")
        .attr("d", path)
        .on("mouseover", function(d) {
	        var str = d.name;
            div.transition()
                .duration(200)
                .style("opacity", 1.0);
            div.html(str)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }).on("mouseout", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 0);
        });
}


function zoomed() {
	d3.event.preventDefault();
    zoomCurr *= (zoomFac + d3.event.deltaY) / zoomFac;
    zoomCurr = Math.min(zoomMax, Math.max(zoomMin, zoomCurr));
    projection.scale(zoomCurr);
    refresh();
}

function mouseDown() {
    mouseOrig = [d3.event.pageX, d3.event.pageY];
    anglesOrig = [anglesCurr[0], anglesCurr[1], anglesCurr[2]];
    d3.event.preventDefault();
}

function mouseMoved() {
    if (mouseOrig) {
        var mouseCurr = [d3.event.pageX, d3.event.pageY];
        anglesCurr = [anglesOrig[0] - (mouseOrig[0] - mouseCurr[0]) / mSc, anglesOrig[1] - (mouseCurr[1] - mouseOrig[1]) / mSc, anglesOrig[2]];
        projection.rotate(anglesCurr);
        refresh();
    }
}

function mouseUp() {
    if (mouseOrig) {
        mouseMoved();
        mouseOrig = null;
    }
}

function refresh() {
    chart.selectAll("path").attr("d", path);
}
