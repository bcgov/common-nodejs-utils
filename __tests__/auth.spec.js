//
// Code Signing
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
// Created by Jason Leach on 2018-07-20.
//

import { fetchServiceAccountToken, getJwtCertificate } from '../src/libs/auth';

jest.mock('request-promise-native');

describe('Test authentication module', () => {
  test('A URL must be provided', async () => {
    const options = {};
    await expect(fetchServiceAccountToken(options)).rejects.toThrow(Error);
  });

  test('The grant type must be provided', async () => {
    const options = {
      uri: 'http://example.com/foo/bar/token',
    };
    await expect(fetchServiceAccountToken(options)).rejects.toThrow(Error);
  });

  test('The client ID must be provided', async () => {
    const options = {
      uri: 'http://example.com/foo/bar/token',
      grant_type: 'client_credentials',
    };
    await expect(fetchServiceAccountToken(options)).rejects.toThrow(Error);
  });

  test('The client secret must be provided', async () => {
    const options = {
      uri: 'http://example.com/foo/bar/token',
      grant_type: 'client_credentials',
      clientId: 'hello-world',
    };
    await expect(fetchServiceAccountToken(options)).rejects.toThrow(Error);
  });

  test('The service account should be a standard payload', async () => {
    const options = {
      uri: 'http://example.com/foo/bar/token',
      grantType: 'client_credentials',
      clientId: 'hello-world',
      clientSecret: 'abc123',
    };
    const t = await fetchServiceAccountToken(options);
    expect(t).toBeDefined();
    expect(typeof t).toBe('object');
    expect(t.access_token).toBeDefined();
    expect(t.expires_in).toBeDefined();
    expect(t.refresh_expires_in).toBeDefined();
    expect(t.refresh_token).toBeDefined();
    expect(t.token_type).toBeDefined();
    expect(t['not-before-policy']).toBeDefined();
    expect(t.session_state).toBeDefined();
  });

  test('A valid certificate (PEM) should be returned', async () => {
    const url = 'http://example.com/foo/bar/certs';
    const { certificate, algorithm } = await getJwtCertificate(url);
    expect(certificate).toBeDefined();
    expect(certificate.includes('-----BEGIN RSA PUBLIC KEY-----')).toBe(true);
    expect(certificate.includes('-----END RSA PUBLIC KEY-----')).toBe(true);
    expect(typeof certificate).toBe('string');
    expect(algorithm).toBeDefined();
    expect(typeof algorithm).toBe('string');
  });
});
