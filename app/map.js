function Map() {
    // Attributes
    const color = {
        map: "#656565",
        crashes: "#ff5252"
    }

    const dimension = {
        width: 900,
        height: mapHeight
    }

    // Map elements
    let crashes;
    let land;
    let range;
    let transform;
    const projection = d3.geoNaturalEarth1().scale(200).translate([dimension.width / 2, dimension.height / 2]);

    // Canvas elements
    const canvas = d3.select("#map").append("canvas")
        .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomCanvas))
        .attr("width", dimension.width)
        .attr("height", dimension.height);

    const context = canvas.node().getContext("2d");

    const path = d3.geoPath().projection(projection).context(context);
    const fatalitiesScale = d3.scaleLinear().range([0.5, 3]);


    // Constructor
    this.setUp = function () {
        transform = {
            k: 1,
            x: 0,
            y: 0
        };

        range = [1908, 2010];
    }


    // Interal functions
    function drawMap() {
        context.beginPath();
        context.fillStyle = color.map;
        path(land);
        context.fill();
    }

    function drawCrashes() {
        crashes.each(function () {
            var node = d3.select(this);
            //context.fillStyle = 'steelblue';
            if (node.attr('year') > range[0] && node.attr('year') < range[1]) {
                context.beginPath();
                context.fillStyle = color.crashes;
                context.arc(node.attr('x'),
                    node.attr('y'),
                    node.attr('r'), 0, 2 * Math.PI);
                context.fill();
                context.closePath();
            }

        })
    }
    
    function updateMap(){
        context.save();
        context.clearRect(0, 0, dimension.width, dimension.height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        drawMap();
        drawCrashes();

        context.restore();
    }

    function zoomCanvas() {
        transform = d3.event.transform;
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
            .attr('year', (d) => (new Date(d.Date).getFullYear()));

        crashes = custom.selectAll('custom.circle');

        drawCrashes();
    }
    
    this.updateRange = function (newRange) {
        range = newRange;
        updateMap();
    }

    this.setUp();
}