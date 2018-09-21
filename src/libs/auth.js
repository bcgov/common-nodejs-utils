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
export const getJwtCertificate = ssoCertificateUrl =>
  new Promise(async (resolve, reject) => {
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
      resolve({ certificate: pem, algorithm });
    } catch (error) {
      const message = 'Unable to parse certificate(s)';
      logger.error(`${message}, error = ${error.message}`);

      reject(new Error(message));
    }
  });

export const fetchServiceAccountToken = async options => {
  if (!options.uri) {
    throw new Error('A URL must be provided');
  }

  if (!options.grantType) {
    throw new Error('The grant type must be provided');
  }

  if (!options.clientId) {
    throw new Error('The clientId must be provided');
  }

  if (!options.clientSecret) {
    throw new Error('The clientSecret must be provided');
  }

  const ops = {
    method: 'POST',
    uri: options.uri,
    form: {
      grant_type: options.grantType,
      client_id: options.clientId,
      client_secret: options.clientSecret,
    },
    json: true,
  };

  try {
    return request(ops);
  } catch (err) {
    const message = 'Unable to fetch JRT';
    logger.error(`${message}, error = ${err.message}`);

    throw new Error(message);
  }
};

// The Service Account JWT is meant to be refreshed
// out-of-band. Presumably this means when it expires
// don't use the refresh worflow, but just get a new token.
// The `JWTServiceManager` class is meant to lightly wrap
// the refresh mechanics for this.
export class JWTServiceManager {
  constructor(options) {
    if (!options || Object.keys(options).length !== 4) {
      throw new Error('Invalid options');
    }
    this.options = options;

    (async () => {
      await this.fetchToken();
    })();
  }

  async fetchToken() {
    this.data = await fetchServiceAccountToken(this.options);
    this.lastFetchedAt = new Date();
  }

  get isTokenExpired() {
    if (!this.lastFetchedAt) return true;

    const then = new Date(this.lastFetchedAt.getTime());
    then.setSeconds(then.getSeconds() + this.data.expires_in);

    return then < new Date();
  }

  get accessToken() {
    return (async () => {
      if (this.isTokenExpired) {
        await this.fetchToken();
      }

      return this.data.access_token;
    })();
  }
}
