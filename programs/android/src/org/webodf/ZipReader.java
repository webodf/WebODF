package org.webodf;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import android.webkit.WebView;

public class ZipReader {

	private WebView view;
	private ZipFile zip;
	private String url;

	ZipReader(WebView view) {
		this.view = view;
	}

	public void loadAsString(String url, String filename, String callbackname) {
		String err = null;
		if (this.url != url) {
			try {
				zip = new ZipFile(new File(url), ZipFile.OPEN_READ);
			} catch (IOException e) {
				// TODO: escape the filename
				err = "Could not open zip file " + filename + ".";
			}
		}
		StringWriter sw = new StringWriter();
		if (err == null) {
			ZipEntry e = zip.getEntry(filename);
			try {
				InputStreamReader reader = new InputStreamReader(
						zip.getInputStream(e));
				int c;
				while ((c = reader.read()) != -1) {
					if (c == '"') {
						sw.append("\\\"");
					} else if (c != '\r' && c != '\n') {
						sw.append((char) c);
					}
				}
				reader.close();
			} catch (IOException e1) {
				e1.printStackTrace();
				// TODO: escape the filename
				err = "Could not read zip file " + filename + ".";
			}
		}
		call(callbackname, err, sw.toString());
	}

	public void loadAsDataURL(String url, String filename, String mimetype,
			String callbackname) {
		StringWriter sw = new StringWriter();
		String err = null;
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
