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
            .attr("width", width)
            .attr("height", height)
            .on("click", stopped, true);
        
        this.map.append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height)
            .on("click", reset);
        
        this.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);
        
        this.map.call(zoom);
        
        this.country = this.map.append("g");
        
        console.log("inside map");
    }
    this.setUp();
    
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
        this.map.selectAll("circle")
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
    }
}