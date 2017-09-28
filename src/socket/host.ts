import { NodesworkError } from '@nodeswork/utils';

import * as logger        from '@nodeswork/logger';

const LOG                  = logger.getLogger();
const UNKOWN_METHOD_ERROR  = new NodesworkError('unkown method').toJSON();

export function socketRpcHost(
  socket: SocketIOClient.Socket,
  target: any,
  eventNamePrefix: string,
) {
  socket.on(
    `${eventNamePrefix}.request`,
    async (request: sbase.socket.SocketRpcRequest) => {
      LOG.debug('Receive request', JSON.parse(JSON.stringify(request)));
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
      LOG.debug('Send response', JSON.parse(JSON.stringify(response)));
      socket.emit(request.responseEventName, response);
    },
  );
}
