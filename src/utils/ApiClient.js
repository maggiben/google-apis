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

// const $http = Http();


export default class ApiClient extends DynamicInterface {

  constructor ({ api, key, version }) {
    const interfaces = {
      '$resource': {
        serializer: 'serialize'
      }
    };
    super(interfaces);
    this.api = api;
    this.key = key;
    this.version = version;
  }

  async serialize (api?: string = this.api) {
    if (this._resources) {
      return this._resources;
    }
    console.log('run api serialization');
    try {
      const { resources, schemas, baseUrl: baseURL } = await ApiDiscovery.getRest(api, { fields: 'resources,schemas,baseUrl' });
      return this._resources = this.buildResources(resources, schemas, baseURL);
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

  buildRequest (validate: Function, config: Object) {
    const $http = Http();
    // instance.interceptors.response.use(responseHandler, errorHandler);
    // instance.interceptors.request.use(requestHandler, errorHandler);
    // $http.defaults.params = { key: this.key };
    return async (params?: Object, data?: Object) => {
      try {
        // const request = axios.create(Object.create($http.constructor)).bind($http);
        if (validate(params, data)) return await $http({ ...config, ...{ params }});
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }

  buildInterceptorsXX (schema, { request, response }) {
    console.log({ request, response })
    // const interceptors = Object.entries({ request, response })
      // .filter(([interceptor, $ref]) => ($ref))

    // const hash = interceptors.reduce((interceptors, [interceptor, { $ref }]) => ({...interceptors, ...{ [interceptor]: schema[$ref] }}), {});
    // console.log('interceptors:', JSON.stringify(hash,0,2));
    // console.log('interceptors:', JSON.stringify(interceptors,0,2));
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
    console.log(JSON.stringify(Object.assign(...[{ request }, { response }]),0,2))
    process.exit()
    return interceptors;
  }

  buildInterceptors (schema, method) {
    const [ name, { request, response, id, path, parameters, httpMethod }] = method;
    // const interceptors = [{ request, id, name }, { response, id, name }]
    // .reduce((interceptors, method) => {
    //   const { id, request, response } = method;
    //   const cosa = [
    //     ...( ('request' in method) ? [{ request: { ...request }.$ref }] : []),
    //     ...( ('response' in method) ? [{ response: { ...response }.$ref } ] : [])
    //   ];
    //   console.log(cosa)
    //   return ({...interceptors, ...{
    //     ...( ('request' in method) ? request: {
    //         id,
    //         schema: schema[ { ...request }.$ref ],
    //         $ref: { ...request }.$ref
    //       } : {}),
    //     ...( ('response' in method) ? response: {
    //         id,
    //         schema: schema[ { ...response }.$ref ],
    //         $ref: { ...response }.$ref
    //       } : {})
    //   }});
    // }, {});

    const interceptors = {
      request: {
        id,
        schema: schema[ { ...request }.$ref ],
        $ref: { ...request }.$ref
      },
      response: {
        id,
        schema: schema[ { ...response }.$ref ],
        $ref: { ...response }.$ref
      }
    };
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-');
    console.log('interceptors', JSON.stringify(interceptors,0,2))
    // return Object.assign(...interceptors);
    return interceptors;
  }

  buildMethods (methods, schema, baseURL) {
    const workers = Object.entries(methods).reduce((actions, method) => {
      // const [ name, { id, httpMethod, description, path, parameters, request, response }] = method;
      const interceptors = this.buildInterceptors(schema, method);

      // const validate = parameters ? this.validate({ id, description }, parameters, interceptors) : null;
      // const config = { ...$http.defaults.params, ...{ method: httpMethod, baseURL, url: path }};
      // const config = { method: httpMethod, baseURL, url: path };
      // console.log(JSON.stringify(config,0,2))
      // console.log($http.interceptors, $http.defaults)
      // process.exit()
      // return { ...actions, ...{ [name]: this.buildRequest(validate, config) }};
    }, {});
    console.log(JSON.stringify(workers,0,2));
    return workers;
  }

  buildResources (resources, schemas, baseURL) {
    // $http.defaults.params = { key: this.key };
    return Object.entries(resources).reduce((resources, [ name, { methods } ]) => {
      return { ...resources, ...{ [name]: this.buildMethods(methods, schemas, baseURL) }};
    }, {});
  }
}
