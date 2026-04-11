import time, sys
from pywinauto import Desktop

print("Waiting for file dialog...", flush=True)

# Poll for file dialog for 15 seconds
dlg = None
for i in range(30):
    time.sleep(0.5)
    try:
        d = Desktop(backend='uia')
        for w in d.windows():
            try:
                title = w.window_text()
                cls = w.class_name()
                if cls == '#32770' or 'Open' in title or 'Aç' in title or 'Choose' in title:
                    dlg = w
                    print(f"Found: {title} ({cls})", flush=True)
                    break
            except:
                pass
        if dlg:
            break
    except:
        pass

if not dlg:
    print("No dialog found after 15s", flush=True)
    sys.exit(1)

time.sleep(0.5)

# Find filename edit and type path
try:
    edits = dlg.descendants(control_type="Edit")
    print(f"Found {len(edits)} edit controls", flush=True)

    # The filename edit is usually the last or named one
    filename_edit = None
    for e in edits:
        try:
            name = e.window_text()
            print(f"  Edit: '{name[:50]}'", flush=True)
        except:
            pass

    # Use the first edit (usually address bar) or combo edit
    if edits:
        filename_edit = edits[-1] if len(edits) > 1 else edits[0]

    if filename_edit:
        filename_edit.set_text(r"C:\Users\Mega\Desktop\HasatLink-Pro\store-assets\screenshots-resized")
        time.sleep(0.3)
        filename_edit.type_keys("{ENTER}", with_spaces=True)
        time.sleep(2)

        # Re-find edits after navigation
        edits = dlg.descendants(control_type="Edit")
        filename_edit = edits[-1] if len(edits) > 1 else edits[0]

        files = '"01-homepage.png" "02-categories.png" "03-market.png" "04-hal-prices.png" "05-ai-diagnosis.png" "06-map.png" "07-login.png"'
        filename_edit.set_text(files)
        time.sleep(0.3)

        # Find and click Open button
        buttons = dlg.descendants(control_type="Button")
        for b in buttons:
            try:
                bt = b.window_text()
                if bt in ('Open', 'Aç', '&Open', '&Aç'):
                    print(f"Clicking: {bt}", flush=True)
                    b.click()
                    break
            except:
                pass

        print("Done!", flush=True)
    else:
        print("No edit found", flush=True)
except Exception as e:
    print(f"Error: {e}", flush=True)
