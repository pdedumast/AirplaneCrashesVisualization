class Map {
  // Attributes
  constructor(mapWidth, mapHeight) {
    this.dimension = {
      width: mapWidth,
      height: mapHeight
    }
    this.range = [1907, 2010];
    this.transform = {
      k: 1,
      x: 0,
      y: 0
    };

    // Map elements
    this.crashes;
    this.land;
    this.tooltip = d3.select("body").append("div").attr("id", "tooltip");

    this.projection = this._setProjection();

    this.canvas = this._setCanvas();
    this.hiddenCanvas = this._setHiddenCanvas();

    this.context = this.canvas.node().getContext("2d");
    this.hiddenContext = this.hiddenCanvas.node().getContext("2d");

    this.path = d3.geoPath().projection(this.projection).context(this.scontext);
    this.fatalitiesScale = d3.scaleLinear().range([0.5, 3]);

    this.colorToNode = {};

    this.nextCol = 1;

    this.color = {
      map: "#656565",
      crashes: "#ff5252",

      navy: "#001F3F",
      blue: "#0074D9",
      aqua: "#7FDBFF",
      teal: "#39CCCC",
      olive: "#3D9970",
      green: "#2ECC40",
      lime: "#01FF70",
      yellow: "#FFDC00",
      orange: "#FF851B",
      red: "#FF4136",
      fuchsia: "#F012BE",
      purple: "#B10DC9",
      maroon: "#85144B",
      white: "#FFFFFF",
      silver: "#DDDDDD",
      gray: "#AAAAAA",
      black: "#111111",

      null: "rgba(0,0,0,0)"
    }
  }



  _setProjection() {
    return d3.geoNaturalEarth1()
      .scale(240)
      .translate([this.dimension.width / 2, this.dimension.height / 2]);
  }
  _setCanvas() {
    return d3.select("#map").append("canvas")
      //.call(d3.zoom().scaleExtent([1, 8]).on("zoom", this.zoomCanvas))
      .attr("width", this.dimension.width)
      .attr("height", this.dimension.height);
  }

  // Hidden canvas link each crashes’s data to a unique color
  _setHiddenCanvas() {
    return d3.select("#map").append("canvas")
      .call(d3.zoom().scaleExtent([1, 8]).on("zoom", this.zoomCanvas))
      .classed('hiddenCanvas', true)
      .attr("width", this.dimension.width)
      .attr("height", this.dimension.height);
  }


  // Interal functions
  drawMap() {
    //console.log(this);
    this.context.beginPath();
    this.context.fillStyle = true ? this.color.map: this.color.null;
    this.path(this.land);
    this.context.fill();
  }

  drawCrashes(hidden) {
    let ctx = this.context;
    const range = this.range;
    this.crashes.each(function() {
      var node = d3.select(this);
      //context.fillStyle = 'steelblue';
      //console.log(node.attr('tags'))
      //if(node.attr('tags').indexOf('mechanical_fail')>=0)
      //console.log(node.attr('tags'))
      if (node.attr('year') > range[0] && node.attr('year') <= range[1]) {
        ctx.beginPath();
        ctx.fillStyle = hidden ? node.attr('fillStyleHidden') : node.attr('fillStyle');
        ctx.arc(node.attr('x'),
          node.attr('y'),
          node.attr('r'), 0, 2 * Math.PI);
        //ctx.globalAlpha = 0.7
        ctx.fill();
        ctx.closePath();
      }

    })
  }

  hideMap() {
    //display.map = !display.map;
    this.updateMap();
  }

  updateMap() {
    const dimension = this.dimension;
    const transform = this.transform;

    this.tooltip.style("display", "none");

    this.context.save();
    this.context.clearRect(0, 0, dimension.width, dimension.height);
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);

    this.hiddenContext.save();
    this.hiddenContext.clearRect(0, 0, dimension.width, dimension.height);
    this.hiddenContext.translate(transform.x, transform.y);
    this.hiddenContext.scale(transform.k, transform.k);

    this.drawMap();
    this.drawCrashes(false);
    this.drawCrashes(true);

    this.context.restore();
    this.hiddenContext.restore();
  }

  zoomCanvas(t) {

    this.transform = d3.event.transform;
    console.log(this)
    this.updateMap();
  }

  resetCanvas() {
    this.transform = d3.zoomIdentity;
    this.canvas.transition()
      .duration(750)
      .call(d3.zoom().transform, d3.zoomIdentity);
    this.updateMap();
  }

  storeMap(data) {
    this.land = topojson.feature(data, data.objects.land);
    this.drawMap();
  }
  genColor(d) {

    if (!d.hiddenCol) {
      let ret = [];
      let nextCol = 1;

      if (nextCol < 16777215) {
        ret.push(nextCol & 0xff); // R
        ret.push((nextCol & 0xff00) >> 8); // G
        ret.push((nextCol & 0xff0000) >> 16); // B

        nextCol += 1;
      }
      let col = "rgb(" + ret.join(',') + ")";
      d.hiddenCol = col;
      this.colorToNode[d.hiddenCol] = d;
    } // here we (1) add a unique color as property to each element and (2) map the color to the node in the colorToNode-dictionary
    return d.hiddenCol;

  }

  storeCrashes(data) {

    const fatalities_max = d3.max(data, d => d["Fatalities"]);
    this.fatalitiesScale.domain([0, fatalities_max]);

    const custom = d3.select(document.createElement('custom'));
    const join = custom.selectAll('custon.circle').data(data);
    const projection = this.projection;


    const enterSel = join.data(data).enter()
      .append('custom')
      .attr('class', 'circle')
      .attr('x', (d) => (projection([d.lng, d.lat])[0]))
      .attr('y', (d) => (projection([d.lng, d.lat])[1]))
      .attr('r', (d) => (fatalitiesScale(d.Fatalities)))
      .attr('year', (d) => (new Date(d.Date).getFullYear()))
      .attr('fillStyle', (d) => ("#ff5252"))
      .attr('tags', (d) => (d.tags))
      .attr('fillStyleHidden', (d) => (this.genColor(d)));

    const exitSel = join.exit()
      .transition()
      .attr('width', 0)
      .attr('height', 0)
      .remove();


    this.crashes = custom.selectAll('custom.circle');
    this.drawCrashes(false);
    this.drawCrashes(true);
  }

  updateRange(newRange) {
    this.range = newRange;
    this.updateMap(this);
  }

  // Picking --------------------------------------------------------



  // -----------------------------------------------------------------

  showTooltip(mouseX, mouseY) {

    // Pick the colors from where our mouse is then stringify it in a way our map-object can read it
    var col = this.hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
    var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';

    // Get the data from our map
    var nodeData = this.colorToNode[colKey];

    if (nodeData) {

      // Show the tooltip only when there is nodeData found by the mouse
      this.tooltip
        .style('display', 'inline-block')
        .style('opacity', 1)
        .style('top', d3.event.pageY + 5 + 'px')
        .style('left', d3.event.pageX + 5 + 'px')
        .html((nodeData.Date) + "<br>" +
          (nodeData.Location) + "<br>" +
          "Operator : " + (nodeData.Operator) + "<br>" +
          "Fatalities : " + parseInt(nodeData.Fatalities) + "/" + parseInt(nodeData.Aboard));
    } else {

      // when the mouse doesn't find nodeData hide tooltip and reset the map to default view
      this.tooltip.style('display', 'None');
      this.resetCanvas();

    }
  }
}
