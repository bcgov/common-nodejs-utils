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
// Original Credit to Kyubin Han
// Adapted by Patrick Simonian on 2018-09-28.

/**
 * Save data in local storage
 *
 * @param {string} key
 * @param {object} data
 * @returns undefined
 */
export const saveDataInLocalStorage = (key, data) => {
  try {
    const serializedData =
      typeof data === 'object' ? JSON.stringify(data) : data;
    localStorage.setItem(key, serializedData);
  } catch (err) {
    throw new Error('Unable to save data, are you sure it is a js object?');
  }
};

/**
 * Get data that was saved in local storage
 *
 * @param {string} key
 * @returns {object} the data object
 */
export const getDataFromLocalStorage = key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      return data;
    }
  }
  return undefined;
};

export const deleteDataFromLocalStorage = key => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    return undefined;
  }
};
