/// <reference path="cbbase.ts" />
/// <reference path="../../../typings/d3.d.ts" />

module Utility {
  export class DataSet extends Utility.CbBase {
    private static staleSeconds: number = 259200;
    private static prefix: string = "DataSet_";

    private _ready: boolean = false;
    public get Ready(): boolean {
      return this._ready;
    }
    private _yearStart: number = 0;
    public get YearStart(): number {
      return this._yearStart;
    }
    private _yearEnd: number = 0;
    public get YearEnd(): number {
      return this._yearEnd;
    }
    private _dataSet: Array<number> = [];
    public get DataSet(): Array<number> {
      return this._dataSet;
    }

    private get pullTimestampId(): string {
      return DataSet.prefix + this.path + '_Pull';
    }
    private get pullDataId(): string {
      return DataSet.prefix + this.path + '_Data';
    }

    private get _data(): any {
      return JSON.parse(localStorage[this.pullDataId]);
    }
    private set _data(value: any) {
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

    private createPatchedData = (): void => {
      var tempData = this._data; //prevents hammering .parse 
      this._yearStart = tempData.yearStart;
      this._yearEnd = tempData.yearEnd;
      this._dataSet = tempData.data;
      this._ready = true;

      this.runCallback('data', this);
    }

    private renderError = (): void => {
      console.warn('Unable to get ', this.path);
    }

  }
}