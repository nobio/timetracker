const Minio = require('minio');

exports.dumpModel = async (bucketName, fileName) => {
  const bucket = bucketName.toLowerCase();
  // Instantiate the minio client with the endpoint
  // and access keys as shown below.
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    autoDeleteObjects: true,
  });

  try {
  // Make a bucket called europetrip.
    const bucketExists = await minioClient.bucketExists(bucket);
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
    const objInfo = await minioClient.fPutObject(bucket, fileName.split('/')[2], fileName, metaData);
    console.log(`${bucketName} uploaded successfully ${JSON.stringify(objInfo)}`);
    return;
  } catch (error) {
    console.error(error);
    // throw error;
  }
};
