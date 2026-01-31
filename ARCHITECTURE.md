# 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRINT SHOP MANAGEMENT SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│   CUSTOMER SIDE      │         │   SERVER BACKEND     │         │  SHOPOWNER SIDE      │
│   (Phone/Web App)    │         │   (Express.js)       │         │  (Dashboard)         │
├──────────────────────┤         ├──────────────────────┤         ├──────────────────────┤
│                      │         │                      │         │                      │
│  📱 React App        │         │  🚀 Node.js Server   │         │  💻 React App        │
│  Port: 5173          │         │  Port: 3000          │         │  Port: 5174          │
│                      │         │                      │         │                      │
│  Features:           │         │  Features:           │         │  Features:           │
│  • File Upload       │◄────────┤  • File Storage      ├────────►│  • Job Monitoring    │
│  • Preview           │  POST   │  • Job Tracking      │  GET    │  • Approve/Reject    │
│  • History           │  /print │  • Status Mgmt       │  /uploads│  • Print Control     │
│  • Status View       │         │  • TCP Printing      │         │  • Printer Config    │
│                      │         │                      │         │                      │
└──────────────────────┘         └──────────────────────┘         └──────────────────────┘
         │                                  │                                  │
         │                                  │                                  │
         ▼                                  ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│  User Actions:       │         │  Storage:            │         │  User Actions:       │
│  1. Enter name       │         │  • uploads/          │         │  1. View jobs        │
│  2. Select files     │         │  • uploads.json      │         │  2. Filter status    │
│  3. Click Send       │         │                      │         │  3. Approve job      │
│  4. View history     │         │  Database Schema:    │         │  4. Click Print      │
└──────────────────────┘         │  {                   │         └──────────────────────┘
                                 │    jobId,            │
                                 │    username,         │
                                 │    userId,           │
                                 │    timestamp,        │
                                 │    status,           │         ┌──────────────────────┐
                                 │    files[]           │         │  TCP PRINTING        │
                                 │  }                   │         │  (Port 9100)         │
                                 └──────────────────────┘         ├──────────────────────┤
                                                                  │                      │
                                                                  │  net.Socket()        │
                                                                  │  connect(9100)       │
                                                                  │  write(fileData)     │
                                                                  │  end()               │
                                                                  │                      │
                                                                  └──────────┬───────────┘
                                                                             │
                                                                             ▼
                                                                  ┌──────────────────────┐
                                                                  │  🖨️ NETWORK PRINTER  │
                                                                  │  IP: 192.168.1.100   │
                                                                  │  Port: 9100          │
                                                                  └──────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                              JOB STATUS WORKFLOW

┌─────────┐      ┌──────────┐      ┌─────────┐      ┌─────────┐
│ PENDING │─────►│ APPROVED │─────►│ PRINTED │      │REJECTED │
└─────────┘      └──────────┘      └─────────┘      └─────────┘
    │                  │                                  ▲
    │                  │                                  │
    └──────────────────┴──────────────────────────────────┘
           (Shopowner can reject at any time)

═══════════════════════════════════════════════════════════════════════════════════════

                              API ENDPOINTS

┌─────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER ENDPOINTS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST   /print          → Upload files and create job                       │
│  GET    /uploads        → Get upload history                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SHOPOWNER ENDPOINTS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET    /uploads            → Get all jobs                                  │
│  POST   /approve-job        → Approve a job                                 │
│  POST   /update-status      → Update job status                             │
│  POST   /print-job          → Print via TCP (Port 9100)                     │
│  GET    /printer-config     → Get printer settings                          │
│  POST   /update-printer-ip  → Update printer IP                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                          DATA FLOW SEQUENCE

1. CUSTOMER UPLOADS FILE
   ┌─────────────────────────────────────────────────────────────┐
   │ Customer App → POST /print → Server                         │
   │ • FormData with files                                       │
   │ • Username and User ID                                      │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Server Processing                                           │
   │ • Save files to uploads/                                    │
   │ • Generate unique jobId                                     │
   │ • Create job record with status: "pending"                  │
   │ • Save to uploads.json                                      │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Response to Customer                                        │
   │ • Success message                                           │
   │ • Job details                                               │
   └─────────────────────────────────────────────────────────────┘

2. SHOPOWNER APPROVES JOB
   ┌─────────────────────────────────────────────────────────────┐
   │ Dashboard → GET /uploads → Server                           │
   │ • Fetch all jobs                                            │
   │ • Display in dashboard                                      │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Dashboard → POST /approve-job → Server                      │
   │ • Send jobId                                                │
   │ • Server updates status to "approved"                       │
   │ • Add approvedAt timestamp                                  │
   └─────────────────────────────────────────────────────────────┘

3. SHOPOWNER PRINTS JOB
   ┌─────────────────────────────────────────────────────────────┐
   │ Dashboard → POST /print-job → Server                        │
   │ • Send jobId and printerIp                                  │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Server TCP Printing                                         │
   │ • Create TCP socket                                         │
   │ • Connect to printer (IP:9100)                              │
   │ • Read file from uploads/                                   │
   │ • Send raw file data                                        │
   │ • Send form feed (\x0C)                                     │
   │ • Close connection                                          │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Server Updates Job                                          │
   │ • Update status to "printed"                                │
   │ • Add printedAt timestamp                                   │
   │ • Add printerIp                                             │
   │ • Save to uploads.json                                      │
   └─────────────────────────────────────────────────────────────┘
                              ↓
   ┌─────────────────────────────────────────────────────────────┐
   │ Printer Outputs                                             │
   │ • Receives raw file data                                    │
   │ • Processes and prints                                      │
   │ • Ejects page                                               │
   └─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                          FILE STRUCTURE

hack_repo/
├── customerside/
│   └── phone-app/
│       ├── src/
│       │   ├── App.jsx          ← Customer UI
│       │   ├── index.css        ← Styles
│       │   └── main.jsx         ← Entry point
│       ├── package.json
│       └── vite.config.js
│
├── shopowner/
│   └── shopowner-dashboard/
│       ├── src/
│       │   ├── App.jsx          ← Shopowner UI
│       │   ├── index.css        ← Styles + Animations
│       │   └── main.jsx         ← Entry point
│       ├── package.json
│       └── vite.config.js
│
├── server/
│   ├── server.js                ← Express server
│   ├── uploads/                 ← Uploaded files
│   ├── uploads.json             ← Job database
│   ├── package.json
│   └── node_modules/
│       └── net/                 ← TCP socket package
│
├── README.md                    ← Main documentation
├── IMPLEMENTATION_SUMMARY.md   ← This implementation
├── TESTING.md                   ← Testing guide
└── PRINTER_SETUP.md            ← Printer setup guide

═══════════════════════════════════════════════════════════════════════════════════════

                          TECHNOLOGY STACK

┌──────────────────────┬──────────────────────┬──────────────────────┐
│   FRONTEND           │   BACKEND            │   PRINTING           │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ • React 19           │ • Node.js            │ • net package        │
│ • Vite               │ • Express.js         │ • TCP Socket         │
│ • JavaScript         │ • Multer             │ • Port 9100          │
│ • Inline CSS         │ • CORS               │ • Raw printing       │
│ • Fetch API          │ • body-parser        │                      │
│ • React Hooks        │ • fs (File System)   │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                          NETWORK TOPOLOGY

                    ┌─────────────────────┐
                    │   WiFi Router       │
                    │   192.168.1.1       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────────┐  ┌───▼──────────┐  ┌─▼──────────────┐
    │  Customer Phone  │  │   Server PC  │  │ Network Printer│
    │  192.168.1.50    │  │ 192.168.1.10 │  │ 192.168.1.100  │
    │                  │  │              │  │                │
    │  Port: 5173      │  │ Port: 3000   │  │ Port: 9100     │
    └──────────────────┘  └──────────────┘  └────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Shopowner Laptop   │
                    │  192.168.1.20       │
                    │                     │
                    │  Port: 5174         │
                    └─────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                          SECURITY LAYERS

┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT (Local Network)                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ CORS enabled                                                             │
│  ✓ File type validation                                                     │
│  ✓ File size limits                                                         │
│  ✓ Local network only                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  RECOMMENDED FOR PRODUCTION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  • User authentication (JWT)                                                │
│  • HTTPS/TLS encryption                                                     │
│  • Rate limiting                                                            │
│  • Input validation                                                         │
│  • SQL injection prevention                                                 │
│  • XSS protection                                                           │
│  • CSRF tokens                                                              │
│  • Access control lists                                                     │
│  • Audit logging                                                            │
│  • Database encryption                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════
```

## Key Components Explained

### 1. Customer App (React)

- **Purpose:** Allow customers to upload files for printing
- **Port:** 5173
- **Key Features:** File selection, preview, upload, history

### 2. Shopowner Dashboard (React)

- **Purpose:** Manage print jobs and control printer
- **Port:** 5174
- **Key Features:** Job approval, status tracking, printing

### 3. Server (Express)

- **Purpose:** Handle file uploads, job management, printing
- **Port:** 3000
- **Key Features:** File storage, TCP printing, job tracking

### 4. Network Printer

- **Purpose:** Physical printing device
- **Port:** 9100 (Raw TCP/IP)
- **Protocol:** AppSocket/JetDirect

## Communication Protocols

### HTTP (Customer ↔ Server ↔ Shopowner)

- RESTful API
- JSON data format
- FormData for file uploads
- CORS enabled

### TCP (Server ↔ Printer)

- Raw socket connection
- Port 9100
- Binary data transmission
- No protocol overhead

## Data Persistence

### uploads.json

- JSON file database
- Stores all job records
- Includes file metadata
- Tracks job status

### uploads/

- File system storage
- Original files preserved
- Unique filenames
- Organized by user ID

---

**This architecture provides a complete, working print shop management system with modern web technologies and direct printer communication!**
