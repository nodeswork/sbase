import { NodesworkError } from '@nodeswork/utils';

const UNKOWN_METHOD_ERROR = new NodesworkError('unkown method').toJSON();

export function socketRpcHost(
  socket: SocketIOClient.Socket,
  target: any,
  eventNamePrefix: string,
) {
  socket.on(
    `${eventNamePrefix}.request`,
    async (request: sbase.socket.SocketRpcRequest) => {
      const fn: () => any = target[request.name];
      let result;
      let error;
      if (fn == null) {
        error = UNKOWN_METHOD_ERROR;
      } else {
        try {
          result = await fn.apply(target, request.args);
        } catch (e) {
          error = NodesworkError.cast(e).toJSON({
            cause: true,
            stack: true,
          });
        }
      }
      const response: sbase.socket.SocketRpcResponse = {
        requestId: request.requestId,
        result,
        error,
      };
      socket.emit(request.responseEventName, response);
    },
  );
}
