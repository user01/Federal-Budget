/// <reference path="cbbase.ts" />
/// <reference path="data.rich.ts" />
/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />

declare var R: any;

module Utility {
  interface DataSets { gdp: DataSet, cpi:DataSet, population:DataSet, budget:DataSet };
  export class DataAll extends CbBase {
    constructor() {
      super();
    }
  }
}