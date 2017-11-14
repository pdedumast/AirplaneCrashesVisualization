//Width and height
const width = 1000;
const height = 500;
const padding = 50;
var margin = {top: 10, right: 30, bottom: 30, left: 30};

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
let timeScale = d3.scaleTime().range([padding, width - padding]);
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
        const date_min = new Date( d3.min(data, d => new Date(d["Date"])));
        const date_max = new Date( d3.max(data, d => new Date(d["Date"])));
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
                        + "Fatalities : " + parseInt(d.Fatalities) + "/" + parseInt(d.Aboard))
                    .on("click", function(d){
                        tooltip.style("display", "none");
                    });
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

        // *** Filter by year ***
        let year_min = 1920, year_max = 1925;

        // Create list of selected years
        const integerList = (min = 1900, max = 2000) => [...Array(max - min + 1)].map((x,i) => min + i);
        listYears = integerList(year_min, year_max)
        console.log(listYears);

        // Keep only selected years
        let crashesByYear = [listYears.length];
        for (var i = 0; i < listYears.length; i++) {
          const current_year = listYears[i];
          let num_crashes = data.filter((elem) => new Date(elem.Date).getFullYear() == current_year).length;

          crashesByYear[i] = {'Year': current_year,
                              'Crashes': num_crashes};
        }


        graph.append("g")
              .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");



        // Set up the binning parameters for the histogram
        var nbins = crashesByYear.length;

        var histogram = d3.histogram()
          .domain(timeScale.domain())
          // Freedman–Diaconis rule
          // .thresholds(d3.thresholdFreedmanDiaconis(data.map(function (d){ return d.Value}),
          //                                          Math.min.apply(null, data.map(function (d){ return d.Value})),
          //                                          Math.max.apply(null, data.map(function (d){ return d.Value}))))
          .thresholds(timeScale.ticks(nbins))
          .value(function(d) { return d.Crashes;} )

        // Compute the histogram
        var bins = histogram(crashesByYear);

        console.log(bins);

        // radius dependent of data length
        var radius = fatalitiesScale(crashesByYear.length - 1)/2;
        console.log("RADIUS " + radius);

        // bins objects
        var bin_container = graph.selectAll("g")
          .data(bins);

        bin_container.enter().append("g")
          // .attr("transform", function(d) { return "translate(" + (x(d.x0)+(x(d.x1)-x(d.x0))/2) + "," + y(data.length) + ")"; });

        // JOIN new data with old elements.
        var dots = bin_container.selectAll("circle")
          .data(function(d) {
            return d.map(function(data, i){return {"idx": i, "xpos": timeScale(d.x0)+(timeScale(d.x1)-timeScale(d.x0))/2};})
            });

        // EXIT old elements not present in new data.
        dots.exit()
            .attr("class", "exit");

        // UPDATE old elements present in new data.
        dots.attr("class", "update");

        // ENTER new elements present in new data.
        // var cdots = dots.enter().append("circle")
        dots.enter().append("circle")
          .attr("class", "enter")
          .attr("cx", function (d) {return d.xpos;})
          // .attr("cy", 0)
          .attr("cy", function(d) {
              return fatalitiesScale(d.idx)-radius; })
          // .attr("r", function(d) { return (d.length==0) ? 0 : radius; })
          .attr("r", 0)
          //.style("fill", "steelblue")
          .merge(dots)
          .on("mouseover", function(d) {
              d3.select(this)
                .style("fill", "red");
            })
            .on("mouseout", function(d) {
              d3.select(this)
                  .style("fill", "steelblue");
                tooltip.transition()
                     .duration(500)
                     .style("opacity", 0);
            })
          .transition()
            .duration(500)
            .attr("r", function(d) {
            return (d.length==0) ? 0 : radius; });
          // .style("fill", "black");;

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
Dot plot histogram: Fhttps://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69
*/
