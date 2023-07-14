import os
import pdfkit
import socket
from urllib.parse import urlparse, urljoin
from uuid import uuid4
from flask import Flask, render_template, request, Response, redirect, flash, session
from struct import unpack

app = Flask(__name__)
app.config['SECRET_KEY'] = str(uuid4())

def ip2long(ip_addr):
        return unpack("!L", socket.inet_aton(ip_addr))[0]

def is_inner_ipaddress(ip):
    ip = ip2long(ip)
    return ip2long('127.0.0.0') >> 24 == ip >> 24 or \
        ip2long('10.0.0.0') >> 24 == ip >> 24 or \
        ip2long('172.16.0.0') >> 20 == ip >> 20 or \
        ip2long('192.168.0.0') >> 16 == ip >> 16 or \
        ip2long('0.0.0.0') >> 24 == ip >> 24

def is_safe_redirect_url(target):
    host_url = urlparse(request.host_url)
    redirect_url = urlparse(urljoin(request.host_url, target))
    return (
        redirect_url.scheme in ("http", "https")
        and host_url.netloc == redirect_url.netloc
    )

def getip(url):
    hostname = urlparse(url).hostname
    ip_address = socket.gethostbyname(hostname)
    return ip_address

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        return render_template('index.html')

    if 'url' not in request.form:
        return render_template('index.html', error='Invalid form submission')

    url = request.form['url']
    try:
        if is_inner_ipaddress(getip(url)):
            flash('URL not allowed')
            return redirect('/', 301)
    except Exception as e:
        flash('Invalid domain')
        return redirect('/', 301)

    if is_safe_redirect_url(url):

        temp_name = os.path.join(os.path.dirname(
            __file__), f'temp', f'temp-{uuid4()}.pdf')

        try:
            pdfkit.from_url(url, temp_name)
        except OSError as e:
            print(f"URL: {url}\nError: {e}")
            flash('Error: Website not found')
            return redirect('/', 301)

        with open(temp_name, 'rb') as pdf:
            response = Response(pdf.read(), mimetype='application/pdf',
                                headers={'Content-Disposition': f'attachment; filename={url}.pdf'})

        os.remove(temp_name)
        return response

    else:
        flash('URL not safe')
        return redirect('/', 301)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
