package org.webodf;

import android.content.Intent;
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
		case R.id.report_bug:
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

	private void reportIssue() {
		String url = "http://webodf.org/redmine/projects/webodf/issues";
		Intent i = new Intent(Intent.ACTION_VIEW);
		i.setData(Uri.parse(url));
		startActivity(i);
	}
}