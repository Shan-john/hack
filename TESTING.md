# 🧪 Testing Guide

## Quick Testing Steps

### 1. Test Server

```bash
cd server
node server.js
```

Expected output:

```
Server running on http://0.0.0.0:3000
Upload directory: C:\Users\raj31\Atlas\hack_repo\server\uploads
Upload log: C:\Users\raj31\Atlas\hack_repo\server\uploads.json
Printer: 192.168.1.100:9100
```

### 2. Test Customer App

```bash
cd customerside/phone-app
npm run dev
```

**Test Checklist:**

- [ ] Splash screen appears for 2.5 seconds
- [ ] Can enter username
- [ ] Can select files
- [ ] Files show in preview with thumbnails
- [ ] Can remove files
- [ ] Can send files to server
- [ ] Success message appears
- [ ] Can view upload history

### 3. Test Shopowner Dashboard

```bash
cd shopowner/shopowner-dashboard
npm run dev
```

**Test Checklist:**

- [ ] Splash screen appears for 2 seconds
- [ ] Jobs load automatically
- [ ] Can see all uploaded jobs
- [ ] Filter tabs work (all, pending, approved, printed, rejected)
- [ ] Can open settings panel
- [ ] Can update printer IP
- [ ] Can approve pending jobs
- [ ] Can reject pending jobs
- [ ] Can print approved jobs
- [ ] Status updates in real-time
- [ ] Auto-refresh works (every 5 seconds)

## Testing Print Functionality

### Without Real Printer (Testing Mode)

1. **Check Job Flow:**
   - Upload files from customer app
   - Approve job in shopowner dashboard
   - Click "Print Now"
   - Check server console for connection attempt
   - Expected: Connection error (normal without printer)

2. **Verify Job Status Updates:**
   - Job should remain in "approved" state if print fails
   - Check `uploads.json` for status changes

### With Real Printer

1. **Find Printer IP:**

   ```bash
   # Windows
   # Go to: Settings > Devices > Printers & scanners
   # Click on printer > Manage > Printer properties
   # Look for IP address
   ```

2. **Test Printer Connection:**

   ```bash
   telnet <printer-ip> 9100
   ```

   - If connection succeeds, printer is ready
   - If fails, check printer network settings

3. **Update Printer IP:**
   - Open shopowner dashboard
   - Click ⚙️ Settings
   - Enter printer IP
   - Click Save

4. **Test Print:**
   - Upload a simple PDF from customer app
   - Approve in shopowner dashboard
   - Click "Print Now"
   - Check printer for output

## API Testing with cURL

### Upload a File

```bash
curl -X POST http://localhost:3000/print \
  -F "name=Test User" \
  -F "id=123456" \
  -F "files=@/path/to/test.pdf"
```

### Get All Jobs

```bash
curl http://localhost:3000/uploads
```

### Approve a Job

```bash
curl -X POST http://localhost:3000/approve-job \
  -H "Content-Type: application/json" \
  -d "{\"jobId\":\"JOB_1234567890_abc123\"}"
```

### Print a Job

```bash
curl -X POST http://localhost:3000/print-job \
  -H "Content-Type: application/json" \
  -d "{\"jobId\":\"JOB_1234567890_abc123\",\"printerIp\":\"192.168.1.100\"}"
```

### Update Printer IP

```bash
curl -X POST http://localhost:3000/update-printer-ip \
  -H "Content-Type: application/json" \
  -d "{\"printerIp\":\"192.168.1.101\"}"
```

## Testing on Mobile Device

### Setup

1. Find your computer's IP address:

   ```bash
   # Windows PowerShell
   ipconfig
   # Look for IPv4 Address under your active network adapter
   # Example: 192.168.1.10
   ```

2. Ensure phone and computer are on same WiFi network

3. On phone browser, navigate to:
   ```
   http://<your-computer-ip>:5173
   ```

### Mobile Test Checklist

- [ ] App loads correctly on mobile
- [ ] Can select files from phone gallery
- [ ] Can select PDFs from phone storage
- [ ] Touch interactions work smoothly
- [ ] Upload completes successfully
- [ ] Can view upload history

## Common Test Scenarios

### Scenario 1: Basic Upload Flow

1. Customer uploads 1 PDF file
2. Shopowner sees job as "pending"
3. Shopowner approves job
4. Job status changes to "approved"
5. Shopowner prints job
6. Job status changes to "printed"

### Scenario 2: Multiple Files

1. Customer uploads 3 files (2 images, 1 PDF)
2. Verify all files appear in shopowner dashboard
3. Approve and print
4. Verify all files are sent to printer

### Scenario 3: Rejection Flow

1. Customer uploads files
2. Shopowner rejects job
3. Job status changes to "rejected"
4. Verify job cannot be printed

### Scenario 4: Concurrent Users

1. Multiple customers upload simultaneously
2. Verify all jobs appear in dashboard
3. Verify jobs don't interfere with each other
4. Process jobs independently

## Performance Testing

### Load Test

```bash
# Upload 10 files simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3000/print \
    -F "name=User$i" \
    -F "id=$i" \
    -F "files=@test.pdf" &
done
```

### Check Server Performance

- Monitor server console for response times
- Check memory usage
- Verify all uploads are logged correctly

## Debugging Tips

### Enable Verbose Logging

Add to `server.js`:

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Check uploads.json

```bash
# View current jobs
cat server/uploads.json

# Pretty print
cat server/uploads.json | python -m json.tool
```

### Monitor Network Traffic

- Use browser DevTools > Network tab
- Check for failed requests
- Verify response payloads

### Check File Uploads

```bash
# List uploaded files
ls -lh server/uploads/

# Count files
ls server/uploads/ | wc -l
```

## Expected Behavior

### Customer App

- ✅ Smooth animations
- ✅ Instant file preview
- ✅ Clear success/error messages
- ✅ Upload completes in < 5 seconds (for typical files)

### Shopowner Dashboard

- ✅ Jobs appear within 5 seconds of upload
- ✅ Filters work instantly
- ✅ Actions complete in < 2 seconds
- ✅ No UI freezing during operations

### Server

- ✅ Handles 10+ concurrent uploads
- ✅ File storage is reliable
- ✅ JSON updates are atomic
- ✅ Print jobs queue properly

## Troubleshooting Tests

### Test Fails: "Cannot connect to server"

- Check server is running on port 3000
- Check firewall settings
- Verify CORS is enabled

### Test Fails: "Files not uploading"

- Check `uploads/` directory exists
- Verify file size limits
- Check disk space

### Test Fails: "Printer connection refused"

- Verify printer IP is correct
- Check Port 9100 is open
- Test with telnet
- Ensure printer is on network

### Test Fails: "Jobs not appearing in dashboard"

- Check `uploads.json` exists
- Verify server is writing to file
- Check file permissions
- Refresh dashboard manually

## Success Criteria

✅ **Customer App:**

- Can upload files successfully
- UI is responsive and beautiful
- Error handling works

✅ **Shopowner Dashboard:**

- All jobs visible
- Can approve/reject jobs
- Can configure printer
- Real-time updates work

✅ **Server:**

- Handles uploads reliably
- Stores files correctly
- Updates job status
- Logs all activities

✅ **Printing:**

- Connects to printer
- Sends files successfully
- Updates job status to "printed"

## Test Data

### Sample Job IDs (from uploads.json)

- Check your `server/uploads.json` for actual job IDs
- Format: `JOB_<timestamp>_<random>`

### Sample Files for Testing

- Small PDF (< 1MB)
- Large PDF (> 5MB)
- JPEG image
- PNG image
- Multiple files at once

---

**Happy Testing! 🚀**
