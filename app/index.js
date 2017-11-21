//Width and height
const width = 960;
const height = 500;
const padding = 50;
const margin = {top: 10, right: 30, bottom: 30, left: 30};

const active = d3.select(null);


//Define map projection
var projection = d3.geoNaturalEarth1() // updated for d3 v4
    .scale(200)
    .translate([width / 2, height / 2]);

let map;
let tooltip;




map = new Map();
map.setUp();
/* *************************************************** */
// Functions to manage zooming and dragging on the map

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
    tooltip.style("display", "none");
}
/* **************************************************** */




//overwrite projection for tests
projection = d3.geoNaturalEarth1();

//Define default path generator
let path = d3.geoPath()
            .projection(projection);




//Create SVG element : graph
let graph = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height/3);

// Define scales range
let timeScale       =   d3.scaleTime().range([ padding, width - padding ]);
let fatalitiesScale =   d3.scaleLinear().range([ 0.5 , 3 ]);
let crashesScale    =   d3.scaleLinear().range([ height/3 - padding, padding ]);


function Map(){
    // Attributes
    this.tooltip
    this.zoom

    let canvas;
    let context;

    let custom;
    let svg;
    let g;
    let active = d3.select(null);



    // Constructor
    this.setUp = function(){


      var customBase = document.createElement('custom');
	    custom = d3.select(customBase); // replacement of SVG
      // canvas test

      canvas = d3.select("body").append("canvas")
          .attr("width", width)
          .attr("height", height)
          .on("click", stopped, true);
      context = canvas.node().getContext("2d");

      //  end canvas test

        svg = d3.select("body")
            .append("svg")
            .attr("class","map")
            .attr("width", width)
            .attr("height", height)
            .on("click", stopped, true);



        svg.append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height);
            //.on("click", this.reset);

        g = svg.append("g");

        zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);


        svg.call(zoom);

        /*this.country = this.map.append("g").attr('class','kinder');

        //this.map.call(zoom);
        zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", map.zoomed2);
        this.map.call(zoom)

        //this.map.call(this.zoom);*/

        console.log("inside map");
    }

    function zoomed() {
        g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        g.attr("transform", d3.event.transform); // updated for d3 v4
    }

    // Interal functions
    function reset(that) {

        const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed(this));

        console.log("inside reset")
        console.log(that.zoom)
        that.map.transition()
            .duration(750)
            .call( zoom.transform, d3.zoomIdentity );
    }
    function reset() {
      active.classed("active", false);
      active = d3.select(null);

      svg.transition()
          .duration(750)
          // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
          .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
    }
    function zoomed() {
      g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
      // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
      g.attr("transform", d3.event.transform); // updated for d3 v4
    }

    function clicked(d) {
      if (active.node() === this) return reset();
      active.classed("active", false);
      active = d3.select(this).classed("active", true);

      var bounds = path.bounds(d),
          dx = bounds[1][0] - bounds[0][0],
          dy = bounds[1][1] - bounds[0][1],
          x = (bounds[0][0] + bounds[1][0]) / 2,
          y = (bounds[0][1] + bounds[1][1]) / 2,
          scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
          translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg.transition()
          .duration(750)
          // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
          .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
    }


    // Functions
    this.drawTest = function(data){
  		context.clearRect(0, 0, width, height);

      var join = custom.selectAll('custon.circle').data(data);

      var enterSel = join.enter()
			.append('custom')
			.attr('class', 'circle')
			.attr('x', function(d,i){
				return projection([d.lng, d.lat])[0];
			})
			.attr('y', function(d,i){
				return projection([d.lng, d.lat])[1];
			})
			.attr('r', function(d,i){
				return 3;
			});

  		var elements = custom.selectAll('custom.circle');
  		elements.each(function(d,i){
  			var node = d3.select(this);
  			context.fillStyle = 'steelblue';
  			context.beginPath();
  			context.arc(node.attr('x'), node.attr('y'), node.attr('r'), 0, 2*Math.PI);
  			context.fill();
  		})
    }

    this.drawMap = function(data){

      g.selectAll("path")
          .data(topojson.feature(data, data.objects.countries).features)
        .enter().append("path")
          .attr("d", path)
          .attr("class", "feature")
          .on("click", clicked);

      g.append("path")
          .datum(topojson.mesh(data, data.objects.countries, function(a, b) { return a !== b; }))
          .attr("class", "mesh")
          .attr("d", path);

    }

    this.drawCrashes = function(data){

        g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            //.attr("cx", d => d.lng)
            //d => projection([d.lng, d.lat])[0])
            //.attr("cy",d=> d.lat )
            //d => projection([d.lng, d.lat])[1])
            //.attr("r", "3px")
            .attr("r", 3)
            .attr("transform", function(d) {return "translate(" + projection([d.lng, d.lat]) + ")"})
            .style("fill", "red")
            .style("opacity", 0.7);
            /*.on("click", function(d){
                tooltip
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px")
                    .style("display", "inline-block")
                    .html( (d.Date) + "<br>"
                        + (d.Location) + "<br>"
                        + "Operator : " + (d.Operator) + "<br>"
                        + "Fatalities : " + parseInt(d.Fatalities) + "/" + parseInt(d.Aboard))
                    .on("click", function(d){
                        tooltip.style("display", "none");
                    });

        })
        */
    }
}

/* **************************************************** */

//Load in GeoJSON data
d3.json("../world.geo.json-master/test2.json", function(error, json) {
    if (error) throw error;
    //Bind data and create one path per GeoJSON feature
    map.drawMap(json);

})


//Load airplane crashes data
d3.csv("/data/aircrashes1.csv", function(error, data) {
    if (error) throw error;

    // Show crashes on the map
    const fatalities_max = d3.max(data, d => d["Fatalities"]);
    fatalitiesScale.domain( [ 0, fatalities_max ]);
    map.drawTest(data);
    map.drawCrashes(data);



     // Define scales DOMAIN
    const date_min = new Date( d3.min(data, d => new Date(d["Date"])));
    const date_max = new Date( d3.max(data, d => new Date(d["Date"])));
    date_max.setFullYear(date_max.getFullYear()+1);
    timeScale.domain( [date_min.getFullYear(), date_max.getFullYear()]);

    crashesGroupByYear = d3.nest()
    .key( function(d){
        return new Date(d.Date).getFullYear() })
    .rollup(function(d) {
        return d3.sum(d, function() { return 1; });
    }).entries(data)

    const crashes_max = d3.max(crashesGroupByYear, function(d) { return d.value; });
    crashesScale.domain([0, crashes_max ]);

    // Define tooltip for crash markers
    tooltip = d3.select("body").append("div").attr("class", "toolTip");


    // Draw axis
    const xAxis = d3.axisBottom( timeScale )
                    .tickFormat( d3.timeFormat("%Y") );
    graph.append("g")
        .attr("class", "axis axis--grid")
        .attr("transform", "translate(0," + (height/3 - padding) + ")")
        .call(xAxis)
        .selectAll("text") // Rotate labels
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .selectAll(".tick")
        .classed("tick--minor", function(d) { return new Date( d["Date"] ); });

    const yAxis = d3.axisLeft( crashesScale )
                    .ticks( 5 );
    graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    graph.append("g")
            .attr("class", "brush")
            .call(d3.brushX()
            .extent([[padding, 0], [width - padding, height/3 + padding]])
            .on("end", brushended));


    /***** Work on graph dot histogram *****/

    // 1. Prepare data for Graph
    // Filter by year
    console.log("avant data_by_year");

    // Create list of selected years
    const integerList = (min = 1900, max = 2000) => [...Array(max - min + 1)].map((x,i) => min + i);
    listYears = integerList(date_min.getFullYear(), date_max.getFullYear())

    // Keep only selected years
    let crashesByYear = [listYears.length];
    for (var i = 0; i < listYears.length; i++) {
      const current_year = listYears[i];
      let num_crashes = data.filter((elem) => new Date(elem.Date).getFullYear() == current_year).length;

      crashesByYear[i] = [current_year, num_crashes];
    }
    console.log(crashesByYear);

    // 2. Display
    console.log("je vais display des petits cercles");
    graph.selectAll("circle")  // <-- No longer "rect"
         .data(crashesByYear)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
                        console.log(d[0], timeScale(d[0]));
                        return timeScale(d[0]);
         })
         .attr("cy", function(d) {
                        return crashesScale(d[1]);
         })
        .attr("r", 5);

    console.log("j'ai display des petits cercles");


});

function brushended() {
  // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  // Get year range selected
  var s = d3.event.selection || timeScale.range();  // if no brush, we take full range
  console.log(s.map(x => new Date(timeScale.invert(x)).getFullYear()));
}




/*
Sources
Countries GeoJson : https://github.com/johan/world.geo.json
Geomapping : http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
Zooming and dragging : https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
ToolTip : https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7
Plot dots on a canvas : http://bl.ocks.org/Jverma/39f9b6d9d276d7c9232cd53fd91190c4

Brush: https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
Dot plot histogram: Fhttps://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69
*/
