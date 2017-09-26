// @flow

///////////////////////////////////////////////////////////////////////////////
// @file         : paramsSerializer.js                                       //
// @summary      : Augmented http client param serialization                 //
// @version      : 1.0.0                                                     //
// @project      : N/A                                                       //
// @description  : Reference: github.com/mzabriskie/axios#request-config     //
// @author       : Benjamin Maggi                                            //
// @email        : benjaminmaggi@gmail.com                                   //
// @date         : 26 Sep 2017                                               //
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

export const paramsSerializer = function (params: Object) : string {
  const query = { ...params };
  const { fields, id } = query;

  // Transform array of fields into comma-separated list
  if (Array.isArray(fields) && fields.length) {
    query.fields = fields.join(',');
  }

  // Transform array of id's into comma-separated list
  if (Array.isArray(id) && id.length) {
    query.id = id.join(',');
    query.maxResults = id.length;
  } else if (id && id.length) {
    query.maxResults = id.split(',').length;
  }

  // build querystring and clean null or undefined parameters
  return querystring.stringify.apply(null, [ Object.entries(query)
    .filter(param => param.slice(-1).pop() != null)
    .reduce((params, [param, value]) => ({...params, ...{ [param]: value }}), {})]);
};
