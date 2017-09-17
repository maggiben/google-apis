import { expect } from 'chai';
import nock from 'nock';
import ApiClient from '../../src/utils/ApiClient';

// describe('Basic async', () => {

//   it('should work', function() {
//     const variable = 99;
//     expect(variable).to.equal(99);
//   });

//   it('should timeout', function(done) {
//     setTimeout(function () {
//       return done();
//     }, 2000)
//   });

//   it('should getInfo', function(done) {
//     getInfo().then(function () {
//       return done();
//     })
//   });

// });

describe('Test ApiClient', function() {

  beforeEach(() => {
    nock.disableNetConnect();
    nock('https://www.googleapis.com')
      .get('/discovery/v1/apis')
      .query({ name: 'youtube' })
      .reply(200, { token: 1 });
  });

  afterEach(() => nock.cleanAll());

  it('it should get playlistItems', async function () {
    const client = new ApiClient();
    const directory = await client.get('discovery/v1/apis', { name: 'youtube' });
    expect(1).to.equal(1);
  });

});

/*
import chai from 'chai';
import axios from 'axios';
import skeemas from 'skeemas';
import { URL, URLSearchParams } from 'url';
import { ApiDirectory, ApiClient } from '../../client/scripts/lib/GoogleApiDiscovery';

const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

describe('Test ApiDirectory', function() {

  it('it should get discovery service url', function (done) {

    const directory = new ApiDirectory();
    const url = new URL(directory.url('discovery'));

    expect(url)
      .to.be.an.instanceof(URL);
    expect(url.protocol)
      .to.be.a('string')
      .and.to.equal('https:');
    expect(url.hostname)
      .to.be.a('string')
      .and.to.equal('www.googleapis.com');
    expect(url.pathname)
      .to.be.a('string')
      .and.to.equal('/discovery/v1/apis');
    return done();
  });

  it('it should retrieve the list of APIs supported at this endpoint', async function () {
    const apiDirectory = new ApiDirectory();
    const items = await apiDirectory.list();
    expect(items).to.be.an('array');
  });

  it('it should retrieve the description of a particular version of an API', async function () {
    try {
      const apiDirectory = new ApiDirectory();
      const directoryItem = await apiDirectory.list('youtube');
      const description = await apiDirectory.getRest(directoryItem);
      expect(description)
        .to.be.an('object');
      } catch (error) {
        throw new Error(error);
      }
  });

});

describe('Test youtube: ApiClient', function() {

  it('it should get playlistItems', async function () {
    const client = new ApiClient({
      api: 'youtube',
      key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU'
    });
    const { $resource, service } = await client.init('youtube');
    const { pageInfo, items } = await $resource.playlistItems.list({
      playlistId: 'PLBCF2DAC6FFB574DE',
      maxResults: 25,
      part: 'snippet,contentDetails'
    });
    expect(pageInfo)
      .to.be.an('object')
      .and.to.have.all.keys(['totalResults', 'resultsPerPage'])
      .and.to.have.property('resultsPerPage', 25);
    expect(items)
      .to.be.an('array')
      .and.to.have.lengthOf(pageInfo.totalResults);
  });

  it('it should get a video list', async function () {
    const client = new ApiClient({
      api: 'youtube',
      key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU'
    });
    const { $resource, service } = await client.init('youtube');
    const { pageInfo, items } = await $resource.videos.list({
      id: 'Ks-_Mh1QhMc',
      part: 'snippet,contentDetails'
    });
    expect(items)
      .to.be.an('array')
      .and.to.have.lengthOf(1);
  });

  it('it safely handles unknown resources', async function () {

    const client = new ApiClient({
      api: 'youtube',
      key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU'
    });
    console.log('------------------------------------------')
    console.log('------------------------------------------')
    console.log('------------------------------------------')
    console.log('VIDEOS', client.$resource.videos.list, 'V:', typeof client.$resource, 'result', client.$resource.videos.list());
    console.log('------------------------------------------')
    console.log('------------------------------------------')
    console.log('------------------------------------------')

    // const result = await client.$resource.videos.list({
    //   id: 'Ks-_Mh1QhMc',
    //   part: 'snippet,contentDetails'
    // });
    // console.log(result)

  });
});

describe('Test urlshortener ApiClient', function() {
  it('it should get urlshortener', async function () {
    const client = new ApiClient({
      api: 'youtube',
      key: 'AIzaSyAPBCwcnohnbPXScEiVMRM4jYWc43p_CZU'
    });
    const { $resource, service } = await client.init('urlshortener');
    const result = await $resource.url.insert({
      longUrl: 'http://google.com/'
    });
    console.log('result', service, $resource)
  });
});

*/
