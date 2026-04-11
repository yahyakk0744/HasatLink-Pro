Add-Type -AssemblyName System.Windows.Forms

# Wait for file dialog to appear and get focus
Start-Sleep -Seconds 3

# Alt+D to focus address bar in file dialog
[System.Windows.Forms.SendKeys]::SendWait("%d")
Start-Sleep -Milliseconds 800

# Type directory path
[System.Windows.Forms.SendKeys]::SendWait("C:\Users\Mega\Desktop\HasatLink-Pro\store-assets\screenshots-resized")
Start-Sleep -Milliseconds 300

# Press Enter to navigate to directory
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Seconds 2

# Ctrl+A to select all files
[System.Windows.Forms.SendKeys]::SendWait("^a")
Start-Sleep -Milliseconds 500

# Press Enter to open/upload
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "Done - files should be uploaded"
