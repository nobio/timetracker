/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
const Minio = require('minio');
const mongoose = require('mongoose');
const gUtil = require('../global_util');

const { MODEL_TYPES } = gUtil;
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
    if (buckExists) { console.log(`S3 bucket "${BUCKET_NAME}" already exists.`); } else {
      // Create the bucket if it does not exist
      minioClient.makeBucket(BUCKET_NAME, '', (error) => {
        if (error) {
          console.log(`Error creating S3 bucket ${BUCKET_NAME}: `, err);
        }
        console.log(`S3 Bucket ${BUCKET_NAME} + created successfully.`);
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
    console.log(`${objectName} uploaded successfully to S3 bucket ${BUCKET_NAME}: ${JSON.stringify(objInfo)}`);

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

    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
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
    const r = await Model.collection.insertMany(objectArray);
    console.log(r);
  } catch (error) {
    console.error(error);
  }
};

exports.dumpModels = async () => {
  console.log(`------------------- DUMP DATA TO S3 STORAGE (${isDumpRunning}) ---------------------`);
  if (isDumpRunning) return;
  isDumpRunning = true;

  const res = [];
  for (const modelType of MODEL_TYPES) {
    let result;
    try {
      const Model = mongoose.model(modelType);
      const entries = await Model.find();
      result = await upload(modelType, entries);
      res.push(result);
    } catch (error) {
      res.push(`${modelType} could not be stored`);
      console.error(error);
    }
  }
  isDumpRunning = false;
  console.log(`------------------- DUMP DATA TO S3 STORAGE (${isDumpRunning}) DONE ---------------------`);
  return res;
};

exports.getDumpedModelFromS3 = async (modelType) => await downloadObject(modelType);

exports.restoreFromS3 = async () => {
  const res = [];
  for (const modelType of MODEL_TYPES) {
    const objJsonArray = await downloadObject(modelType);
    await restore(modelType, objJsonArray);

    res.push(`${modelType} sucessfully restored`);
  }

  return res;
};

const deleteBucketAndAllObjects = async () => new Promise((resolve, reject) => {
  const objectsList = [];

  // List all object paths in bucket my-bucketname.
  const objectsStream = minioClient.listObjects(BUCKET_NAME, '', true);

  objectsStream.on('data', (obj) => {
    objectsList.push(obj.name);
  });

  objectsStream.on('error', (err) => {
    console.log(err);
    reject(err);
  });

  objectsStream.on('end', () => {
    minioClient.removeObjects(BUCKET_NAME, objectsList, (err) => {
      if (err) {
        rejcet('Unable to remove Objects ', e);
      }
      minioClient.removeBucket(BUCKET_NAME)
        .then(resolve('Removed the objects successfully'));
    });
  });
});
