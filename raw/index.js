var fs = require('fs');
var csvParse = require("csv-parse");
var csvStringify = require("csv-stringify");
var R = require('ramda');

var upperSet = fs.readFileSync('./outlays.function.fix.csv').toString();

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
    sets: newSets
  };
};

csvParse(upperSet, function (err, data) {
  var fixedData = processData(data);
  csvStringify(fixedData, function (err, output) {
    fs.writeFileSync('./budget.out.csv', output);
  });
  var richDat = richData(data);
  var gdpSet = R.clone(richDat);
  gdpSet.data = R.prop('data')(R.find(R.pipe(R.prop('sp'), R.eq('GDP')), gdpSet.sets));
  delete gdpSet.sets;
  
  richDat.sets = R.filter(R.pipe(R.prop('sp'), R.eq('GDP'), R.not), richDat.sets);// screen out gdp
  fs.writeFileSync('./gdp.json', JSON.stringify(gdpSet));
  fs.writeFileSync('./budget.json', JSON.stringify(richDat));
});