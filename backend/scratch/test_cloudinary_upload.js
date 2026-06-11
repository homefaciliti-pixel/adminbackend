const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// We will simulate a multipart form request to upload a dummy file.
const uploadRouter = require('../routes/upload');
const partnerRouter = require('../routes/partner');

// Create the uploads folder locally if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Let's create a dummy file to upload
const dummyFile = path.join(__dirname, 'dummy.png');
fs.writeFileSync(dummyFile, 'dummy content');

const app = express();
app.use('/uploads', express.static(uploadsDir));
app.use('/api/upload', uploadRouter);
app.use('/api', partnerRouter);

const server = http.createServer(app);

// Let's start the local server on an ephemeral port
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`Test server listening on port ${port}`);

  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'dummy.png';
    
    let payload = '';
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`;
    payload += `Content-Type: image/png\r\n\r\n`;
    payload += `dummy file data\r\n`;
    payload += `--${boundary}--\r\n`;

    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("Upload response status:", res.statusCode);
        console.log("Upload response body:", data);
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log("✅ Success! Local upload fallback works correctly.");
            console.log("Uploaded URL:", parsed.data.url);
            
            const uploadedFilePath = path.join(uploadsDir, parsed.data.filename);
            if (fs.existsSync(uploadedFilePath)) {
              console.log("✅ File successfully saved to local disk:", uploadedFilePath);
              fs.unlinkSync(uploadedFilePath);
            } else {
              console.error("❌ File was not saved to local uploads folder!");
            }
          } else {
            console.error("❌ Upload failed!");
          }
        } catch (e) {
          console.error("❌ Failed to parse response JSON:", e);
        }

        // Clean up dummy file and close server
        if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
        server.close();
      });
    });

    req.on('error', (e) => {
      console.error("Request error:", e);
      if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
      server.close();
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error("Test error:", err);
    if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
    server.close();
  }
});
