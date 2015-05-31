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
    private nodes: D3.Layout.GraphNodeForce[];
    private force: D3.Layout.ForceLayout;

    constructor(private id: string) {
      super();

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();



      var color = d3.scale.linear()
        .domain([this.height - 100, 100])
        .range(["hsl(180,100%,10%)", "hsl(210,100%,90%)"])
        .interpolate(d3.interpolateHsl);

      this.force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .size([this.width, this.height]);

      this.nodes = this.force.nodes();


      this.backdrop = this.d3GraphElement.append("svg:rect")
        .attr('class', 'backdrop')
        .attr("width", this.width)
        .attr("height", this.height);

      this.force.on("tick", (e:any) => {
          var k = e.alpha * .1;
          this.nodes.forEach((node:any) => {
            node.y += (node.cy - node.y) * k;
          });

        this.d3GraphElement.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });

      var p0, height = this.height;
      var evtFn = this.mouseEvent;

      this.d3GraphElement.on("mousemove", function() {
        var p1 = d3.mouse(this);
        evtFn(p1);
      });


      d3.select(window).on('resize.' + this.id, this.resize);
      this.resize();

    }

    private mouseEvent = (pt: number[]) => {

      var node = {
        x: pt[0],
        y: pt[1],
        px: pt[0],
        py: pt[1],
        cy: Math.random() * (this.height - 200) + 100
      };


      this.d3GraphElement.append("svg:circle")
        .data([node])
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", 15)
//        .style("fill", function(d) { return color(d.cy); })
        .transition()
        .delay(3000)
        .attr("r", 1e-6)
        .each("end", () => { this.nodes.shift(); })
        .remove();

      this.nodes.push(node);
      this.force.start();
    }

    protected resize = (): void => {
      this.collectHeightWidth();

      //      this.graphSvg
      //        .attr("width", this.width + this.marginPx * 2)
      //        .attr("height", this.height + this.marginPx * 2)
      //this.handleNewYears(null, 0);
      //      console.log(this.width, this.height);
      this.backdrop.attr("width", this.width)
        .attr("height", this.height);
    }


    protected collectHeightWidth = (): void => {
      this.width = parseInt(this.d3GraphElement.style("width")) - this.marginPx * 2;
      this.height = parseInt(this.d3GraphElement.style("height")) - this.marginPx * 2;
    }

  }
}