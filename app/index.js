//Width and height
const width = 1000;
const height = 500;
const padding = 50;

console.log("Mathmout est dans sa douche !!");
let tooltip

/* *************************************************** */
// Functions to manage zooming and dragging on the map
function reset() {
  map.transition()
      .duration(750)
      .call( zoom.transform, d3.zoomIdentity );
}

function zoomed() {
    country.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    country.attr("transform", d3.event.transform);
    map.selectAll("circle").attr("transform", d3.event.transform);
}

let zoom = d3.zoom()
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

// Define scales range
let timeScale = d3.scaleLinear().range([padding, width - padding]);
let fatalitiesScale = d3.scaleLinear().range([ height/3 - padding, 0 ]);


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
        .on("click", reset);

    //Load airplane crashes data
    d3.csv("/data/aircrashes1.csv", function(data) {

         // Define scales DOMAIN
        const date_min = new Date( d3.min(data, d => d["Date"]));
        const date_max = new Date( d3.max(data, d => d["Date"]));
        date_max.setFullYear(date_max.getFullYear()+1);
        timeScale.domain( [date_min, date_max]);

        const fatalities_max = d3.max(data, d => d["Fatalities"]);
        fatalitiesScale.domain( [ 0, fatalities_max ]);


        // Define tooltip for crashes market
        tooltip = d3.select("body").append("div").attr("class", "toolTip");



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
                return 0.5 + fatalitiesScale.invert( fatalitiesScale( d.Fatalities) ) / 70;
            })
            .style("fill", "red")
            .style("opacity", 0.7)
            .on("click", function(d){
                tooltip
                  .style("left", d3.event.pageX + "px")
                  .style("top", d3.event.pageY + "px")
                  .style("display", "inline-block")

                  .html( (d.Date) + "<br>"
                        + (d.Location) + "<br>"
                        + "Operator : " + (d.Operator) + "<br>"
                        + "Fatalities : " + parseInt(d.Fatalities) + "/" + parseInt(d.Aboard));
        })


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

        // Filter by year
        console.log("avant data_by_year");

        // Create list of kept years
        const list_years = (min = 1900, max = 2000) => [...Array(max - min + 1)].map((x,i) => min + i);
        my_list_years = list_years(2010, 2015)
        console.log(my_list_years);

        // Keep only selected years
        const nested_data = data.filter((x) =>  new Date(x.Date).getFullYear() >= year_min && new Date(x.Date).getFullYear() <= year_max)

        // Sum fatalities over the years
        const nested_data_year =  nested_data.map
        console.log(new Date(nested_data[0].Date));

        console.log("après data_by_year");

    });

    function brushended() {
      // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      // Get year range selected
      var s = d3.event.selection || timeScale.range();  // if no brush, we take full range
      console.log(s.map(x => new Date(timeScale.invert(x)).getFullYear()));
    }

});



/*
Sources
Countries GeoJson : https://github.com/johan/world.geo.json
Geomapping : http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
Zooming and dragging : https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
ToolTip : https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7

Brush: https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
*/
