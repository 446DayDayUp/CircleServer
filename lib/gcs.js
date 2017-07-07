const storage = require('@google-cloud/storage');
const gcs = storage({
  projectId: 'circle-5ebdc'
  keyFilename: `${__dirname}../cnofig/gcs_keyfile.json`,
});
const bucketName = 'circle-5ebdc.appspot.com';
const bucket = gcs.bucket(bucketName);

exports.uploadToGcs = (req, res, next) => {
  if(!req.file) return next();
  const fileName = req.file.originalname;
  const file = bucket.file(fileName);
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = fileName;
    req.file.cloudStoragePublicUrl = getPublicUrl(fileName);
    next();
  });

  stream.end(req.file.buffer);
}