/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />

module Graph {
  export class YearHead extends Utility.CbBase {
    protected d3GraphElement: D3._Selection<any>;

    private width: number = 0;
    private height: number = 0;
    private marginPx: number = 8;

    private rangeStart: number = 0;
    private rangeEnd: number = 0;


    private graphSvg: D3._Selection<any>;
    private xScale: D3.Scale.TimeScale;
    private yScale: D3.Scale.LinearScale;
    private areaRange: D3.Svg.Area;

    private static parseDate: (src: string) => Date = d3.time.format("%m-%d-%Y").parse;
    private static parseYear: (src: string) => Date = d3.time.format("%Y").parse;

    constructor(private id: string,
      private yearStart: number = 1960,
      private yearEnd: number = 2013) {
      super();

      this.rangeCheck();
      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();

      this.xScale = d3.time.scale()
        .range([0, this.width])
        .nice();
      this.yScale = d3.scale.linear()
        .range([this.height, 0])
        .domain([0, 1])
        .nice();
      this.areaRange = d3.svg.area()
        .x((d) => { return this.xScale(YearHead.parseDate(d + '')); })
        .y0(this.height)
        .y1((d) => { return 0.75; });

      this.graphSvg = this.d3GraphElement
        .attr("width", this.width + this.marginPx * 2)
        .attr("height", this.height + this.marginPx * 2)
        .append("g")
        .attr("transform", "translate(" + this.marginPx + "," + this.marginPx + ")");

      this.graphSvg.append("path")
        .attr("class", "area alive");

      //debounce this
      d3.select(window).on('resize.' + this.id, this.resize);
      this.resize();

      var clickHandler = this.handleClick;
      this.d3GraphElement.on("click", function() {
        var p1 = d3.mouse(this);
        var x = p1[0];
        console.log(x);
        clickHandler(x);
      });
    }

    private handleClick = (x: number): void => {
      var clickedDate = this.xScale.invert(x);
      var fullYear = clickedDate.getFullYear();
      var distToStart = Math.abs(this.rangeStart - fullYear);
      var distToEnd = Math.abs(this.rangeEnd - fullYear);
      if (distToStart < distToEnd) {
        //closer to start
        this.rangeStart = fullYear;
      } else {
        //closer to end
        this.rangeEnd = fullYear;
      }
      this.rangeCheck();
      this.handleNewYears(null, 0.2);
      this.runCallback('range', {
        start: this.rangeStart,
        end: this.rangeEnd
      });
    }

    private rangeCheck = (): void => {
      if (this.rangeStart >= this.rangeEnd) {
        this.rangeStart = this.rangeEnd - 1;
      }
      if (this.rangeStart < this.yearStart || this.rangeStart > this.yearEnd ||
        this.rangeEnd < this.yearStart || this.rangeEnd > this.yearEnd) {
        this.rangeStart = Math.floor((this.yearEnd - this.yearStart) / 2 + this.yearStart);
        this.rangeEnd = Math.floor((this.yearEnd - this.yearStart) / 2 + this.yearStart) + 1;
      }
    }

    protected resize = (): void => {
      this.collectHeightWidth();

      this.xScale.range([0, this.width]).nice();

      this.graphSvg
        .attr("width", this.width + this.marginPx * 2)
        .attr("height", this.height + this.marginPx * 2)
      this.handleNewYears(null, 0);
    }

    protected collectHeightWidth = (): void => {
      this.width = parseInt(this.d3GraphElement.style("width")) - this.marginPx * 2;
      this.height = parseInt(this.d3GraphElement.style("height")) - this.marginPx * 2;
    }

    public forceNewRange = (from: number, to: number): void => {
      this.rangeStart = from;
      this.rangeEnd = to;
      this.rangeCheck();
      this.handleNewYears(null, 0);
      this.runCallback('range', {
        start: this.rangeStart,
        end: this.rangeEnd
      });
    }

    public handleNewYears = (newData: any, durationFactor: number = 1): void => {
      if (newData) {
        this.yearStart = newData.yearStart;
        this.yearEnd = newData.yearEnd;
        this.rangeCheck();
      }
      var durationMs = 250 * durationFactor;

      this.xScale.domain([
        YearHead.parseYear(this.yearStart + ''),
        YearHead.parseYear(this.yearEnd + '')
      ]);
      var tickCount = Math.max(Math.floor((this.width - 20) / 150), 1);
      var xAxis = d3.svg.axis()
        .scale(this.xScale).orient("top")
        .tickPadding(4)
        .ticks(tickCount);
      // if no axis exists, create one, otherwise update it
      if (this.graphSvg.selectAll(".x.axis")[0].length < 1) {
        this.graphSvg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + this.height + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "start");
      } else {
        this.graphSvg.selectAll(".x.axis").transition().duration(durationMs)
          .attr("transform", "translate(0," + this.height + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "start");
      }

      this.areaRange.y0(this.height); //adjust the fill region of the area
      var t0 = this.graphSvg.transition().duration(durationMs);
      var sixBack = '06-15-' + (this.rangeStart - 1);
      var sixForward = '06-15-' + (this.rangeStart);
      t0.select(".area.alive").attr("d", this.areaRange([sixBack, sixForward]));
      // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart - 1, this.rangeStart + 1]));
      // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart, this.rangeEnd]));
    }
  }
}
