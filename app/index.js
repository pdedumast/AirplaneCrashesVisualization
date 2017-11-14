//Width and height
const width = 1000;
const height = 500;
const padding = 50;
var margin = {top: 10, right: 30, bottom: 30, left: 30};


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



//Define map projection
let projection = d3.geoMercator()
                    .translate([width/2, height/2])
                    .scale([120]);

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
    this.map
    this.country
    this.tooltip
    this.zoom


    // Constructor
    this.setUp = function(){
        this.map = d3.select("body")
            .append("svg")
            .attr("class","map")
            .attr("width", width)
            .attr("height", height)
            .on("click", stopped, true);

        this.map.append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height);
            //.on("click", this.reset);

        this.country = this.map.append("g").attr('class','kinder');




        //this.map.call(zoom);
        zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", map.zoomed2);
        this.map.call(zoom)



        //this.map.call(this.zoom);

        console.log("inside map");
    }

    this.zoomed2 = function(element) {
        //d3.select(".map").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        d3.selectAll(".kinder").style("stroke-width", 1.5 / d3.event.transform.k + "px");
        d3.selectAll(".kinder").attr("transform", d3.event.transform); // updated for d3 v4
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


    // Functions
    this.drawMap = function(json){
        this.country.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", "#fcda94")
                .style('stroke', '#fcbf94')
                .style('stroke-width', '0.4')
                .on("click", reset);
    }

    this.drawCrashes = function(data){
        this.country.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => projection([d.lng, d.lat])[0])
            .attr("cy", d => projection([d.lng, d.lat])[1])
            .attr("r", d => 3)
                  //fatalitiesScale(d.Fatalities))
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
d3.json("/world.geo.json-master/countries.geo.json", function(error, json) {
    if (error) throw error;
    //Bind data and create one path per GeoJSON feature
    map.drawMap(json);

})


//Load airplane crashes data
d3.csv("/data/aircrashes1.csv", function(error, data) {
    if (error) throw error;
    // Show crashes on the map
    map.drawCrashes(data);


     // Define scales DOMAIN
    const date_min = new Date( d3.min(data, d => new Date(d["Date"])));
    const date_max = new Date( d3.max(data, d => new Date(d["Date"])));
    date_max.setFullYear(date_max.getFullYear()+1);
    timeScale.domain( [date_min, date_max]);


    const fatalities_max = d3.max(data, d => d["Fatalities"]);
    fatalitiesScale.domain( [ 0, fatalities_max ]);

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




/*
Sources
Countries GeoJson : https://github.com/johan/world.geo.json
Geomapping : http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
Zooming and dragging : https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
ToolTip : https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7

Brush: https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
Dot plot histogram: Fhttps://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69
*/
