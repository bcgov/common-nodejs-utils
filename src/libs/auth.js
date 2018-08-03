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
// Created by Jason Leach on 2018-01-15.
//

'use strict';

import request from 'request-promise-native';
import pemFromModAndExponent from 'rsa-pem-from-mod-exp';
import { logger } from './logger';

// eslint-disable-next-line import/prefer-default-export
export const getJwtCertificate = ssoCertificateUrl => new Promise(async (resolve, reject) => {
  if (!ssoCertificateUrl) {
    reject(new Error('No certificate URL provided'));
  }

  try {
    const options = {
      method: 'GET',
      uri: ssoCertificateUrl,
      json: true,
    };
    const response = await request(options);

    if (response.keys && response.keys.length === 0) {
      reject(new Error('No keys in certificate body'));
    }

    const certsJson = response.keys[0];
    const modulus = certsJson.n;
    const exponent = certsJson.e;
    const algorithm = certsJson.alg;

    if (!modulus) {
      reject(new Error('No modulus'));
      return;
    }

    if (!exponent) {
      reject(new Error('No exponent'));
      return;
    }

    if (!algorithm) {
      reject(new Error('No algorithm'));
      return;
    }

    // build a certificate
    const pem = pemFromModAndExponent(modulus, exponent);
    resolve(pem);
  } catch (error) {
    const message = 'Unable to parse certificate(s)';
    logger.error(`${message}, error = ${error.message}`);

    reject(new Error(message));
  }
});
