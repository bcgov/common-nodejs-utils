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
// Created by Jason Leach on 2018-05-06.
//

/* eslint-disable no-unused-vars */

'use strict';

// faux certificate
const token = {
  access_token: 'JOGYFQf/ADYI9oRjqaHqKdDO',
  expires_in: 1800,
  refresh_expires_in: 3600,
  refresh_token: 'vcCYB0V/qH7HA+QM0hBtutkq',
  token_type: 'bearer',
  'not-before-policy': 0,
  session_state: '5fa5d913-98bb-45fe-ae5f-b44c919c83e1',
};

// public certificate
const cert = {
  keys: [
    {
      kid: 'EDb6iGwW-tPWM30Xxi_B8sEGH4bhcO2VELs33cBksi8',
      kty: 'RSA',
      alg: 'RS256',
      use: 'sig',
      n:
        's1adod1-laVtsql0olCs4zo_Ng4kJDdwHdzJQW6TlE61MlpskJPulK-OTytOdi_hSSnKPwNsMrzqm60RuR4hnhMJBdrOjbBnr6yUKSIAv6SPXK0QrmN5Y0XuhV4kMkDJ0aN15UxRzSGdeaXAetmQEqSl_-lt33mTNsTfU6kzgKkwyZQSbITmjze8MVVtjfdly0DsMt_1tc6l-tUvaDzGgqUEF5dAUFq2MgdH7FM6quHml3ze3F8zPmk6ia8tHZ4wJULOFiLvKuRNU8ZsPMuwyFPYtF-_b4HgVCco82EP51psNOXpq4YH3qjAgJjYw3Oe1ULU-xdzXWXhzSq6WWxBAQ',
      e: 'AQAB',
    },
  ],
};

let rpn = jest.genMockFromModule('request-promise-native');

function request(options) {
  return new Promise((resolve, reject) => {
    if (options.uri.endsWith('token')) {
      return resolve(token);
    }

    if (options.uri.endsWith('certs')) {
      return resolve(cert);
    }

    return reject();
  });
}

rpn = request;

module.exports = rpn;
