/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />

module Utility {
  // collects all of the 
  export class DataRich extends DataSet {
    
    
    protected createPatchedData = (): void => {
      var tempData = this._data; //prevents hammering .parse 
      this._yearStart = tempData.yearStart;
      this._yearEnd = tempData.yearEnd;
      this._factor = R.is(Number, tempData.factor) ? tempData.factor : 1;
      var cloneObjValue = (elm: any) => {
        return R.isArrayLike(elm) ? R.map(R.multiply(this._factor))(elm) : elm;
      }
      this._dataSet = R.map(R.mapObj(cloneObjValue))(tempData.data);
      this._ready = true;

      this.runCallback('data', this);
    }
  }
}