//Width and height
var width = 1000;
var height = 500;
var padding = 50;

//Define map projection
var projection = d3.geoMercator()
                    .translate([width/2, height/2])
                    .scale([120]);

//overwrite projection for tests
projection = d3.geoNaturalEarth1();

//Define default path generator
var path = d3.geoPath()
            .projection(projection);

//Create SVG element : map
var map = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

//Create SVG element : graph
var graph = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height/3);



//Load in GeoJSON data
d3.json("/world.geo.json-master/countries.geo.json", function(json) {

    //Bind data and create one path per GeoJSON feature
    map.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "#fcda94")
        .attr("class", "map");


    //Load airplane crashes data
    d3.csv("/data/aircrashes1.csv", function(data) {

         // Define scales
        var date_min = new Date( d3.min(data, d => d["Date"]));
        var date_max = new Date( d3.max(data, d => d["Date"]));
        date_max.setFullYear(date_max.getFullYear()+1);
        var timeScale = d3.scaleLinear()
                            .domain( [date_min, date_max ])
                            .range([padding, width - padding]);


        var fatalities_max = d3.max(data, d => d["Fatalities"]);
        var fatalitiesScale = d3.scaleLinear()
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
