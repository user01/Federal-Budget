/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />

module Utility {
  // collects all of the 
  export class DataAll extends DataSet {
    
    
    protected createPatchedData = (): void => {
//      var tempData = this._data; //prevents hammering .parse 
//      this._yearStart = tempData.yearStart;
//      this._yearEnd = tempData.yearEnd;
//      var factor = R.is(Number, tempData.factor) ? tempData.factor: 1;
//      this._dataSet = R.map(R.multiply(factor),tempData.data);
//      this._ready = true;

      this.runCallback('data', this);
    }
  }
}