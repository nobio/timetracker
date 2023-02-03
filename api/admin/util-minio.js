/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
const Minio = require('minio');
const fs = require('fs');
const mongoose = require('mongoose');
const zlib = require('zlib');

const connectMinIOServer = () => new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  autoDeleteObjects: true,
});

const dumpModel = async (bucketName, fileName) => {
  const bucket = bucketName.toLowerCase();
  // Instantiate the minio client with the endpoint
  // and access keys as shown below.
  const minioClient = connectMinIOServer();

  try {
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucket);

    // create bucket if not exists
    if (!bucketExists) {
      await minioClient.makeBucket(bucket, 'us-east-1');
      console.log('Bucket created successfully in "us-east-1".');
    }
    await minioClient.setBucketVersioning(bucket, { Status: 'Enabled' });

    const metaData = {
      'Content-Type': 'application/octet-stream',
      'X-Date': new Date().toISOString(),
    };

    // Using fPutObject API upload your file to the bucket europetrip.
    const objInfo = await minioClient.fPutObject(bucket, `${bucketName}.json.gz`, fileName, metaData);
    console.log(`${bucketName} uploaded successfully ${JSON.stringify(objInfo)}`);
    return `${bucketName} uploaded successfully`;
  } catch (error) {
    console.error(error);
  }
};

exports.dumpModels = async (models) => {
  const promises = [];
  // TODO: delete ./tmp, create ./tmp, create *json.gz files, upload, delete ./tmp
  // 1. delete ./tmp
  fs.rmSync('./tmp', { recursive: true, force: true });
  // 2. create ./tmp
  fs.mkdirSync('./tmp');
  // 3. create files
  for (const model of models) {
    const dumpFile = `./tmp/${model}.json.gz`;
    const m = mongoose.model(model);
    const data = await m.find();
    // 4. create file
    zlib.gzip(JSON.stringify(data), (err, buffer) => {
      if (err) {
        console.log(err);
      } else {
        fs.writeFileSync(dumpFile, buffer); // use JSON.stringify for nice format of output
        // 5. upload to S3 storage
        promises.push(dumpModel(model, dumpFile));
      }
    });
  }

  const res = await Promise.all(promises);
  // 6. delete ./tmp
  // fs.rmSync('./tmp', { recursive: true, force: true });

  return res;
};

exports.downloadFile = async (bucket) => {
  const objectsList = [];
  // require('dotenv').config();
  const minioClient = connectMinIOServer();

  const objectsStream = await minioClient.listObjects(bucket, '', true);
  return new Promise((resolve, reject) => {
    objectsStream.on('error', (error) => {
      console.log(error);
      reject(error);
    });

    objectsStream.on('data', (obj) => {
      console.log(obj.name, obj.lastModified, obj.size, obj.etag);
      objectsList.push(obj);
    });

    objectsStream.on('end', (e) => {
      console.log('Total number of objects: ', objectsList.length);
      if (objectsList.length === 0) {
        return;
      }
      objectsList.sort((objA, objB) => objB.lastModified - objA.lastModified);
      const obj = objectsList[0]; // first element
      minioClient.fGetObject(bucket, obj.name, `/Users/nobio/Projects/timetracker/dump/${obj.name}`);
    });
  });
};
