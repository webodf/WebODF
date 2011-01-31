package org.webodf;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringWriter;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class WebODFView extends Activity {
	WebView mWebView;
	FileReader filereader;

	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);
		
		filereader = new FileReader(this, getIntent().getData().getPath());

		mWebView = (WebView) findViewById(R.id.webview);
		mWebView.setNetworkAvailable(false);
		mWebView.setWebViewClient(new WebODFViewClient());
		mWebView.setWebChromeClient(new WebODFChromeClient());
		WebSettings webSettings = mWebView.getSettings();
		webSettings.setJavaScriptEnabled(true);
		webSettings.setSupportZoom(true);
		webSettings.setBuiltInZoomControls(true);
		mWebView.addJavascriptInterface(filereader, "filereader");

		mWebView.loadUrl("file:///android_asset/odf.html");
	}

	private class WebODFChromeClient extends WebChromeClient {
		@SuppressWarnings("unused")
		// used in higher version of api
		public void onConsoleMessage(String message, int lineNumber,
				String sourceID) {
			log(message + " -- From line " + lineNumber + " of " + sourceID);
		}
	}

	void log(String msg) {
		String tag = "WebODF";
		Toast.makeText(this, tag + " -- " + msg, Toast.LENGTH_LONG).show();
		Log.d(tag, msg);
	}

	private class WebODFViewClient extends WebViewClient {

		@Override
		public void onPageFinished(WebView view, String url) {
			//mWebView.loadUrl("javascript:(function() {alert(counter.getit());})() ");
			//String data = fileToBase64String(getIntent().getData().getPath());
			mWebView.loadUrl("javascript:(function() { "
				//	+ "var data = window.atob(\"" + data + "\");"
					+ "runtime.read = function(path, offset, length, callback) {"
					+ "      var s = filereader.read(offset, length);"
					+ "      callback(null, String(s));"
					+ "};"
					+ "runtime.getFileSize = function(path, callback) {"
					+ "    callback(filereader.length());"
					+ "};"
					+ "window.odfcontainer = new window.odf.OdfContainer('"
					+ "        odffile'); refreshOdf();"
					+ "})()");
		}

		@Override
		public void onReceivedError(WebView view, int errorCode,
				String description, String failingUrl) {
			log("Error " + Integer.toString(errorCode) + ": " + description
					+ " " + failingUrl);
		}
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView.canGoBack()) {
			mWebView.goBack();
			return true;
		}
		return super.onKeyDown(keyCode, event);
	}

	public String fileToBase64String(String path) {
		StringWriter sw = new StringWriter();
		Base64OutputStream base64 = new Base64OutputStream(sw);
		try {
			FileInputStream i = new FileInputStream(path);
			int c;
			while ((c = i.read()) != -1) {
				base64.write(c);
			}
			i.close();
			base64.close();
			sw.close();
		} catch (IOException e) {
		}
		return sw.toString();
	}
}