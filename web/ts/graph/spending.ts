/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />

module Graph {
  export class Spending extends Utility.CbBase {
    protected d3GraphElement: D3._Selection<any>;
    constructor(private id: string) {
      super();
    }
  }
}