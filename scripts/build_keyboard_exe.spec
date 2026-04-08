# PyInstaller spec for keyboard_input.exe

import sys
from PyInstaller.utils.icons import collect_all_icon_files

a = Analysis(
    ['keyboard_input.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['keyboard'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

# onefile mode: single executable
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='keyboard_input',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # True for debugging, can be False later
    disable_windowed_traceback=False,
    argv_emulation=False,
    target='pefile',
    codesign_identity=None,
    entitlements_file=None,
)
