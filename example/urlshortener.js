/* example using urlshortener api */

import { ApiDiscovery, ApiClient } from '../src/';

const urlshortener = async function () {
  const client = new ApiClient('urlshortener', {
    params: { key: 'AIzaSyD07_EyMD1S7MGNf0GkL5V7dZ8qx2NRm2U' }
  });
  try {
    const { id } = await client.$resource.url.insert({
      longUrl: 'https://en.wikipedia.org/wiki/Stephen_Hawking'
    });
    console.log('result', id);
  } catch (error) {
    console.error(error);
  }
}

urlshortener();


