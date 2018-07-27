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

// eslint-disable-next-line import/prefer-default-export
export const getJwtCertificate = async (ssoCertificateUrl) => {
  if (!ssoCertificateUrl) {
    throw new Error('No certificate URL provided');
  }

  const options = {
    method: 'GET',
    uri: ssoCertificateUrl,
  };

  const body = await request(options);
  const certsJson = JSON.parse(body).keys[0];
  const modulus = certsJson.n;
  const exponent = certsJson.e;
  const algorithm = certsJson.alg;

  if (!modulus) {
    throw new Error('No modulus');
  }

  if (!exponent) {
    throw new Error('No exponent');
  }

  if (!algorithm) {
    throw new Error('No algorithm');
  }

  // build a certificate
  return pemFromModAndExponent(modulus, exponent);
};
