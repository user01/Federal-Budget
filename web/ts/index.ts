/// <reference path="graph/startend.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R:any;

console.log('System online');


//start/end tooly graph
var startend = new Graph.StartEnd('graph-timeline');
startend.on('range', (newRange): void=> { console.log(newRange); });

var spending:Graph.Spending;
var dataAll = new Utility.DataAll('data');
dataAll.on('data', (data: Utility.DataSets): void=> {
  console.log('data!', data);
  spending = new Graph.Spending('graph-main', data);
  startend.on('range', (newRange): void=> {
    spending.YearFrom = newRange.start;
    spending.YearTo = newRange.end;
    spending.RenderNewState();
  });
  
});
dataAll.Initialize();