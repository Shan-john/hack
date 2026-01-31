# 🖨️ Print Shop Management System

A complete print shop management solution with customer file upload and shopowner print job management.

## 📁 Project Structure

```
hack_repo/
├── customerside/          # Customer mobile/web app
│   └── phone-app/        # React app for file uploads
├── shopowner/            # Shopowner dashboard
│   └── shopowner-dashboard/  # React app for job management
└── server/               # Express backend server
    ├── server.js         # Main server file
    ├── uploads/          # Uploaded files storage
    └── uploads.json      # Job tracking database
```

## 🚀 Quick Start

### 1. Start the Server

```bash
cd server
npm install
node server.js
```

Server runs on `http://0.0.0.0:3000`

### 2. Start Customer App

```bash
cd customerside/phone-app
npm install
npm run dev
```

Customer app runs on `http://localhost:5173`

### 3. Start Shopowner Dashboard

```bash
cd shopowner/shopowner-dashboard
npm install
npm run dev
```

Dashboard runs on `http://localhost:5174`

## 🔄 Complete Workflow

### Customer Side

1. Customer opens the app on their phone/device
2. Enters their name
3. Selects files to print (PDF, images)
4. Clicks "Send" to upload to server
5. Files are saved and job is created with "pending" status

### Shopowner Side

1. Shopowner opens dashboard
2. Views all pending print jobs
3. Reviews customer details and files
4. Approves or rejects the job
5. For approved jobs, clicks "Print Now"
6. System sends files directly to printer via TCP Port 9100
7. Job status updated to "printed"

## 🖨️ TCP Raw Printing

### How It Works

- Uses `net` package for TCP socket connections
- Connects directly to printer on Port 9100
- Bypasses Windows Print Spooler
- Sends raw file data to printer
- Works with most network printers

### Printer Setup

1. Ensure printer is on the network
2. Enable Port 9100 (usually enabled by default)
3. Note the printer's IP address
4. Configure in shopowner dashboard settings

### Testing Printer Connection

```bash
telnet <printer-ip> 9100
```

If connection succeeds, printer is ready for raw printing.

## 📊 Job Status Flow

```
Customer Upload → PENDING → Shopowner Approves → APPROVED → Print → PRINTED
                      ↓
                  Shopowner Rejects → REJECTED
```

## 🛠️ Technical Stack

### Frontend (Both Apps)

- React 19
- Vite
- Inline CSS with modern design

### Backend

- Node.js + Express
- Multer (file uploads)
- net (TCP printing)
- CORS enabled
- JSON file database

## 📡 API Endpoints

### Customer Endpoints

- `POST /print` - Upload files and create print job
- `GET /uploads` - Get upload history

### Shopowner Endpoints

- `GET /uploads` - Get all print jobs
- `POST /approve-job` - Approve a job
- `POST /update-status` - Update job status
- `POST /print-job` - Print job via TCP
- `GET /printer-config` - Get printer settings
- `POST /update-printer-ip` - Update printer IP

## 🎨 Features

### Customer App

✅ Beautiful splash screen  
✅ File upload with preview  
✅ Multiple file support  
✅ Upload history  
✅ Real-time status updates  
✅ Mobile-optimized UI

### Shopowner Dashboard

✅ Real-time job monitoring  
✅ Auto-refresh (5 seconds)  
✅ Status filtering  
✅ Approve/Reject workflow  
✅ TCP raw printing  
✅ Printer configuration  
✅ Premium glassmorphism design

## 🔧 Configuration

### Server Configuration

Edit `server/server.js`:

```javascript
const PRINTER_IP = "192.168.1.100"; // Your printer IP
const PRINTER_PORT = 9100; // Raw printing port
```

### Network Setup

- All devices must be on the same network
- Server must be accessible from customer devices
- Printer must be accessible from server

## 📱 Accessing from Phone

1. Find your computer's IP address:

   ```bash
   # Windows
   ipconfig

   # Look for IPv4 Address (e.g., 192.168.1.10)
   ```

2. On your phone, open browser and go to:

   ```
   http://<your-computer-ip>:5173
   ```

3. Upload files from your phone

## 🐛 Troubleshooting

### Server Issues

- **Port 3000 in use**: Change port in `server.js`
- **CORS errors**: Check CORS configuration
- **File upload fails**: Check `uploads/` directory permissions

### Printing Issues

- **Connection refused**: Verify printer IP and Port 9100
- **Nothing prints**: Check printer supports raw TCP printing
- **Partial prints**: Check file format compatibility

### Frontend Issues

- **Can't connect to server**: Verify server is running
- **Jobs not updating**: Check network connectivity
- **Blank screen**: Check browser console for errors

## 🔒 Security Notes

⚠️ **This is a local network application**

For production deployment:

- Add user authentication
- Implement HTTPS
- Validate all inputs
- Add rate limiting
- Implement access controls
- Use a proper database (MongoDB, PostgreSQL)
- Add logging and monitoring

## 📝 Data Storage

### uploads.json Structure

```json
{
  "uploads": [
    {
      "jobId": "JOB_1234567890_abc123",
      "username": "John Doe",
      "userId": "123456",
      "timestamp": "2026-01-31T10:00:00.000Z",
      "status": "pending",
      "fileCount": 2,
      "files": [
        {
          "originalName": "document.pdf",
          "savedName": "123456_1234567890_document.pdf",
          "size": 102400,
          "mimeType": "application/pdf",
          "uploadedAt": "2026-01-31T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

## 🎯 Future Enhancements

- [ ] User authentication
- [ ] Payment integration
- [ ] Print queue management
- [ ] Print history analytics
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Multiple printer support
- [ ] Print preview
- [ ] Cost calculation
- [ ] Database migration (MongoDB/PostgreSQL)

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

## 📞 Support

For issues:

1. Check server logs
2. Check browser console
3. Verify network connectivity
4. Test printer with telnet

---

**Built with ❤️ for efficient print shop management**
