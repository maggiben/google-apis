// @flow

///////////////////////////////////////////////////////////////////////////////
// @file         : GoogleApis.js                                             //
// @summary      : Interface for Google API Discovery Service                //
// @version      : 1.0.0                                                     //
// @project      : N/A                                                       //
// @description  : Reference: developers.google.com/discovery/v1/reference   //
// @author       : Benjamin Maggi                                            //
// @email        : benjaminmaggi@gmail.com                                   //
// @date         : 16 Sep 2017                                               //
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

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { URL, URLSearchParams } from 'url';
import URITemplate from 'urijs/src/URITemplate';
import skeemas from 'skeemas';
import safe from './safeobj';

/* Type Definitions */
import type { Axios } from 'axios';

export type ServiceParams = {
  path: string,
  name?: string, // The name of the API. (string)
  version?: string, // The version of the API. (string)
  params: {
    fields?: string, // Selector specifying which fields to include in a partial response.
    preferred?: boolean
  }
};

export type DirectoryItem = {
  discoveryRestUrl: string,
  version: string,
  documentationLink: string
};

var Cache = null;

export class GoogleApi<Auth, Options> {
  options: any;
  auth: any;
  $http: any = axios.create({
    baseURL: 'https://www.googleapis.com',
    paramsSerializer: this.serializer,
    params: {
      key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU'
    }
  });

  constructor(auth?: Auth, options?: Options) {
    this.$http.interceptors.response.use(response => {
      const { params } = response.config;
      if (!params) {
        return response.data;
      }
      else if (Array.isArray(params.fields) && params.fields.length) {
        console.log('fields skipped');
      } else if (params.fields && params.fields.length) {
        console.log('fields', params.fields.split(','));
      }
      return response.data;
    }, function (error) {
      // Do something with response error
      return Promise.reject(error);
    });
  }

  serializer (params: any)  {
    params = Object.assign({}, params);
    const { fields } = params;
    if (Array.isArray(fields) && fields.length) {
      params.fields = fields.join(',');
    }
    // clean null undefined
    const entries = Object.entries(params).filter(param => param.slice(-1).pop() != null);
    /* $FlowIssue */
    const searchParams: URLSearchParams = new URLSearchParams(entries);
    return searchParams.toString();
  }

  async get (url?: string, params?: any) : Promise<*> {
    try {
      return await this.$http.get(url, { params });
    } catch (error) {
      console.error(error);
    }
  }

  async request (config: any) : Promise<*> {
    try {
      return await this.$http(config);
    } catch (error) {
      console.error(error);
    }
  }
}

type Resource = {
  methods: any
};

export type DirectoryList = {
  id: string,
  discoveryVersion?: string,
  items: Array<DirectoryItem>,
  kind: string,
  type: string
};

/*

Retrieve the list of APIs supported at this endpoint.

The discovery.apis.list method returns the list all APIs supported
by the Google APIs Discovery Service. The data for each entry is a subset
of the Discovery Document for that API, and the list provides a directory
of supported APIs.
If a specific API has multiple versions, each of the versions has its own entry in the list.

*/

export class ApiDirectory extends GoogleApi {
  discoveryService: ServiceParams = {
    name: 'discovery',
    path: 'https://www.googleapis.com/discovery/{version}/apis',
    version: 'v1',
    params: {
      preferred: true
    }
  };
  service: any;
  discovery: any;

  constructor(...args: any) {
    super(...args);
  }

  async init () {
    if (Cache && Cache.has('discovery')) {
      return this.service;
    }
    try {
      const item = await this.list('discovery');
      const description = await this.getRest(item);
      this.service = { item, description };
      return this.service;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  url (name?: string, preferred?: boolean = true) {
    const googleapis = 'https://www.googleapis.com';
    const service = {
      params: { name, preferred },
      url: {
        hostname: 'www.googleapis.com',
        protocol: 'https:',
        pathname: 'discovery/v1/apis',
      }
    };
    const baseURL = new URL(service.url.pathname, googleapis);
    // Filter empty
    //const params = Object.entries(service.params).filter(param => param.slice(-1).pop() != null);
    //baseURL.search = new URLSearchParams(params).toString();
    return baseURL.toString();
  }

  async list (name?: string, preferred?: boolean = true) : Promise<*> {
    if(name && Cache && Cache.has(name)) {
      return Cache.get(name);
    }

    try {
      const params = { name, preferred };
      const { items } = await super.get('discovery/v1/apis', params);
      Cache = new Map(items.reduce((entries, item) => entries.concat([[item.name, item]]), []));
      if(name && Cache) {
        return Cache.get(name);
      } else {
        return Array.from(Cache.values());
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getRest (item: string | DirectoryItem, params?: any) : Promise<*> {
    try {
      if (typeof item === 'string') {
        item = await this.list(item);
      }
      const { discoveryRestUrl } = item;
      const result = await super.get(discoveryRestUrl, params);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getShemas (directoryItem: DirectoryItem) : Promise<*> {
    const params = {
      fields: 'schemas'
    };
    try {
      const { schemas } = await this.getRest(DirectoryItem, params);
      return schemas;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export class ApiClient extends GoogleApi {

  constructor (...args: any) {
    super(...args);
    this.$resource = safe({
      baseURL: 'https://www.googleapis.com'
    });
  }

  async init (name: string) {
    try {
      const directory = new ApiDirectory();
      const item = await directory.list(name);
      const description = await directory.getRest(item);
      this.service = description;
      this.$resource = this.buildResources(description.resources);
      return this;
    } catch (error) {
      console.error(error);
      throw error;
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

  buildMethods (methods) {
    return methods.reduce((actions, [ name, { httpMethod, path, parameters, response } ]) => {
      const required = Object
        .entries(parameters)
        .filter(([ name, parameter ]) => parameter.required)
        .map(([ name, parameter ]) => ([name, null]));

      const assumed = Object
        .entries(parameters)
        .filter(([ name, parameter ]) => parameter.default)
        .map(([ name, parameter ]) => ([name, parameter.default]));

      const request = (validator: any, method: any) => {
        /*
        const validEntries = Object.entries(parameters);
        const validKeys = Object.keys(parameters);
        const requiredKeys = validEntries.filter(([ key, value ]) => value.required).map(([ name, parameter ]) => name);
        const validSchema = validEntries.reduce((schema, [key, value]) => {
          return Object.assign({}, schema, {
            [key]: {
              type: value.type,
              default: value.default,
              minimum: value.minimum,
              maximum: value.maximum,
            }
          });
        }, {});
        */

        return async (params: any) => {
          try {

            /*
            const hasValidParams = Object.entries(params)
            .every(function ([key, value]) {
              return validKeys.includes(key) && skeemas.validate(value, validSchema[key]);
            });

            const hasRequiredParams = requiredKeys.every(param => {
              return Object.keys(params).includes(param);
            });
            */

            // console.log('validKeys', validKeys)
            // console.log('requiredKeys', requiredKeys);
            // console.log('hasValidParams', hasValidParams)
            // console.log('hasRequiredParams', hasRequiredParams)
            // console.log('params', params);

            return await super.request(Object.assign({}, method, { params }));
          } catch (error) {
            console.error(error);
            throw error;
          }
        }
      }

      const validator = this.validator(parameters);

      return Object.assign({}, actions, {
        [name]: request(validator, {
          method: httpMethod,
          url: this.service.basePath + path/*,
          params: {
            ...this.dict(required),
            ...this.dict(assumed)
          }*/
        })
      });
    }, {});
  }

  buildResources (resources) {
    return Object.entries(resources).reduce((resources, [ name, { methods } ]) => {
      return Object.assign({}, resources, {
        [name]: this.buildMethods(Object.entries(methods))
      })
    }, {});
  }
}


