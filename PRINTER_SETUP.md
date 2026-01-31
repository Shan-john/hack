# 🖨️ Printer Setup Quick Reference

## Finding Your Printer IP Address

### Method 1: Printer Display Panel

1. Go to printer's menu/settings
2. Look for "Network Settings" or "TCP/IP"
3. Note the IP address (e.g., 192.168.1.100)

### Method 2: Windows Settings

1. Open **Settings** → **Devices** → **Printers & scanners**
2. Click on your printer
3. Click **Manage** → **Printer properties**
4. Look for IP address in the details

### Method 3: Router Admin Panel

1. Open router admin page (usually 192.168.1.1)
2. Look for "Connected Devices" or "DHCP Clients"
3. Find your printer in the list
4. Note its IP address

### Method 4: Print Configuration Page

1. Most printers can print a configuration page
2. Check printer manual for button combination
3. Usually: Hold "Info" or "Settings" button
4. Configuration page will show network details

## Testing Printer Connection

### Using Telnet (Windows)

```powershell
# Enable Telnet Client first (if not enabled)
# Settings → Apps → Optional Features → Add Telnet Client

# Test connection
telnet 192.168.1.100 9100
```

**Expected Result:**

- Connection succeeds: Blank screen (printer is ready!)
- Connection fails: "Could not open connection" (check IP/network)

### Using PowerShell

```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 9100
```

**Expected Output:**

```
TcpTestSucceeded : True
```

## Printer Requirements

### ✅ Must Have:

- Network connectivity (WiFi or Ethernet)
- Port 9100 enabled (usually default)
- Raw TCP/IP printing support

### ✅ Compatible Printers:

Most modern network printers support raw TCP/IP printing:

- HP LaserJet series
- Canon imageRUNNER series
- Epson WorkForce series
- Brother HL/MFC series
- Xerox WorkCentre series

### ❌ Not Compatible:

- USB-only printers (no network)
- Printers with Port 9100 disabled
- Very old printers without TCP/IP support

## Configuring Printer IP in Dashboard

### Step-by-Step:

1. Open Shopowner Dashboard
2. Click **⚙️ Settings** button (top right)
3. Enter printer IP address (e.g., 192.168.1.100)
4. Port 9100 is fixed (no need to change)
5. Click **Save Settings**
6. Test with a print job

## Common Printer IP Ranges

- **Home Networks:** 192.168.1.x or 192.168.0.x
- **Office Networks:** 10.0.x.x or 172.16.x.x
- **Default Gateway:** Usually .1 (e.g., 192.168.1.1)
- **Printers:** Usually .100 to .254

## Troubleshooting

### Problem: Can't find printer IP

**Solution:**

- Check printer display panel
- Print configuration page
- Check router's connected devices list
- Use printer manufacturer's software

### Problem: Connection refused on Port 9100

**Solution:**

- Verify printer supports raw TCP/IP printing
- Check if Port 9100 is enabled in printer settings
- Ensure printer is on same network
- Check firewall settings

### Problem: Printer prints garbage characters

**Solution:**

- File format may not be compatible
- Try printing a simple text file first
- Check printer supports the file type (PDF, etc.)
- Some printers need specific drivers for PDFs

### Problem: Nothing prints

**Solution:**

- Check printer is online and ready
- Verify paper is loaded
- Check for error messages on printer
- Try printing from another application to test printer

## Static IP vs DHCP

### Recommended: Static IP

**Why?**

- IP address doesn't change
- No need to reconfigure dashboard
- More reliable for printing

**How to Set Static IP:**

1. Access printer's network settings
2. Change from DHCP to Static/Manual
3. Set IP address (e.g., 192.168.1.100)
4. Set subnet mask (usually 255.255.255.0)
5. Set gateway (usually 192.168.1.1)
6. Save settings

### Alternative: DHCP Reservation

**In Router Settings:**

1. Find printer's MAC address
2. Create DHCP reservation
3. Assign specific IP to that MAC address
4. Printer always gets same IP

## Port 9100 Explained

### What is Port 9100?

- Standard port for raw TCP/IP printing
- Also called "AppSocket" or "JetDirect"
- Bypasses print spooler
- Direct communication with printer

### Why Port 9100?

- ✅ No drivers needed
- ✅ Works across operating systems
- ✅ Faster than traditional printing
- ✅ More reliable
- ✅ Direct data transmission

### How it Works:

```
Application → TCP Socket → Port 9100 → Printer
```

No intermediate software or drivers required!

## Security Considerations

### Network Security:

- Keep printer on private network
- Don't expose Port 9100 to internet
- Use firewall to restrict access
- Consider VPN for remote printing

### Access Control:

- Implement authentication in dashboard
- Log all print jobs
- Monitor printer access
- Regular security updates

## Quick Commands Reference

### Test Printer (Windows PowerShell)

```powershell
# Test connection
Test-NetConnection -ComputerName 192.168.1.100 -Port 9100

# Find your computer's IP
ipconfig

# Ping printer
ping 192.168.1.100
```

### Test Printer (Linux/Mac)

```bash
# Test connection
nc -zv 192.168.1.100 9100

# Or use telnet
telnet 192.168.1.100 9100

# Find your computer's IP
ifconfig
```

## Printer Configuration Checklist

Before using the system:

- [ ] Printer is on the network
- [ ] Printer has IP address
- [ ] Port 9100 is accessible
- [ ] Tested connection with telnet
- [ ] IP address configured in dashboard
- [ ] Test print job successful

## Support Resources

### Manufacturer Documentation:

- HP: [hp.com/support](https://hp.com/support)
- Canon: [canon.com/support](https://canon.com/support)
- Epson: [epson.com/support](https://epson.com/support)
- Brother: [brother.com/support](https://brother.com/support)

### Common Issues:

1. **Printer not found:** Check network connection
2. **Port blocked:** Check firewall settings
3. **Wrong IP:** Verify printer IP address
4. **Printer offline:** Check printer status

---

**Need Help?**

1. Check printer manual
2. Verify network connectivity
3. Test with telnet
4. Check server logs
5. Review troubleshooting guide

---

**Quick Tip:** Most network printers have a web interface at `http://<printer-ip>` where you can view settings and status!
