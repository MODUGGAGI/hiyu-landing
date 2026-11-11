#!/usr/bin/env python3
"""Local preview only; site files remain identical to the deployment archive."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent / 'site'

class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/pain-test/')
            self.end_headers()
            return
        if path.startswith('/cdn-cgi/zaraz/'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'/* Analytics disabled in local preview. */')
            return
        if path == '/pain-test/assets/app.js':
            source = (ROOT / 'pain-test/assets/app.js').read_text(encoding='utf-8')
            source = source.replace("window.location.assign(SHARE_BASE + '/')", "window.location.assign('/pain-test/')")
            data = source.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 0), PreviewHandler)
    url = 'http://127.0.0.1:%s/pain-test/' % server.server_port
    print('\n로컬 미리보기: ' + url + '\n종료하려면 Ctrl+C를 누르세요.\n', flush=True)
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
