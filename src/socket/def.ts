namespace SBase {

  export interface SocketRpcRequest {
    requestId:          number;
    responseEventName:  string;
    timeoutMillis:      number;
    name:               string;
    args:               any[];
  }

  export interface SocketRpcResponse {
    requestId:          number;
    result?:            any;
    error?:             any;
  }
}
