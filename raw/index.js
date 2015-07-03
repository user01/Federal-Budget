var fs = require('fs');
var csvParse = require("csv-parse");
var csvStringify = require("csv-stringify");
var R = require('ramda');

// console.log(process.argv);
var cwd = process.argv[2] ? process.argv[2] : '';

var upperSet = fs.readFileSync(cwd + 'outlays.function.fix.csv').toString();

var arrayLength = function (arr) { return arr.length; };
var onlyPeriods = /^\.+$/;
var removeCommas = function (str) {
  var cleanedOfCommas = str.replace(/,/g, '').trim();
  if (onlyPeriods.test(cleanedOfCommas)) return 0;
  var numConvert = +cleanedOfCommas;
  return (cleanedOfCommas === '' + numConvert) ? numConvert : false;
};
var fixYears = R.map(function (x) { return +x; });
var nonEmptyFirstElm = R.filter(function (arr) { return arr[0] !== ''; });
var tierLevel = function (str) { return (str.match(/-/g) || []).length; };
var notEqual = R.pipe(R.eq, R.not);
var filterFalsy = R.filter(R.identity);

var forgeDataEntry = function (year, value) {
  return { year: +year, value: removeCommas(value) };
};
var validYearEntry = R.pipe(R.prop('year'), R.lt(1900));
var validValueEntry = R.pipe(R.prop('value'), R.is(Number));
var validDataEntry = R.and(validYearEntry, validValueEntry);

var filterBadValues = R.filter(validDataEntry);
var dataSetLengths = R.map(R.pipe(R.prop('data'), arrayLength));

var cullDashesRegExp = /-*/g;
var cullDashes = function (str) { return str.replace(cullDashesRegExp, ''); };
var toCsvName = function (dataElm) {
  return dataElm.sp + '/' + dataElm.fn + '/' + dataElm.sb;
}

var createNodeEntryFromRowBase = R.curry(function (forgeDataSet, row) {
  var superFunction = cullDashes(row[0]);
  var normalFunction = cullDashes(row[1]);
  var subFunction = cullDashes(row[2]);
  var dataSet = forgeDataSet(row);
  if (dataSet.length < 2) return false;
  return {
    sp: superFunction,
    fn: normalFunction,
    sb: subFunction,
    data: dataSet
  };
});


var createSets = function (json) {
  var years = fixYears(json[0]);
  var forgeDataSet = R.pipe(R.zipWith(forgeDataEntry, years), filterBadValues);

  var createNodes = R.map(createNodeEntryFromRowBase(forgeDataSet));
  var dat = nonEmptyFirstElm(json);
  var nodeSets = filterFalsy(createNodes(dat));
  
  // check for bad sets
  var lengths = dataSetLengths(nodeSets);
  var badSets = R.any(R.pipe(R.eq(lengths[0]), R.not), lengths);
  if (badSets) { console.warn('Dataset length mismatch'); }

  return nodeSets;
};

var createElmInYearLine = function (yearNumber, setter) {
  var extract = R.pipe(
    R.prop('data'),
    R.find(R.propEq('year', yearNumber)),
    R.prop('value')
    );
  return extract(setter);
  //  return R.prepend(yearNumber, mainValues);
};

var processData = function (json) {
  var sets = createSets(json);
  
  //create header column
  var headers = R.prepend('date', R.map(toCsvName, sets));
  //  console.log(headers);

  var years = R.map(R.prop('year'), sets[0].data);
  //  console.log(years);

  var dataLines = R.map(function (thisYear) {
    var createYearLineThis = R.curry(createElmInYearLine)(thisYear);
    var rawLine = R.map(createYearLineThis, sets);
    return R.prepend(thisYear, rawLine);
  }, years);



  var fullCsv = R.prepend(headers, dataLines);

  return fullCsv;
};

var simplifySet = function (s) {
  return {
    sp: s.sp,
    fn: s.fn,
    sb: s.sb,
    data: R.map(R.prop('value'), s.data)
  };
};

var richData = function (json) {
  var sets = createSets(json);

  var years = R.map(R.prop('year'), sets[0].data);

  var newSets = R.map(simplifySet, sets);

  return {
    yearStart: R.min(years),
    yearEnd: R.max(years),
    factor: 1000000, //in millions of dollars
    data: newSets
  };
};


var arrayNeverBreaksThreshold = function (threshold, set1, gdp) {
  var zipped = R.zipWith(function (x, y) {
    return !(x / y > threshold);
  }, set1, gdp);
  return R.all(R.identity)(zipped);
}

var groupSmallData = function (elements, gdp) {
  var bigGroups = R.groupBy(R.prop('sp'))(elements.data);
  // console.log(bigGroups);
  var goodElms = [];
  debugger;
  var brokenTwice = R.mapObj(
    R.pipe(
      R.groupBy(R.prop('fn')),
      function (groups) {
        // debugger;
        // console.log(R.keys(groups));
        var functions = R.keys(groups);
        var sp = groups[functions[0]][0].sp;
        var fn = groups[functions[0]][0].fn;
        // console.log(sp);
        var other = { sp: sp, fn: fn, sb: 'Other', data: new Array(groups[functions[0]][0].data.length) };
        R.forEach(function (key) {
          var arrs = groups[key];
          R.forEach(function (arr) {
            var aboveThreshhold = arrayNeverBreaksThreshold(0.01, arr.data, gdp.data);
            // console.log(aboveThreshhold);
            if (aboveThreshhold) {
              // passes the threshhold to exist, place on
              goodElms.push(arr);
            } else {
              //add to other
              console.log(arr);
              other.data = R.zipWith(function (x, y) {
                x = (!x) ? 0 : x;
                return x + y;
              })(other.data)(arr.data);
            }
            // debugger;
          })(arrs);
        })(functions);
        if (other.data[0]) {
          //push data on
          goodElms.push(other);
          // console.log(other);
        }
      }
      )
    )(bigGroups);
  debugger;

  console.log(elements.data.length, goodElms.length);
  var newData = R.clone(elements);
  newData.data = goodElms;
  return newData;

  // console.log(R.keys(bigGroups));
  // console.log(brokenTwice);
};


var arrayBreaksThreshold = function (threshold, gdp, set1) {
  var zipped = R.zipWith(function (x, y) {
    return (x / y > threshold);
  }, set1, gdp);
  return R.any(R.identity)(zipped);
};

var regroup = function (elements, gdp) {
  var threshold = 0.006;
  var entriesBreakThreshold = R.filter(
    R.pipe(
      R.prop('data'),
      R.curry(arrayBreaksThreshold)(threshold)(gdp.data)
      )
    )(elements.data);
  var entriesNOTBreakThreshold = R.filter(
    R.pipe(
      R.prop('data'),
      R.curry(arrayBreaksThreshold)(threshold)(gdp.data),
      R.not
      )
    )(elements.data);
  // console.log(elements.data.length, entriesBreakThreshold.length, entriesNOTBreakThreshold.length);

  var spAndFn = R.map(function (d) {
    var obj = R.clone(d);
    obj.spfn = obj.sp + '/' + obj.fn;
    return obj;
  })(entriesNOTBreakThreshold);

  var groupedUnderThresholds = R.groupBy(R.prop('spfn'))(spAndFn);
  // console.log(groupedUnderThresholds);
  debugger;
  var summedGroups = R.mapObj(function (listOfCommon) {
    if (!listOfCommon || listOfCommon.length < 0) return null;
    if (listOfCommon.length === 1) return listOfCommon[0];
    // console.log(listOfCommon);
    var other = {
      sp: listOfCommon[0].sp,
      fn: listOfCommon[0].fn,
      sb: 'Other'
    };
    var dataStart = R.map(function (d) { return 0; })(listOfCommon[0].data);
    var datas = R.map(R.prop('data'))(listOfCommon);
    var dataResult = R.reduce(function (l1, l2) {
      return R.zipWith(R.add)(l1)(l2);
    })(dataStart)(datas);

    other.data = dataResult;
    return other;
  })(groupedUnderThresholds);

  summedGroups = R.pipe(
    R.values,
    R.filter(R.identity)
    )(summedGroups);

  var entriesNOTBreakThresholdMk2 = R.filter(
    R.pipe(
      R.prop('data'),
      R.curry(arrayBreaksThreshold)(threshold)(gdp.data),
      R.not
      )
    )(summedGroups);
  console.log(entriesNOTBreakThresholdMk2.length);

  var groupedUnderThresholdsMk2 = R.groupBy(R.prop('sp'))(spAndFn);
  var summedGroupsMk2 = R.mapObj(function (listOfCommon) {
    if (!listOfCommon || listOfCommon.length < 0) return null;
    if (listOfCommon.length === 1) return listOfCommon[0];
    // console.log(listOfCommon);
    var other = {
      sp: listOfCommon[0].sp,
      fn: 'Other',
      sb: null
    };
    var dataStart = R.map(function (d) { return 0; })(listOfCommon[0].data);
    var datas = R.map(R.prop('data'))(listOfCommon);
    var dataResult = R.reduce(function (l1, l2) {
      return R.zipWith(R.add)(l1)(l2);
    })(dataStart)(datas);

    other.data = dataResult;
    return other;
  })(groupedUnderThresholdsMk2);
  
  
  summedGroupsMk2 = R.pipe(
    R.values,
    R.filter(R.identity)
    )(summedGroupsMk2);
    
  console.log('final numbers');
  console.log('Untouched ', entriesBreakThreshold.length, ' touched:', summedGroupsMk2.length);


  debugger;
  return R.concat(entriesBreakThreshold, summedGroupsMk2);
};

csvParse(upperSet, function (err, data) {
  var fixedData = processData(data);
  csvStringify(fixedData, function (err, output) {
    fs.writeFileSync(cwd + 'budget.out.csv', output);
  });
  var richDat = richData(data);
  var gdpSet = R.clone(richDat);
  gdpSet.data = R.prop('data')(R.find(R.pipe(R.prop('sp'), R.eq('GDP')), gdpSet.data));
  delete gdpSet.sets;

  richDat.data = R.filter(R.pipe(R.prop('sp'), R.eq('GDP'), R.not), richDat.data);// screen out gdp
  
  // var newRichData = groupSmallData(richDat, gdpSet);
  var try3 = regroup(richDat, gdpSet);
  var try3A = R.clone(richDat);
  try3A.data = try3;
  debugger;

  fs.writeFileSync(cwd + 'gdp.json', JSON.stringify(gdpSet));
  // fs.writeFileSync(cwd + 'budget.json', JSON.stringify(newRichData));
  // fs.writeFileSync(cwd + 'budget.json', JSON.stringify(richDat));
  fs.writeFileSync(cwd + 'budget.json', JSON.stringify(try3A));
});