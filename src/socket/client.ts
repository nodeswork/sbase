import * as LRU from 'lru-cache';

import '@nodeswork/utils/dist/promise';

export class SocketRpcClient {

  public timeoutMillis:      number;
  public requestEventName:   string;
  public responseEventName:  string;
  private _cache:            LRU.Cache<number, Function[]>;
  private _requsetId:        number = 0;

  constructor(public socket: SocketIO.Socket) {}

  async call(name: string, args: any[], timeoutMillis: number) {
    const request: sbase.socket.SocketRpcRequest = {
      requestId: ++this._requsetId,
      responseEventName: this.responseEventName,
      timeoutMillis,
      name,
      args,
    };
    this.socket.emit(this.requestEventName, request);

    const promise = new Promise((resolve, reject) => {
      this._cache.set(
        this._requsetId,
        [resolve, reject],
        timeoutMillis,
      );
    }).timeout(timeoutMillis);
    return promise;
  }
}

export function remote(options: {
  timeoutMillis?: number;
} = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.value = function() {
      return this.call(
        propertyKey,
        Array.prototype.slice.call(arguments),
        options.timeoutMillis || this.timeoutMillis,
      );
    };
  };
}

export function socketRpcClient(options: {
  timeoutMillis?:    number;
  eventNamePrefix?:  string;
} = {}) {

  return <T extends {new(...args:any[]): {}}>(constructor: T) => {
    if (!(constructor.prototype instanceof SocketRpcClient)) {
      throw new Error(
        `${constructor.name} is not a subclass of SocketRpcClient`,
      );
    }
    return class extends constructor {
      timeoutMillis = options.timeoutMillis || 1000;
      requestEventName = `${options.eventNamePrefix || 'socket-rpc'}.request`;
      responseEventName = `${options.eventNamePrefix || 'socket-rpc'}.response`;
      socket: SocketIO.Socket;
      _cache = new LRU<number, Function[]>();
      ___ = this.socket.on(
        this.responseEventName,
        (resp: sbase.socket.SocketRpcResponse) => {
          const cached = this._cache.get(resp.requestId);
          if (cached == null) {
            console.error('timedout', resp);
            return;
          }
          const [resolve, reject] = cached;
          if (resp.error != null) {
            reject(resp.error);
          } else {
            resolve(resp.result);
          }
        }
      );
    };
  };
}
