/*    
    Display additional information on the timeline
*/
d3.json(pathname + "/data/timeline.json", function(error,dataset) {
    if (error) throw error;

    graph.selectAll("text")
                   .data(dataset)
                   .enter()
                   .append("text")
                   .text(function(d) {
                        return d.event;
                   })
                   .attr("x", function(d) {
                        return 150;
                   })
                   .attr("y", function(d) {
                        return timeScale( d.date ) ;
                   })
                   .attr("font-family", "sans-serif")
                   .attr("font-size", "11px")
                   .attr("fill", "white")
                    .attr("text-anchor", "middle");
})
