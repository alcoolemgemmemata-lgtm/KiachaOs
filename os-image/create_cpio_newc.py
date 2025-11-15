#!/usr/bin/env python3
"""
create_cpio_newc.py - Minimal CPIO newc (SVR4 portable ASCII) packer.
Usage: create_cpio_newc.py <source_dir> <output.cpio.gz>

Packs a directory tree into CPIO newc format and gzips it.
Supports regular files and directories. Does not support device nodes.
"""
import os, sys, stat, time, gzip, struct

def pad4(n):
    """Calculate padding to next 4-byte boundary."""
    return (4 - (n % 4)) % 4

def newc_header(name, st, namesize):
    """Generate CPIO newc (SVR4) header for a file/directory."""
    fields = [
        '070701',  # magic
        '%08X' % (st.st_ino & 0xffffffff),
        '%08X' % (st.st_mode & 0xffffffff),
        '%08X' % (st.st_uid & 0xffffffff),
        '%08X' % (st.st_gid & 0xffffffff),
        '%08X' % (st.st_nlink & 0xffffffff),
        '%08X' % (int(st.st_mtime) & 0xffffffff),
        '%08X' % (st.st_size & 0xffffffff),
        '%08X' % 0,  # devmajor
        '%08X' % 0,  # devminor
        '%08X' % 0,  # rdevmajor
        '%08X' % 0,  # rdevminor
        '%08X' % namesize,
        '%08X' % 0,  # check
    ]
    return ''.join(fields)

def write_entry(fout, relpath, fullpath):
    """Write a single file/directory entry to cpio stream."""
    st = os.lstat(fullpath)
    name = relpath
    if name.startswith('./'):
        name = name[2:]
    namesz = len(name.encode('utf-8')) + 1
    
    hdr = newc_header(name, st, namesz)
    fout.write(hdr.encode('ascii'))
    fout.write(name.encode('utf-8') + b'\x00')
    fout.write(b'\x00' * pad4(6 + len(name)))
    
    # Write file data for regular files
    if stat.S_ISREG(st.st_mode):
        with open(fullpath, 'rb') as rf:
            data = rf.read()
            fout.write(data)
            fout.write(b'\x00' * pad4(len(data)))

def pack(srcdir, outpath):
    """Pack srcdir into CPIO newc format, then gzip."""
    entries = []
    
    for root, dirs, files in os.walk(srcdir):
        # Get relative path
        relroot = os.path.relpath(root, srcdir)
        if relroot == '.':
            relroot = ''
        
        # Add directory entries
        for d in sorted(dirs):
            reldir = os.path.join(relroot, d) if relroot else d
            fulldir = os.path.join(root, d)
            entries.append((reldir.replace('\\', '/'), fulldir))
        
        # Add file entries
        for f in sorted(files):
            relfile = os.path.join(relroot, f) if relroot else f
            fullfile = os.path.join(root, f)
            entries.append((relfile.replace('\\', '/'), fullfile))
    
    # Write cpio stream
    with gzip.open(outpath, 'wb') as gz:
        for relpath, fullpath in entries:
            write_entry(gz, relpath, fullpath)
        
        # Write trailer (final entry with name 'TRAILER!!!')
        class FakeStat:
            st_ino = 0
            st_mode = 0
            st_uid = 0
            st_gid = 0
            st_nlink = 1
            st_mtime = int(time.time())
            st_size = 0
        
        write_entry(gz, 'TRAILER!!!', '/dev/null')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: create_cpio_newc.py <srcdir> <out.cpio.gz>')
        sys.exit(2)
    
    src = sys.argv[1]
    out = sys.argv[2]
    
    if not os.path.isdir(src):
        print(f'ERROR: Source directory not found: {src}')
        sys.exit(1)
    
    try:
        pack(src, out)
        size = os.path.getsize(out)
        print(f'✓ Wrote {out} ({size} bytes)')
    except Exception as e:
        print(f'ERROR: {e}')
        sys.exit(1)
