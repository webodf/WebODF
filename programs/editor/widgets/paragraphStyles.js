runtime.loadClass('odf.Formatting');

var formatting = new odf.Formatting();
formatting.setOdfContainer(document.odfCanvas.odfContainer());
console.log(formatting.getAvailableParagraphStyles());

require(["dijit/form/Select"], function() {
	new dijit.form.Select({
		name: 'paragraphStyles',
		options: []
	}).placeAt(dojo.body());
})