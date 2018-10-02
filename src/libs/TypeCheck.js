// Devhub
//
// Copyright © 2018 Province of British Columbia
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Adapted by Patrick Simonian on 2018-09-28.
//

/**
 * A dependable Type Checking Utility
 * Type checking using the native typeof or instanceof can cause issues at times
 * as explained by https://juhukinners.wordpress.com/2009/01/11/typeof-considered-useless-or-how-to-write-robust-type-checks/
 */
export class TypeCheck {
  static getClass(object) {
    return Object.prototype.toString.call(object).slice(8, -1);
  }

  static isArray(object) {
    return TypeCheck.getClass(object) === 'Array';
  }

  static isObject(object) {
    return TypeCheck.getClass(object) === 'Object';
  }

  static isFunction(object) {
    return TypeCheck.getClass(object) === 'Function';
  }

  static isBoolean(object) {
    return TypeCheck.getClass(object) === 'Boolean';
  }

  static isNumber(object) {
    return TypeCheck.getClass(object) === 'Number';
  }

  static isString(object) {
    return TypeCheck.getClass(object) === 'String';
  }

  static isDate(object) {
    return TypeCheck.getClass(object) === 'Date';
  }

  static isRegExp(object) {
    return TypeCheck.getClass(object) === 'RegExp';
  }
}
