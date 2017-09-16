// @flow

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

getInfo()
