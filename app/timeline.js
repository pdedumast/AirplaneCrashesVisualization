/*    
    Display additional information on the timeline
*/
d3.json(pathname + "/data/timeline.json", function(error,dataset) {
    if (error) throw error;

    console.log("data timeline");
    console.log(dataset);

    graph.selectAll("text")
                   .data(dataset)
                   .enter()
                   .append("text")
                   .text(function(d) {
               console.log("lamaaaa");
                console.log("Date = " + d.date);
                console.log("Event = " + d.event);
                        return "Allo";
                   })
                   .attr("x", function(d) {
               console.log("x = " + timeScale(d.date));
                        return timeScale(3);
                   })
                   .attr("y", function(d) {
               console.log("y = " + 0);
                        return 0;
                   })
                   .attr("font-family", "sans-serif")
                   .attr("font-size", "11px")
                   .attr("fill", "red");
})
