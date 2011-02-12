package org.webodf;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringWriter;

public class FileReader {
	private final WebODFView view;
	private final String path;
	private final long size;

	public FileReader(WebODFView view, String path) {
		this.view = view;
		this.path = path;
		File f = new File(path);
		size = f.length();
	}

	public long length() {
		return size;
	}

	public void read(int offset, int length, String callbackname) {
		StringWriter sw = new StringWriter();
		Base64OutputStream base64 = new Base64OutputStream(sw);
		FileInputStream fi;
		try {
			fi = new FileInputStream(path);
			fi.skip(offset);
			offset = 0;
			int c;
			while (offset < length && (c = fi.read()) != -1) {
				base64.write(c);
				offset++;
			}
			fi.close();
			base64.close();
			sw.close();
		} catch (IOException e) {
		}
		view.mWebView.loadUrl("javascript:(function() {"
				+ callbackname + "(window.atob(\"" + sw.toString() + "\"));"
				+ "})()");
	}
}
