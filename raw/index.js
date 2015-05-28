var fs = require('fs');
var csvParse = require("csv-parse");
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

var createNodeEntryFromRowBase = R.curry(function (forgeDataSet,row) {
  var superFunction = row[0];
  var normalFunction = row[1];
  var subFunction = row[2];
  var dataSet = forgeDataSet(row);
  if (dataSet.length < 2) return false;
  return {
    superFunction: superFunction,
    normalFunction: normalFunction,
    subFunction: subFunction,
    data: dataSet
  };
});


var processData = function (json) {
  var years = fixYears(json[0]);
  var forgeDataSet = R.pipe(R.zipWith(forgeDataEntry, years),filterBadValues);
  
  var createNodes = R.map(createNodeEntryFromRowBase(forgeDataSet));
  var dat = nonEmptyFirstElm(json);
  var nodeSets = filterFalsy(createNodes(dat));
  
  // check for bad sets
  var lengths = dataSetLengths(nodeSets); 
  var badSets = R.any(R.pipe(R.eq(lengths[0]), R.not), lengths);
  if (badSets) { console.warn('Dataset length mismatch'); }
  
  return nodeSets;
};

csvParse(upperSet, function (err, data) {
  var dat = JSON.stringify(processData(data));
  fs.writeFileSync('./budget.json', dat);
});