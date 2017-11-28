//Width and height
const width = 1000;
const height = 500;
const padding = 50;
const margin = {top: 10, right: 30, bottom: 30, left: 30};

let tooltip

/* *************************************************** */
// Functions to manage zooming and dragging on the map
function reset() {
    map.transition()
      .duration(750)
      .call( zoom.transform, d3.zoomIdentity );
    tooltip.style("display", "none");
}

function zoomed() {
    country.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    country.attr("transform", d3.event.transform);
    map.selectAll("circle").attr("transform", d3.event.transform);
    tooltip.style("display", "none");
}
//Define map projection
let projection = d3.geoNaturalEarth1()
    .scale(180)
    .translate([width / 2, height / 2]);

let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
    tooltip.style("display", "none");
}
/* **************************************************** */


const map = new Map();


//Create SVG element : graph
let graph = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height/3);

// Define scales range
let timeScale       =   d3.scaleTime().range([ padding, width - padding ]);
let fatalitiesScale =   d3.scaleLinear().range([ 0.5 , 3 ]);
let crashesScale    =   d3.scaleLinear().range([ height/3 - padding, padding ]);

//Load in GeoJSON data
d3.json("/data/map.geo.json", function(error,data) {
    if (error) throw error;
    //Bind data and create one path per GeoJSON feature
    map.storeMap(data);
})

//Load airplane crashes data
d3.csv("/data/aircrashes1.csv", function(error, data) {
    if (error) throw error;
    
    

    // Define scales domain
    const fatalities_max = d3.max(data, d => d["Fatalities"]);
    fatalitiesScale.domain( [ 0, fatalities_max ]);
    
    map.storeCrashes(data);

    const date_min = new Date( d3.min(data, d => new Date(d["Date"])));
    const date_max = new Date( d3.max(data, d => new Date(d["Date"])));
    date_min.setFullYear(date_min.getFullYear()-1);
    date_max.setFullYear(date_max.getFullYear()+1);
    timeScale.domain( [date_min, date_max] );

    let crashesGroupByYear = d3.nest()
    .key( function(d){
        return new Date(d.Date).getFullYear() })
    .rollup(function(d) {
        return d3.sum(d, function() { return 1; });
    }).entries(data)

    const crashes_max = d3.max(crashesGroupByYear, function(d) { return d.value; });
    crashesScale.domain([0, crashes_max ]);


    let currentRange = timeScale.range;
    let crashesRadius = function(d) {
        if(!currentRange || new Date( d["Date"] ).getFullYear() < currentRange[0] || new Date( d["Date"]).getFullYear() > currentRange[1] ) {
            return 0;
        } else {
            return fatalitiesScale( d.Fatalities );
        }
    }




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

    let brush = d3.brushX()
            .extent([[padding, 0], [width - padding, height/3 + padding]])

            .on("brush", hightlightCircles)
            .on("end", filterCrashes);


    graph.append("g")
            .attr("class", "brush")
            .call(brush);


    /***** Work on graph dot histogram *****/
    // 1. Generate used array
    const generateArray1toN = (len=50) => Array.from(Array(len), (value, index) => index + 1);

    let prepare_graph_data = function(d) {
                                let new_dict = [];
                                for (let yr = 0; yr < d.length; yr ++) {
                                  new_dict.push({key : d[yr].key, value : generateArray1toN(d[yr].value)});
                                }
                                return new_dict;
                              }

    const data_graph = prepare_graph_data(crashesGroupByYear);


    // Generation
    graph.selectAll('circle')
          .data(data_graph)
          .enter().append('g')
            .each(function(d){
                d3.select(this).selectAll("circle")
                      .data(function (d) {
                        let dict = []; // create an empty array
                        for(value in d.value ){
                          dict.push({ key:   d.key, value: value });
                        }
                        return dict;
                      })
                      .enter().append('circle')
                .attr("cx", function(d,j) {
                        return timeScale( new Date( d.key, 1, 1 ) );
                    })
                    .attr("cy", function(d) {
                        return crashesScale( d.value );
                    })
                    .attr("r", 1)
                    .attr("class", "non_brushed")
            });
  let circles = graph.selectAll('circle');



    // // 2. Display
    // let circles = graph.selectAll("circle")
    //                     .data(crashesGroupByYear)
    //                     .enter()
    //                     .append("circle")
    //                     .attr("cx", function(d) {
    //                         return timeScale( new Date( d.key, 1, 1 ) );
    //                     })
    //                     .attr("cy", function(d) {
    //                         return crashesScale( d.value );
    //                     })
    //                     .attr("r", 4)
    //                     .attr("class", "non_brushed");




    function isBrushed(brush_coords, cx) {

         let x0 = brush_coords[0],
             x1 = brush_coords[1];

        return x0 <= cx && cx <= x1;
    }


    function hightlightCircles() {
        brush_coords = d3.brushSelection(this);

        circles.attr("class", "non_brushed");
        circles.filter(function (){
                   var cx = d3.select(this).attr("cx");

                   return isBrushed(brush_coords, cx);
               })
               .attr("class", "brushed");
    }

    function filterCrashes (){

        //tooltip.style("display", "none");
        
        let s = d3.event.selection || timeScale.range();
        currentRange = (s.map(x => new Date(timeScale.invert(x)).getFullYear()));
        map.updateRange(currentRange);
    }



});




/*
Sources
Countries GeoJson : https://github.com/johan/world.geo.json
Geomapping : http://chimera.labs.oreilly.com/books/1230000000345/ch12.html
Zooming and dragging : https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
ToolTip : https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7
Plot dots on a canvas : http://bl.ocks.org/Jverma/39f9b6d9d276d7c9232cd53fd91190c4

Brush:
- https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
- http://bl.ocks.org/feyderm/6bdbc74236c27a843db633981ad22c1b (Color)
- https://stackoverflow.com/questions/25656352/javascript-d3-js-initialize-brush-with-brush-extent-and-stop-data-from-spilling (Filter )
Dot plot histogram: Fhttps://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69
*/
