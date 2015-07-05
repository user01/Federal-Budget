/// <reference path="graph/yearhead.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />


declare var R: any;
declare var setPath: string;
var onReady = (): void => {

  var yearFrom = document.getElementById('year-from');
  var yearTo = document.getElementById('year-to');


  var yearHead = new Graph.YearHead('graph-timeline-header');
  var mode = document.getElementById('mode');


  var btns = [
    {
      mode: 'Nominal Dollars',
      enum: Graph.SpendingMode.Raw
    },
    {
      mode: '% of GDP',
      enum: Graph.SpendingMode.GDP
    },
    {
      mode: 'Nominal Dollars Per Capita',
      enum: Graph.SpendingMode.Capita
    },
    {
      mode: 'Real Dollars',
      enum: Graph.SpendingMode.Real
    },
    {
      mode: 'Real Dollars Per Capita',
      enum: Graph.SpendingMode.RealCapita
    }
  ];


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

    mode.onchange = (evt: any): void => {
      var selectedOption = evt.currentTarget.value;
      // console.log(selectedOption);
      var obj = R.find(R.propEq('mode', selectedOption))(btns);
      if (!obj) return;
      // console.log(obj.enum, Graph.SpendingMode.RealCapita);
      spending.Mode = obj.enum;
      spending.RenderNewState();
    }

  });
  dataAll.Initialize();
}

document.addEventListener('DOMContentLoaded', onReady, false);