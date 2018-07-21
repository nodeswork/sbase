import * as _ from 'underscore';
import * as Router from 'koa-router';
import * as validator from 'validator';

/* tslint:disable:rule1 no-shadowed-variable */

const dotty = require('dotty');

export function params(options: ParamsOptions): Router.IMiddleware {
  const mappedOptions = _.map(options, (v, key) => {
    const validators: Validator[] = _.flatten([v]);
    if (key.startsWith('!')) {
      validators.push(required);
      key = key.substring(1);
    }
    return {key, validators};
  });

  return async (
    ctx: Router.IRouterContext & ParamsContext, next: () => void,
  ) => {
    ctx.errors = [];
    for (const o of mappedOptions) {
      const value = dotty.get(ctx.request, o.key);
      for (const fn of o.validators) {
        const pass = fn(ctx, o.key, value);
        if (!pass) {
          ctx.errors.push({
            path: o.key,
            value,
            failed: fn.name,
          });
        }
      }
    }

    if (!_.isEmpty(ctx.errors)) {
      ctx.body = { errors: ctx.errors };
      ctx.status = 422;
    } else {
      await next();
    }
  };
}

export interface ParamsContext {
  errors?: ParamError[];
}

export interface ParamsOptions {
  [key: string]: Validator | Validator[];
}

export type Validator = (
  ctx: Router.IRouterContext, path: string, val: any,
) => boolean;

export interface ParamError {
  path:    string;
  value:   any;
  failed:  string;
}

// --------------------------- Validators ----------------------------------- //
// TODO: remove after https://github.com/Microsoft/TypeScript/issues/14127 fixed
export {
  required,
  isAscii,
  isBase64,
  isBoolean,
  isCreditCard,
  isDataURI,
  isEmpty,
  isFullWidth,
  isHalfWidth,
  isHexColor,
  isHexadecimal,
  isISIN,
  isISO8601,
  isISO31661Alpha2,
  isISRC,
  isJSON,
  isLatLong,
  isLowercase,
  isMACAddress,
  isMD5,
  isMimeType,
  isMongoId,
  isMultibyte,
  isNumeric,
  isPort,
  isSurrogatePair,
  isUppercase,
  isVariableWidth,
};

const required: Validator = (ctx, path, val) => val != null;

export function contains(seed: string) {
  const contains: Validator = (ctx, path, val) => (
    validator.contains(val, seed)
  );
  return contains;
}

export function equals(comparison: string) {
  const equals: Validator = (ctx, path, val) => (
    validator.equals(val, comparison)
  );
  return equals;
}

export function isAfter(date?: string) {
  const isAfter: Validator = (ctx, path, val) => validator.isAfter(val, date);
  return isAfter;
}

export function isAlpha(locale?: ValidatorJS.AlphaLocale) {
  const isAlpha: Validator = (ctx, path, val) => (
    validator.isAlpha(val, locale)
  );
  return isAlpha;
}

export function isAlphanumeric(locale?: ValidatorJS.AlphaLocale) {
  const isAlphanumeric: Validator = (ctx, path, val) => (
    validator.isAlphanumeric(val, locale)
  );
  return isAlphanumeric;
}

const isAscii: Validator = (ctx, path, val) => (
  validator.isAscii(val)
);

const isBase64: Validator = (ctx, path, val) => (
  validator.isBase64(val)
);

export function isBefore(date?: string) {
  const isBefore: Validator = (ctx, path, val) => validator.isBefore(val, date);
  return isBefore;
}

const isBoolean: Validator = (ctx, path, val) => (
  validator.isBoolean(val)
);

export function isByteLength(min: number, max?: number): Validator;
export function isByteLength(
  options: ValidatorJS.IsByteLengthOptions,
): Validator;
export function isByteLength(a: any, b?: number): Validator {
  const isByteLength: Validator = (ctx, path, val) => (
    validator.isByteLength(val, a, b)
  );
  return isByteLength;
}

const isCreditCard: Validator = (ctx, path, val) => (
  validator.isCreditCard(val)
);

export function isCurrency(options?: ValidatorJS.IsCurrencyOptions): Validator {
  const isCurrency: Validator = (ctx, path, val) => (
    validator.isCurrency(val, options)
  );
  return isCurrency;
}

const isDataURI: Validator = (ctx, path, val) => (
  validator.isDataURI(val)
);

export function isDecimal(options?: ValidatorJS.IsDecimalOptions): Validator {
  const isDecimal: Validator = (ctx, path, val) => (
    validator.isDecimal(val, options)
  );
  return isDecimal;
}

export function isDivisibleBy(number: number): Validator {
  const isDivisibleBy: Validator = (ctx, path, val) => (
    validator.isDivisibleBy(val, number)
  );
  return isDivisibleBy;
}

export function isEmail(options?: ValidatorJS.IsEmailOptions): Validator {
  const isEmail: Validator = (ctx, path, val) => (
    validator.isEmail(val, options)
  );
  return isEmail;
}

const isEmpty: Validator = (ctx, path, val) => (
  validator.isEmpty(val)
);

export function isEnum(enumObject?: object): Validator {
  const values = _.values(enumObject);
  const isEnum: Validator = (ctx, path, val) => (
    _.indexOf(values, val) >= 0
  );
  return isEnum;
}

export function isFQDN(options?: ValidatorJS.IsFQDNOptions): Validator {
  const isFQDN: Validator = (ctx, path, val) => (
    validator.isFQDN(val, options)
  );
  return isFQDN;
}

export function isFloat(options?: ValidatorJS.IsFloatOptions): Validator {
  const isFloat: Validator = (ctx, path, val) => (
    validator.isFloat(val, options)
  );
  return isFloat;
}

const isFullWidth: Validator = (ctx, path, val) => (
  validator.isFullWidth(val)
);

const isHalfWidth: Validator = (ctx, path, val) => (
  validator.isHalfWidth(val)
);

export function isHash(algorithm: ValidatorJS.HashAlgorithm): Validator {
  const isHash: Validator = (ctx, path, val) => (
    validator.isHash(val, algorithm)
  );
  return isHash;
}

const isHexColor: Validator = (ctx, path, val) => (
  validator.isHexColor(val)
);

const isHexadecimal: Validator = (ctx, path, val) => (
  validator.isHexadecimal(val)
);

export function isIP(version?: number): Validator {
  const isIP: Validator = (ctx, path, val) => (
    validator.isIP(val, version)
  );
  return isIP;
}

export function isISSN(options?: ValidatorJS.IsISSNOptions): Validator {
  const isISSN: Validator = (ctx, path, val) => (
    validator.isISSN(val, options)
  );
  return isISSN;
}

const isISIN: Validator = (ctx, path, val) => (
  validator.isISIN(val)
);

const isISO8601: Validator = (ctx, path, val) => (
  validator.isISO8601(val)
);

const isISO31661Alpha2: Validator = (ctx, path, val) => (
  validator.isISO31661Alpha2(val)
);

const isISRC: Validator = (ctx, path, val) => (
  validator.isISRC(val)
);

export function isIn(values: any[]): Validator {
  const isIn: Validator = (ctx, path, val) => (
    validator.isIn(val, values)
  );
  return isIn;
}

export function isInt(options?: ValidatorJS.IsIntOptions): Validator {
  const isInt: Validator = (ctx, path, val) => (
    validator.isInt(val, options)
  );
  return isInt;
}

const isJSON: Validator = (ctx, path, val) => (
  validator.isJSON(val)
);

const isLatLong: Validator = (ctx, path, val) => (
  validator.isLatLong(val)
);

export function isLength(min: number, max?: number): Validator;
export function isLength(
  options: ValidatorJS.IsLengthOptions,
): Validator;
export function isLength(a: any, b?: number): Validator {
  const isLength: Validator = (ctx, path, val) => (
    validator.isLength(val, a, b)
  );
  return isLength;
}

const isLowercase: Validator = (ctx, path, val) => (
  validator.isLowercase(val)
);

const isMACAddress: Validator = (ctx, path, val) => (
  validator.isMACAddress(val)
);

const isMD5: Validator = (ctx, path, val) => (
  validator.isMD5(val)
);

const isMimeType: Validator = (ctx, path, val) => (
  validator.isMimeType(val)
);

export function isMobilePhone(
  locale: ValidatorJS.MobilePhoneLocale,
  options?: ValidatorJS.IsMobilePhoneOptions,
): Validator {
  const isMobilePhone: Validator = (ctx, path, val) => (
    validator.isMobilePhone(val, locale, options)
  );
  return isMobilePhone;
}

const isMongoId: Validator = (ctx, path, val) => (
  validator.isMongoId(val)
);

const isMultibyte: Validator = (ctx, path, val) => (
  validator.isMultibyte(val)
);

const isNumeric: Validator = (ctx, path, val) => (
  validator.isNumeric(val)
);

const isPort: Validator = (ctx, path, val) => (
  validator.isPort(val)
);

export function isPostalCode(locale: ValidatorJS.PostalCodeLocale): Validator {
  const isPostalCode: Validator = (ctx, path, val) => (
    validator.isPostalCode(val, locale)
  );
  return isPostalCode;
}

const isSurrogatePair: Validator = (ctx, path, val) => (
  validator.isSurrogatePair(val)
);

export function isURL(options?: ValidatorJS.IsURLOptions): Validator {
  const isURL: Validator = (ctx, path, val) => (
    validator.isURL(val, options)
  );
  return isURL;
}

export function isUUID(version?: 3|4|5|"3"|"4"|"5"|"all"): Validator {
  const isUUID: Validator = (ctx, path, val) => (
    validator.isUUID(val, version)
  );
  return isUUID;
}

const isUppercase: Validator = (ctx, path, val) => (
  validator.isUppercase(val)
);

const isVariableWidth: Validator = (ctx, path, val) => (
  validator.isVariableWidth(val)
);

export function isWhitelisted(chars: string | string[]): Validator {
  const isWhitelisted: Validator = (ctx, path, val) => (
    validator.isWhitelisted(val, chars)
  );
  return isWhitelisted;
}

export function matches(
  pattern: RegExp | string, modifiers?: string,
): Validator {
  const matches: Validator = (ctx, path, val) => (
    validator.matches(val, pattern, modifiers)
  );
  return matches;
}

// --------------------------- Sanitizers ----------------------------------- //
export function blacklist(chars: string) {
  const blacklist: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.blacklist(val, chars));
    return true;
  };
  return blacklist;
}

export function escape(ctx: Router.IRouterContext, path: string, val: any) {
  dotty.put(ctx.request, path, validator.escape(val));
  return true;
}

export function unescape(ctx: Router.IRouterContext, path: string, val: any) {
  dotty.put(ctx.request, path, validator.unescape(val));
  return true;
}

export function ltrim(chars?: string) {
  const ltrim: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.ltrim(val, chars));
    return true;
  };
  return ltrim;
}

export function normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions) {
  const normalizeEmail: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.normalizeEmail(val, options));
    return true;
  };
  return normalizeEmail;
}

export function rtrim(chars?: string) {
  const rtrim: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.rtrim(val, chars));
    return true;
  };
  return rtrim;
}

export function stripLow(keep_new_lines?: boolean) {
  const stripLow: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.stripLow(val, keep_new_lines));
    return true;
  };
  return stripLow;
}

export function toBoolean(strict?: boolean) {
  const toBoolean: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.toBoolean(val, strict));
    return true;
  };
  return toBoolean;
}

export function toDate(ctx: Router.IRouterContext, path: string, val: any) {
  dotty.put(ctx.request, path, validator.toDate(val));
  return true;
}

export function toFloat(ctx: Router.IRouterContext, path: string, val: any) {
  dotty.put(ctx.request, path, validator.toFloat(val));
  return true;
}

export function toInt(radix?: number) {
  const toInt: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.toInt(val, radix));
    return true;
  };
  return toInt;
}

export function trim(chars?: string) {
  const trim: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.trim(val, chars));
    return true;
  };
  return trim;
}

export function whitelist(chars?: string) {
  const whitelist: Validator = (ctx, path, val) => {
    dotty.put(ctx.request, path, validator.whitelist(val, chars));
    return true;
  };
  return whitelist;
}
