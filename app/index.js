
//Width and height
var w = 800;
var h = 500;

//Define map projection
var projection = d3.geoMercator()
                    .translate([w/2, h/2])
                    .scale([100]);

//Define default path generator
var path = d3.geoPath()
            .projection(projection);;

//Define quantize scale to sort data values into buckets of color
var color = d3.scaleQuantize()
                .range(["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);


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
           .attr("r", 5)
           .style("fill", "yellow")
           .style("opacity", 0.75);

    });


});
