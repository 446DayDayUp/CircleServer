const storage = require('@google-cloud/storage');
const gcs = storage({
  credentials: {
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXLtpE6GOWHJ2y\nJTbj0EJBgIrccWsV0iU3mwPLCRBf7WcvELDGdodHKXg76uwQHmMz20POlrd2LH1r\nGwLvQxAPlCgrdrugxtyiaFt7/BDBLBBlmOzvmKcQtCJPH6BokvsIka3WxmFqVzBy\nDajPsQwm4IFMoimk7icuVlGmMj34hG8+cSukknd1bHPPy7vLLL+b4k0kC1lV9dRT\nbqXsMlClsaRoYPY5pMkmEF+tqwCe3qHb9EBh+163iktgwfey3UWNvvCZ9xMxtfSV\nRIbGaBGcYYWrfMU9KRJs0+H0OeFOj4ifvx+MTeX2yeFj6ycAynMCZP1LPIWwQ288\nV28szObNAgMBAAECggEAFbjpKrp7SJ/O9sBLHTuYsYGvMhJn0QhTSaSPzHX+cNIT\nH9uVksaIFGz8dhuAlKZRGavZF89nB+dHlAKbDtbDcYGXrfsO5YB9RiaZcnyaya6z\nom1xKdH0uz0uqtDAAxaPVEFeSXxSle12LAUTatglB1b9rQ2lzyla3tkPPUJ9zf28\n1xGbzSremSQ2DUw4+7AIOqkDETpDfA7219knIcnlMXhb0q+mTeak/0yMzOnnIWnP\nQe7BGChkgbHDf3ANG8O4s2I13GwYswHiB4wTedy7nruGNMybZqQ+lHzSgZh1Izf7\nXTK5fIjm0mxA8IdNWUefC4nqVYALvt8323cNo3CeYQKBgQDGG4NKaddDEWS4sy8Y\n7rQ1vp3yQMK/GnCICpq0uPm6YOvCy4mwjg/nsjzmQCM+HK4LsgN26MJt6/HQ5AxF\nJE6w54nn7xZGHJHOlj5rGRUUiO0SWUMztPoahB4wWidD22dHFQG2MKsE5vvPH/Gn\nsBrXDk70yA9g59/OBk6fT+Oc0QKBgQDDXOfLKQPFdOeM9nZExZRdseX1O03NibW/\nJtvTpm+ZWCfI7R9zvHA/95xIjD7N2anVOsFHNnCIO/14bdnhmB4ZI5DSYurGckCL\nJRF4q2bgN/nNEWrybkxS10k09+hEGOG+/QPjF1xgFLy673WXtnH4Dm5BnpxQwkXz\nGtm8bMY5PQKBgBSBxJVvX1kR89sqsTVjgEQP90mcaoxdsEhk0J7khvVEEyOW7inY\niszxJlyvRvanAV00kCc+8OFwCxgUgzClEYA+d4gKt8OKMY2w/8UWU5hMlD3R/6La\nmQklo/pdWrMrgwVYp1S0tP9M6cQHCnzRPfYFBSdRjkX5urEY9gqHuogBAoGAAhVs\nl3shgiqkCZnbWxJsaa9rD3mJc+bDHH3SnGhLCmypR/hXfImG/PesIA324YUvzYlp\n5FONUbaqFm29hC12LLh3Y/cQH/u5+oHztMDHQR73uBs2c81/XObU7g6y2H8XcU0L\njJGEN7Yg6TGCpJKalpW40VRawHXB/zzLE7ppRtUCgYB5m5oePMUtqB/wjGfruchd\nDHizvqcKRKwHq0/NZ7Xke2ydP1iOdTEXMqgQW7GbliFAKNGlD7zFixygzorJ6hui\nWk+b2kOIwWkpdNXOw90qpfVuXpYDPYiHutl5qeGFfyt8rm4esKTcunISMHrIrs/Q\n1G76f/9hLqEJG4bWdVQsLg==\n-----END PRIVATE KEY-----\n",
    "client_email": "circle-5ebdc@appspot.gserviceaccount.com",
  }
});
const bucketName = 'circle-5ebdc.appspot.com';
const bucket = gcs.bucket(bucketName);

function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

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