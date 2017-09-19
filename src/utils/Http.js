// @flow

///////////////////////////////////////////////////////////////////////////////
// @file         : Http.js                                                   //
// @summary      : Http client wrapper                                       //
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


import querystring from 'querystring';
import axios, { Axios } from 'axios';

type Options = {
  baseURL: string
};

export const Http = function (config) {

  const sanitizeConfig = config => {
    return {
      url: path,
      baseURL: baseUrl
    };
  };

  const paramsSerializer = params => {
    params = Object.assign({}, params);
    const { fields, id } = params;
    if (Array.isArray(fields) && fields.length) {
      params.fields = fields.join(',');
    }

    if (Array.isArray(id) && id.length) {
      params.id = id.join(',');
      params.maxResults = id.length;
    } else if (id && id.length) {
      params.maxResults = id.split(',').length;
    }
    // build querystring and clean null or undefined parameters
    const query = Object.entries(params)
      .filter(param => param.slice(-1).pop() != null)
      .reduce((acc, [key, value]) => Object.assign(acc, { [key]: value }), {});
    return querystring.stringify(query);
  };

  const responseHandler = response => {
    // console.log('response.interceptor', response);
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
  };

  const requestHandler = config => {
    // console.log('request.interceptor', config);
    return config;
  }

  const errorHandler = error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
      return Promise.reject(error);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
      return Promise.reject(error);
    }
    console.log(error.config);
    return Promise.reject(error);
  }

  const defaults = {
    baseURL: 'https://www.googleapis.com',
    paramsSerializer: paramsSerializer
  };

  const instance = axios.create({ defaults, ...config });
  instance.instanceId = Math.random().toString(36).substr(2, 10).toUpperCase();
  instance.interceptors.response.use(responseHandler, errorHandler);
  instance.interceptors.request.use(requestHandler, errorHandler);
  return instance;
}

const config = {
  baseURL: 'https://www.googleapis.com',
  paramsSerializer(params) {
    params = Object.assign({}, params);
    const { fields, id } = params;
    if (Array.isArray(fields) && fields.length) {
      params.fields = fields.join(',');
    }

    if (Array.isArray(id) && id.length) {
      params.id = id.join(',');
      params.maxResults = id.length;
    } else if (id && id.length) {
      params.maxResults = id.split(',').length;
    }
    // build querystring and clean null or undefined parameters
    const query = Object.entries(params)
      .filter(param => param.slice(-1).pop() != null)
      .reduce((acc, [key, value]) => Object.assign(acc, { [key]: value }), {});
    return querystring.stringify(query);
  }
};

const response = [function (response) {
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
}];

// $http.interceptors.request.use(config => {
//   console.log('interceptors.request', config)
//   return config;
// })

const $http = axios.create(Object.assign({}, config));
$http.interceptors.response.use(...Array.from(response));
$http.instanceId = Math.random().toString(36).substr(2, 10).toUpperCase();
export default $http;
