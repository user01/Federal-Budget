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

    public CullData = (yearStart: number, yearEnd: number): DataSet => {
      //This has to do this for All data lists
      // console.log('From ', this._yearStart, '-', this._yearEnd);
      // console.log('To ', yearStart, '-', yearEnd);
      var sliceFrontCount = Math.max(0, yearStart - this._yearEnd);
      var indexesToRetain = yearEnd - yearStart + 1;
      var indexesToRemove = Math.max(0, this._yearEnd - yearEnd);
      // console.log(sliceFrontCount, indexesToRetain, indexesToRemove);
      var handleValue = (value: any): any => {
        if (!R.isArrayLike(value)) return value;
        value.splice(0, sliceFrontCount);
        value.splice(indexesToRetain, indexesToRemove);
        return value;
      }
      var handleEntry = (ent: any): any => {
        return R.mapObj(handleValue)(ent);
      }
      this._dataSet = R.map(handleEntry)(this._dataSet);
      this._yearStart = yearStart;
      this._yearEnd = yearEnd;
      return this;
    }
  }
}