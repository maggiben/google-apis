// @flow

///////////////////////////////////////////////////////////////////////////////
// @file         : ApiClient.js                                              //
// @summary      : Dynamic Google API Client builder                         //
// @version      : 1.0.0                                                     //
// @project      : N/A                                                       //
// @description  : Reference: developers.google.com/discovery/v1/reference   //
// @author       : Benjamin Maggi                                            //
// @email        : benjaminmaggi@gmail.com                                   //
// @date         : 17 Sep 2017                                               //
// @license:     : MIT                                                       //
// ------------------------------------------------------------------------- //
//                                                                           //
// Copyright 2017 Benjamin Maggi <benjaminmaggi@gmail.com>                   //
//                                                                           //
//                                                                           //
// License:                                                                  //
// Permission is hereby granted, free of charge, to any person obtaining a   //
// copy of this software and associated documentation files                  //
// (the "Software"), to deal in the Software without restriction, including  //
// without limitation the rights to use, copy, modify, merge, publish,       //
// distribute, sublicense, and/or sell copies of the Software, and to permit //
// persons to whom the Software is furnished to do so, subject to the        //
// following conditions:                                                     //
//                                                                           //
// The above copyright notice and this permission notice shall be included   //
// in all copies or substantial portions of the Software.                    //
//                                                                           //
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS   //
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF                //
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.    //
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY      //
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,      //
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE         //
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                    //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


import axios from 'axios';
import ApiDiscovery from  './ApiDiscovery';
import $http from './Http';

type Options = {
  baseURL: string
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timer(seconds, resolve) {
  var remaningTime = seconds;
  return setTimeout(function() {
    console.log(remaningTime);
    if (remaningTime > 0) {
      return timer(remaningTime - 1, resolve);
    } else {
      return resolve();
    }
  }, 1000);
}

function countdown(seconds) {
  return new Promise(resolve => timer(seconds, resolve));
}

function getNestedValue(obj, key) {
  return key.split('.').reduce(function(result, key) {
    return result[key];
  }, obj);
}

function resourceBuilder(domain) {
  const resource = [];
  const proxy = new Proxy(async function (...args) {
    const methods = await domain.serialize();
    try {
      const path = resource.join('.');
      const method = getNestedValue(methods, path);
      if (method) {
        return method.apply(domain, args);
      } else {
        throw new Error(`Mehod ${path} not available`);
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }, {
    has: function () {
      return true;
    },
    get: function (object, property) {
      resource.push(property);
      return proxy;
    },
    apply: function(object, thisArg, argumentsList) {
      return Reflect.apply(object, thisArg, argumentsList);
    }
  });
  return proxy;
}

class ExtendableProxy {
  constructor() {
    return new Proxy(this, {
      has: function (object, prop) {
        return true;
      },
      get: function(object, property, receiver) {
        if (Reflect.has(object, property)) {
          return Reflect.get(object, property);
        } else {
          if (property === 'init') {
            return async (...args) => {
              const serialize = Reflect.get(object, 'serialize', receiver).bind(object);
              return await serialize();
            }
          } else if (property === '$resource') {
            return resourceBuilder(object);
          } else {
            return Reflect.get(object, property);
          }
        }
      }
    });
  }
}

export default class ApiClient extends ExtendableProxy {

  constructor ({ api, key, version }) {
    super();
    this.api = api;
    this.key = key;
    this.version = version;
    // this.serialize();
  }

  // async init (api?: string = this.api) {
  //   return this.$resource;
  // }

  async serialize (api?: string = this.api) {
    if (this._resources) {
      return this._resources;
    }
    console.log('run api serialization');
    try {
      const { resources, baseUrl: baseURL } = await ApiDiscovery.getRest(api, { fields: 'resources,baseUrl' });
      return this._resources = this.buildResources(resources, baseURL);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  dict (entries) {
    if(Array.isArray(entries) && entries.length) {
      return Object.assign({}, ...entries.map( ([key, value]) => ({[key]: value}) ));
    } else {
      return null;
    }
  }

  validator (parameters: any) {
    const required = Object
      .entries(parameters)
      .filter(([ name, parameter ]) => parameter.required)
      .map(([ name, parameter ]) => name);

    const assumed = Object
      .entries(parameters)
      .filter(([ name, parameter ]) => parameter.default)
      .map(([ name, parameter ]) => ([ name, parameter.default ]));

    const entries = Object.entries(parameters);
    const keys = Object.keys(parameters);
    // const requiredX = entries.filter(([ key, value ]) => value.required).map(([ name, parameter ]) => name);
    const schema = entries.reduce((schema, [ key, value ]) => {
      return Object.assign({}, schema, {
        [key]: {
          type: value.type,
          default: value.default,
          minimum: value.minimum,
          maximum: value.maximum,
        }
      });
    }, {});

    return function (expression: any) {
      return true;
    };
  }

  buildMethods (methods, baseURL) {
    return methods.reduce((actions, [ name, { httpMethod, path, parameters, response } ]) => {
      const request = (validator: any, config: any) => {
        switch (config.method.toUpperCase()) {
          case 'GET': {
            return async (params?: Object) => await $http({ ...config, ...{ params }});
          }
          case 'POST': {
            if (validator) {
              return async (params?: Object, data?: Object) => await $http({ ...config, ...{ params, data }});
            } else {
              return async (data?: Object) => await $http({ ...config, ...{ data }});
            }
          }
          case 'DELETE': {
            return async (params?: Object) => await $http({ ...config, ...{ params }})
          }
          default:
            return async (params?: Object) => await $http({ ...config, ...{ params }})
        }
      }
      const validator = parameters ? this.validator(parameters) : null;
      return Object.assign({}, actions, {
        [name]: request(validator, { ...$http.defaults.params, ...{
          method: httpMethod,
          baseURL,
          url: path
        }})
      });

    }, {});
  }

  buildResources (resources, baseURL) {
    // $http.defaults.baseURL = baseURL;
    $http.defaults.params = { key: this.key };
    return Object.entries(resources).reduce((resources, [ name, { methods } ]) => {
      return Object.assign({}, resources, {
        [name]: this.buildMethods(Object.entries(methods), baseURL)
      })
    }, {});
  }
}
