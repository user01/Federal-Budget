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
    private superFunctionColor: D3.Scale.OrdinalScale;
    private radiusRawScale: D3.Scale.LogScale;
    private radiusGdpScale: D3.Scale.LogScale;

    private _yearTo: number = 0;
    public get YearTo(): number {
      return this._yearTo;
    }
    public set YearTo(year: number) {
      this._yearTo = Math.min(Math.max(this.data.budget.YearStart + 1, year), this.data.budget.YearEnd);
      if (this._yearTo <= this._yearFrom) {
        this._yearFrom = this._yearTo - 1;
      }
    }
    private _yearFrom: number = 0;
    public get YearFrom(): number {
      return this._yearFrom;
    }
    public set YearFrom(year: number) {
      this._yearFrom = Math.min(Math.max(this.data.budget.YearStart, year), this.data.budget.YearEnd - 1);
      if (this._yearTo <= this._yearFrom) {
        this._yearTo = this._yearFrom + 1;
      }
    }

    private _mode: SpendingMode = SpendingMode.Raw;
    public set Mode(mode: SpendingMode) {
      this._mode = mode;
      //perform recomputes
    }
    public get Mode(): SpendingMode {
      return this._mode;
    }
    private get CpiFactorToCurrentYear(): number {
      return this.cpiFactor(this.YearTo);
    }

    private _valueMaxRaw: number = 0;
    /** total fraction of GDP */
    private _valueMaxGdp: number = 0;
    private _superfunctions: Array<string> = Spending.pluckUniqueSuperFunctions(this.data.budget.DataSet);
    private _functions: Array<string> = Spending.pluckUniqueFunctions(this.data.budget.DataSet);

    constructor(private id: string, private data: Utility.DataSets) {
      super();
      this._yearTo = this.data.budget.YearEnd;
      this._yearFrom = this.data.budget.YearStart;
      
      
      
      // compute max values for all modes
      //      this.valueMaxGdp = R.max(R.map(this.data.budget.DataSet))
      this.maxvalueRawCompute();
      this.maxvalueGDPCompute();

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();


      var radiusForAll = d3.min([this.width, this.height]);
      this.radiusRawScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxRaw])
        .range([0, radiusForAll]);
      
      this.radiusGdpScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxGdp])
        .range([0, radiusForAll]);

      this.color = d3.scale.linear()
        .domain([-30, 0, 30]) //percent
        .range(["rgb(150,0,0)", "rgb(0,0,0)", "rgb(0,150,0)"]) //green to red
        .interpolate(d3.interpolateRgb);
      this.superFunctionColor = d3.scale.category10();


      this.force = d3.layout.force()
        .gravity(3)
        .charge(-12)
        .friction(0.26)
        .size([this.width, this.height]);



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

        this.d3GraphElement.selectAll(".dot")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });

      this.data.budget.DataSet = R.mapIndexed(Spending.addKeysForD3)(this.data.budget.DataSet);

      this.force.nodes(this.data.budget.DataSet);
      this.nodes = this.force.nodes();

      
      var dot = this.d3GraphElement.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
      //      .data(interpolateData(1800))
        .data(data.budget.DataSet, Spending.key)
        .enter().append("circle")
        .attr("class", "dot")
        .style("fill", 'red')
      //        .style('stroke', 'black')
        .style('stroke', (d) => { return this.superFunctionColor(this._superfunctions.indexOf(d.sp)); })
      //        .attr("r", (d) => { return Math.max(0,this.radius(d)-1); })
      //        .attr("cx", (d) => { return d.x; })
      //        .attr("cy", (d) => { return d.y; })
        .on('mouseover', (d) => { console.log(d); })
      //      .style("fill", function(d) { return colorScale(color(d)); })
      //      .call(position)
      //      .sort(order);
        .append('title').text((d) => { return d.sp;})


      d3.select(window).on('resize.' + this.id, this.resize);
      this.resize();
    }


    protected resize = (): void => {
      this.collectHeightWidth();
      this.backdrop.attr("width", this.width)
        .attr("height", this.height);


      var radiusForAll = d3.min([this.width, this.height]);
      this.radiusRawScale.range([0, radiusForAll]); //reset ranges
      
      this.RenderNewState();
    }

    private _lastYearTo: number = 900000;
    public RenderNewState = (): void => {

      var dots = this.d3GraphElement
        .selectAll(".dot")
        .data(this.data.budget.DataSet, Spending.key)
        .transition().duration(250)
        .style("fill", (d) => { return this.color(this.deltaPercent(d)); })
        .attr("r", (d) => { return Math.max(0, this.radius(d) - 1); })
        .attr("cx", (d) => { return d.x; })
        .attr("cy", (d) => { return d.y; })

      if (this._lastYearTo != this.YearTo) {
        this.force.start();
        this._lastYearTo = this.YearTo;
      }
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
    private radius = (d: any): number => {
      var value = this.value(d);
      var rad;
      switch (this._mode) {
        case SpendingMode.Raw:
          rad = Math.max(0, this.radiusRawScale(value));
          break;
        case SpendingMode.GDP:
          rad = Math.max(0, this.radiusGdpScale(value));
          break;
      }
      d.radius = rad;
      return d.radius;
    }
    
    /** returns the *100 percent */
    private deltaPercent = (d: any): number => {
      var valueTo = this.value(d, this.YearTo);
      var valueFrom = this.value(d, this.YearFrom);
      return (valueTo - valueFrom) / valueFrom * 100;
    }

    /** Compute the value of the node for the given year, considering the mode context */
    private value = (d: any, yearIndex: number = this.YearTo): number => {
      var val = d.data[this.yearToIndex(yearIndex)];
      switch (this._mode) {
        case SpendingMode.Raw:
          break;
        case SpendingMode.GDP:
          var inx = this.yearToIndex(yearIndex);
          val = val / this.data.gdp.DataSet[inx];
          break;
      }
      return Math.max(1e-5, val); //ensure non-zero values
    }

    private yearToIndex = (year: number): number => {
      return Math.max(0, Math.floor(year) - this.data.budget.YearStart);
    }

    private maxvalueGDPCompute = (): number => {
      var yearRange = R.range(this.data.budget.YearStart, this.data.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        var gdpAtYear = this.data.gdp.DataSet[inx];
        return total/gdpAtYear;
      })(yearRange);
      this._valueMaxGdp = R.max(values); //in fraction of gdp
      return this._valueMaxGdp;
    }

    private maxvalueRawCompute = (): number => {
      var yearRange = R.range(this.data.budget.YearStart, this.data.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        return total;
      })(yearRange);
      this._valueMaxRaw = R.max(values); //in raw dollars
      return this._valueMaxRaw;
    }
    
    /** This factor times the dollar value in target year put it in base year (2014) dollars */
    private cpiFactor = (targetYear: number, baseYear: number = 2014) => {
      targetYear = Math.floor(targetYear);
      baseYear = Math.floor(baseYear);
      var targetIndex = this.yearToIndex(targetYear);
      var baseIndex = this.yearToIndex(baseYear);
      return this.data.cpi.DataSet[targetIndex] / this.data.cpi.DataSet[baseIndex];
    }

    // *******************************************************************
    // Statics
    // *******************************************************************
    // *******************************************************************

    private static key = (d): string => {
      return d.sp + '-' + d.fn + '-' + d.sb;
    }

    private static pluckUniqueSuperFunctions = (dats: any[]): string[]=> {
      return R.pipe(R.pluck('sp'), R.uniq)(dats);
    }
    private static pluckUniqueFunctions = (dats: any[]): string[]=> {
      return R.pipe(R.pluck('fn'), R.uniq)(dats);
    }


    private static addKeysForD3 = (obj: any, idx: number): any => {
      obj.x = 3 * idx;
      obj.y = 3 * idx;
      obj.cy = 200;
      obj.cx = 0;
      obj.radius = 4;
      return obj;
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