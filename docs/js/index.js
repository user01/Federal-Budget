var Utility;
(function (Utility) {
    var CbBase = (function () {
        function CbBase() {
            var _this = this;
            this.callbacks = {};
            //**************************************************************************
            //**************************************************************************
            //
            //    Event handling code
            //
            //**************************************************************************
            //**************************************************************************
            this.on = function (evt, fn) {
                if (typeof evt !== 'string')
                    return;
                _this.ensureExists(evt);
                _this.callbacks[evt].push(fn);
            };
            this.off = function (evt, fn) {
                if (typeof evt !== 'string')
                    return;
                if (!_this.callbacks[evt])
                    return;
                for (var i = 0; i < _this.callbacks[evt].length; i++) {
                    if (_this.callbacks[evt][i] !== fn)
                        continue;
                    delete _this.callbacks[evt][i];
                    return;
                }
            };
            this.runCallback = function (evt, payload) {
                if (payload === void 0) { payload = null; }
                if (typeof evt !== 'string')
                    return;
                if (!_this.callbacks[evt])
                    return;
                for (var i = 0; i < _this.callbacks[evt].length; i++) {
                    _this.callbacks[evt][i](payload);
                }
            };
            this.ensureExists = function (evt) {
                if (!_this.callbacks[evt])
                    _this.callbacks[evt] = new Array();
            };
        }
        return CbBase;
    })();
    Utility.CbBase = CbBase;
})(Utility || (Utility = {}));
/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Graph;
(function (Graph) {
    var YearHead = (function (_super) {
        __extends(YearHead, _super);
        function YearHead(id, yearStart, yearEnd) {
            var _this = this;
            if (yearStart === void 0) { yearStart = 1960; }
            if (yearEnd === void 0) { yearEnd = 2013; }
            _super.call(this);
            this.id = id;
            this.yearStart = yearStart;
            this.yearEnd = yearEnd;
            this.width = 0;
            this.height = 0;
            this.marginPx = 8;
            this.targetYear = 0;
            this.currentYear = 0;
            this.handleClick = function (x) {
                var clickedDate = _this.xScale.invert(x);
                var fullYear = clickedDate.getFullYear();
                _this.targetYear = fullYear;
                _this.targetYear = Math.max(Math.min(_this.targetYear, _this.yearEnd - 1), _this.yearStart + 1);
                _this.handleNewYear();
                _this.runCallback('newTarget', _this.targetYear);
            };
            this.resize = function () {
                _this.collectHeightWidth();
                _this.xScale.range([0, _this.width]).nice();
                _this.graphSvg
                    .attr("width", _this.width + _this.marginPx * 2)
                    .attr("height", _this.height + _this.marginPx * 2);
                _this.handleNewYear(-1, 0, 0);
            };
            this.collectHeightWidth = function () {
                _this.width = parseInt(_this.d3GraphElement.style("width")) - _this.marginPx * 2;
                _this.height = parseInt(_this.d3GraphElement.style("height")) - _this.marginPx * 2;
            };
            this.handleNewYear = function (newCurrentYear, newTargetYear, durationFactor) {
                if (newCurrentYear === void 0) { newCurrentYear = -1; }
                if (newTargetYear === void 0) { newTargetYear = -1; }
                if (durationFactor === void 0) { durationFactor = 1; }
                _this.currentYear = (newCurrentYear > 0) ? newCurrentYear : _this.currentYear;
                var durationMs = 250 * durationFactor;
                _this.xScale.domain([
                    YearHead.parseYear(_this.yearStart + ''),
                    YearHead.parseYear(_this.yearEnd + '')
                ]);
                var tickCount = Math.max(Math.floor((_this.width - 20) / 150), 1);
                var xAxis = d3.svg.axis()
                    .scale(_this.xScale).orient("bottom")
                    .tickPadding(4)
                    .ticks(tickCount);
                // if no axis exists, create one, otherwise update it
                if (_this.graphSvg.selectAll(".x.axis")[0].length < 1) {
                    _this.graphSvg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + 0 + ")")
                        .call(xAxis)
                        .selectAll("text")
                        .style("text-anchor", "start");
                }
                else {
                    _this.graphSvg.selectAll(".x.axis").transition().duration(durationMs)
                        .attr("transform", "translate(0," + 0 + ")")
                        .call(xAxis)
                        .selectAll("text")
                        .style("text-anchor", "start");
                }
                _this.areaRange.y0(_this.height); //adjust the fill region of the area
                var t0 = _this.graphSvg.transition().duration(durationMs);
                var sixBack = '06-15-' + (_this.targetYear - 1);
                var sixForward = '06-15-' + (_this.targetYear);
                var twoBack = '10-15-' + (_this.currentYear - 1);
                var twoForward = '02-15-' + (_this.currentYear);
                t0.select(".area.alive").attr("d", _this.areaRange([sixBack, sixForward]));
                t0.select(".area.current")
                    .attr("d", _this.areaRange([twoBack, twoForward]));
                // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart - 1, this.rangeStart + 1]));
                // t0.select(".area.alive").attr("d", this.areaRange([this.rangeStart, this.rangeEnd]));
            };
            this.newCurrentYear = function (newCurrentYear, durationFactor) {
                if (newCurrentYear === void 0) { newCurrentYear = -1; }
                if (durationFactor === void 0) { durationFactor = 1; }
                // console.log('start ', this.yearStart, ' end ', this.yearEnd);
                if (newCurrentYear > 0) {
                    _this.currentYear = newCurrentYear;
                }
                var durationMs = 150 * durationFactor;
                var twoBack = '10-15-' + (_this.currentYear - 1);
                var twoForward = '02-15-' + (_this.currentYear);
                var t0 = _this.graphSvg.select(".area.current")
                    .transition().duration(durationMs)
                    .attr("d", _this.areaRange([twoBack, twoForward]));
            };
            this.d3GraphElement = d3.select("#" + this.id);
            this.collectHeightWidth();
            this.targetYear = this.yearEnd;
            this.currentYear = this.targetYear;
            this.xScale = d3.time.scale()
                .range([0, this.width])
                .nice();
            this.yScale = d3.scale.linear()
                .range([this.height, 0])
                .domain([0, 1])
                .nice();
            this.areaRange = this.generateArea();
            this.areaCurrent = this.generateArea();
            this.graphSvg = this.d3GraphElement
                .attr("width", this.width + this.marginPx * 2)
                .attr("height", this.height + this.marginPx * 2)
                .append("g")
                .attr("transform", "translate(" + this.marginPx + "," + this.marginPx + ")");
            this.graphSvg.append("path")
                .attr("class", "area alive");
            this.graphSvg.append("path")
                .attr("class", "area current");
            //debounce this
            d3.select(window).on('resize.' + this.id, this.resize);
            this.resize();
            var clickHandler = this.handleClick;
            this.d3GraphElement.on("click", function () {
                var p1 = d3.mouse(this);
                var x = p1[0];
                clickHandler(x);
            });
        }
        YearHead.prototype.generateArea = function () {
            var _this = this;
            return d3.svg.area()
                .x(function (d) { return _this.xScale(YearHead.parseDate(d + '')); })
                .y0(this.height)
                .y1(function (d) { return 0.75; });
        };
        YearHead.prototype.SetRange = function (yearStart, yearEnd) {
            this.yearStart = yearStart;
            this.yearEnd = yearEnd;
            this.handleNewYear();
        };
        YearHead.parseDate = d3.time.format("%m-%d-%Y").parse;
        YearHead.parseYear = d3.time.format("%Y").parse;
        return YearHead;
    })(Utility.CbBase);
    Graph.YearHead = YearHead;
})(Graph || (Graph = {}));
/// <reference path="cbbase.ts" />
/// <reference path="../../../typings/d3.d.ts" />
var Utility;
(function (Utility) {
    var DataSet = (function (_super) {
        __extends(DataSet, _super);
        function DataSet(path) {
            var _this = this;
            _super.call(this);
            this.path = path;
            this._ready = false;
            this._yearStart = 0;
            this._yearEnd = 0;
            this._factor = 1;
            this._dataSet = [];
            this.Initialize = function () {
                if (_this.timestamp && _this._data) {
                    if (Date.now() - _this.timestamp < DataSet.staleSeconds) {
                        _this.createPatchedData();
                        return;
                    }
                }
                d3.json(_this.path, function (error, rawData) {
                    if (!error) {
                        _this.timestamp = Date.now();
                        _this._data = rawData;
                        _this.createPatchedData();
                    }
                    else {
                        _this.renderError();
                    }
                });
            };
            //this class level assumes data is all numbers
            this.createPatchedData = function () {
                var tempData = _this._data; //prevents hammering .parse 
                _this._yearStart = tempData.yearStart;
                _this._yearEnd = tempData.yearEnd;
                _this._factor = R.is(Number, tempData.factor) ? tempData.factor : 1;
                _this._dataSet = R.map(R.multiply(_this._factor), tempData.data); //provides a clone as well
                _this._ready = true;
                _this.runCallback('data', _this);
            };
            this.CullData = function (yearStart, yearEnd) {
                if (yearStart > _this._yearStart) {
                    //trim off the early
                    _this._dataSet.splice(0, yearStart - _this._yearStart);
                }
                if (yearEnd < _this._yearEnd) {
                    var indexesToRetain = yearEnd - yearStart + 1;
                    var indexesToRemove = _this._yearEnd - yearEnd;
                    _this._dataSet.splice(indexesToRetain, indexesToRemove);
                }
                _this._yearStart = yearStart;
                _this._yearEnd = yearEnd;
                return _this;
            };
            this.renderError = function () {
                console.warn('Unable to get ', _this.path);
            };
        }
        Object.defineProperty(DataSet.prototype, "Ready", {
            get: function () {
                return this._ready;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "YearStart", {
            get: function () {
                return this._yearStart;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "YearEnd", {
            get: function () {
                return this._yearEnd;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "Factor", {
            get: function () {
                return this._factor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "DataSet", {
            get: function () {
                return this._dataSet;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "pullTimestampId", {
            get: function () {
                return DataSet.prefix + this.path + '_Pull';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "pullDataId", {
            get: function () {
                return DataSet.prefix + this.path + '_Data';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "_data", {
            get: function () {
                return JSON.parse(localStorage[this.pullDataId]);
            },
            set: function (value) {
                localStorage[this.pullDataId] = JSON.stringify(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataSet.prototype, "timestamp", {
            get: function () {
                return +localStorage[this.pullTimestampId];
            },
            set: function (value) {
                localStorage[this.pullTimestampId] = value;
            },
            enumerable: true,
            configurable: true
        });
        DataSet.staleSeconds = 259200;
        DataSet.prefix = "DataSet_";
        return DataSet;
    })(Utility.CbBase);
    Utility.DataSet = DataSet;
})(Utility || (Utility = {}));
/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />
var Utility;
(function (Utility) {
    // collects all of the 
    var DataRich = (function (_super) {
        __extends(DataRich, _super);
        function DataRich() {
            var _this = this;
            _super.apply(this, arguments);
            this.createPatchedData = function () {
                var tempData = _this._data; //prevents hammering .parse 
                _this._yearStart = tempData.yearStart;
                _this._yearEnd = tempData.yearEnd;
                _this._factor = R.is(Number, tempData.factor) ? tempData.factor : 1;
                var cloneObjValue = function (elm) {
                    return R.isArrayLike(elm) ? R.map(R.multiply(_this._factor))(elm) : elm;
                };
                _this._dataSet = R.map(R.mapObj(cloneObjValue))(tempData.data);
                _this._ready = true;
                _this.runCallback('data', _this);
            };
            this.CullData = function (yearStart, yearEnd) {
                //This has to do this for All data lists
                // console.log('From ', this._yearStart, '-', this._yearEnd);
                // console.log('To ', yearStart, '-', yearEnd);
                var sliceFrontCount = Math.max(0, yearStart - _this._yearEnd);
                var indexesToRetain = yearEnd - yearStart + 1;
                var indexesToRemove = Math.max(0, _this._yearEnd - yearEnd);
                // console.log(sliceFrontCount, indexesToRetain, indexesToRemove);
                var handleValue = function (value) {
                    if (!R.isArrayLike(value))
                        return value;
                    value.splice(0, sliceFrontCount);
                    value.splice(indexesToRetain, indexesToRemove);
                    return value;
                };
                var handleEntry = function (ent) {
                    return R.mapObj(handleValue)(ent);
                };
                _this._dataSet = R.map(handleEntry)(_this._dataSet);
                _this._yearStart = yearStart;
                _this._yearEnd = yearEnd;
                return _this;
            };
        }
        return DataRich;
    })(Utility.DataSet);
    Utility.DataRich = DataRich;
})(Utility || (Utility = {}));
/// <reference path="cbbase.ts" />
/// <reference path="data.rich.ts" />
/// <reference path="data.set.ts" />
/// <reference path="../../../typings/d3.d.ts" />
var Utility;
(function (Utility) {
    ;
    var DataAll = (function (_super) {
        __extends(DataAll, _super);
        function DataAll(rootPath) {
            var _this = this;
            if (rootPath === void 0) { rootPath = ''; }
            _super.call(this);
            this.rootPath = rootPath;
            this.Initialize = function () {
                _this.Sets = {
                    gdp: new Utility.DataSet(_this.rootPath + '/gdp.json'),
                    cpi: new Utility.DataSet(_this.rootPath + '/cpi.json'),
                    population: new Utility.DataSet(_this.rootPath + '/population.json'),
                    budget: new Utility.DataRich(_this.rootPath + '/budget.json'),
                };
                R.values(_this.Sets).forEach(function (ds) {
                    ds.on('data', _this.dataLoaded);
                    ds.Initialize();
                });
            };
            this.dataLoaded = function () {
                if (!DataAll.allReadySets(R.values(_this.Sets)))
                    return;
                _this._yearStart = R.pipe(R.values, R.map(R.prop('YearStart')), R.max)(_this.Sets);
                _this._yearEnd = R.pipe(R.values, R.map(R.prop('YearEnd')), R.min)(_this.Sets);
                // console.log('Data from ', this._yearStart, ' to ', this._yearEnd);
                var sets = R.mapObj(function (ds) {
                    return ds.CullData(_this._yearStart, _this._yearEnd);
                })(_this.Sets);
                _this.runCallback('data', _this);
            };
        }
        Object.defineProperty(DataAll.prototype, "YearStart", {
            get: function () { return this._yearStart; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataAll.prototype, "YearEnd", {
            get: function () { return this._yearEnd; },
            enumerable: true,
            configurable: true
        });
        DataAll.allReadySets = R.all(function (ds) { return ds.Ready; });
        return DataAll;
    })(Utility.CbBase);
    Utility.DataAll = DataAll;
})(Utility || (Utility = {}));
/// <reference path="../../../typings/lodash.d.ts" />
/// <reference path="../../../typings/d3.d.ts" />
/// <reference path="../utility/cbbase.ts" />
/// <reference path="../utility/data.all.ts" />
var Graph;
(function (Graph) {
    (function (SpendingMode) {
        SpendingMode[SpendingMode["Raw"] = 0] = "Raw";
        SpendingMode[SpendingMode["GDP"] = 1] = "GDP";
        SpendingMode[SpendingMode["Capita"] = 2] = "Capita";
        SpendingMode[SpendingMode["Real"] = 3] = "Real";
        SpendingMode[SpendingMode["RealCapita"] = 4] = "RealCapita";
    })(Graph.SpendingMode || (Graph.SpendingMode = {}));
    var SpendingMode = Graph.SpendingMode;
    ;
    var Spending = (function (_super) {
        __extends(Spending, _super);
        function Spending(id, data) {
            var _this = this;
            _super.call(this);
            this.id = id;
            this.data = data;
            this.width = 0;
            this.height = 0;
            this._year = 0;
            this._yearDesired = 0;
            this._mode = SpendingMode.Raw;
            this._valueMaxRaw = 0;
            /** total fraction of GDP */
            this._valueMaxGdp = 0;
            this._valueMaxCapita = 0;
            this._valueMaxReal = 0;
            this._valueMaxRealCapita = 0;
            this._superfunctions = Spending.pluckUniqueSuperFunctions(this.data.Sets.budget.DataSet);
            this._functions = Spending.pluckUniqueFunctions(this.data.Sets.budget.DataSet);
            this.resize = function () {
                _this.collectHeightWidth();
                _this.backdrop.attr("width", _this.width)
                    .attr("height", _this.height);
                _this.force.size([_this.width * 0.9, _this.height]);
                _this.resetRanges();
                _this.elevationScale
                    .range([_this.height * 0.7, _this.height * 0.5, _this.height * 0.3]);
                _this.data.Sets.budget.DataSet = R.mapIndexed(_this.setCyForObj)(_this.data.Sets.budget.DataSet);
                _this.RenderNewState(0);
            };
            this.RenderNewState = function (delayFactor) {
                if (delayFactor === void 0) { delayFactor = 1; }
                // console.log('Desired: ', this.YearDesired, ' at ', this.Year);
                if (_this.YearDesired > _this.Year) {
                    _this.Year++;
                }
                else if (_this.YearDesired < _this.Year) {
                    _this.Year--;
                }
                var dots = _this.d3GraphElement
                    .selectAll(".dot")
                    .data(_this.data.Sets.budget.DataSet, Spending.key)
                    .transition().ease('linear').duration(150 * delayFactor)
                    .style("stroke", function (d) { return _this.color(_this.deltaPercent(d)); })
                    .attr("r", function (d) { return Math.max(0, _this.radius(d) - 1); })
                    .call(Spending.endall, function () {
                    _this.runCallback('renderedYear', _this.Year);
                    if (_this.YearDesired == _this.Year) {
                        return;
                    }
                    _this.RenderNewState();
                });
                _this.force.start();
                if (_this._tooltipData) {
                    _this.tooltipUpdate();
                }
                var legend = _this.d3GraphElement.selectAll(".legend")
                    .data(_this.superFunctionColor.domain().slice())
                    .transition().ease('linear').duration(150 * delayFactor)
                    .attr("transform", _this.legendTransform);
                var blocks = _this.d3GraphElement.selectAll(".blocks")
                    .transition().ease('linear').duration(150 * delayFactor)
                    .attr("x", _this.width - _this.legendWidth())
                    .attr("width", _this.legendWidth())
                    .attr("height", _this.blockHeight)
                    .style("fill", _this.superFunctionColor);
                var blockText = _this.d3GraphElement.selectAll(".blocks-text")
                    .transition().ease('linear').duration(150 * delayFactor)
                    .attr("y", _this.legendTextY)
                    .text(_this.legendText)
                    .attr("x", _this.width - _this.legendWidth() - 6);
            };
            this.collectHeightWidth = function () {
                _this.width = parseInt(_this.d3GraphElement.style("width"));
                _this.height = parseInt(_this.d3GraphElement.style("height"));
                var minDim = Math.min(_this.width, _this.height);
                var availableArea = Math.PI * Math.pow((minDim / 2), 2);
                //find the maxed sum of the current mode
            };
            this.legendTransform = function (d, i) {
                var start = _this.superIndexFractionStart(i);
                // console.log(start);
                var pos = _this.superFunctionsScale(start);
                return "translate(" + 0 + "," + pos + ")";
            };
            this.blockHeight = function (d, i) {
                var size = _this.superFunctionsScale(_this.superIndexFractionSize(i)) + 1;
                return size;
            };
            this.legendText = function (d, i) {
                var size = _this.superIndexFractionSize(i);
                // console.log(size);
                return (_this._superfunctions[d] && size > 0.05 ?
                    _this._superfunctions[d] + ' ' + Math.floor(size * 100) + '%'
                    : '');
            };
            this.legendTextY = function (d, i) {
                return _this.superFunctionsScale(_this.superIndexFractionSize(i)) / 2;
            };
            // *******************************************************************
            // Dot computaion functions
            // *******************************************************************
            this.radius = function (d) {
                var value = _this.value(d);
                // var area = value > 0 ? value : 0;
                var area;
                // var radius = Spending.areaToRadius(area);
                // radius = value;
                // console.log(value, radius);
                switch (_this._mode) {
                    case SpendingMode.Raw:
                        area = _this.radiusRawScale(value);
                        break;
                    case SpendingMode.GDP:
                        area = _this.radiusGdpScale(value);
                        break;
                    case SpendingMode.Capita:
                        area = _this.radiusCapitaScale(value);
                        break;
                    case SpendingMode.Real:
                        area = _this.radiusRealScale(value);
                        break;
                    case SpendingMode.RealCapita:
                        area = _this.radiusRealCapitaScale(value);
                        break;
                }
                // console.log(rad);
                d.radius = Spending.areaToRadius(Math.max(0, area));
                // d.radius = Math.max(0, area);
                return d.radius;
            };
            /** returns the *100 percent */
            this.deltaPercent = function (d) {
                if (_this.Year <= _this.data.YearStart)
                    return 0;
                var valueTo = _this.value(d, _this.Year);
                var valueFrom = _this.value(d, _this.Year - 1);
                return (valueTo - valueFrom) / valueFrom * 100;
            };
            /** Compute the value of the node for the given year, considering the mode context */
            this.value = function (d, yearIndex) {
                if (yearIndex === void 0) { yearIndex = _this.Year; }
                var inx = _this.yearToIndex(yearIndex);
                var val = d.data[inx];
                switch (_this._mode) {
                    case SpendingMode.Raw:
                        break;
                    case SpendingMode.GDP:
                        val = val / _this.data.Sets.gdp.DataSet[inx];
                        break;
                    case SpendingMode.Capita:
                        val = val / _this.data.Sets.population.DataSet[inx];
                        break;
                    case SpendingMode.Real:
                        val = val / _this.data.Sets.cpi.DataSet[inx];
                        break;
                    case SpendingMode.RealCapita:
                        val = (val / _this.data.Sets.cpi.DataSet[inx]) / _this.data.Sets.population.DataSet[inx];
                }
                return Math.max(1e-5, val); //ensure non-zero values
            };
            this.yearToIndex = function (year) {
                return Math.max(0, Math.floor(year) - _this.data.Sets.budget.YearStart);
            };
            this.maxvalueGDPCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                //compute the total for every year
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                //console.log(valuesArrays);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var values = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    var gdpAtYear = _this.data.Sets.gdp.DataSet[inx];
                    return total / gdpAtYear;
                })(yearRange);
                _this._valueMaxGdp = R.max(values); //in fraction of gdp
                return _this._valueMaxGdp;
            };
            this.maxvalueCapitaCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                //compute the total for every year
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                //console.log(valuesArrays);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var values = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    var popAtYear = _this.data.Sets.population.DataSet[inx];
                    return total / popAtYear;
                })(yearRange);
                _this._valueMaxCapita = R.max(values); //in dollars per person
                return _this._valueMaxCapita;
            };
            this.superFractionCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                var totalsValues = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    return total;
                })(yearRange);
                _this._superFractionsVsYear = R.map(function (superFunction) {
                    //compute the total for every year
                    var valuesArrays = R.pipe(R.filter(function (d) {
                        return d.sp == superFunction;
                    }), R.pluck('data'))(_this.data.Sets.budget.DataSet);
                    //console.log(valuesArrays);
                    var valueList = R.map(function (year) {
                        var inx = _this.yearToIndex(year);
                        var valueAtThisIndex = valueAtYearIndex(year);
                        var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                        var total = R.sum(valuesAtThisIndex);
                        return total / totalsValues[inx];
                    })(yearRange);
                    return valueList;
                })(_this._superfunctions);
                return _this._superFractionsVsYear;
            };
            this.maxvalueRawCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                //compute the total for every year
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                //console.log(valuesArrays);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var values = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    return total;
                })(yearRange);
                _this._valueMaxRaw = R.max(values); //in raw dollars
                return _this._valueMaxRaw;
            };
            this.maxvalueRealCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                //compute the total for every year
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                //console.log(valuesArrays);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var values = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    var fractionalValueOf2014DollarAtYear = _this.data.Sets.cpi.DataSet[inx];
                    return total / fractionalValueOf2014DollarAtYear;
                })(yearRange);
                _this._valueMaxReal = R.max(values); //in fraction of gdp
                return _this._valueMaxReal;
            };
            this.maxvalueRealCapitaCompute = function () {
                var yearRange = R.range(_this.data.Sets.budget.YearStart, _this.data.Sets.budget.YearEnd + 1);
                //compute the total for every year
                var valuesArrays = R.pluck('data')(_this.data.Sets.budget.DataSet);
                //console.log(valuesArrays);
                var valueAtYearIndex = R.pipe(_this.yearToIndex, R.nth);
                var values = R.map(function (year) {
                    var inx = _this.yearToIndex(year);
                    var valueAtThisIndex = valueAtYearIndex(year);
                    var valuesAtThisIndex = R.map(valueAtThisIndex)(valuesArrays);
                    var total = R.sum(valuesAtThisIndex);
                    var fractionalValueOf2014DollarAtYear = _this.data.Sets.cpi.DataSet[inx];
                    var popAtYear = _this.data.Sets.population.DataSet[inx];
                    return (total / fractionalValueOf2014DollarAtYear) / popAtYear;
                })(yearRange);
                _this._valueMaxRealCapita = R.max(values); //in fraction of gdp
                return _this._valueMaxRealCapita;
            };
            /** This factor times the dollar value in target year put it in base year (2014) dollars */
            this.cpiFactor = function (targetYear, baseYear) {
                if (baseYear === void 0) { baseYear = 2014; }
                targetYear = Math.floor(targetYear);
                baseYear = Math.floor(baseYear);
                var targetIndex = _this.yearToIndex(targetYear);
                var baseIndex = _this.yearToIndex(baseYear);
                return _this.data.Sets.cpi.DataSet[targetIndex] / _this.data.Sets.cpi.DataSet[baseIndex];
            };
            this._tooltipData = null;
            this.tooltipMouseOver = function (d) {
                _this._tooltipData = R.clone(d);
                _this.tooltipUpdate();
                //Show the tooltip
                _this.hoverTooltip.classed("hidden", false);
            };
            this.tooltipUpdate = function (d) {
                if (d === void 0) { d = _this._tooltipData; }
                //Update the tooltip position and value
                _this.hoverTooltip
                    .select("#super")
                    .text(d.sp);
                _this.hoverTooltip
                    .select("#function")
                    .text(d.fn);
                _this.hoverTooltip
                    .select("#sub")
                    .text((d.fn != d.sb) ? d.sb : '');
                var valueField = _this.hoverTooltip.select('#value');
                var valueRightField = _this.hoverTooltip.select('#value-right');
                var deltaField = _this.hoverTooltip.select('#delta');
                var value = _this.value(d);
                var Pd = Math.floor(_this.deltaPercent(d) * 10) / 10;
                var prefix = Pd > 0 ? '+' : '';
                Pd = Pd < 100000000000000 ? Pd : 'From Nothing';
                deltaField.text(prefix + Pd + '%');
                switch (_this._mode) {
                    case SpendingMode.Raw:
                        valueField.text('$' + Spending.dollarsToDollarString(value));
                        valueRightField.text('Nominal Dollars');
                        break;
                    case SpendingMode.Real:
                        valueField.text('$' + Spending.dollarsToDollarString(value));
                        valueRightField.text('Real 2014 Dollars');
                        break;
                    case SpendingMode.GDP:
                        var oute = Math.floor(value * 10000) / 100;
                        valueField.text(oute + '%');
                        valueRightField.text('of US GDP');
                        break;
                    case SpendingMode.Capita:
                        var oute = Math.floor(value);
                        valueField.text('$' + oute + ' / person');
                        valueRightField.text('Nominal Dollars');
                        break;
                    case SpendingMode.RealCapita:
                        var oute = Math.floor(value);
                        valueField.text('$' + oute + ' / person');
                        valueRightField.text('Real 2014 Dollars');
                        break;
                    default:
                        valueField.text('Unknown mode');
                        break;
                }
                _this.tooltipMouseMove(d);
            };
            this.tooltipMouseMove = function (d) {
                if (!d3.event)
                    return;
                var xPosition = d3.event.x;
                var yPosition = d3.event.y;
                //Update the tooltip position and value
                _this.hoverTooltip
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px");
            };
            this.tooltipMouseOut = function (d) {
                _this._tooltipData = null;
                _this.hoverTooltip.classed("hidden", true);
            };
            this.setCyForObj = function (d, idx) {
                var per = _this.deltaPercent(d);
                d.cy = _this.elevationScale(per);
                return d;
            };
            this.Year = this.data.Sets.budget.YearEnd;
            this.YearDesired = this.Year;
            // console.log(data);
            // compute max values for all modes
            //      this.valueMaxGdp = R.max(R.map(this.data.Sets.budget.DataSet))
            this.maxvalueRawCompute();
            this.maxvalueGDPCompute();
            this.maxvalueCapitaCompute();
            this.maxvalueRealCompute();
            this.maxvalueRealCapitaCompute();
            // console.log(this._valueMaxGdp);
            // console.log(this._valueMaxCapita);
            this.superFractionCompute();
            // console.log(this._superFractionsVsYear);
            this.d3GraphElement = d3.select("#" + this.id);
            this.collectHeightWidth();
            var areaForAll = this.areaForGraph();
            this.radiusRawScale = d3.scale.linear()
                .domain([1e-6, this._valueMaxRaw])
                .range([0, areaForAll]);
            this.radiusGdpScale = d3.scale.linear()
                .domain([1e-6, this._valueMaxGdp])
                .range([0, areaForAll]);
            this.radiusCapitaScale = d3.scale.linear()
                .domain([1e-6, this._valueMaxCapita])
                .range([0, areaForAll]);
            this.radiusRealScale = d3.scale.linear()
                .domain([1e-6, this._valueMaxReal])
                .range([0, areaForAll]);
            this.radiusRealCapitaScale = d3.scale.linear()
                .domain([1e-6, this._valueMaxRealCapita])
                .range([0, areaForAll]);
            this.superFunctionsScale = d3.scale.linear()
                .domain([0, 1])
                .range([0, this.height - 11]);
            var perDiffRanges = [-5, 0, 5];
            this.color = d3.scale.linear()
                .domain(perDiffRanges) //percent
                .clamp(true)
                .range(["rgb(150,0,0)", "rgb(193,193,193)", "rgb(0,150,0)"]) //green to red
                .interpolate(d3.interpolateRgb);
            this.superFunctionColor = d3.scale.category10();
            this.elevationScale = d3.scale.linear()
                .domain(perDiffRanges)
                .clamp(true)
                .range([this.height * 0.7, this.height * 0.5, this.height * 0.3]);
            this.force = d3.layout.force()
                .gravity(0.2)
                .charge(-12)
                .friction(0.12)
                .size([this.width, this.height]);
            this.backdrop = this.d3GraphElement.append("svg:rect")
                .attr('class', 'backdrop')
                .attr("width", this.width)
                .attr("height", this.height);
            this.force.on("tick", function (e) {
                var k = e.alpha * .1;
                _this.nodes.forEach(function (node) {
                    node.y += (node.cy - node.y) * k;
                });
                var q = d3.geom.quadtree(_this.nodes), i = 0, n = _this.nodes.length;
                while (++i < n) {
                    q.visit(Spending.collide(_this.nodes[i]));
                }
                _this.d3GraphElement.selectAll(".dot")
                    .attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; });
            });
            this.data.Sets.budget.DataSet = R.mapIndexed(Spending.addKeysForD3)(this.data.Sets.budget.DataSet);
            this.force.nodes(this.data.Sets.budget.DataSet);
            this.nodes = this.force.nodes();
            var self = this;
            this.hoverTooltip = d3.select("#tooltip");
            var dot = this.d3GraphElement.append("g")
                .attr("class", "dots")
                .selectAll(".dot")
                .data(data.Sets.budget.DataSet, Spending.key)
                .enter().append("circle")
                .attr("class", "dot")
                .style("stroke", 'black')
                .style('fill', function (d) { return _this.superFunctionColor(_this._superfunctions.indexOf(d.sp)); })
                .on("mouseover", this.tooltipMouseOver)
                .on("mousemove", this.tooltipMouseMove)
                .on("mouseout", this.tooltipMouseOut)
                .call(this.force.drag);
            var legend = this.d3GraphElement.selectAll(".legend")
                .data(this.superFunctionColor.domain().slice())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", this.legendTransform);
            legend.append("rect")
                .attr("class", "blocks")
                .attr("x", this.width - this.legendWidth())
                .attr("width", this.legendWidth())
                .attr("height", this.blockHeight)
                .style("fill", this.superFunctionColor);
            legend.append("text")
                .attr("class", "blocks-text")
                .attr("x", this.width - this.legendWidth() - 6)
                .attr("y", this.legendTextY)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(this.legendText);
            d3.select(window).on('resize.' + this.id, this.resize);
            this.resize();
        }
        Object.defineProperty(Spending.prototype, "Year", {
            get: function () {
                return this._year;
            },
            set: function (year) {
                this._year = Math.min(this.data.YearEnd - 1, Math.max(this.data.YearStart, year));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Spending.prototype, "YearDesired", {
            get: function () {
                return this._yearDesired;
            },
            set: function (year) {
                this._yearDesired = Math.min(this.data.YearEnd - 1, Math.max(this.data.YearStart, year));
                if (this.YearDesired != this.Year) {
                    this.RenderNewState();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Spending.prototype, "Mode", {
            get: function () {
                return this._mode;
            },
            set: function (mode) {
                this._mode = mode;
                //perform recomputes
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Spending.prototype, "CpiFactorToCurrentYear", {
            get: function () {
                return this.cpiFactor(this.Year);
            },
            enumerable: true,
            configurable: true
        });
        /** Reset d3 Scales according to current DOM object size */
        Spending.prototype.resetRanges = function () {
            var areaForAll = this.areaForGraph();
            this.radiusRawScale.range([0, areaForAll]);
            this.radiusGdpScale.range([0, areaForAll]);
            this.radiusCapitaScale.range([0, areaForAll]);
            this.radiusRealScale.range([0, areaForAll]);
            this.radiusRealCapitaScale.range([0, areaForAll]);
            this.superFunctionsScale.range([0, this.height - 11]);
        };
        Spending.prototype.areaForGraph = function () {
            var radiusForAll = (d3.min([this.width, this.height]) * 0.8) / 2;
            var areaForAll = Spending.radiusToArea(radiusForAll);
            return areaForAll;
        };
        Spending.prototype.legendWidth = function () {
            return Math.floor(this.width * 0.03);
        };
        Spending.prototype.superIndexFractionSize = function (index, yearIndex) {
            if (yearIndex === void 0) { yearIndex = this.Year; }
            var inx = this.yearToIndex(yearIndex);
            var value = this._superFractionsVsYear[index][inx];
            return Math.max(0, value);
        };
        Spending.prototype.superIndexFractionStart = function (index, yearIndex) {
            if (yearIndex === void 0) { yearIndex = this.Year; }
            // debugger;
            if (index <= 0)
                return 0;
            if (index > this._superFractionsVsYear.length)
                return 1;
            var inx = this.yearToIndex(yearIndex);
            // var reduceIndexed = R.addIndex(R.reduce)
            var start = R.reduceIndexed(function (accum, fraction, inxInner) {
                return accum + ((inxInner < index) ? fraction[inx] : 0);
            })(0)(this._superFractionsVsYear);
            return Math.max(0, start);
        };
        Spending.dollarsToDollarString = function (dollars) {
            var out = dollars > 1000000000 ? (Math.round(dollars / 100000000) / 10) + ' Billion' :
                (Math.round(dollars / 100000) / 10) + ' Million';
            return out;
        };
        Spending.areaToRadius = function (area) {
            return area < 0 ? 0 : Math.sqrt(area / Math.PI);
        };
        Spending.radiusToArea = function (radius) {
            return Math.PI * radius * radius;
        };
        Spending.endall = function (transition, callback) {
            if (transition.size() === 0) {
                callback();
            }
            var n = 0;
            transition
                .each(function () { ++n; })
                .each("end", function () { if (!--n)
                callback.apply(this, arguments); });
        };
        // *******************************************************************
        // Statics
        // *******************************************************************
        Spending.key = function (d) {
            return d.sp + '-' + d.fn + '-' + d.sb;
        };
        Spending.pluckUniqueSuperFunctions = function (dats) {
            return R.pipe(R.pluck('sp'), R.uniq)(dats);
        };
        Spending.pluckUniqueFunctions = function (dats) {
            return R.pipe(R.pluck('fn'), R.uniq)(dats);
        };
        Spending.addKeysForD3 = function (obj, idx) {
            obj.x = 3 * idx;
            obj.y = 3 * idx;
            obj.cy = 200;
            obj.cx = 0;
            obj.radius = 4;
            return obj;
        };
        Spending.collide = function (node) {
            var r = node.radius + 16, nx1 = node.x - r, nx2 = node.x + r, ny1 = node.y - r, ny2 = node.y + r;
            return function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    var x = node.x - quad.point.x, y = node.y - quad.point.y, l = Math.sqrt(x * x + y * y), r = node.radius + quad.point.radius;
                    if (l < r) {
                        l = (l - r) / l * .5;
                        node.x -= x *= l;
                        node.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2
                    || x2 < nx1
                    || y1 > ny2
                    || y2 < ny1;
            };
        };
        return Spending;
    })(Utility.CbBase);
    Graph.Spending = Spending;
})(Graph || (Graph = {}));
/// <reference path="graph/yearhead.ts" />
/// <reference path="graph/spending.ts" />
/// <reference path="utility/data.all.ts" />
var onReady = function () {
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
    var newTargetYearHandler = function (newYear) {
        // console.log('year!', newYear);
        spending.YearDesired = newYear;
    };
    var path = (typeof setPath != 'undefined') ? setPath : 'data';
    var spending;
    var dataAll = new Utility.DataAll(path);
    dataAll.on('data', function (data) {
        // console.log('data!', data);
        spending = new Graph.Spending('graph-main', data);
        spending.Year = data.YearEnd;
        spending.YearDesired = data.YearEnd;
        yearHead.SetRange(data.YearStart, data.YearEnd);
        yearHead.on('newTarget', newTargetYearHandler);
        yearHead.handleNewYear(data.YearEnd, data.YearEnd, 0);
        spending.on('renderedYear', function (year) {
            yearTo.textContent = year + '';
            yearHead.newCurrentYear(year);
        });
        mode.onchange = function (evt) {
            var selectedOption = evt.currentTarget.value;
            // console.log(selectedOption);
            var obj = R.find(R.propEq('mode', selectedOption))(btns);
            if (!obj)
                return;
            // console.log(obj.enum, Graph.SpendingMode.RealCapita);
            spending.Mode = obj.enum;
            spending.RenderNewState();
        };
    });
    dataAll.Initialize();
};
document.addEventListener('DOMContentLoaded', onReady, false);
//# sourceMappingURL=index.js.map