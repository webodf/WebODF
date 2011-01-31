package org.webodf;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

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

	public String read(int offset, int length) {
		StringBuilder sb = new StringBuilder();
		FileInputStream fi;
		try {
			fi = new FileInputStream(path);
			fi.skip(offset);
			offset = 0;
			int c;
			while (offset < length && (c = fi.read()) != -1) {
				sb.append((char) c);
				offset++;
			}
			fi.close();
		} catch (IOException e) {
		}
		if (offset != length) {
			view.log("there is a problem: " + Integer.toString(offset) + " vs "
					+ Integer.toString(length));
		}
		if (sb.length() != length) {
			view.log("there is ze problem: " + Integer.toString(sb.length())
					+ " vs " + Integer.toString(length));
		}
		return sb.toString();
	}
}
