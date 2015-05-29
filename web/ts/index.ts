/// <reference path="graph/startend.ts" />


console.log('System online');


//start/end tooly graph
var startend = new Graph.StartEnd('graph-timeline');
startend.on('range', (newRange): void=> { console.log(newRange); });