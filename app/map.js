function Map() {
    // Attributes
    const color = {
        map: "#656565",
        crashes: "#ff5252",
        null: "rgba(0,0,0,0)"
    }

    const dimension = {
        width: mapWidth,
        height: mapHeight
    }

    // Map elements
    let crashes;
    let land;
    let range;
    let transform;
    let display = {
      map:true
    }
    const projection = d3.geoNaturalEarth1()
        .scale(240)
        .translate([dimension.width / 2, dimension.height / 2]);

    // Canvas elements
    const canvas = d3.select("#map").append("canvas")
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomCanvas))
        .attr("width", dimension.width)
        .attr("height", dimension.height);

    const context = canvas.node().getContext("2d");

    // Hidden canvas link each crashes’s data to a unique color
    const hiddenCanvas = d3.select("#map").append("canvas")
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomCanvas))
        .classed('hiddenCanvas', true)
        .attr("width", dimension.width)
        .attr("height", dimension.height);

    const hiddenContext = hiddenCanvas.node().getContext("2d");

    // Picking --------------------------------------------------------

    // Map to track the color of nodes
    const colorToNode = {};

    // Function to create new colors for the picking
    let nextCol = 1;

    function genColor(){
        let ret = [];
        if(nextCol < 16777215){
          ret.push(nextCol & 0xff); // R
          ret.push((nextCol & 0xff00) >> 8); // G
          ret.push((nextCol & 0xff0000) >> 16); // B

          nextCol += 1;
        }
        let col = "rgb(" + ret.join(',') + ")";
        return col;
    }

    // -----------------------------------------------------------------

    const path = d3.geoPath().projection(projection).context(context);
    const fatalitiesScale = d3.scaleLinear().range([0.5, 3]);


    // Constructor
    this.setUp = function () {
        transform = {
            k: 1,
            x: 0,
            y: 0
        };

        range = [1907, 2010];
    }


    // Interal functions
    function drawMap() {
        context.beginPath();
        context.fillStyle = display.map ? color.map: color.null;
        path(land);
        context.fill();
    }

    function drawCrashes( canvas, hidden ) {
        let ctx = canvas.node().getContext("2d");
        crashes.each(function () {
            var node = d3.select(this);
            //context.fillStyle = 'steelblue';
            if (node.attr('year') > range[0] && node.attr('year') <= range[1]) {
                ctx.beginPath();
                ctx.fillStyle = hidden ? node.attr('fillStyleHidden') : node.attr('fillStyle');
                ctx.arc(node.attr('x'),
                    node.attr('y'),
                    node.attr('r'), 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
            }

        })
    }

    this.hideMap = function() {
      display.map = !display.map;
      updateMap();
    }

    function updateMap(){

        tooltip.style("display", "none");

        context.save();
        context.clearRect(0, 0, dimension.width, dimension.height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        hiddenContext.save();
        hiddenContext.clearRect(0, 0, dimension.width, dimension.height);
        hiddenContext.translate(transform.x, transform.y);
        hiddenContext.scale(transform.k, transform.k);

        drawMap();
        drawCrashes( canvas, false );
        drawCrashes( hiddenCanvas, true);

        context.restore();
        hiddenContext.restore();
    }

    function zoomCanvas() {
        transform = d3.event.transform;
        updateMap();
    }

    function resetCanvas(){
        transform = d3.zoomIdentity;
        canvas.transition()
          .duration(750)
          .call( d3.zoom().transform, d3.zoomIdentity );
        updateMap();
    }

    // Public functions
    this.storeMap = function (data) {
        land = topojson.feature(data, data.objects.land);
        drawMap();
    }

    this.storeCrashes = function (data) {

        const fatalities_max = d3.max(data, d => d["Fatalities"]);
        fatalitiesScale.domain([0, fatalities_max]);

        const custom = d3.select(document.createElement('custom'));
        const join = custom.selectAll('custon.circle').data(data);

        const enterSel = join.data(data).enter()
            .append('custom')
            .attr('class', 'circle')
            .attr('x', (d) => (projection([d.lng, d.lat])[0]))
            .attr('y', (d) => (projection([d.lng, d.lat])[1]))
            .attr('r', (d) => (fatalitiesScale(d.Fatalities)))
            .attr('year', (d) => (new Date(d.Date).getFullYear()))
            .attr('fillStyle', color.crashes )
            .attr('fillStyleHidden', function(d) {
                if (!d.hiddenCol) {
                    d.hiddenCol = genColor();
                    colorToNode[d.hiddenCol] = d;
                } // here we (1) add a unique color as property to each element and (2) map the color to the node in the colorToNode-dictionary
                return d.hiddenCol;
            });

        const exitSel = join.exit()
				.transition()
				.attr('width', 0)
				.attr('height', 0)
				.remove();


        crashes = custom.selectAll('custom.circle');
        drawCrashes( canvas, false );
        drawCrashes( hiddenCanvas, true );
    }

    this.updateRange = function (newRange) {
        range = newRange;
        updateMap();
    }

    this.setUp();

    this.showTooltip = function(mouseX,mouseY){

        // Pick the colors from where our mouse is then stringify it in a way our map-object can read it
        var col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
        var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';

        // Get the data from our map
        var nodeData = colorToNode[colKey];

        if (nodeData) {

            // Show the tooltip only when there is nodeData found by the mouse
           tooltip
                .style('display','inline-block')
                .style('opacity', 1)
                .style('top', d3.event.pageY + 5 + 'px')
                .style('left', d3.event.pageX + 5 + 'px')
                .html( (nodeData.Date) + "<br>"
                    + (nodeData.Location) + "<br>"
                    + "Operator : " + (nodeData.Operator) + "<br>"
                    + "Fatalities : " + parseInt(nodeData.Fatalities) + "/" + parseInt(nodeData.Aboard));
        } else {

            // when the mouse doesn't find nodeData hide tooltip and reset the map to default view
            tooltip.style('display', 'None');
            resetCanvas();

        }
    }
    this.highlightCrash = function(mouseX,mouseY){
        
        // Pick the colors from where our mouse is then stringify it in a way our map-object can read it
        var col = hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
        var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';

        // Get the data from our map
        var nodeData = colorToNode[colKey];

        if (nodeData) {
            document.body.style.cursor = 'pointer';
        } else {
             document.body.style.cursor = 'default';
        }
    }

}
