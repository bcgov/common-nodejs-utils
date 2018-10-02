import ImplicitAuthManager from '../src/libs/ImplicitAuthManager';
import {
  getDataFromLocalStorage,
  saveDataInLocalStorage,
} from '../src/libs/localStorage';
//window.crypto stub
global.crypto = {
  getRandomValues: () => {
    return [1, 2, 3];
  },
};
beforeEach(() => {
  jest.resetModules();
});

describe('Implicit Auth Manager Class', () => {
  describe('Config Validations', () => {
    it('throws an error if config is not a valid object', () => {
      expect(() => {
        new ImplicitAuthManager(false);
      }).toThrow('config must be an object');
      expect(() => {
        new ImplicitAuthManager('false');
      }).toThrow('config must be an object');
      expect(() => {
        new ImplicitAuthManager(123);
      }).toThrow('config must be an object');
      expect(() => {
        new ImplicitAuthManager(JSON.stringify({ a: true }));
      }).toThrow('config must be an object');
      expect(() => {
        new ImplicitAuthManager([1, 2, 3]);
      }).toThrow('config must be an object');
    });

    it('throws if client id is not passed in to config', () => {
      const config = {};
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('client id in config must be present and typeof [string]');
    });

    it('throws if base url is not passed in to config', () => {
      const config = {
        clientId: '123',
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('base url in config must be present and typeof [string]');
    });

    it("throws if base url doesn't start with https://", () => {
      const config = {
        clientId: '123',
        baseURL: 'nothttps',
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('base url must start with https://');
    });

    it('throws if realm name is not passed in to config', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('realm name in config must be present and typeof [string]');
    });

    it("throws if loginURIResponseType in config isn't a string", () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
        loginURIResponseType: 123,
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('loginURIResponseType in config must be typeof [string]');
    });

    it("throws if loginURIResponseType isn't valid", () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
        loginURIResponseType: '123',
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow(
        "loginURIResponseType isn't valid, please view https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthRequest for details"
      );
      //for kicks get valid response types and generate assertions for them
      const validResponseTypes = ImplicitAuthManager.validResponseTypes();
      validResponseTypes.forEach(rt => {
        const config = {
          clientId: '123',
          baseURL: 'https://something.sso.ca',
          realmName: '432',
          loginURIResponseType: rt,
        };
        expect(() => {
          new ImplicitAuthManager(config);
        }).not.toThrow();
      });
    });

    test('that instance has a default loginURIResponseType if not passed in to config', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      expect(
        new ImplicitAuthManager(config).config.loginURIResponseType
      ).toBeDefined();
    });

    it('throws if redirectURI in config is not of type string', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
        redirectURI: 123,
      };

      expect(() => {
        const iam = new ImplicitAuthManager(config);
      }).toThrow(
        'If passing in a custom redirectURI it must either be a function or a string'
      );
    });

    it("throws if redirectURI in config is a function and doesn't return a string", () => {
      const fn = jest.fn();
      fn.mockReturnValue(32231);
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
        redirectURI: fn,
      };

      expect(() => {
        const iam = new ImplicitAuthManager(config);
      }).toThrow(
        'If passing in a custom redirectURI as a function it must return a string'
      );
    });

    it('if redirectURI in config is a function it receives a API Intention when called', () => {
      const fn = jest.fn();
      fn.mockReturnValue('123123');
      const config = {
        clientId: '123',
        baseURL: 'https://yoyoyo.sso.ca',
        realmName: '432',
        redirectURI: fn,
      };
      const iam = new ImplicitAuthManager(config);
      // expect(fn).toHaveBeenCalled();
      iam.getSSORedirectURI('INTENTION');
      expect(fn).toHaveBeenLastCalledWith('INTENTION');
    });

    it('fails if hooks passed into config is not an object', () => {
      'onBeforeAuthRedirect',
        'onAuthLocalStorageCleared',
        'onTokenExpired',
        'onAuthenticateSuccess',
        'onAuthenticateFail';
      const config = {
        clientId: '123',
        baseURL: 'https://yoyoyo.sso.ca',
        realmName: '432',
        hooks: true,
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('hooks in config must be typeof [object]');
    });

    it('fails if hooks passed into config are not apart of valid hooks list', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://yoyoyo.sso.ca',
        realmName: '432',
        hooks: {
          invalidHookType: () => undefined,
        },
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow(
        'invalidHookType in config.hooks is not a valid hook, please see API Docs for information on valid hooks'
      );
    });

    it('fails if hooks passed into config are apart of the valid hooks list but not functions', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://yoyoyo.sso.ca',
        realmName: '432',
        hooks: {
          onBeforeAuthRedirect: false,
        },
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).toThrow('config.hooks.onBeforeAuthRedirect must be typeof [function]');
    });

    it('does not fail if hooks passed into config are valid', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://yoyoyo.sso.ca',
        realmName: '432',
        hooks: {
          onBeforeAuthRedirect: () => undefined,
        },
      };
      expect(() => {
        new ImplicitAuthManager(config);
      }).not.toThrow();
    });
  });

  describe('Nonce/Request Key generation/management', () => {
    // test('creating request keys are relatively unique', () => {
    //   const config = {
    //     clientId: '123',
    //     baseURL: 'https://something.sso.ca',
    //     realmName: '432',
    //   };
    //   const iam = new ImplicitAuthManager(config);
    //   expect(iam.createRequestKey()).not.toBe(iam.createRequestKey());
    // });

    test('when creating a nonce, the request key is stored in local storage', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      const nonce = iam.createNonce();
      const sso = getDataFromLocalStorage('sso');
      expect(sso.requestKey).toBeDefined();
      expect(nonce).toBeDefined();
    });

    test('when checking for a replay attack, it returns true if no request key has been stored', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      const nonce = iam.createNonce();
      //simulating that request key doesn't exist
      localStorage.clear();
      expect(iam.isAReplayAttack(nonce)).toBe(true);
    });

    test("when checking for replay attack, it returns true if request key doesn't match nonce", () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      const nonce = iam.createNonce();
      //request key has been stored by createNonce
      const fakeNonce = 'fakenonce';
      expect(iam.isAReplayAttack(fakeNonce)).toBe(true);
    });

    test('when checking for a replay attack, it returns false if nonce matches request key', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      const nonce = iam.createNonce();
      //request key has been stored by createNonce
      expect(iam.isAReplayAttack(nonce)).toBe(false);
    });
  });

  describe('Instance helper methods', () => {
    test('getParameterByName returns paramaters value contained within a url fragment/hash', () => {
      const hash =
        '#value1=23109482304923&complexValue=#$*)4!@#(*dsf8ad9f08a7sdf981239816547836423&anotherValue=true';
      const value1Param = '23109482304923';
      const complexValueParam = '#$*)4!@#(*dsf8ad9f08a7sdf981239816547836423';
      const anotherValueParam = 'true';
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.getParameterByName(hash, 'value1')).toBe(value1Param);
      expect(iam.getParameterByName(hash, 'complexValue')).toBe(
        complexValueParam
      );
      expect(iam.getParameterByName(hash, 'anotherValue')).toBe(
        anotherValueParam
      );
    });

    test("getParameterByName returned null if param doesn't exist inside hash", () => {
      const hash =
        '#value1=23109482304923&complexValue=#$*)4!@#(*dsf8ad9f08a7sdf981239816547836423&anotherValue=true';
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.getParameterByName(hash, 'notARealValue')).toBe(null);
    });

    test('isTokenExpired returns true when a token is expired', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      const token = {
        exp: oldDate / 1000,
      };
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.isTokenExpired(token)).toBe(true);
    });

    test('areTokensExpired returns true when no tokens exist', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.areTokensExpired()).toBe(true);
    });

    test('areTokensExpired returns true when only one token exists and is expired', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      const token = {
        exp: oldDate / 1000,
      };
      saveDataInLocalStorage('auth', { id_token: token });
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.areTokensExpired()).toBe(true);
    });

    test('areTokensExpired returns true when more than 1 token exists and ALL are expired', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      const token = {
        exp: oldDate / 1000,
      };
      const token2 = {
        exp: oldDate / 1000,
      };
      const token3 = {
        exp: oldDate / 1000,
      };
      saveDataInLocalStorage('auth', {
        id_token: token,
        access_token: token2,
        other_token: token3,
      });

      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);

      expect(iam.areTokensExpired()).toBe(true);
    });

    test('areTokensExpired returns true if there are more then one token and ATLEAST one is expired', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 5);
      const token = {
        exp: oldDate / 1000,
      };
      const token2 = {
        exp: newDate / 1000,
      };
      const token3 = {
        exp: newDate / 1000,
      };
      saveDataInLocalStorage('auth', {
        id_token: token,
        access_token: token2,
        other_token: token3,
      });

      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);

      expect(iam.areTokensExpired()).toBe(true);
    });

    test('areTokensExpired returns false if tokens exist but are not expired', () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 5);
      const token = {
        exp: newDate / 1000,
      };
      const token2 = {
        exp: newDate / 1000,
      };
      const token3 = {
        exp: newDate / 1000,
      };
      saveDataInLocalStorage('auth', {
        id_token: token,
        access_token: token2,
        other_token: token3,
      });
      const config = {
        clientId: '123',
        baseURL: 'https://something.sso.ca',
        realmName: '432',
      };
      const iam = new ImplicitAuthManager(config);

      expect(iam.areTokensExpired()).toBe(false);
    });

    test('creating the sso base auth endpoint for redhat openid connect returns a url that is a valid shape', () => {
      const expectedRoute =
        'https://sso-dev.pathfinder.gov.bc.ca/auth/realms/someRealm/protocol/openid-connect/auth';
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };

      const iam = new ImplicitAuthManager(config);
      expect(iam.createBaseAuthEndpointFromConfig()).toBe(expectedRoute);
    });

    test('getSSORedirectURI returns redirectURI plus queryparam of intention (when redirectURI is not a function)', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      const INTENTION = 'LOGIN';
      const iam = new ImplicitAuthManager(config);
      const expectedRedirectURI = `${iam.redirectURI}?intention=${INTENTION}&sso=true`;
      expect(iam.getSSORedirectURI(INTENTION)).toBe(expectedRedirectURI);
    });

    test('getSSOLoginURI returns a uri', () => {
      const config = {
        clientId: 'aweb-app',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
        redirectURI: 'mysite.com',
      };
      const iam = new ImplicitAuthManager(config);
      const expectedURI =
        iam.baseAuthEndpoint +
        '?response_type=id_token&prompt=login&client_id=aweb-app&nonce=123&redirect_uri=mysite.com?intention=LOGIN&sso=true';
      const actualURI = iam.getSSOLoginURI();
      // a request key should exist in local storage
      const requestKey = getDataFromLocalStorage('sso').requestKey;
      // hash request key and use as nonce for expectetdURI
      expect(iam.getSSOLoginURI()).toBe(encodeURI(expectedURI));
      // test with custom response type
      const config2 = {
        ...config,
        loginURIResponseType: 'id_token token',
      };
      const iam2 = new ImplicitAuthManager(config2);
      const expectedURI2 =
        iam2.baseAuthEndpoint +
        '?response_type=id_token token&prompt=login&client_id=aweb-app&nonce=123&redirect_uri=mysite.com?intention=LOGIN&sso=true';
      expect(iam2.getSSOLoginURI()).toBe(encodeURI(expectedURI2));
    });

    test('getSSOLogoutURI returns a uri', () => {
      const config = {
        clientId: 'aweb-app',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
        redirectURI: 'mysite.com',
      };
      const iam = new ImplicitAuthManager(config);
      const expectedURI =
        iam.baseLogoutEndpoint +
        `?redirect_uri=mysite.com?intention=LOGOUT&sso=true`;
      const actualURI = iam.getSSOLogoutURI();

      expect(actualURI).toBe(encodeURI(expectedURI));
    });
    //at this stage not satisified all edge cases have been captured for the following test
    test('isPageLoadFromSSORedirect returns true when redirected from SSO', () => {
      //please note that id and access token are invalid jwts
      window.location.hash =
        '#session_state=123123&access_token=342109908dfjlsdf&id_token=32123908123';

      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
        redirectURI: 'mysite.com',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.isPageLoadFromSSORedirect()).toBe(true);
    });
  });

  describe('User auth methods', () => {
    test('clearAuthLocalStorage should clear local storage values for auth and sso', () => {
      //set up local storage with sso and auth
      saveDataInLocalStorage('sso', 'some value');
      saveDataInLocalStorage('auth', 'another value');
      // these should pass
      expect(getDataFromLocalStorage('sso')).toBe('some value');
      expect(getDataFromLocalStorage('auth')).toBe('another value');
      //call clearAuthLocalStorage
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      const iam = new ImplicitAuthManager(config);
      iam.clearAuthLocalStorage();
      expect(getDataFromLocalStorage('sso')).not.toBeDefined();
      expect(getDataFromLocalStorage('auth')).not.toBeDefined();
    });

    test('isAuthenticated returns false if no auth data exists in local storage', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      const iam = new ImplicitAuthManager(config);
      expect(iam.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated returns false if no tokens exist in local storage', () => {
      saveDataInLocalStorage('auth', {});
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      expect(localStorage['auth']).toBeDefined();
      const iam = new ImplicitAuthManager(config);
      expect(iam.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated returns false if either access or id token are expired', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      const iam = new ImplicitAuthManager(config);
      const oldDate = new Date();
      // subtract time from oldDate
      oldDate.setDate(oldDate.getDate() - 5);
      // test access token
      const expired_access_token = {
        name: 'something',
        exp: oldDate / 1000,
        iat: oldDate / 1000,
      };
      const oldDate2 = new Date();
      oldDate2.setDate(oldDate2.getDate() - 10);
      const expired_id_token = {
        name: 'another thingm',
        exp: oldDate2 / 1000,
        iat: oldDate2 / 1000,
      };
      const auth = {
        access_token: expired_access_token,
      };
      // first only set access token into auth local storage
      saveDataInLocalStorage('auth', auth);
      //confirm its in local storage
      expect(localStorage['auth']).toBe(JSON.stringify(auth));

      expect(iam.isAuthenticated()).toBe(false);
      //update local storage with only id token
      const auth2 = {
        id_token: expired_id_token,
      };
      saveDataInLocalStorage('auth', auth2);
      // confirm its in local storage
      expect(localStorage['auth']).toBe(JSON.stringify(auth2));
      expect(iam.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated returns true if all existing tokens are not expired', () => {
      const config = {
        clientId: '123',
        baseURL: 'https://sso-dev.pathfinder.gov.bc.ca',
        realmName: 'someRealm',
      };
      const iam = new ImplicitAuthManager(config);
      const newDate = new Date();
      // subtract time from newDate
      newDate.setDate(newDate.getDate() + 5);
      // test access token
      const access_token = {
        name: 'something',
        exp: newDate / 1000,
        iat: newDate / 1000,
      };
      const newDate2 = new Date();
      newDate2.setDate(newDate2.getDate() + 10);
      const id_token = {
        name: 'another thingm',
        exp: newDate2 / 1000,
        iat: newDate2 / 1000,
      };
      const auth = { access_token };
      // first only set access token into auth local storage
      saveDataInLocalStorage('auth', auth);
      //confirm its in local storage
      expect(localStorage['auth']).toBe(JSON.stringify(auth));

      expect(iam.isAuthenticated()).toBe(true);
      //update local storage with only id token
      const auth2 = { id_token };
      saveDataInLocalStorage('auth', auth2);
      // confirm its in local storage
      expect(localStorage['auth']).toBe(JSON.stringify(auth2));
      expect(iam.isAuthenticated()).toBe(true);

      //update local storage with both tokens
      const auth3 = { id_token, access_token };
      saveDataInLocalStorage('auth', auth3);
      // confirm its in local storage
      expect(localStorage['auth']).toBe(JSON.stringify(auth3));
      expect(iam.isAuthenticated()).toBe(true);
    });
  });
});
