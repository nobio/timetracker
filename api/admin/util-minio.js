/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
const Minio = require('minio');
const mongoose = require('mongoose');

const MODELS = ['User', 'StatsDay', 'Toggle', 'Properties', 'GeoFence', 'FailureDay', 'TimeEntry', 'GeoTracking'];
const BUCKET_NAME = process.env.MINIO_DEFAULT_BUCKET;
let isDumpRunning = false;

const connectMinioClient = () => new Minio.Client({
  endPoint: process.env.MINIO_HOST,
  port: Number(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  autoDeleteObjects: true,
});

// Configure MinIO client
let minioClient = connectMinioClient();

// Ensure the bucket exists
minioClient.bucketExists(BUCKET_NAME)
  .then((buckExists) => {
    if (buckExists) { console.log(`Bucket "${BUCKET_NAME}" already exists.`); } else {
      // Create the bucket if it does not exist
      minioClient.makeBucket(BUCKET_NAME, '', (error) => {
        if (error) {
          console.log(`Error creating bucket ${BUCKET_NAME}: `, err);
        }
        console.log(`Bucket ${BUCKET_NAME} + created successfully.`);
      });
    }
  })
  .catch((err) => console.error(err));

/**
 * Uploads a JSON Object to a S3 bucket
 * @param {*} bucket Name of the bucket the object is supposed to be uploaded
 * @param {*} objectName Name of the actual object that is tp be uploaded
 * @param {*} object The (JSON) Object to be uploaded
 * @returns Status Message
 */
const upload = async (objectName, object) => {
  // Instantiate the minio client with the endpoint
  // and access keys as shown below.
  minioClient = connectMinioClient();
  try {
    // switch on/off versioning of buckets
    // await minioClient.setBucketVersioning(BUCKET_NAME, { Status: 'Enabled' });

    const metaData = {
      'Content-Type': 'application/json',
      'X-Date': new Date().toISOString(),
    };

    // Using putObject API upload your file to the bucket europetrip.
    const ojbBuffer = Buffer.from(JSON.stringify(object));
    // await minioClient.removeObject(bucket, objectName);
    const objInfo = await minioClient.putObject(BUCKET_NAME, objectName, ojbBuffer, metaData);
    console.log(`${objectName} uploaded successfully to ${BUCKET_NAME}: ${JSON.stringify(objInfo)}`);

    return `${objectName} uploaded successfully`;
  } catch (error) {
    console.error(error);
  }
};

const downloadObject = async (objectName) => {
  minioClient = connectMinioClient();

  try {
    const objStream = await minioClient.getObject(BUCKET_NAME, objectName);

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
  console.log(`------------------- DUMP DATA TO S3 STORAGE (${isDumpRunning}) ---------------------`);
  if (isDumpRunning) return;
  isDumpRunning = true;

  const res = [];

  for (const modelType of MODELS) {
    const Model = mongoose.model(modelType);
    const entries = await Model.find();
    res.push(await upload(modelType, entries));
  }
  isDumpRunning = false;
  return res;
};

exports.restoreFromS3 = async () => {
  const res = [];
  for (const modelType of MODELS) {
    const objJsonArray = await downloadObject(modelType);
    await restore(modelType, objJsonArray);

    res.push(`${modelType} sucessfully restored`);
  }

  return res;
};
