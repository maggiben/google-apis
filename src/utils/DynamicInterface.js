// @flow

///////////////////////////////////////////////////////////////////////////////
// @file         : DynamicInterface.js                                       //
// @summary      : Dynamic interface builder                                 //
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

type Options = {
  baseURL: string
};

type Interfaces = {
  serializer?: string
};

function builder (target: any, serializer: Function) {
  const resource = [];

  const emitter = async function (...args) {
    try {
      const methods = await serializer();
      const method = resource.reduce((result, key) => result[key], methods);
      if (method) {
        console.log(`Call method ${resource.join('.')}`);
        return method.apply(target, args);
      } else {
        throw new Error(`Mehod ${resource.join('.')} not available`);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };

  const handler = {
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
  };
  const proxy = new Proxy(emitter, handler);

  return proxy;
}

export default class DynamicInterface {
  constructor(interfaces: Interfaces) {
    const handler = {
      has: function (object, prop) {
        return true;
      },
      get: function(object, property, receiver) {
        if (Reflect.has(object, property)) {
          return Reflect.get(object, property);
        } else {
          const { serializer } = interfaces[property];
          return serializer ? builder(object, Reflect.get(object, serializer).bind(object)) : Reflect.get(object, property, receiver);
        }
      }
    };
    return new Proxy(this, handler);
  }
}
