/// <reference path="graph/startend.ts" />
/// <reference path="graph/yearhead.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R: any;
var onReady = (): void => {

  var yearFrom = document.getElementById('year-from');
  var yearTo = document.getElementById('year-to');


  var btnRaw = document.getElementById('correction-raw');
  var btnGDP = document.getElementById('correction-ofgdp');
  var btnPerCap = document.getElementById('correction-percaptia');
  var yearHead = new Graph.YearHead('graph-timeline-header');
  
  var clearButtons = () => {
    btnRaw.classList.remove('pure-button-primary');
    btnGDP.classList.remove('pure-button-primary');
  }

  var newTargetYearHandler = (newYear): void => {
    // console.log('year!', newYear);
    spending.YearDesired = newYear;
  }

  var spending: Graph.Spending;
  var dataAll = new Utility.DataAll('data');
  dataAll.on('data', (data: Utility.DataAll): void=> {
    // console.log('data!', data);
    spending = new Graph.Spending('graph-main', data);
    spending.Year = data.YearEnd;
    spending.YearDesired = data.YearEnd;
    yearHead.SetRange(data.YearStart, data.YearEnd);
    yearHead.on('newTarget', newTargetYearHandler);
    yearHead.handleNewYear(data.YearEnd, data.YearEnd, 0);

    spending.on('renderedYear', (year: number) => {
      yearTo.textContent = year + '';
      yearHead.newCurrentYear(year);
    });

    btnRaw.onclick = () => {
      clearButtons();
      btnRaw.classList.add('pure-button-primary');
      spending.Mode = Graph.SpendingMode.Raw;
      spending.RenderNewState();
    }
    btnGDP.onclick = () => {
      clearButtons();
      btnGDP.classList.add('pure-button-primary');
      spending.Mode = Graph.SpendingMode.GDP;
      spending.RenderNewState();
    }
  });
  dataAll.Initialize();
}

document.addEventListener('DOMContentLoaded', onReady, false);