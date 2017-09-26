export namespace constants {

  export namespace headers.request {

    // standard forwarded for header
    export const X_FORWARDED_FOR = 'X-Forwarded-For';

    // standard forwarded proto header
    export const X_FORWARDED_PROTO = 'X-Forwarded-Proto';

    // standard forwarded port header
    export const X_FORWARDED_PORT = 'X-Forwarded-Port';

    // specifies the original timeout from client side
    export const NODESWORK_FORWARDED_CLIENT_TIMEOUT = 'Nodeswork-Forwarded-Client-Timeout';

    // specifies the target for routing layer
    export const NODESWORK_FORWARDED_TO = 'Nodeswork-Forwarded-To';
  }

  export namespace headers.response {

    // standard server header
    export const SERVER = 'SERVER';

    // indicate the response is generated by which applet or which product
    export const NODESWORK_PRODUCER = 'Nodeswork-Producer';

    // indicate the response is generated by which particular host
    export const NODESWORK_PRODUCER_HOST = 'Nodeswork-Producer-Host';

    // indicate the producing time
    export const NODESWORK_PRODUCER_DURATION = 'Nodeswork-Producer-Duration';
  }
}
