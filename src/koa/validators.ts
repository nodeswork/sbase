import * as Router from 'koa-router';
import * as _ from 'underscore';
import * as validator from 'validator';

import { ParamError, ParamsOptions, processValidators } from './params';

/* tslint:disable:rule1 no-shadowed-variable */

const dotty = require('dotty');

export type Validator = (
  target: any,
  path: string | number,
  val: any,
  root: any,
) => boolean | string | ParamError | ParamError[];

// --------------------------- Validators ----------------------------------- //
// TODO: remove after https://github.com/Microsoft/TypeScript/issues/14127 fixed
export {
  isArray,
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
  isISO31661Alpha2,
  isISO8601,
  isISRC,
  isJSON,
  isLatLong,
  isLowercase,
  isMACAddress,
  isMD5,
  isMimeType,
  isMongoId,
  isMultibyte,
  isNumber,
  isNumeric,
  isPort,
  isString,
  isSurrogatePair,
  isUppercase,
  isVariableWidth,
  required,
};

const required: Validator = (target, path, val) => val != null;

export function contains(seed: string) {
  const contains: Validator = (target, path, val) =>
    val == null || validator.contains(val, seed);
  return contains;
}

export function equals(comparison: string) {
  const equals: Validator = (target, path, val) =>
    val == null || validator.equals(val, comparison);
  return equals;
}

export function isAfter(date?: string) {
  const isAfter: Validator = (target, path, val) =>
    val == null || validator.isAfter(val, date);
  return isAfter;
}

export function isAlpha(locale?: ValidatorJS.AlphaLocale) {
  const isAlpha: Validator = (target, path, val) =>
    val == null || validator.isAlpha(val, locale);
  return isAlpha;
}

export function isAlphanumeric(locale?: ValidatorJS.AlphaLocale) {
  const isAlphanumeric: Validator = (target, path, val) =>
    val == null || validator.isAlphanumeric(val, locale);
  return isAlphanumeric;
}

const isAscii: Validator = (target, path, val) =>
  val == null || validator.isAscii(val);

const isBase64: Validator = (target, path, val) =>
  val == null || validator.isBase64(val);

export function isBefore(date?: string) {
  const isBefore: Validator = (target, path, val) =>
    val == null || validator.isBefore(val, date);
  return isBefore;
}

const isBoolean: Validator = (target, path, val) =>
  val == null || validator.isBoolean(val);

export function isByteLength(min: number, max?: number): Validator;
export function isByteLength(
  options: ValidatorJS.IsByteLengthOptions,
): Validator;
export function isByteLength(a: any, b?: number): Validator {
  const isByteLength: Validator = (target, path, val) =>
    val == null || validator.isByteLength(val, a, b);
  return isByteLength;
}

const isCreditCard: Validator = (target, path, val) =>
  validator.isCreditCard(val);

export function isCurrency(options?: ValidatorJS.IsCurrencyOptions): Validator {
  const isCurrency: Validator = (target, path, val) =>
    val == null || validator.isCurrency(val, options);
  return isCurrency;
}

const isDataURI: Validator = (target, path, val) =>
  val == null || validator.isDataURI(val);

export function isDecimal(options?: ValidatorJS.IsDecimalOptions): Validator {
  const isDecimal: Validator = (target, path, val) =>
    val == null || validator.isDecimal(val, options);
  return isDecimal;
}

export function isDivisibleBy(number: number): Validator {
  const isDivisibleBy: Validator = (target, path, val) =>
    val == null || validator.isDivisibleBy(val, number);
  return isDivisibleBy;
}

export function isEmail(options?: ValidatorJS.IsEmailOptions): Validator {
  const isEmail: Validator = (target, path, val) =>
    val == null || validator.isEmail(val, options);
  return isEmail;
}

const isEmpty: Validator = (target, path, val) =>
  val == null || validator.isEmpty(val);

export function isEnum(enumObject?: object): Validator {
  const values = _.values(enumObject);
  const isEnum: Validator = (target, path, val) =>
    val == null || _.indexOf(values, val) >= 0;
  return isEnum;
}

export function isFQDN(options?: ValidatorJS.IsFQDNOptions): Validator {
  const isFQDN: Validator = (target, path, val) =>
    val == null || validator.isFQDN(val, options);
  return isFQDN;
}

export function isFloat(options?: ValidatorJS.IsFloatOptions): Validator {
  const isFloat: Validator = (target, path, val) =>
    val == null || validator.isFloat(val, options);
  return isFloat;
}

const isFullWidth: Validator = (target, path, val) =>
  val == null || validator.isFullWidth(val);

const isHalfWidth: Validator = (target, path, val) =>
  val == null || validator.isHalfWidth(val);

export function isHash(algorithm: ValidatorJS.HashAlgorithm): Validator {
  const isHash: Validator = (target, path, val) =>
    val == null || validator.isHash(val, algorithm);
  return isHash;
}

const isHexColor: Validator = (target, path, val) =>
  val == null || validator.isHexColor(val);

const isHexadecimal: Validator = (target, path, val) =>
  val == null || validator.isHexadecimal(val);

export function isIP(version?: number): Validator {
  const isIP: Validator = (target, path, val) =>
    val == null || validator.isIP(val, version);
  return isIP;
}

export function isISSN(options?: ValidatorJS.IsISSNOptions): Validator {
  const isISSN: Validator = (target, path, val) =>
    val == null || validator.isISSN(val, options);
  return isISSN;
}

const isISIN: Validator = (target, path, val) =>
  val == null || validator.isISIN(val);

const isISO8601: Validator = (target, path, val) =>
  val == null || validator.isISO8601(val);

const isISO31661Alpha2: Validator = (target, path, val) =>
  val == null || validator.isISO31661Alpha2(val);

const isISRC: Validator = (target, path, val) =>
  val == null || validator.isISRC(val);

export function isIn(values: any[]): Validator {
  const isIn: Validator = (target, path, val) =>
    val == null || validator.isIn(val, values);
  return isIn;
}

export function isInt(options?: ValidatorJS.IsIntOptions): Validator {
  const isInt: Validator = (target, path, val) =>
    val == null || validator.isInt(val, options);
  return isInt;
}

const isJSON: Validator = (target, path, val) =>
  val == null || validator.isJSON(val);

const isLatLong: Validator = (target, path, val) =>
  val == null || validator.isLatLong(val);

export function isLength(min: number, max?: number): Validator;
export function isLength(options: ValidatorJS.IsLengthOptions): Validator;
export function isLength(a: any, b?: number): Validator {
  const isLength: Validator = (target, path, val) => {
    if (val == null) {
      return true;
    } else if (_.isArray(val)) {
      return a <= val.length && (b == null || val.length <= b);
    } else {
      return validator.isLength(val, a, b);
    }
  };
  return isLength;
}

const isString: Validator = (target, path, val) =>
  val == null || _.isString(val);

const isArray: Validator = (target, path, val) => val == null || _.isArray(val);

const isNumber: Validator = (target, path, val) =>
  val == null || _.isNumber(val);

const isLowercase: Validator = (target, path, val) =>
  val == null || validator.isLowercase(val);

const isMACAddress: Validator = (target, path, val) =>
  val == null || validator.isMACAddress(val);

const isMD5: Validator = (target, path, val) =>
  val == null || validator.isMD5(val);

const isMimeType: Validator = (target, path, val) =>
  val == null || validator.isMimeType(val);

export function isInRange(min: number, max?: number): Validator {
  const isInRange: Validator = (target, path, val) => {
    return val == null || (val >= min && (max == null || val <= max));
  };
  return isInRange;
}

export function isMobilePhone(
  locale: ValidatorJS.MobilePhoneLocale,
  options?: ValidatorJS.IsMobilePhoneOptions,
): Validator {
  const isMobilePhone: Validator = (target, path, val) =>
    val == null || validator.isMobilePhone(val, locale, options);
  return isMobilePhone;
}

const isMongoId: Validator = (target, path, val) =>
  val == null || validator.isMongoId(val);

const isMultibyte: Validator = (target, path, val) =>
  val == null || validator.isMultibyte(val);

const isNumeric: Validator = (target, path, val) =>
  val == null || validator.isNumeric(val);

const isPort: Validator = (target, path, val) =>
  val == null || validator.isPort(val);

export function isPostalCode(locale: ValidatorJS.PostalCodeLocale): Validator {
  const isPostalCode: Validator = (target, path, val) =>
    val == null || validator.isPostalCode(val, locale);
  return isPostalCode;
}

const isSurrogatePair: Validator = (target, path, val) =>
  val == null || validator.isSurrogatePair(val);

export function isURL(options?: ValidatorJS.IsURLOptions): Validator {
  const isURL: Validator = (target, path, val) =>
    val == null || validator.isURL(val, options);
  return isURL;
}

export function isUUID(
  version?: 3 | 4 | 5 | '3' | '4' | '5' | 'all',
): Validator {
  const isUUID: Validator = (target, path, val) =>
    val == null || validator.isUUID(val, version);
  return isUUID;
}

const isUppercase: Validator = (target, path, val) =>
  val == null || validator.isUppercase(val);

const isVariableWidth: Validator = (target, path, val) =>
  val == null || validator.isVariableWidth(val);

export function isWhitelisted(chars: string | string[]): Validator {
  const isWhitelisted: Validator = (target, path, val) =>
    val == null || validator.isWhitelisted(val, chars);
  return isWhitelisted;
}

export function matches(
  pattern: RegExp | string,
  modifiers?: string,
): Validator {
  const matches: Validator = (target, path, val) =>
    val == null || validator.matches(val, pattern, modifiers);
  return matches;
}

// --------------------------- Sanitizers ----------------------------------- //
export function blacklist(chars: string) {
  const blacklist: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.blacklist(val, chars));
    }
    return true;
  };
  return blacklist;
}

export function escape(target: any, path: string, val: any) {
  if (val != null) {
    dotty.put(target, path, validator.escape(val));
  }
  return true;
}

export function unescape(target: any, path: string, val: any) {
  if (val != null) {
    dotty.put(target, path, validator.unescape(val));
  }
  return true;
}

export function ltrim(chars?: string) {
  const ltrim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.ltrim(val, chars));
    }
    return true;
  };
  return ltrim;
}

export function normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions) {
  const normalizeEmail: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.normalizeEmail(val, options));
    }
    return true;
  };
  return normalizeEmail;
}

export function rtrim(chars?: string) {
  const rtrim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.rtrim(val, chars));
    }
    return true;
  };
  return rtrim;
}

export function stripLow(keep_new_lines?: boolean) {
  const stripLow: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.stripLow(val, keep_new_lines));
    }
    return true;
  };
  return stripLow;
}

export function toBoolean(strict?: boolean) {
  const toBoolean: Validator = (target, path, val) => {
    if (val != null && !_.isBoolean(val)) {
      dotty.put(target, path, validator.toBoolean(val, strict));
    }
    return true;
  };
  return toBoolean;
}

export function toDate(target: any, path: string, val: any) {
  if (val != null && !_.isDate(val)) {
    dotty.put(target, path, validator.toDate(val));
  }
  return true;
}

export function toFloat(target: any, path: string, val: any) {
  if (val != null && !_.isNumber(val)) {
    dotty.put(target, path, validator.toFloat(val));
  }
  return true;
}

export function toInt(radix?: number) {
  const toInt: Validator = (target, path, val) => {
    if (val != null) {
      const value = _.isNumber(val)
        ? Math.floor(val)
        : validator.toInt(val, radix);

      dotty.put(target, path, value);
    }
    return true;
  };
  return toInt;
}

export function trim(chars?: string) {
  const trim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.trim(val, chars));
    }
    return true;
  };
  return trim;
}

export function whitelist(chars?: string) {
  const whitelist: Validator = (target, path, val) => {
    if (val != null) {
      dotty.put(target, path, validator.whitelist(val, chars));
    }
    return true;
  };
  return whitelist;
}

export function split(separator: string = ',', restricted: boolean = false) {
  const split: Validator = (target, path, val) => {
    if (val != null && !_.isString(val)) {
      return !restricted;
    }

    if (val != null) {
      dotty.put(target, path, val.split(separator));
    }
    return true;
  };
  return split;
}

export function withDefault(option: any) {

  const withDefault: Validator = (target, path, val, root) => {
    if (val == null) {
      val = _.isFunction(option) ? option(root) : option;
      dotty.put(target, path, val);
    }
    return true;
  };

  return withDefault;
}

export function map(fn: (val: any, root: any) => any) {

  const map: Validator = (target, path, val, root) => {
    if (val != null) {
      val = fn(val, root);
      dotty.put(target, path, val);
    }
    return true;
  };

  return map;
}

export function array(options: ParamsOptions | Validator | Validator[]) {
  const selfValidators =
    _.isArray(options) || _.isFunction(options) ? _.flatten([options]) : [];

  const mappedOptions =
    _.isArray(options) || _.isFunction(options)
      ? []
      : _.map(options, (v, key) => {
          const vs: Validator[] = _.chain([v])
            .flatten()
            .filter(x => !!x)
            .value();

          if (key.startsWith('!')) {
            vs.push(required);
            key = key.substring(1);
          }
          return { key, validators: vs };
        });

  const array: Validator = (target, path, val, root) => {
    if (val == null) {
      return;
    }

    if (!_.isArray(val)) {
      return 'not an array';
    }

    const errors: ParamError[] = [];

    _.each(val, (v, index: number) => {
      for (const fn of selfValidators) {
        const uv = val[index];
        const pass = fn(val, index, uv, root);
        if (pass === false || _.isString(pass)) {
          errors.push({
            path: index,
            value: uv,
            failed: fn.name,
            reason: pass || '',
          });
        }

        if (_.isArray(pass)) {
          for (const error of pass) {
            errors.push({
              path: index + '.' + error.path,
              value: error.value,
              failed: fn.name + '>' + error.failed,
              reason: error.reason,
            });
          }
        }
      }

      const nerrors = processValidators(val[index], mappedOptions, root);

      for (const error of nerrors) {
        errors.push({
          path: index + '.' + error.path,
          value: error.value,
          failed: error.failed,
          reason: error.reason,
        });
      }
    });

    return errors;
  };
  return array;
}
