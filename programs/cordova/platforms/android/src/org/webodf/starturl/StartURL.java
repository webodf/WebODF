package org.webodf.starturl;

import android.content.Intent;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;

public class StartURL extends CordovaPlugin {
	@Override
	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
	}
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		if ("startUrl".equals(action)) {
			callbackContext.success(getStartURL());
			return true;
		}
		return false;
	}
	private String getStartURL() {
		String url = null;
		Intent intent = cordova.getActivity().getIntent();
		if (intent != null && intent.getData() != null) {
			url = "file://" + intent.getData().getPath();
		}
        return url;
	}
}
