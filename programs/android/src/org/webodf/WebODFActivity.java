package org.webodf;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

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

import com.phonegap.DroidGap;

public class WebODFActivity extends DroidGap {

	private String path;

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

	@Override
	protected void onResume() {
		super.onResume();
		if (path == null) {
			return;
		}
		String escapedPath = "file://" + path.replace("'", "\\'");
		sendJavascript("invokeString = '" + escapedPath + "';");
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

	private Uri takeScreenShot() {
		Uri screenshoturi = null;
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
			// start path from /mnt/sdcard to make gmail mail client work
			screenshoturi = Uri.fromFile(new File("/mnt/sdcard/../.."
					+ getFilesDir() + "/" + filename));

		} catch (IOException e) {
		}
		return screenshoturi;
	}

	private void reportIssue() {
		Uri screenshoturi = takeScreenShot();

		Intent emailIntent = new Intent(android.content.Intent.ACTION_SEND);
		String aEmailList[] = { "WebODF <kogmbh-android@kogmbh.com>",
				"jos@vandenoever.info" };
		emailIntent.putExtra(android.content.Intent.EXTRA_EMAIL, aEmailList);
		emailIntent.putExtra(android.content.Intent.EXTRA_SUBJECT,
				"Issue report");
		emailIntent.setType("image/png");
		emailIntent.putExtra(Intent.EXTRA_STREAM, screenshoturi);
		emailIntent.putExtra(Intent.EXTRA_TEXT, "My message body.");
		startActivity(emailIntent);
	}

}