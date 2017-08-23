import * as _ from 'underscore'
import * as validator from 'validator'
import { IRouterContext } from 'koa-router'

import { NodesworkError } from '@nodeswork/utils'

export namespace filters {

  export function parse(): IParamFilter {
    let items = _.flatten(arguments);

    for (let i = 0; i < items.length; i++) {
      if (_.isString(items[i])) {
        let descriptor: string = items[i];
        let required = false;
        items[i] = [];

        if (descriptor.startsWith('$')) {
          required = true;
          descriptor = descriptor.substring(1)
        }

        let [path, ...filterNames] = descriptor.split(':');

        items[i].push(extract(path));
        if (required) {
          items[i].push(Required);
        }

        for (let name of filterNames) {
          let f: IParamFilter = (filters as any)[name];
          if (f == null) {
            throw new NodesworkError('Filter is missing', {
              filter: name,
              descriptor: descriptor,
            });
          }
          items[i].push(f);
        }
      } else if (_.isFunction(items[i])) {
        continue;
      } else {
        throw new NodesworkError('Unkown param filter', {
          item: items[i],
        });
      }
    }

    items = _.flatten(items);

    return async function(val: any, ctx: IRouterContext) {
      let paths: string[] = [];
      let ret: any = val;

      try {
        for (let f of items) {
          let p: string = (f as any).path;
          if (p) { paths.push(p); }
          ret = await f(ret, ctx);
        }
        return ret;
      } catch (e) {
        if (e instanceof NodesworkError) {
          e.meta.responseCode = 400;
          e.meta.path = paths.join('.');
          throw e;
        } else {
          console.error(e);
          throw new NodesworkError('internal service error', {
            responseCode: 500,
          }, e);
        }
      }
    };
  }

  export function extract(path: string): IParamFilter {
    let paths = path.split('.');
    function Extract(val: any) {
      let ret: any = val;
      for (let p of paths) {
        if (ret == null) { break; }
        ret = ret[p];
      }
      return ret;
    };
    (Extract as any).path = path;
    return Extract;
  }

  export function Required(val: any): any {
    if (val == null) {
      throw new NodesworkError('Missing value');
    }
    return val;
  }

  const trueValues = [ '1', 'true', 1, true ];
  const falseValues = [ '0', 'false', 0, false ];

  export function Boolean(val: any): boolean {
    if (val == null) { return null; }
    if (trueValues.indexOf(val) >= 0) { return true; }
    if (falseValues.indexOf(val) >= 0) { return false; }
    throw new NodesworkError('Invalid boolean value', {
      value: val,
    });
  }

  export function Integer(val: any): number {
    if (val == null) { return null; }
    let ret = parseInt(val);
    if (_.isNaN(ret)) {
      throw new NodesworkError('Invalid integer value', {
        value: val,
      });
    }
    return ret;
  }

  export function Json(val: any): object {
    if (val == null) { return null; }
    try {
      return JSON.parse(val);
    } catch (e) {
      throw new NodesworkError('Invalid json value', {
        value: val,
        error: e.message,
      });
    }
  }

  export function setDefault(defaultVal: any): IParamFilter {
    return function Default(val: any) {
      return val == null ? defaultVal : val;
    }
  }
}

export type IParamFilter = (val: any, ctx?: IRouterContext) => any
