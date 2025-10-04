#!/usr/bin/env python3
"""
Simple HTTP server to serve the IntelTracker frontend with proper CORS.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Less verbose logging
        if not args[0].startswith('OPTIONS'):
            SimpleHTTPRequestHandler.log_message(self, format, *args)

if __name__ == '__main__':
    PORT = 8080
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"Starting IntelTracker UI on http://localhost:{PORT}")
    print(f"Make sure ADK backend is running on http://localhost:8000")
    print(f"Open http://localhost:{PORT}/index.html in your browser")
    print("Press Ctrl+C to stop\n")
    
    httpd = HTTPServer(('localhost', PORT), CORSRequestHandler)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        httpd.shutdown()
        sys.exit(0)
