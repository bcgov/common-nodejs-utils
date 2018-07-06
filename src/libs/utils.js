//
// SecureImage
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
// Created by Jason Leach on 2018-01-10.
//

'use strict';

import cp from 'child_process';
import util from 'util';

const exec = util.promisify(cp.exec);

/**
 * Check if a string consits of [Aa-Az], [0-9], -, _, and %.
 *
 * @param {String} message The error message
 * @param {Number} code    The error code (property)
 * @returns An `Error` object with the message and code set
 */
export const errorWithCode = (message, code) => {
  const error = new Error(message);
  error.code = code;

  return error;
};

/**
 * Helper function to wrap express routes to handle rejected promises
 *
 * @param {Function} fn The `next()` function to call
 */
export const asyncMiddleware = fn =>
  // Make sure to `.catch()` any errors and pass them along to the `next()`
  // middleware in the chain, in this case the error handler.
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };
