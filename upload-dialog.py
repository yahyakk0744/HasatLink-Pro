import time
import sys
from pywinauto import Desktop, Application

time.sleep(3)  # Wait for file dialog

try:
    # Find the Open dialog
    dlg = Desktop(backend="uia").window(title_re=".*Open.*|.*Aç.*|.*Choose.*")
    dlg.wait('visible', timeout=5)
    print(f"Found dialog: {dlg.window_text()}")

    # Find the filename/address edit box and type the path
    # Try the filename combo box first
    try:
        filename_edit = dlg.child_window(title="File name:", control_type="Edit")
    except:
        try:
            filename_edit = dlg.child_window(title="Dosya adı:", control_type="Edit")
        except:
            filename_edit = dlg.child_window(control_type="Edit", found_index=0)

    # Type directory path first
    filename_edit.set_text(r"C:\Users\Mega\Desktop\HasatLink-Pro\store-assets\screenshots-resized")
    time.sleep(0.3)
    filename_edit.type_keys("{ENTER}")
    time.sleep(1.5)

    # Now select all files
    # Type all filenames with quotes for multi-select
    files = '"01-homepage.png" "02-categories.png" "03-market.png" "04-hal-prices.png" "05-ai-diagnosis.png" "06-map.png" "07-login.png"'

    try:
        filename_edit = dlg.child_window(title="File name:", control_type="Edit")
    except:
        try:
            filename_edit = dlg.child_window(title="Dosya adı:", control_type="Edit")
        except:
            filename_edit = dlg.child_window(control_type="Edit", found_index=0)

    filename_edit.set_text(files)
    time.sleep(0.3)

    # Click Open button
    try:
        open_btn = dlg.child_window(title="Open", control_type="Button")
    except:
        try:
            open_btn = dlg.child_window(title="Aç", control_type="Button")
        except:
            open_btn = dlg.child_window(title_re="Open|Aç", control_type="Button")

    open_btn.click()
    print("Files selected and dialog closed!")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
