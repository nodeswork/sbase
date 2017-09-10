import {
  SocketRpcClient,
  remote,
  socketRpcClient,
} from '../../src/socket';

describe('SocketRpcClient', () => {

  var socket: SocketIO.Socket = {
    emit: (eventName: string, data: SBase.SocketRpcRequest) => {
      eventName.should.be.equal('socket-rpc.request');
      data.should.have.properties({
        responseEventName: 'socket-rpc.response',
        timeoutMillis: 100,
        name: 'foo',
      });

      const response: SBase.SocketRpcResponse = {
        requestId:  data.requestId,
        result:     'bar',
        error:      null,
      };
      setTimeout(
        () => this.fn(response),
        data.args[0] as number,
      );
    },
    on: (eventName: string, fn: Function) => {
      this.fn = fn;
    },
  } as any;

  @socketRpcClient({ timeoutMillis: 100 })
  class MyClient extends SocketRpcClient {

    @remote()
    async foo(t: number): Promise<string> { return null; }
  }

  it ('should work', async () => {
    const client = new MyClient(socket);
    let resp = await client.foo(1);
    resp.should.be.equal('bar');
    try {
      resp = await client.foo(200);
    } catch (e) {
      e.message.should.be.equal('promise timeout');
    }
  });
});
