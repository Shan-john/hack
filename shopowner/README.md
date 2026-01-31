# 🖨️ Shopowner Dashboard

## Overview

The Shopowner Dashboard is a web-based interface for managing print jobs submitted by customers. It provides real-time job monitoring, approval/rejection workflows, and direct TCP raw printing to network printers via Port 9100.

## Features

### ✨ Core Functionality

- **Real-time Job Monitoring**: Auto-refreshes every 5 seconds to show new print jobs
- **Job Status Management**: Track jobs through their lifecycle (pending → approved → printed/rejected)
- **Approve/Reject Workflow**: Review and approve or reject customer print requests
- **TCP Raw Printing**: Direct printing to network printers via Port 9100 (bypassing Windows Print Spooler)
- **Printer Configuration**: Dynamic printer IP address configuration
- **Status Filtering**: Filter jobs by status (all, pending, approved, printed, rejected)

### 🎨 UI/UX Features

- **Premium Design**: Modern glassmorphism design with gradient backgrounds
- **Splash Screen**: Professional loading animation
- **Status Badges**: Color-coded status indicators for quick visual feedback
- **Responsive Layout**: Works on desktop and tablet devices
- **Real-time Updates**: Live status notifications for all actions

## Technical Stack

- **Frontend**: React 19 + Vite
- **Styling**: Inline CSS with modern design patterns
- **Backend Integration**: REST API calls to Express server
- **Printing**: TCP Socket connection via `net` package (Port 9100)

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- Network printer with Port 9100 enabled
- Server running (see `/server` directory)

### Installation

```bash
cd shopowner/shopowner-dashboard
npm install
```

### Running the Dashboard

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173` (or the port shown in terminal).

## Configuration

### Printer Setup

1. Click the **⚙️ Settings** button in the dashboard header
2. Enter your printer's IP address (e.g., `192.168.1.100`)
3. Port 9100 is used by default (standard for raw TCP printing)
4. Click **Save Settings**

### Network Requirements

- Ensure the printer is on the same network
- Port 9100 must be open and accessible
- Printer must support raw TCP/IP printing (most modern network printers do)

## Usage Workflow

### 1. View Print Jobs

- Dashboard displays all submitted print jobs
- Jobs are sorted by submission time (newest first)
- Each job card shows:
  - Customer name and ID
  - Job ID and timestamp
  - File count and details
  - Current status

### 2. Filter Jobs

Use the filter tabs to view specific job types:

- **All**: Show all jobs
- **Pending**: Jobs awaiting approval
- **Approved**: Jobs ready to print
- **Printed**: Completed jobs
- **Rejected**: Declined jobs

### 3. Approve/Reject Jobs

For pending jobs:

1. Review the customer details and files
2. Click **✓ Approve** to approve the job
3. Click **✗ Reject** to decline the job

### 4. Print Jobs

For approved jobs:

1. Ensure printer is configured correctly
2. Click **🖨️ Print Now**
3. System will:
   - Connect to printer via TCP Port 9100
   - Send file content directly to printer
   - Update job status to "printed"
   - Show confirmation message

## API Endpoints Used

The dashboard communicates with these server endpoints:

- `GET /uploads` - Fetch all print jobs
- `GET /printer-config` - Get current printer configuration
- `POST /approve-job` - Approve a specific job
- `POST /update-status` - Update job status (for rejection)
- `POST /print-job` - Send job to printer via TCP
- `POST /update-printer-ip` - Update printer IP address

## Print Job Status Flow

```
PENDING → APPROVED → PRINTED
   ↓
REJECTED
```

- **Pending**: Initial state when customer submits files
- **Approved**: Shopowner has approved the job
- **Printed**: Job successfully sent to printer
- **Rejected**: Shopowner declined the job

## TCP Raw Printing Details

### How It Works

1. When "Print Now" is clicked, the server:
   - Opens a TCP socket connection to the printer (Port 9100)
   - Reads the file content from disk
   - Streams the raw file data directly to the printer
   - Sends a form feed command (`\x0C`) to eject the page
   - Closes the connection

### Supported File Types

- **PDF**: Most network printers support direct PDF printing
- **Images**: JPEG, PNG (printer-dependent)
- **Text**: Plain text files

### Advantages of Raw Printing

- ✅ Bypasses Windows Print Spooler (more reliable)
- ✅ Direct communication with printer
- ✅ Works across different operating systems
- ✅ No driver installation required
- ✅ Faster processing

### Troubleshooting Printing

If printing fails:

1. Verify printer IP address is correct
2. Check printer is powered on and connected to network
3. Ensure Port 9100 is enabled on the printer
4. Test printer connectivity: `telnet <printer-ip> 9100`
5. Check server console for detailed error messages

## File Structure

```
shopowner-dashboard/
├── src/
│   ├── App.jsx          # Main dashboard component
│   ├── index.css        # Global styles and animations
│   └── main.jsx         # React entry point
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

## Customization

### Changing Colors

Edit the gradient colors in `App.jsx`:

```javascript
// Splash screen gradient
background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)";

// Main background
background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f5f3ff 100%)";
```

### Adjusting Auto-Refresh Interval

In `App.jsx`, change the interval (default: 5000ms = 5 seconds):

```javascript
const interval = setInterval(fetchJobs, 5000); // Change to desired milliseconds
```

## Security Considerations

⚠️ **Important**: This is a local network application. For production use:

- Add authentication/authorization
- Implement HTTPS
- Validate printer IP addresses
- Add rate limiting
- Implement access controls
- Log all print activities

## Browser Compatibility

Tested and working on:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

## Support

For issues or questions:

1. Check server logs for errors
2. Verify network connectivity
3. Test printer with `telnet <ip> 9100`
4. Review browser console for JavaScript errors

## License

Part of the Print Shop Management System.
