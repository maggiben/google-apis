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
import Ajv from 'ajv';
import ApiDiscovery from  './ApiDiscovery';
import DynamicInterface from './DynamicInterface';
import { Http } from './Http';

type Options = {
  baseURL: string
};

type Interceptor = Object | Function | Promise<*>;

export default class ApiClient extends DynamicInterface {

  httpOptions: Object;
  api: string;
  key: string;

  constructor (api: string, httpOptions: Object) {
    const interfaces = {
      '$resource': {
        serializer: 'serialize'
      }
    };
    super(interfaces);
    this.api = api;
    this.httpOptions = httpOptions;
    this.cache = new Map();
  }

  async serialize (api?: string = this.api) {
    if (this.cache.has(api)) return this.cache.get(api);
    console.log('run api serialization');
    try {
      const { resources, schemas, baseUrl: baseURL } = await ApiDiscovery.getRest(api, { fields: 'resources,schemas,baseUrl' });
      const resourceHandlers = this.buildResources(resources, schemas, { baseURL, ...this.httpOptions });
      this.cache.set(api, resourceHandlers);
      return Object.assign({}, resourceHandlers);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  validator ({ id, description }, { required, defaults }) {
    const keywords = ['multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength', 'pattern', 'items', 'additionalItems', 'maxItems', 'minItems', 'uniqueItems', 'contains', 'maxProperties', 'minProperties', 'required', 'properties', 'patternProperties', 'additionalProperties', 'dependencies', 'propertyNames', 'enum', 'const', 'type', 'allOf', 'anyOf', 'oneOf', 'not'];
    const ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      // removeAdditional: true,
      coerceTypes: true,
      unknownFormats: ['uint32', 'int32', 'uint64', 'int64', 'double'],
      validateSchema: false
    });
    const schema = {
      'type': 'object',
      'id': id,
      'description': description,
      'required': Object.keys(required),
      // 'additionalProperties': false,
      'properties': { ...required, ...defaults }
    };
    return (params?: Object, data?: Object) => {
      const valid = ajv.validate(schema, params);
      if (!valid)
        throw new Error(ajv.errorsText());
      else
        return valid;
    }
  }

  validate ({ id, description }, parameters: Object, schema: Object) {
    const required = Object
      .entries(parameters)
      .filter(([ name, parameter ]) => parameter.required)
      .reduce((parameters, [ name, parameter ]) => ({ ...parameters, ...{ [name]: parameter }}), {});

    const defaults = Object
      .entries(parameters)
      .filter(([ name, parameter ]) => parameter.default)
      .reduce((parameters, [ name, parameter ]) => ({ ...parameters, ...{ [name]: parameter }}), {});

    return this.validator({ id, description }, { required, defaults }, schema);
  }

  buildRequest (interceptor: Interceptor) : Function {
    return async (params?: Object, data?: Object) => {
      try {
        return await interceptor({ params, data });
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }

  buildInterceptor (schemas: Object, method: Object, httpOptions: Object) {
    const $http = Http(httpOptions);
    const [ name, config ] = method;
    const { response, request} = config;
    const interceptor = {
      $http,
      request:  { name, schemas: schemas[ {...request  }.$ref ], $ref: {...request  }.$ref, ...{config}},
      response: { name, schemas: schemas[ {...response }.$ref ], $ref: {...response }.$ref, ...{config}}
    };
    $http.defaults.url = config.path;
    $http.defaults.method = config.httpMethod;
    $http.interceptors.response.use(this.responseHandler, this.errorHandler);
    $http.interceptors.request.use(this.requestHandler, this.errorHandler);
    const bypass = async (...args: any) => await $http(...args)
    return bypass.bind(interceptor);
  }

  buildMethods (methods: Object, schemas: Object, httpOptions?: Object) {
    return Object
    .entries(methods)
    .reduce((actions, method) => {
      const [ name, config ] = method;
      const interceptor = this.buildInterceptor(schemas, method, httpOptions);
      const httpHandler = this.buildRequest(interceptor)
      return {...actions, ...{ [name]: httpHandler }};
    }, {});
  }

  buildResources (resources, schemas, httpOptions) {
    return Object
    .entries(resources)
    .reduce((resources, [ name, { methods } ]) => ({ ...resources, ...{ [name]: this.buildMethods(methods, schemas, httpOptions) }}), {});
  }
  responseHandler (response) {
    return response;
  };
  requestHandler (config) {
    return config;
  }
  errorHandler (error) { return Promise.reject(error); }
}
