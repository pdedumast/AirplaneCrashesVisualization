
//Width and height
var width = 800;
var height = 500;
var padding = 50; 

//Define map projection
var projection = d3.geoMercator()
                    .translate([width/2, height/2])
                    .scale([100]);

//Define default path generator
var path = d3.geoPath()
            .projection(projection);

//Define quantize scale to sort data values into buckets of color
var color = d3.scaleQuantize()
                .range(["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


//Load in GeoJSON data
d3.json("/world.geo.json-master/countries.geo.json", function(json) {

    //Bind data and create one path per GeoJSON feature
    svg.selectAll("path")
       .data(json.features)
       .enter()
       .append("path")
       .attr("d", path);
    
    //Load in cities data
    d3.csv("/data/aircrashes1.csv", function(data) {
        
         // Scale
        var date_min = new Date( d3.min(data, d => d["Date"]) , 1, 1);
        var date_max = new Date( d3.max(data, d => d["Date"]), 1, 1);
        date_max.setFullYear(date_max.getFullYear()+1);
        var timeScale = d3.scaleLinear()
                            .domain( [date_min, date_max ])
                            .range([padding, width - padding]);

        var fatalities_min = d3.min(data, d => d["Fatalities"]);
        var fatalities_max = d3.max(data, d => d["Fatalities"]);
        var fatalitiesScale = d3.scaleLinear()
                            .domain( [fatalities_min, fatalities_max ])
                            .range([0.5, 3.5]);

        svg.selectAll("circle")
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
               return fatalitiesScale( d.Fatalities );
           })
           .style("fill", "yellow")
           .style("opacity", 0.75);

    });


});
