//Width and height
const margin        = {top: 10, right: 10, bottom: 10, left: 10};
const padding       = 30;
const width         = window.innerWidth;
const height        = window.innerHeight;

const mapWidth      = width / 4 * 2.7;
const mapHeight     = height ;

const graphWidth    = width  / 5 * 1.1;
const graphHeight   = height / 5 * 4;


let tooltip = d3.select("body").append("div").attr("id", "tooltip");

const map = new Map();

//Create SVG element : graph
let graph = d3.select("#graph")
            .append("svg")
            .attr("width", graphWidth)
            .attr("height", graphHeight);

// Define scales range
let timeScale       =   d3.scaleTime().range([ padding, graphHeight - padding ]);
let fatalitiesScale =   d3.scaleLinear().range([ 0.5 , 3 ]);
let crashesScale    =   d3.scaleLinear().range([ padding , graphWidth - padding]);

var pathname = document.location.origin + document.location.pathname;
//Load in GeoJSON data
d3.json(pathname+"/data/map.geo.json", function(error,data) {
    if (error) throw error;
    //Bind data and create one path per GeoJSON feature
    map.storeMap(data);
})

function toogleMap(checkboxElem) {
  if (checkboxElem.checked) {
    map.hideMap();
  } else {
    map.hideMap();
  }
}


let timeline_events = events[0];
let timeline_periods = periods;

//Load airplane crashes data
d3.csv(pathname + "/data/aircrashes2.csv", function(error, data) {
    if (error) throw error;

    // Define scales domain
    const fatalities_max = d3.max(data, d => d["Fatalities"]);
    fatalitiesScale.domain( [ 0, fatalities_max ]);

    map.storeCrashes(data);

    const date_min = new Date( d3.min(data, d => new Date(d["Date"])));
    const date_max = new Date( d3.max(data, d => new Date(d["Date"])));
    date_min.setFullYear(date_min.getFullYear()-2);
    date_max.setFullYear(date_max.getFullYear()+1);
    timeScale.domain( [date_min, date_max] );

    let crashesGroupByYear = d3.nest()
        .key( function(d){
            return new Date(d.Date).getFullYear() })
        .rollup(function(d) {
            return d3.sum(d, function() { return 1; });
    }).entries(data)

    const crashes_max = d3.max(crashesGroupByYear, d => d.value );
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
    const xAxis = d3.axisBottom( crashesScale )
                    .ticks( 5 );
    const yAxis = d3.axisLeft( timeScale )
            .tickFormat( d3.timeFormat("%Y") );

    graph.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + padding + ")")
        .call(xAxis)
        .selectAll("text") // Rotate labels
        .style("text-anchor", "end")
        .attr("dx", ".5em")
        .attr("dy", "-1em");

    graph.append("g")
        .attr("class", "yaxis")
         .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis)
        .selectAll("text") // Rotate labels
        .style("text-anchor", "end")
        .attr("dy", ".15em")
        .selectAll(".tick")
        .classed("tick", d => new Date( d["Date"] ) );


    let brush = d3.brushY()
            .extent([[padding, padding], [ graphWidth - padding,  graphHeight - padding ]])
            .on("start brush", clearBrushedCircles )
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
            .attr("cx", d => crashesScale( d.value ) + 1 )
            .attr("cy", d => timeScale( new Date( d.key, 1, 1 ) ) )
            .attr("r", 1)
            .attr("class", "non_brushed")
        });
    let circles = graph.selectAll('circle');


    // Display additional informations on timeline
    let date_events = Object.keys(timeline_events);

    graph.selectAll("timeline_bars")
            .data(timeline_periods)
            .enter()
            .append("rect")
            .attr("class", "event")
            .attr("x", padding - padding / 5 )
            .attr("y", d => timeScale( new Date(d.begin , 1, 1) ) )
            .attr("width", padding / 5 )
            .attr("height", d => timeScale( new Date(d.end - d.begin , 1, 1) ) )
            .style("fill", "#999")
            .on("mouseover", function(){
                document.body.style.cursor = "pointer";
            })
            .on("mouseout", function(){
                document.body.style.cursor = "default";
            })
            .on('click', function(d) {
                // Clean highlighted events and highlight selected event
                Array.from( document.getElementsByClassName("event") ).map( e => e.style.fill = "#999");
                d3.select(this).style("fill", "red");
                // Display event details in the history pane
                document.getElementById("text").innerHTML = d.begin + " - " + d.end + "<BR>" + d.event;
           });

        graph.selectAll("timeline_circle")
            .data(date_events)
            .enter()
            .append("circle")
            .attr("class", "event")
            .attr("cx", function() {
                return padding-padding / 10;
            })
            .attr("cy", d => timeScale( new Date(d, 1, 1) ) )
            .attr("r", padding / 10)
            .style("fill", "#999")
            .style("stroke", "#000")
            .on("mouseover", function(){
                document.body.style.cursor = "pointer";
            })
            .on("mouseout", function(){
                document.body.style.cursor = "default";
            })
            .on('click', function(d) {
                // Clean highlighted events and highlight selected event
                Array.from( document.getElementsByClassName("event") ).map( e => e.style.fill = "#999");
                d3.select(this).style("fill", "red");
                // Display event details in the history pane
                document.getElementById("text").innerHTML = d + "<BR>" + timeline_events[d];
                
           });

    function isBrushed(brush_coords, cy) {
         let yo = brush_coords[0],
             y1 = brush_coords[1];

        return yo <= cy && cy <= y1;
    }


    function clearBrushedCircles(){
        circles.attr("class", "non_brushed");
    }

    function hightlightCircles() {
        brush_coords = d3.brushSelection(this);
        clearBrushedCircles();
        circles.filter(function (){
                   var cy = d3.select(this).attr("cy");

                   return isBrushed(brush_coords, cy);
               })
               .attr("class", "brushed");
       filterCrashes();
    }

    function filterCrashes (){
        let s = d3.event.selection || timeScale.range();
        currentRange = (s.map(x => new Date(timeScale.invert(x)).getFullYear()));
        map.updateRange(currentRange);
    }

});



d3.select('#map').on('mousemove', function(){
    var mouseX = d3.event.layerX || d3.event.offsetX;
    var mouseY = d3.event.layerY || d3.event.offsetY;
    map.highlightCrash(mouseX, mouseY);
});
 d3.select('#map').on('click', function() {
    var mouseX = d3.event.layerX || d3.event.offsetX;
    var mouseY = d3.event.layerY || d3.event.offsetY;
    map.showTooltip(mouseX, mouseY);
});
