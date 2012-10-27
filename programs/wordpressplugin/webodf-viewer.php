<?php

/*
Plugin Name: WebODF Viewer
Version: 0.1
Plugin URI: http://kogmbh.com/webodf/wordpress/
Description: Embed ODF in Wordpress
Author: Tobias Hintze
Author URI: http://kogmbh.com

This Wordpress plugin is free software: you can redistribute it
and/or modify it under the terms of the GNU Affero General Public License
(GNU AGPL) as published by the Free Software Foundation, either version 3 of
the License, or (at your option) any later version.  The code is distributed
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.

As additional permission under GNU AGPL version 3 section 7, you
may distribute non-source (e.g., minimized or compacted) forms of
that code without the copy of the GNU GPL normally required by
section 4, provided you include this license notice and a URL
through which recipients can access the Corresponding Source.

*/

$site_url = site_url();
$this_plugin_url = plugins_url() .'/'. plugin_basename(dirname(__FILE__));

function WebODF_ViewerAddPage() {
	add_options_page('WebODF-Viewer Options', 'WebODF-Viewer', '8', 'webodf-viewer.php', 'WebODF_ViewerOptions');
}

function WebODF_ViewerOptions() {
	global $site_url;
	$message = '';
	$options = get_option('WebODF_ViewerSettings');
	if ($_POST) {
		if (isset($_POST['width'])) {
			$options['width'] = $_POST['width'];
		}
		if (isset($_POST['height'])) {
			$options['height'] = $_POST['height'];
		}
		
		update_option('WebODF_ViewerSettings', $options);
		$message = '<div class="updated"><p>width=' . $options['width'] .
			' height=' . $options['height'] .'<strong>&nbsp; Options saved.</strong></p></div>';	
	}
	echo '<div class="wrap">';
	echo '<h2>WebODF-Viewer Options</h2>';
	echo $message;
	echo '<form method="post" action="options-general.php?page=webodf-viewer.php">';
	echo "<p>You can adjut the width and height of the WebODF Viewer iframe here. This is a global setting.</p>";
	echo '<h4>Width-Height</h4>' . "\n";
	echo '<table class="form-table">' . "\n";
	echo '<tr><th scope="row">width</th><td>' . "\n";
	echo '<input type="text" name="width" value="' . $options['width'] . '" />';
	echo '</td></tr>' . "\n";
	echo '<tr><th scope="row">height</th><td>' . "\n";
	echo '<input type="text" name="height" value="' . $options['height'] . '" />';
	echo '</td></tr>' . "\n";
	echo '</table>' . "\n";

	echo '<p class="submit"><input class="button-primary" type="submit" method="post" value="Update Options"></p>';
	echo '</form>';

	echo '</div>';
}	

function WebODF_ViewerLoadDefaults() {
	$ret = array();
	$ret['width'] = '450px';
	$ret['height'] = '380px';
	return $ret;
}

function WebODF_Viewer_activate() {
	update_option('WebODF_ViewerSettings', WebODF_ViewerLoadDefaults());
}

register_activation_hook(__FILE__,'WebODF_Viewer_activate');

function WebODF_Viewer_deactivate() {
	delete_option('WebODF_ViewerSettings');
}

register_deactivation_hook(__FILE__,'WebODF_Viewer_deactivate');

add_action('admin_menu', 'WebODF_ViewerAddPage');


function mime_type_filter($mime_types) { 
    $mime_types['odt'] = 'application/vnd.oasis.opendocument.text';
    $mime_types['odp'] = 'application/vnd.oasis.opendocument.presentation';
    $mime_types['ods'] = 'application/vnd.oasis.opendocument.spreadsheet';
    return $mime_types;
}
add_filter( 'upload_mimes', 'mime_type_filter');

function mime_type_icon($icon_uri, $mime_type, $post_id) {
	// this is bogus and not implemented
	if ($mime_type === 'application/vnd.oasis.opendocument.text') {
		return $icon_uri;
	} else if ($mime_type === 'application/vnd.oasis.opendocument.presentation') {
		return $icon_uri;
	} else if ($mime_type === 'application/vnd.oasis.opendocument.spreadsheet') {
		return $icon_uri;
	} else {
		return $icon_uri;
	}
	// return array($this_plugin_url . '/odf.png', 64, 64);
}
add_filter( 'wp_mime_type_icon', 'mime_type_icon', 10, 3);

function webodf_media_send_to_editor($html, $send_id, $attachment) {
	// if this POST did not came from our "special button", just call super()
	if ($_POST["send"][$send_id] != 'Insert WebODF Viewer') {
		return media_send_to_editor($html);
	}
	// place shortcode
	return "[webodf_viewer ".$attachment['webodf_document_url']."]";
}
add_filter( 'media_send_to_editor', 'webodf_media_send_to_editor', 10, 3);


function field_filter($fields, $post_object) {

	if (preg_match('/^application\/vnd\.oasis\.opendocument\.(text|presentation|spreadsheet)/',
				$post_object->post_mime_type)) {
		$webodf_button_code = "<input type='submit' class='button-primary' ".
			"name='send[$post_object->ID]' value='Insert WebODF Viewer'/>";

		// insert document path
		preg_match('/^http:\/\/[^\/]*(\/.*)$/', $post_object->guid, $matches);
		$fields["webodf_document_url"] = array(
			"label" => __("Document URL"),
			"input" => "text",
			"value" => $matches[1]
		);

		// insert our "special button"
		$fields["webodf_insert_submit"] = array(
			"tr" => "<tr class='submit'><td></td><td class='savesend'>$webodf_button_code</td></tr>\n"
		);
	}
	return $fields;
}
add_filter('attachment_fields_to_edit', 'field_filter', 10, 2);

function webodf_shortcode_handler($args) {
	global $this_plugin_url;
	$document_url = $args[0];
	$options = get_option('WebODF_ViewerSettings');
	$iframe_width = $options['width'];
	$iframe_height = $options['height'];
	return "<iframe src=\"$this_plugin_url/wv/" .
		'#' . $document_url .'" '.
			"width=\"$iframe_width\" ".
			"height=\"$iframe_height\" ".
			'style="border: 1px solid black; border-radius: 5px;" '.
			'webkitallowfullscreen="true" '.
			'mozallowfullscreen="true"></iframe>';
}
add_shortcode('webodf_viewer', 'webodf_shortcode_handler');

?>
