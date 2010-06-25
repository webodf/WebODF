/**
* @preserve
* Adamia 3D Engine v0.1
* Copyright (c) 2010 Adam R. Smith
* Licensed under the new BSD License:
* http://www.opensource.org/licenses/bsd-license.php
*
* Project home: http://code.google.com/p/adamia-3d/
* 
* Date: 01/12/2010
*/

if (typeof(a3d) == 'undefined') {
	/** @namespace */ a3d = {};
}

// Taken from http://ejohn.org/blog/simple-javascript-inheritance/

// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  /** @class */
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();
/**
 * Enum for big or little endian.
 * @enum {number}
 */
a3d.Endian = {
	  BIG: 0
	, LITTLE: 1
};

/**
 * Attempt to imitate AS3's ByteArray as very high-performance javascript.
 * I aliased the functions to have shorter names, like ReadUInt32 as well as ReadUnsignedInt.
 * I used some code from http://fhtr.blogspot.com/2009/12/3d-models-and-parsing-binary-data-with.html
 * to kick-start it, but I added optimizations and support both big and little endian.
 * Note that you cannot change the endianness after construction.
 * @extends Class
 */
a3d.ByteArray = Class.extend({
	  data: ''
	, length: 0
	, pos: 0
	, pow: Math.pow
	, endian: a3d.Endian.BIG
	, TWOeN23: Math.pow(2, -23)
	, TWOeN52: Math.pow(2, -52)
	
	/** @constructor */
	, init: function(data, endian) {
		this.data = (data !== undefined) ? data : '';
		if (endian !== undefined) this.endian = endian;
		this.length = data.length;
		
		// Cache the function pointers based on endianness.
		// This avoids doing an if-statement in every function call.
		var funcExt = (endian == a3d.Endian.BIG) ? 'BE' : 'LE';
		var funcs = ['readInt32', 'readInt16', 'readUInt32', 'readUInt16', 'readFloat32', 'readFloat64'];
		for (var func in funcs) {
			this[funcs[func]] = this[funcs[func] + funcExt];
		}
		
		// Add redundant members that match actionscript for compatibility
		var funcMap = {readUnsignedByte: 'readByte', readUnsignedInt: 'readUInt32',
			readFloat: 'readFloat32', readDouble: 'readFloat64', readShort: 'readInt16',
			readBoolean: 'readBool', readInt: 'readInt32'};
		for (var func in funcMap) {
			this[func] = this[funcMap[func]];
		}
	}
	
	, readByte: function() {
		return (this.data.charCodeAt(this.pos++) & 0xFF);
	}
	
	, readBool: function() {
		return (this.data.charCodeAt(this.pos++) & 0xFF) ? true : false;
	}
	
	, readUInt32BE: function() {
		var data = this.data, pos = (this.pos += 4) - 4;
		return	((data.charCodeAt(pos)   & 0xFF) << 24) |
				((data.charCodeAt(++pos) & 0xFF) << 16) |
				((data.charCodeAt(++pos) & 0xFF) << 8) |
				 (data.charCodeAt(++pos) & 0xFF);
	}
	, readInt32BE: function() {
		var data = this.data, pos = (this.pos += 4) - 4;
		var x =	((data.charCodeAt(pos)   & 0xFF) << 24) |
				((data.charCodeAt(++pos) & 0xFF) << 16) |
				((data.charCodeAt(++pos) & 0xFF) << 8) |
				 (data.charCodeAt(++pos) & 0xFF);
		return (x >= 2147483648) ? x - 4294967296 : x;
	}
	
	, readUInt16BE: function() {
		var data = this.data, pos = (this.pos += 2) - 2;
		return	((data.charCodeAt(pos)   & 0xFF) << 8) |
				 (data.charCodeAt(++pos) & 0xFF);
	}
	, readInt16BE: function() {
		var data = this.data, pos = (this.pos += 2) - 2;
		var x =	((data.charCodeAt(pos)   & 0xFF) << 8) |
				 (data.charCodeAt(++pos) & 0xFF);
		return (x >= 32768) ? x - 65536 : x;
	}
	
	, readFloat32BE: function() {
		var data = this.data, pos = (this.pos += 4) - 4;
		var b1 = data.charCodeAt(pos) & 0xFF,
			b2 = data.charCodeAt(++pos) & 0xFF,
			b3 = data.charCodeAt(++pos) & 0xFF,
			b4 = data.charCodeAt(++pos) & 0xFF;
		var sign = 1 - ((b1 >> 7) << 1);                   // sign = bit 0
		var exp = (((b1 << 1) & 0xFF) | (b2 >> 7)) - 127;  // exponent = bits 1..8
		var sig = ((b2 & 0x7F) << 16) | (b3 << 8) | b4;    // significand = bits 9..31
		if (sig == 0 && exp == -127)
			return 0.0;
		return sign*(1 + this.TWOeN23*sig)*this.pow(2, exp);
	}
	
	, readFloat64BE: function() {
		var data = this.data, pos = (this.pos += 8) - 8;
		var b1 = data.charCodeAt(pos) & 0xFF,
			b2 = data.charCodeAt(++pos) & 0xFF,
			b3 = data.charCodeAt(++pos) & 0xFF,
			b4 = data.charCodeAt(++pos) & 0xFF,
			b5 = data.charCodeAt(++pos) & 0xFF,
			b6 = data.charCodeAt(++pos) & 0xFF,
			b7 = data.charCodeAt(++pos) & 0xFF,
			b8 = data.charCodeAt(++pos) & 0xFF;
		var sign = 1 - ((b1 >> 7) << 1);									// sign = bit 0
		var exp = (((b1 << 4) & 0x7FF) | (b2 >> 4)) - 1023;					// exponent = bits 1..11
		
		// This crazy toString() stuff works around the fact that js ints are
		// only 32 bits and signed, giving us 31 bits to work with
		var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) +
			((b5 >> 7) ? '1' : '0') +
			(((b5&0x7F) << 24) | (b6 << 16) | (b7 << 8) | b8).toString(2);	// significand = bits 12..63
			
		sig = parseInt(sig, 2);
		if (sig == 0 && exp == -1023)
			return 0.0;
		return sign*(1.0 + this.TWOeN52*sig)*this.pow(2, exp);
	}
	
	, readUInt32LE: function() {
		var data = this.data, pos = (this.pos += 4);
		return	((data.charCodeAt(--pos)   & 0xFF) << 24) |
				((data.charCodeAt(--pos) & 0xFF) << 16) |
				((data.charCodeAt(--pos) & 0xFF) << 8) |
				 (data.charCodeAt(--pos) & 0xFF);
	}
	, readInt32LE: function() {
		var data = this.data, pos = (this.pos += 4);
		var x =	((data.charCodeAt(--pos)   & 0xFF) << 24) |
				((data.charCodeAt(--pos) & 0xFF) << 16) |
				((data.charCodeAt(--pos) & 0xFF) << 8) |
				 (data.charCodeAt(--pos) & 0xFF);
		return (x >= 2147483648) ? x - 4294967296 : x;
	}
	
	, readUInt16LE: function() {
		var data = this.data, pos = (this.pos += 2);
		return	((data.charCodeAt(--pos)   & 0xFF) << 8) |
				 (data.charCodeAt(--pos) & 0xFF);
	}
	, readInt16LE: function() {
		var data = this.data, pos = (this.pos += 2);
		var x =	((data.charCodeAt(--pos)   & 0xFF) << 8) |
				 (data.charCodeAt(--pos) & 0xFF);
		return (x >= 32768) ? x - 65536 : x;
	}
	
	, readFloat32LE: function() {
		var data = this.data, pos = (this.pos += 4);
		var b1 = data.charCodeAt(--pos) & 0xFF,
			b2 = data.charCodeAt(--pos) & 0xFF,
			b3 = data.charCodeAt(--pos) & 0xFF,
			b4 = data.charCodeAt(--pos) & 0xFF;
		var sign = 1 - ((b1 >> 7) << 1);                   // sign = bit 0
		var exp = (((b1 << 1) & 0xFF) | (b2 >> 7)) - 127;  // exponent = bits 1..8
		var sig = ((b2 & 0x7F) << 16) | (b3 << 8) | b4;    // significand = bits 9..31
		if (sig == 0 && exp == -127)
			return 0.0;
		return sign*(1 + this.TWOeN23*sig)*this.pow(2, exp);
	}
	
	, readFloat64LE: function() {
		var data = this.data, pos = (this.pos += 8);
		var b1 = data.charCodeAt(--pos) & 0xFF,
			b2 = data.charCodeAt(--pos) & 0xFF,
			b3 = data.charCodeAt(--pos) & 0xFF,
			b4 = data.charCodeAt(--pos) & 0xFF,
			b5 = data.charCodeAt(--pos) & 0xFF,
			b6 = data.charCodeAt(--pos) & 0xFF,
			b7 = data.charCodeAt(--pos) & 0xFF,
			b8 = data.charCodeAt(--pos) & 0xFF;
		var sign = 1 - ((b1 >> 7) << 1);									// sign = bit 0
		var exp = (((b1 << 4) & 0x7FF) | (b2 >> 4)) - 1023;					// exponent = bits 1..11
		
		// This crazy toString() stuff works around the fact that js ints are
		// only 32 bits and signed, giving us 31 bits to work with
		var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) +
			((b5 >> 7) ? '1' : '0') +
			(((b5&0x7F) << 24) | (b6 << 16) | (b7 << 8) | b8).toString(2);	// significand = bits 12..63
			
		sig = parseInt(sig, 2);
		if (sig == 0 && exp == -1023)
			return 0.0;
		return sign*(1.0 + this.TWOeN52*sig)*this.pow(2, exp);
	}
});
