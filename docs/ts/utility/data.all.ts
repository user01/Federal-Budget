/// <reference path="cbbase.ts" />
/// <reference path="data.rich.ts" />
/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />

declare var R: any;

module Utility {
  export interface DataSets { gdp: DataSet, cpi: DataSet, population: DataSet, budget: DataSet };
  export class DataAll extends CbBase {
    public Sets: DataSets;

    protected _yearStart: number;
    public get YearStart(): number { return this._yearStart; }

    protected _yearEnd: number;
    public get YearEnd(): number { return this._yearEnd; }

    private static allReadySets = R.all((ds: DataSet): boolean=> { return ds.Ready; });

    constructor(private rootPath: string = '') {
      super();
    }

    public Initialize = (): void => {
      this.Sets = {
        gdp: new DataSet(this.rootPath + '/gdp.json'),
        cpi: new DataSet(this.rootPath + '/cpi.json'),
        population: new DataSet(this.rootPath + '/population.json'),
        budget: new DataRich(this.rootPath + '/budget.json'),
      };
      R.values(this.Sets).forEach((ds: DataSet) => {
        ds.on('data', this.dataLoaded);
        ds.Initialize();
      });
    }

    private dataLoaded = (): void => {
      if (!DataAll.allReadySets(R.values(this.Sets))) return;
      this._yearStart = R.pipe(R.values, R.map(R.prop('YearStart')), R.max)(this.Sets);
      this._yearEnd = R.pipe(R.values, R.map(R.prop('YearEnd')), R.min)(this.Sets);
      // console.log('Data from ', this._yearStart, ' to ', this._yearEnd);
      var sets = R.mapObj((ds: DataSet): DataSet => {
        return ds.CullData(this._yearStart, this._yearEnd);
      })(this.Sets);
      this.runCallback('data', this);
    }
  }
}