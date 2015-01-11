package org.webodf;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.zip.ZipFile;

import android.webkit.WebView;

public class ZipReader {

	private WebView view;
	private ZipFile zip;
	private String url;

	ZipReader(WebView view) {
		this.view = view;
	}

	private InputStream openZipEntry(String url, String filename)
			throws IOException, NullPointerException {
		if (zip == null || this.url != url) {
			zip = new ZipFile(new File(url.substring(7)), ZipFile.OPEN_READ);
			this.url = url;
		}
		return zip.getInputStream(zip.getEntry(filename));
	}

	public void loadAsString(String url, String filename, String callbackname) {
		StringWriter sw = new StringWriter();
		String err = null;
		try {
			InputStreamReader reader = new InputStreamReader(openZipEntry(url,
					filename));
			int c;
			while ((c = reader.read()) != -1) {
				if (c == '"') {
					sw.append("\\\"");
				} else if (c != '\r' && c != '\n') {
					sw.append((char) c);
				}
			}
			reader.close();
		} catch (Exception e) {
			// TODO: escape the filename
			err = "Could not read file " + filename + " from " + url;
		}
		call(callbackname, err, sw.toString());
	}

	public void loadAsDataURL(String url, String filename, String mimetype,
			String callbackname) {
		String err = null;
		StringWriter sw = new StringWriter();
		sw.write("data:");
		if (mimetype != null) {
			sw.write(mimetype);
		}
		sw.write(";base64,");
		Base64OutputStream base64 = new Base64OutputStream(sw);
		InputStream fi;
		try {
			fi = openZipEntry(url, filename);
			int c;
			while ((c = fi.read()) != -1) {
				base64.write(c);
			}
			fi.close();
			base64.close();
			sw.close();
		} catch (Exception e) {
			err = "Could not read file " + filename + " from " + url;
		}
		call(callbackname, err, sw.toString());
	}

	private void call(String callbackname, String err, String data) {
		if (err != null) {
			err = "\"" + err + "\"";
		}
		String cmd = "javascript:(function() {" + callbackname + "(" + err
				+ ",\"" + data + "\");})();";
		view.loadUrl(cmd);
	}

}
