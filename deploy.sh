#!/bin/bash
set -e

# 1. Build
npm run build

# 2. Deploy via FTP
python3 << 'PYEOF'
import os, hashlib
from ftplib import FTP
from pathlib import Path

FTP_HOST = "82.98.169.203"
FTP_USER = "tempo2mobilemolotov"
FTP_PASS = "Lnja1O0;#93]"
REMOTE_ROOT = "/www"
LOCAL_DIST = "dist"
LOCAL_API = "api"

def hash_file(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def ensure_dir(ftp, path):
    parts = path.strip("/").split("/")
    current = ""
    for p in parts:
        current += "/" + p
        try:
            ftp.cwd(current)
        except:
            ftp.mkd(current)
            ftp.cwd(current)

def walk_upload(ftp, local_dir, remote_dir):
    local_path = Path(local_dir)
    for f in local_path.rglob("*"):
        if f.is_file():
            rel = f.relative_to(local_path).as_posix()
            rem = remote_dir + "/" + rel
            rem_dir = os.path.dirname(rem)
            ensure_dir(ftp, rem_dir)
            with open(f, "rb") as fh:
                ftp.storbinary(f"STOR {rem}", fh)
            print(f"  ↑ {rel}")

def clean_remote(ftp, remote_dir, local_dir):
    local_path = Path(local_dir)
    local_files = set()
    for f in local_path.rglob("*"):
        if f.is_file():
            local_files.add(f.relative_to(local_path).as_posix())

    remote_files = set()
    try:
        ftp.cwd(remote_dir)
        for item in ftp.nlst():
            if item in (".", ".."): continue
            remote_files.add(item)
    except:
        return

    for f in remote_files:
        if f not in local_files:
            try:
                ftp.delete(remote_dir + "/" + f)
                print(f"  ✗ {f} (deleted)")
            except:
                print(f"  ✗ {f} (delete failed)")

print("Conectando...")
ftp = FTP(FTP_HOST)
ftp.login(FTP_USER, FTP_PASS)

print("Subiendo API...")
walk_upload(ftp, LOCAL_API, REMOTE_ROOT + "/api")

print("Subiendo dist...")
walk_upload(ftp, LOCAL_DIST, REMOTE_ROOT)

print("Limpiando archivos viejos...")
clean_remote(ftp, REMOTE_ROOT, LOCAL_DIST)

ftp.quit()
print("Deploy completado ✅")
PYEOF

echo "https://tempo2mobile.molotov.es/"
