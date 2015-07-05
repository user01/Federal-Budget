/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />
/// <reference path="../utility/data.all.ts" />


module Graph {
  export enum SpendingMode { Raw, GDP, Capita, Real, RealCapita };
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
    private radiusCapitaScale: D3.Scale.LogScale;
    private radiusRealScale: D3.Scale.LogScale;
    private radiusRealCapitaScale: D3.Scale.LogScale;
    private elevationScale: D3.Scale.LinearScale;
    private superFunctionsScale: D3.Scale.LinearScale;


    private _year: number = 0;
    public get Year(): number {
      return this._year;
    }
    public set Year(year: number) {
      this._year = Math.min(this.data.YearEnd - 1,
        Math.max(this.data.YearStart, year));
    }

    private _yearDesired: number = 0;
    public get YearDesired(): number {
      return this._yearDesired;
    }
    public set YearDesired(year: number) {
      this._yearDesired = Math.min(this.data.YearEnd - 1,
        Math.max(this.data.YearStart, year));
      if (this.YearDesired != this.Year) {
        this.RenderNewState();
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
      return this.cpiFactor(this.Year);
    }

    private _valueMaxRaw: number = 0;
    /** total fraction of GDP */
    private _valueMaxGdp: number = 0;
    private _valueMaxCapita: number = 0;
    private _valueMaxReal: number = 0;
    private _valueMaxRealCapita: number = 0;
    private _superfunctions: Array<string> = Spending.pluckUniqueSuperFunctions(this.data.Sets.budget.DataSet);
    private _functions: Array<string> = Spending.pluckUniqueFunctions(this.data.Sets.budget.DataSet);

    constructor(private id: string, private data: Utility.DataAll) {
      super();
      this.Year = this.data.Sets.budget.YearEnd;
      this.YearDesired = this.Year;

      // console.log(data);
      
      // compute max values for all modes
      //      this.valueMaxGdp = R.max(R.map(this.data.Sets.budget.DataSet))
      this.maxvalueRawCompute();
      this.maxvalueGDPCompute();
      this.maxvalueCapitaCompute();
      this.maxvalueRealCompute();
      this.maxvalueRealCapitaCompute();
      // console.log(this._valueMaxGdp);
      // console.log(this._valueMaxCapita);
      
      this.superFractionCompute();
      // console.log(this._superFractionsVsYear);

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();


      var fractionsOfBudget = [];

      var radiusForAll = d3.min([this.width, this.height]);
      this.radiusRawScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxRaw])
        .range([0, radiusForAll]);

      this.radiusGdpScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxGdp])
        .range([0, radiusForAll]);

      this.radiusCapitaScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxCapita])
        .range([0, radiusForAll]);

      this.radiusRealScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxReal])
        .range([0, radiusForAll]);

      this.radiusRealCapitaScale = d3.scale.linear()
        .domain([1e-6, this._valueMaxRealCapita])
        .range([0, radiusForAll]);

      this.superFunctionsScale = d3.scale.linear()
        .domain([0, 1])
        .range([0, this.height - 11]);

      var perDiffRanges = [-5, 0, 5];
      this.color = d3.scale.linear()
        .domain(perDiffRanges) //percent
        .clamp(true)
        .range(["rgb(150,0,0)", "rgb(193,193,193)", "rgb(0,150,0)"]) //green to red
        .interpolate(d3.interpolateRgb);
      this.superFunctionColor = d3.scale.category10();


      this.elevationScale = d3.scale.linear()
        .domain(perDiffRanges)
        .clamp(true)
        .range([this.height * 0.7, this.height * 0.5, this.height * 0.3])

      this.force = d3.layout.force()
        .gravity(0.2)
        .charge(-12)
        .friction(0.12)
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

      this.data.Sets.budget.DataSet = R.mapIndexed(Spending.addKeysForD3)(this.data.Sets.budget.DataSet);

      this.force.nodes(this.data.Sets.budget.DataSet);
      this.nodes = this.force.nodes();

      var self = this;
      this.hoverTooltip = d3.select("#tooltip");
      var dot = this.d3GraphElement.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
      //      .data(interpolateData(1800))
        .data(data.Sets.budget.DataSet, Spending.key)
        .enter().append("circle")
        .attr("class", "dot")
        .style("stroke", 'black')
        .style('fill', (d) => { return this.superFunctionColor(this._superfunctions.indexOf(d.sp)); })
      //        .on('mouseover', (d) => { console.log(d); })
      //      .call(position)
      //      .sort(order);
      //        .append('title').text((d) => { return d.sp;})
        .on("mouseover", this.tooltipMouseOver)
        .on("mousemove", this.tooltipMouseMove)
        .on("mouseout", this.tooltipMouseOut)
        .call(this.force.drag)


      var legend = this.d3GraphElement.selectAll(".legend")
        .data(this.superFunctionColor.domain().slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", this.legendTransform);

      legend.append("rect")
        .attr("class", "blocks")
        .attr("x", this.width - 18)
        .attr("width", 18)
        .attr("height", this.blockHeight)
        .style("fill", this.superFunctionColor);

      legend.append("text")
        .attr("class", "blocks-text")
        .attr("x", this.width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(this.legendText);

      d3.select(window).on('resize.' + this.id, this.resize);
      this.resize();
    }


    protected resize = (): void => {
      this.collectHeightWidth();
      this.backdrop.attr("width", this.width)
        .attr("height", this.height);
      this.force.size([this.width, this.height]);

      var radiusForAll = d3.min([this.width, this.height]);
      this.radiusRawScale.range([0, radiusForAll]); //reset ranges
      this.superFunctionsScale
        .range([0, this.height - 11]);
      
      this.elevationScale
        .range([this.height * 0.7, this.height * 0.5, this.height * 0.3])
      this.data.Sets.budget.DataSet = R.mapIndexed(this.setCyForObj)(this.data.Sets.budget.DataSet);

      this.RenderNewState(0);
    }

    public RenderNewState = (delayFactor:number=1): void => {
      // console.log('Desired: ', this.YearDesired, ' at ', this.Year);
      if (this.YearDesired > this.Year) {
        this.Year++;
      } else if (this.YearDesired < this.Year) {
        this.Year--;
      }

      var dots = this.d3GraphElement
        .selectAll(".dot")
        .data(this.data.Sets.budget.DataSet, Spending.key)
        .transition().ease('linear').duration(150 * delayFactor)
        .style("stroke", (d) => { return this.color(this.deltaPercent(d)); })
        .attr("r", (d) => { return Math.max(0, this.radius(d) - 1); })
      // .attr("cx", (d) => { return d.x; })
      // .attr("cy", (d) => { return d.y; })
        .call(Spending.endall, () => {
          this.runCallback('renderedYear', this.Year);
          if (this.YearDesired == this.Year) {
            return;
          }
          this.RenderNewState();
        });
      this.force.start();
      if (this._tooltipData) {
        this.tooltipUpdate();
      }


      var legend = this.d3GraphElement.selectAll(".legend")
        .data(this.superFunctionColor.domain().slice())
        .transition().ease('linear').duration(150 * delayFactor)
        .attr("transform", this.legendTransform);

      var blocks = this.d3GraphElement.selectAll(".blocks")
        .transition().ease('linear').duration(150 * delayFactor)
        .attr("x", this.width - 18)
        .attr("height", this.blockHeight)
        .style("fill", this.superFunctionColor);

      var blockText = this.d3GraphElement.selectAll(".blocks-text")
        .transition().ease('linear').duration(150 * delayFactor)
        .attr("dy", ".35em")
        .text(this.legendText)
        .attr("x", this.width - 24);
    }

    protected collectHeightWidth = (): void => {
      this.width = parseInt(this.d3GraphElement.style("width"));
      this.height = parseInt(this.d3GraphElement.style("height"));

      var minDim = Math.min(this.width, this.height);
      var availableArea = Math.PI * Math.pow((minDim / 2), 2);
      //find the maxed sum of the current mode
      
    }

    private legendTransform = (d, i) => {
      var start = this.superIndexFractionStart(i);
      // console.log(start);
      var pos = this.superFunctionsScale(start);
      return "translate(" + 0 + "," + pos + ")";
    }
    private blockHeight = (d, i) => {
      var size = this.superFunctionsScale(this.superIndexFractionSize(i)) + 1;
      return size;
    }
    private legendText = (d, i) => {
      var size = this.superIndexFractionSize(i);
      // console.log(size);
      return (this._superfunctions[d] && size > 0.05 ? this._superfunctions[d] : '');
    };
    

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
        case SpendingMode.Capita:
          rad = Math.max(0, this.radiusCapitaScale(value));
          break;
        case SpendingMode.Real:
          rad = Math.max(0, this.radiusRealScale(value));
          break;
        case SpendingMode.RealCapita:
          rad = Math.max(0, this.radiusRealCapitaScale(value));
          break;
      }
      d.radius = rad;
      return d.radius;
    }
    
    /** returns the *100 percent */
    private deltaPercent = (d: any): number => {
      if (this.Year <= this.data.YearStart) return 0;

      var valueTo = this.value(d, this.Year);
      var valueFrom = this.value(d, this.Year - 1);
      return (valueTo - valueFrom) / valueFrom * 100;
    }

    /** Compute the value of the node for the given year, considering the mode context */
    private value = (d: any, yearIndex: number = this.Year): number => {
      var inx = this.yearToIndex(yearIndex);
      var val = d.data[inx];
      switch (this._mode) {
        case SpendingMode.Raw:
          break;
        case SpendingMode.GDP:
          val = val / this.data.Sets.gdp.DataSet[inx];
          break;
        case SpendingMode.Capita:
          val = val / this.data.Sets.population.DataSet[inx];
          break;
        case SpendingMode.Real:
          val = val / this.data.Sets.cpi.DataSet[inx];
          break;
        case SpendingMode.RealCapita:
          val = (val / this.data.Sets.cpi.DataSet[inx]) / this.data.Sets.population.DataSet[inx];
      }
      return Math.max(1e-5, val); //ensure non-zero values
    }

    private yearToIndex = (year: number): number => {
      return Math.max(0, Math.floor(year) - this.data.Sets.budget.YearStart);
    }

    private superIndexFractionSize(index: number, yearIndex: number = this.Year): number {
      var inx = this.yearToIndex(yearIndex);
      var value = this._superFractionsVsYear[index][inx];
      return Math.max(0, value);
    }

    private superIndexFractionStart(index: number, yearIndex: number = this.Year): number {
      // debugger;
      if (index <= 0) return 0;
      if (index > this._superFractionsVsYear.length) return 1;
      var inx = this.yearToIndex(yearIndex);
      // var reduceIndexed = R.addIndex(R.reduce)
      var start = R.reduceIndexed((accum: number, fraction: number, inxInner: number): number=> {
        return accum + ((inxInner < index) ? fraction[inx] : 0);
      })(0)(this._superFractionsVsYear);
      return Math.max(0, start);
    }

    private maxvalueGDPCompute = (): number => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        var gdpAtYear = this.data.Sets.gdp.DataSet[inx];
        return total / gdpAtYear;
      })(yearRange);
      this._valueMaxGdp = R.max(values); //in fraction of gdp
      return this._valueMaxGdp;
    }

    private maxvalueCapitaCompute = (): number => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        var popAtYear = this.data.Sets.population.DataSet[inx];
        return total / popAtYear;
      })(yearRange);
      this._valueMaxCapita = R.max(values); //in dollars per person
      return this._valueMaxCapita;
    }

    private _superFractionsVsYear: Array<any>;
    private superFractionCompute = (): Array<any> => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
      var totalsValues = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        return total;
      })(yearRange);

      this._superFractionsVsYear = R.map((superFunction: string): any=> {
        
        //compute the total for every year
        var valuesArrays = R.pipe(
          R.filter((d): boolean=> {
            return d.sp == superFunction;
          }),
          R.pluck('data')
          )(this.data.Sets.budget.DataSet);
        //console.log(valuesArrays);
        
  
        var valueList = R.map((year: number): number => {
          var inx = this.yearToIndex(year);
          var valueAtThisIndex = valueAtYearIndex(year);
          var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
          var total = R.sum(valuesAtThisIndex);
          return total / totalsValues[inx];
        })(yearRange);
        return valueList;

      })(this._superfunctions);

      return this._superFractionsVsYear;
    }

    private maxvalueRawCompute = (): number => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
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

    private maxvalueRealCompute = (): number => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        var fractionalValueOf2014DollarAtYear = this.data.Sets.cpi.DataSet[inx];
        return total / fractionalValueOf2014DollarAtYear;
      })(yearRange);
      this._valueMaxReal = R.max(values); //in fraction of gdp
      return this._valueMaxReal;
    }

    private maxvalueRealCapitaCompute = (): number => {
      var yearRange = R.range(this.data.Sets.budget.YearStart, this.data.Sets.budget.YearEnd + 1);
      //compute the total for every year
      var valuesArrays = R.pluck('data')(this.data.Sets.budget.DataSet);
      //console.log(valuesArrays);
      
      var valueAtYearIndex = R.pipe(this.yearToIndex, R.nth);

      var values = R.map((year: number): number => {
        var inx = this.yearToIndex(year);
        var valueAtThisIndex = valueAtYearIndex(year);
        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
        var total = R.sum(valuesAtThisIndex);
        var fractionalValueOf2014DollarAtYear = this.data.Sets.cpi.DataSet[inx];
        var popAtYear = this.data.Sets.population.DataSet[inx];
        return (total / fractionalValueOf2014DollarAtYear) / popAtYear;
      })(yearRange);
      this._valueMaxRealCapita = R.max(values); //in fraction of gdp
      return this._valueMaxRealCapita;
    }

    /** This factor times the dollar value in target year put it in base year (2014) dollars */
    private cpiFactor = (targetYear: number, baseYear: number = 2014) => {
      targetYear = Math.floor(targetYear);
      baseYear = Math.floor(baseYear);
      var targetIndex = this.yearToIndex(targetYear);
      var baseIndex = this.yearToIndex(baseYear);
      return this.data.Sets.cpi.DataSet[targetIndex] / this.data.Sets.cpi.DataSet[baseIndex];
    }

    // *******************************************************************
    // Tooltips
    // *******************************************************************
    private hoverTooltip: D3._Selection<any>;
    private _tooltipData: any = null;

    private tooltipMouseOver = (d: any): void => {
      this._tooltipData = R.clone(d);
      this.tooltipUpdate();
      //Show the tooltip
      this.hoverTooltip.classed("hidden", false);
    }

    private tooltipUpdate = (d: any = this._tooltipData): void => {
      //Update the tooltip position and value
      this.hoverTooltip
        .select("#super")
        .text(d.sp);
      this.hoverTooltip
        .select("#function")
        .text(d.fn);

      this.hoverTooltip
        .select("#sub")
        .text((d.fn != d.sb) ? d.sb : '');

      var valueField = this.hoverTooltip.select('#value');
      var valueRightField = this.hoverTooltip.select('#value-right');
      var deltaField = this.hoverTooltip.select('#delta');
      var value = this.value(d);
      var Pd: number|string = Math.floor(this.deltaPercent(d) * 10) / 10;
      var prefix = Pd > 0 ? '+' : '';
      Pd = Pd < 100000000000000 ? Pd : 'From Nothing';
      deltaField.text(prefix + Pd + '%');

      switch (this._mode) {
        case SpendingMode.Raw:
          valueField.text('$' + Spending.dollarsToDollarString(value));
          valueRightField.text('Nominal Dollars')
          break;
        case SpendingMode.Real:
          valueField.text('$' + Spending.dollarsToDollarString(value));
          valueRightField.text('Real 2014 Dollars')
          break;
        case SpendingMode.GDP:
          var oute = Math.floor(value * 10000) / 100;
          valueField.text(oute + '%');
          valueRightField.text('of US GDP')
          break;
        case SpendingMode.Capita:
          var oute = Math.floor(value);
          valueField.text('$' + oute + ' / person');
          valueRightField.text('Nominal Dollars')
          break;
        case SpendingMode.RealCapita:
          var oute = Math.floor(value);
          valueField.text('$' + oute + ' / person');
          valueRightField.text('Real 2014 Dollars')
          break;
        default:
          valueField.text('Unknown mode');
          break;
      }

      this.tooltipMouseMove(d);
    }

    private static dollarsToDollarString(dollars: number): string {
      var out = dollars > 1000000000 ? (Math.round(dollars / 100000000) / 10) + ' Billion' :
        (Math.round(dollars / 100000) / 10) + ' Million';
      return out;
    }

    private tooltipMouseMove = (d: any): void => {
      if (!d3.event) return;

      var xPosition = d3.event.x;
      var yPosition = d3.event.y;

      //Update the tooltip position and value
      this.hoverTooltip
        .style("left", xPosition + "px")
        .style("top", yPosition + "px")
    }
    private tooltipMouseOut = (d: any): void => {
      this._tooltipData = null;
      this.hoverTooltip.classed("hidden", true);
    }
    private setCyForObj = (d: any, idx: number): any => {
      var per = this.deltaPercent(d);
      d.cy = this.elevationScale(per);
      return d;
    }
    
    // *******************************************************************
    // Statics
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

    private static endall(transition, callback) {
      if (transition.size() === 0) { callback() }
      var n = 0;
      transition
        .each(function() { ++n; })
        .each("end", function() { if (!--n) callback.apply(this, arguments); });
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