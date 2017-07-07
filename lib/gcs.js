const storage = require('@google-cloud/storage');
const { PRIVATE_KEY, CLIENT_EMAIL } = require('../config/gCloud.js');
const gcs = storage({
  credentials: {
    'private_key': PRIVATE_KEY,
    'client_email': CLIENT_EMAIL,
  }
});
const bucketName = 'circle-5ebdc.appspot.com';
const bucket = gcs.bucket(bucketName);

function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

exports.uploadToGcs = (req, res, next) => {
  if(!req.file) return next();
  const fileName = req.body.fileName;
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