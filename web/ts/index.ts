/// <reference path="graph/startend.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R:any;

console.log('System online');


//start/end tooly graph
var startend = new Graph.StartEnd('graph-timeline');
startend.on('range', (newRange): void=> { console.log(newRange); });


var dataAll = new Utility.DataAll('data');
dataAll.on('data', (data: Utility.DataSet): void=> {
  console.log('data!', data);
  var spending = new Graph.Spending('graph-main',data);
});
dataAll.Initialize();