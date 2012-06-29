package org.webodf;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.cordova.DroidGap;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Picture;
import android.net.Uri;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;

public class WebODFActivity extends DroidGap {

	private String path;
	private ZipReader zipreader;

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		path = null;
		if (getIntent() != null && getIntent().getData() != null) {
			path = getIntent().getData().getPath();
		}
		setContentView(R.layout.main);
		super.loadUrl("file:///android_asset/www/index.html");
	}

	private void openOdfFile() {
		if (path == null) {
			return;
		}
		String escapedPath = "file://" + path.replace("'", "\\'");
		sendJavascript("invokeString = '" + escapedPath
				+ "';application.openUrl(invokeString);");
	}

	@Override
	protected void onResume() {
		super.onResume();
		zipreader = new ZipReader(appView);
		appView.addJavascriptInterface(zipreader, "zipreader");
		openOdfFile();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle item selection
		switch (item.getItemId()) {
		case R.id.report_issue:
			reportIssue();
			return true;
		case R.id.about:
			about();
			return true;
		case R.id.visit_website:
			visitWebODFWebsite();
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}

	private void visitWebODFWebsite() {
		String url = "http://webodf.org/";
		Intent i = new Intent(Intent.ACTION_VIEW);
		i.setData(Uri.parse(url));
		startActivity(i);
	}

	private void about() {
		String url = "http://webodf.org/about/";
		Intent i = new Intent(Intent.ACTION_VIEW);
		i.setData(Uri.parse(url));
		startActivity(i);
	}

	private File takeScreenShot() {
		Picture screenshot = appView.capturePicture();
		Bitmap bitmap = Bitmap.createBitmap(screenshot.getWidth(),
				screenshot.getHeight(), Bitmap.Config.ARGB_8888);
		Canvas canvas = new Canvas(bitmap);
		screenshot.draw(canvas);
		screenshot = null;
		String filename = "screenshot.png";
		try {
			FileOutputStream out = openFileOutput(filename,
					Context.MODE_WORLD_READABLE);
			bitmap.compress(Bitmap.CompressFormat.PNG, 90, out);
			out.flush();
			out.close();
		} catch (IOException e) {
			return null;
		}
		return new File(getFilesDir(), filename);
	}

	Uri getApplicationFileUri(String filename) {
		// start path from /mnt/sdcard to make gmail mail client work
		return Uri.fromFile(new File("/mnt/sdcard/../.." + getFilesDir() + "/"
				+ filename));
	}

	File createZip(File files[]) {
		final int buffersize = 2048;
		String zipfile = "issuereport.zip";
		try {
			BufferedInputStream origin = null;
			FileOutputStream dest = openFileOutput(zipfile,
					Context.MODE_WORLD_READABLE);
			ZipOutputStream out = new ZipOutputStream(new BufferedOutputStream(
					dest));
			byte data[] = new byte[buffersize];
			for (int i = 0; i < files.length; i++) {
				FileInputStream fi = new FileInputStream(files[i]);
				origin = new BufferedInputStream(fi, buffersize);
				ZipEntry entry = new ZipEntry(files[i].getName());
				out.putNextEntry(entry);
				int count;
				while ((count = origin.read(data, 0, buffersize)) != -1) {
					out.write(data, 0, count);
				}
				origin.close();
			}
			out.close();
			dest.close();
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
		return new File(getFilesDir(), zipfile);
	}

	private void reportIssue() {
		File screenshotfile = takeScreenShot();
		File odffile = (path == null) ? null : new File(path);
		File attachmentfile = null;
		String type = "text/plain";
		if (screenshotfile != null) {
			if (odffile != null) {
				type = "application/zip";
				attachmentfile = createZip(new File[] { screenshotfile, odffile });
			} else {
				type = "image/png";
				attachmentfile = screenshotfile;
			}
		} else if (odffile != null) {
			attachmentfile = odffile;
			type = "application/vnd.oasis.opendocument.text";
		}

		Intent emailIntent = new Intent(android.content.Intent.ACTION_SEND);
		String aEmailList[] = { "WebODF <kogmbh-android@kogmbh.com>",
				"jos@vandenoever.info" };
		emailIntent.putExtra(android.content.Intent.EXTRA_EMAIL, aEmailList);
		emailIntent.putExtra(android.content.Intent.EXTRA_SUBJECT,
				"Issue report");

		if (attachmentfile != null) {
			// start path from /mnt/sdcard to make gmail mail client work
			Uri uri = Uri.fromFile(new File("/mnt/sdcard/../.."
					+ attachmentfile.getAbsolutePath()));
			emailIntent.putExtra(Intent.EXTRA_STREAM, uri);
		}
		emailIntent.setType(type);
		emailIntent.putExtra(Intent.EXTRA_TEXT, "My message body.");
		startActivity(emailIntent);
	}

}
