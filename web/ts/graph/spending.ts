/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />
/// <reference path="../utility/data.all.ts" />


module Graph {
  export enum SpendingMode { Raw, GDP };
  export class Spending extends Utility.CbBase {

    protected d3GraphElement: D3._Selection<any>;
    private graphSvg: D3._Selection<any>;

    private width: number = 0;
    private height: number = 0;
    private backdrop: D3._Selection<any>;
    private nodes: D3.Layout.GraphNodeForce[];
    private force: D3.Layout.ForceLayout;
    private color: D3.Scale.LinearScale;

    private _yearTo: number = 0;
    public get YearTo(): number {
      return this._yearTo;
    }
    public set YearTo(year:number) {
      this._yearTo = Math.min(Math.max(this.data.budget.YearStart + 1, year),this.data.budget.YearEnd);
      if (this._yearTo <= this._yearFrom) {
        this._yearFrom = this._yearTo - 1;
      }
    }
    private _yearFrom: number = 0;
    public get YearFrom(): number {
      return this._yearFrom;
    }
    public set YearFrom(year:number) {
      this._yearFrom = Math.min(Math.max(this.data.budget.YearStart, year),this.data.budget.YearEnd - 1);
      if (this._yearTo <= this._yearFrom) {
        this._yearTo = this._yearFrom + 1;
      }
    }

    private _mode: SpendingMode = SpendingMode.Raw;
    public set Mode(mode: SpendingMode) {
      this._mode = mode;
      //perform recomputes
    }

    constructor(private id: string, private data: Utility.DataSets) {
      super();

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();



      this.color = d3.scale.linear()
        .domain([this.height - 100, 100])
        .range(["hsl(180,100%,10%)", "hsl(210,100%,90%)"])
        .interpolate(d3.interpolateHsl);

      this.force = d3.layout.force()
        .gravity(0)
        .charge(12)
      //        .friction(-3)
        .size([this.width, this.height]);

      this.nodes = this.force.nodes();


      this.backdrop = this.d3GraphElement.append("svg:rect")
        .attr('class', 'backdrop')
        .attr("width", this.width)
        .attr("height", this.height);

      this.force.on("tick", (e: any) => {
        var k = e.alpha * .1;
        this.nodes.forEach((node: any) => {
          node.y += (node.cy - node.y) * k;
        });

        var q = d3.geom.quadtree(this.nodes),
          i = 0,
          n = this.nodes.length;

        while (++i < n) {
          q.visit(Spending.collide(this.nodes[i]));
        }


        this.d3GraphElement.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });


      var dot = this.d3GraphElement.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
      //      .data(interpolateData(1800))
        .data(data.budget.DataSet,Spending.key)
        .enter().append("circle")
        .attr("class", "dot")
        .style("fill", 'red')
        .attr("r", (d) => { return 25; })
        .attr("cx", this.width / 2)
        .attr("cy", this.height / 2)
      //      .style("fill", function(d) { return colorScale(color(d)); })
      //      .call(position)
      //      .sort(order);

      
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
      var cy = Math.random() * (this.height - 200) + 100;
      var node = {
        x: pt[0],
        y: cy,
        radius: Math.random() * 15 + 5,
        cy: cy
      };


      this.d3GraphElement.append("svg:circle")
        .data([node])
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", (d) => { return d.radius; })
        .style("fill", (d) => { return this.color(d.cy); })
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
      this.width = parseInt(this.d3GraphElement.style("width"));
      this.height = parseInt(this.d3GraphElement.style("height"));
      
      var minDim = Math.min(this.width, this.height);
      var availableArea = Math.PI * Math.pow((minDim / 2), 2);
      //find the maxed sum of the current mode
      
    }

    // *******************************************************************
    // Dot computaion functions
    // *******************************************************************
    private radius = (d:any): number => {
      return 10;
    }
    
    private value = (d: any): number => {
      return 7;
    }
    
    private yearToIndex = (year: number): number => {
      return Math.min(0,Math.floor(year) - this.data.budget.YearStart);
    }

    // *******************************************************************
    // Statics
    // *******************************************************************
    // *******************************************************************

    private static key = (d): string => {
      return d.sp + '-' + d.fn + '-' + d.sb;
    }
    
    
    private static collide = (node) => {
      var r = node.radius + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
            y = node.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = node.radius + quad.point.radius;
          if (l < r) {
            l = (l - r) / l * .5;
            node.x -= x *= l;
            node.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
      };
    }
  }
}