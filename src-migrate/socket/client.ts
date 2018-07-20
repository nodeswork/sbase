import * as LRU      from 'lru-cache';
import * as SocketIO from 'socket.io';

import * as logger   from '@nodeswork/logger';

import './def';

import '@nodeswork/utils/dist/promise';

const LOG = logger.getLogger();

type promiseFunc = (res?: any) => void;

export class SocketRpcClient {

  public timeoutMillis:      number;
  public requestEventName:   string;
  public responseEventName:  string;
  private $cache:            LRU.Cache<number, promiseFunc[]>;
  private $requsetId:        number = 0;

  constructor(public socket: SocketIO.Socket) {}

  public async call(name: string, args: any[], timeoutMillis: number) {
    const request: sbase.socket.SocketRpcRequest = {
      requestId: ++this.$requsetId,
      responseEventName: this.responseEventName,
      timeoutMillis,
      name,
      args,
    };

    LOG.debug('Send rpc request', JSON.parse(JSON.stringify(request)));
    this.socket.emit(this.requestEventName, request);

    const promise = new Promise((resolve, reject) => {
      this.$cache.set(
        this.$requsetId,
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

  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    if (!(constructor.prototype instanceof SocketRpcClient)) {
      throw new Error(
        `${constructor.name} is not a subclass of SocketRpcClient`,
      );
    }
    return class extends constructor {
      public timeoutMillis = options.timeoutMillis || 1000;
      public requestEventName = `${options.eventNamePrefix || 'socket-rpc'}.request`;
      public responseEventName = `${options.eventNamePrefix || 'socket-rpc'}.response`;
      public socket: SocketIO.Socket;
      public $cache = new LRU<number, promiseFunc[]>();
      public ___ = this.socket.on(
        this.responseEventName,
        (resp: sbase.socket.SocketRpcResponse) => {
          LOG.debug('Receive rpc response', JSON.parse(JSON.stringify(resp)));
          const cached = this.$cache.get(resp.requestId);
          if (cached == null) {
            LOG.error('Request is already timedout', resp);
            return;
          }
          const [resolve, reject] = cached;
          if (resp.error != null) {
            reject(resp.error);
          } else {
            resolve(resp.result);
          }
        },
      );
    };
  };
}
