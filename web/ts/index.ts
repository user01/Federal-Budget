/// <reference path="graph/startend.ts" />
/// <reference path="graph/yearhead.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R: any;
var onReady = (): void => {


  console.log('System online');

  var yearFrom = document.getElementById('year-from');
  var yearTo = document.getElementById('year-to');


  var btnRaw = document.getElementById('correction-raw');
  var btnGDP = document.getElementById('correction-ofgdp');
  var btnPerCap = document.getElementById('correction-percaptia');
  //start/end tooly graph
  var yearHead = new Graph.YearHead('graph-timeline-header');
  var startend = new Graph.StartEnd('graph-timeline');
  // graph-timeline-header
  //startend.on('range', (newRange): void=> { console.log(newRange); });

  var newRangeHandler = (newRange): void=> {
    // spending.YearFrom = newRange.start;
    spending.Year = newRange.end;
    yearFrom.textContent = newRange.start;
    yearTo.textContent = newRange.end;
    spending.RenderNewState();
  }
  
  var newTargetYearHandler = (newYear): void => {
    console.log('year!', newYear);
  }

  var spending: Graph.Spending;
  var dataAll = new Utility.DataAll('data');
  dataAll.on('data', (data: Utility.DataAll): void=> {
    console.log('data!', data);
    spending = new Graph.Spending('graph-main', data);
    startend.on('range', newRangeHandler);
    startend.forceNewRange(1980, 2010);
    yearHead.SetRange(data.YearStart, data.YearEnd);
    yearHead.on('newTarget', newTargetYearHandler);

    btnRaw.onclick = () => {
      spending.Mode = Graph.SpendingMode.Raw;
      spending.RenderNewState();
    }
    btnGDP.onclick = () => {
      spending.Mode = Graph.SpendingMode.GDP;
      spending.RenderNewState();
    }
  });
  dataAll.Initialize();
}

document.addEventListener('DOMContentLoaded', onReady, false);