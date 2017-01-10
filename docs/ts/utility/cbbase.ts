
module Utility {
  export class CbBase {

    private callbacks:any={};

    //**************************************************************************
    //**************************************************************************
    //
    //    Event handling code
    //
    //**************************************************************************
    //**************************************************************************

    public on = (evt:string,fn:(any)=>void):void => {
      if (typeof evt !== 'string') return;
      this.ensureExists(evt);
      this.callbacks[evt].push(fn);
    }
    public off = (evt:string,fn:(any)=>void):void => {
      if (typeof evt !== 'string') return;
      if (!this.callbacks[evt]) return;
      for (var i=0;i<this.callbacks[evt].length;i++) {
        if (this.callbacks[evt][i] !== fn) continue;
        delete this.callbacks[evt][i];
        return;
      }
    }

    protected runCallback = (evt:string,payload:any=null):void =>{
      if (typeof evt !== 'string') return;
      if (!this.callbacks[evt]) return;
      for (var i=0;i<this.callbacks[evt].length;i++) {
        this.callbacks[evt][i](payload);
      }
    }

    private ensureExists = (evt:string):void => {
      if (!this.callbacks[evt])
        this.callbacks[evt] = new Array<(any)=>void>();
    }
  }
}
