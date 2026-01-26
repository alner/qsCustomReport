const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');
const randomstring = require('randomstring');

const BUILD_DIR = './build';
const CWD = process.cwd();
const HOST = 'https://parana.rbcgrp.com:4242';
const X_QLIK_USER = 'UserDirectory=RBCGRP; UserId=nerush'; //'UserDirectory=Internal; UserId=sa_repository'; // process.env.QlikUser
const XRF_KEY =randomstring.generate({
  length: 16,
  charset: 'alphanumeric',
});
const QEXT = JSON.parse(fs.readFileSync('./cl-customreport.qext'));
const ZIP_FILE = process.env.NODE_ENV == 'production' 
  ? 'customreport_latest.zip'
  : 'customreport_dev.zip'
  ;

const HEADERS = {
  'x-Qlik-Xrfkey': XRF_KEY,
  'x-Qlik-User': X_QLIK_USER,
};

const agent = new https.Agent({
  rejectUnauthorized: false,
  key: fs.readFileSync(path.resolve(CWD, 'deploy/certificates/client_key.pem')),
  cert: fs.readFileSync(path.resolve(CWD, 'deploy/certificates/client.pem')),
  // pfx: fs.readFileSync(path.resolve(CWD, 'deploy/certificates/client.pfx')),
  // passphrase: '1234567890',
  //ca: fs.readFileSync(path.resolve(CWD, 'deploy/certificates/root.pem')),      
});

if (require.main === module) {
  // Module called directly: node deploy.js
  (async () => {
    try {
      console.log(`Uploading ${QEXT.name}...`);
      
      // Delete the extension
      const delete_res = await fetch(`${HOST}/qrs/extension/name/${QEXT.name.toLowerCase()}?Xrfkey=${XRF_KEY}`, {
        method: 'DELETE',
        headers: HEADERS,
        agent,
      });    

      console.log('DELETE', delete_res.status, delete_res.statusText);

      // Upload extension (zip file)
      const stream = fs.createReadStream(path.join(CWD, BUILD_DIR, ZIP_FILE));
      const res = await fetch(`${HOST}/qrs/extension/upload?Xrfkey=${XRF_KEY}`, {
        method: 'POST',
        headers: {
          ... HEADERS,
          'Content-Type': 'application/vnd.qlik.sense.app',
          //'Content-Encoding': null,
        },
        body: stream,
        agent,
      });

      console.log('UPLOAD', res.status, res.statusText);

    } catch(e) {
      console.error(e);
    }
  })();
}

async function uploadExtensionFile(extensionName, localFilePath, extensionFilePath, overwrite = true) {
  if(!fs.existsSync(localFilePath))
    return;

  const stream = fs.createReadStream(localFilePath);
  const res = await fetch(`${HOST}/qrs/extension/${extensionName}/uploadfile?Xrfkey=${XRF_KEY}&externalpath=${extensionFilePath}&overwrite=${overwrite}`, {
    method: 'POST',
    headers: {
      ... HEADERS,
      'Content-Type': 'application/vnd.qlik.sense.app',
      //'Content-Encoding': null,
    },
    body: stream,
    agent,
  });
  //stream.close();

  return res;
}

module.exports = {
  uploadExtensionFile,
};