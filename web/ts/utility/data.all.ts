/// <reference path="cbbase.ts" />
/// <reference path="data.rich.ts" />
/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />

declare var R: any;

module Utility {
  export interface DataSets { gdp: DataSet, cpi: DataSet, population: DataSet, budget: DataSet };
  export class DataAll extends CbBase {
    public sets: DataSets;
    
    private static allReadySets = R.all((ds: DataSet): boolean=> { return ds.Ready; });
    
    constructor(private rootPath:string='') {
      super();
    }

    public Initialize = (): void => {
      this.sets = {
        gdp: new DataSet(this.rootPath + '/gdp.json'),
        cpi: new DataSet(this.rootPath + '/cpi.json'),
        population: new DataSet(this.rootPath + '/population.json'),
        budget: new DataRich(this.rootPath + '/budget.json'),
      };
      R.values(this.sets).forEach((ds: DataSet) => {
        ds.on('data', this.dataLoaded);
        ds.Initialize();
      });
    }
    
    private dataLoaded = (): void => {
      if (!DataAll.allReadySets(R.values(this.sets))) return;
      var grabYearStart = R.pipe(R.values, R.map(R.prop('YearStart')), R.max )(this.sets);
      var grabYearEnd = R.pipe(R.values, R.map(R.prop('YearEnd')), R.min )(this.sets);
      console.log('Data from ', grabYearStart, ' to ', grabYearEnd);
      var sets = R.mapObj((ds: DataSet): DataSet => {
        return ds.CullData(grabYearStart, grabYearEnd);
      })(this.sets);
      this.runCallback('data', sets);
    }
  }
}