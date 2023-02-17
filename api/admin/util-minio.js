/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
const Minio = require('minio');
const mongoose = require('mongoose');

const MODELS = ['User', 'StatsDay', 'Toggle', 'Properties', 'GeoFence', 'FailureDay', 'TimeEntry', 'GeoTracking'];

const connectMinIOServer = () => new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  autoDeleteObjects: true,
});

/**
 * Uploads a JSON Object to a S3 bucket
 * @param {*} bucket Name of the bucket the object is supposed to be uploaded
 * @param {*} objectName Name of the actual object that is tp be uploaded
 * @param {*} object The (JSON) Object to be uploaded
 * @returns Status Message
 */
const upload = async (bucket, objectName, object) => {
  // Instantiate the minio client with the endpoint
  // and access keys as shown below.
  const minioClient = connectMinIOServer();

  try {
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucket);

    // create bucket if not exists
    if (!bucketExists) {
      await minioClient.makeBucket(bucket, 'eu-west-1');
      console.log(`Bucket ${bucket} created successfully in "us-east-1".`);
    }
    await minioClient.setBucketVersioning(bucket, { Status: 'Enabled' });

    const metaData = {
      'Content-Type': 'application/octet-stream',
      'X-Date': new Date().toISOString(),
    };

    // Using putObject API upload your file to the bucket europetrip.
    const ojbBuffer = Buffer.from(JSON.stringify(object));
    await minioClient.removeObject(bucket, objectName);
    const objInfo = await minioClient.putObject(bucket, objectName, ojbBuffer, metaData);
    console.log(`${objectName} uploaded successfully to ${bucket}: ${JSON.stringify(objInfo)}`);

    return `${objectName} uploaded successfully`;
  } catch (error) {
    console.error(error);
  }
};

const downloadObject = async (bucket, objectName) => {
  const minioClient = connectMinIOServer();

  try {
    const objStream = await minioClient.getObject(bucket, objectName);

    const chunks = [];
    for await (const chunk of objStream) {
      chunks.push(chunk);
    }

    const responseBuffer = Buffer.concat(chunks);
    const dataArray = JSON.parse(responseBuffer.toString('utf-8'));
    return dataArray;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

const restore = async (objectName, objectArray) => {
  console.log(`restoring model ${objectName}`);

  if (objectArray.length === 0) return;

  try {
    const Model = mongoose.model(objectName);
    await Model.deleteMany({});
    await Model.collection.insertMany(objectArray);
  } catch (error) {
    console.error(error);
  }
};

exports.dumpModels = async () => {
  const res = [];

  for (const modelType of MODELS) {
    const Model = mongoose.model(modelType);
    const entries = await Model.find();
    res.push(await upload('test-bucket', modelType, entries));
  }
  return res;
};

exports.restoreFromS3 = async () => {
  const res = [];
  for (const modelType of MODELS) {
    const objJsonArray = await downloadObject('test-bucket', modelType);
    await restore(modelType, objJsonArray);

    res.push(`${modelType} sucessfully restored`);
  }

  return res;
};
