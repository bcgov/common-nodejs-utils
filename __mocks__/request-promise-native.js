//
// Code Sign
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
// Created by Jason Leach on 2018-07-27.
//

/* eslint-disable no-unused-vars */

'use strict';

// const rpn = jest.genMockFromModule('request-promise-native');

const response = {
  keys: [{
    kid: 'jQUx1y-HmxhoJScNrHRYBO1wsFETcNdT7aLU1Mmdsuc',
    kty: 'RSA',
    alg: 'RS256',
    use: 'sig',
    n: 'kB94ZhbjaYiR7KxuOsyZHUoM0diq3RMyxSlMLcb87A9SWg2MgNkTsR8_Lalf4xrnWpHm6K9xW52ikZ4tfeEnAbd_edUeLiNus44L_W8hk-dCbXaw9XoK0f1jYEnLuto_-U1R2yr8K5zht-3Qzmp8QVzr7mu7b-3ddpGbMxYmeB6U0fV4kKfUOV8LzsgEBEw-kXEplJKF2hjPmjOGYk7rbVKFJJewCwHBYXRiHIOho8gXsWvupfT3jN-oz1_TNdUekxN-f-2Nky4zfLJsiOjTTOgd8xUAFwF4ZSH9PSv2LzDLbMFRhpCh-FkwN0n4T9fLrvCITQk4T4AyWlI7r7_KeQ',
    e: 'AQAB',
  }],
};

function request(options) {
  return new Promise((resolve, reject) => {
    resolve(JSON.stringify(response));
  });
}

// rpn = request;

module.exports = request;
