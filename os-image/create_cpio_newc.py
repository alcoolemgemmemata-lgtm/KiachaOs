#!/usr/bin/env python3
"""
create_cpio_newc.py
Minimal CPIO newc (SVR4 portable ASCII) packer.
Usage: create_cpio_newc.py <source_dir> <output.cpio.gz>
This implements writing newc headers (odc/newc) and gzips the result.
It supports regular files and directories. Does not support device nodes.
"""
import os, sys, stat, time, gzip, struct

def pad4(n):
    return (4 - (n % 4)) % 4

HEX= ''.join

def newc_header(name, st, namesize):
    # Fields are ascii hex, fixed widths
    fields = [
        '070701', # magic
        '%08X' % (st.st_ino & 0xffffffff),
        '%08X' % (st.st_mode & 0xffffffff),
        '%08X' % (st.st_uid & 0xffffffff),
        '%08X' % (st.st_gid & 0xffffffff),
        '%08X' % (st.st_nlink & 0xffffffff),
        '%08X' % (int(st.st_mtime) & 0xffffffff),
        '%08X' % (st.st_size & 0xffffffff),
        '%08X' % 0, # devmajor
        '%08X' % 0, # devminor
        '%08X' % 0, # rdevmajor
        '%08X' % 0, # rdevminor
        '%08X' % namesize,
        '%08X' % 0,
    ]
    return ''.join(fields)


def write_entry(fout, relpath, fullpath):
    st = os.lstat(fullpath)
    name = relpath
    if name.startswith('./'):
        name = name[2:]
    namesz = len(name.encode('utf-8')) + 1
    hdr = newc_header(name, st, namesz)
    fout.write(hdr.encode('ascii'))
    fout.write(name.encode('utf-8') + b'\x00')
    fout.write(b'\x00' * pad4(6 + len(name)))
    # write file data for regular files
    if stat.S_ISREG(st.st_mode):
        with open(fullpath, 'rb') as rf:
            while True:
                chunk = rf.read(8192)
                if not chunk:
                    break
                fout.write(chunk)
        fout.write(b'\x00' * pad4(st.st_size))


def pack(srcdir, outpath):
    entries = []
    for root, dirs, files in os.walk(srcdir):
        relroot = os.path.relpath(root, srcdir)
        if relroot == '.':
            relroot = ''
        entries.append((os.path.join(relroot), root))
        for d in dirs:
            entries.append((os.path.join(relroot, d), os.path.join(root, d)))
        for f in files:
            entries.append((os.path.join(relroot, f), os.path.join(root, f)))
    # sort for deterministic output
    entries_sorted = []
    for rel, full in entries:
        relpath = rel if rel else '.'
        # build name relative path
        name = os.path.normpath(os.path.join(relpath)).lstrip('./')
        if name == '.':
            name = '.'
    # write
    with gzip.open(outpath, 'wb') as gz:
        # write entries
        for rel, full in entries:
            # compute relative name
            if rel == '':
                relname = '.'
            else:
                relname = rel.replace('\\', '/')
            write_entry(gz, relname, full)
        # trailer
        # cpio trailer entry has name "TRAILER!!!"
        import types
        class fake:
            st_ino=0
            st_mode=0
            st_uid=0
            st_gid=0
            st_nlink=1
            st_mtime=int(time.time())
            st_size=0
        write_entry(gz, 'TRAILER!!!', os.devnull)

if __name__=='__main__':
    if len(sys.argv)!=3:
        print('Usage: create_cpio_newc.py <srcdir> <out.cpio.gz>')
        sys.exit(2)
    src = sys.argv[1]
    out = sys.argv[2]
    if not os.path.isdir(src):
        print('Source dir not found', src)
        sys.exit(1)
    pack(src, out)
    print('Wrote', out)
