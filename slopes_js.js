var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
};

var mouseOrig;
var anglesOrig = [3, -54.25, -3];
var anglesCurr = [3, -54.25, -3];
var zoomCurr = 3000;
var zoomMin = 30;
var zoomMax = 2500;
var mSc = 8; // mouse scale for rotations
var zoomFac = 150; // factor for zoom sensitivity (higher = less sensitive)

var width = 400 - margin.left - margin.right; // base number needs to match wrapper
var height = 500 - margin.top - margin.bottom;

var projection = d3.geoOrthographic()
//var projection = d3.geoConicEqualArea()
//var projection = d3.geoMercator()
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
var url1 = "https://raw.githubusercontent.com/domwakeling/UK-ski-slopes-map/master/uk110m.json";
var url2 = "https://raw.githubusercontent.com/domwakeling/UK-ski-slopes-map/master/skislopes.json";

d3.queue(2)
    .defer(d3.json, url1)
    .defer(d3.json, url2)
    .await(function(error, topology, slopes) {
        if (error) throw error;
        renderMap(topology, slopes);
    });

function renderMap(topology, slopes) {
	console.log(topology.features);
    g.selectAll("path.country")
//        .data(topojson.feature(topology, topology.objects.countries).features)
//		.data(topojson.feature(topology, topology).features.geometry)
		.data(topology.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path);

//    chart.on("mousedown", mouseDown)
//        .on("mousewheel", zoomed);
//	chart.on("mousewheel", zoomed);

//    d3.select(window)
//        .on("mousemove", mouseMoved)
//        .on("mouseup", mouseUp);

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
            var slopeObj = circle.radius(1).center(d.geometry.coordinates)();
            slopeObj.name = d.properties.name;
            slopeObj.slopeURL = d.properties.slopeURL;
            return slopeObj;
        })
        .attr("class", "slopes")
        .attr("d", path)
        .on("mouseover", function(d) {
            var str = d.name + "<br />" + d.slopeURL;
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


//function zoomed() {
//    zoomCurr *= (zoomFac + d3.event.deltaY) / zoomFac;
//    zoomCurr = Math.min(zoomMax, Math.max(zoomMin, zoomCurr));
//    projection.scale(zoomCurr);
//    refresh();
//    d3.event.preventDefault;
//}

function mouseDown() {
    mouseOrig = [d3.event.pageX, d3.event.pageY];
    console.log("orig:", anglesOrig, "curr:", anglesCurr)
    anglesOrig = [anglesCurr[0], anglesCurr[1]];
    d3.event.preventDefault();
}

function mouseMoved() {
    if (mouseOrig) {
        var mouseCurr = [d3.event.pageX, d3.event.pageY];
        anglesCurr = [anglesOrig[0] - (mouseOrig[0] - mouseCurr[0]) / mSc, anglesOrig[1] - (mouseCurr[1] - mouseOrig[1]) / mSc];
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
