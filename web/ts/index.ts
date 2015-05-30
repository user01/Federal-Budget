/// <reference path="graph/startend.ts" />
/// <reference path="graph/spending.ts" />


declare var R:any;

console.log('System online');


//start/end tooly graph
var startend = new Graph.StartEnd('graph-timeline');
startend.on('range', (newRange): void=> { console.log(newRange); });
var spending = new Graph.Spending('graph-main');