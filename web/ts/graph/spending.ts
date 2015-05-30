/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />

module Graph {
  export class Spending extends Utility.CbBase {

    protected d3GraphElement: D3._Selection<any>;
    private graphSvg: D3._Selection<any>;

    private width: number = 0;
    private height: number = 0;
    private marginPx: number = 8;
    private backdrop: D3._Selection<any>;

    constructor(private id: string) {
      super();

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();



//      var color = d3.scale.linear()
//        .domain([h - 100, 100])
//        .range(["hsl(180,100%,10%)", "hsl(210,100%,90%)"])
//        .interpolate(d3.interpolateHsl);

      var force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .size([this.width, this.height]);

      var nodes = force.nodes();


      this.backdrop = this.d3GraphElement.append("svg:rect")
        .attr('class','backdrop')
        .attr("width", this.width)
        .attr("height", this.height);

      force.on("tick", () => {
        //  var k = e.alpha * .1;
        //  nodes.forEach(function(node) {
        //    node.y += (node.cy - node.y) * k;
        //  });

        this.d3GraphElement.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });

      var p0;

      this.d3GraphElement.on("mousemove", function() {
        var p1 = d3.mouse(this);
//        console.log(p1);

//        var node = {
//          x: p1[0],
//          y: p1[1],
//          px: (p0 || (p0 = p1))[0],
//          py: p0[1],
//          cy: Math.random() * (h - 200) + 100
//        };

        p0 = p1;

        //        this.d3GraphElement.append("svg:circle")
        //          .data([node])
        //          .attr("cx", function(d) { return d.x; })
        //          .attr("cy", function(d) { return d.y; })
        //          .attr("r", 15)
        //          .style("fill", function(d) { return color(d.cy); })
        //          .transition()
        //          .delay(3000)
        //          .attr("r", 1e-6)
        //          .each("end", function() { nodes.shift(); })
        //          .remove();

//        nodes.push(node);
//        force.start();
      });




    }
    
    protected resize = (): void => {
      this.collectHeightWidth();

//      this.graphSvg
//        .attr("width", this.width + this.marginPx * 2)
//        .attr("height", this.height + this.marginPx * 2)
      //this.handleNewYears(null, 0);
      
      
      this.backdrop.attr("width", this.width/2)
        .attr("height", this.height/2);
    }

    
    protected collectHeightWidth = (): void => {
      this.width = parseInt(this.d3GraphElement.style("width")) - this.marginPx * 2;
      this.height = parseInt(this.d3GraphElement.style("height")) - this.marginPx * 2;
    }

  }
}