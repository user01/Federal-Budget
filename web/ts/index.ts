/// <reference path="graph/yearhead.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R: any;
declare var setPath: string;
var onReady = (): void => {

  var yearFrom = document.getElementById('year-from');
  var yearTo = document.getElementById('year-to');


  var btns = {
    raw: {
      elm: document.getElementById('correction-raw'),
      enum: Graph.SpendingMode.Raw
    },
    gdp: {
      elm: document.getElementById('correction-ofgdp'),
      enum: Graph.SpendingMode.GDP
    },
    percap: {
      elm: document.getElementById('correction-percaptia'),
      enum: Graph.SpendingMode.Capita
    },
    real: {
      elm: document.getElementById('correction-real'),
      enum: Graph.SpendingMode.Real
    },
    realpercap: {
      elm: document.getElementById('correction-realpercaptia'),
      enum: Graph.SpendingMode.RealCapita
    }
  };
  var btnKeys = R.keys(btns);
  var yearHead = new Graph.YearHead('graph-timeline-header');

  var clearButtons = () => {
    R.forEach(function(btnKey) {
      var btn = btns[btnKey].elm;
      btn.classList.remove('pure-button-primary');
      // btn.classList.add('button-secondary');
    })(btnKeys);
  }

  var newTargetYearHandler = (newYear): void => {
    // console.log('year!', newYear);
    spending.YearDesired = newYear;
  }

  var path = (typeof setPath != 'undefined') ? setPath : 'data';
  var spending: Graph.Spending;
  var dataAll = new Utility.DataAll(path);
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

    R.forEach(function(btnKey) {
      var btn = btns[btnKey].elm;
      var enu = btns[btnKey].enum;
      btn.onclick = () => {
        clearButtons();
        // btn.classList.remove('button-secondary');
        btn.classList.add('pure-button-primary');
        spending.Mode = enu;
        spending.RenderNewState();
      }
    })(btnKeys);

  });
  dataAll.Initialize();
}

document.addEventListener('DOMContentLoaded', onReady, false);