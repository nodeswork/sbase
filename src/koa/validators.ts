import * as _ from 'underscore';
import * as moment from 'moment-timezone';
import * as validator from 'validator';

import { ParamError, ParamsOptions, processValidators } from './params';

import { withInheritedProps as dotty } from 'object-path';
import { unitOfTime } from 'moment';

/* tslint:disable:rule1 no-shadowed-variable */

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

const required: Validator = (_target, _path, val) => val != null;

export function contains(seed: string) {
  const contains: Validator = (_target, _path, val) =>
    val == null || validator.contains(val, seed);
  return contains;
}

export function equals(comparison: string) {
  const equals: Validator = (_target, _path, val) =>
    val == null || validator.equals(val, comparison);
  return equals;
}

export function isAfter(date?: string) {
  const isAfter: Validator = (_target, _path, val) =>
    val == null || validator.isAfter(val, date);
  return isAfter;
}

export function isAlpha(locale?: ValidatorJS.AlphaLocale) {
  const isAlpha: Validator = (_target, _path, val) =>
    val == null || validator.isAlpha(val, locale);
  return isAlpha;
}

export function isAlphanumeric(locale?: ValidatorJS.AlphaLocale) {
  const isAlphanumeric: Validator = (_target, _path, val) =>
    val == null || validator.isAlphanumeric(val, locale);
  return isAlphanumeric;
}

const isAscii: Validator = (_target, _path, val) =>
  val == null || validator.isAscii(val);

const isBase64: Validator = (_target, _path, val) =>
  val == null || validator.isBase64(val);

export function isBefore(date?: string) {
  const isBefore: Validator = (_target, _path, val) =>
    val == null || validator.isBefore(val, date);
  return isBefore;
}

const isBoolean: Validator = (_target, _path, val) =>
  val == null || validator.isBoolean(val);

export function isByteLength(min: number, max?: number): Validator;
export function isByteLength(
  options: ValidatorJS.IsByteLengthOptions,
): Validator;
export function isByteLength(a: any, b?: number): Validator {
  const isByteLength: Validator = (_target, _path, val) =>
    val == null || validator.isByteLength(val, a, b);
  return isByteLength;
}

const isCreditCard: Validator = (_target, _path, val) =>
  validator.isCreditCard(val);

export function isCurrency(options?: ValidatorJS.IsCurrencyOptions): Validator {
  const isCurrency: Validator = (_target, _path, val) =>
    val == null || validator.isCurrency(val, options);
  return isCurrency;
}

const isDataURI: Validator = (_target, _path, val) =>
  val == null || validator.isDataURI(val);

export function isDecimal(options?: ValidatorJS.IsDecimalOptions): Validator {
  const isDecimal: Validator = (_target, _path, val) =>
    val == null || validator.isDecimal(val, options);
  return isDecimal;
}

export function isDivisibleBy(number: number): Validator {
  const isDivisibleBy: Validator = (_target, _path, val) =>
    val == null || validator.isDivisibleBy(val, number);
  return isDivisibleBy;
}

export function isEmail(options?: ValidatorJS.IsEmailOptions): Validator {
  const isEmail: Validator = (_target, _path, val) =>
    val == null || validator.isEmail(val, options);
  return isEmail;
}

const isEmpty: Validator = (_target, _path, val) =>
  val == null || validator.isEmpty(val);

export function isEnum(
  enumObject?: object,
  from: 'value' | 'key' = 'value',
): Validator {
  const values = from === 'value' ? _.values(enumObject) : _.keys(enumObject);
  const isEnum: Validator = (_target, _path, val) =>
    val == null || _.indexOf(values, val) >= 0;
  return isEnum;
}

export function isFQDN(options?: ValidatorJS.IsFQDNOptions): Validator {
  const isFQDN: Validator = (_target, _path, val) =>
    val == null || validator.isFQDN(val, options);
  return isFQDN;
}

export function isFloat(options?: ValidatorJS.IsFloatOptions): Validator {
  const isFloat: Validator = (_target, _path, val) =>
    val == null || validator.isFloat(val, options);
  return isFloat;
}

const isFullWidth: Validator = (_target, _path, val) =>
  val == null || validator.isFullWidth(val);

const isHalfWidth: Validator = (_target, _path, val) =>
  val == null || validator.isHalfWidth(val);

export function isHash(algorithm: ValidatorJS.HashAlgorithm): Validator {
  const isHash: Validator = (_target, _path, val) =>
    val == null || validator.isHash(val, algorithm);
  return isHash;
}

const isHexColor: Validator = (_target, _path, val) =>
  val == null || validator.isHexColor(val);

const isHexadecimal: Validator = (_target, _path, val) =>
  val == null || validator.isHexadecimal(val);

export function isIP(version?: number): Validator {
  const isIP: Validator = (_target, _path, val) =>
    val == null || validator.isIP(val, version);
  return isIP;
}

export function isISSN(options?: ValidatorJS.IsISSNOptions): Validator {
  const isISSN: Validator = (_target, _path, val) =>
    val == null || validator.isISSN(val, options);
  return isISSN;
}

const isISIN: Validator = (_target, _path, val) =>
  val == null || validator.isISIN(val);

const isISO8601: Validator = (_target, _path, val) =>
  val == null || validator.isISO8601(val);

const isISO31661Alpha2: Validator = (_target, _path, val) =>
  val == null || validator.isISO31661Alpha2(val);

const isISRC: Validator = (_target, _path, val) =>
  val == null || validator.isISRC(val);

export function isIn(values: any[]): Validator {
  const isIn: Validator = (_target, _path, val) =>
    val == null || validator.isIn(val, values);
  return isIn;
}

export function isInt(options?: ValidatorJS.IsIntOptions): Validator {
  const isInt: Validator = (_target, _path, val) =>
    val == null || validator.isInt(val, options);
  return isInt;
}

const isJSON: Validator = (_target, _path, val) =>
  val == null || validator.isJSON(val);

const isLatLong: Validator = (_target, _path, val) =>
  val == null || validator.isLatLong(val);

export function isLength(min: number, max?: number): Validator;
export function isLength(options: ValidatorJS.IsLengthOptions): Validator;
export function isLength(a: any, b?: number): Validator {
  const isLength: Validator = (_target, _path, val) => {
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

const isString: Validator = (_target, _path, val) =>
  val == null || _.isString(val);

const isArray: Validator = (_target, _path, val) =>
  val == null || _.isArray(val);

const isNumber: Validator = (_target, _path, val) =>
  val == null || _.isNumber(val);

const isLowercase: Validator = (_target, _path, val) =>
  val == null || validator.isLowercase(val);

const isMACAddress: Validator = (_target, _path, val) =>
  val == null || validator.isMACAddress(val);

const isMD5: Validator = (_target, _path, val) =>
  val == null || validator.isMD5(val);

const isMimeType: Validator = (_target, _path, val) =>
  val == null || validator.isMimeType(val);

export function isInRange(min: number, max?: number): Validator {
  const isInRange: Validator = (_target, _path, val) => {
    return val == null || (val >= min && (max == null || val <= max));
  };
  return isInRange;
}

export function isMobilePhone(
  locale: ValidatorJS.MobilePhoneLocale,
  options?: ValidatorJS.IsMobilePhoneOptions,
): Validator {
  const isMobilePhone: Validator = (_target, _path, val) =>
    val == null || validator.isMobilePhone(val, locale, options);
  return isMobilePhone;
}

const isMongoId: Validator = (_target, _path, val) =>
  val == null || validator.isMongoId(val);

const isMultibyte: Validator = (_target, _path, val) =>
  val == null || validator.isMultibyte(val);

const isNumeric: Validator = (_target, _path, val) =>
  val == null || validator.isNumeric(val);

const isPort: Validator = (_target, _path, val) =>
  val == null || validator.isPort(val);

export function isPostalCode(locale: ValidatorJS.PostalCodeLocale): Validator {
  const isPostalCode: Validator = (_target, _path, val) =>
    val == null || validator.isPostalCode(val, locale);
  return isPostalCode;
}

const isSurrogatePair: Validator = (_target, _path, val) =>
  val == null || validator.isSurrogatePair(val);

export function isURL(options?: ValidatorJS.IsURLOptions): Validator {
  const isURL: Validator = (_target, _path, val) =>
    val == null || validator.isURL(val, options);
  return isURL;
}

export function isUUID(
  version?: 3 | 4 | 5 | '3' | '4' | '5' | 'all',
): Validator {
  const isUUID: Validator = (_target, _path, val) =>
    val == null || validator.isUUID(val, version);
  return isUUID;
}

const isUppercase: Validator = (_target, _path, val) =>
  val == null || validator.isUppercase(val);

const isVariableWidth: Validator = (_target, _path, val) =>
  val == null || validator.isVariableWidth(val);

export function isWhitelisted(chars: string | string[]): Validator {
  const isWhitelisted: Validator = (_target, _path, val) =>
    val == null || validator.isWhitelisted(val, chars);
  return isWhitelisted;
}

export function matches(
  pattern: RegExp | string,
  modifiers?: string,
): Validator {
  const matches: Validator = (_target, _path, val) =>
    val == null || validator.matches(val, pattern, modifiers);
  return matches;
}

export function isStartOf(unit: unitOfTime.StartOf, tz?: string) {
  const isStartOf: Validator = (_target, _path, val) => {
    if (val == null) {
      return true;
    }
    const time = tz ? moment(val).tz(tz) : moment(val);
    return time.isSame(time.clone().startOf(unit));
  };
  return isStartOf;
}

export function isEndOf(unit: unitOfTime.StartOf, tz?: string) {
  const isStartOf: Validator = (_target, _path, val) => {
    if (val == null) {
      return true;
    }
    const time = tz ? moment(val).tz(tz) : moment(val);
    return time.isSame(time.clone().endOf(unit));
  };
  return isStartOf;
}

// --------------------------- Sanitizers ----------------------------------- //
export function blacklist(chars: string) {
  const blacklist: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.blacklist(val, chars));
    }
    return true;
  };
  return blacklist;
}

export function escape(target: any, path: string, val: any) {
  if (val != null) {
    dotty.set(target, path, validator.escape(val));
  }
  return true;
}

export function unescape(target: any, path: string, val: any) {
  if (val != null) {
    dotty.set(target, path, validator.unescape(val));
  }
  return true;
}

export function ltrim(chars?: string) {
  const ltrim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.ltrim(val, chars));
    }
    return true;
  };
  return ltrim;
}

export function normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions) {
  const normalizeEmail: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.normalizeEmail(val, options));
    }
    return true;
  };
  return normalizeEmail;
}

export function rtrim(chars?: string) {
  const rtrim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.rtrim(val, chars));
    }
    return true;
  };
  return rtrim;
}

export function stripLow(keep_new_lines?: boolean) {
  const stripLow: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.stripLow(val, keep_new_lines));
    }
    return true;
  };
  return stripLow;
}

export function toBoolean(strict?: boolean) {
  const toBoolean: Validator = (target, path, val) => {
    if (val != null && !_.isBoolean(val)) {
      dotty.set(target, path, validator.toBoolean(val, strict));
    }
    return true;
  };
  return toBoolean;
}

export function toDate(target: any, path: string, val: any) {
  if (val != null && !_.isDate(val)) {
    dotty.set(target, path, validator.toDate(val));
  }
  return true;
}

export function toFloat(target: any, path: string, val: any) {
  if (val != null && !_.isNumber(val)) {
    dotty.set(target, path, validator.toFloat(val));
  }
  return true;
}

export function toInt(radix?: number) {
  const toInt: Validator = (target, path, val) => {
    if (val != null) {
      const value = _.isNumber(val)
        ? Math.floor(val)
        : validator.toInt(val, radix);

      dotty.set(target, path, value);
    }
    return true;
  };
  return toInt;
}

export function trim(chars?: string) {
  const trim: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.trim(val, chars));
    }
    return true;
  };
  return trim;
}

export function whitelist(chars?: string) {
  const whitelist: Validator = (target, path, val) => {
    if (val != null) {
      dotty.set(target, path, validator.whitelist(val, chars));
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
      dotty.set(target, path, val === '' ? [] : val.split(separator));
    }
    return true;
  };
  return split;
}

export function withDefault(option: any, includeEmptyString: boolean = true) {
  const withDefault: Validator = (target, path, val, root) => {
    if (val == null || (val === '' && includeEmptyString)) {
      val = _.isFunction(option) ? option(root) : option;
      dotty.set(target, path, val);
    }
    return true;
  };

  return withDefault;
}

export function replace(matcher: any, replacer: any) {
  const replace: Validator = (target, path, val) => {
    if (val === matcher || (_.isArray(matcher) && matcher.indexOf(val) >= 0)) {
      dotty.set(target, path, replacer);
    }
    return true;
  };

  return replace;
}

export function extractId(field: string = '_id') {
  const extractId: Validator = (target: any, path: string, val: any) => {
    if (
      val != null &&
      !_.isString(val) &&
      _.isObject(val) &&
      _.isString(val[field])
    ) {
      dotty.set(target, path, val[field]);
    }
    return true;
  };

  return extractId;
}

export function toNull(target: any, path: string, val: any) {
  if (val === 'null') {
    dotty.set(target, path, null);
  }
  return true;
}

export function map(fn: (val: any, root: any) => any) {
  const map: Validator = (target, path, val, root) => {
    if (val != null) {
      val = fn(val, root);
      dotty.set(target, path, val);
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

  const array: Validator = (_target, _path, val, root) => {
    if (val == null) {
      return;
    }

    if (!_.isArray(val)) {
      return 'not an array';
    }

    const errors: ParamError[] = [];

    _.each(val, (_v, index: number) => {
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

      const nErrors = processValidators(val[index], mappedOptions, root);

      for (const error of nErrors) {
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
