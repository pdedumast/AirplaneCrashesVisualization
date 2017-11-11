//Width and height
const width = 1000;
const height = 500;
const padding = 50;
let active = d3.select(null);

/* *************************************************** */
// Functions to manage zooming and dragging on the map
function reset() {
  active.classed("active", false);
  active = d3.select(null);

  map.transition()
      .duration(750)
      .call( zoom.transform, d3.zoomIdentity );
}

function zoomed() {
  country.style("stroke-width", 1.5 / d3.event.transform.k + "px");
  country.attr("transform", d3.event.transform);
}

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}
/* **************************************************** */


//Define map projection
let projection = d3.geoMercator()
                    .translate([width/2, height/2])
                    .scale([120]);

//overwrite projection for tests
projection = d3.geoNaturalEarth1();

//Define default path generator
let path = d3.geoPath()
            .projection(projection);

//Create SVG element : map
let map = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .on("click", stopped, true);
map.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);
let country = map.append("g");
map.call(zoom);


//Create SVG element : graph
let graph = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height/3);



//Load in GeoJSON data
d3.json("/world.geo.json-master/countries.geo.json", function(json) {

    //Bind data and create one path per GeoJSON feature
    country.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "#fcda94")
        .style('stroke', '#fcbf94')
        .style('stroke-width', '0.4')

    //Load airplane crashes data
    d3.csv("/data/aircrashes1.csv", function(data) {

         // Define scales
        const date_min = new Date( d3.min(data, d => d["Date"]));
        const date_max = new Date( d3.max(data, d => d["Date"]));
        date_max.setFullYear(date_max.getFullYear()+1);
        let timeScale = d3.scaleLinear()
                            .domain( [date_min, date_max ])
                            .range([padding, width - padding]);


        const fatalities_max = d3.max(data, d => d["Fatalities"]);
        const fatalitiesScale = d3.scaleLinear()
                            .domain( [ 0, fatalities_max ])
                            .range([ height/3 - padding, 0 ]);


        // Show crashes on the map
        map.selectAll("circle")
           .data(data)
           .enter()
           .append("circle")
           .attr("cx", function(d) {
               return projection([d.lng, d.lat])[0];
           })
           .attr("cy", function(d) {
               return projection([d.lng, d.lat])[1];
           })
           .attr("r", function(d) {
               return 0.5 + fatalitiesScale.invert( fatalitiesScale( d.Fatalities) ) / 50;
           })
           .style("fill", "red")
           .style("opacity", 0.75);


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

        const yAxis = d3.axisLeft( fatalitiesScale )
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


    });

    function brushended() {
        // TODO when brush
    }

});



/*
Sources 
Countries GeoJson : https://github.com/johan/world.geo.json
Geomapping : http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
Zooming and dragging : https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
*/