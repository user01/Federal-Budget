/// <reference path="cbbase.ts" />
/// <reference path="../../../typings/d3.d.ts" />

declare var R: any;

module Utility {
  export class DataSet extends Utility.CbBase {
    private static staleSeconds: number = 259200;
    private static prefix: string = "DataSet_";

    protected _ready: boolean = false;
    public get Ready(): boolean {
      return this._ready;
    }
    protected _yearStart: number = 0;
    public get YearStart(): number {
      return this._yearStart;
    }
    protected _yearEnd: number = 0;
    public get YearEnd(): number {
      return this._yearEnd;
    }
    protected _factor: number = 1;
    public get Factor(): number {
      return this._factor;
    }
    protected _dataSet: Array<any> = [];
    public get DataSet(): Array<any> {
      return this._dataSet;
    }

    private get pullTimestampId(): string {
      return DataSet.prefix + this.path + '_Pull';
    }
    private get pullDataId(): string {
      return DataSet.prefix + this.path + '_Data';
    }

    protected get _data(): any {
      return JSON.parse(localStorage[this.pullDataId]);
    }
    protected set _data(value: any) {
      localStorage[this.pullDataId] = JSON.stringify(value);
    }
    private get timestamp(): number {
      return +localStorage[this.pullTimestampId];
    }
    private set timestamp(value: number) {
      localStorage[this.pullTimestampId] = value;
    }

    constructor(private path: string) {
      super();
    }

    public Initialize = (): void => {
      if (this.timestamp && this._data) {
        if (Date.now() - this.timestamp < DataSet.staleSeconds) {
          this.createPatchedData();
          return;
        }
      }
      d3.json(this.path, (error, rawData) => {
        if (!error) {
          this.timestamp = Date.now();
          this._data = rawData;
          this.createPatchedData();
        } else {
          this.renderError();
        }
      });
    }

    //this class level assumes data is all numbers
    protected createPatchedData = (): void => {
      var tempData = this._data; //prevents hammering .parse 
      this._yearStart = tempData.yearStart;
      this._yearEnd = tempData.yearEnd;
      this._factor = R.is(Number, tempData.factor) ? tempData.factor: 1;
      this._dataSet = R.map(R.multiply(this._factor),tempData.data); //provides a clone as well
      this._ready = true;

      this.runCallback('data', this);
    }

    private renderError = (): void => {
      console.warn('Unable to get ', this.path);
    }

  }
}