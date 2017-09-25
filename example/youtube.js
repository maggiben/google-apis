/* example using youtube api */

import { ApiDiscovery, ApiClient } from '../src/'
import os from 'os';

export const sleep = function (duration: number): Promise<void>{
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve();
    }, duration);
  });
};

export const getInfo = async function (): any {
  try {
    await sleep(1000);
    console.log(os.platform());
  } catch (error) {
    return error;
  }
};

const apiList = async function (name) {
  const discovery = new ApiDiscovery();
  const { id, title } = await discovery.list(name);
  console.log('apiList:', title, id);
}

const apiGetRestByApiName = async function (name) {
  const discovery = new ApiDiscovery();
  const { schemas, title, id } = await discovery.getRest(name, { fields: 'schemas,id,title' });
  console.log('apiGetRestByName', title, id, Object.keys(schemas).length);
}

const apiGetRest = async function (name) {
  const discovery = new ApiDiscovery();
  const api = await discovery.list(name);
  const { schemas, title, id } = await discovery.getRest(api, { fields: 'schemas,id,title' });
  console.log('apiGetRest', title, id, Object.keys(schemas).length);
}

const playlistItems = async function (playlistId) {
  const client = new ApiClient('youtube', {
    params: { key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU' }
  });
  const { pageInfo, items } = await client.$resource.playlistItems.list({
    playlistId: 'PLBCF2DAC6FFB574DE',
    maxResults: 25,
    part: 'snippet,contentDetails'
  });
  console.log('pageInfo', pageInfo);
  console.log('items', items.map(({ snippet }) => snippet.title));
}

const dynamicMethod = async function (playlistId: string) {
  const client = new ApiClient('youtube', {
    params: { key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU' }
  });
  // try {
  //   await client.$resource.videos.rate({
  //     id: '123'
  //   });
  // } catch (error) { console.log(error) }

  try {
    const { pageInfo, items } = await client.$resource.playlistItems.list({
      playlistId: 'PLBCF2DAC6FFB574DE',
      maxResults: 25,
      part: 'snippet,contentDetails'
    });
    console.log('pageInfo', pageInfo);
    console.log('video items', items.map(({ snippet }) => snippet.title));
  } catch (error) { console.error('error'); }

  try {
    const { pageInfo, items } = await client.$resource.videos.list({
      id: 'Ks-_Mh1QhMc',
      part: 'snippet,contentDetails'
    });
    console.log('pageInfo', pageInfo);
    console.log('video items', items.map(({ snippet }) => snippet.title));
  } catch (error) { console.error('error'); }
  // try {
  //   const { pageInfo, items } = await client.$resource.videos.update({
  //     id: 'Ks-_Mh1QhMc',
  //     maxResults: 25,
  //     part: 'snippet,contentDetails'
  //   });
  //   console.log('pageInfo', pageInfo);
  //   console.log('video items', items.map(({ snippet }) => snippet.title));
  // } catch (error) { return error; }
}

// apiList('youtube');
// apiGetRestByApiName('youtube');
// apiGetRest('youtube');
// playlistItems('youtube');
dynamicMethod('youtube');


