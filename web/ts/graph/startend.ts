/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />

module Graphs {
  export class StartEnd {
    protected d3GraphElement: D3._Selection<any>;

    protected width: number = 0;
    protected height: number = 0;
    protected marginPx: number = 8;

    private graphSvg: D3._Selection<any>;
    private xScale: D3.Scale.TimeScale;

    private static parseYear: (src: string) => Date = d3.time.format("%Y").parse;

    constructor(private id: string,
      private yearStart: number = 1960,
      private yearEnd: number = 2013) {
      this.d3GraphElement = d3.select("#" + this.id);
      this.collectHeightWidth();

      this.xScale = d3.time.scale()
        .range([0, this.width])
        .nice();


      this.graphSvg = this.d3GraphElement
        .attr("width", this.width + this.marginPx * 2)
        .attr("height", this.height + this.marginPx * 2)
        .append("g")
        .attr("transform", "translate(" + this.marginPx + "," + this.marginPx + ")");



      //debounce this
      d3.select(window).on('resize', this.resize);
      this.resize();
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
      console.log(this.width, this.height);
    }

    public handleNewYears = (newData: any, durationFactor: number = 1): void => {
      if (newData) {
        this.yearStart = newData.yearStart;
        this.yearEnd = newData.yearEnd;
      }
      var durationMs = 250 * durationFactor;

      this.xScale.domain([
        StartEnd.parseYear(this.yearStart + ''),
        StartEnd.parseYear(this.yearEnd + '')
      ]);
      var xAxis = d3.svg.axis()
        .scale(this.xScale).orient("top")
        .ticks(3);
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
          .call(xAxis);
      }
    }
  }
}
