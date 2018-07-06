//
// SecureImage
//
// Copyright © 2018 Province of British Columbia
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Created by Jason Leach on 2018-01-15.
//

'use strict';

import config from '../config';
import { logger } from './logger';

/**
 * Crete a new bucket
 *
 * @param {String} bucket The name of the bucket
 */
export const makeBucket = (client, bucket) => new Promise((resolve, reject) => {
  client.makeBucket(bucket, config.get('minio:region'), (err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve();
  });
});

/**
 * Check if a bucket exists
 *
 * @param {String} bucket The name of the bucket
 * @returns {Promise} Returns a promise with the error or boolean
 */
export const bucketExists = (client, bucket) => new Promise((resolve, reject) => {
  // The API for `bucketExists` does not seem to match the documentaiton. In
  // returns an error with code 'NoSuchBucket' if a bucket does *not* exists;
  // the docs say no error should be retunred and success should equal false.
  client.bucketExists(bucket, (err, exists) => {
    if (err && (err.code === 'NoSuchBucket' || err.code === 'NotFound')) {
      resolve(false);
      return;
    }

    // Any other error is a legit error.
    if (err && (err.code !== 'NoSuchBucket' && err.code !== 'NotFound')) {
      reject(err);
      return;
    }

    if (exists) {
      resolve(true);
    }

    resolve(false);
  });
});

/**
 * List contest of a bucket.
 *
 * @param {String} bucket The name of the bucket.
 * @param {String} [prefix=''] Prefix to filter the contents on.
 * @returns {Promise} Returns a promise with the error or array of objects
 */
export const listBucket = (client, bucket, prefix = '') => new Promise((resolve, reject) => {
  const stream = client.listObjectsV2(bucket, prefix, false);
  const objects = [];

  stream.on('data', (obj) => {
    objects.push(obj);
  });

  stream.on('end', () => {
    resolve(objects);
  });

  stream.on('error', (error) => {
    reject(error);
  });
});

/**
 * Fetch an object from an existing bucket
 *
 * @param {String} bucket The name of the bucket
 * @param {String} name The name of the object to retrieve
 * @returns {Promise} Returns a promise with the error or Buffer
 */
export const getObject = (client, bucket, name) => new Promise((resolve, reject) => {
  let size = 0;
  const data = [];

  client.getObject(bucket, name, (error, stream) => {
    if (error) {
      reject(error);
      return;
    }

    stream.on('data', (chunk) => {
      size += chunk.length;
      data.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(data, size));
    });

    stream.on('error', (serror) => {
      reject(serror);
    });
  });
});

/**
 * Add an object to a bucket
 *
 * @param {String} bucket The name of the bucket
 * @param {String} name The name the object will have in the bucket
 * @param {Buffer} data The object data `Stream` or `Buffer`
 * @returns {Promise} Returns a promise with the error or etag
 */
export const putObject = (client, bucket, name, data) => new Promise((resolve, reject) => {
  client.putObject(bucket, name, data, (error, etag) => {
    if (error) {
      reject(error);
    }

    resolve(etag);
  });
});

/**
 * Get a resigned URL for an object
 *
 * @param {String} bucket The name of the bucket
 * @param {String} name The name of the object
 * @returns {Promise} Returns a promise with the error or presigned-url
 */
// eslint-disable-next-line arrow-body-style
export const presignedGetObject = (client, bucket, name, expiryInSeconds = 604800) => {
  return new Promise((resolve, reject) => {
    client.presignedGetObject(bucket, name, expiryInSeconds, (error, presignedUrl) => {
      if (error) {
        reject(error);
      }

      resolve(presignedUrl);
    });
  });
};

/**
 * Fetch the stats of a given object
 *
 * @param {Object} client The minio client
 * @param {String} bucket The name of the bucket
 * @param {String} fileName The name of the file to fetch the stats for
 * @returns {Promise} Returns a promise with the error or statistics
 */
export const statObject = (client, bucket, fileName) => new Promise((resolve, reject) => {
  client.statObject(bucket, fileName, (err, stat) => {
    if (err) {
      reject(err);
    }

    resolve(stat);
  });
});

// HELPERS

export const isExpired = (object, days) => {
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const then = new Date(object.lastModified);
  const deltaAsMs = Math.abs(now.getTime() - then.getTime());
  const deltaAsDays = Math.round(deltaAsMs / oneDayInMs);

  return deltaAsDays > days;
};

export const createBucketIfRequired = async (client, bucket) => {
  try {
    const exists = await bucketExists(client, bucket);
    if (!exists) {
      await makeBucket(client, bucket);
    }
  } catch (err) {
    logger.error(`Unable to create bucket: ${bucket}, error = ${err}`);
    throw new Error(`Unable to create bucket: ${bucket}`);
  }
};

export const expiredTopLevelObjects = async (client, bucket, prefix = '', days = 90) => {
  try {
    const topLevelObjects = await listBucket(bucket, prefix);
    const promises = topLevelObjects.map(async (e) => {
      // container objects have a prefix property
      if (typeof (e.prefix) !== 'undefined') {
        return [await statObject(bucket, e.prefix), { prefix: e.prefix }];
      }

      return null;
    });

    const results = (await Promise.all(promises))
      .map((i) => {
        const [a, b] = i;
        return { ...a, ...b };
      })
      .filter(i => isExpired(i, days));

    return results;
  } catch (error) {
    // console.log(error.message);
    throw error;
  }
};
