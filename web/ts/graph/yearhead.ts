/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />

module Graph {
  export class YearHead extends Utility.CbBase {
    protected d3GraphElement: D3._Selection<any>;

    private width: number = 0;
    private height: number = 0;
    private marginPx: number = 8;

    private targetYear: number = 0;
    private currentYear: number = 0;


    private graphSvg: D3._Selection<any>;
    private xScale: D3.Scale.TimeScale;
    private yScale: D3.Scale.LinearScale;
    private areaRange: D3.Svg.Area;
    private areaCurrent: D3.Svg.Area;

    private static parseDate: (src: string) => Date = d3.time.format("%m-%d-%Y").parse;
    private static parseYear: (src: string) => Date = d3.time.format("%Y").parse;

    constructor(private id: string,
      private yearStart: number = 1960,
      private yearEnd: number = 2013) {
      super();

      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();
      this.targetYear = this.yearEnd;
      this.currentYear = this.targetYear;

      this.xScale = d3.time.scale()
        .range([0, this.width])
        .nice();
      this.yScale = d3.scale.linear()
        .range([this.height, 0])
        .domain([0, 1])
        .nice();
      this.areaRange = this.generateArea();
      this.areaCurrent = this.generateArea();

      this.graphSvg = this.d3GraphElement
        .attr("width", this.width + this.marginPx * 2)
        .attr("height", this.height + this.marginPx * 2)
        .append("g")
        .attr("transform", "translate(" + this.marginPx + "," + this.marginPx + ")");

      this.graphSvg.append("path")
        .attr("class", "area alive");
      this.graphSvg.append("path")
        .attr("class", "area current");

      //debounce this
      d3.select(window).on('resize.' + this.id, this.resize);
      this.resize();

      var clickHandler = this.handleClick;
      this.d3GraphElement.on("click", function() {
        var p1 = d3.mouse(this);
        var x = p1[0];
        clickHandler(x);
      });
    }

    private generateArea(): D3.Svg.Area {
      return d3.svg.area()
        .x((d) => { return this.xScale(YearHead.parseDate(d + '')); })
        .y0(this.height)
        .y1((d) => { return 0.75; });
    }

    private handleClick = (x: number): void => {
      var clickedDate = this.xScale.invert(x);
      var fullYear = clickedDate.getFullYear();
      this.targetYear = fullYear;

      this.targetYear = Math.max(Math.min(this.targetYear, this.yearEnd - 1), this.yearStart + 1);

      this.handleNewYear();
      this.runCallback('newTarget', this.targetYear);
    }


    protected resize = (): void => {
      this.collectHeightWidth();

      this.xScale.range([0, this.width]).nice();

      this.graphSvg
        .attr("width", this.width + this.marginPx * 2)
        .attr("height", this.height + this.marginPx * 2)
      this.handleNewYear(-1, 0, 0);
    }

    protected collectHeightWidth = (): void => {
      this.width = parseInt(this.d3GraphElement.style("width")) - this.marginPx * 2;
      this.height = parseInt(this.d3GraphElement.style("height")) - this.marginPx * 2;
    }

    public SetRange(yearStart: number, yearEnd: number): void {
      this.yearStart = yearStart;
      this.yearEnd = yearEnd;
      this.handleNewYear();
    }

    public handleNewYear = (newCurrentYear: number = -1,
      newTargetYear: number = -1,
      durationFactor: number = 1): void => {

      this.currentYear = (newCurrentYear > 0) ? newCurrentYear : this.currentYear;


      var durationMs = 250 * durationFactor;

      this.xScale.domain([
        YearHead.parseYear(this.yearStart + ''),
        YearHead.parseYear(this.yearEnd + '')
      ]);
      var tickCount = Math.max(Math.floor((this.width - 20) / 150), 1);
      var xAxis = d3.svg.axis()
        .scale(this.xScale).orient("bottom")
        .tickPadding(4)
        .ticks(tickCount);
      // if no axis exists, create one, otherwise update it
      if (this.graphSvg.selectAll(".x.axis")[0].length < 1) {
        this.graphSvg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + 0 + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "start");
      } else {
        this.graphSvg.selectAll(".x.axis").transition().duration(durationMs)
          .attr("transform", "translate(0," + 0 + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "start");
      }

      this.areaRange.y0(this.height); //adjust the fill region of the area
      var t0 = this.graphSvg.transition().duration(durationMs);
      var sixBack = '06-15-' + (this.targetYear - 1);
      var sixForward = '06-15-' + (this.targetYear);
      var twoBack = '10-15-' + (this.currentYear - 1);
      var twoForward = '02-15-' + (this.currentYear);
      t0.select(".area.alive").attr("d", this.areaRange([sixBack, sixForward]));


      t0.select(".area.current")
        .attr("d", this.areaRange([twoBack, twoForward]));
      // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart - 1, this.rangeStart + 1]));
      // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart, this.rangeEnd]));
    }

    public newCurrentYear = (newCurrentYear: number = -1, durationFactor: number = 1): void => {
      // console.log('start ', this.yearStart, ' end ', this.yearEnd);
      if (newCurrentYear > 0) {
        this.currentYear = newCurrentYear;
      }
      var durationMs = 150 * durationFactor;

      var twoBack = '10-15-' + (this.currentYear - 1);
      var twoForward = '02-15-' + (this.currentYear);
      var t0 = this.graphSvg.select(".area.current")
        .transition().duration(durationMs)
        .attr("d", this.areaRange([twoBack, twoForward]));
    }
  }
}
