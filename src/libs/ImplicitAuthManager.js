
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
// Created by Patrick Simonian on 2018-09-28.
//

'use strict';

import hash from 'hash.js';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import {
  saveDataInLocalStorage,
  getDataFromLocalStorage,
  deleteDataFromLocalStorage,
} from './LocalStorage';

import { TypeCheck } from './TypeCheck';
/**
 * A wrapper around some basic crypto methods
 */

export class CryptoUtils {
  static genCryptographicRandomValue() {
    const charset =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
    const result = [];
    window.crypto
      .getRandomValues(new Uint8Array(32))
      .forEach(c => result.push(charset[c % charset.length]));
    return result.join('');
  }

  static hashSHA256(value) {
    if (typeof value !== 'string') {
      throw new Error('Value must be of type String in order to hash');
    }
    return hash
      .sha256()
      .update(value)
      .digest('hex');
  }
  /**
     * hashes the value and checks against a hash to see if they match
     * @param {string} value 
     * @param {string} hash 
     * @returns {boolean} true if value matches hash
     */
  static checkAgainstHash(value, hash) {
    return this.hashSHA256(value) === hash;
  }
}
/**
 * Utility Class for Management of OCID Implicit Auth Flow
 * @param {object} config
 * expected shape
 * {
 *   clientId: {string} [required] client id within your realm,
 *   baseURL: {string} [required] your redhat sso domain,
 *   realmName: {string} [required] name of your realm within the domain,
 *   redirectURI: {string} | {function} [optional] defaults to window.location.origin + intention
 *   // if redirect URI is a string, during login/logout processes the redirectURI will have a query param appended to it
 *   // based on the intention of the process: ie if the call to the authorization server is intended for logging in
 *   // the redirect uri will = redirect_uri + ?intention=LOGIN
 *   // --
 *   // you may make the redirect URI a call back function that receives the intention as an argument
 *   // view the validAPIIntentions static function for all the possible intentions that you may want to handle
 *   loginURIResponseType: {string} [optional] defaults to id_token (options are token | id_token | id_token token)
 *   // please view https://stackoverflow.com/questions/19293793/oauth-2-access-token-vs-openid-connect-id-token
 *   // for clarification on the difference between token types
 *   hooks: {
 *      onBeforeAuthRedirect: {function},
 *      onAfterAuthRedirect: {function} [error {boolean}],
 *      onAuthLocalStorageCleared: {function},
 *      onTokenExpired: {function},
 *      onAuthenticateSuccess: {function},
 *      onAuthenticateFail: {function}
 *   }
 * }
 */

// ImplicitAuthManager takes two names in the local storage space
// sso and auth. Please ensure these are not being overwritten by other functions.
export default class ImplicitAuthManager {
  constructor(config = {}) {
    //default config
    const defaultConfig = this.defaultConfig;
    //validate config
    this.validateConfig(config);
    //merge defaults with config
    this.config = {
      ...defaultConfig,
      ...config,
      hooks: { ...defaultConfig.hooks, ...config.hooks },
    };
    this.baseAuthEndpoint = this.createBaseAuthEndpointFromConfig();
    this.baseLogoutEndpoint = this.createBaseLogoutEndpointFromConfig();
  }

  get defaultConfig() {
    return {
      loginURIResponseType: 'id_token',
      hooks: {
        onBeforeAuthRedirect: () => undefined,
        onAfterAuthRedirect: () => undefined,
        onAuthLocalStorageCleared: () => undefined,
        onTokenExpired: () => undefined,
        onAuthenticateSuccess: () => undefined,
        onAuthenticateFail: () => undefined,
      },
    };
  }

  get hooks() {
    return this.config.hooks;
  }
  get redirectURI() {
    return this.config.redirectURI || window.location.origin;
  }

  get ssoLogoutURI() {
    return this.getSSOLogoutURI();
  }

  get ssoLoginURI() {
    return this.getSSOLoginURI();
  }

  get access_token() {
    return this.getAccessTokenFromLocal();
  }

  get id_token() {
    return this.getIdTokenFromLocal();
  }
  //returns the valid response types for implicit auth flow response_type query param
  static validResponseTypes() {
    return ['id_token', 'token', 'id_token token'];
  }

  static validPromptTypes() {
    return ['none', 'login', 'consent', 'select_account'];
  }
  // returns valid api intentions which are bound the the redirect uri as a queryparam
  // ?intention=[intention], if redirectURI is a function, the intention is passed in to
  // the redirectURI function so that you may choose how you want to construct your redirectURI
  static validAPIIntentions() {
    return {
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
    };
  }

  static validHooks() {
    return [
      'onBeforeAuthRedirect',
      'onAuthLocalStorageCleared',
      'onTokenExpired',
      'onAuthenticateSuccess',
      'onAuthenticateFail',
      'onAfterAuthRedirect',
    ];
  }

  clearAuthLocalStorage() {
    this.hooks.onAuthLocalStorageCleared();
    // delete sso information and token information
    deleteDataFromLocalStorage('sso');
    deleteDataFromLocalStorage('auth');
  }

  createBaseAuthEndpointFromConfig() {
    const uriConf = this.config;
    return `${uriConf.baseURL}/auth/realms/${uriConf.realmName}/protocol/openid-connect/auth`;
  }

  createBaseLogoutEndpointFromConfig() {
    const uriConf = this.config;
    return `${uriConf.baseURL}/auth/realms/${uriConf.realmName}/protocol/openid-connect/logout`;
  }

  validateConfig(config) {
    if (!TypeCheck.isObject(config)) {
      throw new Error('config must be an object');
    }
    if (!config.clientId || !TypeCheck.isString(config.clientId)) {
      throw new Error(
        'client id in config must be present and typeof [string]'
      );
    }
    if (!config.baseURL || !TypeCheck.isString(config.baseURL)) {
      throw new Error('base url in config must be present and typeof [string]');
    }

    if (!/^https:\/\//.test(config.baseURL)) {
      throw new Error('base url must start with https://');
    }

    if (!config.realmName || !TypeCheck.isString(config.realmName)) {
      throw new Error(
        'realm name in config must be present and typeof [string]'
      );
    }
    if (config.redirectURI) {
      // if its a function, test if the function returns a string
      if (
        TypeCheck.isFunction(config.redirectURI) &&
        !TypeCheck.isString(
          config.redirectURI(ImplicitAuthManager.validAPIIntentions.LOGIN)
        )
      ) {
        throw new Error(
          'If passing in a custom redirectURI as a function it must return a string'
        );
        //otherwise make sure redirectURI is a string
      } else if (
        !TypeCheck.isFunction(config.redirectURI) &&
        !TypeCheck.isString(config.redirectURI)
      ) {
        throw new Error(
          'If passing in a custom redirectURI it must either be a function or a string'
        );
      }
    }
    //if login URI responseType was passed in
    if (
      config.loginURIResponseType &&
      !TypeCheck.isString(config.loginURIResponseType)
    ) {
      throw new Error('loginURIResponseType in config must be typeof [string]');
    }

    if (
      config.loginURIResponseType &&
      !ImplicitAuthManager.validResponseTypes().includes(
        config.loginURIResponseType
      )
    ) {
      throw new Error(
        "loginURIResponseType isn't valid, please view https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthRequest for details"
      );
    }
    //validate hooks
    if (config.hooks) {
      if (!TypeCheck.isObject(config.hooks)) {
        throw new Error('hooks in config must be typeof [object]');
      }
      const validHooks = ImplicitAuthManager.validHooks();
      //loop over object and validate keys and their type
      for (let key in config.hooks) {
        if (!validHooks.includes(key)) {
          throw new Error(
            `${key} in config.hooks is not a valid hook, please see API Docs for information on valid hooks`
          );
        }
        if (!TypeCheck.isFunction(config.hooks[key])) {
          throw new Error(`config.hooks.${key} must be typeof [function]`);
        }
      }
    }
  }

  createRequestKey() {
    return CryptoUtils.genCryptographicRandomValue();
  }

  createNonce() {
    const requestKey = this.createRequestKey();
    //save request key in local storage for reference on auth redirect
    saveDataInLocalStorage('sso', { requestKey });
    //hash requestKey and return as nonce
    return CryptoUtils.hashSHA256(requestKey);
  }

  clearNonce() {
    deleteDataFromLocalStorage('sso');
  }

  isAReplayAttack(nonce) {
    //this could be a replay attack if the nonce contained with the jwt doesn't match
    //the hashed request key that SHOULD be in local storage
    const sso = getDataFromLocalStorage('sso');
    if (TypeCheck.isObject(sso) && sso.requestKey) {
      return !CryptoUtils.checkAgainstHash(sso.requestKey, nonce);
    } else {
      return true;
    }
  }

  isTokenExpired(token) {
    return new Date() / 1000 > token.exp;
  }

  areTokensExpired() {
    let expired = 0;
    //get tokens
    const tokens = this.getAuthDataFromLocal();

    if (!tokens) {
      return true;
    }

    return Object.keys(tokens)
      .filter(item => this.isTokenExpired(tokens[item])).length > 0
  }
  // based on the hash value returned from an implicit auth redirect
  // return a parameter by its name
  getParameterByName(hash, name) {
    const match = RegExp('[#&]' + name + '=([^&]*)').exec(hash);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  getAccessTokenFromHash(hash) {
    return this.getParameterByName(hash, 'access_token');
  }

  getIdTokenFromHash(hash) {
    return this.getParameterByName(hash, 'id_token');
  }

  getErrorFromHash(hash) {
    return this.getParameterByName(hash, 'error');
  }

  getSessionStateFromHash(hash) {
    return this.getParameterByName(hash, 'session_state');
  }

  getAccessTokenFromLocal() {
    const authData = getDataFromLocalStorage('auth');
    if (authData) {
      return authData.access_token;
    }
  }

  getIdTokenFromLocal() {
    const authData = getDataFromLocalStorage('auth');
    if (authData) {
      return authData.id_token;
    }
  }

  saveAuthDataInLocal(access_token, id_token) {
    try {
      const auth = {};
      if (access_token) {
        auth.access_token = jwtDecode(access_token);
        //ensure access token nonce matches
        if (this.isAReplayAttack(auth.access_token.nonce)) {
          throw new Error(
            'Authentication failed due to possible replay attack'
          );
        }
      }
      if (id_token) {
        auth.id_token = jwtDecode(id_token);
        if (this.isAReplayAttack(auth.id_token.nonce)) {
          throw new Error(
            'Authentication failed due to possible replay attack'
          );
        }
      }
      // if auth is empty at this point that means access_token, id_token were
      // null and we should throw to avoid garbage data being saved in local storage
      if (!auth) {
        throw new Error('unable to save invalid tokens');
      }
      saveDataInLocalStorage('auth', auth);
      return true;
    } catch (e) {
      // need to figuire out what would be appropriate here
      return false;
    }
  }

  getSSOLogoutURI() {
    const apiIntentions = ImplicitAuthManager.validAPIIntentions();
    const uriConf = this.config;
    const redirectURI = this.getSSORedirectURI(apiIntentions.LOGOUT);
    const logoutURI = `${this.baseLogoutEndpoint}?redirect_uri=${redirectURI}`;
    return encodeURI(logoutURI);
  }

  getSSOLoginURI(prompt = 'login') {
    if (!ImplicitAuthManager.validPromptTypes().includes(prompt)) {
      throw new Error(
        `Prompt type must one of ${ImplicitAuthManager.validPromptTypes()}`
      );
    }

    const apiIntentions = ImplicitAuthManager.validAPIIntentions();
    const uriConf = this.config;
    const redirectURI = this.getSSORedirectURI(apiIntentions.LOGIN);
    const nonce = this.createNonce();
    const loginURI = `${this
      .baseAuthEndpoint}?response_type=${uriConf.loginURIResponseType}&prompt=${prompt}&client_id=${uriConf.clientId}&nonce=${nonce}&redirect_uri=${redirectURI}`; // need to finish createBASE URL fn
    return encodeURI(loginURI);
  }
  // returns no prompt for user
  getSSOLoginURIForPageLoadRedirect() {
    return this.getSSOLoginURI('none');
  }
  //creates the redirect URI
  //it can be retrieved by a config or
  //grabbing window.location.origin by default
  //this method recieves an 'intention' for the redirect
  //for example if logging in, the api intention used will be 'LOGIN' which is then
  //passed back in the redirect as a query param to allow your client to handle redirects
  //differently based on the intention as needed
  getSSORedirectURI(apiIntention) {
    // this.redirectURI via getter
    return TypeCheck.isFunction(this.redirectURI)
      ? this.redirectURI(apiIntention)
      : this.redirectURI + `?intention=${apiIntention}&sso=true`;
  }

  handleOnPageLoad() {
    if (this.isAuthenticated()) {
      // set expiry timers
      console.log('setting up timers');
      this.setTokenExpiryTimers();
      this.hooks.onAuthenticateSuccess();
      //fire user authenticated hook
    } else {
      // this definition should and will change as a better method for detecting a redirect
      // is made apparent
      if (!this.isPageLoadFromSSORedirect()) {
        this.hooks.onBeforeAuthRedirect();
        // force redirect to get authenticated
        window.location.replace(this.getSSOLoginURIForPageLoadRedirect());
      } else {
        if (this.isPageLoadHashValidForAuthentication()) {
          this.hooks.onAfterAuthRedirect();
          const hash = window.location.hash;
          const access_token = this.getAccessTokenFromHash(hash);
          const id_token = this.getIdTokenFromHash(hash);
          const authenticated = this.saveAuthDataInLocal(
            access_token,
            id_token
          );
          if (authenticated) {
            // fire authenticated eventt
            this.hooks.onAuthenticateSuccess();
            // set expiry timers
            this.setTokenExpiryTimers();
          } else {
            this.hooks.onAuthenticateFail();
            // fire authentication failed event
            this.clearAuthLocalStorage();
          }
        } else {
          // ensures we store no artifacts in local storage
          this.clearAuthLocalStorage();
        }
        //clear nonce
        this.clearNonce();
      }
    }
  }

  getAuthDataFromLocal() {
    return getDataFromLocalStorage('auth');
  }
  // tests where correct params exist in hash AND not if the tokens are valid
  isPageLoadHashValidForAuthentication() {
    const hash = window.location.hash;
    const session_state = this.getSessionStateFromHash(hash);
    const id_token = this.getIdTokenFromHash(hash);
    const access_token = this.getAccessTokenFromHash(hash);

    return !session_state || (!id_token || !access_token);
  }
  // a redirect should have atleast one of a id_token or access_token or have an error
  isPageLoadFromSSORedirect() {
    const hash = window.location.hash;
    const id_token = this.getAccessTokenFromHash(hash);
    const access_token = this.getIdTokenFromHash(hash);
    const error = this.getErrorFromHash(hash);
    return id_token !== null || access_token !== null || error !== null;
  }

  isAuthenticated() {
    //do we have auth data saved in local storage and are tokens not expired
    const auth = getDataFromLocalStorage('auth');
    if (!auth) {
      return false;
    }
    // do any tokens exist
    if (!auth.id_token && !auth.access_token) {
      return false;
    }
    //if either token is expired user is not authenticated
    if (
      (auth.id_token && this.isTokenExpired(auth.id_token)) ||
      (auth.access_token && this.isTokenExpired(auth.access_token))
    ) {
      return false;
    }
    return true;
  }

  setTokenExpiryTimers() {
    //get tokens
    const tokens = this.getAuthDataFromLocal();
    for (let key in tokens) {
      const token = tokens[key];
      const now = moment();
      // const then = moment(token.exp * 1000);
      const then = moment().add('10', 's');
      const expiresIn = then.diff(now, 'millisecond');

      setTimeout(() => {
        console.log('%cToken Expired...clearing session', 'color: orange');
        this.hooks.onTokenExpired();
        // this.clearAuthLocalStorage();
        // fire logged out event;
      }, expiresIn);
    }
  }
}
