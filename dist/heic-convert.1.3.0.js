(function (exports) {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getAugmentedNamespace(n) {
	  var f = n.default;
		if (typeof f == "function") {
			var a = function () {
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var global$1 = (typeof global !== "undefined" ? global :
	  typeof self !== "undefined" ? self :
	  typeof window !== "undefined" ? window : {});

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
	var inited = false;
	function init () {
	  inited = true;
	  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	  for (var i = 0, len = code.length; i < len; ++i) {
	    lookup[i] = code[i];
	    revLookup[code.charCodeAt(i)] = i;
	  }

	  revLookup['-'.charCodeAt(0)] = 62;
	  revLookup['_'.charCodeAt(0)] = 63;
	}

	function toByteArray (b64) {
	  if (!inited) {
	    init();
	  }
	  var i, j, l, tmp, placeHolders, arr;
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

	  // base64 is 4/3 + up to two characters of the original data
	  arr = new Arr(len * 3 / 4 - placeHolders);

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len;

	  var L = 0;

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
	    arr[L++] = (tmp >> 16) & 0xFF;
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[L++] = tmp & 0xFF;
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  if (!inited) {
	    init();
	  }
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var output = '';
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    output += lookup[tmp >> 2];
	    output += lookup[(tmp << 4) & 0x3F];
	    output += '==';
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
	    output += lookup[tmp >> 10];
	    output += lookup[(tmp >> 4) & 0x3F];
	    output += lookup[(tmp << 2) & 0x3F];
	    output += '=';
	  }

	  parts.push(output);

	  return parts.join('')
	}

	function read$1 (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	function write (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	}

	var toString = {}.toString;

	var isArray$1 = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};

	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	var INSPECT_MAX_BYTES = 50;

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer$1.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
	  ? global$1.TYPED_ARRAY_SUPPORT
	  : true;

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	var _kMaxLength = kMaxLength();

	function kMaxLength () {
	  return Buffer$1.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length);
	    that.__proto__ = Buffer$1.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer$1(length);
	    }
	    that.length = length;
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer$1 (arg, encodingOrOffset, length) {
	  if (!Buffer$1.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$1)) {
	    return new Buffer$1(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer$1.poolSize = 8192; // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer$1._augment = function (arr) {
	  arr.__proto__ = Buffer$1.prototype;
	  return arr
	};

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer$1.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	};

	if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	  Buffer$1.prototype.__proto__ = Uint8Array.prototype;
	  Buffer$1.__proto__ = Uint8Array;
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size);
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer$1.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	};

	function allocUnsafe (that, size) {
	  assertSize(size);
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	  if (!Buffer$1.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0;
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer$1.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	};
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer$1.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	};

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8';
	  }

	  if (!Buffer$1.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0;
	  that = createBuffer(that, length);

	  var actual = that.write(string, encoding);

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual);
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0;
	  that = createBuffer(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array);
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset);
	  } else {
	    array = new Uint8Array(array, byteOffset, length);
	  }

	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array;
	    that.__proto__ = Buffer$1.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array);
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (internalIsBuffer(obj)) {
	    var len = checked(obj.length) | 0;
	    that = createBuffer(that, len);

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len);
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray$1(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0;
	  }
	  return Buffer$1.alloc(+length)
	}
	Buffer$1.isBuffer = isBuffer$1;
	function internalIsBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer$1.compare = function compare (a, b) {
	  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	Buffer$1.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	};

	Buffer$1.concat = function concat (list, length) {
	  if (!isArray$1(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer$1.alloc(0)
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length;
	    }
	  }

	  var buffer = Buffer$1.allocUnsafe(length);
	  var pos = 0;
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i];
	    if (!internalIsBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos);
	    pos += buf.length;
	  }
	  return buffer
	};

	function byteLength (string, encoding) {
	  if (internalIsBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string;
	  }

	  var len = string.length;
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer$1.byteLength = byteLength;

	function slowToString (encoding, start, end) {
	  var loweredCase = false;

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0;
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length;
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0;
	  start >>>= 0;

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer$1.prototype._isBuffer = true;

	function swap (b, n, m) {
	  var i = b[n];
	  b[n] = b[m];
	  b[m] = i;
	}

	Buffer$1.prototype.swap16 = function swap16 () {
	  var len = this.length;
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1);
	  }
	  return this
	};

	Buffer$1.prototype.swap32 = function swap32 () {
	  var len = this.length;
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3);
	    swap(this, i + 1, i + 2);
	  }
	  return this
	};

	Buffer$1.prototype.swap64 = function swap64 () {
	  var len = this.length;
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7);
	    swap(this, i + 1, i + 6);
	    swap(this, i + 2, i + 5);
	    swap(this, i + 3, i + 4);
	  }
	  return this
	};

	Buffer$1.prototype.toString = function toString () {
	  var length = this.length | 0;
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	};

	Buffer$1.prototype.equals = function equals (b) {
	  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer$1.compare(this, b) === 0
	};

	Buffer$1.prototype.inspect = function inspect () {
	  var str = '';
	  var max = INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>'
	};

	Buffer$1.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!internalIsBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0;
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0;
	  }
	  if (thisStart === undefined) {
	    thisStart = 0;
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length;
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0;
	  end >>>= 0;
	  thisStart >>>= 0;
	  thisEnd >>>= 0;

	  if (this === target) return 0

	  var x = thisEnd - thisStart;
	  var y = end - start;
	  var len = Math.min(x, y);

	  var thisCopy = this.slice(thisStart, thisEnd);
	  var targetCopy = target.slice(start, end);

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i];
	      y = targetCopy[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset;
	    byteOffset = 0;
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff;
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000;
	  }
	  byteOffset = +byteOffset;  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1);
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1;
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0;
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer$1.from(val, encoding);
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (internalIsBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF; // Search for a byte value [0-255]
	    if (Buffer$1.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1;
	  var arrLength = arr.length;
	  var valLength = val.length;

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase();
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2;
	      arrLength /= 2;
	      valLength /= 2;
	      byteOffset /= 2;
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i;
	  if (dir) {
	    var foundIndex = -1;
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex;
	        foundIndex = -1;
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true;
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false;
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer$1.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	};

	Buffer$1.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	};

	Buffer$1.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	};

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed;
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer$1.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer$1.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	};

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return fromByteArray(buf)
	  } else {
	    return fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    );
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i]);
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res
	}

	Buffer$1.prototype.slice = function slice (start, end) {
	  var len = this.length;
	  start = ~~start;
	  end = end === undefined ? len : ~~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end);
	    newBuf.__proto__ = Buffer$1.prototype;
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer$1(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  return newBuf
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer$1.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val
	};

	Buffer$1.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val
	};

	Buffer$1.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset]
	};

	Buffer$1.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | (this[offset + 1] << 8)
	};

	Buffer$1.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return (this[offset] << 8) | this[offset + 1]
	};

	Buffer$1.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	};

	Buffer$1.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	};

	Buffer$1.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer$1.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer$1.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	};

	Buffer$1.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | (this[offset + 1] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer$1.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | (this[offset] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer$1.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	};

	Buffer$1.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	};

	Buffer$1.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read$1(this, offset, true, 23, 4)
	};

	Buffer$1.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read$1(this, offset, false, 23, 4)
	};

	Buffer$1.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read$1(this, offset, true, 52, 8)
	};

	Buffer$1.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read$1(this, offset, false, 52, 8)
	};

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer$1.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer$1.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer$1.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer$1.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer$1.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
	  }
	}

	Buffer$1.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 1] = (value >>> 8);
	    this[offset] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer$1.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	Buffer$1.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer$1.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer$1.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	Buffer$1.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer$1.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	Buffer$1.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 3] = (value >>> 24);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer$1.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4);
	  }
	  write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4
	}

	Buffer$1.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	};

	Buffer$1.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8);
	  }
	  write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8
	}

	Buffer$1.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	};

	Buffer$1.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer$1.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer$1.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    );
	  }

	  return len
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer$1.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start;
	      start = 0;
	      end = this.length;
	    } else if (typeof end === 'string') {
	      encoding = end;
	      end = this.length;
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0);
	      if (code < 256) {
	        val = code;
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer$1.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255;
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0;
	  end = end === undefined ? this.length : end >>> 0;

	  if (!val) val = 0;

	  var i;
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val;
	    }
	  } else {
	    var bytes = internalIsBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer$1(val, encoding).toString());
	    var len = bytes.length;
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len];
	    }
	  }

	  return this
	};

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray
	}


	function base64ToBytes (str) {
	  return toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i];
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}


	// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	function isBuffer$1(obj) {
	  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
	}

	function isFastBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
	}

	var _polyfillNode_buffer = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Buffer: Buffer$1,
		INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
		SlowBuffer: SlowBuffer,
		isBuffer: isBuffer$1,
		kMaxLength: _kMaxLength
	});

	var encoder = {exports: {}};

	(function (module) {

		function JPEGEncoder(quality) {
			var ffloor = Math.floor;
			var YTable = new Array(64);
			var UVTable = new Array(64);
			var fdtbl_Y = new Array(64);
			var fdtbl_UV = new Array(64);
			var YDC_HT;
			var UVDC_HT;
			var YAC_HT;
			var UVAC_HT;
			
			var bitcode = new Array(65535);
			var category = new Array(65535);
			var outputfDCTQuant = new Array(64);
			var DU = new Array(64);
			var byteout = [];
			var bytenew = 0;
			var bytepos = 7;
			
			var YDU = new Array(64);
			var UDU = new Array(64);
			var VDU = new Array(64);
			var clt = new Array(256);
			var RGB_YUV_TABLE = new Array(2048);
			var currentQuality;
			
			var ZigZag = [
					 0, 1, 5, 6,14,15,27,28,
					 2, 4, 7,13,16,26,29,42,
					 3, 8,12,17,25,30,41,43,
					 9,11,18,24,31,40,44,53,
					10,19,23,32,39,45,52,54,
					20,22,33,38,46,51,55,60,
					21,34,37,47,50,56,59,61,
					35,36,48,49,57,58,62,63
				];
			
			var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
			var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
			var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
			var std_ac_luminance_values = [
					0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
					0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
					0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
					0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
					0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
					0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
					0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
					0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
					0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
					0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
					0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
					0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
					0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
					0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
					0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
					0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
					0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
					0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
					0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
					0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
					0xf9,0xfa
				];
			
			var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
			var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
			var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
			var std_ac_chrominance_values = [
					0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
					0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
					0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
					0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
					0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
					0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
					0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
					0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
					0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
					0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
					0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
					0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
					0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
					0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
					0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
					0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
					0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
					0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
					0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
					0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
					0xf9,0xfa
				];
			
			function initQuantTables(sf){
					var YQT = [
						16, 11, 10, 16, 24, 40, 51, 61,
						12, 12, 14, 19, 26, 58, 60, 55,
						14, 13, 16, 24, 40, 57, 69, 56,
						14, 17, 22, 29, 51, 87, 80, 62,
						18, 22, 37, 56, 68,109,103, 77,
						24, 35, 55, 64, 81,104,113, 92,
						49, 64, 78, 87,103,121,120,101,
						72, 92, 95, 98,112,100,103, 99
					];
					
					for (var i = 0; i < 64; i++) {
						var t = ffloor((YQT[i]*sf+50)/100);
						if (t < 1) {
							t = 1;
						} else if (t > 255) {
							t = 255;
						}
						YTable[ZigZag[i]] = t;
					}
					var UVQT = [
						17, 18, 24, 47, 99, 99, 99, 99,
						18, 21, 26, 66, 99, 99, 99, 99,
						24, 26, 56, 99, 99, 99, 99, 99,
						47, 66, 99, 99, 99, 99, 99, 99,
						99, 99, 99, 99, 99, 99, 99, 99,
						99, 99, 99, 99, 99, 99, 99, 99,
						99, 99, 99, 99, 99, 99, 99, 99,
						99, 99, 99, 99, 99, 99, 99, 99
					];
					for (var j = 0; j < 64; j++) {
						var u = ffloor((UVQT[j]*sf+50)/100);
						if (u < 1) {
							u = 1;
						} else if (u > 255) {
							u = 255;
						}
						UVTable[ZigZag[j]] = u;
					}
					var aasf = [
						1.0, 1.387039845, 1.306562965, 1.175875602,
						1.0, 0.785694958, 0.541196100, 0.275899379
					];
					var k = 0;
					for (var row = 0; row < 8; row++)
					{
						for (var col = 0; col < 8; col++)
						{
							fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
							fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
							k++;
						}
					}
				}
				
				function computeHuffmanTbl(nrcodes, std_table){
					var codevalue = 0;
					var pos_in_table = 0;
					var HT = new Array();
					for (var k = 1; k <= 16; k++) {
						for (var j = 1; j <= nrcodes[k]; j++) {
							HT[std_table[pos_in_table]] = [];
							HT[std_table[pos_in_table]][0] = codevalue;
							HT[std_table[pos_in_table]][1] = k;
							pos_in_table++;
							codevalue++;
						}
						codevalue*=2;
					}
					return HT;
				}
				
				function initHuffmanTbl()
				{
					YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
					UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
					YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
					UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
				}
			
				function initCategoryNumber()
				{
					var nrlower = 1;
					var nrupper = 2;
					for (var cat = 1; cat <= 15; cat++) {
						//Positive numbers
						for (var nr = nrlower; nr<nrupper; nr++) {
							category[32767+nr] = cat;
							bitcode[32767+nr] = [];
							bitcode[32767+nr][1] = cat;
							bitcode[32767+nr][0] = nr;
						}
						//Negative numbers
						for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
							category[32767+nrneg] = cat;
							bitcode[32767+nrneg] = [];
							bitcode[32767+nrneg][1] = cat;
							bitcode[32767+nrneg][0] = nrupper-1+nrneg;
						}
						nrlower <<= 1;
						nrupper <<= 1;
					}
				}
				
				function initRGBYUVTable() {
					for(var i = 0; i < 256;i++) {
						RGB_YUV_TABLE[i]      		=  19595 * i;
						RGB_YUV_TABLE[(i+ 256)>>0] 	=  38470 * i;
						RGB_YUV_TABLE[(i+ 512)>>0] 	=   7471 * i + 0x8000;
						RGB_YUV_TABLE[(i+ 768)>>0] 	= -11059 * i;
						RGB_YUV_TABLE[(i+1024)>>0] 	= -21709 * i;
						RGB_YUV_TABLE[(i+1280)>>0] 	=  32768 * i + 0x807FFF;
						RGB_YUV_TABLE[(i+1536)>>0] 	= -27439 * i;
						RGB_YUV_TABLE[(i+1792)>>0] 	= - 5329 * i;
					}
				}
				
				// IO functions
				function writeBits(bs)
				{
					var value = bs[0];
					var posval = bs[1]-1;
					while ( posval >= 0 ) {
						if (value & (1 << posval) ) {
							bytenew |= (1 << bytepos);
						}
						posval--;
						bytepos--;
						if (bytepos < 0) {
							if (bytenew == 0xFF) {
								writeByte(0xFF);
								writeByte(0);
							}
							else {
								writeByte(bytenew);
							}
							bytepos=7;
							bytenew=0;
						}
					}
				}
			
				function writeByte(value)
				{
					//byteout.push(clt[value]); // write char directly instead of converting later
		      byteout.push(value);
				}
			
				function writeWord(value)
				{
					writeByte((value>>8)&0xFF);
					writeByte((value   )&0xFF);
				}
				
				// DCT & quantization core
				function fDCTQuant(data, fdtbl)
				{
					var d0, d1, d2, d3, d4, d5, d6, d7;
					/* Pass 1: process rows. */
					var dataOff=0;
					var i;
					var I8 = 8;
					var I64 = 64;
					for (i=0; i<I8; ++i)
					{
						d0 = data[dataOff];
						d1 = data[dataOff+1];
						d2 = data[dataOff+2];
						d3 = data[dataOff+3];
						d4 = data[dataOff+4];
						d5 = data[dataOff+5];
						d6 = data[dataOff+6];
						d7 = data[dataOff+7];
						
						var tmp0 = d0 + d7;
						var tmp7 = d0 - d7;
						var tmp1 = d1 + d6;
						var tmp6 = d1 - d6;
						var tmp2 = d2 + d5;
						var tmp5 = d2 - d5;
						var tmp3 = d3 + d4;
						var tmp4 = d3 - d4;
			
						/* Even part */
						var tmp10 = tmp0 + tmp3;	/* phase 2 */
						var tmp13 = tmp0 - tmp3;
						var tmp11 = tmp1 + tmp2;
						var tmp12 = tmp1 - tmp2;
			
						data[dataOff] = tmp10 + tmp11; /* phase 3 */
						data[dataOff+4] = tmp10 - tmp11;
			
						var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
						data[dataOff+2] = tmp13 + z1; /* phase 5 */
						data[dataOff+6] = tmp13 - z1;
			
						/* Odd part */
						tmp10 = tmp4 + tmp5; /* phase 2 */
						tmp11 = tmp5 + tmp6;
						tmp12 = tmp6 + tmp7;
			
						/* The rotator is modified from fig 4-8 to avoid extra negations. */
						var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
						var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
						var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
						var z3 = tmp11 * 0.707106781; /* c4 */
			
						var z11 = tmp7 + z3;	/* phase 5 */
						var z13 = tmp7 - z3;
			
						data[dataOff+5] = z13 + z2;	/* phase 6 */
						data[dataOff+3] = z13 - z2;
						data[dataOff+1] = z11 + z4;
						data[dataOff+7] = z11 - z4;
			
						dataOff += 8; /* advance pointer to next row */
					}
			
					/* Pass 2: process columns. */
					dataOff = 0;
					for (i=0; i<I8; ++i)
					{
						d0 = data[dataOff];
						d1 = data[dataOff + 8];
						d2 = data[dataOff + 16];
						d3 = data[dataOff + 24];
						d4 = data[dataOff + 32];
						d5 = data[dataOff + 40];
						d6 = data[dataOff + 48];
						d7 = data[dataOff + 56];
						
						var tmp0p2 = d0 + d7;
						var tmp7p2 = d0 - d7;
						var tmp1p2 = d1 + d6;
						var tmp6p2 = d1 - d6;
						var tmp2p2 = d2 + d5;
						var tmp5p2 = d2 - d5;
						var tmp3p2 = d3 + d4;
						var tmp4p2 = d3 - d4;
			
						/* Even part */
						var tmp10p2 = tmp0p2 + tmp3p2;	/* phase 2 */
						var tmp13p2 = tmp0p2 - tmp3p2;
						var tmp11p2 = tmp1p2 + tmp2p2;
						var tmp12p2 = tmp1p2 - tmp2p2;
			
						data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
						data[dataOff+32] = tmp10p2 - tmp11p2;
			
						var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
						data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
						data[dataOff+48] = tmp13p2 - z1p2;
			
						/* Odd part */
						tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
						tmp11p2 = tmp5p2 + tmp6p2;
						tmp12p2 = tmp6p2 + tmp7p2;
			
						/* The rotator is modified from fig 4-8 to avoid extra negations. */
						var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
						var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
						var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
						var z3p2 = tmp11p2 * 0.707106781; /* c4 */
			
						var z11p2 = tmp7p2 + z3p2;	/* phase 5 */
						var z13p2 = tmp7p2 - z3p2;
			
						data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
						data[dataOff+24] = z13p2 - z2p2;
						data[dataOff+ 8] = z11p2 + z4p2;
						data[dataOff+56] = z11p2 - z4p2;
			
						dataOff++; /* advance pointer to next column */
					}
			
					// Quantize/descale the coefficients
					var fDCTQuant;
					for (i=0; i<I64; ++i)
					{
						// Apply the quantization and scaling factor & Round to nearest integer
						fDCTQuant = data[i]*fdtbl[i];
						outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
						//outputfDCTQuant[i] = fround(fDCTQuant);

					}
					return outputfDCTQuant;
				}
				
				function writeAPP0()
				{
					writeWord(0xFFE0); // marker
					writeWord(16); // length
					writeByte(0x4A); // J
					writeByte(0x46); // F
					writeByte(0x49); // I
					writeByte(0x46); // F
					writeByte(0); // = "JFIF",'\0'
					writeByte(1); // versionhi
					writeByte(1); // versionlo
					writeByte(0); // xyunits
					writeWord(1); // xdensity
					writeWord(1); // ydensity
					writeByte(0); // thumbnwidth
					writeByte(0); // thumbnheight
				}

				function writeAPP1(exifBuffer) {
					if (!exifBuffer) return;

					writeWord(0xFFE1); // APP1 marker

					if (exifBuffer[0] === 0x45 &&
							exifBuffer[1] === 0x78 &&
							exifBuffer[2] === 0x69 &&
							exifBuffer[3] === 0x66) {
						// Buffer already starts with EXIF, just use it directly
						writeWord(exifBuffer.length + 2); // length is buffer + length itself!
					} else {
						// Buffer doesn't start with EXIF, write it for them
						writeWord(exifBuffer.length + 5 + 2); // length is buffer + EXIF\0 + length itself!
						writeByte(0x45); // E
						writeByte(0x78); // X
						writeByte(0x69); // I
						writeByte(0x66); // F
						writeByte(0); // = "EXIF",'\0'
					}

					for (var i = 0; i < exifBuffer.length; i++) {
						writeByte(exifBuffer[i]);
					}
				}

				function writeSOF0(width, height)
				{
					writeWord(0xFFC0); // marker
					writeWord(17);   // length, truecolor YUV JPG
					writeByte(8);    // precision
					writeWord(height);
					writeWord(width);
					writeByte(3);    // nrofcomponents
					writeByte(1);    // IdY
					writeByte(0x11); // HVY
					writeByte(0);    // QTY
					writeByte(2);    // IdU
					writeByte(0x11); // HVU
					writeByte(1);    // QTU
					writeByte(3);    // IdV
					writeByte(0x11); // HVV
					writeByte(1);    // QTV
				}
			
				function writeDQT()
				{
					writeWord(0xFFDB); // marker
					writeWord(132);	   // length
					writeByte(0);
					for (var i=0; i<64; i++) {
						writeByte(YTable[i]);
					}
					writeByte(1);
					for (var j=0; j<64; j++) {
						writeByte(UVTable[j]);
					}
				}
			
				function writeDHT()
				{
					writeWord(0xFFC4); // marker
					writeWord(0x01A2); // length
			
					writeByte(0); // HTYDCinfo
					for (var i=0; i<16; i++) {
						writeByte(std_dc_luminance_nrcodes[i+1]);
					}
					for (var j=0; j<=11; j++) {
						writeByte(std_dc_luminance_values[j]);
					}
			
					writeByte(0x10); // HTYACinfo
					for (var k=0; k<16; k++) {
						writeByte(std_ac_luminance_nrcodes[k+1]);
					}
					for (var l=0; l<=161; l++) {
						writeByte(std_ac_luminance_values[l]);
					}
			
					writeByte(1); // HTUDCinfo
					for (var m=0; m<16; m++) {
						writeByte(std_dc_chrominance_nrcodes[m+1]);
					}
					for (var n=0; n<=11; n++) {
						writeByte(std_dc_chrominance_values[n]);
					}
			
					writeByte(0x11); // HTUACinfo
					for (var o=0; o<16; o++) {
						writeByte(std_ac_chrominance_nrcodes[o+1]);
					}
					for (var p=0; p<=161; p++) {
						writeByte(std_ac_chrominance_values[p]);
					}
				}
				
				function writeCOM(comments)
				{
					if (typeof comments === "undefined" || comments.constructor !== Array) return;
					comments.forEach(e => {
						if (typeof e !== "string") return;
						writeWord(0xFFFE); // marker
						var l = e.length;
						writeWord(l + 2); // length itself as well
						var i;
						for (i = 0; i < l; i++)
							writeByte(e.charCodeAt(i));
					});
				}
			
				function writeSOS()
				{
					writeWord(0xFFDA); // marker
					writeWord(12); // length
					writeByte(3); // nrofcomponents
					writeByte(1); // IdY
					writeByte(0); // HTY
					writeByte(2); // IdU
					writeByte(0x11); // HTU
					writeByte(3); // IdV
					writeByte(0x11); // HTV
					writeByte(0); // Ss
					writeByte(0x3f); // Se
					writeByte(0); // Bf
				}
				
				function processDU(CDU, fdtbl, DC, HTDC, HTAC){
					var EOB = HTAC[0x00];
					var M16zeroes = HTAC[0xF0];
					var pos;
					var I16 = 16;
					var I63 = 63;
					var I64 = 64;
					var DU_DCT = fDCTQuant(CDU, fdtbl);
					//ZigZag reorder
					for (var j=0;j<I64;++j) {
						DU[ZigZag[j]]=DU_DCT[j];
					}
					var Diff = DU[0] - DC; DC = DU[0];
					//Encode DC
					if (Diff==0) {
						writeBits(HTDC[0]); // Diff might be 0
					} else {
						pos = 32767+Diff;
						writeBits(HTDC[category[pos]]);
						writeBits(bitcode[pos]);
					}
					//Encode ACs
					var end0pos = 63; // was const... which is crazy
					for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {}				//end0pos = first element in reverse order !=0
					if ( end0pos == 0) {
						writeBits(EOB);
						return DC;
					}
					var i = 1;
					var lng;
					while ( i <= end0pos ) {
						var startpos = i;
						for (; (DU[i]==0) && (i<=end0pos); ++i) {}
						var nrzeroes = i-startpos;
						if ( nrzeroes >= I16 ) {
							lng = nrzeroes>>4;
							for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
								writeBits(M16zeroes);
							nrzeroes = nrzeroes&0xF;
						}
						pos = 32767+DU[i];
						writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
						writeBits(bitcode[pos]);
						i++;
					}
					if ( end0pos != I63 ) {
						writeBits(EOB);
					}
					return DC;
				}

				function initCharLookupTable(){
					var sfcc = String.fromCharCode;
					for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
						clt[i] = sfcc(i);
					}
				}
				
				this.encode = function(image,quality) // image data object
				{
					new Date().getTime();
					
					if(quality) setQuality(quality);
					
					// Initialize bit writer
					byteout = new Array();
					bytenew=0;
					bytepos=7;
			
					// Add JPEG headers
					writeWord(0xFFD8); // SOI
					writeAPP0();
					writeCOM(image.comments);
					writeAPP1(image.exifBuffer);
					writeDQT();
					writeSOF0(image.width,image.height);
					writeDHT();
					writeSOS();

			
					// Encode 8x8 macroblocks
					var DCY=0;
					var DCU=0;
					var DCV=0;
					
					bytenew=0;
					bytepos=7;
					
					
					this.encode.displayName = "_encode_";

					var imageData = image.data;
					var width = image.width;
					var height = image.height;

					var quadWidth = width*4;
					
					var x, y = 0;
					var r, g, b;
					var start,p, col,row,pos;
					while(y < height){
						x = 0;
						while(x < quadWidth){
						start = quadWidth * y + x;
						p = start;
						col = -1;
						row = 0;
						
						for(pos=0; pos < 64; pos++){
							row = pos >> 3;// /8
							col = ( pos & 7 ) * 4; // %8
							p = start + ( row * quadWidth ) + col;		
							
							if(y+row >= height){ // padding bottom
								p-= (quadWidth*(y+1+row-height));
							}

							if(x+col >= quadWidth){ // padding right	
								p-= ((x+col) - quadWidth +4);
							}
							
							r = imageData[ p++ ];
							g = imageData[ p++ ];
							b = imageData[ p++ ];
							
							
							/* // calculate YUV values dynamically
							YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
							UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
							VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
							*/
							
							// use lookup table (slightly faster)
							YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
							UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
							VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;

						}
						
						DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
						DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
						DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
						x+=32;
						}
						y+=8;
					}
					
					
					////////////////////////////////////////////////////////////////
			
					// Do the bit alignment of the EOI marker
					if ( bytepos >= 0 ) {
						var fillbits = [];
						fillbits[1] = bytepos+1;
						fillbits[0] = (1<<(bytepos+1))-1;
						writeBits(fillbits);
					}
			
					writeWord(0xFFD9); //EOI
		      return Buffer$1.from(byteout);
			};
			
			function setQuality(quality){
				if (quality <= 0) {
					quality = 1;
				}
				if (quality > 100) {
					quality = 100;
				}
				
				if(currentQuality == quality) return // don't recalc if unchanged
				
				var sf = 0;
				if (quality < 50) {
					sf = Math.floor(5000 / quality);
				} else {
					sf = Math.floor(200 - quality*2);
				}
				
				initQuantTables(sf);
				currentQuality = quality;
				//console.log('Quality set to: '+quality +'%');
			}
			
			function init(){
				var time_start = new Date().getTime();
				if(!quality) quality = 50;
				// Create tables
				initCharLookupTable();
				initHuffmanTbl();
				initCategoryNumber();
				initRGBYUVTable();
				
				setQuality(quality);
				new Date().getTime() - time_start;
		    	//console.log('Initialization '+ duration + 'ms');
			}
			
			init();
			
		}
		{
			module.exports = encode;
		}

		function encode(imgData, qu) {
		  if (typeof qu === 'undefined') qu = 50;
		  var encoder = new JPEGEncoder(qu);
			var data = encoder.encode(imgData, qu);
		  return {
		    data: data,
		    width: imgData.width,
		    height: imgData.height,
		  };
		}
	} (encoder));

	var decoder = {exports: {}};

	(function (module) {
		/*
		   Copyright 2011 notmasteryet

		   Licensed under the Apache License, Version 2.0 (the "License");
		   you may not use this file except in compliance with the License.
		   You may obtain a copy of the License at

		       http://www.apache.org/licenses/LICENSE-2.0

		   Unless required by applicable law or agreed to in writing, software
		   distributed under the License is distributed on an "AS IS" BASIS,
		   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		   See the License for the specific language governing permissions and
		   limitations under the License.
		*/

		// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
		//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
		// - The JFIF specification can be found in the JPEG File Interchange Format
		//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
		// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
		//   in PostScript Level 2, Technical Note #5116
		//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

		var JpegImage = (function jpegImage() {
		  var dctZigZag = new Int32Array([
		     0,
		     1,  8,
		    16,  9,  2,
		     3, 10, 17, 24,
		    32, 25, 18, 11, 4,
		     5, 12, 19, 26, 33, 40,
		    48, 41, 34, 27, 20, 13,  6,
		     7, 14, 21, 28, 35, 42, 49, 56,
		    57, 50, 43, 36, 29, 22, 15,
		    23, 30, 37, 44, 51, 58,
		    59, 52, 45, 38, 31,
		    39, 46, 53, 60,
		    61, 54, 47,
		    55, 62,
		    63
		  ]);

		  var dctCos1  =  4017;   // cos(pi/16)
		  var dctSin1  =   799;   // sin(pi/16)
		  var dctCos3  =  3406;   // cos(3*pi/16)
		  var dctSin3  =  2276;   // sin(3*pi/16)
		  var dctCos6  =  1567;   // cos(6*pi/16)
		  var dctSin6  =  3784;   // sin(6*pi/16)
		  var dctSqrt2 =  5793;   // sqrt(2)
		  var dctSqrt1d2 = 2896;  // sqrt(2) / 2

		  function constructor() {
		  }

		  function buildHuffmanTable(codeLengths, values) {
		    var k = 0, code = [], i, j, length = 16;
		    while (length > 0 && !codeLengths[length - 1])
		      length--;
		    code.push({children: [], index: 0});
		    var p = code[0], q;
		    for (i = 0; i < length; i++) {
		      for (j = 0; j < codeLengths[i]; j++) {
		        p = code.pop();
		        p.children[p.index] = values[k];
		        while (p.index > 0) {
		          if (code.length === 0)
		            throw new Error('Could not recreate Huffman Table');
		          p = code.pop();
		        }
		        p.index++;
		        code.push(p);
		        while (code.length <= i) {
		          code.push(q = {children: [], index: 0});
		          p.children[p.index] = q.children;
		          p = q;
		        }
		        k++;
		      }
		      if (i + 1 < length) {
		        // p here points to last code
		        code.push(q = {children: [], index: 0});
		        p.children[p.index] = q.children;
		        p = q;
		      }
		    }
		    return code[0].children;
		  }

		  function decodeScan(data, offset,
		                      frame, components, resetInterval,
		                      spectralStart, spectralEnd,
		                      successivePrev, successive, opts) {
		    frame.precision;
		    frame.samplesPerLine;
		    frame.scanLines;
		    var mcusPerLine = frame.mcusPerLine;
		    var progressive = frame.progressive;
		    frame.maxH; frame.maxV;

		    var startOffset = offset, bitsData = 0, bitsCount = 0;
		    function readBit() {
		      if (bitsCount > 0) {
		        bitsCount--;
		        return (bitsData >> bitsCount) & 1;
		      }
		      bitsData = data[offset++];
		      if (bitsData == 0xFF) {
		        var nextByte = data[offset++];
		        if (nextByte) {
		          throw new Error("unexpected marker: " + ((bitsData << 8) | nextByte).toString(16));
		        }
		        // unstuff 0
		      }
		      bitsCount = 7;
		      return bitsData >>> 7;
		    }
		    function decodeHuffman(tree) {
		      var node = tree, bit;
		      while ((bit = readBit()) !== null) {
		        node = node[bit];
		        if (typeof node === 'number')
		          return node;
		        if (typeof node !== 'object')
		          throw new Error("invalid huffman sequence");
		      }
		      return null;
		    }
		    function receive(length) {
		      var n = 0;
		      while (length > 0) {
		        var bit = readBit();
		        if (bit === null) return;
		        n = (n << 1) | bit;
		        length--;
		      }
		      return n;
		    }
		    function receiveAndExtend(length) {
		      var n = receive(length);
		      if (n >= 1 << (length - 1))
		        return n;
		      return n + (-1 << length) + 1;
		    }
		    function decodeBaseline(component, zz) {
		      var t = decodeHuffman(component.huffmanTableDC);
		      var diff = t === 0 ? 0 : receiveAndExtend(t);
		      zz[0]= (component.pred += diff);
		      var k = 1;
		      while (k < 64) {
		        var rs = decodeHuffman(component.huffmanTableAC);
		        var s = rs & 15, r = rs >> 4;
		        if (s === 0) {
		          if (r < 15)
		            break;
		          k += 16;
		          continue;
		        }
		        k += r;
		        var z = dctZigZag[k];
		        zz[z] = receiveAndExtend(s);
		        k++;
		      }
		    }
		    function decodeDCFirst(component, zz) {
		      var t = decodeHuffman(component.huffmanTableDC);
		      var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
		      zz[0] = (component.pred += diff);
		    }
		    function decodeDCSuccessive(component, zz) {
		      zz[0] |= readBit() << successive;
		    }
		    var eobrun = 0;
		    function decodeACFirst(component, zz) {
		      if (eobrun > 0) {
		        eobrun--;
		        return;
		      }
		      var k = spectralStart, e = spectralEnd;
		      while (k <= e) {
		        var rs = decodeHuffman(component.huffmanTableAC);
		        var s = rs & 15, r = rs >> 4;
		        if (s === 0) {
		          if (r < 15) {
		            eobrun = receive(r) + (1 << r) - 1;
		            break;
		          }
		          k += 16;
		          continue;
		        }
		        k += r;
		        var z = dctZigZag[k];
		        zz[z] = receiveAndExtend(s) * (1 << successive);
		        k++;
		      }
		    }
		    var successiveACState = 0, successiveACNextValue;
		    function decodeACSuccessive(component, zz) {
		      var k = spectralStart, e = spectralEnd, r = 0;
		      while (k <= e) {
		        var z = dctZigZag[k];
		        var direction = zz[z] < 0 ? -1 : 1;
		        switch (successiveACState) {
		        case 0: // initial state
		          var rs = decodeHuffman(component.huffmanTableAC);
		          var s = rs & 15, r = rs >> 4;
		          if (s === 0) {
		            if (r < 15) {
		              eobrun = receive(r) + (1 << r);
		              successiveACState = 4;
		            } else {
		              r = 16;
		              successiveACState = 1;
		            }
		          } else {
		            if (s !== 1)
		              throw new Error("invalid ACn encoding");
		            successiveACNextValue = receiveAndExtend(s);
		            successiveACState = r ? 2 : 3;
		          }
		          continue;
		        case 1: // skipping r zero items
		        case 2:
		          if (zz[z])
		            zz[z] += (readBit() << successive) * direction;
		          else {
		            r--;
		            if (r === 0)
		              successiveACState = successiveACState == 2 ? 3 : 0;
		          }
		          break;
		        case 3: // set value for a zero item
		          if (zz[z])
		            zz[z] += (readBit() << successive) * direction;
		          else {
		            zz[z] = successiveACNextValue << successive;
		            successiveACState = 0;
		          }
		          break;
		        case 4: // eob
		          if (zz[z])
		            zz[z] += (readBit() << successive) * direction;
		          break;
		        }
		        k++;
		      }
		      if (successiveACState === 4) {
		        eobrun--;
		        if (eobrun === 0)
		          successiveACState = 0;
		      }
		    }
		    function decodeMcu(component, decode, mcu, row, col) {
		      var mcuRow = (mcu / mcusPerLine) | 0;
		      var mcuCol = mcu % mcusPerLine;
		      var blockRow = mcuRow * component.v + row;
		      var blockCol = mcuCol * component.h + col;
		      // If the block is missing and we're in tolerant mode, just skip it.
		      if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
		        return;
		      decode(component, component.blocks[blockRow][blockCol]);
		    }
		    function decodeBlock(component, decode, mcu) {
		      var blockRow = (mcu / component.blocksPerLine) | 0;
		      var blockCol = mcu % component.blocksPerLine;
		      // If the block is missing and we're in tolerant mode, just skip it.
		      if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
		        return;
		      decode(component, component.blocks[blockRow][blockCol]);
		    }

		    var componentsLength = components.length;
		    var component, i, j, k, n;
		    var decodeFn;
		    if (progressive) {
		      if (spectralStart === 0)
		        decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
		      else
		        decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
		    } else {
		      decodeFn = decodeBaseline;
		    }

		    var mcu = 0, marker;
		    var mcuExpected;
		    if (componentsLength == 1) {
		      mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
		    } else {
		      mcuExpected = mcusPerLine * frame.mcusPerColumn;
		    }
		    if (!resetInterval) resetInterval = mcuExpected;

		    var h, v;
		    while (mcu < mcuExpected) {
		      // reset interval stuff
		      for (i = 0; i < componentsLength; i++)
		        components[i].pred = 0;
		      eobrun = 0;

		      if (componentsLength == 1) {
		        component = components[0];
		        for (n = 0; n < resetInterval; n++) {
		          decodeBlock(component, decodeFn, mcu);
		          mcu++;
		        }
		      } else {
		        for (n = 0; n < resetInterval; n++) {
		          for (i = 0; i < componentsLength; i++) {
		            component = components[i];
		            h = component.h;
		            v = component.v;
		            for (j = 0; j < v; j++) {
		              for (k = 0; k < h; k++) {
		                decodeMcu(component, decodeFn, mcu, j, k);
		              }
		            }
		          }
		          mcu++;

		          // If we've reached our expected MCU's, stop decoding
		          if (mcu === mcuExpected) break;
		        }
		      }

		      if (mcu === mcuExpected) {
		        // Skip trailing bytes at the end of the scan - until we reach the next marker
		        do {
		          if (data[offset] === 0xFF) {
		            if (data[offset + 1] !== 0x00) {
		              break;
		            }
		          }
		          offset += 1;
		        } while (offset < data.length - 2);
		      }

		      // find marker
		      bitsCount = 0;
		      marker = (data[offset] << 8) | data[offset + 1];
		      if (marker < 0xFF00) {
		        throw new Error("marker was not found");
		      }

		      if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
		        offset += 2;
		      }
		      else
		        break;
		    }

		    return offset - startOffset;
		  }

		  function buildComponentData(frame, component) {
		    var lines = [];
		    var blocksPerLine = component.blocksPerLine;
		    var blocksPerColumn = component.blocksPerColumn;
		    var samplesPerLine = blocksPerLine << 3;
		    // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
		    var R = new Int32Array(64), r = new Uint8Array(64);

		    // A port of poppler's IDCT method which in turn is taken from:
		    //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
		    //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
		    //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
		    //   988-991.
		    function quantizeAndInverse(zz, dataOut, dataIn) {
		      var qt = component.quantizationTable;
		      var v0, v1, v2, v3, v4, v5, v6, v7, t;
		      var p = dataIn;
		      var i;

		      // dequant
		      for (i = 0; i < 64; i++)
		        p[i] = zz[i] * qt[i];

		      // inverse DCT on rows
		      for (i = 0; i < 8; ++i) {
		        var row = 8 * i;

		        // check for all-zero AC coefficients
		        if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
		            p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
		            p[7 + row] == 0) {
		          t = (dctSqrt2 * p[0 + row] + 512) >> 10;
		          p[0 + row] = t;
		          p[1 + row] = t;
		          p[2 + row] = t;
		          p[3 + row] = t;
		          p[4 + row] = t;
		          p[5 + row] = t;
		          p[6 + row] = t;
		          p[7 + row] = t;
		          continue;
		        }

		        // stage 4
		        v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
		        v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
		        v2 = p[2 + row];
		        v3 = p[6 + row];
		        v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
		        v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
		        v5 = p[3 + row] << 4;
		        v6 = p[5 + row] << 4;

		        // stage 3
		        t = (v0 - v1+ 1) >> 1;
		        v0 = (v0 + v1 + 1) >> 1;
		        v1 = t;
		        t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
		        v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
		        v3 = t;
		        t = (v4 - v6 + 1) >> 1;
		        v4 = (v4 + v6 + 1) >> 1;
		        v6 = t;
		        t = (v7 + v5 + 1) >> 1;
		        v5 = (v7 - v5 + 1) >> 1;
		        v7 = t;

		        // stage 2
		        t = (v0 - v3 + 1) >> 1;
		        v0 = (v0 + v3 + 1) >> 1;
		        v3 = t;
		        t = (v1 - v2 + 1) >> 1;
		        v1 = (v1 + v2 + 1) >> 1;
		        v2 = t;
		        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
		        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
		        v7 = t;
		        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
		        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
		        v6 = t;

		        // stage 1
		        p[0 + row] = v0 + v7;
		        p[7 + row] = v0 - v7;
		        p[1 + row] = v1 + v6;
		        p[6 + row] = v1 - v6;
		        p[2 + row] = v2 + v5;
		        p[5 + row] = v2 - v5;
		        p[3 + row] = v3 + v4;
		        p[4 + row] = v3 - v4;
		      }

		      // inverse DCT on columns
		      for (i = 0; i < 8; ++i) {
		        var col = i;

		        // check for all-zero AC coefficients
		        if (p[1*8 + col] == 0 && p[2*8 + col] == 0 && p[3*8 + col] == 0 &&
		            p[4*8 + col] == 0 && p[5*8 + col] == 0 && p[6*8 + col] == 0 &&
		            p[7*8 + col] == 0) {
		          t = (dctSqrt2 * dataIn[i+0] + 8192) >> 14;
		          p[0*8 + col] = t;
		          p[1*8 + col] = t;
		          p[2*8 + col] = t;
		          p[3*8 + col] = t;
		          p[4*8 + col] = t;
		          p[5*8 + col] = t;
		          p[6*8 + col] = t;
		          p[7*8 + col] = t;
		          continue;
		        }

		        // stage 4
		        v0 = (dctSqrt2 * p[0*8 + col] + 2048) >> 12;
		        v1 = (dctSqrt2 * p[4*8 + col] + 2048) >> 12;
		        v2 = p[2*8 + col];
		        v3 = p[6*8 + col];
		        v4 = (dctSqrt1d2 * (p[1*8 + col] - p[7*8 + col]) + 2048) >> 12;
		        v7 = (dctSqrt1d2 * (p[1*8 + col] + p[7*8 + col]) + 2048) >> 12;
		        v5 = p[3*8 + col];
		        v6 = p[5*8 + col];

		        // stage 3
		        t = (v0 - v1 + 1) >> 1;
		        v0 = (v0 + v1 + 1) >> 1;
		        v1 = t;
		        t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
		        v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
		        v3 = t;
		        t = (v4 - v6 + 1) >> 1;
		        v4 = (v4 + v6 + 1) >> 1;
		        v6 = t;
		        t = (v7 + v5 + 1) >> 1;
		        v5 = (v7 - v5 + 1) >> 1;
		        v7 = t;

		        // stage 2
		        t = (v0 - v3 + 1) >> 1;
		        v0 = (v0 + v3 + 1) >> 1;
		        v3 = t;
		        t = (v1 - v2 + 1) >> 1;
		        v1 = (v1 + v2 + 1) >> 1;
		        v2 = t;
		        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
		        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
		        v7 = t;
		        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
		        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
		        v6 = t;

		        // stage 1
		        p[0*8 + col] = v0 + v7;
		        p[7*8 + col] = v0 - v7;
		        p[1*8 + col] = v1 + v6;
		        p[6*8 + col] = v1 - v6;
		        p[2*8 + col] = v2 + v5;
		        p[5*8 + col] = v2 - v5;
		        p[3*8 + col] = v3 + v4;
		        p[4*8 + col] = v3 - v4;
		      }

		      // convert to 8-bit integers
		      for (i = 0; i < 64; ++i) {
		        var sample = 128 + ((p[i] + 8) >> 4);
		        dataOut[i] = sample < 0 ? 0 : sample > 0xFF ? 0xFF : sample;
		      }
		    }

		    requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);

		    var i, j;
		    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
		      var scanLine = blockRow << 3;
		      for (i = 0; i < 8; i++)
		        lines.push(new Uint8Array(samplesPerLine));
		      for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
		        quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);

		        var offset = 0, sample = blockCol << 3;
		        for (j = 0; j < 8; j++) {
		          var line = lines[scanLine + j];
		          for (i = 0; i < 8; i++)
		            line[sample + i] = r[offset++];
		        }
		      }
		    }
		    return lines;
		  }

		  function clampTo8bit(a) {
		    return a < 0 ? 0 : a > 255 ? 255 : a;
		  }

		  constructor.prototype = {
		    load: function load(path) {
		      var xhr = new XMLHttpRequest();
		      xhr.open("GET", path, true);
		      xhr.responseType = "arraybuffer";
		      xhr.onload = (function() {
		        // TODO catch parse error
		        var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
		        this.parse(data);
		        if (this.onload)
		          this.onload();
		      }).bind(this);
		      xhr.send(null);
		    },
		    parse: function parse(data) {
		      var maxResolutionInPixels = this.opts.maxResolutionInMP * 1000 * 1000;
		      var offset = 0; data.length;
		      function readUint16() {
		        var value = (data[offset] << 8) | data[offset + 1];
		        offset += 2;
		        return value;
		      }
		      function readDataBlock() {
		        var length = readUint16();
		        var array = data.subarray(offset, offset + length - 2);
		        offset += array.length;
		        return array;
		      }
		      function prepareComponents(frame) {
		        // According to the JPEG standard, the sampling factor must be between 1 and 4
		        // See https://github.com/libjpeg-turbo/libjpeg-turbo/blob/9abeff46d87bd201a952e276f3e4339556a403a3/libjpeg.txt#L1138-L1146
		        var maxH = 1, maxV = 1;
		        var component, componentId;
		        for (componentId in frame.components) {
		          if (frame.components.hasOwnProperty(componentId)) {
		            component = frame.components[componentId];
		            if (maxH < component.h) maxH = component.h;
		            if (maxV < component.v) maxV = component.v;
		          }
		        }
		        var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
		        var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
		        for (componentId in frame.components) {
		          if (frame.components.hasOwnProperty(componentId)) {
		            component = frame.components[componentId];
		            var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
		            var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines  / 8) * component.v / maxV);
		            var blocksPerLineForMcu = mcusPerLine * component.h;
		            var blocksPerColumnForMcu = mcusPerColumn * component.v;
		            var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
		            var blocks = [];

		            // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
		            requestMemoryAllocation(blocksToAllocate * 256);

		            for (var i = 0; i < blocksPerColumnForMcu; i++) {
		              var row = [];
		              for (var j = 0; j < blocksPerLineForMcu; j++)
		                row.push(new Int32Array(64));
		              blocks.push(row);
		            }
		            component.blocksPerLine = blocksPerLine;
		            component.blocksPerColumn = blocksPerColumn;
		            component.blocks = blocks;
		          }
		        }
		        frame.maxH = maxH;
		        frame.maxV = maxV;
		        frame.mcusPerLine = mcusPerLine;
		        frame.mcusPerColumn = mcusPerColumn;
		      }
		      var jfif = null;
		      var adobe = null;
		      var frame, resetInterval;
		      var quantizationTables = [], frames = [];
		      var huffmanTablesAC = [], huffmanTablesDC = [];
		      var fileMarker = readUint16();
		      var malformedDataOffset = -1;
		      this.comments = [];
		      if (fileMarker != 0xFFD8) { // SOI (Start of Image)
		        throw new Error("SOI not found");
		      }

		      fileMarker = readUint16();
		      while (fileMarker != 0xFFD9) { // EOI (End of image)
		        var i, j;
		        switch(fileMarker) {
		          case 0xFF00: break;
		          case 0xFFE0: // APP0 (Application Specific)
		          case 0xFFE1: // APP1
		          case 0xFFE2: // APP2
		          case 0xFFE3: // APP3
		          case 0xFFE4: // APP4
		          case 0xFFE5: // APP5
		          case 0xFFE6: // APP6
		          case 0xFFE7: // APP7
		          case 0xFFE8: // APP8
		          case 0xFFE9: // APP9
		          case 0xFFEA: // APP10
		          case 0xFFEB: // APP11
		          case 0xFFEC: // APP12
		          case 0xFFED: // APP13
		          case 0xFFEE: // APP14
		          case 0xFFEF: // APP15
		          case 0xFFFE: // COM (Comment)
		            var appData = readDataBlock();

		            if (fileMarker === 0xFFFE) {
		              var comment = String.fromCharCode.apply(null, appData);
		              this.comments.push(comment);
		            }

		            if (fileMarker === 0xFFE0) {
		              if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
		                appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
		                jfif = {
		                  version: { major: appData[5], minor: appData[6] },
		                  densityUnits: appData[7],
		                  xDensity: (appData[8] << 8) | appData[9],
		                  yDensity: (appData[10] << 8) | appData[11],
		                  thumbWidth: appData[12],
		                  thumbHeight: appData[13],
		                  thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
		                };
		              }
		            }
		            // TODO APP1 - Exif
		            if (fileMarker === 0xFFE1) {
		              if (appData[0] === 0x45 &&
		                appData[1] === 0x78 &&
		                appData[2] === 0x69 &&
		                appData[3] === 0x66 &&
		                appData[4] === 0) { // 'EXIF\x00'
		                this.exifBuffer = appData.subarray(5, appData.length);
		              }
		            }

		            if (fileMarker === 0xFFEE) {
		              if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
		                appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
		                adobe = {
		                  version: appData[6],
		                  flags0: (appData[7] << 8) | appData[8],
		                  flags1: (appData[9] << 8) | appData[10],
		                  transformCode: appData[11]
		                };
		              }
		            }
		            break;

		          case 0xFFDB: // DQT (Define Quantization Tables)
		            var quantizationTablesLength = readUint16();
		            var quantizationTablesEnd = quantizationTablesLength + offset - 2;
		            while (offset < quantizationTablesEnd) {
		              var quantizationTableSpec = data[offset++];
		              requestMemoryAllocation(64 * 4);
		              var tableData = new Int32Array(64);
		              if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
		                for (j = 0; j < 64; j++) {
		                  var z = dctZigZag[j];
		                  tableData[z] = data[offset++];
		                }
		              } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
		                for (j = 0; j < 64; j++) {
		                  var z = dctZigZag[j];
		                  tableData[z] = readUint16();
		                }
		              } else
		                throw new Error("DQT: invalid table spec");
		              quantizationTables[quantizationTableSpec & 15] = tableData;
		            }
		            break;

		          case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
		          case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
		          case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
		            readUint16(); // skip data length
		            frame = {};
		            frame.extended = (fileMarker === 0xFFC1);
		            frame.progressive = (fileMarker === 0xFFC2);
		            frame.precision = data[offset++];
		            frame.scanLines = readUint16();
		            frame.samplesPerLine = readUint16();
		            frame.components = {};
		            frame.componentsOrder = [];

		            var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
		            if (pixelsInFrame > maxResolutionInPixels) {
		              var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
		              throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
		            }

		            var componentsCount = data[offset++], componentId;
		            for (i = 0; i < componentsCount; i++) {
		              componentId = data[offset];
		              var h = data[offset + 1] >> 4;
		              var v = data[offset + 1] & 15;
		              var qId = data[offset + 2];

		              if ( h <= 0 || v <= 0 ) {
		                throw new Error('Invalid sampling factor, expected values above 0');
		              }

		              frame.componentsOrder.push(componentId);
		              frame.components[componentId] = {
		                h: h,
		                v: v,
		                quantizationIdx: qId
		              };
		              offset += 3;
		            }
		            prepareComponents(frame);
		            frames.push(frame);
		            break;

		          case 0xFFC4: // DHT (Define Huffman Tables)
		            var huffmanLength = readUint16();
		            for (i = 2; i < huffmanLength;) {
		              var huffmanTableSpec = data[offset++];
		              var codeLengths = new Uint8Array(16);
		              var codeLengthSum = 0;
		              for (j = 0; j < 16; j++, offset++) {
		                codeLengthSum += (codeLengths[j] = data[offset]);
		              }
		              requestMemoryAllocation(16 + codeLengthSum);
		              var huffmanValues = new Uint8Array(codeLengthSum);
		              for (j = 0; j < codeLengthSum; j++, offset++)
		                huffmanValues[j] = data[offset];
		              i += 17 + codeLengthSum;

		              ((huffmanTableSpec >> 4) === 0 ?
		                huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
		                buildHuffmanTable(codeLengths, huffmanValues);
		            }
		            break;

		          case 0xFFDD: // DRI (Define Restart Interval)
		            readUint16(); // skip data length
		            resetInterval = readUint16();
		            break;

		          case 0xFFDC: // Number of Lines marker
		            readUint16(); // skip data length
		            readUint16(); // Ignore this data since it represents the image height
		            break;
		            
		          case 0xFFDA: // SOS (Start of Scan)
		            readUint16();
		            var selectorsCount = data[offset++];
		            var components = [], component;
		            for (i = 0; i < selectorsCount; i++) {
		              component = frame.components[data[offset++]];
		              var tableSpec = data[offset++];
		              component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
		              component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
		              components.push(component);
		            }
		            var spectralStart = data[offset++];
		            var spectralEnd = data[offset++];
		            var successiveApproximation = data[offset++];
		            var processed = decodeScan(data, offset,
		              frame, components, resetInterval,
		              spectralStart, spectralEnd,
		              successiveApproximation >> 4, successiveApproximation & 15, this.opts);
		            offset += processed;
		            break;

		          case 0xFFFF: // Fill bytes
		            if (data[offset] !== 0xFF) { // Avoid skipping a valid marker.
		              offset--;
		            }
		            break;
		          default:
		            if (data[offset - 3] == 0xFF &&
		                data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
		              // could be incorrect encoding -- last 0xFF byte of the previous
		              // block was eaten by the encoder
		              offset -= 3;
		              break;
		            }
		            else if (fileMarker === 0xE0 || fileMarker == 0xE1) {
		              // Recover from malformed APP1 markers popular in some phone models.
		              // See https://github.com/eugeneware/jpeg-js/issues/82
		              if (malformedDataOffset !== -1) {
		                throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
		              }
		              malformedDataOffset = offset - 1;
		              const nextOffset = readUint16();
		              if (data[offset + nextOffset - 2] === 0xFF) {
		                offset += nextOffset - 2;
		                break;
		              }
		            }
		            throw new Error("unknown JPEG marker " + fileMarker.toString(16));
		        }
		        fileMarker = readUint16();
		      }
		      if (frames.length != 1)
		        throw new Error("only single frame JPEGs supported");

		      // set each frame's components quantization table
		      for (var i = 0; i < frames.length; i++) {
		        var cp = frames[i].components;
		        for (var j in cp) {
		          cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
		          delete cp[j].quantizationIdx;
		        }
		      }

		      this.width = frame.samplesPerLine;
		      this.height = frame.scanLines;
		      this.jfif = jfif;
		      this.adobe = adobe;
		      this.components = [];
		      for (var i = 0; i < frame.componentsOrder.length; i++) {
		        var component = frame.components[frame.componentsOrder[i]];
		        this.components.push({
		          lines: buildComponentData(frame, component),
		          scaleX: component.h / frame.maxH,
		          scaleY: component.v / frame.maxV
		        });
		      }
		    },
		    getData: function getData(width, height) {
		      var scaleX = this.width / width, scaleY = this.height / height;

		      var component1, component2, component3, component4;
		      var component1Line, component2Line, component3Line, component4Line;
		      var x, y;
		      var offset = 0;
		      var Y, Cb, Cr, K, C, M, Ye, R, G, B;
		      var colorTransform;
		      var dataLength = width * height * this.components.length;
		      requestMemoryAllocation(dataLength);
		      var data = new Uint8Array(dataLength);
		      switch (this.components.length) {
		        case 1:
		          component1 = this.components[0];
		          for (y = 0; y < height; y++) {
		            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
		            for (x = 0; x < width; x++) {
		              Y = component1Line[0 | (x * component1.scaleX * scaleX)];

		              data[offset++] = Y;
		            }
		          }
		          break;
		        case 2:
		          // PDF might compress two component data in custom colorspace
		          component1 = this.components[0];
		          component2 = this.components[1];
		          for (y = 0; y < height; y++) {
		            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
		            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
		            for (x = 0; x < width; x++) {
		              Y = component1Line[0 | (x * component1.scaleX * scaleX)];
		              data[offset++] = Y;
		              Y = component2Line[0 | (x * component2.scaleX * scaleX)];
		              data[offset++] = Y;
		            }
		          }
		          break;
		        case 3:
		          // The default transform for three components is true
		          colorTransform = true;
		          // The adobe transform marker overrides any previous setting
		          if (this.adobe && this.adobe.transformCode)
		            colorTransform = true;
		          else if (typeof this.opts.colorTransform !== 'undefined')
		            colorTransform = !!this.opts.colorTransform;

		          component1 = this.components[0];
		          component2 = this.components[1];
		          component3 = this.components[2];
		          for (y = 0; y < height; y++) {
		            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
		            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
		            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
		            for (x = 0; x < width; x++) {
		              if (!colorTransform) {
		                R = component1Line[0 | (x * component1.scaleX * scaleX)];
		                G = component2Line[0 | (x * component2.scaleX * scaleX)];
		                B = component3Line[0 | (x * component3.scaleX * scaleX)];
		              } else {
		                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
		                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
		                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

		                R = clampTo8bit(Y + 1.402 * (Cr - 128));
		                G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
		                B = clampTo8bit(Y + 1.772 * (Cb - 128));
		              }

		              data[offset++] = R;
		              data[offset++] = G;
		              data[offset++] = B;
		            }
		          }
		          break;
		        case 4:
		          if (!this.adobe)
		            throw new Error('Unsupported color mode (4 components)');
		          // The default transform for four components is false
		          colorTransform = false;
		          // The adobe transform marker overrides any previous setting
		          if (this.adobe && this.adobe.transformCode)
		            colorTransform = true;
		          else if (typeof this.opts.colorTransform !== 'undefined')
		            colorTransform = !!this.opts.colorTransform;

		          component1 = this.components[0];
		          component2 = this.components[1];
		          component3 = this.components[2];
		          component4 = this.components[3];
		          for (y = 0; y < height; y++) {
		            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
		            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
		            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
		            component4Line = component4.lines[0 | (y * component4.scaleY * scaleY)];
		            for (x = 0; x < width; x++) {
		              if (!colorTransform) {
		                C = component1Line[0 | (x * component1.scaleX * scaleX)];
		                M = component2Line[0 | (x * component2.scaleX * scaleX)];
		                Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
		                K = component4Line[0 | (x * component4.scaleX * scaleX)];
		              } else {
		                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
		                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
		                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
		                K = component4Line[0 | (x * component4.scaleX * scaleX)];

		                C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
		                M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
		                Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
		              }
		              data[offset++] = 255-C;
		              data[offset++] = 255-M;
		              data[offset++] = 255-Ye;
		              data[offset++] = 255-K;
		            }
		          }
		          break;
		        default:
		          throw new Error('Unsupported color mode');
		      }
		      return data;
		    },
		    copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
		      var width = imageData.width, height = imageData.height;
		      var imageDataArray = imageData.data;
		      var data = this.getData(width, height);
		      var i = 0, j = 0, x, y;
		      var Y, K, C, M, R, G, B;
		      switch (this.components.length) {
		        case 1:
		          for (y = 0; y < height; y++) {
		            for (x = 0; x < width; x++) {
		              Y = data[i++];

		              imageDataArray[j++] = Y;
		              imageDataArray[j++] = Y;
		              imageDataArray[j++] = Y;
		              if (formatAsRGBA) {
		                imageDataArray[j++] = 255;
		              }
		            }
		          }
		          break;
		        case 3:
		          for (y = 0; y < height; y++) {
		            for (x = 0; x < width; x++) {
		              R = data[i++];
		              G = data[i++];
		              B = data[i++];

		              imageDataArray[j++] = R;
		              imageDataArray[j++] = G;
		              imageDataArray[j++] = B;
		              if (formatAsRGBA) {
		                imageDataArray[j++] = 255;
		              }
		            }
		          }
		          break;
		        case 4:
		          for (y = 0; y < height; y++) {
		            for (x = 0; x < width; x++) {
		              C = data[i++];
		              M = data[i++];
		              Y = data[i++];
		              K = data[i++];

		              R = 255 - clampTo8bit(C * (1 - K / 255) + K);
		              G = 255 - clampTo8bit(M * (1 - K / 255) + K);
		              B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

		              imageDataArray[j++] = R;
		              imageDataArray[j++] = G;
		              imageDataArray[j++] = B;
		              if (formatAsRGBA) {
		                imageDataArray[j++] = 255;
		              }
		            }
		          }
		          break;
		        default:
		          throw new Error('Unsupported color mode');
		      }
		    }
		  };


		  // We cap the amount of memory used by jpeg-js to avoid unexpected OOMs from untrusted content.
		  var totalBytesAllocated = 0;
		  var maxMemoryUsageBytes = 0;
		  function requestMemoryAllocation(increaseAmount = 0) {
		    var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
		    if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
		      var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
		      throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
		    }

		    totalBytesAllocated = totalMemoryImpactBytes;
		  }

		  constructor.resetMaxMemoryUsage = function (maxMemoryUsageBytes_) {
		    totalBytesAllocated = 0;
		    maxMemoryUsageBytes = maxMemoryUsageBytes_;
		  };

		  constructor.getBytesAllocated = function () {
		    return totalBytesAllocated;
		  };

		  constructor.requestMemoryAllocation = requestMemoryAllocation;

		  return constructor;
		})();

		{
			module.exports = decode;
		}

		function decode(jpegData, userOpts = {}) {
		  var defaultOpts = {
		    // "undefined" means "Choose whether to transform colors based on the image’s color model."
		    colorTransform: undefined,
		    useTArray: false,
		    formatAsRGBA: true,
		    tolerantDecoding: true,
		    maxResolutionInMP: 100, // Don't decode more than 100 megapixels
		    maxMemoryUsageInMB: 512, // Don't decode if memory footprint is more than 512MB
		  };

		  var opts = {...defaultOpts, ...userOpts};
		  var arr = new Uint8Array(jpegData);
		  var decoder = new JpegImage();
		  decoder.opts = opts;
		  // If this constructor ever supports async decoding this will need to be done differently.
		  // Until then, treating as singleton limit is fine.
		  JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
		  decoder.parse(arr);

		  var channels = (opts.formatAsRGBA) ? 4 : 3;
		  var bytesNeeded = decoder.width * decoder.height * channels;
		  try {
		    JpegImage.requestMemoryAllocation(bytesNeeded);
		    var image = {
		      width: decoder.width,
		      height: decoder.height,
		      exifBuffer: decoder.exifBuffer,
		      data: opts.useTArray ?
		        new Uint8Array(bytesNeeded) :
		        Buffer$1.alloc(bytesNeeded)
		    };
		    if(decoder.comments.length > 0) {
		      image["comments"] = decoder.comments;
		    }
		  } catch (err) {
		    if (err instanceof RangeError) {
		      throw new Error("Could not allocate enough memory for the image. " +
		                      "Required: " + bytesNeeded);
		    } 
		    
		    if (err instanceof ReferenceError) {
		      if (err.message === "Buffer is not defined") {
		        throw new Error("Buffer is not globally defined in this environment. " +
		                        "Consider setting useTArray to true");
		      }
		    }
		    throw err;
		  }

		  decoder.copyToImageData(image, opts.formatAsRGBA);

		  return image;
		}
	} (decoder));

	var encode = encoder.exports,
	    decode = decoder.exports;

	var jpegJs = {
	  encode: encode,
	  decode: decode
	};

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;
	if (typeof global$1.setTimeout === 'function') {
	    cachedSetTimeout = setTimeout;
	}
	if (typeof global$1.clearTimeout === 'function') {
	    cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	function nextTick(fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	}
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues
	var versions = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;

	function binding$1(name) {
	    throw new Error('process.binding is not supported');
	}

	function cwd () { return '/' }
	function chdir (dir) {
	    throw new Error('process.chdir is not supported');
	}function umask() { return 0; }

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance = global$1.performance || {};
	var performanceNow =
	  performance.now        ||
	  performance.mozNow     ||
	  performance.msNow      ||
	  performance.oNow       ||
	  performance.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime
	function hrtime(previousTimestamp){
	  var clocktime = performanceNow.call(performance)*1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor((clocktime%1)*1e9);
	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];
	    if (nanoseconds<0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }
	  return [seconds,nanoseconds]
	}

	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}

	var browser$1 = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding$1,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	var inherits;
	if (typeof Object.create === 'function'){
	  inherits = function inherits(ctor, superCtor) {
	    // implementation from standard node.js 'util' module
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  inherits = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}
	var inherits$1 = inherits;

	var formatRegExp = /%[sdj%]/g;
	function format(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect$1(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect$1(x);
	    }
	  }
	  return str;
	}

	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	function deprecate(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global$1.process)) {
	    return function() {
	      return deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (browser$1.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (browser$1.throwDeprecation) {
	        throw new Error(msg);
	      } else if (browser$1.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	}

	var debugs = {};
	var debugEnviron;
	function debuglog(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = browser$1.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = 0;
	      debugs[set] = function() {
	        var msg = format.apply(null, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	}

	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect$1(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    _extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}

	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect$1.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect$1.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect$1.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect$1.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect$1.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== inspect$1 &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var length = output.reduce(function(prev, cur) {
	    if (cur.indexOf('\n') >= 0) ;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}

	function isNull(arg) {
	  return arg === null;
	}

	function isNullOrUndefined(arg) {
	  return arg == null;
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isString(arg) {
	  return typeof arg === 'string';
	}

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}

	function isBuffer(maybeBuf) {
	  return Buffer$1.isBuffer(maybeBuf);
	}

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	function log() {
	  console.log('%s - %s', timestamp(), format.apply(null, arguments));
	}

	function _extend(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	}
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	var _polyfillNode_util = {
	  inherits: inherits$1,
	  _extend: _extend,
	  log: log,
	  isBuffer: isBuffer,
	  isPrimitive: isPrimitive,
	  isFunction: isFunction,
	  isError: isError,
	  isDate: isDate,
	  isObject: isObject,
	  isRegExp: isRegExp,
	  isUndefined: isUndefined,
	  isSymbol: isSymbol,
	  isString: isString,
	  isNumber: isNumber,
	  isNullOrUndefined: isNullOrUndefined,
	  isNull: isNull,
	  isBoolean: isBoolean,
	  isArray: isArray,
	  inspect: inspect$1,
	  deprecate: deprecate,
	  format: format,
	  debuglog: debuglog
	};

	var _polyfillNode_util$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		format: format,
		deprecate: deprecate,
		debuglog: debuglog,
		inspect: inspect$1,
		isArray: isArray,
		isBoolean: isBoolean,
		isNull: isNull,
		isNullOrUndefined: isNullOrUndefined,
		isNumber: isNumber,
		isString: isString,
		isSymbol: isSymbol,
		isUndefined: isUndefined,
		isRegExp: isRegExp,
		isObject: isObject,
		isDate: isDate,
		isError: isError,
		isFunction: isFunction,
		isPrimitive: isPrimitive,
		isBuffer: isBuffer,
		log: log,
		inherits: inherits$1,
		_extend: _extend,
		'default': _polyfillNode_util
	});

	var require$$0$3 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_util$1);

	var domain;

	// This constructor is used to store event handlers. Instantiating this is
	// faster than explicitly calling `Object.create(null)` to get a "clean" empty
	// object (tested with v8 v4.9).
	function EventHandlers() {}
	EventHandlers.prototype = Object.create(null);

	function EventEmitter() {
	  EventEmitter.init.call(this);
	}

	// nodejs oddity
	// require('events') === require('events').EventEmitter
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.usingDomains = false;

	EventEmitter.prototype.domain = undefined;
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	EventEmitter.init = function() {
	  this.domain = null;
	  if (EventEmitter.usingDomains) {
	    // if there is an active domain, then attach to it.
	    if (domain.active ) ;
	  }

	  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
	    this._events = new EventHandlers();
	    this._eventsCount = 0;
	  }

	  this._maxListeners = this._maxListeners || undefined;
	};

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
	  if (typeof n !== 'number' || n < 0 || isNaN(n))
	    throw new TypeError('"n" argument must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	function $getMaxListeners(that) {
	  if (that._maxListeners === undefined)
	    return EventEmitter.defaultMaxListeners;
	  return that._maxListeners;
	}

	EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
	  return $getMaxListeners(this);
	};

	// These standalone emit* functions are used to optimize calling of event
	// handlers for fast cases because emit() itself often has a variable number of
	// arguments and can be deoptimized because of that. These functions always have
	// the same number of arguments and thus do not get deoptimized, so the code
	// inside them can execute faster.
	function emitNone(handler, isFn, self) {
	  if (isFn)
	    handler.call(self);
	  else {
	    var len = handler.length;
	    var listeners = arrayClone(handler, len);
	    for (var i = 0; i < len; ++i)
	      listeners[i].call(self);
	  }
	}
	function emitOne(handler, isFn, self, arg1) {
	  if (isFn)
	    handler.call(self, arg1);
	  else {
	    var len = handler.length;
	    var listeners = arrayClone(handler, len);
	    for (var i = 0; i < len; ++i)
	      listeners[i].call(self, arg1);
	  }
	}
	function emitTwo(handler, isFn, self, arg1, arg2) {
	  if (isFn)
	    handler.call(self, arg1, arg2);
	  else {
	    var len = handler.length;
	    var listeners = arrayClone(handler, len);
	    for (var i = 0; i < len; ++i)
	      listeners[i].call(self, arg1, arg2);
	  }
	}
	function emitThree(handler, isFn, self, arg1, arg2, arg3) {
	  if (isFn)
	    handler.call(self, arg1, arg2, arg3);
	  else {
	    var len = handler.length;
	    var listeners = arrayClone(handler, len);
	    for (var i = 0; i < len; ++i)
	      listeners[i].call(self, arg1, arg2, arg3);
	  }
	}

	function emitMany(handler, isFn, self, args) {
	  if (isFn)
	    handler.apply(self, args);
	  else {
	    var len = handler.length;
	    var listeners = arrayClone(handler, len);
	    for (var i = 0; i < len; ++i)
	      listeners[i].apply(self, args);
	  }
	}

	EventEmitter.prototype.emit = function emit(type) {
	  var er, handler, len, args, i, events, domain;
	  var doError = (type === 'error');

	  events = this._events;
	  if (events)
	    doError = (doError && events.error == null);
	  else if (!doError)
	    return false;

	  domain = this.domain;

	  // If there is no 'error' event listener then throw.
	  if (doError) {
	    er = arguments[1];
	    if (domain) {
	      if (!er)
	        er = new Error('Uncaught, unspecified "error" event');
	      er.domainEmitter = this;
	      er.domain = domain;
	      er.domainThrown = false;
	      domain.emit('error', er);
	    } else if (er instanceof Error) {
	      throw er; // Unhandled 'error' event
	    } else {
	      // At least give some kind of context to the user
	      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	      err.context = er;
	      throw err;
	    }
	    return false;
	  }

	  handler = events[type];

	  if (!handler)
	    return false;

	  var isFn = typeof handler === 'function';
	  len = arguments.length;
	  switch (len) {
	    // fast cases
	    case 1:
	      emitNone(handler, isFn, this);
	      break;
	    case 2:
	      emitOne(handler, isFn, this, arguments[1]);
	      break;
	    case 3:
	      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
	      break;
	    case 4:
	      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
	      break;
	    // slower
	    default:
	      args = new Array(len - 1);
	      for (i = 1; i < len; i++)
	        args[i - 1] = arguments[i];
	      emitMany(handler, isFn, this, args);
	  }

	  return true;
	};

	function _addListener(target, type, listener, prepend) {
	  var m;
	  var events;
	  var existing;

	  if (typeof listener !== 'function')
	    throw new TypeError('"listener" argument must be a function');

	  events = target._events;
	  if (!events) {
	    events = target._events = new EventHandlers();
	    target._eventsCount = 0;
	  } else {
	    // To avoid recursion in the case that type === "newListener"! Before
	    // adding it to the listeners, first emit "newListener".
	    if (events.newListener) {
	      target.emit('newListener', type,
	                  listener.listener ? listener.listener : listener);

	      // Re-assign `events` because a newListener handler could have caused the
	      // this._events to be assigned to a new object
	      events = target._events;
	    }
	    existing = events[type];
	  }

	  if (!existing) {
	    // Optimize the case of one listener. Don't need the extra array object.
	    existing = events[type] = listener;
	    ++target._eventsCount;
	  } else {
	    if (typeof existing === 'function') {
	      // Adding the second element, need to change to array.
	      existing = events[type] = prepend ? [listener, existing] :
	                                          [existing, listener];
	    } else {
	      // If we've already got an array, just append.
	      if (prepend) {
	        existing.unshift(listener);
	      } else {
	        existing.push(listener);
	      }
	    }

	    // Check for listener leak
	    if (!existing.warned) {
	      m = $getMaxListeners(target);
	      if (m && m > 0 && existing.length > m) {
	        existing.warned = true;
	        var w = new Error('Possible EventEmitter memory leak detected. ' +
	                            existing.length + ' ' + type + ' listeners added. ' +
	                            'Use emitter.setMaxListeners() to increase limit');
	        w.name = 'MaxListenersExceededWarning';
	        w.emitter = target;
	        w.type = type;
	        w.count = existing.length;
	        emitWarning(w);
	      }
	    }
	  }

	  return target;
	}
	function emitWarning(e) {
	  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
	}
	EventEmitter.prototype.addListener = function addListener(type, listener) {
	  return _addListener(this, type, listener, false);
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.prependListener =
	    function prependListener(type, listener) {
	      return _addListener(this, type, listener, true);
	    };

	function _onceWrap(target, type, listener) {
	  var fired = false;
	  function g() {
	    target.removeListener(type, g);
	    if (!fired) {
	      fired = true;
	      listener.apply(target, arguments);
	    }
	  }
	  g.listener = listener;
	  return g;
	}

	EventEmitter.prototype.once = function once(type, listener) {
	  if (typeof listener !== 'function')
	    throw new TypeError('"listener" argument must be a function');
	  this.on(type, _onceWrap(this, type, listener));
	  return this;
	};

	EventEmitter.prototype.prependOnceListener =
	    function prependOnceListener(type, listener) {
	      if (typeof listener !== 'function')
	        throw new TypeError('"listener" argument must be a function');
	      this.prependListener(type, _onceWrap(this, type, listener));
	      return this;
	    };

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener =
	    function removeListener(type, listener) {
	      var list, events, position, i, originalListener;

	      if (typeof listener !== 'function')
	        throw new TypeError('"listener" argument must be a function');

	      events = this._events;
	      if (!events)
	        return this;

	      list = events[type];
	      if (!list)
	        return this;

	      if (list === listener || (list.listener && list.listener === listener)) {
	        if (--this._eventsCount === 0)
	          this._events = new EventHandlers();
	        else {
	          delete events[type];
	          if (events.removeListener)
	            this.emit('removeListener', type, list.listener || listener);
	        }
	      } else if (typeof list !== 'function') {
	        position = -1;

	        for (i = list.length; i-- > 0;) {
	          if (list[i] === listener ||
	              (list[i].listener && list[i].listener === listener)) {
	            originalListener = list[i].listener;
	            position = i;
	            break;
	          }
	        }

	        if (position < 0)
	          return this;

	        if (list.length === 1) {
	          list[0] = undefined;
	          if (--this._eventsCount === 0) {
	            this._events = new EventHandlers();
	            return this;
	          } else {
	            delete events[type];
	          }
	        } else {
	          spliceOne(list, position);
	        }

	        if (events.removeListener)
	          this.emit('removeListener', type, originalListener || listener);
	      }

	      return this;
	    };
	    
	// Alias for removeListener added in NodeJS 10.0
	// https://nodejs.org/api/events.html#events_emitter_off_eventname_listener
	EventEmitter.prototype.off = function(type, listener){
	    return this.removeListener(type, listener);
	};

	EventEmitter.prototype.removeAllListeners =
	    function removeAllListeners(type) {
	      var listeners, events;

	      events = this._events;
	      if (!events)
	        return this;

	      // not listening for removeListener, no need to emit
	      if (!events.removeListener) {
	        if (arguments.length === 0) {
	          this._events = new EventHandlers();
	          this._eventsCount = 0;
	        } else if (events[type]) {
	          if (--this._eventsCount === 0)
	            this._events = new EventHandlers();
	          else
	            delete events[type];
	        }
	        return this;
	      }

	      // emit removeListener for all listeners on all events
	      if (arguments.length === 0) {
	        var keys = Object.keys(events);
	        for (var i = 0, key; i < keys.length; ++i) {
	          key = keys[i];
	          if (key === 'removeListener') continue;
	          this.removeAllListeners(key);
	        }
	        this.removeAllListeners('removeListener');
	        this._events = new EventHandlers();
	        this._eventsCount = 0;
	        return this;
	      }

	      listeners = events[type];

	      if (typeof listeners === 'function') {
	        this.removeListener(type, listeners);
	      } else if (listeners) {
	        // LIFO order
	        do {
	          this.removeListener(type, listeners[listeners.length - 1]);
	        } while (listeners[0]);
	      }

	      return this;
	    };

	EventEmitter.prototype.listeners = function listeners(type) {
	  var evlistener;
	  var ret;
	  var events = this._events;

	  if (!events)
	    ret = [];
	  else {
	    evlistener = events[type];
	    if (!evlistener)
	      ret = [];
	    else if (typeof evlistener === 'function')
	      ret = [evlistener.listener || evlistener];
	    else
	      ret = unwrapListeners(evlistener);
	  }

	  return ret;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  if (typeof emitter.listenerCount === 'function') {
	    return emitter.listenerCount(type);
	  } else {
	    return listenerCount$1.call(emitter, type);
	  }
	};

	EventEmitter.prototype.listenerCount = listenerCount$1;
	function listenerCount$1(type) {
	  var events = this._events;

	  if (events) {
	    var evlistener = events[type];

	    if (typeof evlistener === 'function') {
	      return 1;
	    } else if (evlistener) {
	      return evlistener.length;
	    }
	  }

	  return 0;
	}

	EventEmitter.prototype.eventNames = function eventNames() {
	  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
	};

	// About 1.5x faster than the two-arg version of Array#splice().
	function spliceOne(list, index) {
	  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
	    list[i] = list[k];
	  list.pop();
	}

	function arrayClone(arr, i) {
	  var copy = new Array(i);
	  while (i--)
	    copy[i] = arr[i];
	  return copy;
	}

	function unwrapListeners(arr) {
	  var ret = new Array(arr.length);
	  for (var i = 0; i < ret.length; ++i) {
	    ret[i] = arr[i].listener || arr[i];
	  }
	  return ret;
	}

	function BufferList() {
	  this.head = null;
	  this.tail = null;
	  this.length = 0;
	}

	BufferList.prototype.push = function (v) {
	  var entry = { data: v, next: null };
	  if (this.length > 0) this.tail.next = entry;else this.head = entry;
	  this.tail = entry;
	  ++this.length;
	};

	BufferList.prototype.unshift = function (v) {
	  var entry = { data: v, next: this.head };
	  if (this.length === 0) this.tail = entry;
	  this.head = entry;
	  ++this.length;
	};

	BufferList.prototype.shift = function () {
	  if (this.length === 0) return;
	  var ret = this.head.data;
	  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	  --this.length;
	  return ret;
	};

	BufferList.prototype.clear = function () {
	  this.head = this.tail = null;
	  this.length = 0;
	};

	BufferList.prototype.join = function (s) {
	  if (this.length === 0) return '';
	  var p = this.head;
	  var ret = '' + p.data;
	  while (p = p.next) {
	    ret += s + p.data;
	  }return ret;
	};

	BufferList.prototype.concat = function (n) {
	  if (this.length === 0) return Buffer$1.alloc(0);
	  if (this.length === 1) return this.head.data;
	  var ret = Buffer$1.allocUnsafe(n >>> 0);
	  var p = this.head;
	  var i = 0;
	  while (p) {
	    p.data.copy(ret, i);
	    i += p.data.length;
	    p = p.next;
	  }
	  return ret;
	};

	// Copyright Joyent, Inc. and other Node contributors.
	var isBufferEncoding = Buffer$1.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     };


	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	function StringDecoder(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }

	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer$1(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	}

	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;

	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;

	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }

	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);

	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;

	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }

	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);

	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }

	  charStr += buffer.toString(this.encoding, 0, end);

	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }

	  // or just emit the charStr
	  return charStr;
	};

	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;

	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];

	    // See http://en.wikipedia.org/wiki/UTF-8#Description

	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }

	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }

	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};

	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);

	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }

	  return res;
	};

	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}

	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}

	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}

	Readable.ReadableState = ReadableState;

	var debug = debuglog('stream');
	inherits$1(Readable, EventEmitter);

	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') {
	    return emitter.prependListener(event, fn);
	  } else {
	    // This is a hack to make sure that our error handler is attached before any
	    // userland ones.  NEVER DO THIS. This is here only because this code needs
	    // to continue to work with older versions of Node.js that do not include
	    // the prependListener() method. The goal is to eventually remove this hack.
	    if (!emitter._events || !emitter._events[event])
	      emitter.on(event, fn);
	    else if (Array.isArray(emitter._events[event]))
	      emitter._events[event].unshift(fn);
	    else
	      emitter._events[event] = [fn, emitter._events[event]];
	  }
	}
	function listenerCount (emitter, type) {
	  return emitter.listeners(type).length;
	}
	function ReadableState(options, stream) {

	  options = options || {};

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~ ~this.highWaterMark;

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}
	function Readable(options) {

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options && typeof options.read === 'function') this._read = options.read;

	  EventEmitter.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;

	  if (!state.objectMode && typeof chunk === 'string') {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = Buffer$1.from(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var _e = new Error('stream.unshift() after end event');
	      stream.emit('error', _e);
	    } else {
	      var skipAdd;
	      if (state.decoder && !addToFront && !encoding) {
	        chunk = state.decoder.write(chunk);
	        skipAdd = !state.objectMode && chunk.length === 0;
	      }

	      if (!addToFront) state.reading = false;

	      // Don't add to the buffer if we've decoded to an empty string chunk and
	      // we're not in object mode
	      if (!skipAdd) {
	        // if we want the data now, just emit it.
	        if (state.flowing && state.length === 0 && !state.sync) {
	          stream.emit('data', chunk);
	          stream.read(0);
	        } else {
	          // update the buffer info.
	          state.length += state.objectMode ? 1 : chunk.length;
	          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	          if (state.needReadable) emitReadable(stream);
	        }
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;

	  if (n !== 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }

	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!Buffer$1.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    nextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false);

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (listenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }

	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && src.listeners('data').length) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var _i = 0; _i < len; _i++) {
	      dests[_i].emit('unpipe', this);
	    }return this;
	  }

	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1) return this;

	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = EventEmitter.prototype.on.call(this, ev, fn);

	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        nextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    nextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function (ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;

	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }

	  return ret;
	}

	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}

	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = Buffer$1.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    nextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}

	// A bit simpler than readable streams.
	Writable.WritableState = WritableState;
	inherits$1(Writable, EventEmitter);

	function nop() {}

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	function WritableState(options, stream) {
	  Object.defineProperty(this, 'buffer', {
	    get: deprecate(function () {
	      return this.getBuffer();
	    }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
	  });
	  options = options || {};

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~ ~this.highWaterMark;

	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function writableStateGetBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};
	function Writable(options) {

	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;
	  }

	  EventEmitter.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  nextTick(cb, er);
	}

	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;
	  // Always throw error if a null is written
	  // if we are not in object mode then throw
	  // if it is not a buffer, string, or undefined.
	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (!Buffer$1.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    nextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = Buffer$1.from(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);

	  if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;
	  if (sync) nextTick(cb, er);else cb(er);

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	        nextTick(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	        afterWrite(stream, state, finished, cb);
	      }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    while (entry) {
	      buffer[count] = entry;
	      entry = entry.next;
	      count += 1;
	    }

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequestCount = 0;
	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else {
	      prefinish(stream, state);
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) nextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;

	  this.finish = function (err) {
	    var entry = _this.entry;
	    _this.entry = null;
	    while (entry) {
	      var cb = entry.callback;
	      state.pendingcb--;
	      cb(err);
	      entry = entry.next;
	    }
	    if (state.corkedRequestsFree) {
	      state.corkedRequestsFree.next = _this;
	    } else {
	      state.corkedRequestsFree = _this;
	    }
	  };
	}

	inherits$1(Duplex, Readable);

	var keys = Object.keys(Writable.prototype);
	for (var v = 0; v < keys.length; v++) {
	  var method = keys[v];
	  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	}
	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  nextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	// a transform stream is a readable/writable stream where you do
	inherits$1(Transform, Duplex);

	function TransformState(stream) {
	  this.afterTransform = function (er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	  this.writeencoding = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (data !== null && data !== undefined) stream.push(data);

	  cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}
	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(this);

	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;

	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }

	  this.once('prefinish', function () {
	    if (typeof this._flush === 'function') this._flush(function (er) {
	      done(stream, er);
	    });else done(stream);
	  });
	}

	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('Not implemented');
	};

	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;

	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};

	function done(stream, er) {
	  if (er) return stream.emit('error', er);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

	  if (ts.transforming) throw new Error('Calling transform done when still transforming');

	  return stream.push(null);
	}

	inherits$1(PassThrough, Transform);
	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

	inherits$1(Stream$3, EventEmitter);
	Stream$3.Readable = Readable;
	Stream$3.Writable = Writable;
	Stream$3.Duplex = Duplex;
	Stream$3.Transform = Transform;
	Stream$3.PassThrough = PassThrough;

	// Backwards-compat with node 0.4.x
	Stream$3.Stream = Stream$3;

	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream$3() {
	  EventEmitter.call(this);
	}

	Stream$3.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EventEmitter.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};

	var _polyfillNode_stream = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': Stream$3,
		Readable: Readable,
		Writable: Writable,
		Duplex: Duplex,
		Transform: Transform,
		PassThrough: PassThrough,
		Stream: Stream$3
	});

	var require$$1$1 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_stream);

	var parserAsync = {exports: {}};

	var msg = {
	  2:      'need dictionary',     /* Z_NEED_DICT       2  */
	  1:      'stream end',          /* Z_STREAM_END      1  */
	  0:      '',                    /* Z_OK              0  */
	  '-1':   'file error',          /* Z_ERRNO         (-1) */
	  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
	  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
	  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
	  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
	  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
	};

	function ZStream() {
	  /* next input byte */
	  this.input = null; // JS specific, because we have no pointers
	  this.next_in = 0;
	  /* number of bytes available at input */
	  this.avail_in = 0;
	  /* total number of input bytes read so far */
	  this.total_in = 0;
	  /* next output byte should be put there */
	  this.output = null; // JS specific, because we have no pointers
	  this.next_out = 0;
	  /* remaining free space at output */
	  this.avail_out = 0;
	  /* total number of bytes output so far */
	  this.total_out = 0;
	  /* last error message, NULL if no error */
	  this.msg = ''/*Z_NULL*/;
	  /* not visible by applications */
	  this.state = null;
	  /* best guess about the data type: binary or text */
	  this.data_type = 2/*Z_UNKNOWN*/;
	  /* adler32 value of the uncompressed data */
	  this.adler = 0;
	}

	function arraySet(dest, src, src_offs, len, dest_offs) {
	  if (src.subarray && dest.subarray) {
	    dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
	    return;
	  }
	  // Fallback to ordinary array
	  for (var i = 0; i < len; i++) {
	    dest[dest_offs + i] = src[src_offs + i];
	  }
	}


	var Buf8 = Uint8Array;
	var Buf16 = Uint16Array;
	var Buf32 = Int32Array;
	// Enable/Disable typed arrays use, for testing
	//

	/* Public constants ==========================================================*/
	/* ===========================================================================*/


	//var Z_FILTERED          = 1;
	//var Z_HUFFMAN_ONLY      = 2;
	//var Z_RLE               = 3;
	var Z_FIXED$2 = 4;
	//var Z_DEFAULT_STRATEGY  = 0;

	/* Possible values of the data_type field (though see inflate()) */
	var Z_BINARY$1 = 0;
	var Z_TEXT$1 = 1;
	//var Z_ASCII             = 1; // = Z_TEXT
	var Z_UNKNOWN$2 = 2;

	/*============================================================================*/


	function zero$1(buf) {
	  var len = buf.length;
	  while (--len >= 0) {
	    buf[len] = 0;
	  }
	}

	// From zutil.h

	var STORED_BLOCK = 0;
	var STATIC_TREES = 1;
	var DYN_TREES = 2;
	/* The three kinds of block type */

	var MIN_MATCH$1 = 3;
	var MAX_MATCH$1 = 258;
	/* The minimum and maximum match lengths */

	// From deflate.h
	/* ===========================================================================
	 * Internal compression state.
	 */

	var LENGTH_CODES$1 = 29;
	/* number of length codes, not counting the special END_BLOCK code */

	var LITERALS$1 = 256;
	/* number of literal bytes 0..255 */

	var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
	/* number of Literal or Length codes, including the END_BLOCK code */

	var D_CODES$1 = 30;
	/* number of distance codes */

	var BL_CODES$1 = 19;
	/* number of codes used to transfer the bit lengths */

	var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
	/* maximum heap size */

	var MAX_BITS$1 = 15;
	/* All codes must not exceed MAX_BITS bits */

	var Buf_size = 16;
	/* size of bit buffer in bi_buf */


	/* ===========================================================================
	 * Constants
	 */

	var MAX_BL_BITS = 7;
	/* Bit length codes must not exceed MAX_BL_BITS bits */

	var END_BLOCK = 256;
	/* end of block literal code */

	var REP_3_6 = 16;
	/* repeat previous bit length 3-6 times (2 bits of repeat count) */

	var REPZ_3_10 = 17;
	/* repeat a zero length 3-10 times  (3 bits of repeat count) */

	var REPZ_11_138 = 18;
	/* repeat a zero length 11-138 times  (7 bits of repeat count) */

	/* eslint-disable comma-spacing,array-bracket-spacing */
	var extra_lbits = /* extra bits for each length code */ [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];

	var extra_dbits = /* extra bits for each distance code */ [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

	var extra_blbits = /* extra bits for each bit length code */ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];

	var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
	/* eslint-enable comma-spacing,array-bracket-spacing */

	/* The lengths of the bit length codes are sent in order of decreasing
	 * probability, to avoid transmitting the lengths for unused bit length codes.
	 */

	/* ===========================================================================
	 * Local data. These are initialized only once.
	 */

	// We pre-fill arrays with 0 to avoid uninitialized gaps

	var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

	// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
	var static_ltree = new Array((L_CODES$1 + 2) * 2);
	zero$1(static_ltree);
	/* The static literal tree. Since the bit lengths are imposed, there is no
	 * need for the L_CODES extra codes used during heap construction. However
	 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
	 * below).
	 */

	var static_dtree = new Array(D_CODES$1 * 2);
	zero$1(static_dtree);
	/* The static distance tree. (Actually a trivial tree since all codes use
	 * 5 bits.)
	 */

	var _dist_code = new Array(DIST_CODE_LEN);
	zero$1(_dist_code);
	/* Distance codes. The first 256 values correspond to the distances
	 * 3 .. 258, the last 256 values correspond to the top 8 bits of
	 * the 15 bit distances.
	 */

	var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
	zero$1(_length_code);
	/* length code for each normalized match length (0 == MIN_MATCH) */

	var base_length = new Array(LENGTH_CODES$1);
	zero$1(base_length);
	/* First normalized length for each code (0 = MIN_MATCH) */

	var base_dist = new Array(D_CODES$1);
	zero$1(base_dist);
	/* First normalized distance for each code (0 = distance of 1) */


	function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

	  this.static_tree = static_tree; /* static tree or NULL */
	  this.extra_bits = extra_bits; /* extra bits for each code or NULL */
	  this.extra_base = extra_base; /* base index for extra_bits */
	  this.elems = elems; /* max number of elements in the tree */
	  this.max_length = max_length; /* max bit length for the codes */

	  // show if `static_tree` has data or dummy - needed for monomorphic objects
	  this.has_stree = static_tree && static_tree.length;
	}


	var static_l_desc;
	var static_d_desc;
	var static_bl_desc;


	function TreeDesc(dyn_tree, stat_desc) {
	  this.dyn_tree = dyn_tree; /* the dynamic tree */
	  this.max_code = 0; /* largest code with non zero frequency */
	  this.stat_desc = stat_desc; /* the corresponding static tree */
	}



	function d_code(dist) {
	  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
	}


	/* ===========================================================================
	 * Output a short LSB first on the stream.
	 * IN assertion: there is enough room in pendingBuf.
	 */
	function put_short(s, w) {
	  //    put_byte(s, (uch)((w) & 0xff));
	  //    put_byte(s, (uch)((ush)(w) >> 8));
	  s.pending_buf[s.pending++] = (w) & 0xff;
	  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
	}


	/* ===========================================================================
	 * Send a value on a given number of bits.
	 * IN assertion: length <= 16 and value fits in length bits.
	 */
	function send_bits(s, value, length) {
	  if (s.bi_valid > (Buf_size - length)) {
	    s.bi_buf |= (value << s.bi_valid) & 0xffff;
	    put_short(s, s.bi_buf);
	    s.bi_buf = value >> (Buf_size - s.bi_valid);
	    s.bi_valid += length - Buf_size;
	  } else {
	    s.bi_buf |= (value << s.bi_valid) & 0xffff;
	    s.bi_valid += length;
	  }
	}


	function send_code(s, c, tree) {
	  send_bits(s, tree[c * 2] /*.Code*/ , tree[c * 2 + 1] /*.Len*/ );
	}


	/* ===========================================================================
	 * Reverse the first len bits of a code, using straightforward code (a faster
	 * method would use a table)
	 * IN assertion: 1 <= len <= 15
	 */
	function bi_reverse(code, len) {
	  var res = 0;
	  do {
	    res |= code & 1;
	    code >>>= 1;
	    res <<= 1;
	  } while (--len > 0);
	  return res >>> 1;
	}


	/* ===========================================================================
	 * Flush the bit buffer, keeping at most 7 bits in it.
	 */
	function bi_flush(s) {
	  if (s.bi_valid === 16) {
	    put_short(s, s.bi_buf);
	    s.bi_buf = 0;
	    s.bi_valid = 0;

	  } else if (s.bi_valid >= 8) {
	    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
	    s.bi_buf >>= 8;
	    s.bi_valid -= 8;
	  }
	}


	/* ===========================================================================
	 * Compute the optimal bit lengths for a tree and update the total bit length
	 * for the current block.
	 * IN assertion: the fields freq and dad are set, heap[heap_max] and
	 *    above are the tree nodes sorted by increasing frequency.
	 * OUT assertions: the field len is set to the optimal bit length, the
	 *     array bl_count contains the frequencies for each bit length.
	 *     The length opt_len is updated; static_len is also updated if stree is
	 *     not null.
	 */
	function gen_bitlen(s, desc) {
	//    deflate_state *s;
	//    tree_desc *desc;    /* the tree descriptor */
	  var tree = desc.dyn_tree;
	  var max_code = desc.max_code;
	  var stree = desc.stat_desc.static_tree;
	  var has_stree = desc.stat_desc.has_stree;
	  var extra = desc.stat_desc.extra_bits;
	  var base = desc.stat_desc.extra_base;
	  var max_length = desc.stat_desc.max_length;
	  var h; /* heap index */
	  var n, m; /* iterate over the tree elements */
	  var bits; /* bit length */
	  var xbits; /* extra bits */
	  var f; /* frequency */
	  var overflow = 0; /* number of elements with bit length too large */

	  for (bits = 0; bits <= MAX_BITS$1; bits++) {
	    s.bl_count[bits] = 0;
	  }

	  /* In a first pass, compute the optimal bit lengths (which may
	   * overflow in the case of the bit length tree).
	   */
	  tree[s.heap[s.heap_max] * 2 + 1] /*.Len*/ = 0; /* root of the heap */

	  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
	    n = s.heap[h];
	    bits = tree[tree[n * 2 + 1] /*.Dad*/ * 2 + 1] /*.Len*/ + 1;
	    if (bits > max_length) {
	      bits = max_length;
	      overflow++;
	    }
	    tree[n * 2 + 1] /*.Len*/ = bits;
	    /* We overwrite tree[n].Dad which is no longer needed */

	    if (n > max_code) {
	      continue;
	    } /* not a leaf node */

	    s.bl_count[bits]++;
	    xbits = 0;
	    if (n >= base) {
	      xbits = extra[n - base];
	    }
	    f = tree[n * 2] /*.Freq*/ ;
	    s.opt_len += f * (bits + xbits);
	    if (has_stree) {
	      s.static_len += f * (stree[n * 2 + 1] /*.Len*/ + xbits);
	    }
	  }
	  if (overflow === 0) {
	    return;
	  }

	  // Trace((stderr,"\nbit length overflow\n"));
	  /* This happens for example on obj2 and pic of the Calgary corpus */

	  /* Find the first bit length which could increase: */
	  do {
	    bits = max_length - 1;
	    while (s.bl_count[bits] === 0) {
	      bits--;
	    }
	    s.bl_count[bits]--; /* move one leaf down the tree */
	    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
	    s.bl_count[max_length]--;
	    /* The brother of the overflow item also moves one step up,
	     * but this does not affect bl_count[max_length]
	     */
	    overflow -= 2;
	  } while (overflow > 0);

	  /* Now recompute all bit lengths, scanning in increasing frequency.
	   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
	   * lengths instead of fixing only the wrong ones. This idea is taken
	   * from 'ar' written by Haruhiko Okumura.)
	   */
	  for (bits = max_length; bits !== 0; bits--) {
	    n = s.bl_count[bits];
	    while (n !== 0) {
	      m = s.heap[--h];
	      if (m > max_code) {
	        continue;
	      }
	      if (tree[m * 2 + 1] /*.Len*/ !== bits) {
	        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
	        s.opt_len += (bits - tree[m * 2 + 1] /*.Len*/ ) * tree[m * 2] /*.Freq*/ ;
	        tree[m * 2 + 1] /*.Len*/ = bits;
	      }
	      n--;
	    }
	  }
	}


	/* ===========================================================================
	 * Generate the codes for a given tree and bit counts (which need not be
	 * optimal).
	 * IN assertion: the array bl_count contains the bit length statistics for
	 * the given tree and the field len is set for all tree elements.
	 * OUT assertion: the field code is set for all tree elements of non
	 *     zero code length.
	 */
	function gen_codes(tree, max_code, bl_count) {
	//    ct_data *tree;             /* the tree to decorate */
	//    int max_code;              /* largest code with non zero frequency */
	//    ushf *bl_count;            /* number of codes at each bit length */

	  var next_code = new Array(MAX_BITS$1 + 1); /* next code value for each bit length */
	  var code = 0; /* running code value */
	  var bits; /* bit index */
	  var n; /* code index */

	  /* The distribution counts are first used to generate the code values
	   * without bit reversal.
	   */
	  for (bits = 1; bits <= MAX_BITS$1; bits++) {
	    next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
	  }
	  /* Check that the bit counts in bl_count are consistent. The last code
	   * must be all ones.
	   */
	  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
	  //        "inconsistent bit counts");
	  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

	  for (n = 0; n <= max_code; n++) {
	    var len = tree[n * 2 + 1] /*.Len*/ ;
	    if (len === 0) {
	      continue;
	    }
	    /* Now reverse the bits */
	    tree[n * 2] /*.Code*/ = bi_reverse(next_code[len]++, len);

	    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
	    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
	  }
	}


	/* ===========================================================================
	 * Initialize the various 'constant' tables.
	 */
	function tr_static_init() {
	  var n; /* iterates over tree elements */
	  var bits; /* bit counter */
	  var length; /* length value */
	  var code; /* code value */
	  var dist; /* distance index */
	  var bl_count = new Array(MAX_BITS$1 + 1);
	  /* number of codes at each bit length for an optimal tree */

	  // do check in _tr_init()
	  //if (static_init_done) return;

	  /* For some embedded targets, global variables are not initialized: */
	  /*#ifdef NO_INIT_GLOBAL_POINTERS
	    static_l_desc.static_tree = static_ltree;
	    static_l_desc.extra_bits = extra_lbits;
	    static_d_desc.static_tree = static_dtree;
	    static_d_desc.extra_bits = extra_dbits;
	    static_bl_desc.extra_bits = extra_blbits;
	  #endif*/

	  /* Initialize the mapping length (0..255) -> length code (0..28) */
	  length = 0;
	  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
	    base_length[code] = length;
	    for (n = 0; n < (1 << extra_lbits[code]); n++) {
	      _length_code[length++] = code;
	    }
	  }
	  //Assert (length == 256, "tr_static_init: length != 256");
	  /* Note that the length 255 (match length 258) can be represented
	   * in two different ways: code 284 + 5 bits or code 285, so we
	   * overwrite length_code[255] to use the best encoding:
	   */
	  _length_code[length - 1] = code;

	  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
	  dist = 0;
	  for (code = 0; code < 16; code++) {
	    base_dist[code] = dist;
	    for (n = 0; n < (1 << extra_dbits[code]); n++) {
	      _dist_code[dist++] = code;
	    }
	  }
	  //Assert (dist == 256, "tr_static_init: dist != 256");
	  dist >>= 7; /* from now on, all distances are divided by 128 */
	  for (; code < D_CODES$1; code++) {
	    base_dist[code] = dist << 7;
	    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
	      _dist_code[256 + dist++] = code;
	    }
	  }
	  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

	  /* Construct the codes of the static literal tree */
	  for (bits = 0; bits <= MAX_BITS$1; bits++) {
	    bl_count[bits] = 0;
	  }

	  n = 0;
	  while (n <= 143) {
	    static_ltree[n * 2 + 1] /*.Len*/ = 8;
	    n++;
	    bl_count[8]++;
	  }
	  while (n <= 255) {
	    static_ltree[n * 2 + 1] /*.Len*/ = 9;
	    n++;
	    bl_count[9]++;
	  }
	  while (n <= 279) {
	    static_ltree[n * 2 + 1] /*.Len*/ = 7;
	    n++;
	    bl_count[7]++;
	  }
	  while (n <= 287) {
	    static_ltree[n * 2 + 1] /*.Len*/ = 8;
	    n++;
	    bl_count[8]++;
	  }
	  /* Codes 286 and 287 do not exist, but we must include them in the
	   * tree construction to get a canonical Huffman tree (longest code
	   * all ones)
	   */
	  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);

	  /* The static distance tree is trivial: */
	  for (n = 0; n < D_CODES$1; n++) {
	    static_dtree[n * 2 + 1] /*.Len*/ = 5;
	    static_dtree[n * 2] /*.Code*/ = bi_reverse(n, 5);
	  }

	  // Now data ready and we can init static trees
	  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
	  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
	  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);

	  //static_init_done = true;
	}


	/* ===========================================================================
	 * Initialize a new block.
	 */
	function init_block(s) {
	  var n; /* iterates over tree elements */

	  /* Initialize the trees. */
	  for (n = 0; n < L_CODES$1; n++) {
	    s.dyn_ltree[n * 2] /*.Freq*/ = 0;
	  }
	  for (n = 0; n < D_CODES$1; n++) {
	    s.dyn_dtree[n * 2] /*.Freq*/ = 0;
	  }
	  for (n = 0; n < BL_CODES$1; n++) {
	    s.bl_tree[n * 2] /*.Freq*/ = 0;
	  }

	  s.dyn_ltree[END_BLOCK * 2] /*.Freq*/ = 1;
	  s.opt_len = s.static_len = 0;
	  s.last_lit = s.matches = 0;
	}


	/* ===========================================================================
	 * Flush the bit buffer and align the output on a byte boundary
	 */
	function bi_windup(s) {
	  if (s.bi_valid > 8) {
	    put_short(s, s.bi_buf);
	  } else if (s.bi_valid > 0) {
	    //put_byte(s, (Byte)s->bi_buf);
	    s.pending_buf[s.pending++] = s.bi_buf;
	  }
	  s.bi_buf = 0;
	  s.bi_valid = 0;
	}

	/* ===========================================================================
	 * Copy a stored block, storing first the length and its
	 * one's complement if requested.
	 */
	function copy_block(s, buf, len, header) {
	//DeflateState *s;
	//charf    *buf;    /* the input data */
	//unsigned len;     /* its length */
	//int      header;  /* true if block header must be written */

	  bi_windup(s); /* align on byte boundary */

	  if (header) {
	    put_short(s, len);
	    put_short(s, ~len);
	  }
	  //  while (len--) {
	  //    put_byte(s, *buf++);
	  //  }
	  arraySet(s.pending_buf, s.window, buf, len, s.pending);
	  s.pending += len;
	}

	/* ===========================================================================
	 * Compares to subtrees, using the tree depth as tie breaker when
	 * the subtrees have equal frequency. This minimizes the worst case length.
	 */
	function smaller(tree, n, m, depth) {
	  var _n2 = n * 2;
	  var _m2 = m * 2;
	  return (tree[_n2] /*.Freq*/ < tree[_m2] /*.Freq*/ ||
	    (tree[_n2] /*.Freq*/ === tree[_m2] /*.Freq*/ && depth[n] <= depth[m]));
	}

	/* ===========================================================================
	 * Restore the heap property by moving down the tree starting at node k,
	 * exchanging a node with the smallest of its two sons if necessary, stopping
	 * when the heap property is re-established (each father smaller than its
	 * two sons).
	 */
	function pqdownheap(s, tree, k)
	//    deflate_state *s;
	//    ct_data *tree;  /* the tree to restore */
	//    int k;               /* node to move down */
	{
	  var v = s.heap[k];
	  var j = k << 1; /* left son of k */
	  while (j <= s.heap_len) {
	    /* Set j to the smallest of the two sons: */
	    if (j < s.heap_len &&
	      smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
	      j++;
	    }
	    /* Exit if v is smaller than both sons */
	    if (smaller(tree, v, s.heap[j], s.depth)) {
	      break;
	    }

	    /* Exchange v with the smallest son */
	    s.heap[k] = s.heap[j];
	    k = j;

	    /* And continue down the tree, setting j to the left son of k */
	    j <<= 1;
	  }
	  s.heap[k] = v;
	}


	// inlined manually
	// var SMALLEST = 1;

	/* ===========================================================================
	 * Send the block data compressed using the given Huffman trees
	 */
	function compress_block(s, ltree, dtree)
	//    deflate_state *s;
	//    const ct_data *ltree; /* literal tree */
	//    const ct_data *dtree; /* distance tree */
	{
	  var dist; /* distance of matched string */
	  var lc; /* match length or unmatched char (if dist == 0) */
	  var lx = 0; /* running index in l_buf */
	  var code; /* the code to send */
	  var extra; /* number of extra bits to send */

	  if (s.last_lit !== 0) {
	    do {
	      dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
	      lc = s.pending_buf[s.l_buf + lx];
	      lx++;

	      if (dist === 0) {
	        send_code(s, lc, ltree); /* send a literal byte */
	        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
	      } else {
	        /* Here, lc is the match length - MIN_MATCH */
	        code = _length_code[lc];
	        send_code(s, code + LITERALS$1 + 1, ltree); /* send the length code */
	        extra = extra_lbits[code];
	        if (extra !== 0) {
	          lc -= base_length[code];
	          send_bits(s, lc, extra); /* send the extra length bits */
	        }
	        dist--; /* dist is now the match distance - 1 */
	        code = d_code(dist);
	        //Assert (code < D_CODES, "bad d_code");

	        send_code(s, code, dtree); /* send the distance code */
	        extra = extra_dbits[code];
	        if (extra !== 0) {
	          dist -= base_dist[code];
	          send_bits(s, dist, extra); /* send the extra distance bits */
	        }
	      } /* literal or match pair ? */

	      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
	      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
	      //       "pendingBuf overflow");

	    } while (lx < s.last_lit);
	  }

	  send_code(s, END_BLOCK, ltree);
	}


	/* ===========================================================================
	 * Construct one Huffman tree and assigns the code bit strings and lengths.
	 * Update the total bit length for the current block.
	 * IN assertion: the field freq is set for all tree elements.
	 * OUT assertions: the fields len and code are set to the optimal bit length
	 *     and corresponding code. The length opt_len is updated; static_len is
	 *     also updated if stree is not null. The field max_code is set.
	 */
	function build_tree(s, desc)
	//    deflate_state *s;
	//    tree_desc *desc; /* the tree descriptor */
	{
	  var tree = desc.dyn_tree;
	  var stree = desc.stat_desc.static_tree;
	  var has_stree = desc.stat_desc.has_stree;
	  var elems = desc.stat_desc.elems;
	  var n, m; /* iterate over heap elements */
	  var max_code = -1; /* largest code with non zero frequency */
	  var node; /* new node being created */

	  /* Construct the initial heap, with least frequent element in
	   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
	   * heap[0] is not used.
	   */
	  s.heap_len = 0;
	  s.heap_max = HEAP_SIZE$1;

	  for (n = 0; n < elems; n++) {
	    if (tree[n * 2] /*.Freq*/ !== 0) {
	      s.heap[++s.heap_len] = max_code = n;
	      s.depth[n] = 0;

	    } else {
	      tree[n * 2 + 1] /*.Len*/ = 0;
	    }
	  }

	  /* The pkzip format requires that at least one distance code exists,
	   * and that at least one bit should be sent even if there is only one
	   * possible code. So to avoid special checks later on we force at least
	   * two codes of non zero frequency.
	   */
	  while (s.heap_len < 2) {
	    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
	    tree[node * 2] /*.Freq*/ = 1;
	    s.depth[node] = 0;
	    s.opt_len--;

	    if (has_stree) {
	      s.static_len -= stree[node * 2 + 1] /*.Len*/ ;
	    }
	    /* node is 0 or 1 so it does not have extra bits */
	  }
	  desc.max_code = max_code;

	  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
	   * establish sub-heaps of increasing lengths:
	   */
	  for (n = (s.heap_len >> 1 /*int /2*/ ); n >= 1; n--) {
	    pqdownheap(s, tree, n);
	  }

	  /* Construct the Huffman tree by repeatedly combining the least two
	   * frequent nodes.
	   */
	  node = elems; /* next internal node of the tree */
	  do {
	    //pqremove(s, tree, n);  /* n = node of least frequency */
	    /*** pqremove ***/
	    n = s.heap[1 /*SMALLEST*/ ];
	    s.heap[1 /*SMALLEST*/ ] = s.heap[s.heap_len--];
	    pqdownheap(s, tree, 1 /*SMALLEST*/ );
	    /***/

	    m = s.heap[1 /*SMALLEST*/ ]; /* m = node of next least frequency */

	    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
	    s.heap[--s.heap_max] = m;

	    /* Create a new node father of n and m */
	    tree[node * 2] /*.Freq*/ = tree[n * 2] /*.Freq*/ + tree[m * 2] /*.Freq*/ ;
	    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
	    tree[n * 2 + 1] /*.Dad*/ = tree[m * 2 + 1] /*.Dad*/ = node;

	    /* and insert the new node in the heap */
	    s.heap[1 /*SMALLEST*/ ] = node++;
	    pqdownheap(s, tree, 1 /*SMALLEST*/ );

	  } while (s.heap_len >= 2);

	  s.heap[--s.heap_max] = s.heap[1 /*SMALLEST*/ ];

	  /* At this point, the fields freq and dad are set. We can now
	   * generate the bit lengths.
	   */
	  gen_bitlen(s, desc);

	  /* The field len is now set, we can generate the bit codes */
	  gen_codes(tree, max_code, s.bl_count);
	}


	/* ===========================================================================
	 * Scan a literal or distance tree to determine the frequencies of the codes
	 * in the bit length tree.
	 */
	function scan_tree(s, tree, max_code)
	//    deflate_state *s;
	//    ct_data *tree;   /* the tree to be scanned */
	//    int max_code;    /* and its largest code of non zero frequency */
	{
	  var n; /* iterates over all tree elements */
	  var prevlen = -1; /* last emitted length */
	  var curlen; /* length of current code */

	  var nextlen = tree[0 * 2 + 1] /*.Len*/ ; /* length of next code */

	  var count = 0; /* repeat count of the current code */
	  var max_count = 7; /* max repeat count */
	  var min_count = 4; /* min repeat count */

	  if (nextlen === 0) {
	    max_count = 138;
	    min_count = 3;
	  }
	  tree[(max_code + 1) * 2 + 1] /*.Len*/ = 0xffff; /* guard */

	  for (n = 0; n <= max_code; n++) {
	    curlen = nextlen;
	    nextlen = tree[(n + 1) * 2 + 1] /*.Len*/ ;

	    if (++count < max_count && curlen === nextlen) {
	      continue;

	    } else if (count < min_count) {
	      s.bl_tree[curlen * 2] /*.Freq*/ += count;

	    } else if (curlen !== 0) {

	      if (curlen !== prevlen) {
	        s.bl_tree[curlen * 2] /*.Freq*/ ++;
	      }
	      s.bl_tree[REP_3_6 * 2] /*.Freq*/ ++;

	    } else if (count <= 10) {
	      s.bl_tree[REPZ_3_10 * 2] /*.Freq*/ ++;

	    } else {
	      s.bl_tree[REPZ_11_138 * 2] /*.Freq*/ ++;
	    }

	    count = 0;
	    prevlen = curlen;

	    if (nextlen === 0) {
	      max_count = 138;
	      min_count = 3;

	    } else if (curlen === nextlen) {
	      max_count = 6;
	      min_count = 3;

	    } else {
	      max_count = 7;
	      min_count = 4;
	    }
	  }
	}


	/* ===========================================================================
	 * Send a literal or distance tree in compressed form, using the codes in
	 * bl_tree.
	 */
	function send_tree(s, tree, max_code)
	//    deflate_state *s;
	//    ct_data *tree; /* the tree to be scanned */
	//    int max_code;       /* and its largest code of non zero frequency */
	{
	  var n; /* iterates over all tree elements */
	  var prevlen = -1; /* last emitted length */
	  var curlen; /* length of current code */

	  var nextlen = tree[0 * 2 + 1] /*.Len*/ ; /* length of next code */

	  var count = 0; /* repeat count of the current code */
	  var max_count = 7; /* max repeat count */
	  var min_count = 4; /* min repeat count */

	  /* tree[max_code+1].Len = -1; */
	  /* guard already set */
	  if (nextlen === 0) {
	    max_count = 138;
	    min_count = 3;
	  }

	  for (n = 0; n <= max_code; n++) {
	    curlen = nextlen;
	    nextlen = tree[(n + 1) * 2 + 1] /*.Len*/ ;

	    if (++count < max_count && curlen === nextlen) {
	      continue;

	    } else if (count < min_count) {
	      do {
	        send_code(s, curlen, s.bl_tree);
	      } while (--count !== 0);

	    } else if (curlen !== 0) {
	      if (curlen !== prevlen) {
	        send_code(s, curlen, s.bl_tree);
	        count--;
	      }
	      //Assert(count >= 3 && count <= 6, " 3_6?");
	      send_code(s, REP_3_6, s.bl_tree);
	      send_bits(s, count - 3, 2);

	    } else if (count <= 10) {
	      send_code(s, REPZ_3_10, s.bl_tree);
	      send_bits(s, count - 3, 3);

	    } else {
	      send_code(s, REPZ_11_138, s.bl_tree);
	      send_bits(s, count - 11, 7);
	    }

	    count = 0;
	    prevlen = curlen;
	    if (nextlen === 0) {
	      max_count = 138;
	      min_count = 3;

	    } else if (curlen === nextlen) {
	      max_count = 6;
	      min_count = 3;

	    } else {
	      max_count = 7;
	      min_count = 4;
	    }
	  }
	}


	/* ===========================================================================
	 * Construct the Huffman tree for the bit lengths and return the index in
	 * bl_order of the last bit length code to send.
	 */
	function build_bl_tree(s) {
	  var max_blindex; /* index of last bit length code of non zero freq */

	  /* Determine the bit length frequencies for literal and distance trees */
	  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
	  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

	  /* Build the bit length tree: */
	  build_tree(s, s.bl_desc);
	  /* opt_len now includes the length of the tree representations, except
	   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
	   */

	  /* Determine the number of bit length codes to send. The pkzip format
	   * requires that at least 4 bit length codes be sent. (appnote.txt says
	   * 3 but the actual value used is 4.)
	   */
	  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
	    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] /*.Len*/ !== 0) {
	      break;
	    }
	  }
	  /* Update opt_len to include the bit length tree and counts */
	  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
	  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
	  //        s->opt_len, s->static_len));

	  return max_blindex;
	}


	/* ===========================================================================
	 * Send the header for a block using dynamic Huffman trees: the counts, the
	 * lengths of the bit length codes, the literal tree and the distance tree.
	 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
	 */
	function send_all_trees(s, lcodes, dcodes, blcodes)
	//    deflate_state *s;
	//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
	{
	  var rank; /* index in bl_order */

	  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
	  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
	  //        "too many codes");
	  //Tracev((stderr, "\nbl counts: "));
	  send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
	  send_bits(s, dcodes - 1, 5);
	  send_bits(s, blcodes - 4, 4); /* not -3 as stated in appnote.txt */
	  for (rank = 0; rank < blcodes; rank++) {
	    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
	    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1] /*.Len*/ , 3);
	  }
	  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

	  send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
	  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

	  send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
	  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
	}


	/* ===========================================================================
	 * Check if the data type is TEXT or BINARY, using the following algorithm:
	 * - TEXT if the two conditions below are satisfied:
	 *    a) There are no non-portable control characters belonging to the
	 *       "black list" (0..6, 14..25, 28..31).
	 *    b) There is at least one printable character belonging to the
	 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
	 * - BINARY otherwise.
	 * - The following partially-portable control characters form a
	 *   "gray list" that is ignored in this detection algorithm:
	 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
	 * IN assertion: the fields Freq of dyn_ltree are set.
	 */
	function detect_data_type(s) {
	  /* black_mask is the bit mask of black-listed bytes
	   * set bits 0..6, 14..25, and 28..31
	   * 0xf3ffc07f = binary 11110011111111111100000001111111
	   */
	  var black_mask = 0xf3ffc07f;
	  var n;

	  /* Check for non-textual ("black-listed") bytes. */
	  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
	    if ((black_mask & 1) && (s.dyn_ltree[n * 2] /*.Freq*/ !== 0)) {
	      return Z_BINARY$1;
	    }
	  }

	  /* Check for textual ("white-listed") bytes. */
	  if (s.dyn_ltree[9 * 2] /*.Freq*/ !== 0 || s.dyn_ltree[10 * 2] /*.Freq*/ !== 0 ||
	    s.dyn_ltree[13 * 2] /*.Freq*/ !== 0) {
	    return Z_TEXT$1;
	  }
	  for (n = 32; n < LITERALS$1; n++) {
	    if (s.dyn_ltree[n * 2] /*.Freq*/ !== 0) {
	      return Z_TEXT$1;
	    }
	  }

	  /* There are no "black-listed" or "white-listed" bytes:
	   * this stream either is empty or has tolerated ("gray-listed") bytes only.
	   */
	  return Z_BINARY$1;
	}


	var static_init_done = false;

	/* ===========================================================================
	 * Initialize the tree data structures for a new zlib stream.
	 */
	function _tr_init(s) {

	  if (!static_init_done) {
	    tr_static_init();
	    static_init_done = true;
	  }

	  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
	  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
	  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

	  s.bi_buf = 0;
	  s.bi_valid = 0;

	  /* Initialize the first block of the first file: */
	  init_block(s);
	}


	/* ===========================================================================
	 * Send a stored block
	 */
	function _tr_stored_block(s, buf, stored_len, last)
	//DeflateState *s;
	//charf *buf;       /* input block */
	//ulg stored_len;   /* length of input block */
	//int last;         /* one if this is the last block for a file */
	{
	  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3); /* send block type */
	  copy_block(s, buf, stored_len, true); /* with header */
	}


	/* ===========================================================================
	 * Send one empty static block to give enough lookahead for inflate.
	 * This takes 10 bits, of which 7 may remain in the bit buffer.
	 */
	function _tr_align(s) {
	  send_bits(s, STATIC_TREES << 1, 3);
	  send_code(s, END_BLOCK, static_ltree);
	  bi_flush(s);
	}


	/* ===========================================================================
	 * Determine the best encoding for the current block: dynamic trees, static
	 * trees or store, and output the encoded block to the zip file.
	 */
	function _tr_flush_block(s, buf, stored_len, last)
	//DeflateState *s;
	//charf *buf;       /* input block, or NULL if too old */
	//ulg stored_len;   /* length of input block */
	//int last;         /* one if this is the last block for a file */
	{
	  var opt_lenb, static_lenb; /* opt_len and static_len in bytes */
	  var max_blindex = 0; /* index of last bit length code of non zero freq */

	  /* Build the Huffman trees unless a stored block is forced */
	  if (s.level > 0) {

	    /* Check if the file is binary or text */
	    if (s.strm.data_type === Z_UNKNOWN$2) {
	      s.strm.data_type = detect_data_type(s);
	    }

	    /* Construct the literal and distance trees */
	    build_tree(s, s.l_desc);
	    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
	    //        s->static_len));

	    build_tree(s, s.d_desc);
	    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
	    //        s->static_len));
	    /* At this point, opt_len and static_len are the total bit lengths of
	     * the compressed block data, excluding the tree representations.
	     */

	    /* Build the bit length tree for the above two trees, and get the index
	     * in bl_order of the last bit length code to send.
	     */
	    max_blindex = build_bl_tree(s);

	    /* Determine the best encoding. Compute the block lengths in bytes. */
	    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
	    static_lenb = (s.static_len + 3 + 7) >>> 3;

	    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
	    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
	    //        s->last_lit));

	    if (static_lenb <= opt_lenb) {
	      opt_lenb = static_lenb;
	    }

	  } else {
	    // Assert(buf != (char*)0, "lost buf");
	    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
	  }

	  if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
	    /* 4: two words for the lengths */

	    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
	     * Otherwise we can't have processed more than WSIZE input bytes since
	     * the last block flush, because compression would have been
	     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
	     * transform a block into a stored block.
	     */
	    _tr_stored_block(s, buf, stored_len, last);

	  } else if (s.strategy === Z_FIXED$2 || static_lenb === opt_lenb) {

	    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
	    compress_block(s, static_ltree, static_dtree);

	  } else {
	    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
	    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
	    compress_block(s, s.dyn_ltree, s.dyn_dtree);
	  }
	  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
	  /* The above check is made mod 2^32, for files larger than 512 MB
	   * and uLong implemented on 32 bits.
	   */
	  init_block(s);

	  if (last) {
	    bi_windup(s);
	  }
	  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
	  //       s->compressed_len-7*last));
	}

	/* ===========================================================================
	 * Save the match info and tally the frequency counts. Return true if
	 * the current block must be flushed.
	 */
	function _tr_tally(s, dist, lc)
	//    deflate_state *s;
	//    unsigned dist;  /* distance of matched string */
	//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
	{
	  //var out_length, in_length, dcode;

	  s.pending_buf[s.d_buf + s.last_lit * 2] = (dist >>> 8) & 0xff;
	  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

	  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
	  s.last_lit++;

	  if (dist === 0) {
	    /* lc is the unmatched char */
	    s.dyn_ltree[lc * 2] /*.Freq*/ ++;
	  } else {
	    s.matches++;
	    /* Here, lc is the match length - MIN_MATCH */
	    dist--; /* dist = match distance - 1 */
	    //Assert((ush)dist < (ush)MAX_DIST(s) &&
	    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
	    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

	    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2] /*.Freq*/ ++;
	    s.dyn_dtree[d_code(dist) * 2] /*.Freq*/ ++;
	  }

	  // (!) This block is disabled in zlib defailts,
	  // don't enable it for binary compatibility

	  //#ifdef TRUNCATE_BLOCK
	  //  /* Try to guess if it is profitable to stop the current block here */
	  //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
	  //    /* Compute an upper bound for the compressed length */
	  //    out_length = s.last_lit*8;
	  //    in_length = s.strstart - s.block_start;
	  //
	  //    for (dcode = 0; dcode < D_CODES; dcode++) {
	  //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
	  //    }
	  //    out_length >>>= 3;
	  //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
	  //    //       s->last_lit, in_length, out_length,
	  //    //       100L - out_length*100L/in_length));
	  //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
	  //      return true;
	  //    }
	  //  }
	  //#endif

	  return (s.last_lit === s.lit_bufsize - 1);
	  /* We avoid equality with lit_bufsize because of wraparound at 64K
	   * on 16 bit machines and because stored blocks are restricted to
	   * 64K-1 bytes.
	   */
	}

	// Note: adler32 takes 12% for level 0 and 2% for level 6.
	// It doesn't worth to make additional optimizationa as in original.
	// Small size is preferable.

	function adler32(adler, buf, len, pos) {
	  var s1 = (adler & 0xffff) |0,
	      s2 = ((adler >>> 16) & 0xffff) |0,
	      n = 0;

	  while (len !== 0) {
	    // Set limit ~ twice less than 5552, to keep
	    // s2 in 31-bits, because we force signed ints.
	    // in other case %= will fail.
	    n = len > 2000 ? 2000 : len;
	    len -= n;

	    do {
	      s1 = (s1 + buf[pos++]) |0;
	      s2 = (s2 + s1) |0;
	    } while (--n);

	    s1 %= 65521;
	    s2 %= 65521;
	  }

	  return (s1 | (s2 << 16)) |0;
	}

	// Note: we can't get significant speed boost here.
	// So write code to minimize size - no pregenerated tables
	// and array tools dependencies.


	// Use ordinary array, since untyped makes no boost here
	function makeTable() {
	  var c, table = [];

	  for (var n = 0; n < 256; n++) {
	    c = n;
	    for (var k = 0; k < 8; k++) {
	      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
	    }
	    table[n] = c;
	  }

	  return table;
	}

	// Create table on load. Just 255 signed longs. Not a problem.
	var crcTable$1 = makeTable();


	function crc32(crc, buf, len, pos) {
	  var t = crcTable$1,
	      end = pos + len;

	  crc ^= -1;

	  for (var i = pos; i < end; i++) {
	    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
	  }

	  return (crc ^ (-1)); // >>> 0;
	}

	/* Public constants ==========================================================*/
	/* ===========================================================================*/


	/* Allowed flush values; see deflate() and inflate() below for details */
	var Z_NO_FLUSH$1 = 0;
	var Z_PARTIAL_FLUSH$1 = 1;
	//var Z_SYNC_FLUSH    = 2;
	var Z_FULL_FLUSH$1 = 3;
	var Z_FINISH$2 = 4;
	var Z_BLOCK$2 = 5;
	//var Z_TREES         = 6;


	/* Return codes for the compression/decompression functions. Negative values
	 * are errors, positive values are used for special but normal events.
	 */
	var Z_OK$2 = 0;
	var Z_STREAM_END$2 = 1;
	//var Z_NEED_DICT     = 2;
	//var Z_ERRNO         = -1;
	var Z_STREAM_ERROR$2 = -2;
	var Z_DATA_ERROR$2 = -3;
	//var Z_MEM_ERROR     = -4;
	var Z_BUF_ERROR$2 = -5;
	//var Z_VERSION_ERROR = -6;


	/* compression levels */
	//var Z_NO_COMPRESSION      = 0;
	//var Z_BEST_SPEED          = 1;
	//var Z_BEST_COMPRESSION    = 9;
	var Z_DEFAULT_COMPRESSION$1 = -1;


	var Z_FILTERED$1 = 1;
	var Z_HUFFMAN_ONLY$1 = 2;
	var Z_RLE$1 = 3;
	var Z_FIXED$1 = 4;

	/* Possible values of the data_type field (though see inflate()) */
	//var Z_BINARY              = 0;
	//var Z_TEXT                = 1;
	//var Z_ASCII               = 1; // = Z_TEXT
	var Z_UNKNOWN$1 = 2;


	/* The deflate compression method */
	var Z_DEFLATED$2 = 8;

	/*============================================================================*/


	var MAX_MEM_LEVEL = 9;


	var LENGTH_CODES = 29;
	/* number of length codes, not counting the special END_BLOCK code */
	var LITERALS = 256;
	/* number of literal bytes 0..255 */
	var L_CODES = LITERALS + 1 + LENGTH_CODES;
	/* number of Literal or Length codes, including the END_BLOCK code */
	var D_CODES = 30;
	/* number of distance codes */
	var BL_CODES = 19;
	/* number of codes used to transfer the bit lengths */
	var HEAP_SIZE = 2 * L_CODES + 1;
	/* maximum heap size */
	var MAX_BITS = 15;
	/* All codes must not exceed MAX_BITS bits */

	var MIN_MATCH = 3;
	var MAX_MATCH = 258;
	var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

	var PRESET_DICT = 0x20;

	var INIT_STATE = 42;
	var EXTRA_STATE = 69;
	var NAME_STATE = 73;
	var COMMENT_STATE = 91;
	var HCRC_STATE = 103;
	var BUSY_STATE = 113;
	var FINISH_STATE = 666;

	var BS_NEED_MORE = 1; /* block not completed, need more input or more output */
	var BS_BLOCK_DONE = 2; /* block flush performed */
	var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
	var BS_FINISH_DONE = 4; /* finish done, accept no more input or output */

	var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

	function err(strm, errorCode) {
	  strm.msg = msg[errorCode];
	  return errorCode;
	}

	function rank(f) {
	  return ((f) << 1) - ((f) > 4 ? 9 : 0);
	}

	function zero(buf) {
	  var len = buf.length;
	  while (--len >= 0) {
	    buf[len] = 0;
	  }
	}


	/* =========================================================================
	 * Flush as much pending output as possible. All deflate() output goes
	 * through this function so some applications may wish to modify it
	 * to avoid allocating a large strm->output buffer and copying into it.
	 * (See also read_buf()).
	 */
	function flush_pending(strm) {
	  var s = strm.state;

	  //_tr_flush_bits(s);
	  var len = s.pending;
	  if (len > strm.avail_out) {
	    len = strm.avail_out;
	  }
	  if (len === 0) {
	    return;
	  }

	  arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
	  strm.next_out += len;
	  s.pending_out += len;
	  strm.total_out += len;
	  strm.avail_out -= len;
	  s.pending -= len;
	  if (s.pending === 0) {
	    s.pending_out = 0;
	  }
	}


	function flush_block_only(s, last) {
	  _tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
	  s.block_start = s.strstart;
	  flush_pending(s.strm);
	}


	function put_byte(s, b) {
	  s.pending_buf[s.pending++] = b;
	}


	/* =========================================================================
	 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
	 * IN assertion: the stream state is correct and there is enough room in
	 * pending_buf.
	 */
	function putShortMSB(s, b) {
	  //  put_byte(s, (Byte)(b >> 8));
	  //  put_byte(s, (Byte)(b & 0xff));
	  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
	  s.pending_buf[s.pending++] = b & 0xff;
	}


	/* ===========================================================================
	 * Read a new buffer from the current input stream, update the adler32
	 * and total number of bytes read.  All deflate() input goes through
	 * this function so some applications may wish to modify it to avoid
	 * allocating a large strm->input buffer and copying from it.
	 * (See also flush_pending()).
	 */
	function read_buf(strm, buf, start, size) {
	  var len = strm.avail_in;

	  if (len > size) {
	    len = size;
	  }
	  if (len === 0) {
	    return 0;
	  }

	  strm.avail_in -= len;

	  // zmemcpy(buf, strm->next_in, len);
	  arraySet(buf, strm.input, strm.next_in, len, start);
	  if (strm.state.wrap === 1) {
	    strm.adler = adler32(strm.adler, buf, len, start);
	  } else if (strm.state.wrap === 2) {
	    strm.adler = crc32(strm.adler, buf, len, start);
	  }

	  strm.next_in += len;
	  strm.total_in += len;

	  return len;
	}


	/* ===========================================================================
	 * Set match_start to the longest match starting at the given string and
	 * return its length. Matches shorter or equal to prev_length are discarded,
	 * in which case the result is equal to prev_length and match_start is
	 * garbage.
	 * IN assertions: cur_match is the head of the hash chain for the current
	 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
	 * OUT assertion: the match length is not greater than s->lookahead.
	 */
	function longest_match(s, cur_match) {
	  var chain_length = s.max_chain_length; /* max hash chain length */
	  var scan = s.strstart; /* current string */
	  var match; /* matched string */
	  var len; /* length of current match */
	  var best_len = s.prev_length; /* best match length so far */
	  var nice_match = s.nice_match; /* stop if match long enough */
	  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
	    s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0 /*NIL*/ ;

	  var _win = s.window; // shortcut

	  var wmask = s.w_mask;
	  var prev = s.prev;

	  /* Stop when cur_match becomes <= limit. To simplify the code,
	   * we prevent matches with the string of window index 0.
	   */

	  var strend = s.strstart + MAX_MATCH;
	  var scan_end1 = _win[scan + best_len - 1];
	  var scan_end = _win[scan + best_len];

	  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
	   * It is easy to get rid of this optimization if necessary.
	   */
	  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

	  /* Do not waste too much time if we already have a good match: */
	  if (s.prev_length >= s.good_match) {
	    chain_length >>= 2;
	  }
	  /* Do not look for matches beyond the end of the input. This is necessary
	   * to make deflate deterministic.
	   */
	  if (nice_match > s.lookahead) {
	    nice_match = s.lookahead;
	  }

	  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

	  do {
	    // Assert(cur_match < s->strstart, "no future");
	    match = cur_match;

	    /* Skip to next match if the match length cannot increase
	     * or if the match length is less than 2.  Note that the checks below
	     * for insufficient lookahead only occur occasionally for performance
	     * reasons.  Therefore uninitialized memory will be accessed, and
	     * conditional jumps will be made that depend on those values.
	     * However the length of the match is limited to the lookahead, so
	     * the output of deflate is not affected by the uninitialized values.
	     */

	    if (_win[match + best_len] !== scan_end ||
	      _win[match + best_len - 1] !== scan_end1 ||
	      _win[match] !== _win[scan] ||
	      _win[++match] !== _win[scan + 1]) {
	      continue;
	    }

	    /* The check at best_len-1 can be removed because it will be made
	     * again later. (This heuristic is not always a win.)
	     * It is not necessary to compare scan[2] and match[2] since they
	     * are always equal when the other bytes match, given that
	     * the hash keys are equal and that HASH_BITS >= 8.
	     */
	    scan += 2;
	    match++;
	    // Assert(*scan == *match, "match[2]?");

	    /* We check for insufficient lookahead only every 8th comparison;
	     * the 256th check will be made at strstart+258.
	     */
	    do {
	      /*jshint noempty:false*/
	    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
	      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
	      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
	      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
	      scan < strend);

	    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

	    len = MAX_MATCH - (strend - scan);
	    scan = strend - MAX_MATCH;

	    if (len > best_len) {
	      s.match_start = cur_match;
	      best_len = len;
	      if (len >= nice_match) {
	        break;
	      }
	      scan_end1 = _win[scan + best_len - 1];
	      scan_end = _win[scan + best_len];
	    }
	  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

	  if (best_len <= s.lookahead) {
	    return best_len;
	  }
	  return s.lookahead;
	}


	/* ===========================================================================
	 * Fill the window when the lookahead becomes insufficient.
	 * Updates strstart and lookahead.
	 *
	 * IN assertion: lookahead < MIN_LOOKAHEAD
	 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
	 *    At least one byte has been read, or avail_in == 0; reads are
	 *    performed for at least two bytes (required for the zip translate_eol
	 *    option -- not supported here).
	 */
	function fill_window(s) {
	  var _w_size = s.w_size;
	  var p, n, m, more, str;

	  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

	  do {
	    more = s.window_size - s.lookahead - s.strstart;

	    // JS ints have 32 bit, block below not needed
	    /* Deal with !@#$% 64K limit: */
	    //if (sizeof(int) <= 2) {
	    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
	    //        more = wsize;
	    //
	    //  } else if (more == (unsigned)(-1)) {
	    //        /* Very unlikely, but possible on 16 bit machine if
	    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
	    //         */
	    //        more--;
	    //    }
	    //}


	    /* If the window is almost full and there is insufficient lookahead,
	     * move the upper half to the lower one to make room in the upper half.
	     */
	    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

	      arraySet(s.window, s.window, _w_size, _w_size, 0);
	      s.match_start -= _w_size;
	      s.strstart -= _w_size;
	      /* we now have strstart >= MAX_DIST */
	      s.block_start -= _w_size;

	      /* Slide the hash table (could be avoided with 32 bit values
	       at the expense of memory usage). We slide even when level == 0
	       to keep the hash table consistent if we switch back to level > 0
	       later. (Using level 0 permanently is not an optimal usage of
	       zlib, so we don't care about this pathological case.)
	       */

	      n = s.hash_size;
	      p = n;
	      do {
	        m = s.head[--p];
	        s.head[p] = (m >= _w_size ? m - _w_size : 0);
	      } while (--n);

	      n = _w_size;
	      p = n;
	      do {
	        m = s.prev[--p];
	        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
	        /* If n is not on any hash chain, prev[n] is garbage but
	         * its value will never be used.
	         */
	      } while (--n);

	      more += _w_size;
	    }
	    if (s.strm.avail_in === 0) {
	      break;
	    }

	    /* If there was no sliding:
	     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
	     *    more == window_size - lookahead - strstart
	     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
	     * => more >= window_size - 2*WSIZE + 2
	     * In the BIG_MEM or MMAP case (not yet supported),
	     *   window_size == input_size + MIN_LOOKAHEAD  &&
	     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
	     * Otherwise, window_size == 2*WSIZE so more >= 2.
	     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
	     */
	    //Assert(more >= 2, "more < 2");
	    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
	    s.lookahead += n;

	    /* Initialize the hash value now that we have some input: */
	    if (s.lookahead + s.insert >= MIN_MATCH) {
	      str = s.strstart - s.insert;
	      s.ins_h = s.window[str];

	      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
	      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
	      //#if MIN_MATCH != 3
	      //        Call update_hash() MIN_MATCH-3 more times
	      //#endif
	      while (s.insert) {
	        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
	        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

	        s.prev[str & s.w_mask] = s.head[s.ins_h];
	        s.head[s.ins_h] = str;
	        str++;
	        s.insert--;
	        if (s.lookahead + s.insert < MIN_MATCH) {
	          break;
	        }
	      }
	    }
	    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
	     * but this is not important since only literal bytes will be emitted.
	     */

	  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

	  /* If the WIN_INIT bytes after the end of the current data have never been
	   * written, then zero those bytes in order to avoid memory check reports of
	   * the use of uninitialized (or uninitialised as Julian writes) bytes by
	   * the longest match routines.  Update the high water mark for the next
	   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
	   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
	   */
	  //  if (s.high_water < s.window_size) {
	  //    var curr = s.strstart + s.lookahead;
	  //    var init = 0;
	  //
	  //    if (s.high_water < curr) {
	  //      /* Previous high water mark below current data -- zero WIN_INIT
	  //       * bytes or up to end of window, whichever is less.
	  //       */
	  //      init = s.window_size - curr;
	  //      if (init > WIN_INIT)
	  //        init = WIN_INIT;
	  //      zmemzero(s->window + curr, (unsigned)init);
	  //      s->high_water = curr + init;
	  //    }
	  //    else if (s->high_water < (ulg)curr + WIN_INIT) {
	  //      /* High water mark at or above current data, but below current data
	  //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
	  //       * to end of window, whichever is less.
	  //       */
	  //      init = (ulg)curr + WIN_INIT - s->high_water;
	  //      if (init > s->window_size - s->high_water)
	  //        init = s->window_size - s->high_water;
	  //      zmemzero(s->window + s->high_water, (unsigned)init);
	  //      s->high_water += init;
	  //    }
	  //  }
	  //
	  //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
	  //    "not enough room for search");
	}

	/* ===========================================================================
	 * Copy without compression as much as possible from the input stream, return
	 * the current block state.
	 * This function does not insert new strings in the dictionary since
	 * uncompressible data is probably not useful. This function is used
	 * only for the level=0 compression option.
	 * NOTE: this function should be optimized to avoid extra copying from
	 * window to pending_buf.
	 */
	function deflate_stored(s, flush) {
	  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
	   * to pending_buf_size, and each stored block has a 5 byte header:
	   */
	  var max_block_size = 0xffff;

	  if (max_block_size > s.pending_buf_size - 5) {
	    max_block_size = s.pending_buf_size - 5;
	  }

	  /* Copy as much as possible from input to output: */
	  for (;;) {
	    /* Fill the window as much as possible: */
	    if (s.lookahead <= 1) {

	      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
	      //  s->block_start >= (long)s->w_size, "slide too late");
	      //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
	      //        s.block_start >= s.w_size)) {
	      //        throw  new Error("slide too late");
	      //      }

	      fill_window(s);
	      if (s.lookahead === 0 && flush === Z_NO_FLUSH$1) {
	        return BS_NEED_MORE;
	      }

	      if (s.lookahead === 0) {
	        break;
	      }
	      /* flush the current block */
	    }
	    //Assert(s->block_start >= 0L, "block gone");
	    //    if (s.block_start < 0) throw new Error("block gone");

	    s.strstart += s.lookahead;
	    s.lookahead = 0;

	    /* Emit a stored block if pending_buf will be full: */
	    var max_start = s.block_start + max_block_size;

	    if (s.strstart === 0 || s.strstart >= max_start) {
	      /* strstart == 0 is possible when wraparound on 16-bit machine */
	      s.lookahead = s.strstart - max_start;
	      s.strstart = max_start;
	      /*** FLUSH_BLOCK(s, 0); ***/
	      flush_block_only(s, false);
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	      /***/


	    }
	    /* Flush if we may have to slide, otherwise block_start may become
	     * negative and the data will be gone:
	     */
	    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
	      /*** FLUSH_BLOCK(s, 0); ***/
	      flush_block_only(s, false);
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	      /***/
	    }
	  }

	  s.insert = 0;

	  if (flush === Z_FINISH$2) {
	    /*** FLUSH_BLOCK(s, 1); ***/
	    flush_block_only(s, true);
	    if (s.strm.avail_out === 0) {
	      return BS_FINISH_STARTED;
	    }
	    /***/
	    return BS_FINISH_DONE;
	  }

	  if (s.strstart > s.block_start) {
	    /*** FLUSH_BLOCK(s, 0); ***/
	    flush_block_only(s, false);
	    if (s.strm.avail_out === 0) {
	      return BS_NEED_MORE;
	    }
	    /***/
	  }

	  return BS_NEED_MORE;
	}

	/* ===========================================================================
	 * Compress as much as possible from the input stream, return the current
	 * block state.
	 * This function does not perform lazy evaluation of matches and inserts
	 * new strings in the dictionary only for unmatched strings or for short
	 * matches. It is used only for the fast compression options.
	 */
	function deflate_fast(s, flush) {
	  var hash_head; /* head of the hash chain */
	  var bflush; /* set if current block must be flushed */

	  for (;;) {
	    /* Make sure that we always have enough lookahead, except
	     * at the end of the input file. We need MAX_MATCH bytes
	     * for the next match, plus MIN_MATCH bytes to insert the
	     * string following the next match.
	     */
	    if (s.lookahead < MIN_LOOKAHEAD) {
	      fill_window(s);
	      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
	        return BS_NEED_MORE;
	      }
	      if (s.lookahead === 0) {
	        break; /* flush the current block */
	      }
	    }

	    /* Insert the string window[strstart .. strstart+2] in the
	     * dictionary, and set hash_head to the head of the hash chain:
	     */
	    hash_head = 0 /*NIL*/ ;
	    if (s.lookahead >= MIN_MATCH) {
	      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	      s.head[s.ins_h] = s.strstart;
	      /***/
	    }

	    /* Find the longest match, discarding those <= prev_length.
	     * At this point we have always match_length < MIN_MATCH
	     */
	    if (hash_head !== 0 /*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
	      /* To simplify the code, we prevent matches with the string
	       * of window index 0 (in particular we have to avoid a match
	       * of the string with itself at the start of the input file).
	       */
	      s.match_length = longest_match(s, hash_head);
	      /* longest_match() sets match_start */
	    }
	    if (s.match_length >= MIN_MATCH) {
	      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

	      /*** _tr_tally_dist(s, s.strstart - s.match_start,
	                     s.match_length - MIN_MATCH, bflush); ***/
	      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

	      s.lookahead -= s.match_length;

	      /* Insert new strings in the hash table only if the match length
	       * is not too large. This saves time but degrades compression.
	       */
	      if (s.match_length <= s.max_lazy_match /*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
	        s.match_length--; /* string at strstart already in table */
	        do {
	          s.strstart++;
	          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	          s.head[s.ins_h] = s.strstart;
	          /***/
	          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
	           * always MIN_MATCH bytes ahead.
	           */
	        } while (--s.match_length !== 0);
	        s.strstart++;
	      } else {
	        s.strstart += s.match_length;
	        s.match_length = 0;
	        s.ins_h = s.window[s.strstart];
	        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
	        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

	        //#if MIN_MATCH != 3
	        //                Call UPDATE_HASH() MIN_MATCH-3 more times
	        //#endif
	        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
	         * matter since it will be recomputed at next deflate call.
	         */
	      }
	    } else {
	      /* No match, output a literal byte */
	      //Tracevv((stderr,"%c", s.window[s.strstart]));
	      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	      bflush = _tr_tally(s, 0, s.window[s.strstart]);

	      s.lookahead--;
	      s.strstart++;
	    }
	    if (bflush) {
	      /*** FLUSH_BLOCK(s, 0); ***/
	      flush_block_only(s, false);
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	      /***/
	    }
	  }
	  s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
	  if (flush === Z_FINISH$2) {
	    /*** FLUSH_BLOCK(s, 1); ***/
	    flush_block_only(s, true);
	    if (s.strm.avail_out === 0) {
	      return BS_FINISH_STARTED;
	    }
	    /***/
	    return BS_FINISH_DONE;
	  }
	  if (s.last_lit) {
	    /*** FLUSH_BLOCK(s, 0); ***/
	    flush_block_only(s, false);
	    if (s.strm.avail_out === 0) {
	      return BS_NEED_MORE;
	    }
	    /***/
	  }
	  return BS_BLOCK_DONE;
	}

	/* ===========================================================================
	 * Same as above, but achieves better compression. We use a lazy
	 * evaluation for matches: a match is finally adopted only if there is
	 * no better match at the next window position.
	 */
	function deflate_slow(s, flush) {
	  var hash_head; /* head of hash chain */
	  var bflush; /* set if current block must be flushed */

	  var max_insert;

	  /* Process the input block. */
	  for (;;) {
	    /* Make sure that we always have enough lookahead, except
	     * at the end of the input file. We need MAX_MATCH bytes
	     * for the next match, plus MIN_MATCH bytes to insert the
	     * string following the next match.
	     */
	    if (s.lookahead < MIN_LOOKAHEAD) {
	      fill_window(s);
	      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
	        return BS_NEED_MORE;
	      }
	      if (s.lookahead === 0) {
	        break;
	      } /* flush the current block */
	    }

	    /* Insert the string window[strstart .. strstart+2] in the
	     * dictionary, and set hash_head to the head of the hash chain:
	     */
	    hash_head = 0 /*NIL*/ ;
	    if (s.lookahead >= MIN_MATCH) {
	      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	      s.head[s.ins_h] = s.strstart;
	      /***/
	    }

	    /* Find the longest match, discarding those <= prev_length.
	     */
	    s.prev_length = s.match_length;
	    s.prev_match = s.match_start;
	    s.match_length = MIN_MATCH - 1;

	    if (hash_head !== 0 /*NIL*/ && s.prev_length < s.max_lazy_match &&
	      s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD) /*MAX_DIST(s)*/ ) {
	      /* To simplify the code, we prevent matches with the string
	       * of window index 0 (in particular we have to avoid a match
	       * of the string with itself at the start of the input file).
	       */
	      s.match_length = longest_match(s, hash_head);
	      /* longest_match() sets match_start */

	      if (s.match_length <= 5 &&
	        (s.strategy === Z_FILTERED$1 || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096 /*TOO_FAR*/ ))) {

	        /* If prev_match is also MIN_MATCH, match_start is garbage
	         * but we will ignore the current match anyway.
	         */
	        s.match_length = MIN_MATCH - 1;
	      }
	    }
	    /* If there was a match at the previous step and the current
	     * match is not better, output the previous match:
	     */
	    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
	      max_insert = s.strstart + s.lookahead - MIN_MATCH;
	      /* Do not insert strings in hash table beyond this. */

	      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

	      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
	                     s.prev_length - MIN_MATCH, bflush);***/
	      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
	      /* Insert in hash table all strings up to the end of the match.
	       * strstart-1 and strstart are already inserted. If there is not
	       * enough lookahead, the last two strings are not inserted in
	       * the hash table.
	       */
	      s.lookahead -= s.prev_length - 1;
	      s.prev_length -= 2;
	      do {
	        if (++s.strstart <= max_insert) {
	          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
	          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
	          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
	          s.head[s.ins_h] = s.strstart;
	          /***/
	        }
	      } while (--s.prev_length !== 0);
	      s.match_available = 0;
	      s.match_length = MIN_MATCH - 1;
	      s.strstart++;

	      if (bflush) {
	        /*** FLUSH_BLOCK(s, 0); ***/
	        flush_block_only(s, false);
	        if (s.strm.avail_out === 0) {
	          return BS_NEED_MORE;
	        }
	        /***/
	      }

	    } else if (s.match_available) {
	      /* If there was no match at the previous position, output a
	       * single literal. If there was a match but the current match
	       * is longer, truncate the previous match to a single literal.
	       */
	      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
	      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
	      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

	      if (bflush) {
	        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
	        flush_block_only(s, false);
	        /***/
	      }
	      s.strstart++;
	      s.lookahead--;
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	    } else {
	      /* There is no previous match to compare with, wait for
	       * the next step to decide.
	       */
	      s.match_available = 1;
	      s.strstart++;
	      s.lookahead--;
	    }
	  }
	  //Assert (flush != Z_NO_FLUSH, "no flush?");
	  if (s.match_available) {
	    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
	    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
	    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

	    s.match_available = 0;
	  }
	  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
	  if (flush === Z_FINISH$2) {
	    /*** FLUSH_BLOCK(s, 1); ***/
	    flush_block_only(s, true);
	    if (s.strm.avail_out === 0) {
	      return BS_FINISH_STARTED;
	    }
	    /***/
	    return BS_FINISH_DONE;
	  }
	  if (s.last_lit) {
	    /*** FLUSH_BLOCK(s, 0); ***/
	    flush_block_only(s, false);
	    if (s.strm.avail_out === 0) {
	      return BS_NEED_MORE;
	    }
	    /***/
	  }

	  return BS_BLOCK_DONE;
	}


	/* ===========================================================================
	 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
	 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
	 * deflate switches away from Z_RLE.)
	 */
	function deflate_rle(s, flush) {
	  var bflush; /* set if current block must be flushed */
	  var prev; /* byte at distance one to match */
	  var scan, strend; /* scan goes up to strend for length of run */

	  var _win = s.window;

	  for (;;) {
	    /* Make sure that we always have enough lookahead, except
	     * at the end of the input file. We need MAX_MATCH bytes
	     * for the longest run, plus one for the unrolled loop.
	     */
	    if (s.lookahead <= MAX_MATCH) {
	      fill_window(s);
	      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$1) {
	        return BS_NEED_MORE;
	      }
	      if (s.lookahead === 0) {
	        break;
	      } /* flush the current block */
	    }

	    /* See how many times the previous byte repeats */
	    s.match_length = 0;
	    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
	      scan = s.strstart - 1;
	      prev = _win[scan];
	      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
	        strend = s.strstart + MAX_MATCH;
	        do {
	          /*jshint noempty:false*/
	        } while (prev === _win[++scan] && prev === _win[++scan] &&
	          prev === _win[++scan] && prev === _win[++scan] &&
	          prev === _win[++scan] && prev === _win[++scan] &&
	          prev === _win[++scan] && prev === _win[++scan] &&
	          scan < strend);
	        s.match_length = MAX_MATCH - (strend - scan);
	        if (s.match_length > s.lookahead) {
	          s.match_length = s.lookahead;
	        }
	      }
	      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
	    }

	    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
	    if (s.match_length >= MIN_MATCH) {
	      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

	      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
	      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);

	      s.lookahead -= s.match_length;
	      s.strstart += s.match_length;
	      s.match_length = 0;
	    } else {
	      /* No match, output a literal byte */
	      //Tracevv((stderr,"%c", s->window[s->strstart]));
	      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	      bflush = _tr_tally(s, 0, s.window[s.strstart]);

	      s.lookahead--;
	      s.strstart++;
	    }
	    if (bflush) {
	      /*** FLUSH_BLOCK(s, 0); ***/
	      flush_block_only(s, false);
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	      /***/
	    }
	  }
	  s.insert = 0;
	  if (flush === Z_FINISH$2) {
	    /*** FLUSH_BLOCK(s, 1); ***/
	    flush_block_only(s, true);
	    if (s.strm.avail_out === 0) {
	      return BS_FINISH_STARTED;
	    }
	    /***/
	    return BS_FINISH_DONE;
	  }
	  if (s.last_lit) {
	    /*** FLUSH_BLOCK(s, 0); ***/
	    flush_block_only(s, false);
	    if (s.strm.avail_out === 0) {
	      return BS_NEED_MORE;
	    }
	    /***/
	  }
	  return BS_BLOCK_DONE;
	}

	/* ===========================================================================
	 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
	 * (It will be regenerated if this run of deflate switches away from Huffman.)
	 */
	function deflate_huff(s, flush) {
	  var bflush; /* set if current block must be flushed */

	  for (;;) {
	    /* Make sure that we have a literal to write. */
	    if (s.lookahead === 0) {
	      fill_window(s);
	      if (s.lookahead === 0) {
	        if (flush === Z_NO_FLUSH$1) {
	          return BS_NEED_MORE;
	        }
	        break; /* flush the current block */
	      }
	    }

	    /* Output a literal byte */
	    s.match_length = 0;
	    //Tracevv((stderr,"%c", s->window[s->strstart]));
	    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
	    bflush = _tr_tally(s, 0, s.window[s.strstart]);
	    s.lookahead--;
	    s.strstart++;
	    if (bflush) {
	      /*** FLUSH_BLOCK(s, 0); ***/
	      flush_block_only(s, false);
	      if (s.strm.avail_out === 0) {
	        return BS_NEED_MORE;
	      }
	      /***/
	    }
	  }
	  s.insert = 0;
	  if (flush === Z_FINISH$2) {
	    /*** FLUSH_BLOCK(s, 1); ***/
	    flush_block_only(s, true);
	    if (s.strm.avail_out === 0) {
	      return BS_FINISH_STARTED;
	    }
	    /***/
	    return BS_FINISH_DONE;
	  }
	  if (s.last_lit) {
	    /*** FLUSH_BLOCK(s, 0); ***/
	    flush_block_only(s, false);
	    if (s.strm.avail_out === 0) {
	      return BS_NEED_MORE;
	    }
	    /***/
	  }
	  return BS_BLOCK_DONE;
	}

	/* Values for max_lazy_match, good_match and max_chain_length, depending on
	 * the desired pack level (0..9). The values given below have been tuned to
	 * exclude worst case performance for pathological files. Better values may be
	 * found for specific files.
	 */
	function Config(good_length, max_lazy, nice_length, max_chain, func) {
	  this.good_length = good_length;
	  this.max_lazy = max_lazy;
	  this.nice_length = nice_length;
	  this.max_chain = max_chain;
	  this.func = func;
	}

	var configuration_table;

	configuration_table = [
	  /*      good lazy nice chain */
	  new Config(0, 0, 0, 0, deflate_stored), /* 0 store only */
	  new Config(4, 4, 8, 4, deflate_fast), /* 1 max speed, no lazy matches */
	  new Config(4, 5, 16, 8, deflate_fast), /* 2 */
	  new Config(4, 6, 32, 32, deflate_fast), /* 3 */

	  new Config(4, 4, 16, 16, deflate_slow), /* 4 lazy matches */
	  new Config(8, 16, 32, 32, deflate_slow), /* 5 */
	  new Config(8, 16, 128, 128, deflate_slow), /* 6 */
	  new Config(8, 32, 128, 256, deflate_slow), /* 7 */
	  new Config(32, 128, 258, 1024, deflate_slow), /* 8 */
	  new Config(32, 258, 258, 4096, deflate_slow) /* 9 max compression */
	];


	/* ===========================================================================
	 * Initialize the "longest match" routines for a new zlib stream
	 */
	function lm_init(s) {
	  s.window_size = 2 * s.w_size;

	  /*** CLEAR_HASH(s); ***/
	  zero(s.head); // Fill with NIL (= 0);

	  /* Set the default configuration parameters:
	   */
	  s.max_lazy_match = configuration_table[s.level].max_lazy;
	  s.good_match = configuration_table[s.level].good_length;
	  s.nice_match = configuration_table[s.level].nice_length;
	  s.max_chain_length = configuration_table[s.level].max_chain;

	  s.strstart = 0;
	  s.block_start = 0;
	  s.lookahead = 0;
	  s.insert = 0;
	  s.match_length = s.prev_length = MIN_MATCH - 1;
	  s.match_available = 0;
	  s.ins_h = 0;
	}


	function DeflateState() {
	  this.strm = null; /* pointer back to this zlib stream */
	  this.status = 0; /* as the name implies */
	  this.pending_buf = null; /* output still pending */
	  this.pending_buf_size = 0; /* size of pending_buf */
	  this.pending_out = 0; /* next pending byte to output to the stream */
	  this.pending = 0; /* nb of bytes in the pending buffer */
	  this.wrap = 0; /* bit 0 true for zlib, bit 1 true for gzip */
	  this.gzhead = null; /* gzip header information to write */
	  this.gzindex = 0; /* where in extra, name, or comment */
	  this.method = Z_DEFLATED$2; /* can only be DEFLATED */
	  this.last_flush = -1; /* value of flush param for previous deflate call */

	  this.w_size = 0; /* LZ77 window size (32K by default) */
	  this.w_bits = 0; /* log2(w_size)  (8..16) */
	  this.w_mask = 0; /* w_size - 1 */

	  this.window = null;
	  /* Sliding window. Input bytes are read into the second half of the window,
	   * and move to the first half later to keep a dictionary of at least wSize
	   * bytes. With this organization, matches are limited to a distance of
	   * wSize-MAX_MATCH bytes, but this ensures that IO is always
	   * performed with a length multiple of the block size.
	   */

	  this.window_size = 0;
	  /* Actual size of window: 2*wSize, except when the user input buffer
	   * is directly used as sliding window.
	   */

	  this.prev = null;
	  /* Link to older string with same hash index. To limit the size of this
	   * array to 64K, this link is maintained only for the last 32K strings.
	   * An index in this array is thus a window index modulo 32K.
	   */

	  this.head = null; /* Heads of the hash chains or NIL. */

	  this.ins_h = 0; /* hash index of string to be inserted */
	  this.hash_size = 0; /* number of elements in hash table */
	  this.hash_bits = 0; /* log2(hash_size) */
	  this.hash_mask = 0; /* hash_size-1 */

	  this.hash_shift = 0;
	  /* Number of bits by which ins_h must be shifted at each input
	   * step. It must be such that after MIN_MATCH steps, the oldest
	   * byte no longer takes part in the hash key, that is:
	   *   hash_shift * MIN_MATCH >= hash_bits
	   */

	  this.block_start = 0;
	  /* Window position at the beginning of the current output block. Gets
	   * negative when the window is moved backwards.
	   */

	  this.match_length = 0; /* length of best match */
	  this.prev_match = 0; /* previous match */
	  this.match_available = 0; /* set if previous match exists */
	  this.strstart = 0; /* start of string to insert */
	  this.match_start = 0; /* start of matching string */
	  this.lookahead = 0; /* number of valid bytes ahead in window */

	  this.prev_length = 0;
	  /* Length of the best match at previous step. Matches not greater than this
	   * are discarded. This is used in the lazy match evaluation.
	   */

	  this.max_chain_length = 0;
	  /* To speed up deflation, hash chains are never searched beyond this
	   * length.  A higher limit improves compression ratio but degrades the
	   * speed.
	   */

	  this.max_lazy_match = 0;
	  /* Attempt to find a better match only when the current match is strictly
	   * smaller than this value. This mechanism is used only for compression
	   * levels >= 4.
	   */
	  // That's alias to max_lazy_match, don't use directly
	  //this.max_insert_length = 0;
	  /* Insert new strings in the hash table only if the match length is not
	   * greater than this length. This saves time but degrades compression.
	   * max_insert_length is used only for compression levels <= 3.
	   */

	  this.level = 0; /* compression level (1..9) */
	  this.strategy = 0; /* favor or force Huffman coding*/

	  this.good_match = 0;
	  /* Use a faster search when the previous match is longer than this */

	  this.nice_match = 0; /* Stop searching when current match exceeds this */

	  /* used by c: */

	  /* Didn't use ct_data typedef below to suppress compiler warning */

	  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
	  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
	  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

	  // Use flat array of DOUBLE size, with interleaved fata,
	  // because JS does not support effective
	  this.dyn_ltree = new Buf16(HEAP_SIZE * 2);
	  this.dyn_dtree = new Buf16((2 * D_CODES + 1) * 2);
	  this.bl_tree = new Buf16((2 * BL_CODES + 1) * 2);
	  zero(this.dyn_ltree);
	  zero(this.dyn_dtree);
	  zero(this.bl_tree);

	  this.l_desc = null; /* desc. for literal tree */
	  this.d_desc = null; /* desc. for distance tree */
	  this.bl_desc = null; /* desc. for bit length tree */

	  //ush bl_count[MAX_BITS+1];
	  this.bl_count = new Buf16(MAX_BITS + 1);
	  /* number of codes at each bit length for an optimal tree */

	  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
	  this.heap = new Buf16(2 * L_CODES + 1); /* heap used to build the Huffman trees */
	  zero(this.heap);

	  this.heap_len = 0; /* number of elements in the heap */
	  this.heap_max = 0; /* element of largest frequency */
	  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
	   * The same heap array is used to build all
	   */

	  this.depth = new Buf16(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
	  zero(this.depth);
	  /* Depth of each subtree used as tie breaker for trees of equal frequency
	   */

	  this.l_buf = 0; /* buffer index for literals or lengths */

	  this.lit_bufsize = 0;
	  /* Size of match buffer for literals/lengths.  There are 4 reasons for
	   * limiting lit_bufsize to 64K:
	   *   - frequencies can be kept in 16 bit counters
	   *   - if compression is not successful for the first block, all input
	   *     data is still in the window so we can still emit a stored block even
	   *     when input comes from standard input.  (This can also be done for
	   *     all blocks if lit_bufsize is not greater than 32K.)
	   *   - if compression is not successful for a file smaller than 64K, we can
	   *     even emit a stored file instead of a stored block (saving 5 bytes).
	   *     This is applicable only for zip (not gzip or zlib).
	   *   - creating new Huffman trees less frequently may not provide fast
	   *     adaptation to changes in the input data statistics. (Take for
	   *     example a binary file with poorly compressible code followed by
	   *     a highly compressible string table.) Smaller buffer sizes give
	   *     fast adaptation but have of course the overhead of transmitting
	   *     trees more frequently.
	   *   - I can't count above 4
	   */

	  this.last_lit = 0; /* running index in l_buf */

	  this.d_buf = 0;
	  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
	   * the same number of elements. To use different lengths, an extra flag
	   * array would be necessary.
	   */

	  this.opt_len = 0; /* bit length of current block with optimal trees */
	  this.static_len = 0; /* bit length of current block with static trees */
	  this.matches = 0; /* number of string matches in current block */
	  this.insert = 0; /* bytes at end of window left to insert */


	  this.bi_buf = 0;
	  /* Output buffer. bits are inserted starting at the bottom (least
	   * significant bits).
	   */
	  this.bi_valid = 0;
	  /* Number of valid bits in bi_buf.  All bits above the last valid bit
	   * are always zero.
	   */

	  // Used for window memory init. We safely ignore it for JS. That makes
	  // sense only for pointers and memory check tools.
	  //this.high_water = 0;
	  /* High water mark offset in window for initialized bytes -- bytes above
	   * this are set to zero in order to avoid memory check warnings when
	   * longest match routines access bytes past the input.  This is then
	   * updated to the new high water mark.
	   */
	}


	function deflateResetKeep(strm) {
	  var s;

	  if (!strm || !strm.state) {
	    return err(strm, Z_STREAM_ERROR$2);
	  }

	  strm.total_in = strm.total_out = 0;
	  strm.data_type = Z_UNKNOWN$1;

	  s = strm.state;
	  s.pending = 0;
	  s.pending_out = 0;

	  if (s.wrap < 0) {
	    s.wrap = -s.wrap;
	    /* was made negative by deflate(..., Z_FINISH); */
	  }
	  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
	  strm.adler = (s.wrap === 2) ?
	    0 // crc32(0, Z_NULL, 0)
	    :
	    1; // adler32(0, Z_NULL, 0)
	  s.last_flush = Z_NO_FLUSH$1;
	  _tr_init(s);
	  return Z_OK$2;
	}


	function deflateReset(strm) {
	  var ret = deflateResetKeep(strm);
	  if (ret === Z_OK$2) {
	    lm_init(strm.state);
	  }
	  return ret;
	}


	function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
	  if (!strm) { // === Z_NULL
	    return Z_STREAM_ERROR$2;
	  }
	  var wrap = 1;

	  if (level === Z_DEFAULT_COMPRESSION$1) {
	    level = 6;
	  }

	  if (windowBits < 0) { /* suppress zlib wrapper */
	    wrap = 0;
	    windowBits = -windowBits;
	  } else if (windowBits > 15) {
	    wrap = 2; /* write gzip wrapper instead */
	    windowBits -= 16;
	  }


	  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 ||
	    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
	    strategy < 0 || strategy > Z_FIXED$1) {
	    return err(strm, Z_STREAM_ERROR$2);
	  }


	  if (windowBits === 8) {
	    windowBits = 9;
	  }
	  /* until 256-byte window bug fixed */

	  var s = new DeflateState();

	  strm.state = s;
	  s.strm = strm;

	  s.wrap = wrap;
	  s.gzhead = null;
	  s.w_bits = windowBits;
	  s.w_size = 1 << s.w_bits;
	  s.w_mask = s.w_size - 1;

	  s.hash_bits = memLevel + 7;
	  s.hash_size = 1 << s.hash_bits;
	  s.hash_mask = s.hash_size - 1;
	  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

	  s.window = new Buf8(s.w_size * 2);
	  s.head = new Buf16(s.hash_size);
	  s.prev = new Buf16(s.w_size);

	  // Don't need mem init magic for JS.
	  //s.high_water = 0;  /* nothing written to s->window yet */

	  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

	  s.pending_buf_size = s.lit_bufsize * 4;

	  //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
	  //s->pending_buf = (uchf *) overlay;
	  s.pending_buf = new Buf8(s.pending_buf_size);

	  // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
	  //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
	  s.d_buf = 1 * s.lit_bufsize;

	  //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
	  s.l_buf = (1 + 2) * s.lit_bufsize;

	  s.level = level;
	  s.strategy = strategy;
	  s.method = method;

	  return deflateReset(strm);
	}


	function deflate$1(strm, flush) {
	  var old_flush, s;
	  var beg, val; // for gzip header write only

	  if (!strm || !strm.state ||
	    flush > Z_BLOCK$2 || flush < 0) {
	    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
	  }

	  s = strm.state;

	  if (!strm.output ||
	    (!strm.input && strm.avail_in !== 0) ||
	    (s.status === FINISH_STATE && flush !== Z_FINISH$2)) {
	    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR$2 : Z_STREAM_ERROR$2);
	  }

	  s.strm = strm; /* just in case */
	  old_flush = s.last_flush;
	  s.last_flush = flush;

	  /* Write the header */
	  if (s.status === INIT_STATE) {
	    if (s.wrap === 2) {
	      // GZIP header
	      strm.adler = 0; //crc32(0L, Z_NULL, 0);
	      put_byte(s, 31);
	      put_byte(s, 139);
	      put_byte(s, 8);
	      if (!s.gzhead) { // s->gzhead == Z_NULL
	        put_byte(s, 0);
	        put_byte(s, 0);
	        put_byte(s, 0);
	        put_byte(s, 0);
	        put_byte(s, 0);
	        put_byte(s, s.level === 9 ? 2 :
	          (s.strategy >= Z_HUFFMAN_ONLY$1 || s.level < 2 ?
	            4 : 0));
	        put_byte(s, OS_CODE);
	        s.status = BUSY_STATE;
	      } else {
	        put_byte(s, (s.gzhead.text ? 1 : 0) +
	          (s.gzhead.hcrc ? 2 : 0) +
	          (!s.gzhead.extra ? 0 : 4) +
	          (!s.gzhead.name ? 0 : 8) +
	          (!s.gzhead.comment ? 0 : 16)
	        );
	        put_byte(s, s.gzhead.time & 0xff);
	        put_byte(s, (s.gzhead.time >> 8) & 0xff);
	        put_byte(s, (s.gzhead.time >> 16) & 0xff);
	        put_byte(s, (s.gzhead.time >> 24) & 0xff);
	        put_byte(s, s.level === 9 ? 2 :
	          (s.strategy >= Z_HUFFMAN_ONLY$1 || s.level < 2 ?
	            4 : 0));
	        put_byte(s, s.gzhead.os & 0xff);
	        if (s.gzhead.extra && s.gzhead.extra.length) {
	          put_byte(s, s.gzhead.extra.length & 0xff);
	          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
	        }
	        if (s.gzhead.hcrc) {
	          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
	        }
	        s.gzindex = 0;
	        s.status = EXTRA_STATE;
	      }
	    } else // DEFLATE header
	    {
	      var header = (Z_DEFLATED$2 + ((s.w_bits - 8) << 4)) << 8;
	      var level_flags = -1;

	      if (s.strategy >= Z_HUFFMAN_ONLY$1 || s.level < 2) {
	        level_flags = 0;
	      } else if (s.level < 6) {
	        level_flags = 1;
	      } else if (s.level === 6) {
	        level_flags = 2;
	      } else {
	        level_flags = 3;
	      }
	      header |= (level_flags << 6);
	      if (s.strstart !== 0) {
	        header |= PRESET_DICT;
	      }
	      header += 31 - (header % 31);

	      s.status = BUSY_STATE;
	      putShortMSB(s, header);

	      /* Save the adler32 of the preset dictionary: */
	      if (s.strstart !== 0) {
	        putShortMSB(s, strm.adler >>> 16);
	        putShortMSB(s, strm.adler & 0xffff);
	      }
	      strm.adler = 1; // adler32(0L, Z_NULL, 0);
	    }
	  }

	  //#ifdef GZIP
	  if (s.status === EXTRA_STATE) {
	    if (s.gzhead.extra /* != Z_NULL*/ ) {
	      beg = s.pending; /* start of bytes to update crc */

	      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
	        if (s.pending === s.pending_buf_size) {
	          if (s.gzhead.hcrc && s.pending > beg) {
	            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	          }
	          flush_pending(strm);
	          beg = s.pending;
	          if (s.pending === s.pending_buf_size) {
	            break;
	          }
	        }
	        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
	        s.gzindex++;
	      }
	      if (s.gzhead.hcrc && s.pending > beg) {
	        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	      }
	      if (s.gzindex === s.gzhead.extra.length) {
	        s.gzindex = 0;
	        s.status = NAME_STATE;
	      }
	    } else {
	      s.status = NAME_STATE;
	    }
	  }
	  if (s.status === NAME_STATE) {
	    if (s.gzhead.name /* != Z_NULL*/ ) {
	      beg = s.pending; /* start of bytes to update crc */
	      //int val;

	      do {
	        if (s.pending === s.pending_buf_size) {
	          if (s.gzhead.hcrc && s.pending > beg) {
	            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	          }
	          flush_pending(strm);
	          beg = s.pending;
	          if (s.pending === s.pending_buf_size) {
	            val = 1;
	            break;
	          }
	        }
	        // JS specific: little magic to add zero terminator to end of string
	        if (s.gzindex < s.gzhead.name.length) {
	          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
	        } else {
	          val = 0;
	        }
	        put_byte(s, val);
	      } while (val !== 0);

	      if (s.gzhead.hcrc && s.pending > beg) {
	        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	      }
	      if (val === 0) {
	        s.gzindex = 0;
	        s.status = COMMENT_STATE;
	      }
	    } else {
	      s.status = COMMENT_STATE;
	    }
	  }
	  if (s.status === COMMENT_STATE) {
	    if (s.gzhead.comment /* != Z_NULL*/ ) {
	      beg = s.pending; /* start of bytes to update crc */
	      //int val;

	      do {
	        if (s.pending === s.pending_buf_size) {
	          if (s.gzhead.hcrc && s.pending > beg) {
	            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	          }
	          flush_pending(strm);
	          beg = s.pending;
	          if (s.pending === s.pending_buf_size) {
	            val = 1;
	            break;
	          }
	        }
	        // JS specific: little magic to add zero terminator to end of string
	        if (s.gzindex < s.gzhead.comment.length) {
	          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
	        } else {
	          val = 0;
	        }
	        put_byte(s, val);
	      } while (val !== 0);

	      if (s.gzhead.hcrc && s.pending > beg) {
	        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
	      }
	      if (val === 0) {
	        s.status = HCRC_STATE;
	      }
	    } else {
	      s.status = HCRC_STATE;
	    }
	  }
	  if (s.status === HCRC_STATE) {
	    if (s.gzhead.hcrc) {
	      if (s.pending + 2 > s.pending_buf_size) {
	        flush_pending(strm);
	      }
	      if (s.pending + 2 <= s.pending_buf_size) {
	        put_byte(s, strm.adler & 0xff);
	        put_byte(s, (strm.adler >> 8) & 0xff);
	        strm.adler = 0; //crc32(0L, Z_NULL, 0);
	        s.status = BUSY_STATE;
	      }
	    } else {
	      s.status = BUSY_STATE;
	    }
	  }
	  //#endif

	  /* Flush as much pending output as possible */
	  if (s.pending !== 0) {
	    flush_pending(strm);
	    if (strm.avail_out === 0) {
	      /* Since avail_out is 0, deflate will be called again with
	       * more output space, but possibly with both pending and
	       * avail_in equal to zero. There won't be anything to do,
	       * but this is not an error situation so make sure we
	       * return OK instead of BUF_ERROR at next call of deflate:
	       */
	      s.last_flush = -1;
	      return Z_OK$2;
	    }

	    /* Make sure there is something to do and avoid duplicate consecutive
	     * flushes. For repeated and useless calls with Z_FINISH, we keep
	     * returning Z_STREAM_END instead of Z_BUF_ERROR.
	     */
	  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
	    flush !== Z_FINISH$2) {
	    return err(strm, Z_BUF_ERROR$2);
	  }

	  /* User must not provide more input after the first FINISH: */
	  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
	    return err(strm, Z_BUF_ERROR$2);
	  }

	  /* Start a new block or continue the current one.
	   */
	  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
	    (flush !== Z_NO_FLUSH$1 && s.status !== FINISH_STATE)) {
	    var bstate = (s.strategy === Z_HUFFMAN_ONLY$1) ? deflate_huff(s, flush) :
	      (s.strategy === Z_RLE$1 ? deflate_rle(s, flush) :
	        configuration_table[s.level].func(s, flush));

	    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
	      s.status = FINISH_STATE;
	    }
	    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
	      if (strm.avail_out === 0) {
	        s.last_flush = -1;
	        /* avoid BUF_ERROR next call, see above */
	      }
	      return Z_OK$2;
	      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
	       * of deflate should use the same flush parameter to make sure
	       * that the flush is complete. So we don't have to output an
	       * empty block here, this will be done at next call. This also
	       * ensures that for a very small output buffer, we emit at most
	       * one empty block.
	       */
	    }
	    if (bstate === BS_BLOCK_DONE) {
	      if (flush === Z_PARTIAL_FLUSH$1) {
	        _tr_align(s);
	      } else if (flush !== Z_BLOCK$2) { /* FULL_FLUSH or SYNC_FLUSH */

	        _tr_stored_block(s, 0, 0, false);
	        /* For a full flush, this empty block will be recognized
	         * as a special marker by inflate_sync().
	         */
	        if (flush === Z_FULL_FLUSH$1) {
	          /*** CLEAR_HASH(s); ***/
	          /* forget history */
	          zero(s.head); // Fill with NIL (= 0);

	          if (s.lookahead === 0) {
	            s.strstart = 0;
	            s.block_start = 0;
	            s.insert = 0;
	          }
	        }
	      }
	      flush_pending(strm);
	      if (strm.avail_out === 0) {
	        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
	        return Z_OK$2;
	      }
	    }
	  }
	  //Assert(strm->avail_out > 0, "bug2");
	  //if (strm.avail_out <= 0) { throw new Error("bug2");}

	  if (flush !== Z_FINISH$2) {
	    return Z_OK$2;
	  }
	  if (s.wrap <= 0) {
	    return Z_STREAM_END$2;
	  }

	  /* Write the trailer */
	  if (s.wrap === 2) {
	    put_byte(s, strm.adler & 0xff);
	    put_byte(s, (strm.adler >> 8) & 0xff);
	    put_byte(s, (strm.adler >> 16) & 0xff);
	    put_byte(s, (strm.adler >> 24) & 0xff);
	    put_byte(s, strm.total_in & 0xff);
	    put_byte(s, (strm.total_in >> 8) & 0xff);
	    put_byte(s, (strm.total_in >> 16) & 0xff);
	    put_byte(s, (strm.total_in >> 24) & 0xff);
	  } else {
	    putShortMSB(s, strm.adler >>> 16);
	    putShortMSB(s, strm.adler & 0xffff);
	  }

	  flush_pending(strm);
	  /* If avail_out is zero, the application will call deflate again
	   * to flush the rest.
	   */
	  if (s.wrap > 0) {
	    s.wrap = -s.wrap;
	  }
	  /* write the trailer only once! */
	  return s.pending !== 0 ? Z_OK$2 : Z_STREAM_END$2;
	}

	function deflateEnd(strm) {
	  var status;

	  if (!strm /*== Z_NULL*/ || !strm.state /*== Z_NULL*/ ) {
	    return Z_STREAM_ERROR$2;
	  }

	  status = strm.state.status;
	  if (status !== INIT_STATE &&
	    status !== EXTRA_STATE &&
	    status !== NAME_STATE &&
	    status !== COMMENT_STATE &&
	    status !== HCRC_STATE &&
	    status !== BUSY_STATE &&
	    status !== FINISH_STATE
	  ) {
	    return err(strm, Z_STREAM_ERROR$2);
	  }

	  strm.state = null;

	  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$2;
	}

	/* Not implemented
	exports.deflateBound = deflateBound;
	exports.deflateCopy = deflateCopy;
	exports.deflateParams = deflateParams;
	exports.deflatePending = deflatePending;
	exports.deflatePrime = deflatePrime;
	exports.deflateTune = deflateTune;
	*/

	// See state defs from inflate.js
	var BAD$1 = 30;       /* got a data error -- remain here until reset */
	var TYPE$1 = 12;      /* i: waiting for type bits, including last-flag bit */

	/*
	   Decode literal, length, and distance codes and write out the resulting
	   literal and match bytes until either not enough input or output is
	   available, an end-of-block is encountered, or a data error is encountered.
	   When large enough input and output buffers are supplied to inflate(), for
	   example, a 16K input buffer and a 64K output buffer, more than 95% of the
	   inflate execution time is spent in this routine.

	   Entry assumptions:

	        state.mode === LEN
	        strm.avail_in >= 6
	        strm.avail_out >= 258
	        start >= strm.avail_out
	        state.bits < 8

	   On return, state.mode is one of:

	        LEN -- ran out of enough output space or enough available input
	        TYPE -- reached end of block code, inflate() to interpret next block
	        BAD -- error in block data

	   Notes:

	    - The maximum input bits used by a length/distance pair is 15 bits for the
	      length code, 5 bits for the length extra, 15 bits for the distance code,
	      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
	      Therefore if strm.avail_in >= 6, then there is enough input to avoid
	      checking for available input while decoding.

	    - The maximum bytes that a single length/distance pair can output is 258
	      bytes, which is the maximum length that can be coded.  inflate_fast()
	      requires strm.avail_out >= 258 for each loop to avoid checking for
	      output space.
	 */
	function inflate_fast(strm, start) {
	  var state;
	  var _in;                    /* local strm.input */
	  var last;                   /* have enough input while in < last */
	  var _out;                   /* local strm.output */
	  var beg;                    /* inflate()'s initial strm.output */
	  var end;                    /* while out < end, enough space available */
	//#ifdef INFLATE_STRICT
	  var dmax;                   /* maximum distance from zlib header */
	//#endif
	  var wsize;                  /* window size or zero if not using window */
	  var whave;                  /* valid bytes in the window */
	  var wnext;                  /* window write index */
	  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
	  var s_window;               /* allocated sliding window, if wsize != 0 */
	  var hold;                   /* local strm.hold */
	  var bits;                   /* local strm.bits */
	  var lcode;                  /* local strm.lencode */
	  var dcode;                  /* local strm.distcode */
	  var lmask;                  /* mask for first level of length codes */
	  var dmask;                  /* mask for first level of distance codes */
	  var here;                   /* retrieved table entry */
	  var op;                     /* code bits, operation, extra bits, or */
	                              /*  window position, window bytes to copy */
	  var len;                    /* match length, unused bytes */
	  var dist;                   /* match distance */
	  var from;                   /* where to copy match from */
	  var from_source;


	  var input, output; // JS specific, because we have no pointers

	  /* copy state to local variables */
	  state = strm.state;
	  //here = state.here;
	  _in = strm.next_in;
	  input = strm.input;
	  last = _in + (strm.avail_in - 5);
	  _out = strm.next_out;
	  output = strm.output;
	  beg = _out - (start - strm.avail_out);
	  end = _out + (strm.avail_out - 257);
	//#ifdef INFLATE_STRICT
	  dmax = state.dmax;
	//#endif
	  wsize = state.wsize;
	  whave = state.whave;
	  wnext = state.wnext;
	  s_window = state.window;
	  hold = state.hold;
	  bits = state.bits;
	  lcode = state.lencode;
	  dcode = state.distcode;
	  lmask = (1 << state.lenbits) - 1;
	  dmask = (1 << state.distbits) - 1;


	  /* decode literals and length/distances until end-of-block or not enough
	     input data or output space */

	  top:
	  do {
	    if (bits < 15) {
	      hold += input[_in++] << bits;
	      bits += 8;
	      hold += input[_in++] << bits;
	      bits += 8;
	    }

	    here = lcode[hold & lmask];

	    dolen:
	    for (;;) { // Goto emulation
	      op = here >>> 24/*here.bits*/;
	      hold >>>= op;
	      bits -= op;
	      op = (here >>> 16) & 0xff/*here.op*/;
	      if (op === 0) {                          /* literal */
	        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
	        //        "inflate:         literal '%c'\n" :
	        //        "inflate:         literal 0x%02x\n", here.val));
	        output[_out++] = here & 0xffff/*here.val*/;
	      }
	      else if (op & 16) {                     /* length base */
	        len = here & 0xffff/*here.val*/;
	        op &= 15;                           /* number of extra bits */
	        if (op) {
	          if (bits < op) {
	            hold += input[_in++] << bits;
	            bits += 8;
	          }
	          len += hold & ((1 << op) - 1);
	          hold >>>= op;
	          bits -= op;
	        }
	        //Tracevv((stderr, "inflate:         length %u\n", len));
	        if (bits < 15) {
	          hold += input[_in++] << bits;
	          bits += 8;
	          hold += input[_in++] << bits;
	          bits += 8;
	        }
	        here = dcode[hold & dmask];

	        dodist:
	        for (;;) { // goto emulation
	          op = here >>> 24/*here.bits*/;
	          hold >>>= op;
	          bits -= op;
	          op = (here >>> 16) & 0xff/*here.op*/;

	          if (op & 16) {                      /* distance base */
	            dist = here & 0xffff/*here.val*/;
	            op &= 15;                       /* number of extra bits */
	            if (bits < op) {
	              hold += input[_in++] << bits;
	              bits += 8;
	              if (bits < op) {
	                hold += input[_in++] << bits;
	                bits += 8;
	              }
	            }
	            dist += hold & ((1 << op) - 1);
	//#ifdef INFLATE_STRICT
	            if (dist > dmax) {
	              strm.msg = 'invalid distance too far back';
	              state.mode = BAD$1;
	              break top;
	            }
	//#endif
	            hold >>>= op;
	            bits -= op;
	            //Tracevv((stderr, "inflate:         distance %u\n", dist));
	            op = _out - beg;                /* max distance in output */
	            if (dist > op) {                /* see if copy from window */
	              op = dist - op;               /* distance back in window */
	              if (op > whave) {
	                if (state.sane) {
	                  strm.msg = 'invalid distance too far back';
	                  state.mode = BAD$1;
	                  break top;
	                }

	// (!) This block is disabled in zlib defailts,
	// don't enable it for binary compatibility
	//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
	//                if (len <= op - whave) {
	//                  do {
	//                    output[_out++] = 0;
	//                  } while (--len);
	//                  continue top;
	//                }
	//                len -= op - whave;
	//                do {
	//                  output[_out++] = 0;
	//                } while (--op > whave);
	//                if (op === 0) {
	//                  from = _out - dist;
	//                  do {
	//                    output[_out++] = output[from++];
	//                  } while (--len);
	//                  continue top;
	//                }
	//#endif
	              }
	              from = 0; // window index
	              from_source = s_window;
	              if (wnext === 0) {           /* very common case */
	                from += wsize - op;
	                if (op < len) {         /* some from window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = _out - dist;  /* rest from output */
	                  from_source = output;
	                }
	              }
	              else if (wnext < op) {      /* wrap around window */
	                from += wsize + wnext - op;
	                op -= wnext;
	                if (op < len) {         /* some from end of window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = 0;
	                  if (wnext < len) {  /* some from start of window */
	                    op = wnext;
	                    len -= op;
	                    do {
	                      output[_out++] = s_window[from++];
	                    } while (--op);
	                    from = _out - dist;      /* rest from output */
	                    from_source = output;
	                  }
	                }
	              }
	              else {                      /* contiguous in window */
	                from += wnext - op;
	                if (op < len) {         /* some from window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = _out - dist;  /* rest from output */
	                  from_source = output;
	                }
	              }
	              while (len > 2) {
	                output[_out++] = from_source[from++];
	                output[_out++] = from_source[from++];
	                output[_out++] = from_source[from++];
	                len -= 3;
	              }
	              if (len) {
	                output[_out++] = from_source[from++];
	                if (len > 1) {
	                  output[_out++] = from_source[from++];
	                }
	              }
	            }
	            else {
	              from = _out - dist;          /* copy direct from output */
	              do {                        /* minimum length is three */
	                output[_out++] = output[from++];
	                output[_out++] = output[from++];
	                output[_out++] = output[from++];
	                len -= 3;
	              } while (len > 2);
	              if (len) {
	                output[_out++] = output[from++];
	                if (len > 1) {
	                  output[_out++] = output[from++];
	                }
	              }
	            }
	          }
	          else if ((op & 64) === 0) {          /* 2nd level distance code */
	            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
	            continue dodist;
	          }
	          else {
	            strm.msg = 'invalid distance code';
	            state.mode = BAD$1;
	            break top;
	          }

	          break; // need to emulate goto via "continue"
	        }
	      }
	      else if ((op & 64) === 0) {              /* 2nd level length code */
	        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
	        continue dolen;
	      }
	      else if (op & 32) {                     /* end-of-block */
	        //Tracevv((stderr, "inflate:         end of block\n"));
	        state.mode = TYPE$1;
	        break top;
	      }
	      else {
	        strm.msg = 'invalid literal/length code';
	        state.mode = BAD$1;
	        break top;
	      }

	      break; // need to emulate goto via "continue"
	    }
	  } while (_in < last && _out < end);

	  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
	  len = bits >> 3;
	  _in -= len;
	  bits -= len << 3;
	  hold &= (1 << bits) - 1;

	  /* update state and return */
	  strm.next_in = _in;
	  strm.next_out = _out;
	  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
	  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
	  state.hold = hold;
	  state.bits = bits;
	  return;
	}

	var MAXBITS = 15;
	var ENOUGH_LENS$1 = 852;
	var ENOUGH_DISTS$1 = 592;
	//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

	var CODES$1 = 0;
	var LENS$1 = 1;
	var DISTS$1 = 2;

	var lbase = [ /* Length codes 257..285 base */
	  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
	  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
	];

	var lext = [ /* Length codes 257..285 extra */
	  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
	  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
	];

	var dbase = [ /* Distance codes 0..29 base */
	  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
	  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
	  8193, 12289, 16385, 24577, 0, 0
	];

	var dext = [ /* Distance codes 0..29 extra */
	  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
	  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
	  28, 28, 29, 29, 64, 64
	];

	function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
	  var bits = opts.bits;
	  //here = opts.here; /* table entry for duplication */

	  var len = 0; /* a code's length in bits */
	  var sym = 0; /* index of code symbols */
	  var min = 0,
	    max = 0; /* minimum and maximum code lengths */
	  var root = 0; /* number of index bits for root table */
	  var curr = 0; /* number of index bits for current table */
	  var drop = 0; /* code bits to drop for sub-table */
	  var left = 0; /* number of prefix codes available */
	  var used = 0; /* code entries in table used */
	  var huff = 0; /* Huffman code */
	  var incr; /* for incrementing code, index */
	  var fill; /* index for replicating entries */
	  var low; /* low bits for current root entry */
	  var mask; /* mask for low root bits */
	  var next; /* next available space in table */
	  var base = null; /* base value table to use */
	  var base_index = 0;
	  //  var shoextra;    /* extra bits table to use */
	  var end; /* use base and extra for symbol > end */
	  var count = new Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
	  var offs = new Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
	  var extra = null;
	  var extra_index = 0;

	  var here_bits, here_op, here_val;

	  /*
	   Process a set of code lengths to create a canonical Huffman code.  The
	   code lengths are lens[0..codes-1].  Each length corresponds to the
	   symbols 0..codes-1.  The Huffman code is generated by first sorting the
	   symbols by length from short to long, and retaining the symbol order
	   for codes with equal lengths.  Then the code starts with all zero bits
	   for the first code of the shortest length, and the codes are integer
	   increments for the same length, and zeros are appended as the length
	   increases.  For the deflate format, these bits are stored backwards
	   from their more natural integer increment ordering, and so when the
	   decoding tables are built in the large loop below, the integer codes
	   are incremented backwards.

	   This routine assumes, but does not check, that all of the entries in
	   lens[] are in the range 0..MAXBITS.  The caller must assure this.
	   1..MAXBITS is interpreted as that code length.  zero means that that
	   symbol does not occur in this code.

	   The codes are sorted by computing a count of codes for each length,
	   creating from that a table of starting indices for each length in the
	   sorted table, and then entering the symbols in order in the sorted
	   table.  The sorted table is work[], with that space being provided by
	   the caller.

	   The length counts are used for other purposes as well, i.e. finding
	   the minimum and maximum length codes, determining if there are any
	   codes at all, checking for a valid set of lengths, and looking ahead
	   at length counts to determine sub-table sizes when building the
	   decoding tables.
	   */

	  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
	  for (len = 0; len <= MAXBITS; len++) {
	    count[len] = 0;
	  }
	  for (sym = 0; sym < codes; sym++) {
	    count[lens[lens_index + sym]]++;
	  }

	  /* bound code lengths, force root to be within code lengths */
	  root = bits;
	  for (max = MAXBITS; max >= 1; max--) {
	    if (count[max] !== 0) {
	      break;
	    }
	  }
	  if (root > max) {
	    root = max;
	  }
	  if (max === 0) { /* no symbols to code at all */
	    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
	    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
	    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
	    table[table_index++] = (1 << 24) | (64 << 16) | 0;


	    //table.op[opts.table_index] = 64;
	    //table.bits[opts.table_index] = 1;
	    //table.val[opts.table_index++] = 0;
	    table[table_index++] = (1 << 24) | (64 << 16) | 0;

	    opts.bits = 1;
	    return 0; /* no symbols, but wait for decoding to report error */
	  }
	  for (min = 1; min < max; min++) {
	    if (count[min] !== 0) {
	      break;
	    }
	  }
	  if (root < min) {
	    root = min;
	  }

	  /* check for an over-subscribed or incomplete set of lengths */
	  left = 1;
	  for (len = 1; len <= MAXBITS; len++) {
	    left <<= 1;
	    left -= count[len];
	    if (left < 0) {
	      return -1;
	    } /* over-subscribed */
	  }
	  if (left > 0 && (type === CODES$1 || max !== 1)) {
	    return -1; /* incomplete set */
	  }

	  /* generate offsets into symbol table for each length for sorting */
	  offs[1] = 0;
	  for (len = 1; len < MAXBITS; len++) {
	    offs[len + 1] = offs[len] + count[len];
	  }

	  /* sort symbols by length, by symbol order within each length */
	  for (sym = 0; sym < codes; sym++) {
	    if (lens[lens_index + sym] !== 0) {
	      work[offs[lens[lens_index + sym]]++] = sym;
	    }
	  }

	  /*
	   Create and fill in decoding tables.  In this loop, the table being
	   filled is at next and has curr index bits.  The code being used is huff
	   with length len.  That code is converted to an index by dropping drop
	   bits off of the bottom.  For codes where len is less than drop + curr,
	   those top drop + curr - len bits are incremented through all values to
	   fill the table with replicated entries.

	   root is the number of index bits for the root table.  When len exceeds
	   root, sub-tables are created pointed to by the root entry with an index
	   of the low root bits of huff.  This is saved in low to check for when a
	   new sub-table should be started.  drop is zero when the root table is
	   being filled, and drop is root when sub-tables are being filled.

	   When a new sub-table is needed, it is necessary to look ahead in the
	   code lengths to determine what size sub-table is needed.  The length
	   counts are used for this, and so count[] is decremented as codes are
	   entered in the tables.

	   used keeps track of how many table entries have been allocated from the
	   provided *table space.  It is checked for LENS and DIST tables against
	   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
	   the initial root table size constants.  See the comments in inftrees.h
	   for more information.

	   sym increments through all symbols, and the loop terminates when
	   all codes of length max, i.e. all codes, have been processed.  This
	   routine permits incomplete codes, so another loop after this one fills
	   in the rest of the decoding tables with invalid code markers.
	   */

	  /* set up for code type */
	  // poor man optimization - use if-else instead of switch,
	  // to avoid deopts in old v8
	  if (type === CODES$1) {
	    base = extra = work; /* dummy value--not used */
	    end = 19;

	  } else if (type === LENS$1) {
	    base = lbase;
	    base_index -= 257;
	    extra = lext;
	    extra_index -= 257;
	    end = 256;

	  } else { /* DISTS */
	    base = dbase;
	    extra = dext;
	    end = -1;
	  }

	  /* initialize opts for loop */
	  huff = 0; /* starting code */
	  sym = 0; /* starting code symbol */
	  len = min; /* starting code length */
	  next = table_index; /* current table to fill in */
	  curr = root; /* current table index bits */
	  drop = 0; /* current bits to drop from code for index */
	  low = -1; /* trigger new sub-table when len > root */
	  used = 1 << root; /* use root table entries */
	  mask = used - 1; /* mask for comparing low */

	  /* check available table space */
	  if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
	    (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
	    return 1;
	  }
	  /* process all codes and make table entries */
	  for (;;) {
	    /* create table entry */
	    here_bits = len - drop;
	    if (work[sym] < end) {
	      here_op = 0;
	      here_val = work[sym];
	    } else if (work[sym] > end) {
	      here_op = extra[extra_index + work[sym]];
	      here_val = base[base_index + work[sym]];
	    } else {
	      here_op = 32 + 64; /* end of block */
	      here_val = 0;
	    }

	    /* replicate for those indices with low len bits equal to huff */
	    incr = 1 << (len - drop);
	    fill = 1 << curr;
	    min = fill; /* save offset to next table */
	    do {
	      fill -= incr;
	      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val | 0;
	    } while (fill !== 0);

	    /* backwards increment the len-bit code huff */
	    incr = 1 << (len - 1);
	    while (huff & incr) {
	      incr >>= 1;
	    }
	    if (incr !== 0) {
	      huff &= incr - 1;
	      huff += incr;
	    } else {
	      huff = 0;
	    }

	    /* go to next symbol, update count, len */
	    sym++;
	    if (--count[len] === 0) {
	      if (len === max) {
	        break;
	      }
	      len = lens[lens_index + work[sym]];
	    }

	    /* create new sub-table if needed */
	    if (len > root && (huff & mask) !== low) {
	      /* if first time, transition to sub-tables */
	      if (drop === 0) {
	        drop = root;
	      }

	      /* increment past last table */
	      next += min; /* here min is 1 << curr */

	      /* determine length of next table */
	      curr = len - drop;
	      left = 1 << curr;
	      while (curr + drop < max) {
	        left -= count[curr + drop];
	        if (left <= 0) {
	          break;
	        }
	        curr++;
	        left <<= 1;
	      }

	      /* check for enough space */
	      used += 1 << curr;
	      if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
	        (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
	        return 1;
	      }

	      /* point entry in root table to sub-table */
	      low = huff & mask;
	      /*table.op[low] = curr;
	      table.bits[low] = root;
	      table.val[low] = next - opts.table_index;*/
	      table[low] = (root << 24) | (curr << 16) | (next - table_index) | 0;
	    }
	  }

	  /* fill in remaining table entry if code is incomplete (guaranteed to have
	   at most one remaining entry, since if the code is incomplete, the
	   maximum code length that was allowed to get this far is one bit) */
	  if (huff !== 0) {
	    //table.op[next + huff] = 64;            /* invalid code marker */
	    //table.bits[next + huff] = len - drop;
	    //table.val[next + huff] = 0;
	    table[next + huff] = ((len - drop) << 24) | (64 << 16) | 0;
	  }

	  /* set return parameters */
	  //opts.table_index += used;
	  opts.bits = root;
	  return 0;
	}

	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;

	/* Public constants ==========================================================*/
	/* ===========================================================================*/


	/* Allowed flush values; see deflate() and inflate() below for details */
	//var Z_NO_FLUSH      = 0;
	//var Z_PARTIAL_FLUSH = 1;
	//var Z_SYNC_FLUSH    = 2;
	//var Z_FULL_FLUSH    = 3;
	var Z_FINISH$1 = 4;
	var Z_BLOCK$1 = 5;
	var Z_TREES$1 = 6;


	/* Return codes for the compression/decompression functions. Negative values
	 * are errors, positive values are used for special but normal events.
	 */
	var Z_OK$1 = 0;
	var Z_STREAM_END$1 = 1;
	var Z_NEED_DICT$1 = 2;
	//var Z_ERRNO         = -1;
	var Z_STREAM_ERROR$1 = -2;
	var Z_DATA_ERROR$1 = -3;
	var Z_MEM_ERROR = -4;
	var Z_BUF_ERROR$1 = -5;
	//var Z_VERSION_ERROR = -6;

	/* The deflate compression method */
	var Z_DEFLATED$1 = 8;


	/* STATES ====================================================================*/
	/* ===========================================================================*/


	var HEAD = 1; /* i: waiting for magic header */
	var FLAGS = 2; /* i: waiting for method and flags (gzip) */
	var TIME = 3; /* i: waiting for modification time (gzip) */
	var OS = 4; /* i: waiting for extra flags and operating system (gzip) */
	var EXLEN = 5; /* i: waiting for extra length (gzip) */
	var EXTRA = 6; /* i: waiting for extra bytes (gzip) */
	var NAME = 7; /* i: waiting for end of file name (gzip) */
	var COMMENT = 8; /* i: waiting for end of comment (gzip) */
	var HCRC = 9; /* i: waiting for header crc (gzip) */
	var DICTID = 10; /* i: waiting for dictionary check value */
	var DICT = 11; /* waiting for inflateSetDictionary() call */
	var TYPE = 12; /* i: waiting for type bits, including last-flag bit */
	var TYPEDO = 13; /* i: same, but skip check to exit inflate on new block */
	var STORED = 14; /* i: waiting for stored size (length and complement) */
	var COPY_ = 15; /* i/o: same as COPY below, but only first time in */
	var COPY = 16; /* i/o: waiting for input or output to copy stored block */
	var TABLE = 17; /* i: waiting for dynamic block table lengths */
	var LENLENS = 18; /* i: waiting for code length code lengths */
	var CODELENS = 19; /* i: waiting for length/lit and distance code lengths */
	var LEN_ = 20; /* i: same as LEN below, but only first time in */
	var LEN = 21; /* i: waiting for length/lit/eob code */
	var LENEXT = 22; /* i: waiting for length extra bits */
	var DIST = 23; /* i: waiting for distance code */
	var DISTEXT = 24; /* i: waiting for distance extra bits */
	var MATCH = 25; /* o: waiting for output space to copy string */
	var LIT = 26; /* o: waiting for output space to write literal */
	var CHECK = 27; /* i: waiting for 32-bit check value */
	var LENGTH = 28; /* i: waiting for 32-bit length (gzip) */
	var DONE = 29; /* finished check, done -- remain here until reset */
	var BAD = 30; /* got a data error -- remain here until reset */
	var MEM = 31; /* got an inflate() memory error -- remain here until reset */
	var SYNC = 32; /* looking for synchronization bytes to restart inflate() */

	/* ===========================================================================*/



	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;


	function zswap32(q) {
	  return (((q >>> 24) & 0xff) +
	    ((q >>> 8) & 0xff00) +
	    ((q & 0xff00) << 8) +
	    ((q & 0xff) << 24));
	}


	function InflateState() {
	  this.mode = 0; /* current inflate mode */
	  this.last = false; /* true if processing last block */
	  this.wrap = 0; /* bit 0 true for zlib, bit 1 true for gzip */
	  this.havedict = false; /* true if dictionary provided */
	  this.flags = 0; /* gzip header method and flags (0 if zlib) */
	  this.dmax = 0; /* zlib header max distance (INFLATE_STRICT) */
	  this.check = 0; /* protected copy of check value */
	  this.total = 0; /* protected copy of output count */
	  // TODO: may be {}
	  this.head = null; /* where to save gzip header information */

	  /* sliding window */
	  this.wbits = 0; /* log base 2 of requested window size */
	  this.wsize = 0; /* window size or zero if not using window */
	  this.whave = 0; /* valid bytes in the window */
	  this.wnext = 0; /* window write index */
	  this.window = null; /* allocated sliding window, if needed */

	  /* bit accumulator */
	  this.hold = 0; /* input bit accumulator */
	  this.bits = 0; /* number of bits in "in" */

	  /* for string and stored block copying */
	  this.length = 0; /* literal or length of data to copy */
	  this.offset = 0; /* distance back to copy string from */

	  /* for table and code decoding */
	  this.extra = 0; /* extra bits needed */

	  /* fixed and dynamic code tables */
	  this.lencode = null; /* starting table for length/literal codes */
	  this.distcode = null; /* starting table for distance codes */
	  this.lenbits = 0; /* index bits for lencode */
	  this.distbits = 0; /* index bits for distcode */

	  /* dynamic table building */
	  this.ncode = 0; /* number of code length code lengths */
	  this.nlen = 0; /* number of length code lengths */
	  this.ndist = 0; /* number of distance code lengths */
	  this.have = 0; /* number of code lengths in lens[] */
	  this.next = null; /* next available space in codes[] */

	  this.lens = new Buf16(320); /* temporary storage for code lengths */
	  this.work = new Buf16(288); /* work area for code table building */

	  /*
	   because we don't have pointers in js, we use lencode and distcode directly
	   as buffers so we don't need codes
	  */
	  //this.codes = new Buf32(ENOUGH);       /* space for code tables */
	  this.lendyn = null; /* dynamic table for length/literal codes (JS specific) */
	  this.distdyn = null; /* dynamic table for distance codes (JS specific) */
	  this.sane = 0; /* if false, allow invalid distance too far */
	  this.back = 0; /* bits back of last unprocessed length/lit */
	  this.was = 0; /* initial length of match */
	}

	function inflateResetKeep(strm) {
	  var state;

	  if (!strm || !strm.state) {
	    return Z_STREAM_ERROR$1;
	  }
	  state = strm.state;
	  strm.total_in = strm.total_out = state.total = 0;
	  strm.msg = ''; /*Z_NULL*/
	  if (state.wrap) { /* to support ill-conceived Java test suite */
	    strm.adler = state.wrap & 1;
	  }
	  state.mode = HEAD;
	  state.last = 0;
	  state.havedict = 0;
	  state.dmax = 32768;
	  state.head = null /*Z_NULL*/ ;
	  state.hold = 0;
	  state.bits = 0;
	  //state.lencode = state.distcode = state.next = state.codes;
	  state.lencode = state.lendyn = new Buf32(ENOUGH_LENS);
	  state.distcode = state.distdyn = new Buf32(ENOUGH_DISTS);

	  state.sane = 1;
	  state.back = -1;
	  //Tracev((stderr, "inflate: reset\n"));
	  return Z_OK$1;
	}

	function inflateReset(strm) {
	  var state;

	  if (!strm || !strm.state) {
	    return Z_STREAM_ERROR$1;
	  }
	  state = strm.state;
	  state.wsize = 0;
	  state.whave = 0;
	  state.wnext = 0;
	  return inflateResetKeep(strm);

	}

	function inflateReset2(strm, windowBits) {
	  var wrap;
	  var state;

	  /* get the state */
	  if (!strm || !strm.state) {
	    return Z_STREAM_ERROR$1;
	  }
	  state = strm.state;

	  /* extract wrap request from windowBits parameter */
	  if (windowBits < 0) {
	    wrap = 0;
	    windowBits = -windowBits;
	  } else {
	    wrap = (windowBits >> 4) + 1;
	    if (windowBits < 48) {
	      windowBits &= 15;
	    }
	  }

	  /* set number of window bits, free window if different */
	  if (windowBits && (windowBits < 8 || windowBits > 15)) {
	    return Z_STREAM_ERROR$1;
	  }
	  if (state.window !== null && state.wbits !== windowBits) {
	    state.window = null;
	  }

	  /* update state and reset the rest of it */
	  state.wrap = wrap;
	  state.wbits = windowBits;
	  return inflateReset(strm);
	}

	function inflateInit2(strm, windowBits) {
	  var ret;
	  var state;

	  if (!strm) {
	    return Z_STREAM_ERROR$1;
	  }
	  //strm.msg = Z_NULL;                 /* in case we return an error */

	  state = new InflateState();

	  //if (state === Z_NULL) return Z_MEM_ERROR;
	  //Tracev((stderr, "inflate: allocated\n"));
	  strm.state = state;
	  state.window = null /*Z_NULL*/ ;
	  ret = inflateReset2(strm, windowBits);
	  if (ret !== Z_OK$1) {
	    strm.state = null /*Z_NULL*/ ;
	  }
	  return ret;
	}


	/*
	 Return state with length and distance decoding tables and index sizes set to
	 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
	 If BUILDFIXED is defined, then instead this routine builds the tables the
	 first time it's called, and returns those tables the first time and
	 thereafter.  This reduces the size of the code by about 2K bytes, in
	 exchange for a little execution time.  However, BUILDFIXED should not be
	 used for threaded applications, since the rewriting of the tables and virgin
	 may not be thread-safe.
	 */
	var virgin = true;

	var lenfix, distfix; // We have no pointers in JS, so keep tables separate

	function fixedtables(state) {
	  /* build fixed huffman tables if first call (may not be thread safe) */
	  if (virgin) {
	    var sym;

	    lenfix = new Buf32(512);
	    distfix = new Buf32(32);

	    /* literal/length table */
	    sym = 0;
	    while (sym < 144) {
	      state.lens[sym++] = 8;
	    }
	    while (sym < 256) {
	      state.lens[sym++] = 9;
	    }
	    while (sym < 280) {
	      state.lens[sym++] = 7;
	    }
	    while (sym < 288) {
	      state.lens[sym++] = 8;
	    }

	    inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, {
	      bits: 9
	    });

	    /* distance table */
	    sym = 0;
	    while (sym < 32) {
	      state.lens[sym++] = 5;
	    }

	    inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, {
	      bits: 5
	    });

	    /* do this just once */
	    virgin = false;
	  }

	  state.lencode = lenfix;
	  state.lenbits = 9;
	  state.distcode = distfix;
	  state.distbits = 5;
	}


	/*
	 Update the window with the last wsize (normally 32K) bytes written before
	 returning.  If window does not exist yet, create it.  This is only called
	 when a window is already in use, or when output has been written during this
	 inflate call, but the end of the deflate stream has not been reached yet.
	 It is also called to create a window for dictionary data when a dictionary
	 is loaded.

	 Providing output buffers larger than 32K to inflate() should provide a speed
	 advantage, since only the last 32K of output is copied to the sliding window
	 upon return from inflate(), and since all distances after the first 32K of
	 output will fall in the output data, making match copies simpler and faster.
	 The advantage may be dependent on the size of the processor's data caches.
	 */
	function updatewindow(strm, src, end, copy) {
	  var dist;
	  var state = strm.state;

	  /* if it hasn't been done already, allocate space for the window */
	  if (state.window === null) {
	    state.wsize = 1 << state.wbits;
	    state.wnext = 0;
	    state.whave = 0;

	    state.window = new Buf8(state.wsize);
	  }

	  /* copy state->wsize or less output bytes into the circular window */
	  if (copy >= state.wsize) {
	    arraySet(state.window, src, end - state.wsize, state.wsize, 0);
	    state.wnext = 0;
	    state.whave = state.wsize;
	  } else {
	    dist = state.wsize - state.wnext;
	    if (dist > copy) {
	      dist = copy;
	    }
	    //zmemcpy(state->window + state->wnext, end - copy, dist);
	    arraySet(state.window, src, end - copy, dist, state.wnext);
	    copy -= dist;
	    if (copy) {
	      //zmemcpy(state->window, end - copy, copy);
	      arraySet(state.window, src, end - copy, copy, 0);
	      state.wnext = copy;
	      state.whave = state.wsize;
	    } else {
	      state.wnext += dist;
	      if (state.wnext === state.wsize) {
	        state.wnext = 0;
	      }
	      if (state.whave < state.wsize) {
	        state.whave += dist;
	      }
	    }
	  }
	  return 0;
	}

	function inflate$1(strm, flush) {
	  var state;
	  var input, output; // input/output buffers
	  var next; /* next input INDEX */
	  var put; /* next output INDEX */
	  var have, left; /* available input and output */
	  var hold; /* bit buffer */
	  var bits; /* bits in bit buffer */
	  var _in, _out; /* save starting available input and output */
	  var copy; /* number of stored or match bytes to copy */
	  var from; /* where to copy match bytes from */
	  var from_source;
	  var here = 0; /* current decoding table entry */
	  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
	  //var last;                   /* parent table entry */
	  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
	  var len; /* length to copy for repeats, bits to drop */
	  var ret; /* return code */
	  var hbuf = new Buf8(4); /* buffer for gzip header crc calculation */
	  var opts;

	  var n; // temporary var for NEED_BITS

	  var order = /* permutation of code lengths */ [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


	  if (!strm || !strm.state || !strm.output ||
	    (!strm.input && strm.avail_in !== 0)) {
	    return Z_STREAM_ERROR$1;
	  }

	  state = strm.state;
	  if (state.mode === TYPE) {
	    state.mode = TYPEDO;
	  } /* skip check */


	  //--- LOAD() ---
	  put = strm.next_out;
	  output = strm.output;
	  left = strm.avail_out;
	  next = strm.next_in;
	  input = strm.input;
	  have = strm.avail_in;
	  hold = state.hold;
	  bits = state.bits;
	  //---

	  _in = have;
	  _out = left;
	  ret = Z_OK$1;

	  inf_leave: // goto emulation
	    for (;;) {
	      switch (state.mode) {
	      case HEAD:
	        if (state.wrap === 0) {
	          state.mode = TYPEDO;
	          break;
	        }
	        //=== NEEDBITS(16);
	        while (bits < 16) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if ((state.wrap & 2) && hold === 0x8b1f) { /* gzip header */
	          state.check = 0 /*crc32(0L, Z_NULL, 0)*/ ;
	          //=== CRC2(state.check, hold);
	          hbuf[0] = hold & 0xff;
	          hbuf[1] = (hold >>> 8) & 0xff;
	          state.check = crc32(state.check, hbuf, 2, 0);
	          //===//

	          //=== INITBITS();
	          hold = 0;
	          bits = 0;
	          //===//
	          state.mode = FLAGS;
	          break;
	        }
	        state.flags = 0; /* expect zlib header */
	        if (state.head) {
	          state.head.done = false;
	        }
	        if (!(state.wrap & 1) || /* check if zlib header allowed */
	          (((hold & 0xff) /*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
	          strm.msg = 'incorrect header check';
	          state.mode = BAD;
	          break;
	        }
	        if ((hold & 0x0f) /*BITS(4)*/ !== Z_DEFLATED$1) {
	          strm.msg = 'unknown compression method';
	          state.mode = BAD;
	          break;
	        }
	        //--- DROPBITS(4) ---//
	        hold >>>= 4;
	        bits -= 4;
	        //---//
	        len = (hold & 0x0f) /*BITS(4)*/ + 8;
	        if (state.wbits === 0) {
	          state.wbits = len;
	        } else if (len > state.wbits) {
	          strm.msg = 'invalid window size';
	          state.mode = BAD;
	          break;
	        }
	        state.dmax = 1 << len;
	        //Tracev((stderr, "inflate:   zlib header ok\n"));
	        strm.adler = state.check = 1 /*adler32(0L, Z_NULL, 0)*/ ;
	        state.mode = hold & 0x200 ? DICTID : TYPE;
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        break;
	      case FLAGS:
	        //=== NEEDBITS(16); */
	        while (bits < 16) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.flags = hold;
	        if ((state.flags & 0xff) !== Z_DEFLATED$1) {
	          strm.msg = 'unknown compression method';
	          state.mode = BAD;
	          break;
	        }
	        if (state.flags & 0xe000) {
	          strm.msg = 'unknown header flags set';
	          state.mode = BAD;
	          break;
	        }
	        if (state.head) {
	          state.head.text = ((hold >> 8) & 1);
	        }
	        if (state.flags & 0x0200) {
	          //=== CRC2(state.check, hold);
	          hbuf[0] = hold & 0xff;
	          hbuf[1] = (hold >>> 8) & 0xff;
	          state.check = crc32(state.check, hbuf, 2, 0);
	          //===//
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = TIME;
	        /* falls through */
	      case TIME:
	        //=== NEEDBITS(32); */
	        while (bits < 32) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if (state.head) {
	          state.head.time = hold;
	        }
	        if (state.flags & 0x0200) {
	          //=== CRC4(state.check, hold)
	          hbuf[0] = hold & 0xff;
	          hbuf[1] = (hold >>> 8) & 0xff;
	          hbuf[2] = (hold >>> 16) & 0xff;
	          hbuf[3] = (hold >>> 24) & 0xff;
	          state.check = crc32(state.check, hbuf, 4, 0);
	          //===
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = OS;
	        /* falls through */
	      case OS:
	        //=== NEEDBITS(16); */
	        while (bits < 16) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if (state.head) {
	          state.head.xflags = (hold & 0xff);
	          state.head.os = (hold >> 8);
	        }
	        if (state.flags & 0x0200) {
	          //=== CRC2(state.check, hold);
	          hbuf[0] = hold & 0xff;
	          hbuf[1] = (hold >>> 8) & 0xff;
	          state.check = crc32(state.check, hbuf, 2, 0);
	          //===//
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = EXLEN;
	        /* falls through */
	      case EXLEN:
	        if (state.flags & 0x0400) {
	          //=== NEEDBITS(16); */
	          while (bits < 16) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          state.length = hold;
	          if (state.head) {
	            state.head.extra_len = hold;
	          }
	          if (state.flags & 0x0200) {
	            //=== CRC2(state.check, hold);
	            hbuf[0] = hold & 0xff;
	            hbuf[1] = (hold >>> 8) & 0xff;
	            state.check = crc32(state.check, hbuf, 2, 0);
	            //===//
	          }
	          //=== INITBITS();
	          hold = 0;
	          bits = 0;
	          //===//
	        } else if (state.head) {
	          state.head.extra = null /*Z_NULL*/ ;
	        }
	        state.mode = EXTRA;
	        /* falls through */
	      case EXTRA:
	        if (state.flags & 0x0400) {
	          copy = state.length;
	          if (copy > have) {
	            copy = have;
	          }
	          if (copy) {
	            if (state.head) {
	              len = state.head.extra_len - state.length;
	              if (!state.head.extra) {
	                // Use untyped array for more conveniend processing later
	                state.head.extra = new Array(state.head.extra_len);
	              }
	              arraySet(
	                state.head.extra,
	                input,
	                next,
	                // extra field is limited to 65536 bytes
	                // - no need for additional size check
	                copy,
	                /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
	                len
	              );
	              //zmemcpy(state.head.extra + len, next,
	              //        len + copy > state.head.extra_max ?
	              //        state.head.extra_max - len : copy);
	            }
	            if (state.flags & 0x0200) {
	              state.check = crc32(state.check, input, copy, next);
	            }
	            have -= copy;
	            next += copy;
	            state.length -= copy;
	          }
	          if (state.length) {
	            break inf_leave;
	          }
	        }
	        state.length = 0;
	        state.mode = NAME;
	        /* falls through */
	      case NAME:
	        if (state.flags & 0x0800) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          copy = 0;
	          do {
	            // TODO: 2 or 1 bytes?
	            len = input[next + copy++];
	            /* use constant limit because in js we should not preallocate memory */
	            if (state.head && len &&
	              (state.length < 65536 /*state.head.name_max*/ )) {
	              state.head.name += String.fromCharCode(len);
	            }
	          } while (len && copy < have);

	          if (state.flags & 0x0200) {
	            state.check = crc32(state.check, input, copy, next);
	          }
	          have -= copy;
	          next += copy;
	          if (len) {
	            break inf_leave;
	          }
	        } else if (state.head) {
	          state.head.name = null;
	        }
	        state.length = 0;
	        state.mode = COMMENT;
	        /* falls through */
	      case COMMENT:
	        if (state.flags & 0x1000) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          copy = 0;
	          do {
	            len = input[next + copy++];
	            /* use constant limit because in js we should not preallocate memory */
	            if (state.head && len &&
	              (state.length < 65536 /*state.head.comm_max*/ )) {
	              state.head.comment += String.fromCharCode(len);
	            }
	          } while (len && copy < have);
	          if (state.flags & 0x0200) {
	            state.check = crc32(state.check, input, copy, next);
	          }
	          have -= copy;
	          next += copy;
	          if (len) {
	            break inf_leave;
	          }
	        } else if (state.head) {
	          state.head.comment = null;
	        }
	        state.mode = HCRC;
	        /* falls through */
	      case HCRC:
	        if (state.flags & 0x0200) {
	          //=== NEEDBITS(16); */
	          while (bits < 16) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          if (hold !== (state.check & 0xffff)) {
	            strm.msg = 'header crc mismatch';
	            state.mode = BAD;
	            break;
	          }
	          //=== INITBITS();
	          hold = 0;
	          bits = 0;
	          //===//
	        }
	        if (state.head) {
	          state.head.hcrc = ((state.flags >> 9) & 1);
	          state.head.done = true;
	        }
	        strm.adler = state.check = 0;
	        state.mode = TYPE;
	        break;
	      case DICTID:
	        //=== NEEDBITS(32); */
	        while (bits < 32) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        strm.adler = state.check = zswap32(hold);
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = DICT;
	        /* falls through */
	      case DICT:
	        if (state.havedict === 0) {
	          //--- RESTORE() ---
	          strm.next_out = put;
	          strm.avail_out = left;
	          strm.next_in = next;
	          strm.avail_in = have;
	          state.hold = hold;
	          state.bits = bits;
	          //---
	          return Z_NEED_DICT$1;
	        }
	        strm.adler = state.check = 1 /*adler32(0L, Z_NULL, 0)*/ ;
	        state.mode = TYPE;
	        /* falls through */
	      case TYPE:
	        if (flush === Z_BLOCK$1 || flush === Z_TREES$1) {
	          break inf_leave;
	        }
	        /* falls through */
	      case TYPEDO:
	        if (state.last) {
	          //--- BYTEBITS() ---//
	          hold >>>= bits & 7;
	          bits -= bits & 7;
	          //---//
	          state.mode = CHECK;
	          break;
	        }
	        //=== NEEDBITS(3); */
	        while (bits < 3) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.last = (hold & 0x01) /*BITS(1)*/ ;
	        //--- DROPBITS(1) ---//
	        hold >>>= 1;
	        bits -= 1;
	        //---//

	        switch ((hold & 0x03) /*BITS(2)*/ ) {
	        case 0:
	          /* stored block */
	          //Tracev((stderr, "inflate:     stored block%s\n",
	          //        state.last ? " (last)" : ""));
	          state.mode = STORED;
	          break;
	        case 1:
	          /* fixed block */
	          fixedtables(state);
	          //Tracev((stderr, "inflate:     fixed codes block%s\n",
	          //        state.last ? " (last)" : ""));
	          state.mode = LEN_; /* decode codes */
	          if (flush === Z_TREES$1) {
	            //--- DROPBITS(2) ---//
	            hold >>>= 2;
	            bits -= 2;
	            //---//
	            break inf_leave;
	          }
	          break;
	        case 2:
	          /* dynamic block */
	          //Tracev((stderr, "inflate:     dynamic codes block%s\n",
	          //        state.last ? " (last)" : ""));
	          state.mode = TABLE;
	          break;
	        case 3:
	          strm.msg = 'invalid block type';
	          state.mode = BAD;
	        }
	        //--- DROPBITS(2) ---//
	        hold >>>= 2;
	        bits -= 2;
	        //---//
	        break;
	      case STORED:
	        //--- BYTEBITS() ---// /* go to byte boundary */
	        hold >>>= bits & 7;
	        bits -= bits & 7;
	        //---//
	        //=== NEEDBITS(32); */
	        while (bits < 32) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
	          strm.msg = 'invalid stored block lengths';
	          state.mode = BAD;
	          break;
	        }
	        state.length = hold & 0xffff;
	        //Tracev((stderr, "inflate:       stored length %u\n",
	        //        state.length));
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = COPY_;
	        if (flush === Z_TREES$1) {
	          break inf_leave;
	        }
	        /* falls through */
	      case COPY_:
	        state.mode = COPY;
	        /* falls through */
	      case COPY:
	        copy = state.length;
	        if (copy) {
	          if (copy > have) {
	            copy = have;
	          }
	          if (copy > left) {
	            copy = left;
	          }
	          if (copy === 0) {
	            break inf_leave;
	          }
	          //--- zmemcpy(put, next, copy); ---
	          arraySet(output, input, next, copy, put);
	          //---//
	          have -= copy;
	          next += copy;
	          left -= copy;
	          put += copy;
	          state.length -= copy;
	          break;
	        }
	        //Tracev((stderr, "inflate:       stored end\n"));
	        state.mode = TYPE;
	        break;
	      case TABLE:
	        //=== NEEDBITS(14); */
	        while (bits < 14) {
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.nlen = (hold & 0x1f) /*BITS(5)*/ + 257;
	        //--- DROPBITS(5) ---//
	        hold >>>= 5;
	        bits -= 5;
	        //---//
	        state.ndist = (hold & 0x1f) /*BITS(5)*/ + 1;
	        //--- DROPBITS(5) ---//
	        hold >>>= 5;
	        bits -= 5;
	        //---//
	        state.ncode = (hold & 0x0f) /*BITS(4)*/ + 4;
	        //--- DROPBITS(4) ---//
	        hold >>>= 4;
	        bits -= 4;
	        //---//
	        //#ifndef PKZIP_BUG_WORKAROUND
	        if (state.nlen > 286 || state.ndist > 30) {
	          strm.msg = 'too many length or distance symbols';
	          state.mode = BAD;
	          break;
	        }
	        //#endif
	        //Tracev((stderr, "inflate:       table sizes ok\n"));
	        state.have = 0;
	        state.mode = LENLENS;
	        /* falls through */
	      case LENLENS:
	        while (state.have < state.ncode) {
	          //=== NEEDBITS(3);
	          while (bits < 3) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          state.lens[order[state.have++]] = (hold & 0x07); //BITS(3);
	          //--- DROPBITS(3) ---//
	          hold >>>= 3;
	          bits -= 3;
	          //---//
	        }
	        while (state.have < 19) {
	          state.lens[order[state.have++]] = 0;
	        }
	        // We have separate tables & no pointers. 2 commented lines below not needed.
	        //state.next = state.codes;
	        //state.lencode = state.next;
	        // Switch to use dynamic table
	        state.lencode = state.lendyn;
	        state.lenbits = 7;

	        opts = {
	          bits: state.lenbits
	        };
	        ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
	        state.lenbits = opts.bits;

	        if (ret) {
	          strm.msg = 'invalid code lengths set';
	          state.mode = BAD;
	          break;
	        }
	        //Tracev((stderr, "inflate:       code lengths ok\n"));
	        state.have = 0;
	        state.mode = CODELENS;
	        /* falls through */
	      case CODELENS:
	        while (state.have < state.nlen + state.ndist) {
	          for (;;) {
	            here = state.lencode[hold & ((1 << state.lenbits) - 1)]; /*BITS(state.lenbits)*/
	            here_bits = here >>> 24;
	            here_op = (here >>> 16) & 0xff;
	            here_val = here & 0xffff;

	            if ((here_bits) <= bits) {
	              break;
	            }
	            //--- PULLBYTE() ---//
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	            //---//
	          }
	          if (here_val < 16) {
	            //--- DROPBITS(here.bits) ---//
	            hold >>>= here_bits;
	            bits -= here_bits;
	            //---//
	            state.lens[state.have++] = here_val;
	          } else {
	            if (here_val === 16) {
	              //=== NEEDBITS(here.bits + 2);
	              n = here_bits + 2;
	              while (bits < n) {
	                if (have === 0) {
	                  break inf_leave;
	                }
	                have--;
	                hold += input[next++] << bits;
	                bits += 8;
	              }
	              //===//
	              //--- DROPBITS(here.bits) ---//
	              hold >>>= here_bits;
	              bits -= here_bits;
	              //---//
	              if (state.have === 0) {
	                strm.msg = 'invalid bit length repeat';
	                state.mode = BAD;
	                break;
	              }
	              len = state.lens[state.have - 1];
	              copy = 3 + (hold & 0x03); //BITS(2);
	              //--- DROPBITS(2) ---//
	              hold >>>= 2;
	              bits -= 2;
	              //---//
	            } else if (here_val === 17) {
	              //=== NEEDBITS(here.bits + 3);
	              n = here_bits + 3;
	              while (bits < n) {
	                if (have === 0) {
	                  break inf_leave;
	                }
	                have--;
	                hold += input[next++] << bits;
	                bits += 8;
	              }
	              //===//
	              //--- DROPBITS(here.bits) ---//
	              hold >>>= here_bits;
	              bits -= here_bits;
	              //---//
	              len = 0;
	              copy = 3 + (hold & 0x07); //BITS(3);
	              //--- DROPBITS(3) ---//
	              hold >>>= 3;
	              bits -= 3;
	              //---//
	            } else {
	              //=== NEEDBITS(here.bits + 7);
	              n = here_bits + 7;
	              while (bits < n) {
	                if (have === 0) {
	                  break inf_leave;
	                }
	                have--;
	                hold += input[next++] << bits;
	                bits += 8;
	              }
	              //===//
	              //--- DROPBITS(here.bits) ---//
	              hold >>>= here_bits;
	              bits -= here_bits;
	              //---//
	              len = 0;
	              copy = 11 + (hold & 0x7f); //BITS(7);
	              //--- DROPBITS(7) ---//
	              hold >>>= 7;
	              bits -= 7;
	              //---//
	            }
	            if (state.have + copy > state.nlen + state.ndist) {
	              strm.msg = 'invalid bit length repeat';
	              state.mode = BAD;
	              break;
	            }
	            while (copy--) {
	              state.lens[state.have++] = len;
	            }
	          }
	        }

	        /* handle error breaks in while */
	        if (state.mode === BAD) {
	          break;
	        }

	        /* check for end-of-block code (better have one) */
	        if (state.lens[256] === 0) {
	          strm.msg = 'invalid code -- missing end-of-block';
	          state.mode = BAD;
	          break;
	        }

	        /* build code tables -- note: do not change the lenbits or distbits
	           values here (9 and 6) without reading the comments in inftrees.h
	           concerning the ENOUGH constants, which depend on those values */
	        state.lenbits = 9;

	        opts = {
	          bits: state.lenbits
	        };
	        ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
	        // We have separate tables & no pointers. 2 commented lines below not needed.
	        // state.next_index = opts.table_index;
	        state.lenbits = opts.bits;
	        // state.lencode = state.next;

	        if (ret) {
	          strm.msg = 'invalid literal/lengths set';
	          state.mode = BAD;
	          break;
	        }

	        state.distbits = 6;
	        //state.distcode.copy(state.codes);
	        // Switch to use dynamic table
	        state.distcode = state.distdyn;
	        opts = {
	          bits: state.distbits
	        };
	        ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
	        // We have separate tables & no pointers. 2 commented lines below not needed.
	        // state.next_index = opts.table_index;
	        state.distbits = opts.bits;
	        // state.distcode = state.next;

	        if (ret) {
	          strm.msg = 'invalid distances set';
	          state.mode = BAD;
	          break;
	        }
	        //Tracev((stderr, 'inflate:       codes ok\n'));
	        state.mode = LEN_;
	        if (flush === Z_TREES$1) {
	          break inf_leave;
	        }
	        /* falls through */
	      case LEN_:
	        state.mode = LEN;
	        /* falls through */
	      case LEN:
	        if (have >= 6 && left >= 258) {
	          //--- RESTORE() ---
	          strm.next_out = put;
	          strm.avail_out = left;
	          strm.next_in = next;
	          strm.avail_in = have;
	          state.hold = hold;
	          state.bits = bits;
	          //---
	          inflate_fast(strm, _out);
	          //--- LOAD() ---
	          put = strm.next_out;
	          output = strm.output;
	          left = strm.avail_out;
	          next = strm.next_in;
	          input = strm.input;
	          have = strm.avail_in;
	          hold = state.hold;
	          bits = state.bits;
	          //---

	          if (state.mode === TYPE) {
	            state.back = -1;
	          }
	          break;
	        }
	        state.back = 0;
	        for (;;) {
	          here = state.lencode[hold & ((1 << state.lenbits) - 1)]; /*BITS(state.lenbits)*/
	          here_bits = here >>> 24;
	          here_op = (here >>> 16) & 0xff;
	          here_val = here & 0xffff;

	          if (here_bits <= bits) {
	            break;
	          }
	          //--- PULLBYTE() ---//
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	          //---//
	        }
	        if (here_op && (here_op & 0xf0) === 0) {
	          last_bits = here_bits;
	          last_op = here_op;
	          last_val = here_val;
	          for (;;) {
	            here = state.lencode[last_val +
	              ((hold & ((1 << (last_bits + last_op)) - 1)) /*BITS(last.bits + last.op)*/ >> last_bits)];
	            here_bits = here >>> 24;
	            here_op = (here >>> 16) & 0xff;
	            here_val = here & 0xffff;

	            if ((last_bits + here_bits) <= bits) {
	              break;
	            }
	            //--- PULLBYTE() ---//
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	            //---//
	          }
	          //--- DROPBITS(last.bits) ---//
	          hold >>>= last_bits;
	          bits -= last_bits;
	          //---//
	          state.back += last_bits;
	        }
	        //--- DROPBITS(here.bits) ---//
	        hold >>>= here_bits;
	        bits -= here_bits;
	        //---//
	        state.back += here_bits;
	        state.length = here_val;
	        if (here_op === 0) {
	          //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
	          //        "inflate:         literal '%c'\n" :
	          //        "inflate:         literal 0x%02x\n", here.val));
	          state.mode = LIT;
	          break;
	        }
	        if (here_op & 32) {
	          //Tracevv((stderr, "inflate:         end of block\n"));
	          state.back = -1;
	          state.mode = TYPE;
	          break;
	        }
	        if (here_op & 64) {
	          strm.msg = 'invalid literal/length code';
	          state.mode = BAD;
	          break;
	        }
	        state.extra = here_op & 15;
	        state.mode = LENEXT;
	        /* falls through */
	      case LENEXT:
	        if (state.extra) {
	          //=== NEEDBITS(state.extra);
	          n = state.extra;
	          while (bits < n) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          state.length += hold & ((1 << state.extra) - 1) /*BITS(state.extra)*/ ;
	          //--- DROPBITS(state.extra) ---//
	          hold >>>= state.extra;
	          bits -= state.extra;
	          //---//
	          state.back += state.extra;
	        }
	        //Tracevv((stderr, "inflate:         length %u\n", state.length));
	        state.was = state.length;
	        state.mode = DIST;
	        /* falls through */
	      case DIST:
	        for (;;) {
	          here = state.distcode[hold & ((1 << state.distbits) - 1)]; /*BITS(state.distbits)*/
	          here_bits = here >>> 24;
	          here_op = (here >>> 16) & 0xff;
	          here_val = here & 0xffff;

	          if ((here_bits) <= bits) {
	            break;
	          }
	          //--- PULLBYTE() ---//
	          if (have === 0) {
	            break inf_leave;
	          }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	          //---//
	        }
	        if ((here_op & 0xf0) === 0) {
	          last_bits = here_bits;
	          last_op = here_op;
	          last_val = here_val;
	          for (;;) {
	            here = state.distcode[last_val +
	              ((hold & ((1 << (last_bits + last_op)) - 1)) /*BITS(last.bits + last.op)*/ >> last_bits)];
	            here_bits = here >>> 24;
	            here_op = (here >>> 16) & 0xff;
	            here_val = here & 0xffff;

	            if ((last_bits + here_bits) <= bits) {
	              break;
	            }
	            //--- PULLBYTE() ---//
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	            //---//
	          }
	          //--- DROPBITS(last.bits) ---//
	          hold >>>= last_bits;
	          bits -= last_bits;
	          //---//
	          state.back += last_bits;
	        }
	        //--- DROPBITS(here.bits) ---//
	        hold >>>= here_bits;
	        bits -= here_bits;
	        //---//
	        state.back += here_bits;
	        if (here_op & 64) {
	          strm.msg = 'invalid distance code';
	          state.mode = BAD;
	          break;
	        }
	        state.offset = here_val;
	        state.extra = (here_op) & 15;
	        state.mode = DISTEXT;
	        /* falls through */
	      case DISTEXT:
	        if (state.extra) {
	          //=== NEEDBITS(state.extra);
	          n = state.extra;
	          while (bits < n) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          state.offset += hold & ((1 << state.extra) - 1) /*BITS(state.extra)*/ ;
	          //--- DROPBITS(state.extra) ---//
	          hold >>>= state.extra;
	          bits -= state.extra;
	          //---//
	          state.back += state.extra;
	        }
	        //#ifdef INFLATE_STRICT
	        if (state.offset > state.dmax) {
	          strm.msg = 'invalid distance too far back';
	          state.mode = BAD;
	          break;
	        }
	        //#endif
	        //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
	        state.mode = MATCH;
	        /* falls through */
	      case MATCH:
	        if (left === 0) {
	          break inf_leave;
	        }
	        copy = _out - left;
	        if (state.offset > copy) { /* copy from window */
	          copy = state.offset - copy;
	          if (copy > state.whave) {
	            if (state.sane) {
	              strm.msg = 'invalid distance too far back';
	              state.mode = BAD;
	              break;
	            }
	            // (!) This block is disabled in zlib defailts,
	            // don't enable it for binary compatibility
	            //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
	            //          Trace((stderr, "inflate.c too far\n"));
	            //          copy -= state.whave;
	            //          if (copy > state.length) { copy = state.length; }
	            //          if (copy > left) { copy = left; }
	            //          left -= copy;
	            //          state.length -= copy;
	            //          do {
	            //            output[put++] = 0;
	            //          } while (--copy);
	            //          if (state.length === 0) { state.mode = LEN; }
	            //          break;
	            //#endif
	          }
	          if (copy > state.wnext) {
	            copy -= state.wnext;
	            from = state.wsize - copy;
	          } else {
	            from = state.wnext - copy;
	          }
	          if (copy > state.length) {
	            copy = state.length;
	          }
	          from_source = state.window;
	        } else { /* copy from output */
	          from_source = output;
	          from = put - state.offset;
	          copy = state.length;
	        }
	        if (copy > left) {
	          copy = left;
	        }
	        left -= copy;
	        state.length -= copy;
	        do {
	          output[put++] = from_source[from++];
	        } while (--copy);
	        if (state.length === 0) {
	          state.mode = LEN;
	        }
	        break;
	      case LIT:
	        if (left === 0) {
	          break inf_leave;
	        }
	        output[put++] = state.length;
	        left--;
	        state.mode = LEN;
	        break;
	      case CHECK:
	        if (state.wrap) {
	          //=== NEEDBITS(32);
	          while (bits < 32) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            // Use '|' insdead of '+' to make sure that result is signed
	            hold |= input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          _out -= left;
	          strm.total_out += _out;
	          state.total += _out;
	          if (_out) {
	            strm.adler = state.check =
	              /*UPDATE(state.check, put - _out, _out);*/
	              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

	          }
	          _out = left;
	          // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
	          if ((state.flags ? hold : zswap32(hold)) !== state.check) {
	            strm.msg = 'incorrect data check';
	            state.mode = BAD;
	            break;
	          }
	          //=== INITBITS();
	          hold = 0;
	          bits = 0;
	          //===//
	          //Tracev((stderr, "inflate:   check matches trailer\n"));
	        }
	        state.mode = LENGTH;
	        /* falls through */
	      case LENGTH:
	        if (state.wrap && state.flags) {
	          //=== NEEDBITS(32);
	          while (bits < 32) {
	            if (have === 0) {
	              break inf_leave;
	            }
	            have--;
	            hold += input[next++] << bits;
	            bits += 8;
	          }
	          //===//
	          if (hold !== (state.total & 0xffffffff)) {
	            strm.msg = 'incorrect length check';
	            state.mode = BAD;
	            break;
	          }
	          //=== INITBITS();
	          hold = 0;
	          bits = 0;
	          //===//
	          //Tracev((stderr, "inflate:   length matches trailer\n"));
	        }
	        state.mode = DONE;
	        /* falls through */
	      case DONE:
	        ret = Z_STREAM_END$1;
	        break inf_leave;
	      case BAD:
	        ret = Z_DATA_ERROR$1;
	        break inf_leave;
	      case MEM:
	        return Z_MEM_ERROR;
	      case SYNC:
	        /* falls through */
	      default:
	        return Z_STREAM_ERROR$1;
	      }
	    }

	  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

	  /*
	     Return from inflate(), updating the total counts and the check value.
	     If there was no progress during the inflate() call, return a buffer
	     error.  Call updatewindow() to create and/or update the window state.
	     Note: a memory error from inflate() is non-recoverable.
	   */

	  //--- RESTORE() ---
	  strm.next_out = put;
	  strm.avail_out = left;
	  strm.next_in = next;
	  strm.avail_in = have;
	  state.hold = hold;
	  state.bits = bits;
	  //---

	  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
	      (state.mode < CHECK || flush !== Z_FINISH$1))) {
	    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
	  }
	  _in -= strm.avail_in;
	  _out -= strm.avail_out;
	  strm.total_in += _in;
	  strm.total_out += _out;
	  state.total += _out;
	  if (state.wrap && _out) {
	    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
	      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
	  }
	  strm.data_type = state.bits + (state.last ? 64 : 0) +
	    (state.mode === TYPE ? 128 : 0) +
	    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
	  if (((_in === 0 && _out === 0) || flush === Z_FINISH$1) && ret === Z_OK$1) {
	    ret = Z_BUF_ERROR$1;
	  }
	  return ret;
	}

	function inflateEnd(strm) {

	  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/ ) {
	    return Z_STREAM_ERROR$1;
	  }

	  var state = strm.state;
	  if (state.window) {
	    state.window = null;
	  }
	  strm.state = null;
	  return Z_OK$1;
	}

	/* Not implemented
	exports.inflateCopy = inflateCopy;
	exports.inflateGetDictionary = inflateGetDictionary;
	exports.inflateMark = inflateMark;
	exports.inflatePrime = inflatePrime;
	exports.inflateSync = inflateSync;
	exports.inflateSyncPoint = inflateSyncPoint;
	exports.inflateUndermine = inflateUndermine;
	*/

	// import constants from './constants';


	// zlib modes
	var NONE = 0;
	var DEFLATE = 1;
	var INFLATE = 2;
	var GZIP = 3;
	var GUNZIP = 4;
	var DEFLATERAW = 5;
	var INFLATERAW = 6;
	var UNZIP = 7;
	var Z_NO_FLUSH=         0,
	  Z_PARTIAL_FLUSH=    1,
	  Z_SYNC_FLUSH=    2,
	  Z_FULL_FLUSH=       3,
	  Z_FINISH=       4,
	  Z_BLOCK=           5,
	  Z_TREES=            6,

	  /* Return codes for the compression/decompression functions. Negative values
	  * are errors, positive values are used for special but normal events.
	  */
	  Z_OK=               0,
	  Z_STREAM_END=       1,
	  Z_NEED_DICT=      2,
	  Z_ERRNO=       -1,
	  Z_STREAM_ERROR=   -2,
	  Z_DATA_ERROR=    -3,
	  //Z_MEM_ERROR:     -4,
	  Z_BUF_ERROR=    -5,
	  //Z_VERSION_ERROR: -6,

	  /* compression levels */
	  Z_NO_COMPRESSION=         0,
	  Z_BEST_SPEED=             1,
	  Z_BEST_COMPRESSION=       9,
	  Z_DEFAULT_COMPRESSION=   -1,


	  Z_FILTERED=               1,
	  Z_HUFFMAN_ONLY=           2,
	  Z_RLE=                    3,
	  Z_FIXED=                  4,
	  Z_DEFAULT_STRATEGY=       0,

	  /* Possible values of the data_type field (though see inflate()) */
	  Z_BINARY=                 0,
	  Z_TEXT=                   1,
	  //Z_ASCII:                1, // = Z_TEXT (deprecated)
	  Z_UNKNOWN=                2,

	  /* The deflate compression method */
	  Z_DEFLATED=               8;
	function Zlib$1(mode) {
	  if (mode < DEFLATE || mode > UNZIP)
	    throw new TypeError('Bad argument');

	  this.mode = mode;
	  this.init_done = false;
	  this.write_in_progress = false;
	  this.pending_close = false;
	  this.windowBits = 0;
	  this.level = 0;
	  this.memLevel = 0;
	  this.strategy = 0;
	  this.dictionary = null;
	}

	Zlib$1.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
	  this.windowBits = windowBits;
	  this.level = level;
	  this.memLevel = memLevel;
	  this.strategy = strategy;
	  // dictionary not supported.

	  if (this.mode === GZIP || this.mode === GUNZIP)
	    this.windowBits += 16;

	  if (this.mode === UNZIP)
	    this.windowBits += 32;

	  if (this.mode === DEFLATERAW || this.mode === INFLATERAW)
	    this.windowBits = -this.windowBits;

	  this.strm = new ZStream();
	  var status;
	  switch (this.mode) {
	  case DEFLATE:
	  case GZIP:
	  case DEFLATERAW:
	    status = deflateInit2(
	      this.strm,
	      this.level,
	      Z_DEFLATED,
	      this.windowBits,
	      this.memLevel,
	      this.strategy
	    );
	    break;
	  case INFLATE:
	  case GUNZIP:
	  case INFLATERAW:
	  case UNZIP:
	    status  = inflateInit2(
	      this.strm,
	      this.windowBits
	    );
	    break;
	  default:
	    throw new Error('Unknown mode ' + this.mode);
	  }

	  if (status !== Z_OK) {
	    this._error(status);
	    return;
	  }

	  this.write_in_progress = false;
	  this.init_done = true;
	};

	Zlib$1.prototype.params = function() {
	  throw new Error('deflateParams Not supported');
	};

	Zlib$1.prototype._writeCheck = function() {
	  if (!this.init_done)
	    throw new Error('write before init');

	  if (this.mode === NONE)
	    throw new Error('already finalized');

	  if (this.write_in_progress)
	    throw new Error('write already in progress');

	  if (this.pending_close)
	    throw new Error('close is pending');
	};

	Zlib$1.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {
	  this._writeCheck();
	  this.write_in_progress = true;

	  var self = this;
	  browser$1.nextTick(function() {
	    self.write_in_progress = false;
	    var res = self._write(flush, input, in_off, in_len, out, out_off, out_len);
	    self.callback(res[0], res[1]);

	    if (self.pending_close)
	      self.close();
	  });

	  return this;
	};

	// set method for Node buffers, used by pako
	function bufferSet(data, offset) {
	  for (var i = 0; i < data.length; i++) {
	    this[offset + i] = data[i];
	  }
	}

	Zlib$1.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
	  this._writeCheck();
	  return this._write(flush, input, in_off, in_len, out, out_off, out_len);
	};

	Zlib$1.prototype._write = function(flush, input, in_off, in_len, out, out_off, out_len) {
	  this.write_in_progress = true;

	  if (flush !== Z_NO_FLUSH &&
	      flush !== Z_PARTIAL_FLUSH &&
	      flush !== Z_SYNC_FLUSH &&
	      flush !== Z_FULL_FLUSH &&
	      flush !== Z_FINISH &&
	      flush !== Z_BLOCK) {
	    throw new Error('Invalid flush value');
	  }

	  if (input == null) {
	    input = new Buffer$1(0);
	    in_len = 0;
	    in_off = 0;
	  }

	  if (out._set)
	    out.set = out._set;
	  else
	    out.set = bufferSet;

	  var strm = this.strm;
	  strm.avail_in = in_len;
	  strm.input = input;
	  strm.next_in = in_off;
	  strm.avail_out = out_len;
	  strm.output = out;
	  strm.next_out = out_off;
	  var status;
	  switch (this.mode) {
	  case DEFLATE:
	  case GZIP:
	  case DEFLATERAW:
	    status = deflate$1(strm, flush);
	    break;
	  case UNZIP:
	  case INFLATE:
	  case GUNZIP:
	  case INFLATERAW:
	    status = inflate$1(strm, flush);
	    break;
	  default:
	    throw new Error('Unknown mode ' + this.mode);
	  }

	  if (status !== Z_STREAM_END && status !== Z_OK) {
	    this._error(status);
	  }

	  this.write_in_progress = false;
	  return [strm.avail_in, strm.avail_out];
	};

	Zlib$1.prototype.close = function() {
	  if (this.write_in_progress) {
	    this.pending_close = true;
	    return;
	  }

	  this.pending_close = false;

	  if (this.mode === DEFLATE || this.mode === GZIP || this.mode === DEFLATERAW) {
	    deflateEnd(this.strm);
	  } else {
	    inflateEnd(this.strm);
	  }

	  this.mode = NONE;
	};
	var status;
	Zlib$1.prototype.reset = function() {
	  switch (this.mode) {
	  case DEFLATE:
	  case DEFLATERAW:
	    status = deflateReset(this.strm);
	    break;
	  case INFLATE:
	  case INFLATERAW:
	    status = inflateReset(this.strm);
	    break;
	  }

	  if (status !== Z_OK) {
	    this._error(status);
	  }
	};

	Zlib$1.prototype._error = function(status) {
	  this.onerror(msg[status] + ': ' + this.strm.msg, status);

	  this.write_in_progress = false;
	  if (this.pending_close)
	    this.close();
	};

	var _binding = /*#__PURE__*/Object.freeze({
		__proto__: null,
		NONE: NONE,
		DEFLATE: DEFLATE,
		INFLATE: INFLATE,
		GZIP: GZIP,
		GUNZIP: GUNZIP,
		DEFLATERAW: DEFLATERAW,
		INFLATERAW: INFLATERAW,
		UNZIP: UNZIP,
		Z_NO_FLUSH: Z_NO_FLUSH,
		Z_PARTIAL_FLUSH: Z_PARTIAL_FLUSH,
		Z_SYNC_FLUSH: Z_SYNC_FLUSH,
		Z_FULL_FLUSH: Z_FULL_FLUSH,
		Z_FINISH: Z_FINISH,
		Z_BLOCK: Z_BLOCK,
		Z_TREES: Z_TREES,
		Z_OK: Z_OK,
		Z_STREAM_END: Z_STREAM_END,
		Z_NEED_DICT: Z_NEED_DICT,
		Z_ERRNO: Z_ERRNO,
		Z_STREAM_ERROR: Z_STREAM_ERROR,
		Z_DATA_ERROR: Z_DATA_ERROR,
		Z_BUF_ERROR: Z_BUF_ERROR,
		Z_NO_COMPRESSION: Z_NO_COMPRESSION,
		Z_BEST_SPEED: Z_BEST_SPEED,
		Z_BEST_COMPRESSION: Z_BEST_COMPRESSION,
		Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION,
		Z_FILTERED: Z_FILTERED,
		Z_HUFFMAN_ONLY: Z_HUFFMAN_ONLY,
		Z_RLE: Z_RLE,
		Z_FIXED: Z_FIXED,
		Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY,
		Z_BINARY: Z_BINARY,
		Z_TEXT: Z_TEXT,
		Z_UNKNOWN: Z_UNKNOWN,
		Z_DEFLATED: Z_DEFLATED,
		Zlib: Zlib$1
	});

	function assert$1 (a, msg) {
	  if (!a) {
	    throw new Error(msg);
	  }
	}
	var binding = {};
	Object.keys(_binding).forEach(function (key) {
	  binding[key] = _binding[key];
	});
	// zlib doesn't provide these, so kludge them in following the same
	// const naming scheme zlib uses.
	binding.Z_MIN_WINDOWBITS = 8;
	binding.Z_MAX_WINDOWBITS = 15;
	binding.Z_DEFAULT_WINDOWBITS = 15;

	// fewer than 64 bytes per chunk is stupid.
	// technically it could work with as few as 8, but even 64 bytes
	// is absurdly low.  Usually a MB or more is best.
	binding.Z_MIN_CHUNK = 64;
	binding.Z_MAX_CHUNK = Infinity;
	binding.Z_DEFAULT_CHUNK = (16 * 1024);

	binding.Z_MIN_MEMLEVEL = 1;
	binding.Z_MAX_MEMLEVEL = 9;
	binding.Z_DEFAULT_MEMLEVEL = 8;

	binding.Z_MIN_LEVEL = -1;
	binding.Z_MAX_LEVEL = 9;
	binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION;


	// translation table for return codes.
	var codes = {
	  Z_OK: binding.Z_OK,
	  Z_STREAM_END: binding.Z_STREAM_END,
	  Z_NEED_DICT: binding.Z_NEED_DICT,
	  Z_ERRNO: binding.Z_ERRNO,
	  Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
	  Z_DATA_ERROR: binding.Z_DATA_ERROR,
	  Z_MEM_ERROR: binding.Z_MEM_ERROR,
	  Z_BUF_ERROR: binding.Z_BUF_ERROR,
	  Z_VERSION_ERROR: binding.Z_VERSION_ERROR
	};

	Object.keys(codes).forEach(function(k) {
	  codes[codes[k]] = k;
	});

	function createDeflate(o) {
	  return new Deflate(o);
	}

	function createInflate(o) {
	  return new Inflate(o);
	}

	function createDeflateRaw(o) {
	  return new DeflateRaw(o);
	}

	function createInflateRaw(o) {
	  return new InflateRaw(o);
	}

	function createGzip(o) {
	  return new Gzip(o);
	}

	function createGunzip(o) {
	  return new Gunzip(o);
	}

	function createUnzip(o) {
	  return new Unzip(o);
	}


	// Convenience methods.
	// compress/decompress a string or buffer in one step.
	function deflate(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new Deflate(opts), buffer, callback);
	}

	function deflateSync(buffer, opts) {
	  return zlibBufferSync(new Deflate(opts), buffer);
	}

	function gzip(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new Gzip(opts), buffer, callback);
	}

	function gzipSync(buffer, opts) {
	  return zlibBufferSync(new Gzip(opts), buffer);
	}

	function deflateRaw(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new DeflateRaw(opts), buffer, callback);
	}

	function deflateRawSync(buffer, opts) {
	  return zlibBufferSync(new DeflateRaw(opts), buffer);
	}

	function unzip(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new Unzip(opts), buffer, callback);
	}

	function unzipSync(buffer, opts) {
	  return zlibBufferSync(new Unzip(opts), buffer);
	}

	function inflate(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new Inflate(opts), buffer, callback);
	}

	function inflateSync$1(buffer, opts) {
	  return zlibBufferSync(new Inflate(opts), buffer);
	}

	function gunzip(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new Gunzip(opts), buffer, callback);
	}

	function gunzipSync(buffer, opts) {
	  return zlibBufferSync(new Gunzip(opts), buffer);
	}

	function inflateRaw(buffer, opts, callback) {
	  if (typeof opts === 'function') {
	    callback = opts;
	    opts = {};
	  }
	  return zlibBuffer(new InflateRaw(opts), buffer, callback);
	}

	function inflateRawSync(buffer, opts) {
	  return zlibBufferSync(new InflateRaw(opts), buffer);
	}

	function zlibBuffer(engine, buffer, callback) {
	  var buffers = [];
	  var nread = 0;

	  engine.on('error', onError);
	  engine.on('end', onEnd);

	  engine.end(buffer);
	  flow();

	  function flow() {
	    var chunk;
	    while (null !== (chunk = engine.read())) {
	      buffers.push(chunk);
	      nread += chunk.length;
	    }
	    engine.once('readable', flow);
	  }

	  function onError(err) {
	    engine.removeListener('end', onEnd);
	    engine.removeListener('readable', flow);
	    callback(err);
	  }

	  function onEnd() {
	    var buf = Buffer$1.concat(buffers, nread);
	    buffers = [];
	    callback(null, buf);
	    engine.close();
	  }
	}

	function zlibBufferSync(engine, buffer) {
	  if (typeof buffer === 'string')
	    buffer = new Buffer$1(buffer);
	  if (!Buffer$1.isBuffer(buffer))
	    throw new TypeError('Not a string or buffer');

	  var flushFlag = binding.Z_FINISH;

	  return engine._processChunk(buffer, flushFlag);
	}

	// generic zlib
	// minimal 2-byte header
	function Deflate(opts) {
	  if (!(this instanceof Deflate)) return new Deflate(opts);
	  Zlib.call(this, opts, binding.DEFLATE);
	}

	function Inflate(opts) {
	  if (!(this instanceof Inflate)) return new Inflate(opts);
	  Zlib.call(this, opts, binding.INFLATE);
	}



	// gzip - bigger header, same deflate compression
	function Gzip(opts) {
	  if (!(this instanceof Gzip)) return new Gzip(opts);
	  Zlib.call(this, opts, binding.GZIP);
	}

	function Gunzip(opts) {
	  if (!(this instanceof Gunzip)) return new Gunzip(opts);
	  Zlib.call(this, opts, binding.GUNZIP);
	}



	// raw - no header
	function DeflateRaw(opts) {
	  if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
	  Zlib.call(this, opts, binding.DEFLATERAW);
	}

	function InflateRaw(opts) {
	  if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
	  Zlib.call(this, opts, binding.INFLATERAW);
	}


	// auto-detect header.
	function Unzip(opts) {
	  if (!(this instanceof Unzip)) return new Unzip(opts);
	  Zlib.call(this, opts, binding.UNZIP);
	}


	// the Zlib class they all inherit from
	// This thing manages the queue of requests, and returns
	// true or false if there is anything in the queue when
	// you call the .write() method.

	function Zlib(opts, mode) {
	  this._opts = opts = opts || {};
	  this._chunkSize = opts.chunkSize || binding.Z_DEFAULT_CHUNK;

	  Transform.call(this, opts);

	  if (opts.flush) {
	    if (opts.flush !== binding.Z_NO_FLUSH &&
	        opts.flush !== binding.Z_PARTIAL_FLUSH &&
	        opts.flush !== binding.Z_SYNC_FLUSH &&
	        opts.flush !== binding.Z_FULL_FLUSH &&
	        opts.flush !== binding.Z_FINISH &&
	        opts.flush !== binding.Z_BLOCK) {
	      throw new Error('Invalid flush flag: ' + opts.flush);
	    }
	  }
	  this._flushFlag = opts.flush || binding.Z_NO_FLUSH;

	  if (opts.chunkSize) {
	    if (opts.chunkSize < binding.Z_MIN_CHUNK ||
	        opts.chunkSize > binding.Z_MAX_CHUNK) {
	      throw new Error('Invalid chunk size: ' + opts.chunkSize);
	    }
	  }

	  if (opts.windowBits) {
	    if (opts.windowBits < binding.Z_MIN_WINDOWBITS ||
	        opts.windowBits > binding.Z_MAX_WINDOWBITS) {
	      throw new Error('Invalid windowBits: ' + opts.windowBits);
	    }
	  }

	  if (opts.level) {
	    if (opts.level < binding.Z_MIN_LEVEL ||
	        opts.level > binding.Z_MAX_LEVEL) {
	      throw new Error('Invalid compression level: ' + opts.level);
	    }
	  }

	  if (opts.memLevel) {
	    if (opts.memLevel < binding.Z_MIN_MEMLEVEL ||
	        opts.memLevel > binding.Z_MAX_MEMLEVEL) {
	      throw new Error('Invalid memLevel: ' + opts.memLevel);
	    }
	  }

	  if (opts.strategy) {
	    if (opts.strategy != binding.Z_FILTERED &&
	        opts.strategy != binding.Z_HUFFMAN_ONLY &&
	        opts.strategy != binding.Z_RLE &&
	        opts.strategy != binding.Z_FIXED &&
	        opts.strategy != binding.Z_DEFAULT_STRATEGY) {
	      throw new Error('Invalid strategy: ' + opts.strategy);
	    }
	  }

	  if (opts.dictionary) {
	    if (!Buffer$1.isBuffer(opts.dictionary)) {
	      throw new Error('Invalid dictionary: it should be a Buffer instance');
	    }
	  }

	  this._binding = new binding.Zlib(mode);

	  var self = this;
	  this._hadError = false;
	  this._binding.onerror = function(message, errno) {
	    // there is no way to cleanly recover.
	    // continuing only obscures problems.
	    self._binding = null;
	    self._hadError = true;

	    var error = new Error(message);
	    error.errno = errno;
	    error.code = binding.codes[errno];
	    self.emit('error', error);
	  };

	  var level = binding.Z_DEFAULT_COMPRESSION;
	  if (typeof opts.level === 'number') level = opts.level;

	  var strategy = binding.Z_DEFAULT_STRATEGY;
	  if (typeof opts.strategy === 'number') strategy = opts.strategy;

	  this._binding.init(opts.windowBits || binding.Z_DEFAULT_WINDOWBITS,
	                     level,
	                     opts.memLevel || binding.Z_DEFAULT_MEMLEVEL,
	                     strategy,
	                     opts.dictionary);

	  this._buffer = new Buffer$1(this._chunkSize);
	  this._offset = 0;
	  this._closed = false;
	  this._level = level;
	  this._strategy = strategy;

	  this.once('end', this.close);
	}

	inherits$1(Zlib, Transform);

	Zlib.prototype.params = function(level, strategy, callback) {
	  if (level < binding.Z_MIN_LEVEL ||
	      level > binding.Z_MAX_LEVEL) {
	    throw new RangeError('Invalid compression level: ' + level);
	  }
	  if (strategy != binding.Z_FILTERED &&
	      strategy != binding.Z_HUFFMAN_ONLY &&
	      strategy != binding.Z_RLE &&
	      strategy != binding.Z_FIXED &&
	      strategy != binding.Z_DEFAULT_STRATEGY) {
	    throw new TypeError('Invalid strategy: ' + strategy);
	  }

	  if (this._level !== level || this._strategy !== strategy) {
	    var self = this;
	    this.flush(binding.Z_SYNC_FLUSH, function() {
	      self._binding.params(level, strategy);
	      if (!self._hadError) {
	        self._level = level;
	        self._strategy = strategy;
	        if (callback) callback();
	      }
	    });
	  } else {
	    browser$1.nextTick(callback);
	  }
	};

	Zlib.prototype.reset = function() {
	  return this._binding.reset();
	};

	// This is the _flush function called by the transform class,
	// internally, when the last chunk has been written.
	Zlib.prototype._flush = function(callback) {
	  this._transform(new Buffer$1(0), '', callback);
	};

	Zlib.prototype.flush = function(kind, callback) {
	  var ws = this._writableState;

	  if (typeof kind === 'function' || (kind === void 0 && !callback)) {
	    callback = kind;
	    kind = binding.Z_FULL_FLUSH;
	  }

	  if (ws.ended) {
	    if (callback)
	      browser$1.nextTick(callback);
	  } else if (ws.ending) {
	    if (callback)
	      this.once('end', callback);
	  } else if (ws.needDrain) {
	    var self = this;
	    this.once('drain', function() {
	      self.flush(callback);
	    });
	  } else {
	    this._flushFlag = kind;
	    this.write(new Buffer$1(0), '', callback);
	  }
	};

	Zlib.prototype.close = function(callback) {
	  if (callback)
	    browser$1.nextTick(callback);

	  if (this._closed)
	    return;

	  this._closed = true;

	  this._binding.close();

	  var self = this;
	  browser$1.nextTick(function() {
	    self.emit('close');
	  });
	};

	Zlib.prototype._transform = function(chunk, encoding, cb) {
	  var flushFlag;
	  var ws = this._writableState;
	  var ending = ws.ending || ws.ended;
	  var last = ending && (!chunk || ws.length === chunk.length);

	  if (!chunk === null && !Buffer$1.isBuffer(chunk))
	    return cb(new Error('invalid input'));

	  // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag.
	  // If it's explicitly flushing at some other time, then we use
	  // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
	  // goodness.
	  if (last)
	    flushFlag = binding.Z_FINISH;
	  else {
	    flushFlag = this._flushFlag;
	    // once we've flushed the last of the queue, stop flushing and
	    // go back to the normal behavior.
	    if (chunk.length >= ws.length) {
	      this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
	    }
	  }

	  this._processChunk(chunk, flushFlag, cb);
	};

	Zlib.prototype._processChunk = function(chunk, flushFlag, cb) {
	  var availInBefore = chunk && chunk.length;
	  var availOutBefore = this._chunkSize - this._offset;
	  var inOff = 0;

	  var self = this;

	  var async = typeof cb === 'function';

	  if (!async) {
	    var buffers = [];
	    var nread = 0;

	    var error;
	    this.on('error', function(er) {
	      error = er;
	    });

	    do {
	      var res = this._binding.writeSync(flushFlag,
	                                        chunk, // in
	                                        inOff, // in_off
	                                        availInBefore, // in_len
	                                        this._buffer, // out
	                                        this._offset, //out_off
	                                        availOutBefore); // out_len
	    } while (!this._hadError && callback(res[0], res[1]));

	    if (this._hadError) {
	      throw error;
	    }

	    var buf = Buffer$1.concat(buffers, nread);
	    this.close();

	    return buf;
	  }

	  var req = this._binding.write(flushFlag,
	                                chunk, // in
	                                inOff, // in_off
	                                availInBefore, // in_len
	                                this._buffer, // out
	                                this._offset, //out_off
	                                availOutBefore); // out_len

	  req.buffer = chunk;
	  req.callback = callback;

	  function callback(availInAfter, availOutAfter) {
	    if (self._hadError)
	      return;

	    var have = availOutBefore - availOutAfter;
	    assert$1(have >= 0, 'have should not go down');

	    if (have > 0) {
	      var out = self._buffer.slice(self._offset, self._offset + have);
	      self._offset += have;
	      // serve some output to the consumer.
	      if (async) {
	        self.push(out);
	      } else {
	        buffers.push(out);
	        nread += out.length;
	      }
	    }

	    // exhausted the output buffer, or used all the input create a new one.
	    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
	      availOutBefore = self._chunkSize;
	      self._offset = 0;
	      self._buffer = new Buffer$1(self._chunkSize);
	    }

	    if (availOutAfter === 0) {
	      // Not actually done.  Need to reprocess.
	      // Also, update the availInBefore to the availInAfter value,
	      // so that if we have to hit it a third (fourth, etc.) time,
	      // it'll have the correct byte counts.
	      inOff += (availInBefore - availInAfter);
	      availInBefore = availInAfter;

	      if (!async)
	        return true;

	      var newReq = self._binding.write(flushFlag,
	                                       chunk,
	                                       inOff,
	                                       availInBefore,
	                                       self._buffer,
	                                       self._offset,
	                                       self._chunkSize);
	      newReq.callback = callback; // this same function
	      newReq.buffer = chunk;
	      return;
	    }

	    if (!async)
	      return false;

	    // finished with the chunk.
	    cb();
	  }
	};

	inherits$1(Deflate, Zlib);
	inherits$1(Inflate, Zlib);
	inherits$1(Gzip, Zlib);
	inherits$1(Gunzip, Zlib);
	inherits$1(DeflateRaw, Zlib);
	inherits$1(InflateRaw, Zlib);
	inherits$1(Unzip, Zlib);
	var _polyfillNode_zlib = {
	  codes: codes,
	  createDeflate: createDeflate,
	  createInflate: createInflate,
	  createDeflateRaw: createDeflateRaw,
	  createInflateRaw: createInflateRaw,
	  createGzip: createGzip,
	  createGunzip: createGunzip,
	  createUnzip: createUnzip,
	  deflate: deflate,
	  deflateSync: deflateSync,
	  gzip: gzip,
	  gzipSync: gzipSync,
	  deflateRaw: deflateRaw,
	  deflateRawSync: deflateRawSync,
	  unzip: unzip,
	  unzipSync: unzipSync,
	  inflate: inflate,
	  inflateSync: inflateSync$1,
	  gunzip: gunzip,
	  gunzipSync: gunzipSync,
	  inflateRaw: inflateRaw,
	  inflateRawSync: inflateRawSync,
	  Deflate: Deflate,
	  Inflate: Inflate,
	  Gzip: Gzip,
	  Gunzip: Gunzip,
	  DeflateRaw: DeflateRaw,
	  InflateRaw: InflateRaw,
	  Unzip: Unzip,
	  Zlib: Zlib
	};

	var _polyfillNode_zlib$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		codes: codes,
		createDeflate: createDeflate,
		createInflate: createInflate,
		createDeflateRaw: createDeflateRaw,
		createInflateRaw: createInflateRaw,
		createGzip: createGzip,
		createGunzip: createGunzip,
		createUnzip: createUnzip,
		deflate: deflate,
		deflateSync: deflateSync,
		gzip: gzip,
		gzipSync: gzipSync,
		deflateRaw: deflateRaw,
		deflateRawSync: deflateRawSync,
		unzip: unzip,
		unzipSync: unzipSync,
		inflate: inflate,
		inflateSync: inflateSync$1,
		gunzip: gunzip,
		gunzipSync: gunzipSync,
		inflateRaw: inflateRaw,
		inflateRawSync: inflateRawSync,
		Deflate: Deflate,
		Inflate: Inflate,
		Gzip: Gzip,
		Gunzip: Gunzip,
		DeflateRaw: DeflateRaw,
		InflateRaw: InflateRaw,
		Unzip: Unzip,
		Zlib: Zlib,
		'default': _polyfillNode_zlib
	});

	var require$$0$2 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_zlib$1);

	var chunkstream = {exports: {}};

	var util$4 = require$$0$3;
	var Stream$2 = require$$1$1;


	var ChunkStream$2 = chunkstream.exports = function() {
	  Stream$2.call(this);

	  this._buffers = [];
	  this._buffered = 0;

	  this._reads = [];
	  this._paused = false;

	  this._encoding = 'utf8';
	  this.writable = true;
	};
	util$4.inherits(ChunkStream$2, Stream$2);


	ChunkStream$2.prototype.read = function(length, callback) {

	  this._reads.push({
	    length: Math.abs(length), // if length < 0 then at most this length
	    allowLess: length < 0,
	    func: callback
	  });

	  browser$1.nextTick(function() {
	    this._process();

	    // its paused and there is not enought data then ask for more
	    if (this._paused && this._reads.length > 0) {
	      this._paused = false;

	      this.emit('drain');
	    }
	  }.bind(this));
	};

	ChunkStream$2.prototype.write = function(data, encoding) {

	  if (!this.writable) {
	    this.emit('error', new Error('Stream not writable'));
	    return false;
	  }

	  var dataBuffer;
	  if (Buffer$1.isBuffer(data)) {
	    dataBuffer = data;
	  }
	  else {
	    dataBuffer = new Buffer$1(data, encoding || this._encoding);
	  }

	  this._buffers.push(dataBuffer);
	  this._buffered += dataBuffer.length;

	  this._process();

	  // ok if there are no more read requests
	  if (this._reads && this._reads.length === 0) {
	    this._paused = true;
	  }

	  return this.writable && !this._paused;
	};

	ChunkStream$2.prototype.end = function(data, encoding) {

	  if (data) {
	    this.write(data, encoding);
	  }

	  this.writable = false;

	  // already destroyed
	  if (!this._buffers) {
	    return;
	  }

	  // enqueue or handle end
	  if (this._buffers.length === 0) {
	    this._end();
	  }
	  else {
	    this._buffers.push(null);
	    this._process();
	  }
	};

	ChunkStream$2.prototype.destroySoon = ChunkStream$2.prototype.end;

	ChunkStream$2.prototype._end = function() {

	  if (this._reads.length > 0) {
	    this.emit('error',
	      new Error('Unexpected end of input')
	    );
	  }

	  this.destroy();
	};

	ChunkStream$2.prototype.destroy = function() {

	  if (!this._buffers) {
	    return;
	  }

	  this.writable = false;
	  this._reads = null;
	  this._buffers = null;

	  this.emit('close');
	};

	ChunkStream$2.prototype._processReadAllowingLess = function(read) {
	  // ok there is any data so that we can satisfy this request
	  this._reads.shift(); // == read

	  // first we need to peek into first buffer
	  var smallerBuf = this._buffers[0];

	  // ok there is more data than we need
	  if (smallerBuf.length > read.length) {

	    this._buffered -= read.length;
	    this._buffers[0] = smallerBuf.slice(read.length);

	    read.func.call(this, smallerBuf.slice(0, read.length));

	  }
	  else {
	    // ok this is less than maximum length so use it all
	    this._buffered -= smallerBuf.length;
	    this._buffers.shift(); // == smallerBuf

	    read.func.call(this, smallerBuf);
	  }
	};

	ChunkStream$2.prototype._processRead = function(read) {
	  this._reads.shift(); // == read

	  var pos = 0;
	  var count = 0;
	  var data = new Buffer$1(read.length);

	  // create buffer for all data
	  while (pos < read.length) {

	    var buf = this._buffers[count++];
	    var len = Math.min(buf.length, read.length - pos);

	    buf.copy(data, pos, 0, len);
	    pos += len;

	    // last buffer wasn't used all so just slice it and leave
	    if (len !== buf.length) {
	      this._buffers[--count] = buf.slice(len);
	    }
	  }

	  // remove all used buffers
	  if (count > 0) {
	    this._buffers.splice(0, count);
	  }

	  this._buffered -= read.length;

	  read.func.call(this, data);
	};

	ChunkStream$2.prototype._process = function() {

	  try {
	    // as long as there is any data and read requests
	    while (this._buffered > 0 && this._reads && this._reads.length > 0) {

	      var read = this._reads[0];

	      // read any data (but no more than length)
	      if (read.allowLess) {
	        this._processReadAllowingLess(read);

	      }
	      else if (this._buffered >= read.length) {
	        // ok we can meet some expectations

	        this._processRead(read);
	      }
	      else {
	        // not enought data to satisfy first request in queue
	        // so we need to wait for more
	        break;
	      }
	    }

	    if (this._buffers && !this.writable) {
	      this._end();
	    }
	  }
	  catch (ex) {
	    this.emit('error', ex);
	  }
	};

	var filterParseAsync = {exports: {}};

	var filterParse = {exports: {}};

	var interlace = {};

	// Adam 7
	//   0 1 2 3 4 5 6 7
	// 0 x 6 4 6 x 6 4 6
	// 1 7 7 7 7 7 7 7 7
	// 2 5 6 5 6 5 6 5 6
	// 3 7 7 7 7 7 7 7 7
	// 4 3 6 4 6 3 6 4 6
	// 5 7 7 7 7 7 7 7 7
	// 6 5 6 5 6 5 6 5 6
	// 7 7 7 7 7 7 7 7 7


	var imagePasses = [
	  { // pass 1 - 1px
	    x: [0],
	    y: [0]
	  },
	  { // pass 2 - 1px
	    x: [4],
	    y: [0]
	  },
	  { // pass 3 - 2px
	    x: [0, 4],
	    y: [4]
	  },
	  { // pass 4 - 4px
	    x: [2, 6],
	    y: [0, 4]
	  },
	  { // pass 5 - 8px
	    x: [0, 2, 4, 6],
	    y: [2, 6]
	  },
	  { // pass 6 - 16px
	    x: [1, 3, 5, 7],
	    y: [0, 2, 4, 6]
	  },
	  { // pass 7 - 32px
	    x: [0, 1, 2, 3, 4, 5, 6, 7],
	    y: [1, 3, 5, 7]
	  }
	];

	interlace.getImagePasses = function(width, height) {
	  var images = [];
	  var xLeftOver = width % 8;
	  var yLeftOver = height % 8;
	  var xRepeats = (width - xLeftOver) / 8;
	  var yRepeats = (height - yLeftOver) / 8;
	  for (var i = 0; i < imagePasses.length; i++) {
	    var pass = imagePasses[i];
	    var passWidth = xRepeats * pass.x.length;
	    var passHeight = yRepeats * pass.y.length;
	    for (var j = 0; j < pass.x.length; j++) {
	      if (pass.x[j] < xLeftOver) {
	        passWidth++;
	      }
	      else {
	        break;
	      }
	    }
	    for (j = 0; j < pass.y.length; j++) {
	      if (pass.y[j] < yLeftOver) {
	        passHeight++;
	      }
	      else {
	        break;
	      }
	    }
	    if (passWidth > 0 && passHeight > 0) {
	      images.push({ width: passWidth, height: passHeight, index: i });
	    }
	  }
	  return images;
	};

	interlace.getInterlaceIterator = function(width) {
	  return function(x, y, pass) {
	    var outerXLeftOver = x % imagePasses[pass].x.length;
	    var outerX = (((x - outerXLeftOver) / imagePasses[pass].x.length) * 8) + imagePasses[pass].x[outerXLeftOver];
	    var outerYLeftOver = y % imagePasses[pass].y.length;
	    var outerY = (((y - outerYLeftOver) / imagePasses[pass].y.length) * 8) + imagePasses[pass].y[outerYLeftOver];
	    return (outerX * 4) + (outerY * width * 4);
	  };
	};

	var paethPredictor$2 = function paethPredictor(left, above, upLeft) {

	  var paeth = left + above - upLeft;
	  var pLeft = Math.abs(paeth - left);
	  var pAbove = Math.abs(paeth - above);
	  var pUpLeft = Math.abs(paeth - upLeft);

	  if (pLeft <= pAbove && pLeft <= pUpLeft) {
	    return left;
	  }
	  if (pAbove <= pUpLeft) {
	    return above;
	  }
	  return upLeft;
	};

	var interlaceUtils$1 = interlace;
	var paethPredictor$1 = paethPredictor$2;

	function getByteWidth(width, bpp, depth) {
	  var byteWidth = width * bpp;
	  if (depth !== 8) {
	    byteWidth = Math.ceil(byteWidth / (8 / depth));
	  }
	  return byteWidth;
	}

	var Filter$2 = filterParse.exports = function(bitmapInfo, dependencies) {

	  var width = bitmapInfo.width;
	  var height = bitmapInfo.height;
	  var interlace = bitmapInfo.interlace;
	  var bpp = bitmapInfo.bpp;
	  var depth = bitmapInfo.depth;

	  this.read = dependencies.read;
	  this.write = dependencies.write;
	  this.complete = dependencies.complete;

	  this._imageIndex = 0;
	  this._images = [];
	  if (interlace) {
	    var passes = interlaceUtils$1.getImagePasses(width, height);
	    for (var i = 0; i < passes.length; i++) {
	      this._images.push({
	        byteWidth: getByteWidth(passes[i].width, bpp, depth),
	        height: passes[i].height,
	        lineIndex: 0
	      });
	    }
	  }
	  else {
	    this._images.push({
	      byteWidth: getByteWidth(width, bpp, depth),
	      height: height,
	      lineIndex: 0
	    });
	  }

	  // when filtering the line we look at the pixel to the left
	  // the spec also says it is done on a byte level regardless of the number of pixels
	  // so if the depth is byte compatible (8 or 16) we subtract the bpp in order to compare back
	  // a pixel rather than just a different byte part. However if we are sub byte, we ignore.
	  if (depth === 8) {
	    this._xComparison = bpp;
	  }
	  else if (depth === 16) {
	    this._xComparison = bpp * 2;
	  }
	  else {
	    this._xComparison = 1;
	  }
	};

	Filter$2.prototype.start = function() {
	  this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
	};

	Filter$2.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {

	  var xComparison = this._xComparison;
	  var xBiggerThan = xComparison - 1;

	  for (var x = 0; x < byteWidth; x++) {
	    var rawByte = rawData[1 + x];
	    var f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
	    unfilteredLine[x] = rawByte + f1Left;
	  }
	};

	Filter$2.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {

	  var lastLine = this._lastLine;

	  for (var x = 0; x < byteWidth; x++) {
	    var rawByte = rawData[1 + x];
	    var f2Up = lastLine ? lastLine[x] : 0;
	    unfilteredLine[x] = rawByte + f2Up;
	  }
	};

	Filter$2.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {

	  var xComparison = this._xComparison;
	  var xBiggerThan = xComparison - 1;
	  var lastLine = this._lastLine;

	  for (var x = 0; x < byteWidth; x++) {
	    var rawByte = rawData[1 + x];
	    var f3Up = lastLine ? lastLine[x] : 0;
	    var f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
	    var f3Add = Math.floor((f3Left + f3Up) / 2);
	    unfilteredLine[x] = rawByte + f3Add;
	  }
	};

	Filter$2.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {

	  var xComparison = this._xComparison;
	  var xBiggerThan = xComparison - 1;
	  var lastLine = this._lastLine;

	  for (var x = 0; x < byteWidth; x++) {
	    var rawByte = rawData[1 + x];
	    var f4Up = lastLine ? lastLine[x] : 0;
	    var f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
	    var f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
	    var f4Add = paethPredictor$1(f4Left, f4Up, f4UpLeft);
	    unfilteredLine[x] = rawByte + f4Add;
	  }
	};

	Filter$2.prototype._reverseFilterLine = function(rawData) {

	  var filter = rawData[0];
	  var unfilteredLine;
	  var currentImage = this._images[this._imageIndex];
	  var byteWidth = currentImage.byteWidth;

	  if (filter === 0) {
	    unfilteredLine = rawData.slice(1, byteWidth + 1);
	  }
	  else {

	    unfilteredLine = new Buffer$1(byteWidth);

	    switch (filter) {
	      case 1:
	        this._unFilterType1(rawData, unfilteredLine, byteWidth);
	        break;
	      case 2:
	        this._unFilterType2(rawData, unfilteredLine, byteWidth);
	        break;
	      case 3:
	        this._unFilterType3(rawData, unfilteredLine, byteWidth);
	        break;
	      case 4:
	        this._unFilterType4(rawData, unfilteredLine, byteWidth);
	        break;
	      default:
	        throw new Error('Unrecognised filter type - ' + filter);
	    }
	  }

	  this.write(unfilteredLine);

	  currentImage.lineIndex++;
	  if (currentImage.lineIndex >= currentImage.height) {
	    this._lastLine = null;
	    this._imageIndex++;
	    currentImage = this._images[this._imageIndex];
	  }
	  else {
	    this._lastLine = unfilteredLine;
	  }

	  if (currentImage) {
	    // read, using the byte width that may be from the new current image
	    this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
	  }
	  else {
	    this._lastLine = null;
	    this.complete();
	  }
	};

	var util$3 = require$$0$3;
	var ChunkStream$1 = chunkstream.exports;
	var Filter$1 = filterParse.exports;


	var FilterAsync$1 = filterParseAsync.exports = function(bitmapInfo) {
	  ChunkStream$1.call(this);

	  var buffers = [];
	  var that = this;
	  this._filter = new Filter$1(bitmapInfo, {
	    read: this.read.bind(this),
	    write: function(buffer) {
	      buffers.push(buffer);
	    },
	    complete: function() {
	      that.emit('complete', Buffer$1.concat(buffers));
	    }
	  });

	  this._filter.start();
	};
	util$3.inherits(FilterAsync$1, ChunkStream$1);

	var parser = {exports: {}};

	var constants$5 = {

	  PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

	  TYPE_IHDR: 0x49484452,
	  TYPE_IEND: 0x49454e44,
	  TYPE_IDAT: 0x49444154,
	  TYPE_PLTE: 0x504c5445,
	  TYPE_tRNS: 0x74524e53, // eslint-disable-line camelcase
	  TYPE_gAMA: 0x67414d41, // eslint-disable-line camelcase

	  // color-type bits
	  COLORTYPE_GRAYSCALE: 0,
	  COLORTYPE_PALETTE: 1,
	  COLORTYPE_COLOR: 2,
	  COLORTYPE_ALPHA: 4, // e.g. grayscale and alpha

	  // color-type combinations
	  COLORTYPE_PALETTE_COLOR: 3,
	  COLORTYPE_COLOR_ALPHA: 6,

	  COLORTYPE_TO_BPP_MAP: {
	    0: 1,
	    2: 3,
	    3: 1,
	    4: 2,
	    6: 4
	  },

	  GAMMA_DIVISION: 100000
	};

	var crc = {exports: {}};

	var crcTable = [];

	(function() {
	  for (var i = 0; i < 256; i++) {
	    var currentCrc = i;
	    for (var j = 0; j < 8; j++) {
	      if (currentCrc & 1) {
	        currentCrc = 0xedb88320 ^ (currentCrc >>> 1);
	      }
	      else {
	        currentCrc = currentCrc >>> 1;
	      }
	    }
	    crcTable[i] = currentCrc;
	  }
	}());

	var CrcCalculator$1 = crc.exports = function() {
	  this._crc = -1;
	};

	CrcCalculator$1.prototype.write = function(data) {

	  for (var i = 0; i < data.length; i++) {
	    this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ (this._crc >>> 8);
	  }
	  return true;
	};

	CrcCalculator$1.prototype.crc32 = function() {
	  return this._crc ^ -1;
	};


	CrcCalculator$1.crc32 = function(buf) {

	  var crc = -1;
	  for (var i = 0; i < buf.length; i++) {
	    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
	  }
	  return crc ^ -1;
	};

	var constants$4 = constants$5;
	var CrcCalculator = crc.exports;


	var Parser$3 = parser.exports = function(options, dependencies) {

	  this._options = options;
	  options.checkCRC = options.checkCRC !== false;

	  this._hasIHDR = false;
	  this._hasIEND = false;
	  this._emittedHeadersFinished = false;

	  // input flags/metadata
	  this._palette = [];
	  this._colorType = 0;

	  this._chunks = {};
	  this._chunks[constants$4.TYPE_IHDR] = this._handleIHDR.bind(this);
	  this._chunks[constants$4.TYPE_IEND] = this._handleIEND.bind(this);
	  this._chunks[constants$4.TYPE_IDAT] = this._handleIDAT.bind(this);
	  this._chunks[constants$4.TYPE_PLTE] = this._handlePLTE.bind(this);
	  this._chunks[constants$4.TYPE_tRNS] = this._handleTRNS.bind(this);
	  this._chunks[constants$4.TYPE_gAMA] = this._handleGAMA.bind(this);

	  this.read = dependencies.read;
	  this.error = dependencies.error;
	  this.metadata = dependencies.metadata;
	  this.gamma = dependencies.gamma;
	  this.transColor = dependencies.transColor;
	  this.palette = dependencies.palette;
	  this.parsed = dependencies.parsed;
	  this.inflateData = dependencies.inflateData;
	  this.finished = dependencies.finished;
	  this.simpleTransparency = dependencies.simpleTransparency;
	  this.headersFinished = dependencies.headersFinished || function() {};
	};

	Parser$3.prototype.start = function() {
	  this.read(constants$4.PNG_SIGNATURE.length,
	    this._parseSignature.bind(this)
	  );
	};

	Parser$3.prototype._parseSignature = function(data) {

	  var signature = constants$4.PNG_SIGNATURE;

	  for (var i = 0; i < signature.length; i++) {
	    if (data[i] !== signature[i]) {
	      this.error(new Error('Invalid file signature'));
	      return;
	    }
	  }
	  this.read(8, this._parseChunkBegin.bind(this));
	};

	Parser$3.prototype._parseChunkBegin = function(data) {

	  // chunk content length
	  var length = data.readUInt32BE(0);

	  // chunk type
	  var type = data.readUInt32BE(4);
	  var name = '';
	  for (var i = 4; i < 8; i++) {
	    name += String.fromCharCode(data[i]);
	  }

	  //console.log('chunk ', name, length);

	  // chunk flags
	  var ancillary = Boolean(data[4] & 0x20); // or critical
	  //    priv = Boolean(data[5] & 0x20), // or public
	  //    safeToCopy = Boolean(data[7] & 0x20); // or unsafe

	  if (!this._hasIHDR && type !== constants$4.TYPE_IHDR) {
	    this.error(new Error('Expected IHDR on beggining'));
	    return;
	  }

	  this._crc = new CrcCalculator();
	  this._crc.write(new Buffer$1(name));

	  if (this._chunks[type]) {
	    return this._chunks[type](length);
	  }

	  if (!ancillary) {
	    this.error(new Error('Unsupported critical chunk type ' + name));
	    return;
	  }

	  this.read(length + 4, this._skipChunk.bind(this));
	};

	Parser$3.prototype._skipChunk = function(/*data*/) {
	  this.read(8, this._parseChunkBegin.bind(this));
	};

	Parser$3.prototype._handleChunkEnd = function() {
	  this.read(4, this._parseChunkEnd.bind(this));
	};

	Parser$3.prototype._parseChunkEnd = function(data) {

	  var fileCrc = data.readInt32BE(0);
	  var calcCrc = this._crc.crc32();

	  // check CRC
	  if (this._options.checkCRC && calcCrc !== fileCrc) {
	    this.error(new Error('Crc error - ' + fileCrc + ' - ' + calcCrc));
	    return;
	  }

	  if (!this._hasIEND) {
	    this.read(8, this._parseChunkBegin.bind(this));
	  }
	};

	Parser$3.prototype._handleIHDR = function(length) {
	  this.read(length, this._parseIHDR.bind(this));
	};
	Parser$3.prototype._parseIHDR = function(data) {

	  this._crc.write(data);

	  var width = data.readUInt32BE(0);
	  var height = data.readUInt32BE(4);
	  var depth = data[8];
	  var colorType = data[9]; // bits: 1 palette, 2 color, 4 alpha
	  var compr = data[10];
	  var filter = data[11];
	  var interlace = data[12];

	  // console.log('    width', width, 'height', height,
	  //     'depth', depth, 'colorType', colorType,
	  //     'compr', compr, 'filter', filter, 'interlace', interlace
	  // );

	  if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
	    this.error(new Error('Unsupported bit depth ' + depth));
	    return;
	  }
	  if (!(colorType in constants$4.COLORTYPE_TO_BPP_MAP)) {
	    this.error(new Error('Unsupported color type'));
	    return;
	  }
	  if (compr !== 0) {
	    this.error(new Error('Unsupported compression method'));
	    return;
	  }
	  if (filter !== 0) {
	    this.error(new Error('Unsupported filter method'));
	    return;
	  }
	  if (interlace !== 0 && interlace !== 1) {
	    this.error(new Error('Unsupported interlace method'));
	    return;
	  }

	  this._colorType = colorType;

	  var bpp = constants$4.COLORTYPE_TO_BPP_MAP[this._colorType];

	  this._hasIHDR = true;

	  this.metadata({
	    width: width,
	    height: height,
	    depth: depth,
	    interlace: Boolean(interlace),
	    palette: Boolean(colorType & constants$4.COLORTYPE_PALETTE),
	    color: Boolean(colorType & constants$4.COLORTYPE_COLOR),
	    alpha: Boolean(colorType & constants$4.COLORTYPE_ALPHA),
	    bpp: bpp,
	    colorType: colorType
	  });

	  this._handleChunkEnd();
	};


	Parser$3.prototype._handlePLTE = function(length) {
	  this.read(length, this._parsePLTE.bind(this));
	};
	Parser$3.prototype._parsePLTE = function(data) {

	  this._crc.write(data);

	  var entries = Math.floor(data.length / 3);
	  // console.log('Palette:', entries);

	  for (var i = 0; i < entries; i++) {
	    this._palette.push([
	      data[i * 3],
	      data[i * 3 + 1],
	      data[i * 3 + 2],
	      0xff
	    ]);
	  }

	  this.palette(this._palette);

	  this._handleChunkEnd();
	};

	Parser$3.prototype._handleTRNS = function(length) {
	  this.simpleTransparency();
	  this.read(length, this._parseTRNS.bind(this));
	};
	Parser$3.prototype._parseTRNS = function(data) {

	  this._crc.write(data);

	  // palette
	  if (this._colorType === constants$4.COLORTYPE_PALETTE_COLOR) {
	    if (this._palette.length === 0) {
	      this.error(new Error('Transparency chunk must be after palette'));
	      return;
	    }
	    if (data.length > this._palette.length) {
	      this.error(new Error('More transparent colors than palette size'));
	      return;
	    }
	    for (var i = 0; i < data.length; i++) {
	      this._palette[i][3] = data[i];
	    }
	    this.palette(this._palette);
	  }

	  // for colorType 0 (grayscale) and 2 (rgb)
	  // there might be one gray/color defined as transparent
	  if (this._colorType === constants$4.COLORTYPE_GRAYSCALE) {
	    // grey, 2 bytes
	    this.transColor([data.readUInt16BE(0)]);
	  }
	  if (this._colorType === constants$4.COLORTYPE_COLOR) {
	    this.transColor([data.readUInt16BE(0), data.readUInt16BE(2), data.readUInt16BE(4)]);
	  }

	  this._handleChunkEnd();
	};

	Parser$3.prototype._handleGAMA = function(length) {
	  this.read(length, this._parseGAMA.bind(this));
	};
	Parser$3.prototype._parseGAMA = function(data) {

	  this._crc.write(data);
	  this.gamma(data.readUInt32BE(0) / constants$4.GAMMA_DIVISION);

	  this._handleChunkEnd();
	};

	Parser$3.prototype._handleIDAT = function(length) {
	  if (!this._emittedHeadersFinished) {
	    this._emittedHeadersFinished = true;
	    this.headersFinished();
	  }
	  this.read(-length, this._parseIDAT.bind(this, length));
	};
	Parser$3.prototype._parseIDAT = function(length, data) {

	  this._crc.write(data);

	  if (this._colorType === constants$4.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
	    throw new Error('Expected palette not found');
	  }

	  this.inflateData(data);
	  var leftOverLength = length - data.length;

	  if (leftOverLength > 0) {
	    this._handleIDAT(leftOverLength);
	  }
	  else {
	    this._handleChunkEnd();
	  }
	};

	Parser$3.prototype._handleIEND = function(length) {
	  this.read(length, this._parseIEND.bind(this));
	};
	Parser$3.prototype._parseIEND = function(data) {

	  this._crc.write(data);

	  this._hasIEND = true;
	  this._handleChunkEnd();

	  if (this.finished) {
	    this.finished();
	  }
	};

	var bitmapper$2 = {};

	var interlaceUtils = interlace;

	var pixelBppMapper = [
	  // 0 - dummy entry
	  function() {},

	  // 1 - L
	  // 0: 0, 1: 0, 2: 0, 3: 0xff
	  function(pxData, data, pxPos, rawPos) {
	    if (rawPos === data.length) {
	      throw new Error('Ran out of data');
	    }

	    var pixel = data[rawPos];
	    pxData[pxPos] = pixel;
	    pxData[pxPos + 1] = pixel;
	    pxData[pxPos + 2] = pixel;
	    pxData[pxPos + 3] = 0xff;
	  },

	  // 2 - LA
	  // 0: 0, 1: 0, 2: 0, 3: 1
	  function(pxData, data, pxPos, rawPos) {
	    if (rawPos + 1 >= data.length) {
	      throw new Error('Ran out of data');
	    }

	    var pixel = data[rawPos];
	    pxData[pxPos] = pixel;
	    pxData[pxPos + 1] = pixel;
	    pxData[pxPos + 2] = pixel;
	    pxData[pxPos + 3] = data[rawPos + 1];
	  },

	  // 3 - RGB
	  // 0: 0, 1: 1, 2: 2, 3: 0xff
	  function(pxData, data, pxPos, rawPos) {
	    if (rawPos + 2 >= data.length) {
	      throw new Error('Ran out of data');
	    }

	    pxData[pxPos] = data[rawPos];
	    pxData[pxPos + 1] = data[rawPos + 1];
	    pxData[pxPos + 2] = data[rawPos + 2];
	    pxData[pxPos + 3] = 0xff;
	  },

	  // 4 - RGBA
	  // 0: 0, 1: 1, 2: 2, 3: 3
	  function(pxData, data, pxPos, rawPos) {
	    if (rawPos + 3 >= data.length) {
	      throw new Error('Ran out of data');
	    }

	    pxData[pxPos] = data[rawPos];
	    pxData[pxPos + 1] = data[rawPos + 1];
	    pxData[pxPos + 2] = data[rawPos + 2];
	    pxData[pxPos + 3] = data[rawPos + 3];
	  }
	];

	var pixelBppCustomMapper = [
	  // 0 - dummy entry
	  function() {},

	  // 1 - L
	  // 0: 0, 1: 0, 2: 0, 3: 0xff
	  function(pxData, pixelData, pxPos, maxBit) {
	    var pixel = pixelData[0];
	    pxData[pxPos] = pixel;
	    pxData[pxPos + 1] = pixel;
	    pxData[pxPos + 2] = pixel;
	    pxData[pxPos + 3] = maxBit;
	  },

	  // 2 - LA
	  // 0: 0, 1: 0, 2: 0, 3: 1
	  function(pxData, pixelData, pxPos) {
	    var pixel = pixelData[0];
	    pxData[pxPos] = pixel;
	    pxData[pxPos + 1] = pixel;
	    pxData[pxPos + 2] = pixel;
	    pxData[pxPos + 3] = pixelData[1];
	  },

	  // 3 - RGB
	  // 0: 0, 1: 1, 2: 2, 3: 0xff
	  function(pxData, pixelData, pxPos, maxBit) {
	    pxData[pxPos] = pixelData[0];
	    pxData[pxPos + 1] = pixelData[1];
	    pxData[pxPos + 2] = pixelData[2];
	    pxData[pxPos + 3] = maxBit;
	  },

	  // 4 - RGBA
	  // 0: 0, 1: 1, 2: 2, 3: 3
	  function(pxData, pixelData, pxPos) {
	    pxData[pxPos] = pixelData[0];
	    pxData[pxPos + 1] = pixelData[1];
	    pxData[pxPos + 2] = pixelData[2];
	    pxData[pxPos + 3] = pixelData[3];
	  }
	];

	function bitRetriever(data, depth) {

	  var leftOver = [];
	  var i = 0;

	  function split() {
	    if (i === data.length) {
	      throw new Error('Ran out of data');
	    }
	    var byte = data[i];
	    i++;
	    var byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
	    switch (depth) {
	      default:
	        throw new Error('unrecognised depth');
	      case 16:
	        byte2 = data[i];
	        i++;
	        leftOver.push(((byte << 8) + byte2));
	        break;
	      case 4:
	        byte2 = byte & 0x0f;
	        byte1 = byte >> 4;
	        leftOver.push(byte1, byte2);
	        break;
	      case 2:
	        byte4 = byte & 3;
	        byte3 = byte >> 2 & 3;
	        byte2 = byte >> 4 & 3;
	        byte1 = byte >> 6 & 3;
	        leftOver.push(byte1, byte2, byte3, byte4);
	        break;
	      case 1:
	        byte8 = byte & 1;
	        byte7 = byte >> 1 & 1;
	        byte6 = byte >> 2 & 1;
	        byte5 = byte >> 3 & 1;
	        byte4 = byte >> 4 & 1;
	        byte3 = byte >> 5 & 1;
	        byte2 = byte >> 6 & 1;
	        byte1 = byte >> 7 & 1;
	        leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
	        break;
	    }
	  }

	  return {
	    get: function(count) {
	      while (leftOver.length < count) {
	        split();
	      }
	      var returner = leftOver.slice(0, count);
	      leftOver = leftOver.slice(count);
	      return returner;
	    },
	    resetAfterLine: function() {
	      leftOver.length = 0;
	    },
	    end: function() {
	      if (i !== data.length) {
	        throw new Error('extra data found');
	      }
	    }
	  };
	}

	function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) { // eslint-disable-line max-params
	  var imageWidth = image.width;
	  var imageHeight = image.height;
	  var imagePass = image.index;
	  for (var y = 0; y < imageHeight; y++) {
	    for (var x = 0; x < imageWidth; x++) {
	      var pxPos = getPxPos(x, y, imagePass);
	      pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
	      rawPos += bpp; //eslint-disable-line no-param-reassign
	    }
	  }
	  return rawPos;
	}

	function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) { // eslint-disable-line max-params
	  var imageWidth = image.width;
	  var imageHeight = image.height;
	  var imagePass = image.index;
	  for (var y = 0; y < imageHeight; y++) {
	    for (var x = 0; x < imageWidth; x++) {
	      var pixelData = bits.get(bpp);
	      var pxPos = getPxPos(x, y, imagePass);
	      pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
	    }
	    bits.resetAfterLine();
	  }
	}

	bitmapper$2.dataToBitMap = function(data, bitmapInfo) {

	  var width = bitmapInfo.width;
	  var height = bitmapInfo.height;
	  var depth = bitmapInfo.depth;
	  var bpp = bitmapInfo.bpp;
	  var interlace = bitmapInfo.interlace;

	  if (depth !== 8) {
	    var bits = bitRetriever(data, depth);
	  }
	  var pxData;
	  if (depth <= 8) {
	    pxData = new Buffer$1(width * height * 4);
	  }
	  else {
	    pxData = new Uint16Array(width * height * 4);
	  }
	  var maxBit = Math.pow(2, depth) - 1;
	  var rawPos = 0;
	  var images;
	  var getPxPos;

	  if (interlace) {
	    images = interlaceUtils.getImagePasses(width, height);
	    getPxPos = interlaceUtils.getInterlaceIterator(width, height);
	  }
	  else {
	    var nonInterlacedPxPos = 0;
	    getPxPos = function() {
	      var returner = nonInterlacedPxPos;
	      nonInterlacedPxPos += 4;
	      return returner;
	    };
	    images = [{ width: width, height: height }];
	  }

	  for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
	    if (depth === 8) {
	      rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
	    }
	    else {
	      mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
	    }
	  }
	  if (depth === 8) {
	    if (rawPos !== data.length) {
	      throw new Error('extra data found');
	    }
	  }
	  else {
	    bits.end();
	  }

	  return pxData;
	};

	function dePalette(indata, outdata, width, height, palette) {
	  var pxPos = 0;
	  // use values from palette
	  for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
	      var color = palette[indata[pxPos]];

	      if (!color) {
	        throw new Error('index ' + indata[pxPos] + ' not in palette');
	      }

	      for (var i = 0; i < 4; i++) {
	        outdata[pxPos + i] = color[i];
	      }
	      pxPos += 4;
	    }
	  }
	}

	function replaceTransparentColor(indata, outdata, width, height, transColor) {
	  var pxPos = 0;
	  for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
	      var makeTrans = false;

	      if (transColor.length === 1) {
	        if (transColor[0] === indata[pxPos]) {
	          makeTrans = true;
	        }
	      }
	      else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
	        makeTrans = true;
	      }
	      if (makeTrans) {
	        for (var i = 0; i < 4; i++) {
	          outdata[pxPos + i] = 0;
	        }
	      }
	      pxPos += 4;
	    }
	  }
	}

	function scaleDepth(indata, outdata, width, height, depth) {
	  var maxOutSample = 255;
	  var maxInSample = Math.pow(2, depth) - 1;
	  var pxPos = 0;

	  for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
	      for (var i = 0; i < 4; i++) {
	        outdata[pxPos + i] = Math.floor((indata[pxPos + i] * maxOutSample) / maxInSample + 0.5);
	      }
	      pxPos += 4;
	    }
	  }
	}

	var formatNormaliser$2 = function(indata, imageData) {

	  var depth = imageData.depth;
	  var width = imageData.width;
	  var height = imageData.height;
	  var colorType = imageData.colorType;
	  var transColor = imageData.transColor;
	  var palette = imageData.palette;

	  var outdata = indata; // only different for 16 bits

	  if (colorType === 3) { // paletted
	    dePalette(indata, outdata, width, height, palette);
	  }
	  else {
	    if (transColor) {
	      replaceTransparentColor(indata, outdata, width, height, transColor);
	    }
	    // if it needs scaling
	    if (depth !== 8) {
	      // if we need to change the buffer size
	      if (depth === 16) {
	        outdata = new Buffer$1(width * height * 4);
	      }
	      scaleDepth(indata, outdata, width, height, depth);
	    }
	  }
	  return outdata;
	};

	var util$2 = require$$0$3;
	var zlib$3 = require$$0$2;
	var ChunkStream = chunkstream.exports;
	var FilterAsync = filterParseAsync.exports;
	var Parser$2 = parser.exports;
	var bitmapper$1 = bitmapper$2;
	var formatNormaliser$1 = formatNormaliser$2;

	var ParserAsync = parserAsync.exports = function(options) {
	  ChunkStream.call(this);

	  this._parser = new Parser$2(options, {
	    read: this.read.bind(this),
	    error: this._handleError.bind(this),
	    metadata: this._handleMetaData.bind(this),
	    gamma: this.emit.bind(this, 'gamma'),
	    palette: this._handlePalette.bind(this),
	    transColor: this._handleTransColor.bind(this),
	    finished: this._finished.bind(this),
	    inflateData: this._inflateData.bind(this),
	    simpleTransparency: this._simpleTransparency.bind(this),
	    headersFinished: this._headersFinished.bind(this)
	  });
	  this._options = options;
	  this.writable = true;

	  this._parser.start();
	};
	util$2.inherits(ParserAsync, ChunkStream);


	ParserAsync.prototype._handleError = function(err) {

	  this.emit('error', err);

	  this.writable = false;

	  this.destroy();

	  if (this._inflate && this._inflate.destroy) {
	    this._inflate.destroy();
	  }

	  if (this._filter) {
	    this._filter.destroy();
	    // For backward compatibility with Node 7 and below.
	    // Suppress errors due to _inflate calling write() even after
	    // it's destroy()'ed.
	    this._filter.on('error', function() {});
	  }

	  this.errord = true;
	};

	ParserAsync.prototype._inflateData = function(data) {
	  if (!this._inflate) {
	    if (this._bitmapInfo.interlace) {
	      this._inflate = zlib$3.createInflate();

	      this._inflate.on('error', this.emit.bind(this, 'error'));
	      this._filter.on('complete', this._complete.bind(this));

	      this._inflate.pipe(this._filter);
	    }
	    else {
	      var rowSize = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7) >> 3) + 1;
	      var imageSize = rowSize * this._bitmapInfo.height;
	      var chunkSize = Math.max(imageSize, zlib$3.Z_MIN_CHUNK);

	      this._inflate = zlib$3.createInflate({ chunkSize: chunkSize });
	      var leftToInflate = imageSize;

	      var emitError = this.emit.bind(this, 'error');
	      this._inflate.on('error', function(err) {
	        if (!leftToInflate) {
	          return;
	        }

	        emitError(err);
	      });
	      this._filter.on('complete', this._complete.bind(this));

	      var filterWrite = this._filter.write.bind(this._filter);
	      this._inflate.on('data', function(chunk) {
	        if (!leftToInflate) {
	          return;
	        }

	        if (chunk.length > leftToInflate) {
	          chunk = chunk.slice(0, leftToInflate);
	        }

	        leftToInflate -= chunk.length;

	        filterWrite(chunk);
	      });

	      this._inflate.on('end', this._filter.end.bind(this._filter));
	    }
	  }
	  this._inflate.write(data);
	};

	ParserAsync.prototype._handleMetaData = function(metaData) {
	  this._metaData = metaData;
	  this._bitmapInfo = Object.create(metaData);

	  this._filter = new FilterAsync(this._bitmapInfo);
	};

	ParserAsync.prototype._handleTransColor = function(transColor) {
	  this._bitmapInfo.transColor = transColor;
	};

	ParserAsync.prototype._handlePalette = function(palette) {
	  this._bitmapInfo.palette = palette;
	};

	ParserAsync.prototype._simpleTransparency = function() {
	  this._metaData.alpha = true;
	};

	ParserAsync.prototype._headersFinished = function() {
	  // Up until this point, we don't know if we have a tRNS chunk (alpha)
	  // so we can't emit metadata any earlier
	  this.emit('metadata', this._metaData);
	};

	ParserAsync.prototype._finished = function() {
	  if (this.errord) {
	    return;
	  }

	  if (!this._inflate) {
	    this.emit('error', 'No Inflate block');
	  }
	  else {
	    // no more data to inflate
	    this._inflate.end();
	  }
	  this.destroySoon();
	};

	ParserAsync.prototype._complete = function(filteredData) {

	  if (this.errord) {
	    return;
	  }

	  try {
	    var bitmapData = bitmapper$1.dataToBitMap(filteredData, this._bitmapInfo);

	    var normalisedBitmapData = formatNormaliser$1(bitmapData, this._bitmapInfo);
	    bitmapData = null;
	  }
	  catch (ex) {
	    this._handleError(ex);
	    return;
	  }

	  this.emit('parsed', normalisedBitmapData);
	};

	var packerAsync = {exports: {}};

	var packer = {exports: {}};

	var constants$3 = constants$5;

	var bitpacker = function(dataIn, width, height, options) {
	  var outHasAlpha = [constants$3.COLORTYPE_COLOR_ALPHA, constants$3.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
	  if (options.colorType === options.inputColorType) {
	    var bigEndian = (function() {
	      var buffer = new ArrayBuffer(2);
	      new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	      // Int16Array uses the platform's endianness.
	      return new Int16Array(buffer)[0] !== 256;
	    })();
	    // If no need to convert to grayscale and alpha is present/absent in both, take a fast route
	    if (options.bitDepth === 8 || (options.bitDepth === 16 && bigEndian)) {
	      return dataIn;
	    }
	  }

	  // map to a UInt16 array if data is 16bit, fix endianness below
	  var data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);

	  var maxValue = 255;
	  var inBpp = constants$3.COLORTYPE_TO_BPP_MAP[options.inputColorType];
	  if (inBpp === 4 && !options.inputHasAlpha) {
	    inBpp = 3;
	  }
	  var outBpp = constants$3.COLORTYPE_TO_BPP_MAP[options.colorType];
	  if (options.bitDepth === 16) {
	    maxValue = 65535;
	    outBpp *= 2;
	  }
	  var outData = new Buffer$1(width * height * outBpp);

	  var inIndex = 0;
	  var outIndex = 0;

	  var bgColor = options.bgColor || {};
	  if (bgColor.red === undefined) {
	    bgColor.red = maxValue;
	  }
	  if (bgColor.green === undefined) {
	    bgColor.green = maxValue;
	  }
	  if (bgColor.blue === undefined) {
	    bgColor.blue = maxValue;
	  }

	  function getRGBA() {
	    var red;
	    var green;
	    var blue;
	    var alpha = maxValue;
	    switch (options.inputColorType) {
	      case constants$3.COLORTYPE_COLOR_ALPHA:
	        alpha = data[inIndex + 3];
	        red = data[inIndex];
	        green = data[inIndex + 1];
	        blue = data[inIndex + 2];
	        break;
	      case constants$3.COLORTYPE_COLOR:
	        red = data[inIndex];
	        green = data[inIndex + 1];
	        blue = data[inIndex + 2];
	        break;
	      case constants$3.COLORTYPE_ALPHA:
	        alpha = data[inIndex + 1];
	        red = data[inIndex];
	        green = red;
	        blue = red;
	        break;
	      case constants$3.COLORTYPE_GRAYSCALE:
	        red = data[inIndex];
	        green = red;
	        blue = red;
	        break;
	      default:
	        throw new Error('input color type:' + options.inputColorType + ' is not supported at present');
	    }

	    if (options.inputHasAlpha) {
	      if (!outHasAlpha) {
	        alpha /= maxValue;
	        red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
	        green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
	        blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
	      }
	    }
	    return { red: red, green: green, blue: blue, alpha: alpha };
	  }

	  for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
	      var rgba = getRGBA();

	      switch (options.colorType) {
	        case constants$3.COLORTYPE_COLOR_ALPHA:
	        case constants$3.COLORTYPE_COLOR:
	          if (options.bitDepth === 8) {
	            outData[outIndex] = rgba.red;
	            outData[outIndex + 1] = rgba.green;
	            outData[outIndex + 2] = rgba.blue;
	            if (outHasAlpha) {
	              outData[outIndex + 3] = rgba.alpha;
	            }
	          }
	          else {
	            outData.writeUInt16BE(rgba.red, outIndex);
	            outData.writeUInt16BE(rgba.green, outIndex + 2);
	            outData.writeUInt16BE(rgba.blue, outIndex + 4);
	            if (outHasAlpha) {
	              outData.writeUInt16BE(rgba.alpha, outIndex + 6);
	            }
	          }
	          break;
	        case constants$3.COLORTYPE_ALPHA:
	        case constants$3.COLORTYPE_GRAYSCALE:
	          // Convert to grayscale and alpha
	          var grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
	          if (options.bitDepth === 8) {
	            outData[outIndex] = grayscale;
	            if (outHasAlpha) {
	              outData[outIndex + 1] = rgba.alpha;
	            }
	          }
	          else {
	            outData.writeUInt16BE(grayscale, outIndex);
	            if (outHasAlpha) {
	              outData.writeUInt16BE(rgba.alpha, outIndex + 2);
	            }
	          }
	          break;
	        default:
	          throw new Error('unrecognised color Type ' + options.colorType);
	      }

	      inIndex += inBpp;
	      outIndex += outBpp;
	    }
	  }

	  return outData;
	};

	var paethPredictor = paethPredictor$2;

	function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {

	  for (var x = 0; x < byteWidth; x++) {
	    rawData[rawPos + x] = pxData[pxPos + x];
	  }
	}

	function filterSumNone(pxData, pxPos, byteWidth) {

	  var sum = 0;
	  var length = pxPos + byteWidth;

	  for (var i = pxPos; i < length; i++) {
	    sum += Math.abs(pxData[i]);
	  }
	  return sum;
	}

	function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var val = pxData[pxPos + x] - left;

	    rawData[rawPos + x] = val;
	  }
	}

	function filterSumSub(pxData, pxPos, byteWidth, bpp) {

	  var sum = 0;
	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var val = pxData[pxPos + x] - left;

	    sum += Math.abs(val);
	  }

	  return sum;
	}

	function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {

	  for (var x = 0; x < byteWidth; x++) {

	    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
	    var val = pxData[pxPos + x] - up;

	    rawData[rawPos + x] = val;
	  }
	}

	function filterSumUp(pxData, pxPos, byteWidth) {

	  var sum = 0;
	  var length = pxPos + byteWidth;
	  for (var x = pxPos; x < length; x++) {

	    var up = pxPos > 0 ? pxData[x - byteWidth] : 0;
	    var val = pxData[x] - up;

	    sum += Math.abs(val);
	  }

	  return sum;
	}

	function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
	    var val = pxData[pxPos + x] - ((left + up) >> 1);

	    rawData[rawPos + x] = val;
	  }
	}

	function filterSumAvg(pxData, pxPos, byteWidth, bpp) {

	  var sum = 0;
	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
	    var val = pxData[pxPos + x] - ((left + up) >> 1);

	    sum += Math.abs(val);
	  }

	  return sum;
	}

	function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
	    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
	    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

	    rawData[rawPos + x] = val;
	  }
	}

	function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
	  var sum = 0;
	  for (var x = 0; x < byteWidth; x++) {

	    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
	    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
	    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
	    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

	    sum += Math.abs(val);
	  }

	  return sum;
	}

	var filters = {
	  0: filterNone,
	  1: filterSub,
	  2: filterUp,
	  3: filterAvg,
	  4: filterPaeth
	};

	var filterSums = {
	  0: filterSumNone,
	  1: filterSumSub,
	  2: filterSumUp,
	  3: filterSumAvg,
	  4: filterSumPaeth
	};

	var filterPack = function(pxData, width, height, options, bpp) {

	  var filterTypes;
	  if (!('filterType' in options) || options.filterType === -1) {
	    filterTypes = [0, 1, 2, 3, 4];
	  }
	  else if (typeof options.filterType === 'number') {
	    filterTypes = [options.filterType];
	  }
	  else {
	    throw new Error('unrecognised filter types');
	  }

	  if (options.bitDepth === 16) {
	    bpp *= 2;
	  }
	  var byteWidth = width * bpp;
	  var rawPos = 0;
	  var pxPos = 0;
	  var rawData = new Buffer$1((byteWidth + 1) * height);

	  var sel = filterTypes[0];

	  for (var y = 0; y < height; y++) {

	    if (filterTypes.length > 1) {
	      // find best filter for this line (with lowest sum of values)
	      var min = Infinity;

	      for (var i = 0; i < filterTypes.length; i++) {
	        var sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
	        if (sum < min) {
	          sel = filterTypes[i];
	          min = sum;
	        }
	      }
	    }

	    rawData[rawPos] = sel;
	    rawPos++;
	    filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
	    rawPos += byteWidth;
	    pxPos += byteWidth;
	  }
	  return rawData;
	};

	var constants$2 = constants$5;
	var CrcStream = crc.exports;
	var bitPacker = bitpacker;
	var filter$1 = filterPack;
	var zlib$2 = require$$0$2;

	var Packer$3 = packer.exports = function(options) {
	  this._options = options;

	  options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
	  options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
	  options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
	  options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
	  options.deflateFactory = options.deflateFactory || zlib$2.createDeflate;
	  options.bitDepth = options.bitDepth || 8;
	  // This is outputColorType
	  options.colorType = (typeof options.colorType === 'number') ? options.colorType : constants$2.COLORTYPE_COLOR_ALPHA;
	  options.inputColorType = (typeof options.inputColorType === 'number') ? options.inputColorType : constants$2.COLORTYPE_COLOR_ALPHA;

	  if ([
	    constants$2.COLORTYPE_GRAYSCALE,
	    constants$2.COLORTYPE_COLOR,
	    constants$2.COLORTYPE_COLOR_ALPHA,
	    constants$2.COLORTYPE_ALPHA
	  ].indexOf(options.colorType) === -1) {
	    throw new Error('option color type:' + options.colorType + ' is not supported at present');
	  }
	  if ([
	    constants$2.COLORTYPE_GRAYSCALE,
	    constants$2.COLORTYPE_COLOR,
	    constants$2.COLORTYPE_COLOR_ALPHA,
	    constants$2.COLORTYPE_ALPHA
	  ].indexOf(options.inputColorType) === -1) {
	    throw new Error('option input color type:' + options.inputColorType + ' is not supported at present');
	  }
	  if (options.bitDepth !== 8 && options.bitDepth !== 16) {
	    throw new Error('option bit depth:' + options.bitDepth + ' is not supported at present');
	  }
	};

	Packer$3.prototype.getDeflateOptions = function() {
	  return {
	    chunkSize: this._options.deflateChunkSize,
	    level: this._options.deflateLevel,
	    strategy: this._options.deflateStrategy
	  };
	};

	Packer$3.prototype.createDeflate = function() {
	  return this._options.deflateFactory(this.getDeflateOptions());
	};

	Packer$3.prototype.filterData = function(data, width, height) {
	  // convert to correct format for filtering (e.g. right bpp and bit depth)
	  var packedData = bitPacker(data, width, height, this._options);

	  // filter pixel data
	  var bpp = constants$2.COLORTYPE_TO_BPP_MAP[this._options.colorType];
	  var filteredData = filter$1(packedData, width, height, this._options, bpp);
	  return filteredData;
	};

	Packer$3.prototype._packChunk = function(type, data) {

	  var len = (data ? data.length : 0);
	  var buf = new Buffer$1(len + 12);

	  buf.writeUInt32BE(len, 0);
	  buf.writeUInt32BE(type, 4);

	  if (data) {
	    data.copy(buf, 8);
	  }

	  buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
	  return buf;
	};

	Packer$3.prototype.packGAMA = function(gamma) {
	  var buf = new Buffer$1(4);
	  buf.writeUInt32BE(Math.floor(gamma * constants$2.GAMMA_DIVISION), 0);
	  return this._packChunk(constants$2.TYPE_gAMA, buf);
	};

	Packer$3.prototype.packIHDR = function(width, height) {

	  var buf = new Buffer$1(13);
	  buf.writeUInt32BE(width, 0);
	  buf.writeUInt32BE(height, 4);
	  buf[8] = this._options.bitDepth; // Bit depth
	  buf[9] = this._options.colorType; // colorType
	  buf[10] = 0; // compression
	  buf[11] = 0; // filter
	  buf[12] = 0; // interlace

	  return this._packChunk(constants$2.TYPE_IHDR, buf);
	};

	Packer$3.prototype.packIDAT = function(data) {
	  return this._packChunk(constants$2.TYPE_IDAT, data);
	};

	Packer$3.prototype.packIEND = function() {
	  return this._packChunk(constants$2.TYPE_IEND, null);
	};

	var util$1 = require$$0$3;
	var Stream$1 = require$$1$1;
	var constants$1 = constants$5;
	var Packer$2 = packer.exports;

	var PackerAsync = packerAsync.exports = function(opt) {
	  Stream$1.call(this);

	  var options = opt || {};

	  this._packer = new Packer$2(options);
	  this._deflate = this._packer.createDeflate();

	  this.readable = true;
	};
	util$1.inherits(PackerAsync, Stream$1);


	PackerAsync.prototype.pack = function(data, width, height, gamma) {
	  // Signature
	  this.emit('data', new Buffer$1(constants$1.PNG_SIGNATURE));
	  this.emit('data', this._packer.packIHDR(width, height));

	  if (gamma) {
	    this.emit('data', this._packer.packGAMA(gamma));
	  }

	  var filteredData = this._packer.filterData(data, width, height);

	  // compress it
	  this._deflate.on('error', this.emit.bind(this, 'error'));

	  this._deflate.on('data', function(compressedData) {
	    this.emit('data', this._packer.packIDAT(compressedData));
	  }.bind(this));

	  this._deflate.on('end', function() {
	    this.emit('data', this._packer.packIEND());
	    this.emit('end');
	  }.bind(this));

	  this._deflate.end(filteredData);
	};

	var pngSync = {};

	var syncInflate = {exports: {}};

	function compare(a, b) {
	  if (a === b) {
	    return 0;
	  }

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break;
	    }
	  }

	  if (x < y) {
	    return -1;
	  }
	  if (y < x) {
	    return 1;
	  }
	  return 0;
	}
	var hasOwn = Object.prototype.hasOwnProperty;

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};
	var pSlice = Array.prototype.slice;
	var _functionsHaveNames;
	function functionsHaveNames() {
	  if (typeof _functionsHaveNames !== 'undefined') {
	    return _functionsHaveNames;
	  }
	  return _functionsHaveNames = (function () {
	    return function foo() {}.name === 'foo';
	  }());
	}
	function pToString (obj) {
	  return Object.prototype.toString.call(obj);
	}
	function isView(arrbuf) {
	  if (isBuffer$1(arrbuf)) {
	    return false;
	  }
	  if (typeof global$1.ArrayBuffer !== 'function') {
	    return false;
	  }
	  if (typeof ArrayBuffer.isView === 'function') {
	    return ArrayBuffer.isView(arrbuf);
	  }
	  if (!arrbuf) {
	    return false;
	  }
	  if (arrbuf instanceof DataView) {
	    return true;
	  }
	  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
	    return true;
	  }
	  return false;
	}
	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	function assert(value, message) {
	  if (!value) fail(value, true, message, '==', ok);
	}

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	var regex = /\s*function\s+([^\(\s]*)\s*/;
	// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
	function getName(func) {
	  if (!isFunction(func)) {
	    return;
	  }
	  if (functionsHaveNames()) {
	    return func.name;
	  }
	  var str = func.toString();
	  var match = str.match(regex);
	  return match && match[1];
	}
	assert.AssertionError = AssertionError;
	function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  } else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = getName(stackStartFunction);
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	}

	// assert.AssertionError instanceof Error
	inherits$1(AssertionError, Error);

	function truncate(s, n) {
	  if (typeof s === 'string') {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}
	function inspect(something) {
	  if (functionsHaveNames() || !isFunction(something)) {
	    return inspect$1(something);
	  }
	  var rawname = getName(something);
	  var name = rawname ? ': ' + rawname : '';
	  return '[Function' +  name + ']';
	}
	function getMessage(self) {
	  return truncate(inspect(self.actual), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(inspect(self.expected), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);
	assert.equal = equal;
	function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', equal);
	}

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);
	assert.notEqual = notEqual;
	function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', notEqual);
	  }
	}

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);
	assert.deepEqual = deepEqual;
	function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'deepEqual', deepEqual);
	  }
	}
	assert.deepStrictEqual = deepStrictEqual;
	function deepStrictEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
	  }
	}

	function _deepEqual(actual, expected, strict, memos) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	  } else if (isBuffer$1(actual) && isBuffer$1(expected)) {
	    return compare(actual, expected) === 0;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (isDate(actual) && isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (isRegExp(actual) && isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if ((actual === null || typeof actual !== 'object') &&
	             (expected === null || typeof expected !== 'object')) {
	    return strict ? actual === expected : actual == expected;

	  // If both values are instances of typed arrays, wrap their underlying
	  // ArrayBuffers in a Buffer each to increase performance
	  // This optimization requires the arrays to have the same type as checked by
	  // Object.prototype.toString (aka pToString). Never perform binary
	  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
	  // bit patterns are not identical.
	  } else if (isView(actual) && isView(expected) &&
	             pToString(actual) === pToString(expected) &&
	             !(actual instanceof Float32Array ||
	               actual instanceof Float64Array)) {
	    return compare(new Uint8Array(actual.buffer),
	                   new Uint8Array(expected.buffer)) === 0;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else if (isBuffer$1(actual) !== isBuffer$1(expected)) {
	    return false;
	  } else {
	    memos = memos || {actual: [], expected: []};

	    var actualIndex = memos.actual.indexOf(actual);
	    if (actualIndex !== -1) {
	      if (actualIndex === memos.expected.indexOf(expected)) {
	        return true;
	      }
	    }

	    memos.actual.push(actual);
	    memos.expected.push(expected);

	    return objEquiv(actual, expected, strict, memos);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b, strict, actualVisitedObjects) {
	  if (a === null || a === undefined || b === null || b === undefined)
	    return false;
	  // if one is a primitive, the other must be same
	  if (isPrimitive(a) || isPrimitive(b))
	    return a === b;
	  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
	    return false;
	  var aIsArgs = isArguments(a);
	  var bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b, strict);
	  }
	  var ka = objectKeys(a);
	  var kb = objectKeys(b);
	  var key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length !== kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] !== kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
	      return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);
	assert.notDeepEqual = notDeepEqual;
	function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
	  }
	}

	assert.notDeepStrictEqual = notDeepStrictEqual;
	function notDeepStrictEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
	  }
	}


	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);
	assert.strictEqual = strictEqual;
	function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', strictEqual);
	  }
	}

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
	assert.notStrictEqual = notStrictEqual;
	function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', notStrictEqual);
	  }
	}

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  }

	  try {
	    if (actual instanceof expected) {
	      return true;
	    }
	  } catch (e) {
	    // Ignore.  The instanceof check doesn't work for arrow functions.
	  }

	  if (Error.isPrototypeOf(expected)) {
	    return false;
	  }

	  return expected.call({}, actual) === true;
	}

	function _tryBlock(block) {
	  var error;
	  try {
	    block();
	  } catch (e) {
	    error = e;
	  }
	  return error;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (typeof block !== 'function') {
	    throw new TypeError('"block" argument must be a function');
	  }

	  if (typeof expected === 'string') {
	    message = expected;
	    expected = null;
	  }

	  actual = _tryBlock(block);

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  var userProvidedMessage = typeof message === 'string';
	  var isUnwantedException = !shouldThrow && isError(actual);
	  var isUnexpectedException = !shouldThrow && actual && !expected;

	  if ((isUnwantedException &&
	      userProvidedMessage &&
	      expectedException(actual, expected)) ||
	      isUnexpectedException) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);
	assert.throws = throws;
	function throws(block, /*optional*/error, /*optional*/message) {
	  _throws(true, block, error, message);
	}

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = doesNotThrow;
	function doesNotThrow(block, /*optional*/error, /*optional*/message) {
	  _throws(false, block, error, message);
	}

	assert.ifError = ifError;
	function ifError(err) {
	  if (err) throw err;
	}

	var _polyfillNode_assert = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': assert,
		AssertionError: AssertionError,
		fail: fail,
		ok: ok,
		assert: ok,
		equal: equal,
		notEqual: notEqual,
		deepEqual: deepEqual,
		deepStrictEqual: deepStrictEqual,
		notDeepEqual: notDeepEqual,
		notDeepStrictEqual: notDeepStrictEqual,
		strictEqual: strictEqual,
		notStrictEqual: notStrictEqual,
		throws: throws,
		doesNotThrow: doesNotThrow,
		ifError: ifError
	});

	var require$$0$1 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_assert);

	var require$$3 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_buffer);

	(function (module, exports) {

		var assert = require$$0$1.ok;
		var zlib = require$$0$2;
		var util = require$$0$3;

		var kMaxLength = require$$3.kMaxLength;

		function Inflate(opts) {
		  if (!(this instanceof Inflate)) {
		    return new Inflate(opts);
		  }

		  if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
		    opts.chunkSize = zlib.Z_MIN_CHUNK;
		  }

		  zlib.Inflate.call(this, opts);

		  // Node 8 --> 9 compatibility check
		  this._offset = this._offset === undefined ? this._outOffset : this._offset;
		  this._buffer = this._buffer || this._outBuffer;

		  if (opts && opts.maxLength != null) {
		    this._maxLength = opts.maxLength;
		  }
		}

		function createInflate(opts) {
		  return new Inflate(opts);
		}

		function _close(engine, callback) {
		  if (callback) {
		    browser$1.nextTick(callback);
		  }

		  // Caller may invoke .close after a zlib error (which will null _handle).
		  if (!engine._handle) {
		    return;
		  }

		  engine._handle.close();
		  engine._handle = null;
		}

		Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
		  if (typeof asyncCb === 'function') {
		    return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
		  }

		  var self = this;

		  var availInBefore = chunk && chunk.length;
		  var availOutBefore = this._chunkSize - this._offset;
		  var leftToInflate = this._maxLength;
		  var inOff = 0;

		  var buffers = [];
		  var nread = 0;

		  var error;
		  this.on('error', function(err) {
		    error = err;
		  });

		  function handleChunk(availInAfter, availOutAfter) {
		    if (self._hadError) {
		      return;
		    }

		    var have = availOutBefore - availOutAfter;
		    assert(have >= 0, 'have should not go down');

		    if (have > 0) {
		      var out = self._buffer.slice(self._offset, self._offset + have);
		      self._offset += have;

		      if (out.length > leftToInflate) {
		        out = out.slice(0, leftToInflate);
		      }

		      buffers.push(out);
		      nread += out.length;
		      leftToInflate -= out.length;

		      if (leftToInflate === 0) {
		        return false;
		      }
		    }

		    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
		      availOutBefore = self._chunkSize;
		      self._offset = 0;
		      self._buffer = Buffer$1.allocUnsafe(self._chunkSize);
		    }

		    if (availOutAfter === 0) {
		      inOff += (availInBefore - availInAfter);
		      availInBefore = availInAfter;

		      return true;
		    }

		    return false;
		  }

		  assert(this._handle, 'zlib binding closed');
		  do {
		    var res = this._handle.writeSync(flushFlag,
		      chunk, // in
		      inOff, // in_off
		      availInBefore, // in_len
		      this._buffer, // out
		      this._offset, //out_off
		      availOutBefore); // out_len
		    // Node 8 --> 9 compatibility check
		    res = res || this._writeState;
		  } while (!this._hadError && handleChunk(res[0], res[1]));

		  if (this._hadError) {
		    throw error;
		  }

		  if (nread >= kMaxLength) {
		    _close(this);
		    throw new RangeError('Cannot create final Buffer. It would be larger than 0x' + kMaxLength.toString(16) + ' bytes');
		  }

		  var buf = Buffer$1.concat(buffers, nread);
		  _close(this);

		  return buf;
		};

		util.inherits(Inflate, zlib.Inflate);

		function zlibBufferSync(engine, buffer) {
		  if (typeof buffer === 'string') {
		    buffer = Buffer$1.from(buffer);
		  }
		  if (!(buffer instanceof Buffer$1)) {
		    throw new TypeError('Not a string or buffer');
		  }

		  var flushFlag = engine._finishFlushFlag;
		  if (flushFlag == null) {
		    flushFlag = zlib.Z_FINISH;
		  }

		  return engine._processChunk(buffer, flushFlag);
		}

		function inflateSync(buffer, opts) {
		  return zlibBufferSync(new Inflate(opts), buffer);
		}

		module.exports = exports = inflateSync;
		exports.Inflate = Inflate;
		exports.createInflate = createInflate;
		exports.inflateSync = inflateSync;
	} (syncInflate, syncInflate.exports));

	var syncReader = {exports: {}};

	var SyncReader$2 = syncReader.exports = function(buffer) {

	  this._buffer = buffer;
	  this._reads = [];
	};

	SyncReader$2.prototype.read = function(length, callback) {

	  this._reads.push({
	    length: Math.abs(length), // if length < 0 then at most this length
	    allowLess: length < 0,
	    func: callback
	  });
	};

	SyncReader$2.prototype.process = function() {

	  // as long as there is any data and read requests
	  while (this._reads.length > 0 && this._buffer.length) {

	    var read = this._reads[0];

	    if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {

	      // ok there is any data so that we can satisfy this request
	      this._reads.shift(); // == read

	      var buf = this._buffer;

	      this._buffer = buf.slice(read.length);

	      read.func.call(this, buf.slice(0, read.length));

	    }
	    else {
	      break;
	    }

	  }

	  if (this._reads.length > 0) {
	    return new Error('There are some read requests waitng on finished stream');
	  }

	  if (this._buffer.length > 0) {
	    return new Error('unrecognised content at end of stream');
	  }

	};

	var filterParseSync = {};

	var SyncReader$1 = syncReader.exports;
	var Filter = filterParse.exports;


	filterParseSync.process = function(inBuffer, bitmapInfo) {

	  var outBuffers = [];
	  var reader = new SyncReader$1(inBuffer);
	  var filter = new Filter(bitmapInfo, {
	    read: reader.read.bind(reader),
	    write: function(bufferPart) {
	      outBuffers.push(bufferPart);
	    },
	    complete: function() {
	    }
	  });

	  filter.start();
	  reader.process();

	  return Buffer$1.concat(outBuffers);
	};

	var hasSyncZlib$1 = true;
	var zlib$1 = require$$0$2;
	var inflateSync = syncInflate.exports;
	if (!zlib$1.deflateSync) {
	  hasSyncZlib$1 = false;
	}
	var SyncReader = syncReader.exports;
	var FilterSync = filterParseSync;
	var Parser$1 = parser.exports;
	var bitmapper = bitmapper$2;
	var formatNormaliser = formatNormaliser$2;


	var parserSync = function(buffer, options) {

	  if (!hasSyncZlib$1) {
	    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
	  }

	  var err;
	  function handleError(_err_) {
	    err = _err_;
	  }

	  var metaData;
	  function handleMetaData(_metaData_) {
	    metaData = _metaData_;
	  }

	  function handleTransColor(transColor) {
	    metaData.transColor = transColor;
	  }

	  function handlePalette(palette) {
	    metaData.palette = palette;
	  }

	  function handleSimpleTransparency() {
	    metaData.alpha = true;
	  }

	  var gamma;
	  function handleGamma(_gamma_) {
	    gamma = _gamma_;
	  }

	  var inflateDataList = [];
	  function handleInflateData(inflatedData) {
	    inflateDataList.push(inflatedData);
	  }

	  var reader = new SyncReader(buffer);

	  var parser = new Parser$1(options, {
	    read: reader.read.bind(reader),
	    error: handleError,
	    metadata: handleMetaData,
	    gamma: handleGamma,
	    palette: handlePalette,
	    transColor: handleTransColor,
	    inflateData: handleInflateData,
	    simpleTransparency: handleSimpleTransparency
	  });

	  parser.start();
	  reader.process();

	  if (err) {
	    throw err;
	  }

	  //join together the inflate datas
	  var inflateData = Buffer$1.concat(inflateDataList);
	  inflateDataList.length = 0;

	  var inflatedData;
	  if (metaData.interlace) {
	    inflatedData = zlib$1.inflateSync(inflateData);
	  }
	  else {
	    var rowSize = ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1;
	    var imageSize = rowSize * metaData.height;
	    inflatedData = inflateSync(inflateData, { chunkSize: imageSize, maxLength: imageSize });
	  }
	  inflateData = null;

	  if (!inflatedData || !inflatedData.length) {
	    throw new Error('bad png - invalid inflate data response');
	  }

	  var unfilteredData = FilterSync.process(inflatedData, metaData);
	  inflateData = null;

	  var bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
	  unfilteredData = null;

	  var normalisedBitmapData = formatNormaliser(bitmapData, metaData);

	  metaData.data = normalisedBitmapData;
	  metaData.gamma = gamma || 0;

	  return metaData;
	};

	var hasSyncZlib = true;
	var zlib = require$$0$2;
	if (!zlib.deflateSync) {
	  hasSyncZlib = false;
	}
	var constants = constants$5;
	var Packer$1 = packer.exports;

	var packerSync = function(metaData, opt) {

	  if (!hasSyncZlib) {
	    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
	  }

	  var options = opt || {};

	  var packer = new Packer$1(options);

	  var chunks = [];

	  // Signature
	  chunks.push(new Buffer$1(constants.PNG_SIGNATURE));

	  // Header
	  chunks.push(packer.packIHDR(metaData.width, metaData.height));

	  if (metaData.gamma) {
	    chunks.push(packer.packGAMA(metaData.gamma));
	  }

	  var filteredData = packer.filterData(metaData.data, metaData.width, metaData.height);

	  // compress it
	  var compressedData = zlib.deflateSync(filteredData, packer.getDeflateOptions());
	  filteredData = null;

	  if (!compressedData || !compressedData.length) {
	    throw new Error('bad png - invalid compressed data response');
	  }
	  chunks.push(packer.packIDAT(compressedData));

	  // End
	  chunks.push(packer.packIEND());

	  return Buffer$1.concat(chunks);
	};

	var parse = parserSync;
	var pack = packerSync;


	pngSync.read = function(buffer, options) {

	  return parse(buffer, options || {});
	};

	pngSync.write = function(png, options) {

	  return pack(png, options);
	};

	var PNG_1;

	var util = require$$0$3;
	var Stream = require$$1$1;
	var Parser = parserAsync.exports;
	var Packer = packerAsync.exports;
	var PNGSync = pngSync;


	var PNG = PNG_1 = function(options) {
	  Stream.call(this);

	  options = options || {}; // eslint-disable-line no-param-reassign

	  // coerce pixel dimensions to integers (also coerces undefined -> 0):
	  this.width = options.width | 0;
	  this.height = options.height | 0;

	  this.data = this.width > 0 && this.height > 0 ?
	    new Buffer$1(4 * this.width * this.height) : null;

	  if (options.fill && this.data) {
	    this.data.fill(0);
	  }

	  this.gamma = 0;
	  this.readable = this.writable = true;

	  this._parser = new Parser(options);

	  this._parser.on('error', this.emit.bind(this, 'error'));
	  this._parser.on('close', this._handleClose.bind(this));
	  this._parser.on('metadata', this._metadata.bind(this));
	  this._parser.on('gamma', this._gamma.bind(this));
	  this._parser.on('parsed', function(data) {
	    this.data = data;
	    this.emit('parsed', data);
	  }.bind(this));

	  this._packer = new Packer(options);
	  this._packer.on('data', this.emit.bind(this, 'data'));
	  this._packer.on('end', this.emit.bind(this, 'end'));
	  this._parser.on('close', this._handleClose.bind(this));
	  this._packer.on('error', this.emit.bind(this, 'error'));

	};
	util.inherits(PNG, Stream);

	PNG.sync = PNGSync;

	PNG.prototype.pack = function() {

	  if (!this.data || !this.data.length) {
	    this.emit('error', 'No data provided');
	    return this;
	  }

	  browser$1.nextTick(function() {
	    this._packer.pack(this.data, this.width, this.height, this.gamma);
	  }.bind(this));

	  return this;
	};


	PNG.prototype.parse = function(data, callback) {

	  if (callback) {
	    var onParsed, onError;

	    onParsed = function(parsedData) {
	      this.removeListener('error', onError);

	      this.data = parsedData;
	      callback(null, this);
	    }.bind(this);

	    onError = function(err) {
	      this.removeListener('parsed', onParsed);

	      callback(err, null);
	    }.bind(this);

	    this.once('parsed', onParsed);
	    this.once('error', onError);
	  }

	  this.end(data);
	  return this;
	};

	PNG.prototype.write = function(data) {
	  this._parser.write(data);
	  return true;
	};

	PNG.prototype.end = function(data) {
	  this._parser.end(data);
	};

	PNG.prototype._metadata = function(metadata) {
	  this.width = metadata.width;
	  this.height = metadata.height;

	  this.emit('metadata', metadata);
	};

	PNG.prototype._gamma = function(gamma) {
	  this.gamma = gamma;
	};

	PNG.prototype._handleClose = function() {
	  if (!this._parser.writable && !this._packer.readable) {
	    this.emit('close');
	  }
	};


	PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params
	  // coerce pixel dimensions to integers (also coerces undefined -> 0):
	  /* eslint-disable no-param-reassign */
	  srcX |= 0;
	  srcY |= 0;
	  width |= 0;
	  height |= 0;
	  deltaX |= 0;
	  deltaY |= 0;
	  /* eslint-enable no-param-reassign */

	  if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
	    throw new Error('bitblt reading outside image');
	  }

	  if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
	    throw new Error('bitblt writing outside image');
	  }

	  for (var y = 0; y < height; y++) {
	    src.data.copy(dst.data,
	      ((deltaY + y) * dst.width + deltaX) << 2,
	      ((srcY + y) * src.width + srcX) << 2,
	      ((srcY + y) * src.width + srcX + width) << 2
	    );
	  }
	};


	PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params

	  PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
	  return this;
	};

	PNG.adjustGamma = function(src) {
	  if (src.gamma) {
	    for (var y = 0; y < src.height; y++) {
	      for (var x = 0; x < src.width; x++) {
	        var idx = (src.width * y + x) << 2;

	        for (var i = 0; i < 3; i++) {
	          var sample = src.data[idx + i] / 255;
	          sample = Math.pow(sample, 1 / 2.2 / src.gamma);
	          src.data[idx + i] = Math.round(sample * 255);
	        }
	      }
	    }
	    src.gamma = 0;
	  }
	};

	PNG.prototype.adjustGamma = function() {
	  PNG.adjustGamma(this);
	};

	var heicDecode = {exports: {}};

	function commonjsRequire(path) {
		throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
	}

	var libheif$1 = {exports: {}};

	var _polyfillNode_fs = {};

	var _polyfillNode_fs$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': _polyfillNode_fs
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_fs$1);

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	}

	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};

	// path.resolve([from ...], to)
	// posix version
	function resolve() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;

	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : '/';

	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }

	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }

	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)

	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');

	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	}
	// path.normalize(path)
	// posix version
	function normalize(path) {
	  var isPathAbsolute = isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';

	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isPathAbsolute).join('/');

	  if (!path && !isPathAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }

	  return (isPathAbsolute ? '/' : '') + path;
	}
	// posix version
	function isAbsolute(path) {
	  return path.charAt(0) === '/';
	}

	// posix version
	function join() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	}


	// path.relative(from, to)
	// posix version
	function relative(from, to) {
	  from = resolve(from).substr(1);
	  to = resolve(to).substr(1);

	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }

	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }

	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }

	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));

	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }

	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }

	  outputParts = outputParts.concat(toParts.slice(samePartsLength));

	  return outputParts.join('/');
	}

	var sep = '/';
	var delimiter = ':';

	function dirname(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];

	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }

	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }

	  return root + dir;
	}

	function basename(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	}


	function extname(path) {
	  return splitPath(path)[3];
	}
	var _polyfillNode_path = {
	  extname: extname,
	  basename: basename,
	  dirname: dirname,
	  sep: sep,
	  delimiter: delimiter,
	  relative: relative,
	  join: join,
	  isAbsolute: isAbsolute,
	  normalize: normalize,
	  resolve: resolve
	};
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}

	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b' ?
	    function (str, start, len) { return str.substr(start, len) } :
	    function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;

	var _polyfillNode_path$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		resolve: resolve,
		normalize: normalize,
		isAbsolute: isAbsolute,
		join: join,
		relative: relative,
		sep: sep,
		delimiter: delimiter,
		dirname: dirname,
		basename: basename,
		extname: extname,
		'default': _polyfillNode_path
	});

	var require$$1 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_path$1);

	var _polyfillNode_crypto = {};

	var _polyfillNode_crypto$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': _polyfillNode_crypto
	});

	var require$$2 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_crypto$1);

	(function (module, exports) {
	((function(){var Module={print:(function(text){text=Array.prototype.slice.call(arguments).join(" ");console.log(text);}),printErr:(function(text){text=Array.prototype.slice.call(arguments).join(" ");console.error(text);}),canvas:{},noInitialRun:true};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key];}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true;}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true;}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true;}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true;}else {throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else {ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof browser$1==="object"&&typeof commonjsRequire==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;}if(ENVIRONMENT_IS_NODE){if(!Module["print"])Module["print"]=console.log;if(!Module["printErr"])Module["printErr"]=console.warn;var nodeFS;var nodePath;Module["read"]=function shell_read(filename,binary){var ret;ret=tryParseAsDataURI(filename);if(!ret){if(!nodeFS)nodeFS=require$$0;if(!nodePath)nodePath=require$$1;filename=nodePath["normalize"](filename);ret=nodeFS["readFileSync"](filename);}return binary?ret:ret.toString()};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret);}assert(ret.buffer);return ret};if(!Module["thisProgram"]){if(browser$1["argv"].length>1){Module["thisProgram"]=browser$1["argv"][1].replace(/\\/g,"/");}else {Module["thisProgram"]="unknown-program";}}Module["arguments"]=browser$1["argv"].slice(2);{module["exports"]=Module;}browser$1["on"]("uncaughtException",(function(ex){if(!(ex instanceof ExitStatus)){throw ex}}));browser$1["on"]("unhandledRejection",(function(reason,p){browser$1["exit"](1);}));Module["inspect"]=(function(){return "[Emscripten Module object]"});}else if(ENVIRONMENT_IS_SHELL){if(!Module["print"])Module["print"]=print;if(typeof printErr!="undefined")Module["printErr"]=printErr;if(typeof read!="undefined"){Module["read"]=function shell_read(f){var data=tryParseAsDataURI(f);if(data){return intArrayToString(data)}return read(f)};}else {Module["read"]=function shell_read(){throw "no read() available"};}Module["readBinary"]=function readBinary(f){var data;data=tryParseAsDataURI(f);if(data){return data}if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs;}else if(typeof arguments!="undefined"){Module["arguments"]=arguments;}if(typeof quit==="function"){Module["quit"]=(function(status,toThrow){quit(status);});}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function shell_read(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText}catch(err){var data=tryParseAsDataURI(url);if(data){return intArrayToString(data)}throw err}};if(ENVIRONMENT_IS_WORKER){Module["readBinary"]=function readBinary(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}catch(err){var data=tryParseAsDataURI(url);if(data){return data}throw err}};}Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}var data=tryParseAsDataURI(url);if(data){onload(data.buffer);return}onerror();};xhr.onerror=onerror;xhr.send(null);};if(typeof arguments!="undefined"){Module["arguments"]=arguments;}if(typeof console!=="undefined"){if(!Module["print"])Module["print"]=function shell_print(x){console.log(x);};if(!Module["printErr"])Module["printErr"]=function shell_printErr(x){console.warn(x);};}else {var TRY_USE_DUMP=false;if(!Module["print"])Module["print"]=TRY_USE_DUMP&&typeof dump!=="undefined"?(function(x){dump(x);}):(function(x){});}if(typeof Module["setWindowTitle"]==="undefined"){Module["setWindowTitle"]=(function(title){document.title=title;});}}else {throw new Error("Unknown runtime environment. Where are we?")}if(!Module["print"]){Module["print"]=(function(){});}if(!Module["printErr"]){Module["printErr"]=Module["print"];}if(!Module["arguments"]){Module["arguments"]=[];}if(!Module["thisProgram"]){Module["thisProgram"]="./this.program";}if(!Module["quit"]){Module["quit"]=(function(status,toThrow){throw toThrow});}Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key];}}moduleOverrides=undefined;var Runtime={setTempRet0:(function(value){tempRet0=value;return value}),getTempRet0:(function(){return tempRet0}),stackSave:(function(){return STACKTOP}),stackRestore:(function(stackTop){STACKTOP=stackTop;}),getNativeTypeSize:(function(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else {return 0}}}}),getNativeFieldSize:(function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE)}),STACK_ALIGN:16,prepVararg:(function(ptr,type){if(type==="double"||type==="i64"){if(ptr&7){assert((ptr&7)===4);ptr+=4;}}else {assert((ptr&3)===0);}return ptr}),getAlignSize:(function(type,size,vararg){if(!vararg&&(type=="i64"||type=="double"))return 8;if(!type)return Math.min(size,8);return Math.min(size||(type?Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE)}),dynCall:(function(sig,ptr,args){if(args&&args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args))}else {return Module["dynCall_"+sig].call(null,ptr)}}),functionPointers:[],addFunction:(function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2*(1+i)}}throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."}),removeFunction:(function(index){Runtime.functionPointers[(index-2)/2]=null;}),warnOnce:(function(text){if(!Runtime.warnOnce.shown)Runtime.warnOnce.shown={};if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text);}}),funcWrappers:{},getFuncWrapper:(function(func,sig){if(!func)return;assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={};}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){if(sig.length===1){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func)};}else if(sig.length===2){sigCache[func]=function dynCall_wrapper(arg){return Runtime.dynCall(sig,func,[arg])};}else {sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,Array.prototype.slice.call(arguments))};}}return sigCache[func]}),getCompilerSetting:(function(name){throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"}),stackAlloc:(function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size|0;STACKTOP=STACKTOP+15&-16;return ret}),staticAlloc:(function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size|0;STATICTOP=STATICTOP+15&-16;return ret}),dynamicAlloc:(function(size){var ret=HEAP32[DYNAMICTOP_PTR>>2];var end=(ret+size+15|0)&-16;HEAP32[DYNAMICTOP_PTR>>2]=end;if(end>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){HEAP32[DYNAMICTOP_PTR>>2]=ret;return 0}}return ret}),alignMemory:(function(size,quantum){var ret=size=Math.ceil(size/(quantum?quantum:16))*(quantum?quantum:16);return ret}),makeBigInt:(function(low,high,unsigned){var ret=unsigned?+(low>>>0)+ +(high>>>0)*+4294967296:+(low>>>0)+ +(high|0)*+4294967296;return ret}),GLOBAL_BASE:8,QUANTUM_SIZE:4,__dummy__:0};Module["Runtime"]=Runtime;var ABORT=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text);}}function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type);}}var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab;}else {zeroinit=false;size=slab.length;}var singleType=typeof types==="string"?types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr;}else {ret=[typeof _malloc==="function"?_malloc:Runtime.staticAlloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined?ALLOC_STATIC:allocator](Math.max(size,singleType?1:types.length));}if(zeroinit){var stop;ptr=ret;assert((ret&3)==0);stop=ret+(size&~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0;}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0;}return ret}if(singleType==="i8"){if(slab.subarray||slab.slice){HEAPU8.set(slab,ret);}else {HEAPU8.set(new Uint8Array(slab),ret);}return ret}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr);}type=singleType||types[i];if(type===0){i++;continue}if(type=="i64")type="i32";setValue(ret+i,curr,type);if(previousType!==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type;}i+=typeSize;}return ret}function getMemory(size){if(!staticSealed)return Runtime.staticAlloc(size);if(!runtimeInitialized)return Runtime.dynamicAlloc(size);return _malloc(size)}Module["getMemory"]=getMemory;function Pointer_stringify(ptr,length){if(length===0||!ptr)return "";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK;}return ret}return UTF8ToString(ptr)}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(u8Array,idx){var endPtr=idx;while(u8Array[endPtr])++endPtr;if(endPtr-idx>16&&u8Array.subarray&&UTF8Decoder){return UTF8Decoder.decode(u8Array.subarray(idx,endPtr))}else {var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3;}else {u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4;}else {u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5;}}}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}}}function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}else {if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63;}}outU8Array[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len;}else if(u<=2047){len+=2;}else if(u<=65535){len+=3;}else if(u<=2097151){len+=4;}else if(u<=67108863){len+=5;}else {len+=6;}}return len}typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function demangle(func){return func}function demangleAll(text){var regex=/__Z[\w\d_]+/g;return text.replace(regex,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e;}if(!err.stack){return "(no stack trace available)"}}return err.stack.toString()}function stackTrace(){var js=jsStackTrace();if(Module["extraStackTrace"])js+="\n"+Module["extraStackTrace"]();return demangleAll(js)}var WASM_PAGE_SIZE=65536;var ASMJS_PAGE_SIZE=16777216;var MIN_TOTAL_MEMORY=16777216;function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple;}return x}var HEAP,buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBuffer(buf){Module["buffer"]=buffer=buf;}function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer);}var STATIC_BASE,STATICTOP,staticSealed;var STACK_BASE,STACKTOP,STACK_MAX;var DYNAMIC_BASE,DYNAMICTOP_PTR;STATIC_BASE=STATICTOP=STACK_BASE=STACKTOP=STACK_MAX=DYNAMIC_BASE=DYNAMICTOP_PTR=0;staticSealed=false;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");}if(!Module["reallocBuffer"])Module["reallocBuffer"]=(function(size){var ret;try{if(ArrayBuffer.transfer){ret=ArrayBuffer.transfer(buffer,size);}else {var oldHEAP8=HEAP8;ret=new ArrayBuffer(size);var temp=new Int8Array(ret);temp.set(oldHEAP8);}}catch(e){return false}var success=_emscripten_replace_memory(ret);if(!success)return false;return ret});function enlargeMemory(){var PAGE_MULTIPLE=Module["usingWasm"]?WASM_PAGE_SIZE:ASMJS_PAGE_SIZE;var LIMIT=2147483648-PAGE_MULTIPLE;if(HEAP32[DYNAMICTOP_PTR>>2]>LIMIT){return false}var OLD_TOTAL_MEMORY=TOTAL_MEMORY;TOTAL_MEMORY=Math.max(TOTAL_MEMORY,MIN_TOTAL_MEMORY);while(TOTAL_MEMORY<HEAP32[DYNAMICTOP_PTR>>2]){if(TOTAL_MEMORY<=536870912){TOTAL_MEMORY=alignUp(2*TOTAL_MEMORY,PAGE_MULTIPLE);}else {TOTAL_MEMORY=Math.min(alignUp((3*TOTAL_MEMORY+2147483648)/4,PAGE_MULTIPLE),LIMIT);}}var replacement=Module["reallocBuffer"](TOTAL_MEMORY);if(!replacement||replacement.byteLength!=TOTAL_MEMORY){TOTAL_MEMORY=OLD_TOTAL_MEMORY;return false}updateGlobalBuffer(replacement);updateGlobalBufferViews();return true}var byteLength;try{byteLength=Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,"byteLength").get);byteLength(new ArrayBuffer(4));}catch(e){byteLength=(function(buffer){return buffer.byteLength});}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216;if(TOTAL_MEMORY<TOTAL_STACK)Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+TOTAL_MEMORY+"! (TOTAL_STACK="+TOTAL_STACK+")");if(Module["buffer"]){buffer=Module["buffer"];}else {{buffer=new ArrayBuffer(TOTAL_MEMORY);}}updateGlobalBufferViews();function getTotalMemory(){return TOTAL_MEMORY}HEAP32[0]=1668509029;HEAP16[1]=25459;if(HEAPU8[2]!==115||HEAPU8[3]!==99)throw "Runtime error: expected the system to be little-endian!";Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func);}else {Module["dynCall_vi"](func,callback.arg);}}else {func(callback.arg===undefined?null:callback.arg);}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}function preMain(){callRuntimeCallbacks(__ATMAIN__);}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer);}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i);}if(!dontAddNull)HEAP8[buffer>>0]=0;}if(!Math["imul"]||Math["imul"](4294967295,5)!==-5)Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a&65535;var bh=b>>>16;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16)|0};Math.imul=Math["imul"];if(!Math["clz32"])Math["clz32"]=(function(x){x=x>>>0;for(var i=0;i<32;i++){if(x&1<<31-i)return i}return 32});Math.clz32=Math["clz32"];if(!Math["trunc"])Math["trunc"]=(function(x){return x<0?Math.ceil(x):Math.floor(x)});Math.trunc=Math["trunc"];var Math_abs=Math.abs;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_min=Math.min;var runDependencies=0;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}Module["removeRunDependency"]=removeRunDependency;Module["preloadedImages"]={};Module["preloadedAudios"]={};var memoryInitializer=null;STATIC_BASE=Runtime.GLOBAL_BASE;STATICTOP=STATIC_BASE+81472;__ATINIT__.push({func:(function(){__GLOBAL__I_000101();})},{func:(function(){__GLOBAL__sub_I_box_cc();})},{func:(function(){__GLOBAL__sub_I_heif_cc();})},{func:(function(){__GLOBAL__sub_I_heif_plugin_registry_cc();})},{func:(function(){__GLOBAL__sub_I_bind_cpp();})},{func:(function(){__GLOBAL__sub_I_iostream_cpp();})});memoryInitializer="data:application/octet-stream;base64,AAAAAAAAAAAEAAAAAAAAAGAKAAAhAAAAIgAAAPz////8////YAoAACMAAAAkAAAAAAAAAAAAAAAARgAANEoAAChGAABKSgAAQAAAAAAAAAAARgAA3UsAAChGAABVSwAAIAoAAAAAAAAoRgAAl0sAAGAKAAAAAAAAKEYAADtMAABYAAAAAAAAAChGAACgTAAAgAAAAAAAAAAoRgAAxl0AAIAAAAAAAAAAQAAAAAAAAAAwCgAAFwAAABgAAADA////wP///zAKAAAZAAAAGgAAAEAAAAAAAAAAkAoAABsAAAAcAAAAOAAAAPj///+QCgAAHQAAAB4AAADA////wP///5AKAAAfAAAAIAAAAAAAAAA4AAAAAAAAAGAKAAAhAAAAIgAAAMj////I////YAoAACMAAAAkAAAAKEYAANtMAACQCgAAAAAAAChGAACUTQAAgA8AAAAAAAAoRgAA7k0AAIAAAAAAAAAAKEYAAP9NAACADwAAAAAAAChGAADVTwAAgAAAAAAAAAAoRgAAUk4AAKABAAAAAAAAAEYAAG1OAAAoRgAAhE4AAIAPAAAAAAAAKEYAAChPAACgAQAAAAAAAChGAABETwAAgA8AAAAAAAAoRgAA5k8AAIAPAAAAAAAAKEYAADVQAACAAAAAAAAAAChGAABFUAAAgA8AAAAAAAAoRgAAiFAAAIAAAAAAAAAAKEYAAJlQAACADwAAAAAAAChGAADdUAAAgAAAAAAAAAAoRgAA7lAAAIAPAAAAAAAAKEYAAF1RAACAAAAAAAAAAChGAABuUQAAgA8AAAAAAAAoRgAAyVEAAIAAAAAAAAAAKEYAANpRAACADwAAAAAAAChGAADZUgAAgAAAAAAAAAAoRgAA6lIAAIAPAAAAAAAAKEYAAOlUAACAAAAAAAAAAChGAAD6VAAAgA8AAAAAAAAoRgAAa1UAAIAAAAAAAAAAKEYAAHxVAACADwAAAAAAAChGAAB3VgAAgAAAAAAAAAAoRgAAiFYAAIAPAAAAAAAAKEYAAPVWAACAAAAAAAAAAChGAAAGVwAAgA8AAAAAAAAoRgAAZVcAAIAAAAAAAAAAKEYAAHZXAACADwAAAAAAAChGAADUVwAAgAAAAAAAAAAoRgAA5VcAAIAPAAAAAAAAKEYAAEZYAACAAAAAAAAAAChGAABXWAAAgA8AAAAAAAAoRgAA1VgAAIAAAAAAAAAAKEYAAOZYAACADwAAAAAAAChGAAAqWQAAgAAAAAAAAAAoRgAAO1kAAIAPAAAAAAAAKEYAAH9ZAACAAAAAAAAAAChGAACQWQAAgA8AAAAAAAAoRgAAWFoAAIAAAAAAAAAAKEYAAGlaAACADwAAAAAAAChGAACtWgAAgAAAAAAAAAAoRgAAvloAAIAPAAAAAAAAKEYAAORbAACAAAAAAAAAAChGAAD1WwAAgA8AAAAAAAAoRgAATVwAAIAAAAAAAAAAKEYAAF5cAACADwAAAAAAAChGAADGXAAAgAAAAAAAAAAoRgAA11wAAIAPAAAAAAAAKEYAABtdAACADwAAAAAAAChGAABfXQAAgA8AAAAAAAAoRgAA+WUAAIAPAAAAAAAAKEYAAK5nAACADwAAAAAAALBGAAAndwAAsEYAABJ3AACwRgAA+HYAALBGAADqdgAAsEYAANh2AACwRgAAyXYAAABGAAC6dgAAlEYAAKp2AAAAAAAA+AQAAJRGAACZdgAAAQAAAPgEAAAARgAAhXYAAJRGAABwdgAAAAAAACAFAACURgAAWnYAAAEAAAAgBQAAAEYAAE12AACURgAAP3YAAAAAAABIBQAAlEYAADB2AAABAAAASAUAAABGAAAjdgAAAEYAADl3AADMRgAAHXgAAAAAAAABAAAAmAUAAAAAAAAARgAAXHgAAChGAACCeAAAgA8AAAAAAAAoRgAApnkAAIAPAAAAAAAAAEYAANN9AADMRgAAhH0AAAAAAAACAAAAwAUAAAIAAAD4BQAAAggAAChGAAA6fQAAgA8AAAAAAAAARgAAsn0AAChGAADnfQAAgA8AAAAAAAAoRgAAaYEAAIAPAAAAAAAAKEYAAA6CAAAwBgAAAAAAAABGAAAjggAAKEYAAEWCAAAwBgAAAAAAAChGAABcggAAMAYAAAAAAAAoRgAAc4IAADAGAAAAAAAAKEYAAI+CAAAwBgAAAAAAAChGAACnggAAMAYAAAAAAAAoRgAAw4IAADAGAAAAAAAAKEYAAOGCAAAwBgAAAAAAAChGAAD3ggAAMAYAAAAAAAAoRgAADYMAADAGAAAAAAAAKEYAAHiDAAAwBgAAAAAAAChGAACWgwAAMAYAAAAAAAAoRgAArIMAADAGAAAAAAAAKEYAAL+DAAAwBgAAAAAAAChGAADSgwAAMAYAAAAAAAAoRgAA8IMAADAGAAAAAAAAKEYAAAqEAACADwAAAAAAAChGAABbhAAAgA8AAAAAAAAoRgAAoYQAAIAPAAAAAAAAKEYAAOeEAACADwAAAAAAAChGAAAwhQAAMAYAAAAAAAAoRgAARYUAAIAPAAAAAAAAKEYAAI2FAAAwBgAAAAAAAChGAACihQAAgA8AAAAAAAAoRgAA6oUAAIAPAAAAAAAAKEYAADuGAACADwAAAAAAAChGAACFhgAAgA8AAAAAAAAoRgAA1IYAAIAPAAAAAAAAKEYAACWHAACADwAAAAAAAChGAABuhwAAgA8AAAAAAAAoRgAAt4cAAIAPAAAAAAAAKEYAAAKIAACADwAAAAAAAChGAABRiAAAgA8AAAAAAAAoRgAAnogAAIAPAAAAAAAAKEYAAOiIAACADwAAAAAAAChGAAAyiQAAMAYAAAAAAAAoRgAAR4kAAIAPAAAAAAAAKEYAAI+JAAAwBgAAAAAAAChGAACkiQAAgA8AAAAAAAAoRgAA7IkAAIAPAAAAAAAAKEYAADKLAAC4CAAAAAAAAMxGAABEiwAAAAAAAAEAAADQCAAAAgQAAABGAABTiwAAKEYAAJqLAACADwAAAAAAAChGAADjiwAAgA8AAAAAAAAoRgAAKowAAIAPAAAAAAAAKEYAAG+dAAAYCQAAAAAAAABGAACBnQAAKEYAAE+fAAAYCQAAAAAAAChGAAB2nwAAGAkAAAAAAAAoRgAAQcIAABgJAAAAAAAAKEYAACfEAABgCQAAAAAAAABGAABIxAAAzEYAAAvKAAAAAAAAAQAAAJgFAAAAAAAAzEYAAMzJAAAAAAAAAQAAAJgFAAAAAAAAAEYAAK3JAAAARgAAjskAAABGAABvyQAAAEYAAFDJAAAARgAAMckAAABGAAASyQAAAEYAAPPIAAAARgAA1MgAAABGAAC1yAAAAEYAAJbIAAAARgAAd8gAAABGAABYyAAAKEYAAFjVAAAICgAAAAAAAABGAABG1QAAKEYAAILVAAAICgAAAAAAAABGAACs1QAAAEYAAN3VAADMRgAADtYAAAAAAAABAAAA+AkAAAP0///MRgAAPdYAAAAAAAABAAAAEAoAAAP0///MRgAAbNYAAAAAAAABAAAA+AkAAAP0///MRgAAm9YAAAAAAAABAAAAEAoAAAP0///MRgAAytYAAAMAAAACAAAAMAoAAAIAAABgCgAAAggAAAwAAAAAAAAAMAoAABcAAAAYAAAA9P////T///8wCgAAGQAAABoAAAAoRgAA+tYAACgKAAAAAAAAKEYAABPXAAAgCgAAAAAAAChGAABS1wAAKAoAAAAAAAAoRgAAatcAACAKAAAAAAAAKEYAAILXAAAoCwAAAAAAAChGAACW1wAAeA8AAAAAAAAoRgAArNcAACgLAAAAAAAAzEYAAObXAAAAAAAAAgAAACgLAAACAAAAaAsAAAAAAADMRgAAKtgAAAAAAAABAAAAgAsAAAAAAAAARgAAQNgAAMxGAABZ2AAAAAAAAAIAAAAoCwAAAgAAAKgLAAAAAAAAzEYAAJ3YAAAAAAAAAQAAAIALAAAAAAAAzEYAAMbYAAAAAAAAAgAAACgLAAACAAAA4AsAAAAAAADMRgAACtkAAAAAAAABAAAA+AsAAAAAAAAARgAAINkAAMxGAAA52QAAAAAAAAIAAAAoCwAAAgAAACAMAAAAAAAAzEYAAH3ZAAAAAAAAAQAAAPgLAAAAAAAAzEYAANPaAAAAAAAAAwAAACgLAAACAAAAYAwAAAIAAABoDAAAAAgAAABGAAA62wAAAEYAABjbAADMRgAATdsAAAAAAAADAAAAKAsAAAIAAABgDAAAAgAAAJgMAAAACAAAAEYAAJLbAADMRgAAtNsAAAAAAAACAAAAKAsAAAIAAADADAAAAAgAAABGAAD52wAAzEYAAA7cAAAAAAAAAgAAACgLAAACAAAAwAwAAAAIAADMRgAAU9wAAAAAAAACAAAAKAsAAAIAAAAIDQAAAgAAAABGAABv3AAAzEYAAITcAAAAAAAAAgAAACgLAAACAAAACA0AAAIAAADMRgAAoNwAAAAAAAACAAAAKAsAAAIAAAAIDQAAAgAAAMxGAAC83AAAAAAAAAIAAAAoCwAAAgAAAAgNAAACAAAAzEYAAOfcAAAAAAAAAgAAACgLAAACAAAAkA0AAAAAAAAARgAALd0AAMxGAABR3QAAAAAAAAIAAAAoCwAAAgAAALgNAAAAAAAAAEYAAJfdAADMRgAAtt0AAAAAAAACAAAAKAsAAAIAAADgDQAAAAAAAABGAAD83QAAzEYAABXeAAAAAAAAAgAAACgLAAACAAAACA4AAAAAAAAARgAAW94AAMxGAAB03gAAAAAAAAIAAAAoCwAAAgAAADAOAAACAAAAAEYAAIneAADMRgAAIN8AAAAAAAACAAAAKAsAAAIAAAAwDgAAAgAAAChGAACh3gAAaA4AAAAAAADMRgAAxN4AAAAAAAACAAAAKAsAAAIAAACIDgAAAgAAAABGAADn3gAAKEYAAP7eAABoDgAAAAAAAMxGAAA13wAAAAAAAAIAAAAoCwAAAgAAAIgOAAACAAAAzEYAAFffAAAAAAAAAgAAACgLAAACAAAAiA4AAAIAAADMRgAAed8AAAAAAAACAAAAKAsAAAIAAACIDgAAAgAAAChGAACc3wAAKAsAAAAAAADMRgAAst8AAAAAAAACAAAAKAsAAAIAAAAwDwAAAgAAAABGAADE3wAAzEYAANnfAAAAAAAAAgAAACgLAAACAAAAMA8AAAIAAAAoRgAA9t8AACgLAAAAAAAAKEYAAAvgAAAoCwAAAAAAAABGAAAg4AAAzEYAADngAAAAAAAAAQAAAHgPAAAAAAAAKEYAAGTgAACoDwAAAAAAAABGAACt4QAAKEYAAA3iAADADwAAAAAAAChGAAC64QAA0A8AAAAAAAAARgAA2+EAAChGAADo4QAAsA8AAAAAAAAoRgAA7+IAAKgPAAAAAAAAKEYAAP/iAADoDwAAAAAAAChGAAA04wAAwA8AAAAAAAAoRgAAEOMAAAgQAAAAAAAAKEYAAFbjAADADwAAAAAAAHhGAAB+4wAAeEYAAIDjAAB4RgAAg+MAAHhGAACF4wAAeEYAAIfjAAB4RgAAieMAAHhGAACL4wAAeEYAAI3jAAB4RgAAj+MAAHhGAACR4wAAeEYAAMTYAAB4RgAAk+MAAHhGAACV4wAAeEYAAJfjAAAoRgAAmeMAAMAPAAAAAAAAKEYAALrjAACwDwAAAAAAAAAAAABIAAAAAQAAAAIAAAABAAAAAQAAAAIAAAADAAAAAAAAAFgAAAADAAAABAAAAAEAAAAYEQAAJAEAADgBAAAsEQAAOAAAAAAAAABwAAAABQAAAAYAAADI////yP///3AAAAAHAAAACAAAAAAAAABgAAAACQAAAAoAAAABAAAABAAAAAEAAAABAAAAAgAAAAMAAAAFAAAABAAAAAUAAAABAAAABgAAAAIAAAAAAAAAgAAAAAsAAAAMAAAAAgAAAAMAAAANAAAABAAAAAAAAACQAAAADgAAAA8AAAAFAAAABgAAAA0AAAAHAAAAAAAAAKAAAAALAAAAEAAAAAgAAAADAAAADQAAAAkAAABAAAAAAAAAAEABAAARAAAAEgAAADgAAAD4////QAEAABMAAAAUAAAAwP///8D///9AAQAAFQAAABYAAADgEQAA5AAAALwAAADQAAAAJAEAADgBAAAMAQAA+AAAAAgSAAD0EQAAAAAAAJgEAAAlAAAAJgAAACcAAAADAAAAKAAAAAAAAACIBAAAKQAAACoAAAArAAAAAwAAACwAAAAAAAAAeAQAAC0AAAAuAAAALwAAAAMAAAAwAAAAAAAAAGgEAAAxAAAAMgAAAAoAAAALAAAADQAAAAwAAAAAAAAAWAQAADMAAAA0AAAANQAAAAMAAAA2AAAAAAAAAEgEAAALAAAANwAAAA0AAAAOAAAAOAAAAA8AAAAAAAAAOAQAADkAAAA6AAAAOwAAAAMAAAA8AAAAAAAAACgEAAA9AAAAPgAAABAAAAARAAAAPwAAABIAAAAAAAAAGAQAAEAAAABBAAAAQgAAAAMAAABDAAAAAAAAAAgEAAALAAAARAAAABMAAAAUAAAARQAAABUAAAAAAAAA+AMAAEYAAABHAAAASAAAAAMAAABJAAAAAAAAAOgDAABKAAAASwAAABYAAAAXAAAATAAAABgAAAAAAAAA2AMAAE0AAABOAAAATwAAAAMAAABQAAAAAAAAAMgDAAALAAAAUQAAABkAAAADAAAADQAAABoAAAAAAAAAuAMAAFIAAABTAAAAVAAAAAMAAABVAAAAAAAAAKgDAAALAAAAVgAAABsAAAADAAAADQAAABwAAAAAAAAAmAMAAFcAAABYAAAAWQAAAAMAAABaAAAAAAAAAIgDAABbAAAAXAAAAB0AAAAeAAAAXQAAAB8AAAAAAAAAeAMAAF4AAABfAAAAYAAAAAMAAABhAAAAAAAAAGgDAAALAAAAYgAAACAAAAAhAAAADQAAACIAAAAAAAAAWAMAAGMAAABkAAAAZQAAAAMAAABmAAAAAAAAAEgDAABnAAAAaAAAACMAAAAkAAAADQAAACUAAAAAAAAAOAMAAGkAAABqAAAAawAAAAMAAABsAAAAAAAAACgDAAALAAAAbQAAACYAAAADAAAADQAAACcAAAAAAAAAGAMAAG4AAABvAAAAcAAAAAMAAABxAAAAAAAAAAgDAAALAAAAcgAAACgAAAADAAAADQAAACkAAAAAAAAA+AIAAHMAAAB0AAAAdQAAAAMAAAB2AAAAAAAAAOgCAAALAAAAdwAAACoAAAArAAAADQAAACwAAAAAAAAA2AIAAHgAAAB5AAAAegAAAAMAAAB7AAAAAAAAAMgCAAB8AAAAfQAAAC0AAAAuAAAAfgAAAC8AAAAAAAAAuAIAAH8AAACAAAAAgQAAAAMAAACCAAAAAAAAAKgCAACDAAAAhAAAADAAAAAxAAAADQAAADIAAAAAAAAAmAIAAIUAAACGAAAAhwAAAAMAAACIAAAAAAAAAIgCAACJAAAAigAAADMAAAA0AAAADQAAADUAAAAAAAAAeAIAAIsAAACMAAAAjQAAAAMAAACOAAAAAAAAAGgCAACPAAAAkAAAADYAAAA3AAAADQAAADgAAAAAAAAAWAIAAJEAAACSAAAAkwAAAAMAAACUAAAAAAAAAEgCAACVAAAAlgAAADkAAAADAAAADQAAADoAAAAAAAAAOAIAAJcAAACYAAAAmQAAAAMAAACaAAAAAAAAACgCAAALAAAAmwAAADsAAAADAAAADQAAADwAAAAAAAAAGAIAAJwAAACdAAAAngAAAAMAAACfAAAAAAAAAAgCAAALAAAAoAAAAD0AAAADAAAADQAAAD4AAAAAAAAA+AEAAKEAAACiAAAAowAAAAMAAACkAAAAAAAAAOgBAAClAAAApgAAAD8AAAADAAAADQAAAEAAAAAAAAAA2AEAAKcAAACoAAAAqQAAAAMAAACqAAAAAAAAAIABAACrAAAArAAAAEEAAABCAAAADQAAAEMAAAAAAAAAcAEAAK0AAACuAAAArwAAAAMAAACwAAAAAAAAAGABAACxAAAAsgAAAEQAAABFAAAADQAAAEYAAAAAAAAAUAEAALMAAAC0AAAAtQAAAAMAAAC2AAAAAAAAAMgBAAC3AAAAuAAAALkAAAADAAAAugAAAAAAAAC4AQAAuwAAALwAAAAGAAAARwAAAEgAAAAAAAAAqAEAAL0AAAC+AAAAvwAAAAMAAADAAAAAAAAAAJABAADBAAAAwgAAAAcAAABJAAAASgAAALtfAAAAAAAAqAQAAMMAAADEAAAAxQAAAAMAAADGAAAAAAAAALgEAADHAAAAyAAAAMkAAAADAAAAygAAAAMAAAAEAAAABQAAAAYAAAABAAAAAgAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAABYAAAABAAAAAgAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAAAAAAAABAAAAAgAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAAgAUAAIAQAAAABQAAOBAAAAAFAABwBQAAAAUAAIAFAAB4EAAAAAUAAHgFAAAABQAAeAUAAAAFAACAEAAAeAUAACgFAADoBAAA4AQAADgQAAA4BQAAAAAAAKAFAADLAAAAzAAAAM0AAAADAAAAzgAAAAAAAAAAAAAA0XgAAAAAAACwBQAAzwAAANAAAADRAAAAAwAAANIAAAAAAAAAAAYAANMAAADUAAAA1QAAAAMAAADWAAAAAAAAAOgFAADXAAAA2AAAANkAAAADAAAA2gAAAAAAAAAQBgAA2wAAANwAAADdAAAAAwAAAN4AAAAAAAAAyAUAAN8AAADgAAAAAAAAACAGAADhAAAA4gAAAAEAAAACAAAAAAAAADgGAADhAAAA4wAAAAMAAAAEAAAAAAAAAEgGAADhAAAA5AAAAAUAAAAGAAAAAAAAAFgGAADhAAAA5QAAAAcAAAAIAAAAAAAAAGgGAADhAAAA5gAAAAkAAAAKAAAAAAAAAHgGAADhAAAA5wAAAAsAAAAMAAAAAAAAAIgGAADhAAAA6AAAAA0AAAAOAAAAAAAAAJgGAADhAAAA6QAAAA8AAAAQAAAAAAAAAKgGAADhAAAA6gAAABEAAAASAAAAAAAAALgGAADhAAAA6wAAABMAAAAUAAAAAAAAAMgGAADhAAAA7AAAABUAAAAWAAAAAAAAANgGAADhAAAA7QAAABcAAAAYAAAAAAAAAOgGAADhAAAA7gAAABkAAAAaAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAAAAAD4BgAA4QAAAO8AAAAbAAAAHAAAAAAAAAABAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAAAAAACAcAAOEAAADwAAAAHQAAAB4AAAAAAAAAGAcAAOEAAADxAAAAHwAAACAAAAAAAAAAmAgAAPIAAADzAAAA9AAAAAMAAAD1AAAAAAAAAIgIAAD2AAAA9wAAAPgAAAADAAAA+QAAAAAAAAB4CAAA4QAAAPoAAAAhAAAAIgAAAAAAAABoCAAA+wAAAPwAAAD9AAAAAwAAAP4AAAAAAAAAWAgAAOEAAAD/AAAAIwAAACQAAAAAAAAASAgAAAABAAABAQAAAgEAAAMAAAADAQAAAAAAADgIAAAEAQAABQEAAAYBAAADAAAABwEAAAAAAAAoCAAACAEAAAkBAAAKAQAAAwAAAAsBAAAAAAAAGAgAAAwBAAANAQAADgEAAAMAAAAPAQAAAAAAAAgIAAAQAQAAEQEAABIBAAADAAAAEwEAAAAAAAD4BwAAFAEAABUBAAAWAQAAAwAAABcBAAAAAAAA6AcAABgBAAAZAQAAGgEAAAMAAAAbAQAAAAAAANgHAAAcAQAAHQEAAB4BAAADAAAAHwEAAAAAAADIBwAAIAEAACEBAAAiAQAAAwAAACMBAAAAAAAAuAcAACQBAAAlAQAAJgEAAAMAAAAnAQAAAAAAAKgHAAAoAQAAKQEAACoBAAADAAAAKwEAAAAAAACYBwAALAEAAC0BAAAuAQAAAwAAAC8BAAAAAAAAiAcAAOEAAAAwAQAAJQAAACYAAAAAAAAAeAcAADEBAAAyAQAAMwEAAAMAAAA0AQAAAAAAAGgHAADhAAAANQEAACcAAAAoAAAAAAAAAFgHAAA2AQAANwEAADgBAAADAAAAOQEAAAAAAABIBwAAOgEAADsBAAA8AQAAAwAAAD0BAAAAAAAAOAcAAD4BAAA/AQAAQAEAAAMAAABBAQAAAAAAACgHAABCAQAAQwEAAEQBAAADAAAARQEAAAIAAAABAAAAAQAAAAIAAAAIAAAAAgAAAEYBAAACAAAASwAAAAMAAAAAAAAAAAAAALCKAAAEAAAAuwsAAG2KAAAAAAAAAQAAAAIAAAAGAAAAAAAAAEaKAAAHAAAAgQAAAD4+AQAHAAAAZAAAAD4+AQAAAAAAqAgAAEcBAABIAQAABAAAAAUAAAAAAAAAuAgAAEkBAABKAQAAAwAAAAMAAAAAAAAA2AgAAEsBAABMAQAATQEAAAMAAABOAQAAAAAAAOgIAABPAQAAUAEAAFEBAAADAAAAUgEAAAAAAAD4CAAAUwEAAFQBAABVAQAAAwAAAFYBAAABAAAATAAAAAAAAAAICQAAVwEAAFgBAABZAQAABAAAAEz2AACeCwEApgsBAMYLAQBGDAEARg4BAAAAAABM9gAA9gABAP4AAQAeAQEAngEBAJ4DAQAAAAAATPYAAE72AABW9gAAdvYAAPb2AAD2+AAAAAAAAAAAAAAAAAAARhYBAGYWAQDmFgEA5hgBAAAAAAAAAAAA5iABAAYhAQCGIQEAhiMBAAAAAAAAAAAAhisBAKYrAQAmLAEAJi4BAAAAAAAgCQAAVwEAAFoBAABbAQAABQAAAAAAAAAaAAAACgAAAAEAAAAAAAAAMAkAAFcBAABcAQAAXQEAAAYAAAABAAAAAgAAAAIAAAABAAAAAQAAAAIAAAABAAAAAQAAAB0AAAAeAAAAHwAAACAAAAAhAAAAIQAAACIAAAAiAAAAIwAAACMAAAAkAAAAJAAAACUAAAAoAAAALQAAADMAAAA5AAAAQAAAAEgAAADFAAAAuQAAAMkAAADFAAAAuQAAAMkAAABuAAAAmgAAAHoAAACJAAAAiwAAAI0AAACdAAAAawAAAIsAAAB+AAAAawAAAIsAAAB+AAAAPwAAAJgAAACYAAAAbwAAAI0AAACZAAAAbwAAAFsAAACrAAAAhgAAAI0AAAB5AAAAjAAAAD0AAACaAAAAeQAAAIwAAAA9AAAAmgAAAG8AAABvAAAAfQAAAG4AAABuAAAAXgAAAHwAAABsAAAAfAAAAGsAAAB9AAAAjQAAALMAAACZAAAAfQAAAGsAAAB9AAAAjQAAALMAAACZAAAAfQAAAGsAAAB9AAAAjQAAALMAAACZAAAAfQAAAIwAAACLAAAAtgAAALYAAACYAAAAiAAAAJgAAACIAAAAmQAAAIgAAACLAAAAbwAAAIgAAACLAAAAbwAAAJsAAACaAAAAiwAAAJkAAACLAAAAewAAAHsAAAA/AAAAmQAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKoAAACZAAAAewAAAHsAAABrAAAAeQAAAGsAAAB5AAAApwAAAJcAAAC3AAAAjAAAAJcAAAC3AAAAjAAAAKoAAACaAAAAiwAAAJkAAACLAAAAewAAAHsAAAA/AAAAfAAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKYAAAC3AAAAjAAAAIgAAACZAAAAmgAAAKoAAACZAAAAigAAAIoAAAB6AAAAeQAAAHoAAAB5AAAApwAAAJcAAAC3AAAAjAAAAJcAAAC3AAAAjAAAAI0AAABvAAAAjAAAAIwAAACMAAAAjAAAAIoAAACZAAAAiAAAAKcAAACYAAAAmAAAAGsAAACnAAAAWwAAAHoAAABrAAAApwAAAGsAAACnAAAAWwAAAGsAAABrAAAApwAAAJkAAACZAAAAmQAAAMgAAAC5AAAAoAAAAJoAAACaAAAAmgAAAIwAAABcAAAAiQAAAIoAAACMAAAAmAAAAIoAAACLAAAAmQAAAEoAAACVAAAAXAAAAIsAAABrAAAAegAAAJgAAACMAAAAswAAAKYAAAC2AAAAjAAAAOMAAAB6AAAAxQAAAJoAAADEAAAAxAAAAKcAAACaAAAAmAAAAKcAAAC2AAAAtgAAAIYAAACVAAAAiAAAAJkAAAB5AAAAiAAAAIkAAACpAAAAwgAAAKYAAACnAAAAmgAAAKcAAACJAAAAtgAAAJoAAADEAAAApwAAAKcAAACaAAAAmAAAAKcAAAC2AAAAtgAAAIYAAACVAAAAiAAAAJkAAAB5AAAAiAAAAHoAAACpAAAA0AAAAKYAAACnAAAAmgAAAJgAAACnAAAAtgAAAG4AAABuAAAAfAAAAH0AAACMAAAAmQAAAH0AAAB/AAAAjAAAAG0AAABvAAAAjwAAAH8AAABvAAAATwAAAGwAAAB7AAAAPwAAAH0AAABuAAAAXgAAAG4AAABfAAAATwAAAH0AAABvAAAAbgAAAE4AAABuAAAAbwAAAG8AAABfAAAAXgAAAGwAAAB7AAAAbAAAAH0AAABuAAAAfAAAAG4AAABfAAAAXgAAAH0AAABvAAAAbwAAAE8AAAB9AAAAfgAAAG8AAABvAAAATwAAAGwAAAB7AAAAXQAAAJkAAACKAAAAigAAAHwAAACKAAAAXgAAAOAAAACnAAAAegAAAF4AAACKAAAAtgAAAJoAAACVAAAAawAAAKcAAACaAAAAlQAAAFwAAACnAAAAmgAAALgAAACaAAAAtwAAALgAAACaAAAAiwAAAJoAAACaAAAAmgAAAIsAAACaAAAAmgAAAIwAAADGAAAAqQAAAMYAAACVAAAAhgAAAAAAAABACQAAVwEAAF4BAABfAQAABwAAAAAAAAAAAAAAIAAAABoAAAAVAAAAEQAAAA0AAAAJAAAABQAAAAIAAAAAAAAA/v////v////3////8////+/////r////5v///+D////m////6////+/////z////9/////v////+////AAAAAAIAAAAFAAAACQAAAA0AAAARAAAAFQAAABoAAAAgAAAAAPD//5r5//9y/P//iv3//x7+//96/v//xf7//wD////F/v//ev7//x7+//+K/f//cvz//5r5//8A8P//AAAAAAMAAAADAAAAAgAAAAAAAAADAAAABAAAAAQAAAAAAAAAAQAAAAAAAAACAAAAAQAAAAIAAAAAAAAAAwAAAAEAAAADAAAAAgAAAAMAAAABAAAAAAAAAAIAAAAAAAAAAgAAAAEAAAADAAAAAAAAAAMAAAABAAAAAwAAAAIAAAAAAAAAUAkAAAcAAAAIAAAAAgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzT4CgAAAUAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkAAAAKAAAALjYBAAAEAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAr/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4CgAAFgqAAAFAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAACgAAADY6AQAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAD//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2CoAAAkAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAKAAAAPjoBAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwKwAAFAAAAEMuVVRGLTgAAAAAAAAAAAAAAAAA3hIElQAAAAD///////////////9UKwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BV9wiQD/CS8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAALAAAAC0AAAAuAAAALwAAADAAAAAxAAAAMgAAADMAAAA0AAAANQAAADYAAAA3AAAAOAAAADkAAAA6AAAAOwAAADwAAAA9AAAAPgAAAD8AAABAAAAAYQAAAGIAAABjAAAAZAAAAGUAAABmAAAAZwAAAGgAAABpAAAAagAAAGsAAABsAAAAbQAAAG4AAABvAAAAcAAAAHEAAAByAAAAcwAAAHQAAAB1AAAAdgAAAHcAAAB4AAAAeQAAAHoAAABbAAAAXAAAAF0AAABeAAAAXwAAAGAAAABhAAAAYgAAAGMAAABkAAAAZQAAAGYAAABnAAAAaAAAAGkAAABqAAAAawAAAGwAAABtAAAAbgAAAG8AAABwAAAAcQAAAHIAAABzAAAAdAAAAHUAAAB2AAAAdwAAAHgAAAB5AAAAegAAAHsAAAB8AAAAfQAAAH4AAAB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SAAATDQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAAAAFQAAABYAAAAXAAAAGAAAABkAAAAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKgAAACsAAAAsAAAALQAAAC4AAAAvAAAAMAAAADEAAAAyAAAAMwAAADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAAA7AAAAPAAAAD0AAAA+AAAAPwAAAEAAAABBAAAAQgAAAEMAAABEAAAARQAAAEYAAABHAAAASAAAAEkAAABKAAAASwAAAEwAAABNAAAATgAAAE8AAABQAAAAUQAAAFIAAABTAAAAVAAAAFUAAABWAAAAVwAAAFgAAABZAAAAWgAAAFsAAABcAAAAXQAAAF4AAABfAAAAYAAAAEEAAABCAAAAQwAAAEQAAABFAAAARgAAAEcAAABIAAAASQAAAEoAAABLAAAATAAAAE0AAABOAAAATwAAAFAAAABRAAAAUgAAAFMAAABUAAAAVQAAAFYAAABXAAAAWAAAAFkAAABaAAAAewAAAHwAAAB9AAAAfgAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICgAAYAEAAGEBAAAAAAAAIAoAAGIBAABjAQAAAQAAAAQAAAACAAAAAwAAAAIAAAADAAAABQAAAAoAAAAFAAAABgAAAAYAAAAHAAAAAAAAACgKAABkAQAAZQEAAAgAAAAOAAAAAwAAAAQAAAALAAAADAAAAA8AAAANAAAADgAAAAgAAAAQAAAACQAAAAgAAAAAAAAAMAoAABcAAAAYAAAA+P////j///8wCgAAGQAAABoAAADoOAAA/DgAAAgAAAAAAAAASAoAAGYBAABnAQAA+P////j///9ICgAAaAEAAGkBAAAYOQAALDkAABwAAAAwAAAABAAAAAAAAAB4CgAAagEAAGsBAAD8/////P///3gKAABsAQAAbQEAAFA5AABkOQAADAAAAAAAAACQCgAAGwAAABwAAAAEAAAA+P///5AKAAAdAAAAHgAAAPT////0////kAoAAB8AAAAgAAAAgDkAALwKAADQCgAAHAAAADAAAACoOQAAlDkAAAAAAADYCgAAbgEAAG8BAAAJAAAADgAAAAMAAAAEAAAADwAAAAwAAAAPAAAADQAAAA4AAAAIAAAAEQAAAAoAAAAAAAAA6AoAAHABAABxAQAACgAAAAQAAAACAAAAAwAAABAAAAADAAAABQAAAAoAAAAFAAAABgAAABIAAAALAAAAAAAAAPgKAAByAQAAcwEAAAsAAAAOAAAAAwAAAAQAAAALAAAADAAAAA8AAAARAAAAEgAAAAwAAAAQAAAACQAAAAAAAAAICwAAdAEAAHUBAAAMAAAABAAAAAIAAAADAAAAAgAAAAMAAAAFAAAAEwAAABQAAAANAAAABgAAAAcAAAAAAAAAGAsAAHYBAAB3AQAAeAEAAAEAAAAFAAAAEwAAAAAAAAA4CwAAeQEAAHoBAAB4AQAAAgAAAAYAAAAUAAAAAAAAAEgLAAB7AQAAfAEAAHgBAAABAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAAAAACICwAAfQEAAH4BAAB4AQAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAAAAFQAAABYAAAAAAAAAwAsAAH8BAACAAQAAeAEAAAMAAAAEAAAAFwAAAAUAAAAYAAAAAQAAAAIAAAAGAAAAAAAAAAAMAACBAQAAggEAAHgBAAAHAAAACAAAABkAAAAJAAAAGgAAAAMAAAAEAAAACgAAAAAAAAA4DAAAgwEAAIQBAAB4AQAAFQAAABsAAAAcAAAAHQAAAB4AAAAfAAAAAQAAAPj///84DAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAAAAAABwDAAAhQEAAIYBAAB4AQAAHQAAACAAAAAhAAAAIgAAACMAAAAkAAAAAgAAAPj///9wDAAAHgAAAB8AAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAABIAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAAAAAACUAAABtAAAALwAAACUAAABkAAAALwAAACUAAAB5AAAAAAAAACUAAABJAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABwAAAAAAAAACUAAABhAAAAIAAAACUAAABiAAAAIAAAACUAAABkAAAAIAAAACUAAABIAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABZAAAAAAAAAEEAAABNAAAAAAAAAFAAAABNAAAAAAAAAEoAAABhAAAAbgAAAHUAAABhAAAAcgAAAHkAAAAAAAAARgAAAGUAAABiAAAAcgAAAHUAAABhAAAAcgAAAHkAAAAAAAAATQAAAGEAAAByAAAAYwAAAGgAAAAAAAAAQQAAAHAAAAByAAAAaQAAAGwAAAAAAAAATQAAAGEAAAB5AAAAAAAAAEoAAAB1AAAAbgAAAGUAAAAAAAAASgAAAHUAAABsAAAAeQAAAAAAAABBAAAAdQAAAGcAAAB1AAAAcwAAAHQAAAAAAAAAUwAAAGUAAABwAAAAdAAAAGUAAABtAAAAYgAAAGUAAAByAAAAAAAAAE8AAABjAAAAdAAAAG8AAABiAAAAZQAAAHIAAAAAAAAATgAAAG8AAAB2AAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAARAAAAGUAAABjAAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAASgAAAGEAAABuAAAAAAAAAEYAAABlAAAAYgAAAAAAAABNAAAAYQAAAHIAAAAAAAAAQQAAAHAAAAByAAAAAAAAAEoAAAB1AAAAbgAAAAAAAABKAAAAdQAAAGwAAAAAAAAAQQAAAHUAAABnAAAAAAAAAFMAAABlAAAAcAAAAAAAAABPAAAAYwAAAHQAAAAAAAAATgAAAG8AAAB2AAAAAAAAAEQAAABlAAAAYwAAAAAAAABTAAAAdQAAAG4AAABkAAAAYQAAAHkAAAAAAAAATQAAAG8AAABuAAAAZAAAAGEAAAB5AAAAAAAAAFQAAAB1AAAAZQAAAHMAAABkAAAAYQAAAHkAAAAAAAAAVwAAAGUAAABkAAAAbgAAAGUAAABzAAAAZAAAAGEAAAB5AAAAAAAAAFQAAABoAAAAdQAAAHIAAABzAAAAZAAAAGEAAAB5AAAAAAAAAEYAAAByAAAAaQAAAGQAAABhAAAAeQAAAAAAAABTAAAAYQAAAHQAAAB1AAAAcgAAAGQAAABhAAAAeQAAAAAAAABTAAAAdQAAAG4AAAAAAAAATQAAAG8AAABuAAAAAAAAAFQAAAB1AAAAZQAAAAAAAABXAAAAZQAAAGQAAAAAAAAAVAAAAGgAAAB1AAAAAAAAAEYAAAByAAAAaQAAAAAAAABTAAAAYQAAAHQAAAAAAAAAJQAAAG0AAAAvAAAAJQAAAGQAAAAvAAAAJQAAAHkAAAAlAAAAWQAAAC0AAAAlAAAAbQAAAC0AAAAlAAAAZAAAACUAAABJAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABwAAAAJQAAAEgAAAA6AAAAJQAAAE0AAAAlAAAASAAAADoAAAAlAAAATQAAADoAAAAlAAAAUwAAACUAAABIAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAAAAAAKAMAACHAQAAiAEAAHgBAAABAAAAAAAAAMgMAACJAQAAigEAAHgBAAACAAAAAAAAAOgMAACLAQAAjAEAAHgBAAAlAAAAJgAAAA0AAAAOAAAADwAAABAAAAAnAAAAEQAAABIAAAAAAAAAEA0AAI0BAACOAQAAeAEAACgAAAApAAAAEwAAABQAAAAVAAAAFgAAACoAAAAXAAAAGAAAAAAAAAAwDQAAjwEAAJABAAB4AQAAKwAAACwAAAAZAAAAGgAAABsAAAAcAAAALQAAAB0AAAAeAAAAAAAAAFANAACRAQAAkgEAAHgBAAAuAAAALwAAAB8AAAAgAAAAIQAAACIAAAAwAAAAIwAAACQAAAAAAAAAcA0AAJMBAACUAQAAeAEAAAMAAAAEAAAAAAAAAJgNAACVAQAAlgEAAHgBAAAFAAAABgAAAAAAAADADQAAlwEAAJgBAAB4AQAAAQAAACUAAAAAAAAA6A0AAJkBAACaAQAAeAEAAAIAAAAmAAAAAAAAABAOAACbAQAAnAEAAHgBAAAVAAAABAAAACUAAAAAAAAAOA4AAJ0BAACeAQAAeAEAABYAAAAFAAAAJgAAAAAAAACQDgAAnwEAAKABAAB4AQAAAwAAAAQAAAALAAAAMQAAADIAAAAMAAAAMwAAAAAAAABYDgAAnwEAAKEBAAB4AQAAAwAAAAQAAAALAAAAMQAAADIAAAAMAAAAMwAAAAAAAADADgAAogEAAKMBAAB4AQAABQAAAAYAAAANAAAANAAAADUAAAAOAAAANgAAAAAAAAAADwAApAEAAKUBAAB4AQAAAAAAABAPAACmAQAApwEAAHgBAAAOAAAAFwAAAA8AAAAYAAAAEAAAAAIAAAAZAAAADwAAAAAAAABYDwAAqAEAAKkBAAB4AQAANwAAADgAAAAnAAAAKAAAACkAAAAAAAAAaA8AAKoBAACrAQAAeAEAADkAAAA6AAAAKgAAACsAAAAsAAAAZgAAAGEAAABsAAAAcwAAAGUAAAAAAAAAdAAAAHIAAAB1AAAAZQAAAAAAAAAAAAAAKAsAAJ8BAACsAQAAeAEAAAAAAAA4DwAAnwEAAK0BAAB4AQAAGgAAAAMAAAAEAAAABQAAABEAAAAbAAAAEgAAABwAAAATAAAABgAAAB0AAAAQAAAAAAAAAKAOAACfAQAArgEAAHgBAAAHAAAACAAAABEAAAA7AAAAPAAAABIAAAA9AAAAAAAAAOAOAACfAQAArwEAAHgBAAAJAAAACgAAABMAAAA+AAAAPwAAABQAAABAAAAAAAAAAGgOAACfAQAAsAEAAHgBAAADAAAABAAAAAsAAAAxAAAAMgAAAAwAAAAzAAAAAAAAAGgMAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAAAAAAJgMAAAeAAAAHwAAACAAAAAhAAAAIgAAACMAAAAkAAAAAAAAAJgPAACxAQAAsgEAAEEAAAAEAAAAAAAAALAPAACzAQAAtAEAALUBAAC2AQAAHgAAAAYAAAApAAAABwAAAAAAAADYDwAAswEAALcBAAC1AQAAtgEAAB4AAAAHAAAAKgAAAAgAAAAAAAAA6A8AALgBAAC5AQAAQgAAAAAAAAD4DwAAuAEAALoBAABCAAAAAAAAACgQAACzAQAAuwEAALUBAAC2AQAAHwAAAAAAAAAYEAAAswEAALwBAAC1AQAAtgEAACAAAAAAAAAAqBAAALMBAAC9AQAAtQEAALYBAAAhAAAAAAAAALgQAACzAQAAvgEAALUBAAC2AQAAHgAAAAgAAAArAAAACQAAAAAAAAABAAEADAALAAoACwAQAAsAKAAhABgACwAUAAsAIAALAFAAIQASAAsADwALAEAAIQCgAGMABAADAAMAAgACAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAIAAgACAAIAAgACAAIAAgADIAIgAiACIAIgAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAWAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAI2AjYCNgI2AjYCNgI2AjYCNgI2ATABMAEwATABMAEwATACNUI1QjVCNUI1QjVCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQTABMAEwATABMAEwAjWCNYI1gjWCNYI1gjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYEwATABMAEwAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE40aGVpZjEyU3RyZWFtUmVhZGVyRQBONGhlaWYxOVN0cmVhbVJlYWRlcl9tZW1vcnlFAHByZXBhcmVfcmVhZABuIDw9IG1fcmVtYWluaW5nAHNraXBfd2l0aG91dF9hZHZhbmNpbmdfZmlsZV9wb3MAKnZhbHVlID4gMAB2YWx1ZSA8PSAweEZGAHZhbHVlIDw9IDB4RkZGRgB2YWx1ZSA8PSAweEZGRkZGRkZGAG1fcG9zaXRpb24gPT0gbV9kYXRhLnNpemUoKQBza2lwAG5CeXRlcyA+PSAwAGluc2VydAB8IABCb3g6IAAgLS0tLS0KAHNpemU6IAAgICAoaGVhZGVyIHNpemU6IAApCgB2ZXJzaW9uOiAAZmxhZ3M6IABOU3QzX18yMTViYXNpY19zdHJpbmdidWZJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQBOU3QzX18yMTliYXNpY19vc3RyaW5nc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUATjRoZWlmOUJveEhlYWRlckUAbV91dWlkX3R5cGUuc2l6ZSgpID09IDE2AGJveC5jYwBwcmVwZW5kX2hlYWRlcgAobV9mbGFncyAmIH4weDAwRkZGRkZGKSA9PSAwAE40aGVpZjNCb3hFAGZ0eXAgYm94IHRvbyBzbWFsbCAobGVzcyB0aGFuIDggYnl0ZXMpAG1ham9yIGJyYW5kOiAAbWlub3IgdmVyc2lvbjogAGNvbXBhdGlibGUgYnJhbmRzOiAATjRoZWlmOEJveF9mdHlwRQBNYXhpbXVtIG51bWJlciBvZiBjaGlsZCBib3hlcyAAIGV4Y2VlZGVkLgBOU3QzX18yMThiYXNpY19zdHJpbmdzdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQBCb3ggc2l6ZSAoACBieXRlcykgc21hbGxlciB0aGFuIGhlYWRlciBzaXplICgAIGJ5dGVzKQBTZWN1cml0eSBsaW1pdCBmb3IgbWF4aW11bSBuZXN0aW5nIG9mIGJveGVzIGhhcyBiZWVuIGV4Y2VlZGVkAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjNCb3hFTlNfOWFsbG9jYXRvcklTMl9FRUVFAHdyaXRlAGJpdHNfcGVyX2NoYW5uZWw6IAAsAE40aGVpZjhCb3hfcGl4aUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9waXhpRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBwcm9maWxlIHNpemU6IABONGhlaWYxN2NvbG9yX3Byb2ZpbGVfcmF3RQBONGhlaWYxM2NvbG9yX3Byb2ZpbGVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjE3Y29sb3JfcHJvZmlsZV9yYXdFTlNfOWFsbG9jYXRvcklTMl9FRUVFAGNvbG91cl9wcmltYXJpZXM6IAB0cmFuc2Zlcl9jaGFyYWN0ZXJpc3RpY3M6IABtYXRyaXhfY29lZmZpY2llbnRzOiAAZnVsbF9yYW5nZV9mbGFnOiAATjRoZWlmMThjb2xvcl9wcm9maWxlX25jbHhFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjE4Y29sb3JfcHJvZmlsZV9uY2x4RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBtX2NvbG9yX3Byb2ZpbGUAY29sb3VyX3R5cGU6IABjb2xvdXJfdHlwZTogLS0tCgBubyBjb2xvciBwcm9maWxlCgBONGhlaWY4Qm94X2NvbHJFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfY29sckVOU185YWxsb2NhdG9ySVMyX0VFRUUAbG9jYXRpb246IABONGhlaWY3Qm94X3VybEUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmN0JveF91cmxFTlNfOWFsbG9jYXRvcklTMl9FRUVFAE40aGVpZjhCb3hfZHJlZkUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9kcmVmRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBONGhlaWY4Qm94X2RpbmZFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfZGluZkVOU185YWxsb2NhdG9ySVMyX0VFRUUAZ3JvdXAgdHlwZTogAHwgZ3JvdXAgaWQ6IAB8IGVudGl0eSBJRHM6IAAgAE40aGVpZjhCb3hfZ3JwbEUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9ncnBsRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBudW1iZXIgb2YgZGF0YSBieXRlczogAE40aGVpZjhCb3hfaWRhdEUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9pZGF0RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBzZXFfcHJvZmlsZTogAHNlcV9sZXZlbF9pZHhfMDogAGhpZ2hfYml0ZGVwdGg6IAB0d2VsdmVfYml0OiAAY2hyb21hX3N1YnNhbXBsaW5nX3g6IABjaHJvbWFfc3Vic2FtcGxpbmdfeTogAGNocm9tYV9zYW1wbGVfcG9zaXRpb246IABpbml0aWFsX3ByZXNlbnRhdGlvbl9kZWxheTogAG5vdCBwcmVzZW50CgBjb25maWcgT0JVczoATjRoZWlmOEJveF9hdjFDRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2F2MUNFTlNfOWFsbG9jYXRvcklTMl9FRUVFAHN1Y2Nlc3MAcGFyc2UAY29uZmlndXJhdGlvbl92ZXJzaW9uOiAAZ2VuZXJhbF9wcm9maWxlX3NwYWNlOiAAZ2VuZXJhbF90aWVyX2ZsYWc6IABnZW5lcmFsX3Byb2ZpbGVfaWRjOiAAZ2VuZXJhbF9wcm9maWxlX2NvbXBhdGliaWxpdHlfZmxhZ3M6IABnZW5lcmFsX2NvbnN0cmFpbnRfaW5kaWNhdG9yX2ZsYWdzOiAAZ2VuZXJhbF9sZXZlbF9pZGM6IABtaW5fc3BhdGlhbF9zZWdtZW50YXRpb25faWRjOiAAcGFyYWxsZWxpc21fdHlwZTogAGNocm9tYV9mb3JtYXQ6IABiaXRfZGVwdGhfbHVtYTogAGJpdF9kZXB0aF9jaHJvbWE6IABhdmdfZnJhbWVfcmF0ZTogAGNvbnN0YW50X2ZyYW1lX3JhdGU6IABudW1fdGVtcG9yYWxfbGF5ZXJzOiAAdGVtcG9yYWxfaWRfbmVzdGVkOiAAbGVuZ3RoX3NpemU6IAA8YXJyYXk+CgBhcnJheV9jb21wbGV0ZW5lc3M6IABOQUxfdW5pdF90eXBlOiAATjRoZWlmOEJveF9odmNDRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2h2Y0NFTlNfOWFsbG9jYXRvcklTMl9FRUVFAHJlZmVyZW5jZSB3aXRoIHR5cGUgJwAnACBmcm9tIElEOiAAIHRvIElEczogAE40aGVpZjhCb3hfaXJlZkUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9pcmVmRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBFeGNlZWRlZCBzdXBwb3J0ZWQgdmFsdWUgcmFuZ2UuAG51bSA8PSAodWludDMyX3Qpc3RkOjpudW1lcmljX2xpbWl0czxpbnQzMl90Pjo6bWF4KCkARnJhY3Rpb24AZGVuIDw9ICh1aW50MzJfdClzdGQ6Om51bWVyaWNfbGltaXRzPGludDMyX3Q+OjptYXgoKQBjbGVhbl9hcGVydHVyZTogAC8AIHggAG9mZnNldDogACA7IABONGhlaWY4Qm94X2NsYXBFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfY2xhcEVOU185YWxsb2NhdG9ySVMyX0VFRUUAbWlycm9yIGRpcmVjdGlvbjogAHZlcnRpY2FsCgBob3Jpem9udGFsCgBONGhlaWY4Qm94X2ltaXJFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfaW1pckVOU185YWxsb2NhdG9ySVMyX0VFRUUAcm90YXRpb246IAAgZGVncmVlcyAoQ0NXKQoATjRoZWlmOEJveF9pcm90RQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2lyb3RFTlNfOWFsbG9jYXRvcklTMl9FRUVFAGF1eCB0eXBlOiAAYXV4IHN1YnR5cGVzOiAATjRoZWlmOEJveF9hdXhDRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2F1eENFTlNfOWFsbG9jYXRvcklTMl9FRUVFAGltYWdlIHdpZHRoOiAAaW1hZ2UgaGVpZ2h0OiAATjRoZWlmOEJveF9pc3BlRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2lzcGVFTlNfOWFsbG9jYXRvcklTMl9FRUVFAGFzc29jaWF0aW9ucyBmb3IgaXRlbSBJRDogAHByb3BlcnR5IGluZGV4OiAAIChlc3NlbnRpYWw6IABONGhlaWY4Qm94X2lwbWFFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfaXBtYUVOU185YWxsb2NhdG9ySVMyX0VFRUUATjRoZWlmOEJveF9pcGNvRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2lwY29FTlNfOWFsbG9jYXRvcklTMl9FRUVFAE40aGVpZjhCb3hfaXBycEUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9pcHJwRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBtaW1lAHVyaSAAaXRlbV9JRDogAGl0ZW1fcHJvdGVjdGlvbl9pbmRleDogAGl0ZW1fdHlwZTogAGl0ZW1fbmFtZTogAGNvbnRlbnRfdHlwZTogAGNvbnRlbnRfZW5jb2Rpbmc6IABpdGVtIHVyaSB0eXBlOiAAaGlkZGVuIGl0ZW06IABONGhlaWY4Qm94X2luZmVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfaW5mZUVOU185YWxsb2NhdG9ySVMyX0VFRUUATjRoZWlmOEJveF9paW5mRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2lpbmZFTlNfOWFsbG9jYXRvcklTMl9FRUVFAGlsb2MgYm94IGNvbnRhaW5zIAAgaXRlbXMsIHdoaWNoIGV4Y2VlZHMgdGhlIHNlY3VyaXR5IGxpbWl0IG9mIAAgaXRlbXMuAE51bWJlciBvZiBleHRlbnRzIGluIGlsb2MgYm94ICgAKSBleGNlZWRzIHNlY3VyaXR5IGxpbWl0ICgAaXRlbSBJRDogACAgY29uc3RydWN0aW9uIG1ldGhvZDogACAgZGF0YV9yZWZlcmVuY2VfaW5kZXg6IAAgIGJhc2Vfb2Zmc2V0OiAAICBleHRlbnRzOiAAO2luZGV4PQBONGhlaWY4Qm94X2lsb2NFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfaWxvY0VOU185YWxsb2NhdG9ySVMyX0VFRUUAbV9pdGVtX0lEIDw9IDB4RkZGRgBONGhlaWY4Qm94X3BpdG1FAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfcGl0bUVOU185YWxsb2NhdG9ySVMyX0VFRUUAcHJlX2RlZmluZWQ6IABoYW5kbGVyX3R5cGU6IABuYW1lOiAATjRoZWlmOEJveF9oZGxyRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWY4Qm94X2hkbHJFTlNfOWFsbG9jYXRvcklTMl9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjhCb3hfbWV0YUVOU185YWxsb2NhdG9ySVMyX0VFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEJveF9mdHlwRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBCb3ggc2l6ZSAAIGV4Y2VlZHMgc2VjdXJpdHkgbGltaXQuAE40aGVpZjhCb3hfbWV0YUUAaWxvYyBib3ggY29udGFpbmVkIAAgYnl0ZXMsIHRvdGFsIG1lbW9yeSBzaXplIHdvdWxkIGJlIAAgYnl0ZXMsIGV4Y2VlZGluZyB0aGUgc2VjdXJpdHkgbGltaXQgb2YgACBieXRlcwBpbG9jIGRhdGEgcG9pbnRlcnMgb3V0IG9mIGFsbG93ZWQgcmFuZ2UARXh0ZW50IGluIGlsb2MgYm94IHJlZmVyZW5jZXMgZGF0YSBvdXRzaWRlIG9mIGZpbGUgYm91bmRzIAAocG9pbnRzIHRvIGZpbGUgcG9zaXRpb24gAHJlYWRfZGF0YQBpZGF0IGJveCByZWZlcmVuY2VkIGluIGlyZWYgYm94IGlzIG5vdCBwcmVzZW50IGluIGZpbGUASXRlbSBjb25zdHJ1Y3Rpb24gbWV0aG9kIAAgbm90IGltcGxlbWVudGVkAGlkYXQgYm94IGNvbnRhaW5lZCAASXRlbSAoSUQ9ACkgaGFzIG5vIHByb3BlcnRpZXMgYXNzaWduZWQgdG8gaXQgaW4gaXBtYSBib3gATm9uZXhpc3RpbmcgcHJvcGVydHkgKGluZGV4PQApIGZvciBpdGVtIAAgSUQ9ACByZWZlcmVuY2VkIGluIGlwbWEgYm94AFVua25vd24gZXJyb3IAZXJyb3IuY2MAZ2V0X2Vycm9yX3N0cmluZwBDb2xvciBwcm9maWxlIGRvZXMgbm90IGV4aXN0AEVycm9yIGR1cmluZyBlbmNvZGluZyBvciB3cml0aW5nIG91dHB1dCBmaWxlAEVuY29kZXIgcGx1Z2luIGdlbmVyYXRlZCBhbiBlcnJvcgBEZWNvZGVyIHBsdWdpbiBnZW5lcmF0ZWQgYW4gZXJyb3IATWVtb3J5IGFsbG9jYXRpb24gZXJyb3IAVXNhZ2UgZXJyb3IAVW5zdXBwb3J0ZWQgZmVhdHVyZQBVbnN1cHBvcnRlZCBmaWxlLXR5cGUASW52YWxpZCBpbnB1dABJbnB1dCBmaWxlIGRvZXMgbm90IGV4aXN0AENhbm5vdCB3cml0ZSBvdXRwdXQgZGF0YQBVbnN1cHBvcnRlZCBiaXQgZGVwdGgAVW5zdXBwb3J0ZWQgaXRlbSBjb25zdHJ1Y3Rpb24gbWV0aG9kAFVuc3VwcG9ydGVkIGNvbG9yIGNvbnZlcnNpb24AVW5zdXBwb3J0ZWQgZGF0YSB2ZXJzaW9uAFVuc3VwcG9ydGVkIGltYWdlIHR5cGUAVW5zdXBwb3J0ZWQgY29kZWMASW52YWxpZCBwYXJhbWV0ZXIgdmFsdWUAVW5zdXBwb3J0ZWQgcGFyYW1ldGVyAFRoZSB2ZXJzaW9uIG9mIHRoZSBwYXNzZWQgd3JpdGVyIGlzIG5vdCBzdXBwb3J0ZWQAVGhlIHZlcnNpb24gb2YgdGhlIHBhc3NlZCBwbHVnaW4gaXMgbm90IHN1cHBvcnRlZABOb24tZXhpc3RpbmcgaW1hZ2UgY2hhbm5lbCByZWZlcmVuY2VkAE5VTEwgYXJndW1lbnQgcmVjZWl2ZWQATm9uLWV4aXN0aW5nIGl0ZW0gSUQgcmVmZXJlbmNlZABTZWN1cml0eSBsaW1pdCBleGNlZWRlZABVbmtub3duIE5DTFggbWF0cml4IGNvZWZmaWNpZW50cwBVbmtub3duIE5DTFggdHJhbnNmZXIgY2hhcmFjdGVyaXN0aWNzAFVua25vd24gTkNMWCBjb2xvciBwcmltYXJpZXMAV3JvbmcgdGlsZSBpbWFnZSBwaXhlbCBkZXB0aABJbnZhbGlkIHBpeGkgYm94AEludmFsaWQgaW1hZ2Ugc2l6ZQBJbnZhbGlkIGZyYWN0aW9uYWwgbnVtYmVyAFdyb25nIHRpbGUgaW1hZ2UgY2hyb21hIGZvcm1hdABVbmtub3duIGNvbG9yIHByb2ZpbGUgdHlwZQBObyBvciBpbnZhbGlkIHByaW1hcnkgaXRlbQBUeXBlIG9mIGF1eGlsaWFyeSBpbWFnZSB1bnNwZWNpZmllZABPdmVybGF5IGltYWdlIG91dHNpZGUgb2YgY2FudmFzIGFyZWEASW52YWxpZCBvdmVybGF5IGRhdGEASW52YWxpZCBjbGVhbi1hcGVydHVyZSBzcGVjaWZpY2F0aW9uAEl0ZW0gaGFzIG5vIGRhdGEATm8gcHJvcGVydGllcyBhc3NpZ25lZCB0byBpdGVtACdpcG1hJyBib3ggcmVmZXJlbmNlcyBhIG5vbi1leGlzdGluZyBwcm9wZXJ0eQBOb3QgYSAncGljdCcgaGFuZGxlcgBObyAnaW5mZScgYm94AE5vICdpcmVmJyBib3gATm8gJ2lwcnAnIGJveABObyAnaWluZicgYm94AE5vICdpbG9jJyBib3gATm8gJ2lwbWEnIGJveABObyAnaXBjbycgYm94AE5vICdwaXRtJyBib3gATm8gJ2F2MUMnIGJveABObyAnaHZjQycgYm94AE5vICdoZGxyJyBib3gATm8gJ21ldGEnIGJveABObyAnaWRhdCcgYm94AE5vICdmdHlwJyBib3gATWlzc2luZyBncmlkIGltYWdlcwBJbnZhbGlkIGdyaWQgZGF0YQBJbnZhbGlkIGJveCBzaXplAFVuZXhwZWN0ZWQgZW5kIG9mIGZpbGUAVW5zcGVjaWZpZWQAOiAARmlsZSBkb2VzIG5vdCBpbmNsdWRlIGFueSBzdXBwb3J0ZWQgYnJhbmRzLgoATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmMTlTdHJlYW1SZWFkZXJfbWVtb3J5RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBoZWlmX2ZpbGUuY2MASXRlbSB3aXRoIElEIAAgaGFzIG5vIGNvbXByZXNzZWQgZGF0YQBnZXRfY29tcHJlc3NlZF9pbWFnZV9kYXRhAGhlaWZfaW1hZ2UuY2MAY2hyb21hX2hfc3Vic2FtcGxpbmcAY2hyb21hX3Zfc3Vic2FtcGxpbmcAbnVtX2ludGVybGVhdmVkX3BpeGVsc19wZXJfcGxhbmUAd2lkdGggPj0gMABhbGxvYwBoZWlnaHQgPj0gMABiaXRfZGVwdGggPj0gMQBiaXRfZGVwdGggPD0gMzIAbV9iaXRfZGVwdGggPD0gMTYAYnBwIDw9IDI1NQBnZXRfc3RvcmFnZV9iaXRzX3Blcl9waXhlbAAhaGFzX2NoYW5uZWwoZHN0X2NoYW5uZWwpAGNvcHlfbmV3X3BsYW5lX2Zyb20AaXNfY2hyb21hX3dpdGhfYWxwaGEAU3VjY2VzcwBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWYxNEhlaWZQaXhlbEltYWdlRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBDYW4gY3VycmVudGx5IG9ubHkgbWlycm9yIGltYWdlcyB3aXRoIDggYml0cyBwZXIgcGl4ZWwAQ2FuIGN1cnJlbnRseSBvbmx5IGZpbGwgaW1hZ2VzIHdpdGggOCBiaXRzIHBlciBwaXhlbABmaWxsX1JHQl8xNmJpdABpbl93ID49IDAAb3ZlcmxheQBpbl9oID49IDAAb3V0X3cgPj0gMABvdXRfaCA+PSAwAE92ZXJsYXkgaW1hZ2Ugb3V0c2lkZSBvZiByaWdodCBvciBib3R0b20gY2FudmFzIGJvcmRlcgBPdmVybGF5IGltYWdlIG91dHNpZGUgb2YgbGVmdCBvciB0b3AgY2FudmFzIGJvcmRlcgBoZWlmX2dldF92ZXJzaW9uAGlpAGhlaWZfZ2V0X3ZlcnNpb25fbnVtYmVyAGhlaWZfY29udGV4dF9hbGxvYwBoZWlmX2NvbnRleHRfZnJlZQB2aWkAaGVpZl9jb250ZXh0X3JlYWRfZnJvbV9tZW1vcnkAaWlpaQBoZWlmX2NvbnRleHRfZ2V0X251bWJlcl9vZl90b3BfbGV2ZWxfaW1hZ2VzAGlpaQBoZWlmX2pzX2NvbnRleHRfZ2V0X2xpc3Rfb2ZfdG9wX2xldmVsX2ltYWdlX0lEcwBoZWlmX2pzX2NvbnRleHRfZ2V0X2ltYWdlX2hhbmRsZQBoZWlmX2pzX2RlY29kZV9pbWFnZQBpaWlpaQBoZWlmX2ltYWdlX2hhbmRsZV9yZWxlYXNlAGhlaWZfZXJyb3JfY29kZQBoZWlmX2Vycm9yX09rAGhlaWZfZXJyb3JfSW5wdXRfZG9lc19ub3RfZXhpc3QAaGVpZl9lcnJvcl9JbnZhbGlkX2lucHV0AGhlaWZfZXJyb3JfVW5zdXBwb3J0ZWRfZmlsZXR5cGUAaGVpZl9lcnJvcl9VbnN1cHBvcnRlZF9mZWF0dXJlAGhlaWZfZXJyb3JfVXNhZ2VfZXJyb3IAaGVpZl9lcnJvcl9NZW1vcnlfYWxsb2NhdGlvbl9lcnJvcgBoZWlmX2Vycm9yX0RlY29kZXJfcGx1Z2luX2Vycm9yAGhlaWZfZXJyb3JfRW5jb2Rlcl9wbHVnaW5fZXJyb3IAaGVpZl9lcnJvcl9FbmNvZGluZ19lcnJvcgBoZWlmX2Vycm9yX0NvbG9yX3Byb2ZpbGVfZG9lc19ub3RfZXhpc3QAaGVpZl9zdWJlcnJvcl9jb2RlAGhlaWZfc3ViZXJyb3JfVW5zcGVjaWZpZWQAaGVpZl9zdWJlcnJvcl9DYW5ub3Rfd3JpdGVfb3V0cHV0X2RhdGEAaGVpZl9zdWJlcnJvcl9FbmRfb2ZfZGF0YQBoZWlmX3N1YmVycm9yX0ludmFsaWRfYm94X3NpemUAaGVpZl9zdWJlcnJvcl9Ob19mdHlwX2JveABoZWlmX3N1YmVycm9yX05vX2lkYXRfYm94AGhlaWZfc3ViZXJyb3JfTm9fbWV0YV9ib3gAaGVpZl9zdWJlcnJvcl9Ob19oZGxyX2JveABoZWlmX3N1YmVycm9yX05vX2h2Y0NfYm94AGhlaWZfc3ViZXJyb3JfTm9fcGl0bV9ib3gAaGVpZl9zdWJlcnJvcl9Ob19pcGNvX2JveABoZWlmX3N1YmVycm9yX05vX2lwbWFfYm94AGhlaWZfc3ViZXJyb3JfTm9faWxvY19ib3gAaGVpZl9zdWJlcnJvcl9Ob19paW5mX2JveABoZWlmX3N1YmVycm9yX05vX2lwcnBfYm94AGhlaWZfc3ViZXJyb3JfTm9faXJlZl9ib3gAaGVpZl9zdWJlcnJvcl9Ob19waWN0X2hhbmRsZXIAaGVpZl9zdWJlcnJvcl9JcG1hX2JveF9yZWZlcmVuY2VzX25vbmV4aXN0aW5nX3Byb3BlcnR5AGhlaWZfc3ViZXJyb3JfTm9fcHJvcGVydGllc19hc3NpZ25lZF90b19pdGVtAGhlaWZfc3ViZXJyb3JfTm9faXRlbV9kYXRhAGhlaWZfc3ViZXJyb3JfSW52YWxpZF9ncmlkX2RhdGEAaGVpZl9zdWJlcnJvcl9NaXNzaW5nX2dyaWRfaW1hZ2VzAGhlaWZfc3ViZXJyb3JfTm9fYXYxQ19ib3gAaGVpZl9zdWJlcnJvcl9JbnZhbGlkX2NsZWFuX2FwZXJ0dXJlAGhlaWZfc3ViZXJyb3JfSW52YWxpZF9vdmVybGF5X2RhdGEAaGVpZl9zdWJlcnJvcl9PdmVybGF5X2ltYWdlX291dHNpZGVfb2ZfY2FudmFzAGhlaWZfc3ViZXJyb3JfQXV4aWxpYXJ5X2ltYWdlX3R5cGVfdW5zcGVjaWZpZWQAaGVpZl9zdWJlcnJvcl9Ob19vcl9pbnZhbGlkX3ByaW1hcnlfaXRlbQBoZWlmX3N1YmVycm9yX05vX2luZmVfYm94AGhlaWZfc3ViZXJyb3JfU2VjdXJpdHlfbGltaXRfZXhjZWVkZWQAaGVpZl9zdWJlcnJvcl9Vbmtub3duX2NvbG9yX3Byb2ZpbGVfdHlwZQBoZWlmX3N1YmVycm9yX1dyb25nX3RpbGVfaW1hZ2VfY2hyb21hX2Zvcm1hdABoZWlmX3N1YmVycm9yX0ludmFsaWRfZnJhY3Rpb25hbF9udW1iZXIAaGVpZl9zdWJlcnJvcl9JbnZhbGlkX2ltYWdlX3NpemUAaGVpZl9zdWJlcnJvcl9Ob25leGlzdGluZ19pdGVtX3JlZmVyZW5jZWQAaGVpZl9zdWJlcnJvcl9OdWxsX3BvaW50ZXJfYXJndW1lbnQAaGVpZl9zdWJlcnJvcl9Ob25leGlzdGluZ19pbWFnZV9jaGFubmVsX3JlZmVyZW5jZWQAaGVpZl9zdWJlcnJvcl9VbnN1cHBvcnRlZF9wbHVnaW5fdmVyc2lvbgBoZWlmX3N1YmVycm9yX1Vuc3VwcG9ydGVkX3dyaXRlcl92ZXJzaW9uAGhlaWZfc3ViZXJyb3JfVW5zdXBwb3J0ZWRfcGFyYW1ldGVyAGhlaWZfc3ViZXJyb3JfSW52YWxpZF9wYXJhbWV0ZXJfdmFsdWUAaGVpZl9zdWJlcnJvcl9JbnZhbGlkX3BpeGlfYm94AGhlaWZfc3ViZXJyb3JfVW5zdXBwb3J0ZWRfY29kZWMAaGVpZl9zdWJlcnJvcl9VbnN1cHBvcnRlZF9pbWFnZV90eXBlAGhlaWZfc3ViZXJyb3JfVW5zdXBwb3J0ZWRfZGF0YV92ZXJzaW9uAGhlaWZfc3ViZXJyb3JfVW5zdXBwb3J0ZWRfY29sb3JfY29udmVyc2lvbgBoZWlmX3N1YmVycm9yX1Vuc3VwcG9ydGVkX2l0ZW1fY29uc3RydWN0aW9uX21ldGhvZABoZWlmX3N1YmVycm9yX1Vuc3VwcG9ydGVkX2JpdF9kZXB0aABoZWlmX3N1YmVycm9yX1dyb25nX3RpbGVfaW1hZ2VfcGl4ZWxfZGVwdGgAaGVpZl9zdWJlcnJvcl9Vbmtub3duX05DTFhfY29sb3JfcHJpbWFyaWVzAGhlaWZfc3ViZXJyb3JfVW5rbm93bl9OQ0xYX3RyYW5zZmVyX2NoYXJhY3RlcmlzdGljcwBoZWlmX3N1YmVycm9yX1Vua25vd25fTkNMWF9tYXRyaXhfY29lZmZpY2llbnRzAGhlaWZfY29tcHJlc3Npb25fZm9ybWF0AGhlaWZfY29tcHJlc3Npb25fdW5kZWZpbmVkAGhlaWZfY29tcHJlc3Npb25fSEVWQwBoZWlmX2NvbXByZXNzaW9uX0FWQwBoZWlmX2NvbXByZXNzaW9uX0pQRUcAaGVpZl9jb21wcmVzc2lvbl9BVjEAaGVpZl9jaHJvbWEAaGVpZl9jaHJvbWFfdW5kZWZpbmVkAGhlaWZfY2hyb21hX21vbm9jaHJvbWUAaGVpZl9jaHJvbWFfNDIwAGhlaWZfY2hyb21hXzQyMgBoZWlmX2Nocm9tYV80NDQAaGVpZl9jaHJvbWFfaW50ZXJsZWF2ZWRfUkdCAGhlaWZfY2hyb21hX2ludGVybGVhdmVkX1JHQkEAaGVpZl9jaHJvbWFfaW50ZXJsZWF2ZWRfUlJHR0JCX0JFAGhlaWZfY2hyb21hX2ludGVybGVhdmVkX1JSR0dCQkFBX0JFAGhlaWZfY2hyb21hX2ludGVybGVhdmVkX1JSR0dCQl9MRQBoZWlmX2Nocm9tYV9pbnRlcmxlYXZlZF9SUkdHQkJBQV9MRQBoZWlmX2Nocm9tYV9pbnRlcmxlYXZlZF8yNGJpdABoZWlmX2Nocm9tYV9pbnRlcmxlYXZlZF8zMmJpdABoZWlmX2NvbG9yc3BhY2UAaGVpZl9jb2xvcnNwYWNlX3VuZGVmaW5lZABoZWlmX2NvbG9yc3BhY2VfWUNiQ3IAaGVpZl9jb2xvcnNwYWNlX1JHQgBoZWlmX2NvbG9yc3BhY2VfbW9ub2Nocm9tZQBoZWlmX2NoYW5uZWwAaGVpZl9jaGFubmVsX1kAaGVpZl9jaGFubmVsX0NyAGhlaWZfY2hhbm5lbF9DYgBoZWlmX2NoYW5uZWxfUgBoZWlmX2NoYW5uZWxfRwBoZWlmX2NoYW5uZWxfQgBoZWlmX2NoYW5uZWxfQWxwaGEAaGVpZl9jaGFubmVsX2ludGVybGVhdmVkAGhlaWZfY29udGV4dAB2AHZpAGhlaWZfaW1hZ2VfaGFuZGxlAGhlaWZfaW1hZ2UAaGVpZl9lcnJvcgBpAGNvZGUAdmlpaQBzdWJjb2RlADEwaGVpZl9lcnJvcgBQSzEwaGVpZl9pbWFnZQBQMTBoZWlmX2ltYWdlADEwaGVpZl9pbWFnZQBQSzE3aGVpZl9pbWFnZV9oYW5kbGUAUDE3aGVpZl9pbWFnZV9oYW5kbGUAMTdoZWlmX2ltYWdlX2hhbmRsZQBQSzEyaGVpZl9jb250ZXh0AFAxMmhlaWZfY29udGV4dAAxMmhlaWZfY29udGV4dAAxMmhlaWZfY2hhbm5lbAAxNWhlaWZfY29sb3JzcGFjZQAxMWhlaWZfY2hyb21hADIzaGVpZl9jb21wcmVzc2lvbl9mb3JtYXQAMThoZWlmX3N1YmVycm9yX2NvZGUAMTVoZWlmX2Vycm9yX2NvZGUATjEwZW1zY3JpcHRlbjN2YWxFAGlzX3ByaW1hcnkAdGh1bWJuYWlscwB3aWR0aABoZWlnaHQAY2hyb21hAGNvbG9yc3BhY2UAaGVpZl9pbWFnZV9nZXRfY2hyb21hX2Zvcm1hdChpbWFnZSkgPT0gaGVpZl9jaHJvbWFfaW50ZXJsZWF2ZWRfMjRiaXQALi9oZWlmX2Vtc2NyaXB0ZW4uaABoZWlmX2ltYWdlX2dldF9jaHJvbWFfZm9ybWF0KGltYWdlKSA9PSBoZWlmX2Nocm9tYV9tb25vY2hyb21lAGRhdGEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUATlN0M19fMjIxX19iYXNpY19zdHJpbmdfY29tbW9uSUxiMUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUlONGhlaWYxMUhlaWZDb250ZXh0RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQAxLjEzLjAAU3VjY2VzcwBTdWNjZXNzAExlc3MgdGhhbiA4IGJ5dGVzIG9mIGRhdGEAR3JpZCBpbWFnZSBkYXRhIGluY29tcGxldGUACgBPdmVybGF5IGltYWdlIGRhdGEgaW5jb21wbGV0ZQBPdmVybGF5IGltYWdlIGRhdGEgdmVyc2lvbiAAIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQAeABpbWFnZV9pbmRleCA8IG1fb2Zmc2V0cy5zaXplKCkAaGVpZl9jb250ZXh0LmNjAGdldF9vZmZzZXQATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmOEhlaWZGaWxlRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBodmMxAGdyaWQAaWRlbgBpb3ZsAGF2MDEAJ3BpdG0nIGJveCByZWZlcmVuY2VzIGEgbm9uLWV4aXN0aW5nIGltYWdlAEltYWdlIHNpemUgACBleGNlZWRzIHRoZSBtYXhpbXVtIGltYWdlIHNpemUgAFRvbyBtYW55IHRodW1ibmFpbCByZWZlcmVuY2VzAFRodW1ibmFpbCByZWZlcmVuY2VzIGEgbm9uLWV4aXN0aW5nIGltYWdlAFRodW1ibmFpbCByZWZlcmVuY2VzIGFub3RoZXIgdGh1bWJuYWlsAFJlY3Vyc2l2ZSB0aHVtYm5haWwgaW1hZ2UgZGV0ZWN0ZWQATm8gYXV4QyBwcm9wZXJ0eSBmb3IgaW1hZ2UgAFRvbyBtYW55IGF1eGlsaWFyeSBpbWFnZSByZWZlcmVuY2VzAHVybjptcGVnOmF2YzoyMDE1OmF1eGlkOjEAdXJuOm1wZWc6aGV2YzoyMDE1OmF1eGlkOjEAdXJuOm1wZWc6bXBlZ0I6Y2ljcDpzeXN0ZW1zOmF1eGlsaWFyeTphbHBoYQBOb24tZXhpc3RpbmcgYWxwaGEgaW1hZ2UgcmVmZXJlbmNlZABSZWN1cnNpdmUgYWxwaGEgaW1hZ2UgZGV0ZWN0ZWQAdXJuOm1wZWc6aGV2YzoyMDE1OmF1eGlkOjIAdXJuOm1wZWc6bXBlZ0I6Y2ljcDpzeXN0ZW1zOmF1eGlsaWFyeTpkZXB0aABOb24tZXhpc3RpbmcgZGVwdGggaW1hZ2UgcmVmZXJlbmNlZABSZWN1cnNpdmUgZGVwdGggaW1hZ2UgZGV0ZWN0ZWQATm9uLWV4aXN0aW5nIGF1eCBpbWFnZSByZWZlcmVuY2VkAFJlY3Vyc2l2ZSBhdXggaW1hZ2UgZGV0ZWN0ZWQATm8gaHZjQyBwcm9wZXJ0eSBpbiBodmMxIHR5cGUgaW1hZ2UATWV0YWRhdGEgbm90IGNvcnJlY3RseSBhc3NpZ25lZCB0byBpbWFnZQBNZXRhZGF0YSBhc3NpZ25lZCB0byBub24tZXhpc3RpbmcgaW1hZ2UAYHByZW1gIGxpbmsgYXNzaWduZWQgdG8gbm9uLWV4aXN0aW5nIGltYWdlAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjEzSW1hZ2VNZXRhZGF0YUVOU185YWxsb2NhdG9ySVMyX0VFRUUATjRoZWlmMzZTRUlNZXNzYWdlX2RlcHRoX3JlcHJlc2VudGF0aW9uX2luZm9FADMwaGVpZl9kZXB0aF9yZXByZXNlbnRhdGlvbl9pbmZvAE40aGVpZjEwU0VJTWVzc2FnZUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJTjRoZWlmMTFIZWlmQ29udGV4dDVJbWFnZUVOU185YWxsb2NhdG9ySVMzX0VFRUUARGVyaXZlZCBpbWFnZSBkb2VzIG5vdCByZWZlcmVuY2UgYW55IG90aGVyIGltYWdlIGl0ZW1zAGltZ2luZm8AZGVjb2RlX2ltYWdlX3BsYW5hcgBpbWdfd2lkdGggPj0gMABpbWdfaGVpZ2h0ID49IDAATm8gaXJlZiBib3ggYXZhaWxhYmxlLCBidXQgbmVlZGVkIGZvciBpb3ZsIGltYWdlAE51bWJlciBvZiBpbWFnZSBvZmZzZXRzIGRvZXMgbm90IG1hdGNoIHRoZSBudW1iZXIgb2YgaW1hZ2UgcmVmZXJlbmNlcwBObyBpcmVmIGJveCBhdmFpbGFibGUsIGJ1dCBuZWVkZWQgZm9yIGlkZW4gaW1hZ2UAJ2lkZW4nIGltYWdlIHdpdGggbW9yZSB0aGFuIG9uZSByZWZlcmVuY2UgaW1hZ2UATm8gaXJlZiBib3ggYXZhaWxhYmxlLCBidXQgbmVlZGVkIGZvciBncmlkIGltYWdlAG1fcm93cyA8PSAyNTYAZ2V0X3Jvd3MAbV9jb2x1bW5zIDw9IDI1NgBnZXRfY29sdW1ucwBUaWxlZCBpbWFnZSB3aXRoIAA9ACB0aWxlcywgYnV0IG9ubHkgACB0aWxlIGltYWdlcyBpbiBmaWxlAFRpbGUgaW1hZ2UgSUQ9ACBpcyBub3QgYSBwcm9wZXIgaW1hZ2UuACFpbWFnZV9yZWZlcmVuY2VzLmVtcHR5KCkAZGVjb2RlX2Z1bGxfZ3JpZF9pbWFnZQBObyBwaXhpIGluZm9ybWF0aW9uIGZvciBsdW1hIGNoYW5uZWwuAERpZmZlcmVudCBudW1iZXIgb2YgYml0cyBwZXIgcGl4ZWwgaW4gZWFjaCBjaGFubmVsLgBOb25leGlzdGVudCBncmlkIGltYWdlIHJlZmVyZW5jZWQAc3JjX3dpZHRoID49IDAAZGVjb2RlX2FuZF9wYXN0ZV90aWxlX2ltYWdlAHNyY19oZWlnaHQgPj0gMABJbWFnZSB0aWxlIGhhcyBkaWZmZXJlbnQgY2hyb21hIGZvcm1hdCB0aGFuIGNvbWJpbmVkIGltYWdlAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSU40aGVpZjM2U0VJTWVzc2FnZV9kZXB0aF9yZXByZXNlbnRhdGlvbl9pbmZvRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQB3YW50X2FscGhhICYmICFoYXNfYWxwaGEAaGVpZl9jb2xvcmNvbnZlcnNpb24uY2MAY29udmVydF9jb2xvcnNwYWNlADE4T3BfUkdCX3RvX1JHQjI0XzMyAE40aGVpZjI0Q29sb3JDb252ZXJzaW9uT3BlcmF0aW9uRQAyME9wX1lDYkNyNDIwX3RvX1JHQjI0ADIwT3BfWUNiQ3I0MjBfdG9fUkdCMzIAMjVPcF9SR0JfSERSX3RvX1JSR0dCQmFhX0JFADIxT3BfUkdCX3RvX1JSR0dCQmFhX0JFADI1T3BfUlJHR0JCYWFfQkVfdG9fUkdCX0hEUgAyN09wX1JSR0dCQmFhX3N3YXBfZW5kaWFubmVzcwAxOU9wX21vbm9fdG9fWUNiQ3I0MjAAMTlPcF9tb25vX3RvX1JHQjI0XzMyADIwT3BfUkdCMjRfMzJfdG9fWUNiQ3IAdGFyZ2V0X3N0YXRlLm5jbHhfcHJvZmlsZQB0YXJnZXRfc3RhdGUubmNseF9wcm9maWxlLT5nZXRfbWF0cml4X2NvZWZmaWNpZW50cygpID09IDAAMjdPcF9SR0IyNF8zMl90b19ZQ2JDcjQ0NF9HQlIAMTlPcF9kcm9wX2FscGhhX3BsYW5lADE2T3BfdG9faGRyX3BsYW5lcwAxNk9wX3RvX3Nkcl9wbGFuZXMAMjdPcF9SUkdHQkJ4eF9IRFJfdG9fWUNiQ3I0MjAAMjNPcF9ZQ2JDcjQyMF90b19SUkdHQkJhYQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkyN09wX1JSR0dCQnh4X0hEUl90b19ZQ2JDcjQyME5TXzlhbGxvY2F0b3JJUzFfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNk9wX3RvX3Nkcl9wbGFuZXNOU185YWxsb2NhdG9ySVMxX0VFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTZPcF90b19oZHJfcGxhbmVzTlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTE5T3BfZHJvcF9hbHBoYV9wbGFuZU5TXzlhbGxvY2F0b3JJUzFfRUVFRQAxNU9wX1JHQl90b19ZQ2JDckl0RQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNU9wX1JHQl90b19ZQ2JDckl0RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQAxNU9wX1JHQl90b19ZQ2JDckloRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNU9wX1JHQl90b19ZQ2JDckloRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkyN09wX1JHQjI0XzMyX3RvX1lDYkNyNDQ0X0dCUk5TXzlhbGxvY2F0b3JJUzFfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkyME9wX1JHQjI0XzMyX3RvX1lDYkNyTlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTI1T3BfUlJHR0JCYWFfQkVfdG9fUkdCX0hEUk5TXzlhbGxvY2F0b3JJUzFfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkyN09wX1JSR0dCQmFhX3N3YXBfZW5kaWFubmVzc05TXzlhbGxvY2F0b3JJUzFfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxOU9wX21vbm9fdG9fUkdCMjRfMzJOU185YWxsb2NhdG9ySVMxX0VFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTlPcF9tb25vX3RvX1lDYkNyNDIwTlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTIxT3BfUkdCX3RvX1JSR0dCQmFhX0JFTlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTI1T3BfUkdCX0hEUl90b19SUkdHQkJhYV9CRU5TXzlhbGxvY2F0b3JJUzFfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkyM09wX1lDYkNyNDIwX3RvX1JSR0dCQmFhTlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTIwT3BfWUNiQ3I0MjBfdG9fUkdCMzJOU185YWxsb2NhdG9ySVMxX0VFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMjBPcF9ZQ2JDcjQyMF90b19SR0IyNE5TXzlhbGxvY2F0b3JJUzFfRUVFRQAxNU9wX1lDYkNyX3RvX1JHQkloRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNU9wX1lDYkNyX3RvX1JHQkloRU5TXzlhbGxvY2F0b3JJUzJfRUVFRQAxNU9wX1lDYkNyX3RvX1JHQkl0RQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxNU9wX1lDYkNyX3RvX1JHQkl0RU5TXzlhbGxvY2F0b3JJUzJfRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfZW1wbGFjZUkxOE9wX1JHQl90b19SR0IyNF8zMk5TXzlhbGxvY2F0b3JJUzFfRUVFRQAhY2hhbm5lbHMuZW1wdHkoKQBDYW5ub3QgYWxsb2NhdGUgbWVtb3J5IGZvciBpbWFnZSBwbGFuZQBDaGFubmVscyB3aXRoIGRpZmZlcmVudCBudW1iZXIgb2YgYml0cyBwZXIgcGl4ZWwgYXJlIG5vdCBzdXBwb3J0ZWQAU3VjY2VzcwBsaWJkZTI2NSBIRVZDIGRlY29kZXIALCB2ZXJzaW9uIAAxLjAuOABkZTI2NS5jYwBkZTI2NV9zZXRfcGFyYW1ldGVyX2Jvb2wAY2hhbm5lbD49MCAmJiBjaGFubmVsIDw9IDIAZGUyNjVfZ2V0X2ltYWdlX3BsYW5lADE1ZGVjb2Rlcl9jb250ZXh0ADEyYmFzZV9jb250ZXh0ADExZXJyb3JfcXVldWUAdGhyZWFkX2NvbnRleHRzPT1OVUxMAGRlY2N0eC5jYwBhbGxvY2F0ZV90aHJlYWRfY29udGV4dHMATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTl2aWRlb19wYXJhbWV0ZXJfc2V0TlNfOWFsbG9jYXRvcklTMV9FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9lbXBsYWNlSTE3c2VxX3BhcmFtZXRlcl9zZXROU185YWxsb2NhdG9ySVMxX0VFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTdwaWNfcGFyYW1ldGVyX3NldE5TXzlhbGxvY2F0b3JJUzFfRUVFRQBkZWNvZGVfc2xpY2VfdW5pdF9wYXJhbGxlbABpbWctPm51bV90aHJlYWRzX2FjdGl2ZSgpID09IDAAZGVjb2RlX3NsaWNlX3VuaXRfdGlsZXMAbiA8IG5UaHJlYWRDb250ZXh0cwAuL2RlY2N0eC5oAGdldF90aHJlYWRfY29udGV4dABkZWNvZGVfc2xpY2VfdW5pdF9XUFAAUFBTICVkIGhhcyBub3QgYmVlbiByZWFkCgBwcm9jZXNzX3NsaWNlX3NlZ21lbnRfaGVhZGVyAGhkci0+bnVtX3JlZl9pZHhfbDBfYWN0aXZlIDw9IDE2AGNvbnN0cnVjdF9yZWZlcmVuY2VfcGljdHVyZV9saXN0cwBoZHItPm51bV9yZWZfaWR4X2wxX2FjdGl2ZSA8PSAxNgBkcGIuaGFzX2ZyZWVfZHBiX3BpY3R1cmUodHJ1ZSkAZ2VuZXJhdGVfdW5hdmFpbGFibGVfcmVmZXJlbmNlX3BpY3R1cmUAaWR4Pj0wAG5hbABkZWNvZGUAZmFsbGJhY2stZGN0LmNjAHRyYW5zZm9ybV9za2lwXzhfZmFsbGJhY2sAdHJhbnNmb3JtX3NraXBfMTZfZmFsbGJhY2sAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBaWlhVUk5JQz02LiYfFg0E/PPq4drSysO9t7Kuq6implpXUEY5KxkJ9+fVx7qwqaamqbC6x9Xn9wkZKzlGUFdaWlJDLhb84cq3q6aossPa8w0mPU5YWlVJNh8E6tK9rqZZSzIS7s61p6e1zu4SMktZWUsyEu7Otaentc7uEjJLWVhDH/PKrqay0vwmSVpVPRbqw6umt9oELk5aUjYN4b2oVzkJ1bCmuucZRlpQK/fHqanH9ytQWkYZ57qmsNUJOVdVLvO9prfqJlJYNvzDprLhH05aPQTKqK7aFklaQw3Sq1Mk3K2t3CRTUyTcra3cJFNTJNytrdwkU1Mk3K2t3CRTUhbKpsMNTlUf0qa9BElYJtqot/xDWi7hq7LzPVo26q5QCbqp5zlaK9WmxxlXRvewsPdGVxnHptUrWjnnqboJUE78rrcNVUPqqMMfWjbaptIuWibKpuE9WBa9q/NJUgSyS+6nzjJZErW1ElkyzqfuS0vup84yWRK1tRJZMs6n7ktJ4abqTkPapvNSPdKo/FU2yqsEWC7Drg1aJr2yFloft0bVqQlaGbDHOVDnpvdXK7q6K1f3pudQOcewGVoJqdVGQ8qyJlXqpgRaDajhUi63wz1J0q4fWPOm/FoWq9pONr1AwMBAQMDAQEDAwEBAwMBAQMDAQEDAwEBAwMBAQMDAQD230lIfqPNa/KYWVdqyNkO9yk4mq+paBKYNWOGuLknDObDnWvepK0a61VcJphlQx8dQGaYJV9W6Riup91rnsDk2q/xY0sNSDaYmQ7LqWuG3SR+mFk692lrzrj0uqARVyjKnEku17lnOzlnutUsSpzIypxJLte5Zzs5Z7rVLEqcyLqYmNqYfPagWQ6sNSa4ETrL8UrfzVb3qWMPhWsraWtIrpjkZqUYJsFD3ulfnx1rV1VrH51e691CwCUapGTmmKyaoSfy9WtLhVbINPaY2Fq5S6spaw/NOqx8upkMEt1jaJK1T3NxTrSQkrVPc3FOtJCStU9zcU60kJK1T3NxTrSQfslrDBDaoUtrqSaZD89JVqy4NvVq3FiauWMr8PaZO4Rm6WrArCcdXqTn31VCmRufnRqZQ1fc5qVfHCSuwWroZFsNVpkna/C6yWq428+FDqFi9Hw3KUqZO0gQmt1qrPeoSzkunWbUy7u4ytVmnS84SEs5Lp1m1Mu7uMrVZp0vOEg3aPbJYplW3NuEEFtJDrlqmUr0u6vwfykmrWqhOwybzCecrx0awV6ZaqVC6OdUZ9/cZ1Tm6UKlaplewRscr5wkE8xbhJtI2w0O3Tq5VqFqmWqZYq1KySb09yi7aH+oN/Ch3aWR0aCYxKT09MABmYWxsYmFjay1tb3Rpb24uY2MAcHV0X3Vud2VpZ2h0ZWRfcHJlZF84X2ZhbGxiYWNrAGxvZzJXRD49MQBwdXRfd2VpZ2h0ZWRfcHJlZF84X2ZhbGxiYWNrAHB1dF93ZWlnaHRlZF9iaXByZWRfOF9mYWxsYmFjawBwdXRfd2VpZ2h0ZWRfcHJlZF9hdmdfOF9mYWxsYmFjawBwdXRfdW53ZWlnaHRlZF9wcmVkXzE2X2ZhbGxiYWNrAHB1dF93ZWlnaHRlZF9wcmVkXzE2X2ZhbGxiYWNrAHB1dF93ZWlnaHRlZF9iaXByZWRfMTZfZmFsbGJhY2sAcHV0X3dlaWdodGVkX3ByZWRfYXZnXzE2X2ZhbGxiYWNrACFyZW9yZGVyX291dHB1dF9xdWV1ZS5lbXB0eSgpAGRwYi5jYwBvdXRwdXRfbmV4dF9waWN0dXJlX2luX3Jlb3JkZXJfYnVmZmVyAG5ld19pbWFnZQBpbWctPkJpdERlcHRoX1kgPj0gOCAmJiBpbWctPkJpdERlcHRoX1kgPD0gMTYAaW1hZ2UuY2MAZGUyNjVfaW1hZ2VfZ2V0X2J1ZmZlcgBpbWctPkJpdERlcHRoX0MgPj0gOCAmJiBpbWctPkJpdERlcHRoX0MgPD0gMTYAYWxsb2NfaW1hZ2UAc3BzLT5TdWJXaWR0aEMgPT0gU3ViV2lkdGhDAHNwcy0+U3ViSGVpZ2h0QyA9PSBTdWJIZWlnaHRDAGZpcnN0ICUgMiA9PSAwAGNvcHlfbGluZXNfZnJvbQBlbmQgJSAyID09IDAAblRocmVhZHNSdW5uaW5nID49IDAAdGhyZWFkX2ZpbmlzaGVzAC4vaW1hZ2UuaABwZW5kaW5nX2lucHV0X05BTCA9PSBOVUxMAG5hbC1wYXJzZXIuY2MAcHVzaF9OQUwALS0tLS0tLS0tLSBQUFMgcmFuZ2UtZXh0ZW5zaW9uIC0tLS0tLS0tLS0KAGxvZzJfbWF4X3RyYW5zZm9ybV9za2lwX2Jsb2NrX3NpemUgICAgICA6ICVkCgBjcm9zc19jb21wb25lbnRfcHJlZGljdGlvbl9lbmFibGVkX2ZsYWcgOiAlZAoAY2hyb21hX3FwX29mZnNldF9saXN0X2VuYWJsZWRfZmxhZyAgICAgIDogJWQKAGRpZmZfY3VfY2hyb21hX3FwX29mZnNldF9kZXB0aCAgICAgICAgICA6ICVkCgBjaHJvbWFfcXBfb2Zmc2V0X2xpc3RfbGVuICAgICAgICAgICAgICAgOiAlZAoAY2JfcXBfb2Zmc2V0X2xpc3RbJWRdICAgICAgICAgICAgICAgICAgICA6ICVkCgBjcl9xcF9vZmZzZXRfbGlzdFslZF0gICAgICAgICAgICAgICAgICAgIDogJWQKAGxvZzJfc2FvX29mZnNldF9zY2FsZV9sdW1hICAgICAgICAgICAgICA6ICVkCgBsb2cyX3Nhb19vZmZzZXRfc2NhbGVfY2hyb21hICAgICAgICAgICAgOiAlZAoAdGlsZVg+PTAgJiYgdGlsZVk+PTAAcHBzLmNjAHNldF9kZXJpdmVkX3ZhbHVlcwAtLS0tLS0tLS0tLS0tLS0tLSBQUFMgLS0tLS0tLS0tLS0tLS0tLS0KAHBpY19wYXJhbWV0ZXJfc2V0X2lkICAgICAgIDogJWQKAHNlcV9wYXJhbWV0ZXJfc2V0X2lkICAgICAgIDogJWQKAGRlcGVuZGVudF9zbGljZV9zZWdtZW50c19lbmFibGVkX2ZsYWcgOiAlZAoAc2lnbl9kYXRhX2hpZGluZ19mbGFnICAgICAgOiAlZAoAY2FiYWNfaW5pdF9wcmVzZW50X2ZsYWcgICAgOiAlZAoAbnVtX3JlZl9pZHhfbDBfZGVmYXVsdF9hY3RpdmUgOiAlZAoAbnVtX3JlZl9pZHhfbDFfZGVmYXVsdF9hY3RpdmUgOiAlZAoAcGljX2luaXRfcXAgICAgICAgICAgICAgICAgOiAlZAoAY29uc3RyYWluZWRfaW50cmFfcHJlZF9mbGFnOiAlZAoAdHJhbnNmb3JtX3NraXBfZW5hYmxlZF9mbGFnOiAlZAoAY3VfcXBfZGVsdGFfZW5hYmxlZF9mbGFnICAgOiAlZAoAZGlmZl9jdV9xcF9kZWx0YV9kZXB0aCAgICAgOiAlZAoAcGljX2NiX3FwX29mZnNldCAgICAgICAgICAgICA6ICVkCgBwaWNfY3JfcXBfb2Zmc2V0ICAgICAgICAgICAgIDogJWQKAHBwc19zbGljZV9jaHJvbWFfcXBfb2Zmc2V0c19wcmVzZW50X2ZsYWcgOiAlZAoAd2VpZ2h0ZWRfcHJlZF9mbGFnICAgICAgICAgICA6ICVkCgB3ZWlnaHRlZF9iaXByZWRfZmxhZyAgICAgICAgIDogJWQKAG91dHB1dF9mbGFnX3ByZXNlbnRfZmxhZyAgICAgOiAlZAoAdHJhbnNxdWFudF9ieXBhc3NfZW5hYmxlX2ZsYWc6ICVkCgB0aWxlc19lbmFibGVkX2ZsYWcgICAgICAgICAgIDogJWQKAGVudHJvcHlfY29kaW5nX3N5bmNfZW5hYmxlZF9mbGFnOiAlZAoAbnVtX3RpbGVfY29sdW1ucyAgICA6ICVkCgBudW1fdGlsZV9yb3dzICAgICAgIDogJWQKAHVuaWZvcm1fc3BhY2luZ19mbGFnOiAlZAoAdGlsZSBjb2x1bW4gYm91bmRhcmllczogAHRpbGUgcm93IGJvdW5kYXJpZXM6IAAqJWQgAGxvb3BfZmlsdGVyX2Fjcm9zc190aWxlc19lbmFibGVkX2ZsYWcgOiAlZAoAcHBzX2xvb3BfZmlsdGVyX2Fjcm9zc19zbGljZXNfZW5hYmxlZF9mbGFnOiAlZAoAZGVibG9ja2luZ19maWx0ZXJfY29udHJvbF9wcmVzZW50X2ZsYWc6ICVkCgBkZWJsb2NraW5nX2ZpbHRlcl9vdmVycmlkZV9lbmFibGVkX2ZsYWc6ICVkCgBwaWNfZGlzYWJsZV9kZWJsb2NraW5nX2ZpbHRlcl9mbGFnOiAlZAoAYmV0YV9vZmZzZXQ6ICAlZAoAdGNfb2Zmc2V0OiAgICAlZAoAcGljX3NjYWxpbmdfbGlzdF9kYXRhX3ByZXNlbnRfZmxhZzogJWQKAGxpc3RzX21vZGlmaWNhdGlvbl9wcmVzZW50X2ZsYWc6ICVkCgBsb2cyX3BhcmFsbGVsX21lcmdlX2xldmVsICAgICAgOiAlZAoAbnVtX2V4dHJhX3NsaWNlX2hlYWRlcl9iaXRzICAgIDogJWQKAHNsaWNlX3NlZ21lbnRfaGVhZGVyX2V4dGVuc2lvbl9wcmVzZW50X2ZsYWcgOiAlZAoAcHBzX2V4dGVuc2lvbl9mbGFnICAgICAgICAgICAgOiAlZAoAcHBzX3JhbmdlX2V4dGVuc2lvbl9mbGFnICAgICAgOiAlZAoAcHBzX211bHRpbGF5ZXJfZXh0ZW5zaW9uX2ZsYWcgOiAlZAoAcHBzX2V4dGVuc2lvbl82Yml0cyAgICAgICAgICAgOiAlZAoATG9nMk1pbkN1UXBEZWx0YVNpemUgICAgICAgICAgOiAlZAoATG9nMk1pbkN1Q2hyb21hUXBPZmZzZXRTaXplIChSRXh0KSA6ICVkCgBMb2cyTWF4VHJhbnNmb3JtU2tpcFNpemUgICAgKFJFeHQpIDogJWQKAHNhby0lZAAxNXRocmVhZF90YXNrX3NhbwAxMXRocmVhZF90YXNrAHNsaWNlLXNlZ21lbnQtJWQ7JWQAaW5pdFR5cGUgPj0gMCAmJiBpbml0VHlwZSA8PSAyAHNsaWNlLmNjAGluaXRpYWxpemVfQ0FCQUNfbW9kZWxzAGRlY29kZV9wYXJ0X21vZGUAAAECAgICAwUHCAoMDQ8REhMUFRYXFxgYGRkaGxscHB0dHh9yZWFkX2NvZGluZ191bml0AFByZWRNb2RlID09IGN1UHJlZE1vZGUAcmVhZF90cmFuc2Zvcm1fdHJlZQBjb250ZXh0ID49IDAgJiYgY29udGV4dCA8PSAyAGRlY29kZV9zcGxpdF90cmFuc2Zvcm1fZmxhZwAhKHRyYWZvRGVwdGg9PTAgJiYgbG9nMlRyYWZvU2l6ZT09MikAY2JmX2NiICE9IC0xAHJlYWRfdHJhbnNmb3JtX3VuaXQAY2JmX2NyICE9IC0xAGNiZl9sdW1hICE9IC0xAHg8c3BzLT5QaWNXaWR0aEluTWluUFVzAHNldF9JbnRyYVByZWRNb2RlQwB5PHNwcy0+UGljSGVpZ2h0SW5NaW5QVXMAaWR4PGludHJhUHJlZE1vZGVDLmRhdGFfc2l6ZQAyNXRocmVhZF90YXNrX3NsaWNlX3NlZ21lbnQAY3RiLXJvdy0lZAAxOXRocmVhZF90YXNrX2N0Yl9yb3cAcHBzAHJlYWRfcHJlZF93ZWlnaHRfdGFibGUAc3BzAHBwcy0+cHBzX3JlYWQAZHVtcF9zbGljZV9zZWdtZW50X2hlYWRlcgBzcHMtPnNwc19yZWFkAC0tLS0tLS0tLS0tLS0tLS0tIFNMSUNFIC0tLS0tLS0tLS0tLS0tLS0tCgBmaXJzdF9zbGljZV9zZWdtZW50X2luX3BpY19mbGFnICAgICAgOiAlZAoAbm9fb3V0cHV0X29mX3ByaW9yX3BpY3NfZmxhZyAgICAgICAgIDogJWQKAHNsaWNlX3BpY19wYXJhbWV0ZXJfc2V0X2lkICAgICAgICAgICA6ICVkCgBkZXBlbmRlbnRfc2xpY2Vfc2VnbWVudF9mbGFnICAgICAgICAgOiAlZAoAc2xpY2Vfc2VnbWVudF9hZGRyZXNzICAgICAgICAgICAgICAgIDogJWQKAHNsaWNlX3R5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICVjCgBwaWNfb3V0cHV0X2ZsYWcgICAgICAgICAgICAgICAgICAgICAgOiAlZAoAY29sb3VyX3BsYW5lX2lkICAgICAgICAgICAgICAgICAgICAgIDogJWQKAHNsaWNlX3BpY19vcmRlcl9jbnRfbHNiICAgICAgICAgICAgICA6ICVkCgBzaG9ydF90ZXJtX3JlZl9waWNfc2V0X3Nwc19mbGFnICAgICAgOiAlZAoAc2hvcnRfdGVybV9yZWZfcGljX3NldF9pZHggICAgICAgICAgIDogJWQKAG51bV9sb25nX3Rlcm1fc3BzICAgICAgICAgICAgICAgICAgICAgICAgOiAlZAoAbnVtX2xvbmdfdGVybV9waWNzICAgICAgICAgICAgICAgICAgICAgICA6ICVkCgBzbGljZV90ZW1wb3JhbF9tdnBfZW5hYmxlZF9mbGFnIDogJWQKAHNsaWNlX3Nhb19sdW1hX2ZsYWcgICAgICAgICAgICAgOiAlZAoAc2xpY2Vfc2FvX2Nocm9tYV9mbGFnICAgICAgICAgICA6ICVkCgBudW1fcmVmX2lkeF9hY3RpdmVfb3ZlcnJpZGVfZmxhZyA6ICVkCgAoZnJvbSBQUFMpAG51bV9yZWZfaWR4X2wwX2FjdGl2ZSAgICAgICAgICA6ICVkICVzCgBudW1fcmVmX2lkeF9sMV9hY3RpdmUgICAgICAgICAgOiAlZCAlcwoAcmVmX3BpY19saXN0X21vZGlmaWNhdGlvbl9mbGFnX2wwIDogJWQKACAgJWQ6ICVkCgByZWZfcGljX2xpc3RfbW9kaWZpY2F0aW9uX2ZsYWdfbDEgOiAlZAoAbXZkX2wxX3plcm9fZmxhZyAgICAgICAgICAgICAgIDogJWQKAGNhYmFjX2luaXRfZmxhZyAgICAgICAgICAgICAgICA6ICVkCgBjb2xsb2NhdGVkX2Zyb21fbDBfZmxhZyAgICAgICAgOiAlZAoAY29sbG9jYXRlZF9yZWZfaWR4ICAgICAgICAgICAgIDogJWQKAGx1bWFfbG9nMl93ZWlnaHRfZGVub20gICAgICAgICA6ICVkCgBDaHJvbWFMb2cyV2VpZ2h0RGVub20gICAgICAgICAgOiAlZAoATHVtYVdlaWdodF9MJWRbJWRdICAgICAgICAgICAgIDogJWQKAGx1bWFfb2Zmc2V0X2wlZFslZF0gICAgICAgICAgICA6ICVkCgBDaHJvbWFXZWlnaHRfTCVkWyVkXVslZF0gICAgICAgIDogJWQKAENocm9tYU9mZnNldF9MJWRbJWRdWyVkXSAgICAgICAgOiAlZAoAZml2ZV9taW51c19tYXhfbnVtX21lcmdlX2NhbmQgIDogJWQKAHNsaWNlX3FwX2RlbHRhICAgICAgICAgOiAlZAoAc2xpY2VfY2JfcXBfb2Zmc2V0ICAgICA6ICVkCgBzbGljZV9jcl9xcF9vZmZzZXQgICAgIDogJWQKAGRlYmxvY2tpbmdfZmlsdGVyX292ZXJyaWRlX2ZsYWcgOiAlZAoAKG92ZXJyaWRlKQAoZnJvbSBwcHMpAHNsaWNlX2RlYmxvY2tpbmdfZmlsdGVyX2Rpc2FibGVkX2ZsYWcgOiAlZCAlcwoAc2xpY2VfYmV0YV9vZmZzZXQgIDogJWQKAHNsaWNlX3RjX29mZnNldCAgICA6ICVkCgBzbGljZV9sb29wX2ZpbHRlcl9hY3Jvc3Nfc2xpY2VzX2VuYWJsZWRfZmxhZyA6ICVkCgBudW1fZW50cnlfcG9pbnRfb2Zmc2V0cyAgICA6ICVkCgBvZmZzZXRfbGVuICAgICAgICAgICAgICAgICA6ICVkCgBlbnRyeSBwb2ludCBbJWldIDogJWQKAAABBAUCAwQFBgYICAcHCGNjdHhJZHhMb29rdXBbbG9nMnctMl1bY0lkeF1bc2NhbklkeF1bcHJldkNzYmZdW3hDKyh5Qzw8bG9nMncpXSA9PSBjdHhJZHhJbmMAYWxsb2NfYW5kX2luaXRfc2lnbmlmaWNhbnRfY29lZmZfY3R4SWR4X2xvb2t1cFRhYmxlAHJlZjw3AHNwcy5jYwBTUFMgZXJyb3I6IHRyYW5zZm9ybSBoaWVyYXJjaHkgZGVwdGggKGludGVyKSA+IENUQiBzaXplIC0gbWluIFRCIHNpemUKAFNQUyBlcnJvcjogdHJhbnNmb3JtIGhpZXJhcmNoeSBkZXB0aCAoaW50cmEpID4gQ1RCIHNpemUgLSBtaW4gVEIgc2l6ZQoAU1BTIGVycm9yOiBDQiBhbGlnbm1lbnQKAFNQUyBlcnJvcjogVEIgPiBDQgoAU1BTIGVycm9yOiBUQl9tYXggPiAzMiBvciBDVEIKAFNQUyBlcnJvcjogYml0ZGVwdGggWSBub3QgaW4gWzg7MTZdCgBTUFMgZXJyb3I6IGJpdGRlcHRoIEMgbm90IGluIFs4OzE2XQoAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAREBEQERIREhIREhUTFBUUExUYFhYYGBYWGBkZGx4bGRkdHyMjHx0kKSwpJC82Ni9BRkFYWHMQEBAQEBAQEBAQERERERESEhISEhIUFBQUFBQUGBgYGBgYGBgZGRkZGRkZHBwcHBwcISEhISEpKSkpNjY2R0dbZmlsbF9zY2FsaW5nX2ZhY3RvcgBzY2FsaW5nX2xpc3RfcHJlZF9tYXRyaXhfaWRfZGVsdGE9PTEAcmVhZF9zY2FsaW5nX2xpc3QALS0tLS0tLS0tLS0tLS0tLS0gU1BTIC0tLS0tLS0tLS0tLS0tLS0tCgB2aWRlb19wYXJhbWV0ZXJfc2V0X2lkICA6ICVkCgBzcHNfbWF4X3N1Yl9sYXllcnMgICAgICA6ICVkCgBzcHNfdGVtcG9yYWxfaWRfbmVzdGluZ19mbGFnIDogJWQKAHNlcV9wYXJhbWV0ZXJfc2V0X2lkICAgIDogJWQKADQ6NDo0AHVua25vd24AbW9ub2Nocm9tZQA0OjI6MAA0OjI6MgBjaHJvbWFfZm9ybWF0X2lkYyAgICAgICA6ICVkICglcykKAHNlcGFyYXRlX2NvbG91cl9wbGFuZV9mbGFnIDogJWQKAHBpY193aWR0aF9pbl9sdW1hX3NhbXBsZXMgIDogJWQKAHBpY19oZWlnaHRfaW5fbHVtYV9zYW1wbGVzIDogJWQKAGNvbmZvcm1hbmNlX3dpbmRvd19mbGFnICAgIDogJWQKAGNvbmZfd2luX2xlZnRfb2Zmc2V0ICA6ICVkCgBjb25mX3dpbl9yaWdodF9vZmZzZXQgOiAlZAoAY29uZl93aW5fdG9wX29mZnNldCAgIDogJWQKAGNvbmZfd2luX2JvdHRvbV9vZmZzZXQ6ICVkCgBiaXRfZGVwdGhfbHVtYSAgIDogJWQKAGJpdF9kZXB0aF9jaHJvbWEgOiAlZAoAbG9nMl9tYXhfcGljX29yZGVyX2NudF9sc2IgOiAlZAoAc3BzX3N1Yl9sYXllcl9vcmRlcmluZ19pbmZvX3ByZXNlbnRfZmxhZyA6ICVkCgBsb2cyX21pbl9sdW1hX2NvZGluZ19ibG9ja19zaXplIDogJWQKAGxvZzJfZGlmZl9tYXhfbWluX2x1bWFfY29kaW5nX2Jsb2NrX3NpemUgOiAlZAoAbG9nMl9taW5fdHJhbnNmb3JtX2Jsb2NrX3NpemUgICA6ICVkCgBsb2cyX2RpZmZfbWF4X21pbl90cmFuc2Zvcm1fYmxvY2tfc2l6ZSA6ICVkCgBtYXhfdHJhbnNmb3JtX2hpZXJhcmNoeV9kZXB0aF9pbnRlciA6ICVkCgBtYXhfdHJhbnNmb3JtX2hpZXJhcmNoeV9kZXB0aF9pbnRyYSA6ICVkCgBzY2FsaW5nX2xpc3RfZW5hYmxlX2ZsYWcgOiAlZAoATGF5ZXIgJWQKACAgc3BzX21heF9kZWNfcGljX2J1ZmZlcmluZyAgICAgIDogJWQKACAgc3BzX21heF9udW1fcmVvcmRlcl9waWNzICAgICAgIDogJWQKACAgc3BzX21heF9sYXRlbmN5X2luY3JlYXNlX3BsdXMxIDogJWQKAHNwc19zY2FsaW5nX2xpc3RfZGF0YV9wcmVzZW50X2ZsYWcgOiAlZAoAc2NhbGluZyBsaXN0IGxvZ2dpbmcgb3V0cHV0IG5vdCBpbXBsZW1lbnRlZABhbXBfZW5hYmxlZF9mbGFnICAgICAgICAgICAgICAgICAgICA6ICVkCgBzYW1wbGVfYWRhcHRpdmVfb2Zmc2V0X2VuYWJsZWRfZmxhZyA6ICVkCgBwY21fZW5hYmxlZF9mbGFnICAgICAgICAgICAgICAgICAgICA6ICVkCgBwY21fc2FtcGxlX2JpdF9kZXB0aF9sdW1hICAgICA6ICVkCgBwY21fc2FtcGxlX2JpdF9kZXB0aF9jaHJvbWEgICA6ICVkCgBsb2cyX21pbl9wY21fbHVtYV9jb2RpbmdfYmxvY2tfc2l6ZSA6ICVkCgBsb2cyX2RpZmZfbWF4X21pbl9wY21fbHVtYV9jb2RpbmdfYmxvY2tfc2l6ZSA6ICVkCgBwY21fbG9vcF9maWx0ZXJfZGlzYWJsZV9mbGFnICA6ICVkCgBudW1fc2hvcnRfdGVybV9yZWZfcGljX3NldHMgOiAlZAoAbG9uZ190ZXJtX3JlZl9waWNzX3ByZXNlbnRfZmxhZyA6ICVkCgByZWZfcGljX3NldFsgJTJkIF06IABudW1fbG9uZ190ZXJtX3JlZl9waWNzX3NwcyA6ICVkCgBsdF9yZWZfcGljX3BvY19sc2Jfc3BzWyVkXSA6ICVkICAgKHVzZWRfYnlfY3Vycl9waWNfbHRfc3BzX2ZsYWc9JWQpCgBzcHNfdGVtcG9yYWxfbXZwX2VuYWJsZWRfZmxhZyAgICAgIDogJWQKAHN0cm9uZ19pbnRyYV9zbW9vdGhpbmdfZW5hYmxlX2ZsYWcgOiAlZAoAdnVpX3BhcmFtZXRlcnNfcHJlc2VudF9mbGFnICAgICAgICA6ICVkCgBzcHNfZXh0ZW5zaW9uX3ByZXNlbnRfZmxhZyAgICA6ICVkCgBzcHNfcmFuZ2VfZXh0ZW5zaW9uX2ZsYWcgICAgICA6ICVkCgBzcHNfbXVsdGlsYXllcl9leHRlbnNpb25fZmxhZyA6ICVkCgBzcHNfZXh0ZW5zaW9uXzZiaXRzICAgICAgICAgICA6ICVkCgBDdGJTaXplWSAgICAgOiAlZAoATWluQ2JTaXplWSAgIDogJWQKAE1heENiU2l6ZVkgICA6ICVkCgBNaW5UQlNpemVZICAgOiAlZAoATWF4VEJTaXplWSAgIDogJWQKAFBpY1dpZHRoSW5DdGJzWSAgICAgICAgIDogJWQKAFBpY0hlaWdodEluQ3Ric1kgICAgICAgIDogJWQKAFN1YldpZHRoQyAgICAgICAgICAgICAgIDogJWQKAFN1YkhlaWdodEMgICAgICAgICAgICAgIDogJWQKAC0tLS0tLS0tLS0tLS0tLS0tIFNQUy1yYW5nZS1leHRlbnNpb24gLS0tLS0tLS0tLS0tLS0tLS0KAHRyYW5zZm9ybV9za2lwX3JvdGF0aW9uX2VuYWJsZWRfZmxhZyAgICA6ICVkCgB0cmFuc2Zvcm1fc2tpcF9jb250ZXh0X2VuYWJsZWRfZmxhZyAgICAgOiAlZAoAaW1wbGljaXRfcmRwY21fZW5hYmxlZF9mbGFnICAgICAgICAgICAgIDogJWQKAGV4cGxpY2l0X3JkcGNtX2VuYWJsZWRfZmxhZyAgICAgICAgICAgICA6ICVkCgBleHRlbmRlZF9wcmVjaXNpb25fcHJvY2Vzc2luZ19mbGFnICAgICAgOiAlZAoAaW50cmFfc21vb3RoaW5nX2Rpc2FibGVkX2ZsYWcgICAgICAgICAgIDogJWQKAGhpZ2hfcHJlY2lzaW9uX29mZnNldHNfZW5hYmxlZF9mbGFnICAgICA6ICVkCgBwZXJzaXN0ZW50X3JpY2VfYWRhcHRhdGlvbl9lbmFibGVkX2ZsYWcgOiAlZAoAY2FiYWNfYnlwYXNzX2FsaWdubWVudF9lbmFibGVkX2ZsYWcgICAgIDogJWQKAHRyYW5zZm9ybS5jYwAwAHNjYWxlX2NvZWZmaWNpZW50c19pbnRlcm5hbAByZHBjbU1vZGU9PTAARVJSOiAASU5GTzogAHZwcy5jYwBhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAGZpcnN0TGF5ZXJSZWFkIDwgTUFYX1RFTVBPUkFMX1NVQkxBWUVSUwByZWFkAC0tLS0tLS0tLS0tLS0tLS0tIFZQUyAtLS0tLS0tLS0tLS0tLS0tLQoAdmlkZW9fcGFyYW1ldGVyX3NldF9pZCAgICAgICAgICAgICAgICA6ICVkCgB2cHNfbWF4X2xheWVycyAgICAgICAgICAgICAgICAgICAgICAgIDogJWQKAHZwc19tYXhfc3ViX2xheWVycyAgICAgICAgICAgICAgICAgICAgOiAlZAoAdnBzX3RlbXBvcmFsX2lkX25lc3RpbmdfZmxhZyAgICAgICAgICA6ICVkCgAgIFByb2ZpbGUvVGllci9MZXZlbCBbTGF5ZXIgJWRdCgB2cHNfc3ViX2xheWVyX29yZGVyaW5nX2luZm9fcHJlc2VudF9mbGFnIDogJWQKAGxheWVyICVkOiB2cHNfbWF4X2RlY19waWNfYnVmZmVyaW5nID0gJWQKACAgICAgICAgIHZwc19tYXhfbnVtX3Jlb3JkZXJfcGljcyAgPSAlZAoAICAgICAgICAgdnBzX21heF9sYXRlbmN5X2luY3JlYXNlICA9ICVkCgBsYXllciAoYWxsKTogdnBzX21heF9kZWNfcGljX2J1ZmZlcmluZyA9ICVkCgAgICAgICAgICAgICAgdnBzX21heF9udW1fcmVvcmRlcl9waWNzICA9ICVkCgAgICAgICAgICAgICAgdnBzX21heF9sYXRlbmN5X2luY3JlYXNlICA9ICVkCgB2cHNfbWF4X2xheWVyX2lkICAgPSAlZAoAdnBzX251bV9sYXllcl9zZXRzID0gJWQKAHZwc190aW1pbmdfaW5mb19wcmVzZW50X2ZsYWcgPSAlZAoAbGF5ZXJfaWRfaW5jbHVkZWRfZmxhZ1slZF1bJWRdID0gJWQKAHZwc19udW1fdW5pdHNfaW5fdGljayA9ICVkCgB2cHNfdGltZV9zY2FsZSAgICAgICAgPSAlZAoAdnBzX3BvY19wcm9wb3J0aW9uYWxfdG9fdGltaW5nX2ZsYWcgPSAlZAoAdnBzX251bV90aWNrc19wb2NfZGlmZl9vbmUgPSAlZAoAdnBzX251bV9ocmRfcGFyYW1ldGVycyAgICAgPSAlZAoAaHJkX2xheWVyX3NldF9pZHhbJWRdID0gJWQKAHZwc19leHRlbnNpb25fZmxhZyA9ICVkCgBnZW5lcmFsAHN1Yl9sYXllcgAgICVzX3Byb2ZpbGVfc3BhY2UgICAgIDogJWQKACAgJXNfdGllcl9mbGFnICAgICAgICAgOiAlZAoAKHVua25vd24pAEZvcm1hdFJhbmdlRXh0ZW5zaW9ucwBNYWluU3RpbGxQaWN0dXJlAE1haW4xMABNYWluACAgJXNfcHJvZmlsZV9pZGMgICAgICAgOiAlcwoAICAlc19wcm9maWxlX2NvbXBhdGliaWxpdHlfZmxhZ3M6IAAqCgAgICAgJXNfcHJvZ3Jlc3NpdmVfc291cmNlX2ZsYWcgOiAlZAoAICAgICVzX2ludGVybGFjZWRfc291cmNlX2ZsYWcgOiAlZAoAICAgICVzX25vbl9wYWNrZWRfY29uc3RyYWludF9mbGFnIDogJWQKACAgICAlc19mcmFtZV9vbmx5X2NvbnN0cmFpbnRfZmxhZyA6ICVkCgAqLAAqJWQAICAlc19sZXZlbF9pZGMgICAgICAgICA6ICVkICglNC4yZikKAHVuc3BlY2lmaWVkAE1BQwBTRUNBTQBOVFNDAFBBTABjb21wb25lbnQALS0tLS0tLS0tLS0tLS0tLS0gVlVJIC0tLS0tLS0tLS0tLS0tLS0tCgBzYW1wbGUgYXNwZWN0IHJhdGlvICAgICAgICA6ICVkOiVkCgBvdmVyc2Nhbl9pbmZvX3ByZXNlbnRfZmxhZyA6ICVkCgBvdmVyc2Nhbl9hcHByb3ByaWF0ZV9mbGFnICA6ICVkCgB2aWRlb19zaWduYWxfdHlwZV9wcmVzZW50X2ZsYWc6ICVkCgAgIHZpZGVvX2Zvcm1hdCAgICAgICAgICAgICAgICA6ICVzCgAgIHZpZGVvX2Z1bGxfcmFuZ2VfZmxhZyAgICAgICA6ICVkCgAgIGNvbG91cl9kZXNjcmlwdGlvbl9wcmVzZW50X2ZsYWcgOiAlZAoAICBjb2xvdXJfcHJpbWFyaWVzICAgICAgICAgICAgOiAlZAoAICB0cmFuc2Zlcl9jaGFyYWN0ZXJpc3RpY3MgICAgOiAlZAoAICBtYXRyaXhfY29lZmZzICAgICAgICAgICAgICAgOiAlZAoAY2hyb21hX2xvY19pbmZvX3ByZXNlbnRfZmxhZzogJWQKACAgY2hyb21hX3NhbXBsZV9sb2NfdHlwZV90b3BfZmllbGQgICA6ICVkCgAgIGNocm9tYV9zYW1wbGVfbG9jX3R5cGVfYm90dG9tX2ZpZWxkOiAlZAoAbmV1dHJhbF9jaHJvbWFfaW5kaWNhdGlvbl9mbGFnOiAlZAoAZmllbGRfc2VxX2ZsYWcgICAgICAgICAgICAgICAgOiAlZAoAZnJhbWVfZmllbGRfaW5mb19wcmVzZW50X2ZsYWcgOiAlZAoAZGVmYXVsdF9kaXNwbGF5X3dpbmRvd19mbGFnICAgOiAlZAoAICBkZWZfZGlzcF93aW5fbGVmdF9vZmZzZXQgICAgOiAlZAoAICBkZWZfZGlzcF93aW5fcmlnaHRfb2Zmc2V0ICAgOiAlZAoAICBkZWZfZGlzcF93aW5fdG9wX29mZnNldCAgICAgOiAlZAoAICBkZWZfZGlzcF93aW5fYm90dG9tX29mZnNldCAgOiAlZAoAdnVpX3RpbWluZ19pbmZvX3ByZXNlbnRfZmxhZyAgOiAlZAoAICB2dWlfbnVtX3VuaXRzX2luX3RpY2sgICAgICAgOiAlZAoAICB2dWlfdGltZV9zY2FsZSAgICAgICAgICAgICAgOiAlZAoAdnVpX3BvY19wcm9wb3J0aW9uYWxfdG9fdGltaW5nX2ZsYWcgOiAlZAoAdnVpX251bV90aWNrc19wb2NfZGlmZl9vbmUgICAgICAgICAgOiAlZAoAdnVpX2hyZF9wYXJhbWV0ZXJzX3ByZXNlbnRfZmxhZyA6ICVkCgBiaXRzdHJlYW1fcmVzdHJpY3Rpb25fZmxhZyAgICAgICAgIDogJWQKACAgdGlsZXNfZml4ZWRfc3RydWN0dXJlX2ZsYWcgICAgICAgOiAlZAoAICBtb3Rpb25fdmVjdG9yc19vdmVyX3BpY19ib3VuZGFyaWVzX2ZsYWcgOiAlZAoAICByZXN0cmljdGVkX3JlZl9waWNfbGlzdHNfZmxhZyAgICA6ICVkCgAgIG1pbl9zcGF0aWFsX3NlZ21lbnRhdGlvbl9pZGMgICAgIDogJWQKACAgbWF4X2J5dGVzX3Blcl9waWNfZGVub20gICAgICAgICAgOiAlZAoAICBtYXhfYml0c19wZXJfbWluX2N1X2Rlbm9tICAgICAgICA6ICVkCgAgIGxvZzJfbWF4X212X2xlbmd0aF9ob3Jpem9udGFsICAgIDogJWQKACAgbG9nMl9tYXhfbXZfbGVuZ3RoX3ZlcnRpY2FsICAgICAgOiAlZAoAYml0c3RyZWFtLmNjAHZhbHVlPjAAZ2V0X3V2bGMAgLDQ8ICnxeOAnrvYe5ayzXSOqcNvh6C5aYCYr2R6kKZfdImeWm6CllVoe45RY3WHTV5vgElZaXpFVWR0QlBfbj5MWmg7SFZjOEVRXjVBTVkzPklVMDtFUC44QkwrNT9IKTI7RScwOEElLTY+IyszOyEpMDggJy41HiUrMh0jKTAbISctGh8lKxgeIykXHCEnFhsgJRUaHiMUGB0hExcbHxIWGh4RFRkcEBQXGw8TFhkOEhUYDhEUFw0QExYMDxIVDA4RFAsOEBMLDQ8SCgwPEQoMDhAJCw0PCQsMDggKDA4ICQsNBwkLDAcJCgwHCAoLBggJCwYHCQoGBwgJAgICAgYFBAQDAwMDAgICAgICAgIBAQEBAQEBAQEBAQEBAQEBAAABAgIEBAUGBwgJCQsLDA0NDw8QEBISExMVFRYWFxgYGRoaGxscHR0eHh4fICAhISEiIiMjIyQkJCUlJSYmPwECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pj9jYWJhYy5jYwBsZW5ndGggPj0gMABpbml0X0NBQkFDX2RlY29kZXIAJXAgYyd0b3IgPSAlcAoAJXAgZGVzdHJ1Y3RvcgoAbWZyZWUgJXAKACVwIGluaXQKACpyZWZjbnQ+MQBjb250ZXh0bW9kZWwuY2MAZGVjb3VwbGVfb3JfYWxsb2Nfd2l0aF9lbXB0eV9kYXRhACVwIChhbGxvYykKAG1vZGVsW2ldLnN0YXRlIDw9IDYyAHNldF9pbml0VmFsdWUAJXAgcmVsZWFzZSAlcAoAJXAgZGVjb3VwbGUgKCVwKQoAcmVmY250AGRlY291cGxlACVwIGFzc2lnbiA9ICVwCgBkZWJsb2NrLSVkAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQICAgIDAwMDBAQEBQUGBgcICQoLDQ4QEhQWGAAAAAAAAAAAAAAAAAAAAAAGBwgJCgsMDQ4PEBESFBYYGhweICIkJigqLC4wMjQ2ODo8PkByZWZQaWNRMD09cmVmUGljUTEAZGVibG9jay5jYwBkZXJpdmVfYm91bmRhcnlTdHJlbmd0aAAyNnRocmVhZF90YXNrX2RlYmxvY2tfQ1RCUm93AG5UIDw9IE1BWF9JTlRSQV9QUkVEX0JMT0NLX1NJWkUALi9pbnRyYXByZWQuaABpbml0AGludHJhUHJlZE1vZGU8MzUAaW50cmFfcHJlZGljdGlvbl9hbmd1bGFyAGludHJhUHJlZE1vZGU+PTIAaW50cmFfcHJlZGljdGlvbl9zYW1wbGVfZmlsdGVyaW5nAG5UPD0zMgBmaWxsX2Zyb21faW1hZ2UAc2hkci0+c2xpY2VfdHlwZSA9PSBTTElDRV9UWVBFX0IAbW90aW9uLmNjAGdlbmVyYXRlX2ludGVyX3ByZWRpY3Rpb25fc2FtcGxlcwBtY19jaHJvbWEAdW5pdFggPj0gMCAmJiB1bml0WCA8IHdpZHRoX2luX3VuaXRzAC4uL2xpYmRlMjY1L2ltYWdlLmgAZ2V0AHVuaXRZID49IDAgJiYgdW5pdFkgPCBoZWlnaHRfaW5fdW5pdHMAY3R4LT5oYXNfaW1hZ2UoY29sUGljKQBkZXJpdmVfY29sbG9jYXRlZF9tb3Rpb25fdmVjdG9ycwBkZXJpdmVfY29tYmluZWRfYmlwcmVkaWN0aXZlX21lcmdpbmdfY2FuZGlkYXRlcwAzME1vdGlvblZlY3RvckFjY2Vzc19kZTI2NV9pbWFnZQAxOE1vdGlvblZlY3RvckFjY2VzcwByZWZQaWNMaXN0Pj0wAGRlcml2ZV9zcGF0aWFsX2x1bWFfdmVjdG9yX3ByZWRpY3Rpb24AbnVtTVZQQ2FuZExYPT0yAGZpbGxfbHVtYV9tb3Rpb25fdmVjdG9yX3ByZWRpY3RvcnMAUklkeD49MAByZWZwaWMuY2MAcmVhZF9zaG9ydF90ZXJtX3JlZl9waWNfc2V0AFJJZHggPj0gMCAmJiBSSWR4IDwgc2V0cy5zaXplKCkAaj49MCAmJiBqIDwgTUFYX05VTV9SRUZfUElDUwAqJWQlYyAAKiVzCgB2b2lkAGJvb2wAY2hhcgBzaWduZWQgY2hhcgB1bnNpZ25lZCBjaGFyAHNob3J0AHVuc2lnbmVkIHNob3J0AGludAB1bnNpZ25lZCBpbnQAbG9uZwB1bnNpZ25lZCBsb25nAGZsb2F0AGRvdWJsZQBzdGQ6OnN0cmluZwBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBzdGQ6OndzdHJpbmcAZW1zY3JpcHRlbjo6dmFsAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZyBkb3VibGU+AE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWVFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAP////////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAECBAcDBgUAaW5maW5pdHkAEQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAETCQsLAAAJBgsAAAsABhEAAAAREREAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAwAAAAADAAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAANAAAABA0AAAAACQ4AAAAAAA4AAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAADwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhISAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAASEhIAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAKAAAAAAoAAAAACQsAAAAAAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAtKyAgIDBYMHgAKG51bGwpAC0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4AMDEyMzQ1Njc4OUFCQ0RFRi4AVCEiGQ0BAgMRSxwMEAQLHRIeJ2hub3BxYiAFBg8TFBUaCBYHKCQXGAkKDhsfJSODgn0mKis8PT4/Q0dKTVhZWltcXV5fYGFjZGVmZ2lqa2xyc3R5ent8AElsbGVnYWwgYnl0ZSBzZXF1ZW5jZQBEb21haW4gZXJyb3IAUmVzdWx0IG5vdCByZXByZXNlbnRhYmxlAE5vdCBhIHR0eQBQZXJtaXNzaW9uIGRlbmllZABPcGVyYXRpb24gbm90IHBlcm1pdHRlZABObyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5AE5vIHN1Y2ggcHJvY2VzcwBGaWxlIGV4aXN0cwBWYWx1ZSB0b28gbGFyZ2UgZm9yIGRhdGEgdHlwZQBObyBzcGFjZSBsZWZ0IG9uIGRldmljZQBPdXQgb2YgbWVtb3J5AFJlc291cmNlIGJ1c3kASW50ZXJydXB0ZWQgc3lzdGVtIGNhbGwAUmVzb3VyY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUASW52YWxpZCBzZWVrAENyb3NzLWRldmljZSBsaW5rAFJlYWQtb25seSBmaWxlIHN5c3RlbQBEaXJlY3Rvcnkgbm90IGVtcHR5AENvbm5lY3Rpb24gcmVzZXQgYnkgcGVlcgBPcGVyYXRpb24gdGltZWQgb3V0AENvbm5lY3Rpb24gcmVmdXNlZABIb3N0IGlzIGRvd24ASG9zdCBpcyB1bnJlYWNoYWJsZQBBZGRyZXNzIGluIHVzZQBCcm9rZW4gcGlwZQBJL08gZXJyb3IATm8gc3VjaCBkZXZpY2Ugb3IgYWRkcmVzcwBCbG9jayBkZXZpY2UgcmVxdWlyZWQATm8gc3VjaCBkZXZpY2UATm90IGEgZGlyZWN0b3J5AElzIGEgZGlyZWN0b3J5AFRleHQgZmlsZSBidXN5AEV4ZWMgZm9ybWF0IGVycm9yAEludmFsaWQgYXJndW1lbnQAQXJndW1lbnQgbGlzdCB0b28gbG9uZwBTeW1ib2xpYyBsaW5rIGxvb3AARmlsZW5hbWUgdG9vIGxvbmcAVG9vIG1hbnkgb3BlbiBmaWxlcyBpbiBzeXN0ZW0ATm8gZmlsZSBkZXNjcmlwdG9ycyBhdmFpbGFibGUAQmFkIGZpbGUgZGVzY3JpcHRvcgBObyBjaGlsZCBwcm9jZXNzAEJhZCBhZGRyZXNzAEZpbGUgdG9vIGxhcmdlAFRvbyBtYW55IGxpbmtzAE5vIGxvY2tzIGF2YWlsYWJsZQBSZXNvdXJjZSBkZWFkbG9jayB3b3VsZCBvY2N1cgBTdGF0ZSBub3QgcmVjb3ZlcmFibGUAUHJldmlvdXMgb3duZXIgZGllZABPcGVyYXRpb24gY2FuY2VsZWQARnVuY3Rpb24gbm90IGltcGxlbWVudGVkAE5vIG1lc3NhZ2Ugb2YgZGVzaXJlZCB0eXBlAElkZW50aWZpZXIgcmVtb3ZlZABEZXZpY2Ugbm90IGEgc3RyZWFtAE5vIGRhdGEgYXZhaWxhYmxlAERldmljZSB0aW1lb3V0AE91dCBvZiBzdHJlYW1zIHJlc291cmNlcwBMaW5rIGhhcyBiZWVuIHNldmVyZWQAUHJvdG9jb2wgZXJyb3IAQmFkIG1lc3NhZ2UARmlsZSBkZXNjcmlwdG9yIGluIGJhZCBzdGF0ZQBOb3QgYSBzb2NrZXQARGVzdGluYXRpb24gYWRkcmVzcyByZXF1aXJlZABNZXNzYWdlIHRvbyBsYXJnZQBQcm90b2NvbCB3cm9uZyB0eXBlIGZvciBzb2NrZXQAUHJvdG9jb2wgbm90IGF2YWlsYWJsZQBQcm90b2NvbCBub3Qgc3VwcG9ydGVkAFNvY2tldCB0eXBlIG5vdCBzdXBwb3J0ZWQATm90IHN1cHBvcnRlZABQcm90b2NvbCBmYW1pbHkgbm90IHN1cHBvcnRlZABBZGRyZXNzIGZhbWlseSBub3Qgc3VwcG9ydGVkIGJ5IHByb3RvY29sAEFkZHJlc3Mgbm90IGF2YWlsYWJsZQBOZXR3b3JrIGlzIGRvd24ATmV0d29yayB1bnJlYWNoYWJsZQBDb25uZWN0aW9uIHJlc2V0IGJ5IG5ldHdvcmsAQ29ubmVjdGlvbiBhYm9ydGVkAE5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGUAU29ja2V0IGlzIGNvbm5lY3RlZABTb2NrZXQgbm90IGNvbm5lY3RlZABDYW5ub3Qgc2VuZCBhZnRlciBzb2NrZXQgc2h1dGRvd24AT3BlcmF0aW9uIGFscmVhZHkgaW4gcHJvZ3Jlc3MAT3BlcmF0aW9uIGluIHByb2dyZXNzAFN0YWxlIGZpbGUgaGFuZGxlAFJlbW90ZSBJL08gZXJyb3IAUXVvdGEgZXhjZWVkZWQATm8gbWVkaXVtIGZvdW5kAFdyb25nIG1lZGl1bSB0eXBlAE5vIGVycm9yIGluZm9ybWF0aW9uAABMQ19BTEwATENfQ1RZUEUAAAAATENfTlVNRVJJQwAATENfVElNRQAAAAAATENfQ09MTEFURQAATENfTU9ORVRBUlkATENfTUVTU0FHRVMATEFORwBDLlVURi04AFBPU0lYAE1VU0xfTE9DUEFUSABOU3QzX18yOGlvc19iYXNlRQBOU3QzX18yOWJhc2ljX2lvc0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQBOU3QzX18yOWJhc2ljX2lvc0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQBOU3QzX18yMTViYXNpY19zdHJlYW1idWZJY05TXzExY2hhcl90cmFpdHNJY0VFRUUATlN0M19fMjE1YmFzaWNfc3RyZWFtYnVmSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAE5TdDNfXzIxM2Jhc2ljX2lzdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUATlN0M19fMjEzYmFzaWNfaXN0cmVhbUl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQBOU3QzX18yMTNiYXNpY19vc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAE5TdDNfXzIxM2Jhc2ljX29zdHJlYW1Jd05TXzExY2hhcl90cmFpdHNJd0VFRUUATlN0M19fMjE0YmFzaWNfaW9zdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUATlN0M19fMjExX19zdGRvdXRidWZJd0VFAE5TdDNfXzIxMV9fc3Rkb3V0YnVmSWNFRQB1bnN1cHBvcnRlZCBsb2NhbGUgZm9yIHN0YW5kYXJkIGlucHV0AE5TdDNfXzIxMF9fc3RkaW5idWZJd0VFAE5TdDNfXzIxMF9fc3RkaW5idWZJY0VFAE5TdDNfXzI3Y29sbGF0ZUljRUUATlN0M19fMjZsb2NhbGU1ZmFjZXRFAE5TdDNfXzI3Y29sbGF0ZUl3RUUAMDEyMzQ1Njc4OWFiY2RlZkFCQ0RFRnhYKy1wUGlJbk4AJXAAQwBOU3QzX18yN251bV9nZXRJY05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAE5TdDNfXzI5X19udW1fZ2V0SWNFRQBOU3QzX18yMTRfX251bV9nZXRfYmFzZUUATlN0M19fMjdudW1fZ2V0SXdOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQBOU3QzX18yOV9fbnVtX2dldEl3RUUAJXAAAAAATABsbAAlAAAAAABsAE5TdDNfXzI3bnVtX3B1dEljTlNfMTlvc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjlfX251bV9wdXRJY0VFAE5TdDNfXzIxNF9fbnVtX3B1dF9iYXNlRQBOU3QzX18yN251bV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzI5X19udW1fcHV0SXdFRQAlSDolTTolUwAlbS8lZC8leQAlSTolTTolUyAlcAAlYSAlYiAlZCAlSDolTTolUyAlWQBBTQBQTQBKYW51YXJ5AEZlYnJ1YXJ5AE1hcmNoAEFwcmlsAE1heQBKdW5lAEp1bHkAQXVndXN0AFNlcHRlbWJlcgBPY3RvYmVyAE5vdmVtYmVyAERlY2VtYmVyAEphbgBGZWIATWFyAEFwcgBKdW4ASnVsAEF1ZwBTZXAAT2N0AE5vdgBEZWMAU3VuZGF5AE1vbmRheQBUdWVzZGF5AFdlZG5lc2RheQBUaHVyc2RheQBGcmlkYXkAU2F0dXJkYXkAU3VuAE1vbgBUdWUAV2VkAFRodQBGcmkAU2F0ACVtLyVkLyV5JVktJW0tJWQlSTolTTolUyAlcCVIOiVNJUg6JU06JVMlSDolTTolU05TdDNfXzI4dGltZV9nZXRJY05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAE5TdDNfXzIyMF9fdGltZV9nZXRfY19zdG9yYWdlSWNFRQBOU3QzX18yOXRpbWVfYmFzZUUATlN0M19fMjh0aW1lX2dldEl3TlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUATlN0M19fMjIwX190aW1lX2dldF9jX3N0b3JhZ2VJd0VFAE5TdDNfXzI4dGltZV9wdXRJY05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAE5TdDNfXzIxMF9fdGltZV9wdXRFAE5TdDNfXzI4dGltZV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzIxMG1vbmV5cHVuY3RJY0xiMEVFRQBOU3QzX18yMTBtb25leV9iYXNlRQBOU3QzX18yMTBtb25leXB1bmN0SWNMYjFFRUUATlN0M19fMjEwbW9uZXlwdW5jdEl3TGIwRUVFAE5TdDNfXzIxMG1vbmV5cHVuY3RJd0xiMUVFRQAwMTIzNDU2Nzg5ACVMZgBOU3QzX18yOW1vbmV5X2dldEljTlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjExX19tb25leV9nZXRJY0VFADAxMjM0NTY3ODkATlN0M19fMjltb25leV9nZXRJd05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzIxMV9fbW9uZXlfZ2V0SXdFRQAlLjBMZgBOU3QzX18yOW1vbmV5X3B1dEljTlNfMTlvc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjExX19tb25leV9wdXRJY0VFAE5TdDNfXzI5bW9uZXlfcHV0SXdOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQBOU3QzX18yMTFfX21vbmV5X3B1dEl3RUUATlN0M19fMjhtZXNzYWdlc0ljRUUATlN0M19fMjEzbWVzc2FnZXNfYmFzZUUATlN0M19fMjE3X193aWRlbl9mcm9tX3V0ZjhJTGozMkVFRQBOU3QzX18yN2NvZGVjdnRJRGljMTFfX21ic3RhdGVfdEVFAE5TdDNfXzIxMmNvZGVjdnRfYmFzZUUATlN0M19fMjE2X19uYXJyb3dfdG9fdXRmOElMajMyRUVFAE5TdDNfXzI4bWVzc2FnZXNJd0VFAE5TdDNfXzI3Y29kZWN2dEljYzExX19tYnN0YXRlX3RFRQBOU3QzX18yN2NvZGVjdnRJd2MxMV9fbWJzdGF0ZV90RUUATlN0M19fMjdjb2RlY3Z0SURzYzExX19tYnN0YXRlX3RFRQBOU3QzX18yNmxvY2FsZTVfX2ltcEUATlN0M19fMjVjdHlwZUljRUUATlN0M19fMjEwY3R5cGVfYmFzZUUATlN0M19fMjVjdHlwZUl3RUUAZmFsc2UAdHJ1ZQBOU3QzX18yOG51bXB1bmN0SWNFRQBOU3QzX18yOG51bXB1bmN0SXdFRQBOU3QzX18yMTRfX3NoYXJlZF9jb3VudEUATlN0M19fMjE5X19zaGFyZWRfd2Vha19jb3VudEUAYmFkX3dlYWtfcHRyAE5TdDNfXzIxMmJhZF93ZWFrX3B0ckUAbXV0ZXggbG9jayBmYWlsZWQAZWMgPT0gMAAvaG9tZS9ydW5uZXIvd29yay9saWJoZWlmLWVtc2NyaXB0ZW4vbGliaGVpZi1lbXNjcmlwdGVuL2xpYmhlaWYvZW1zY3JpcHRlbi9lbXNkay9lbXNjcmlwdGVuLzEuMzcuMjYvc3lzdGVtL2xpYi9saWJjeHgvbXV0ZXguY3BwAHVubG9jawB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzOiAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzAHRlcm1pbmF0aW5nIHdpdGggJXMgZm9yZWlnbiBleGNlcHRpb24AdGVybWluYXRpbmcAdW5jYXVnaHQAU3Q5ZXhjZXB0aW9uAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAFN0OXR5cGVfaW5mbwBOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAHB0aHJlYWRfb25jZSBmYWlsdXJlIGluIF9fY3hhX2dldF9nbG9iYWxzX2Zhc3QoKQBjYW5ub3QgY3JlYXRlIHB0aHJlYWQga2V5IGZvciBfX2N4YV9nZXRfZ2xvYmFscygpAGNhbm5vdCB6ZXJvIG91dCB0aHJlYWQgdmFsdWUgZm9yIF9fY3hhX2dldF9nbG9iYWxzKCkAdGVybWluYXRlX2hhbmRsZXIgdW5leHBlY3RlZGx5IHJldHVybmVkAFN0MTFsb2dpY19lcnJvcgBTdDEybGVuZ3RoX2Vycm9yAE4xMF9fY3h4YWJpdjExOV9fcG9pbnRlcl90eXBlX2luZm9FAE4xMF9fY3h4YWJpdjExN19fcGJhc2VfdHlwZV9pbmZvRQBOMTBfX2N4eGFiaXYxMjNfX2Z1bmRhbWVudGFsX3R5cGVfaW5mb0UAdgBEbgBiAGMAaABhAHMAdABpAGoAbQBmAGQATjEwX19jeHhhYml2MTE2X19lbnVtX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTIxX192bWlfY2xhc3NfdHlwZV9pbmZvRQ==";var tempDoublePtr=STATICTOP;STATICTOP+=16;function __ZSt18uncaught_exceptionv(){return !!__ZSt18uncaught_exceptionv.uncaught_exception}function ___assert_fail(condition,filename,line,func){ABORT=true;throw "Assertion failed: "+Pointer_stringify(condition)+", at: "+[filename?Pointer_stringify(filename):"unknown filename",line,func?Pointer_stringify(func):"unknown function"]+" at "+stackTrace()}function ___cxa_allocate_exception(size){return _malloc(size)}var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:(function(adjusted){if(!adjusted||EXCEPTIONS.infos[adjusted])return adjusted;for(var ptr in EXCEPTIONS.infos){var info=EXCEPTIONS.infos[ptr];if(info.adjusted===adjusted){return ptr}}return adjusted}),addRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount++;}),decRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];assert(info.refcount>0);info.refcount--;if(info.refcount===0&&!info.rethrown){if(info.destructor){Module["dynCall_vi"](info.destructor,ptr);}delete EXCEPTIONS.infos[ptr];___cxa_free_exception(ptr);}}),clearRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount=0;})};function ___cxa_begin_catch(ptr){var info=EXCEPTIONS.infos[ptr];if(info&&!info.caught){info.caught=true;__ZSt18uncaught_exceptionv.uncaught_exception--;}if(info)info.rethrown=false;EXCEPTIONS.caught.push(ptr);EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));return ptr}function ___cxa_pure_virtual(){ABORT=true;throw "Pure virtual function called!"}function ___resumeException(ptr){if(!EXCEPTIONS.last){EXCEPTIONS.last=ptr;}throw ptr+" - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."}function ___cxa_find_matching_catch(){var thrown=EXCEPTIONS.last;if(!thrown){return (Runtime.setTempRet0(0),0)|0}var info=EXCEPTIONS.infos[thrown];var throwntype=info.type;if(!throwntype){return (Runtime.setTempRet0(0),thrown)|0}var typeArray=Array.prototype.slice.call(arguments);Module["___cxa_is_pointer_type"](throwntype);if(!___cxa_find_matching_catch.buffer)___cxa_find_matching_catch.buffer=_malloc(4);HEAP32[___cxa_find_matching_catch.buffer>>2]=thrown;thrown=___cxa_find_matching_catch.buffer;for(var i=0;i<typeArray.length;i++){if(typeArray[i]&&Module["___cxa_can_catch"](typeArray[i],throwntype,thrown)){thrown=HEAP32[thrown>>2];info.adjusted=thrown;return (Runtime.setTempRet0(typeArray[i]),thrown)|0}}thrown=HEAP32[thrown>>2];return (Runtime.setTempRet0(throwntype),thrown)|0}function ___cxa_throw(ptr,type,destructor){EXCEPTIONS.infos[ptr]={ptr:ptr,adjusted:ptr,type:type,destructor:destructor,refcount:0,caught:false,rethrown:false};EXCEPTIONS.last=ptr;if(!("uncaught_exception"in __ZSt18uncaught_exceptionv)){__ZSt18uncaught_exceptionv.uncaught_exception=1;}else {__ZSt18uncaught_exceptionv.uncaught_exception++;}throw ptr+" - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."}function ___gxx_personality_v0(){}function ___lock(){}var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function ___setErrNo(value){if(Module["___errno_location"])HEAP32[Module["___errno_location"]()>>2]=value;return value}function ___map_file(pathname,size){___setErrNo(ERRNO_CODES.EPERM);return -1}var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};var PATH={splitPath:(function(filename){var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)}),normalizeArray:(function(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1);}else if(last===".."){parts.splice(i,1);up++;}else if(up){parts.splice(i,1);up--;}}if(allowAboveRoot){for(;up;up--){parts.unshift("..");}}return parts}),normalize:(function(path){var isAbsolute=path.charAt(0)==="/",trailingSlash=path.substr(-1)==="/";path=PATH.normalizeArray(path.split("/").filter((function(p){return !!p})),!isAbsolute).join("/");if(!path&&!isAbsolute){path=".";}if(path&&trailingSlash){path+="/";}return (isAbsolute?"/":"")+path}),dirname:(function(path){var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return "."}if(dir){dir=dir.substr(0,dir.length-1);}return root+dir}),basename:(function(path){if(path==="/")return "/";var lastSlash=path.lastIndexOf("/");if(lastSlash===-1)return path;return path.substr(lastSlash+1)}),extname:(function(path){return PATH.splitPath(path)[3]}),join:(function(){var paths=Array.prototype.slice.call(arguments,0);return PATH.normalize(paths.join("/"))}),join2:(function(l,r){return PATH.normalize(l+"/"+r)}),resolve:(function(){var resolvedPath="",resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?arguments[i]:FS.cwd();if(typeof path!=="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return ""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=path.charAt(0)==="/";}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter((function(p){return !!p})),!resolvedAbsolute).join("/");return (resolvedAbsolute?"/":"")+resolvedPath||"."}),relative:(function(from,to){from=PATH.resolve(from).substr(1);to=PATH.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return [];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..");}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")})};var TTY={ttys:[],init:(function(){}),shutdown:(function(){}),register:(function(dev,ops){TTY.ttys[dev]={input:[],output:[],ops:ops};FS.registerDevice(dev,TTY.stream_ops);}),stream_ops:{open:(function(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}stream.tty=tty;stream.seekable=false;}),close:(function(stream){stream.tty.ops.flush(stream.tty);}),flush:(function(stream){stream.tty.ops.flush(stream.tty);}),read:(function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(ERRNO_CODES.ENXIO)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead}),write:(function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(ERRNO_CODES.ENXIO)}for(var i=0;i<length;i++){try{stream.tty.ops.put_char(stream.tty,buffer[offset+i]);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}}if(length){stream.node.timestamp=Date.now();}return i})},default_tty_ops:{get_char:(function(tty){if(!tty.input.length){var result=null;if(ENVIRONMENT_IS_NODE){var BUFSIZE=256;var buf=new Buffer$1(BUFSIZE);var bytesRead=0;var isPosixPlatform=browser$1.platform!="win32";var fd=browser$1.stdin.fd;if(isPosixPlatform){var usingDevice=false;try{fd=fs.openSync("/dev/stdin","r");usingDevice=true;}catch(e){}}try{bytesRead=fs.readSync(fd,buf,0,BUFSIZE,null);}catch(e){if(e.toString().indexOf("EOF")!=-1)bytesRead=0;else throw e}if(usingDevice){fs.closeSync(fd);}if(bytesRead>0){result=buf.slice(0,bytesRead).toString("utf-8");}else {result=null;}}else if(typeof window!="undefined"&&typeof window.prompt=="function"){result=window.prompt("Input: ");if(result!==null){result+="\n";}}else if(typeof readline=="function"){result=readline();if(result!==null){result+="\n";}}if(!result){return null}tty.input=intArrayFromString(result,true);}return tty.input.shift()}),put_char:(function(tty,val){if(val===null||val===10){Module["print"](UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}}),flush:(function(tty){if(tty.output&&tty.output.length>0){Module["print"](UTF8ArrayToString(tty.output,0));tty.output=[];}})},default_tty1_ops:{put_char:(function(tty,val){if(val===null||val===10){Module["printErr"](UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}}),flush:(function(tty){if(tty.output&&tty.output.length>0){Module["printErr"](UTF8ArrayToString(tty.output,0));tty.output=[];}})}};var MEMFS={ops_table:null,mount:(function(mount){return MEMFS.createNode(null,"/",16384|511,0)}),createNode:(function(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(!MEMFS.ops_table){MEMFS.ops_table={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,allocate:MEMFS.stream_ops.allocate,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};}var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={};}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null;}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream;}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream;}node.timestamp=Date.now();if(parent){parent.contents[name]=node;}return node}),getFileDataAsRegularArray:(function(node){if(node.contents&&node.contents.subarray){var arr=[];for(var i=0;i<node.usedBytes;++i)arr.push(node.contents[i]);return arr}return node.contents}),getFileDataAsTypedArray:(function(node){if(!node.contents)return new Uint8Array;if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)}),expandFileStorage:(function(node,newCapacity){if(node.contents&&node.contents.subarray&&newCapacity>node.contents.length){node.contents=MEMFS.getFileDataAsRegularArray(node);node.usedBytes=node.contents.length;}if(!node.contents||node.contents.subarray){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)|0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0);return}if(!node.contents&&newCapacity>0)node.contents=[];while(node.contents.length<newCapacity)node.contents.push(0);}),resizeFileStorage:(function(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0;return}if(!node.contents||node.contents.subarray){var oldContents=node.contents;node.contents=new Uint8Array(new ArrayBuffer(newSize));if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));}node.usedBytes=newSize;return}if(!node.contents)node.contents=[];if(node.contents.length>newSize)node.contents.length=newSize;else while(node.contents.length<newSize)node.contents.push(0);node.usedBytes=newSize;}),node_ops:{getattr:(function(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096;}else if(FS.isFile(node.mode)){attr.size=node.usedBytes;}else if(FS.isLink(node.mode)){attr.size=node.link.length;}else {attr.size=0;}attr.atime=new Date(node.timestamp);attr.mtime=new Date(node.timestamp);attr.ctime=new Date(node.timestamp);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr}),setattr:(function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size);}}),lookup:(function(parent,name){throw FS.genericErrors[ERRNO_CODES.ENOENT]}),mknod:(function(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)}),rename:(function(old_node,new_dir,new_name){if(FS.isDir(old_node.mode)){var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(new_node){for(var i in new_node.contents){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}}}delete old_node.parent.contents[old_node.name];old_node.name=new_name;new_dir.contents[new_name]=old_node;old_node.parent=new_dir;}),unlink:(function(parent,name){delete parent.contents[name];}),rmdir:(function(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}delete parent.contents[name];}),readdir:(function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries}),symlink:(function(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node}),readlink:(function(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return node.link})},stream_ops:{read:(function(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);assert(size>=0);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset);}else {for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i];}return size}),write:(function(stream,buffer,offset,length,position,canOwn){if(!length)return 0;var node=stream.node;node.timestamp=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=new Uint8Array(buffer.subarray(offset,offset+length));node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray)node.contents.set(buffer.subarray(offset,offset+length),position);else {for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i];}}node.usedBytes=Math.max(node.usedBytes,position+length);return length}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes;}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position}),allocate:(function(stream,offset,length){MEMFS.expandFileStorage(stream.node,offset+length);stream.node.usedBytes=Math.max(stream.node.usedBytes,offset+length);}),mmap:(function(stream,buffer,offset,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&(contents.buffer===buffer||contents.buffer===buffer.buffer)){allocated=false;ptr=contents.byteOffset;}else {if(position>0||position+length<stream.node.usedBytes){if(contents.subarray){contents=contents.subarray(position,position+length);}else {contents=Array.prototype.slice.call(contents,position,position+length);}}allocated=true;ptr=_malloc(length);if(!ptr){throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)}buffer.set(contents,ptr);}return {ptr:ptr,allocated:allocated}}),msync:(function(stream,buffer,offset,length,mmapFlags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}if(mmapFlags&2){return 0}MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0})}};var IDBFS={dbs:{},indexedDB:(function(){if(typeof indexedDB!=="undefined")return indexedDB;var ret=null;if(typeof window==="object")ret=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;assert(ret,"IDBFS used, but indexedDB not supported");return ret}),DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:(function(mount){return MEMFS.mount.apply(null,arguments)}),syncfs:(function(mount,populate,callback){IDBFS.getLocalSet(mount,(function(err,local){if(err)return callback(err);IDBFS.getRemoteSet(mount,(function(err,remote){if(err)return callback(err);var src=populate?remote:local;var dst=populate?local:remote;IDBFS.reconcile(src,dst,callback);}));}));}),getDB:(function(name,callback){var db=IDBFS.dbs[name];if(db){return callback(null,db)}var req;try{req=IDBFS.indexedDB().open(name,IDBFS.DB_VERSION);}catch(e){return callback(e)}if(!req){return callback("Unable to connect to IndexedDB")}req.onupgradeneeded=(function(e){var db=e.target.result;var transaction=e.target.transaction;var fileStore;if(db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)){fileStore=transaction.objectStore(IDBFS.DB_STORE_NAME);}else {fileStore=db.createObjectStore(IDBFS.DB_STORE_NAME);}if(!fileStore.indexNames.contains("timestamp")){fileStore.createIndex("timestamp","timestamp",{unique:false});}});req.onsuccess=(function(){db=req.result;IDBFS.dbs[name]=db;callback(null,db);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),getLocalSet:(function(mount,callback){var entries={};function isRealDir(p){return p!=="."&&p!==".."}function toAbsolute(root){return(function(p){return PATH.join2(root,p)})}var check=FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));while(check.length){var path=check.pop();var stat;try{stat=FS.stat(path);}catch(e){return callback(e)}if(FS.isDir(stat.mode)){check.push.apply(check,FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));}entries[path]={timestamp:stat.mtime};}return callback(null,{type:"local",entries:entries})}),getRemoteSet:(function(mount,callback){var entries={};IDBFS.getDB(mount.mountpoint,(function(err,db){if(err)return callback(err);try{var transaction=db.transaction([IDBFS.DB_STORE_NAME],"readonly");transaction.onerror=(function(e){callback(this.error);e.preventDefault();});var store=transaction.objectStore(IDBFS.DB_STORE_NAME);var index=store.index("timestamp");index.openKeyCursor().onsuccess=(function(event){var cursor=event.target.result;if(!cursor){return callback(null,{type:"remote",db:db,entries:entries})}entries[cursor.primaryKey]={timestamp:cursor.key};cursor.continue();});}catch(e){return callback(e)}}));}),loadLocalEntry:(function(path,callback){var stat,node;try{var lookup=FS.lookupPath(path);node=lookup.node;stat=FS.stat(path);}catch(e){return callback(e)}if(FS.isDir(stat.mode)){return callback(null,{timestamp:stat.mtime,mode:stat.mode})}else if(FS.isFile(stat.mode)){node.contents=MEMFS.getFileDataAsTypedArray(node);return callback(null,{timestamp:stat.mtime,mode:stat.mode,contents:node.contents})}else {return callback(new Error("node type not supported"))}}),storeLocalEntry:(function(path,entry,callback){try{if(FS.isDir(entry.mode)){FS.mkdir(path,entry.mode);}else if(FS.isFile(entry.mode)){FS.writeFile(path,entry.contents,{encoding:"binary",canOwn:true});}else {return callback(new Error("node type not supported"))}FS.chmod(path,entry.mode);FS.utime(path,entry.timestamp,entry.timestamp);}catch(e){return callback(e)}callback(null);}),removeLocalEntry:(function(path,callback){try{var lookup=FS.lookupPath(path);var stat=FS.stat(path);if(FS.isDir(stat.mode)){FS.rmdir(path);}else if(FS.isFile(stat.mode)){FS.unlink(path);}}catch(e){return callback(e)}callback(null);}),loadRemoteEntry:(function(store,path,callback){var req=store.get(path);req.onsuccess=(function(event){callback(null,event.target.result);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),storeRemoteEntry:(function(store,path,entry,callback){var req=store.put(entry,path);req.onsuccess=(function(){callback(null);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),removeRemoteEntry:(function(store,path,callback){var req=store.delete(path);req.onsuccess=(function(){callback(null);});req.onerror=(function(e){callback(this.error);e.preventDefault();});}),reconcile:(function(src,dst,callback){var total=0;var create=[];Object.keys(src.entries).forEach((function(key){var e=src.entries[key];var e2=dst.entries[key];if(!e2||e.timestamp>e2.timestamp){create.push(key);total++;}}));var remove=[];Object.keys(dst.entries).forEach((function(key){dst.entries[key];var e2=src.entries[key];if(!e2){remove.push(key);total++;}}));if(!total){return callback(null)}var completed=0;var db=src.type==="remote"?src.db:dst.db;var transaction=db.transaction([IDBFS.DB_STORE_NAME],"readwrite");var store=transaction.objectStore(IDBFS.DB_STORE_NAME);function done(err){if(err){if(!done.errored){done.errored=true;return callback(err)}return}if(++completed>=total){return callback(null)}}transaction.onerror=(function(e){done(this.error);e.preventDefault();});create.sort().forEach((function(path){if(dst.type==="local"){IDBFS.loadRemoteEntry(store,path,(function(err,entry){if(err)return done(err);IDBFS.storeLocalEntry(path,entry,done);}));}else {IDBFS.loadLocalEntry(path,(function(err,entry){if(err)return done(err);IDBFS.storeRemoteEntry(store,path,entry,done);}));}}));remove.sort().reverse().forEach((function(path){if(dst.type==="local"){IDBFS.removeLocalEntry(path,done);}else {IDBFS.removeRemoteEntry(store,path,done);}}));})};var NODEFS={isWindows:false,staticInit:(function(){NODEFS.isWindows=!!browser$1.platform.match(/^win/);}),mount:(function(mount){assert(ENVIRONMENT_IS_NODE);return NODEFS.createNode(null,"/",NODEFS.getMode(mount.opts.root),0)}),createNode:(function(parent,name,mode,dev){if(!FS.isDir(mode)&&!FS.isFile(mode)&&!FS.isLink(mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node=FS.createNode(parent,name,mode);node.node_ops=NODEFS.node_ops;node.stream_ops=NODEFS.stream_ops;return node}),getMode:(function(path){var stat;try{stat=fs.lstatSync(path);if(NODEFS.isWindows){stat.mode=stat.mode|(stat.mode&146)>>1;}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}return stat.mode}),realPath:(function(node){var parts=[];while(node.parent!==node){parts.push(node.name);node=node.parent;}parts.push(node.mount.opts.root);parts.reverse();return PATH.join.apply(null,parts)}),flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:(function(flags){flags&=~2097152;flags&=~2048;flags&=~32768;flags&=~524288;if(flags in NODEFS.flagsToPermissionStringMap){return NODEFS.flagsToPermissionStringMap[flags]}else {throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}}),node_ops:{getattr:(function(node){var path=NODEFS.realPath(node);var stat;try{stat=fs.lstatSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}if(NODEFS.isWindows&&!stat.blksize){stat.blksize=4096;}if(NODEFS.isWindows&&!stat.blocks){stat.blocks=(stat.size+stat.blksize-1)/stat.blksize|0;}return {dev:stat.dev,ino:stat.ino,mode:stat.mode,nlink:stat.nlink,uid:stat.uid,gid:stat.gid,rdev:stat.rdev,size:stat.size,atime:stat.atime,mtime:stat.mtime,ctime:stat.ctime,blksize:stat.blksize,blocks:stat.blocks}}),setattr:(function(node,attr){var path=NODEFS.realPath(node);try{if(attr.mode!==undefined){fs.chmodSync(path,attr.mode);node.mode=attr.mode;}if(attr.timestamp!==undefined){var date=new Date(attr.timestamp);fs.utimesSync(path,date,date);}if(attr.size!==undefined){fs.truncateSync(path,attr.size);}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),lookup:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);var mode=NODEFS.getMode(path);return NODEFS.createNode(parent,name,mode)}),mknod:(function(parent,name,mode,dev){var node=NODEFS.createNode(parent,name,mode,dev);var path=NODEFS.realPath(node);try{if(FS.isDir(node.mode)){fs.mkdirSync(path,node.mode);}else {fs.writeFileSync(path,"",{mode:node.mode});}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}return node}),rename:(function(oldNode,newDir,newName){var oldPath=NODEFS.realPath(oldNode);var newPath=PATH.join2(NODEFS.realPath(newDir),newName);try{fs.renameSync(oldPath,newPath);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),unlink:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);try{fs.unlinkSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),rmdir:(function(parent,name){var path=PATH.join2(NODEFS.realPath(parent),name);try{fs.rmdirSync(path);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),readdir:(function(node){var path=NODEFS.realPath(node);try{return fs.readdirSync(path)}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),symlink:(function(parent,newName,oldPath){var newPath=PATH.join2(NODEFS.realPath(parent),newName);try{fs.symlinkSync(oldPath,newPath);}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),readlink:(function(node){var path=NODEFS.realPath(node);try{path=fs.readlinkSync(path);path=NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root),path);return path}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}})},stream_ops:{open:(function(stream){var path=NODEFS.realPath(stream.node);try{if(FS.isFile(stream.node.mode)){stream.nfd=fs.openSync(path,NODEFS.flagsToPermissionString(stream.flags));}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),close:(function(stream){try{if(FS.isFile(stream.node.mode)&&stream.nfd){fs.closeSync(stream.nfd);}}catch(e){if(!e.code)throw e;throw new FS.ErrnoError(ERRNO_CODES[e.code])}}),read:(function(stream,buffer,offset,length,position){if(length===0)return 0;var nbuffer=new Buffer$1(length);var res;try{res=fs.readSync(stream.nfd,nbuffer,0,length,position);}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}if(res>0){for(var i=0;i<res;i++){buffer[offset+i]=nbuffer[i];}}return res}),write:(function(stream,buffer,offset,length,position){var nbuffer=new Buffer$1(buffer.subarray(offset,offset+length));var res;try{res=fs.writeSync(stream.nfd,nbuffer,0,length,position);}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}return res}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){try{var stat=fs.fstatSync(stream.nfd);position+=stat.size;}catch(e){throw new FS.ErrnoError(ERRNO_CODES[e.code])}}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position})}};var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:(function(mount){assert(ENVIRONMENT_IS_WORKER);if(!WORKERFS.reader)WORKERFS.reader=new FileReaderSync;var root=WORKERFS.createNode(null,"/",WORKERFS.DIR_MODE,0);var createdParents={};function ensureParent(path){var parts=path.split("/");var parent=root;for(var i=0;i<parts.length-1;i++){var curr=parts.slice(0,i+1).join("/");if(!createdParents[curr]){createdParents[curr]=WORKERFS.createNode(parent,parts[i],WORKERFS.DIR_MODE,0);}parent=createdParents[curr];}return parent}function base(path){var parts=path.split("/");return parts[parts.length-1]}Array.prototype.forEach.call(mount.opts["files"]||[],(function(file){WORKERFS.createNode(ensureParent(file.name),base(file.name),WORKERFS.FILE_MODE,0,file,file.lastModifiedDate);}));(mount.opts["blobs"]||[]).forEach((function(obj){WORKERFS.createNode(ensureParent(obj["name"]),base(obj["name"]),WORKERFS.FILE_MODE,0,obj["data"]);}));(mount.opts["packages"]||[]).forEach((function(pack){pack["metadata"].files.forEach((function(file){var name=file.filename.substr(1);WORKERFS.createNode(ensureParent(name),base(name),WORKERFS.FILE_MODE,0,pack["blob"].slice(file.start,file.end));}));}));return root}),createNode:(function(parent,name,mode,dev,contents,mtime){var node=FS.createNode(parent,name,mode);node.mode=mode;node.node_ops=WORKERFS.node_ops;node.stream_ops=WORKERFS.stream_ops;node.timestamp=(mtime||new Date).getTime();assert(WORKERFS.FILE_MODE!==WORKERFS.DIR_MODE);if(mode===WORKERFS.FILE_MODE){node.size=contents.size;node.contents=contents;}else {node.size=4096;node.contents={};}if(parent){parent.contents[name]=node;}return node}),node_ops:{getattr:(function(node){return {dev:1,ino:undefined,mode:node.mode,nlink:1,uid:0,gid:0,rdev:undefined,size:node.size,atime:new Date(node.timestamp),mtime:new Date(node.timestamp),ctime:new Date(node.timestamp),blksize:4096,blocks:Math.ceil(node.size/4096)}}),setattr:(function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}}),lookup:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}),mknod:(function(parent,name,mode,dev){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),rename:(function(oldNode,newDir,newName){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),unlink:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),rmdir:(function(parent,name){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),readdir:(function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries}),symlink:(function(parent,newName,oldPath){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}),readlink:(function(node){throw new FS.ErrnoError(ERRNO_CODES.EPERM)})},stream_ops:{read:(function(stream,buffer,offset,length,position){if(position>=stream.node.size)return 0;var chunk=stream.node.contents.slice(position,position+length);var ab=WORKERFS.reader.readAsArrayBuffer(chunk);buffer.set(new Uint8Array(ab),offset);return chunk.size}),write:(function(stream,buffer,offset,length,position){throw new FS.ErrnoError(ERRNO_CODES.EIO)}),llseek:(function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.size;}}if(position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return position})}};STATICTOP+=16;STATICTOP+=16;STATICTOP+=16;var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:(function(e){if(!(e instanceof FS.ErrnoError))throw e+" : "+stackTrace();return ___setErrNo(e.errno)}),lookupPath:(function(path,opts){path=PATH.resolve(FS.cwd(),path);opts=opts||{};if(!path)return {path:"",node:null};var defaults={follow_mount:true,recurse_count:0};for(var key in defaults){if(opts[key]===undefined){opts[key]=defaults[key];}}if(opts.recurse_count>8){throw new FS.ErrnoError(ERRNO_CODES.ELOOP)}var parts=PATH.normalizeArray(path.split("/").filter((function(p){return !!p})),false);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}current=FS.lookupNode(current,parts[i]);current_path=PATH.join2(current_path,parts[i]);if(FS.isMountpoint(current)){if(!islast||islast&&opts.follow_mount){current=current.mounted.root;}}if(!islast||opts.follow){var count=0;while(FS.isLink(current.mode)){var link=FS.readlink(current_path);current_path=PATH.resolve(PATH.dirname(current_path),link);var lookup=FS.lookupPath(current_path,{recurse_count:opts.recurse_count});current=lookup.node;if(count++>40){throw new FS.ErrnoError(ERRNO_CODES.ELOOP)}}}}return {path:current_path,node:current}}),getPath:(function(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?mount+"/"+path:mount+path}path=path?node.name+"/"+path:node.name;node=node.parent;}}),hashName:(function(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0;}return (parentid+hash>>>0)%FS.nameTable.length}),hashAddNode:(function(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node;}),hashRemoveNode:(function(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next;}else {var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next;}}}),lookupNode:(function(parent,name){var err=FS.mayLookup(parent);if(err){throw new FS.ErrnoError(err,parent)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)}),createNode:(function(parent,name,mode,rdev){if(!FS.FSNode){FS.FSNode=(function(parent,name,mode,rdev){if(!parent){parent=this;}this.parent=parent;this.mount=parent.mount;this.mounted=null;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.node_ops={};this.stream_ops={};this.rdev=rdev;});FS.FSNode.prototype={};var readMode=292|73;var writeMode=146;Object.defineProperties(FS.FSNode.prototype,{read:{get:(function(){return (this.mode&readMode)===readMode}),set:(function(val){val?this.mode|=readMode:this.mode&=~readMode;})},write:{get:(function(){return (this.mode&writeMode)===writeMode}),set:(function(val){val?this.mode|=writeMode:this.mode&=~writeMode;})},isFolder:{get:(function(){return FS.isDir(this.mode)})},isDevice:{get:(function(){return FS.isChrdev(this.mode)})}});}var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node}),destroyNode:(function(node){FS.hashRemoveNode(node);}),isRoot:(function(node){return node===node.parent}),isMountpoint:(function(node){return !!node.mounted}),isFile:(function(mode){return (mode&61440)===32768}),isDir:(function(mode){return (mode&61440)===16384}),isLink:(function(mode){return (mode&61440)===40960}),isChrdev:(function(mode){return (mode&61440)===8192}),isBlkdev:(function(mode){return (mode&61440)===24576}),isFIFO:(function(mode){return (mode&61440)===4096}),isSocket:(function(mode){return (mode&49152)===49152}),flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:(function(str){var flags=FS.flagModes[str];if(typeof flags==="undefined"){throw new Error("Unknown file open mode: "+str)}return flags}),flagsToPermissionString:(function(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w";}return perms}),nodePermissions:(function(node,perms){if(FS.ignorePermissions){return 0}if(perms.indexOf("r")!==-1&&!(node.mode&292)){return ERRNO_CODES.EACCES}else if(perms.indexOf("w")!==-1&&!(node.mode&146)){return ERRNO_CODES.EACCES}else if(perms.indexOf("x")!==-1&&!(node.mode&73)){return ERRNO_CODES.EACCES}return 0}),mayLookup:(function(dir){var err=FS.nodePermissions(dir,"x");if(err)return err;if(!dir.node_ops.lookup)return ERRNO_CODES.EACCES;return 0}),mayCreate:(function(dir,name){try{var node=FS.lookupNode(dir,name);return ERRNO_CODES.EEXIST}catch(e){}return FS.nodePermissions(dir,"wx")}),mayDelete:(function(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name);}catch(e){return e.errno}var err=FS.nodePermissions(dir,"wx");if(err){return err}if(isdir){if(!FS.isDir(node.mode)){return ERRNO_CODES.ENOTDIR}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return ERRNO_CODES.EBUSY}}else {if(FS.isDir(node.mode)){return ERRNO_CODES.EISDIR}}return 0}),mayOpen:(function(node,flags){if(!node){return ERRNO_CODES.ENOENT}if(FS.isLink(node.mode)){return ERRNO_CODES.ELOOP}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&512){return ERRNO_CODES.EISDIR}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))}),MAX_OPEN_FDS:4096,nextfd:(function(fd_start,fd_end){fd_start=fd_start||0;fd_end=fd_end||FS.MAX_OPEN_FDS;for(var fd=fd_start;fd<=fd_end;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(ERRNO_CODES.EMFILE)}),getStream:(function(fd){return FS.streams[fd]}),createStream:(function(stream,fd_start,fd_end){if(!FS.FSStream){FS.FSStream=(function(){});FS.FSStream.prototype={};Object.defineProperties(FS.FSStream.prototype,{object:{get:(function(){return this.node}),set:(function(val){this.node=val;})},isRead:{get:(function(){return (this.flags&2097155)!==1})},isWrite:{get:(function(){return (this.flags&2097155)!==0})},isAppend:{get:(function(){return this.flags&1024})}});}var newStream=new FS.FSStream;for(var p in stream){newStream[p]=stream[p];}stream=newStream;var fd=FS.nextfd(fd_start,fd_end);stream.fd=fd;FS.streams[fd]=stream;return stream}),closeStream:(function(fd){FS.streams[fd]=null;}),chrdev_stream_ops:{open:(function(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;if(stream.stream_ops.open){stream.stream_ops.open(stream);}}),llseek:(function(){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)})},major:(function(dev){return dev>>8}),minor:(function(dev){return dev&255}),makedev:(function(ma,mi){return ma<<8|mi}),registerDevice:(function(dev,ops){FS.devices[dev]={stream_ops:ops};}),getDevice:(function(dev){return FS.devices[dev]}),getMounts:(function(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push.apply(check,m.mounts);}return mounts}),syncfs:(function(populate,callback){if(typeof populate==="function"){callback=populate;populate=false;}FS.syncFSRequests++;if(FS.syncFSRequests>1){console.log("warning: "+FS.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(err){assert(FS.syncFSRequests>0);FS.syncFSRequests--;return callback(err)}function done(err){if(err){if(!done.errored){done.errored=true;return doCallback(err)}return}if(++completed>=mounts.length){doCallback(null);}}mounts.forEach((function(mount){if(!mount.type.syncfs){return done(null)}mount.type.syncfs(mount,populate,done);}));}),mount:(function(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}}var mount={type:type,opts:opts,mountpoint:mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot;}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount);}}return mountRoot}),unmount:(function(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);Object.keys(FS.nameTable).forEach((function(hash){var current=FS.nameTable[hash];while(current){var next=current.name_next;if(mounts.indexOf(current.mount)!==-1){FS.destroyNode(current);}current=next;}}));node.mounted=null;var idx=node.mount.mounts.indexOf(mount);assert(idx!==-1);node.mount.mounts.splice(idx,1);}),lookup:(function(parent,name){return parent.node_ops.lookup(parent,name)}),mknod:(function(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name||name==="."||name===".."){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var err=FS.mayCreate(parent,name);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return parent.node_ops.mknod(parent,name,mode,dev)}),create:(function(path,mode){mode=mode!==undefined?mode:438;mode&=4095;mode|=32768;return FS.mknod(path,mode,0)}),mkdir:(function(path,mode){mode=mode!==undefined?mode:511;mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)}),mkdirTree:(function(path,mode){var dirs=path.split("/");var d="";for(var i=0;i<dirs.length;++i){if(!dirs[i])continue;d+="/"+dirs[i];try{FS.mkdir(d,mode);}catch(e){if(e.errno!=ERRNO_CODES.EEXIST)throw e}}}),mkdev:(function(path,mode,dev){if(typeof dev==="undefined"){dev=mode;mode=438;}mode|=8192;return FS.mknod(path,mode,dev)}),symlink:(function(oldpath,newpath){if(!PATH.resolve(oldpath)){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}var newname=PATH.basename(newpath);var err=FS.mayCreate(parent,newname);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return parent.node_ops.symlink(parent,newname,oldpath)}),rename:(function(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;try{lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(!old_dir||!new_dir)throw new FS.ErrnoError(ERRNO_CODES.ENOENT);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(ERRNO_CODES.EXDEV)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}relative=PATH.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var err=FS.mayDelete(old_dir,old_name,isdir);if(err){throw new FS.ErrnoError(err)}err=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(err){throw new FS.ErrnoError(err)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}if(new_dir!==old_dir){err=FS.nodePermissions(old_dir,"w");if(err){throw new FS.ErrnoError(err)}}try{if(FS.trackingDelegate["willMovePath"]){FS.trackingDelegate["willMovePath"](old_path,new_path);}}catch(e){console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);}catch(e){throw e}finally{FS.hashAddNode(old_node);}try{if(FS.trackingDelegate["onMovePath"])FS.trackingDelegate["onMovePath"](old_path,new_path);}catch(e){console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}}),rmdir:(function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var err=FS.mayDelete(parent,name,true);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.rmdir(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}}),readdir:(function(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;if(!node.node_ops.readdir){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}return node.node_ops.readdir(node)}),unlink:(function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var err=FS.mayDelete(parent,name,false);if(err){throw new FS.ErrnoError(err)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(ERRNO_CODES.EBUSY)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.unlink(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}}),readlink:(function(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!link.node_ops.readlink){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}return PATH.resolve(FS.getPath(link.parent),link.node_ops.readlink(link))}),stat:(function(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;if(!node){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!node.node_ops.getattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}return node.node_ops.getattr(node)}),lstat:(function(path){return FS.stat(path,true)}),chmod:(function(path,mode,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}node.node_ops.setattr(node,{mode:mode&4095|node.mode&~4095,timestamp:Date.now()});}),lchmod:(function(path,mode){FS.chmod(path,mode,true);}),fchmod:(function(fd,mode){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}FS.chmod(stream.node,mode);}),chown:(function(path,uid,gid,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}node.node_ops.setattr(node,{timestamp:Date.now()});}),lchown:(function(path,uid,gid){FS.chown(path,uid,gid,true);}),fchown:(function(fd,uid,gid){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}FS.chown(stream.node,uid,gid);}),truncate:(function(path,len){if(len<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(ERRNO_CODES.EPERM)}if(FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var err=FS.nodePermissions(node,"w");if(err){throw new FS.ErrnoError(err)}node.node_ops.setattr(node,{size:len,timestamp:Date.now()});}),ftruncate:(function(fd,len){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}FS.truncate(stream.node,len);}),utime:(function(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;node.node_ops.setattr(node,{timestamp:Math.max(atime,mtime)});}),open:(function(path,flags,mode,fd_start,fd_end){if(path===""){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}flags=typeof flags==="string"?FS.modeStringToFlags(flags):flags;mode=typeof mode==="undefined"?438:mode;if(flags&64){mode=mode&4095|32768;}else {mode=0;}var node;if(typeof path==="object"){node=path;}else {path=PATH.normalize(path);try{var lookup=FS.lookupPath(path,{follow:!(flags&131072)});node=lookup.node;}catch(e){}}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(ERRNO_CODES.EEXIST)}}else {node=FS.mknod(path,mode,0);created=true;}}if(!node){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(FS.isChrdev(node.mode)){flags&=~512;}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}if(!created){var err=FS.mayOpen(node,flags);if(err){throw new FS.ErrnoError(err)}}if(flags&512){FS.truncate(node,0);}flags&=~(128|512);var stream=FS.createStream({node:node,path:FS.getPath(node),flags:flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false},fd_start,fd_end);if(stream.stream_ops.open){stream.stream_ops.open(stream);}if(Module["logReadFiles"]&&!(flags&1)){if(!FS.readFiles)FS.readFiles={};if(!(path in FS.readFiles)){FS.readFiles[path]=1;Module["printErr"]("read file: "+path);}}try{if(FS.trackingDelegate["onOpenFile"]){var trackingFlags=0;if((flags&2097155)!==1){trackingFlags|=FS.tracking.openFlags.READ;}if((flags&2097155)!==0){trackingFlags|=FS.tracking.openFlags.WRITE;}FS.trackingDelegate["onOpenFile"](path,trackingFlags);}}catch(e){console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: "+e.message);}return stream}),close:(function(stream){if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream);}}catch(e){throw e}finally{FS.closeStream(stream.fd);}}),llseek:(function(stream,offset,whence){if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position}),read:(function(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!stream.stream_ops.read){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}var seeking=true;if(typeof position==="undefined"){position=stream.position;seeking=false;}else if(!stream.seekable){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead}),write:(function(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.EISDIR)}if(!stream.stream_ops.write){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if(stream.flags&1024){FS.llseek(stream,0,2);}var seeking=true;if(typeof position==="undefined"){position=stream.position;seeking=false;}else if(!stream.seekable){throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;try{if(stream.path&&FS.trackingDelegate["onWriteToFile"])FS.trackingDelegate["onWriteToFile"](stream.path);}catch(e){console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: "+e.message);}return bytesWritten}),allocate:(function(stream,offset,length){if(offset<0||length<=0){throw new FS.ErrnoError(ERRNO_CODES.EINVAL)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(ERRNO_CODES.EBADF)}if(!FS.isFile(stream.node.mode)&&!FS.isDir(stream.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}if(!stream.stream_ops.allocate){throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)}stream.stream_ops.allocate(stream,offset,length);}),mmap:(function(stream,buffer,offset,length,position,prot,flags){if((stream.flags&2097155)===1){throw new FS.ErrnoError(ERRNO_CODES.EACCES)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(ERRNO_CODES.ENODEV)}return stream.stream_ops.mmap(stream,buffer,offset,length,position,prot,flags)}),msync:(function(stream,buffer,offset,length,mmapFlags){if(!stream||!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)}),munmap:(function(stream){return 0}),ioctl:(function(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(ERRNO_CODES.ENOTTY)}return stream.stream_ops.ioctl(stream,cmd,arg)}),readFile:(function(path,opts){opts=opts||{};opts.flags=opts.flags||"r";opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var ret;var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){ret=UTF8ArrayToString(buf,0);}else if(opts.encoding==="binary"){ret=buf;}FS.close(stream);return ret}),writeFile:(function(path,data,opts){opts=opts||{};opts.flags=opts.flags||"w";opts.encoding=opts.encoding||"utf8";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var stream=FS.open(path,opts.flags,opts.mode);if(opts.encoding==="utf8"){var buf=new Uint8Array(lengthBytesUTF8(data)+1);var actualNumBytes=stringToUTF8Array(data,buf,0,buf.length);FS.write(stream,buf,0,actualNumBytes,0,opts.canOwn);}else if(opts.encoding==="binary"){FS.write(stream,data,0,data.length,0,opts.canOwn);}FS.close(stream);}),cwd:(function(){return FS.currentPath}),chdir:(function(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(ERRNO_CODES.ENOENT)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)}var err=FS.nodePermissions(lookup.node,"x");if(err){throw new FS.ErrnoError(err)}FS.currentPath=lookup.path;}),createDefaultDirectories:(function(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user");}),createDefaultDevices:(function(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:(function(){return 0}),write:(function(stream,buffer,offset,length,pos){return length})});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var random_device;if(typeof crypto!=="undefined"){var randomBuffer=new Uint8Array(1);random_device=(function(){crypto.getRandomValues(randomBuffer);return randomBuffer[0]});}else if(ENVIRONMENT_IS_NODE){random_device=(function(){return require$$2["randomBytes"](1)[0]});}else {random_device=(function(){return Math.random()*256|0});}FS.createDevice("/dev","random",random_device);FS.createDevice("/dev","urandom",random_device);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp");}),createSpecialDirectories:(function(){FS.mkdir("/proc");FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount:(function(){var node=FS.createNode("/proc/self","fd",16384|511,73);node.node_ops={lookup:(function(parent,name){var fd=+name;var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:(function(){return stream.path})}};ret.parent=ret;return ret})};return node})},{},"/proc/self/fd");}),createStandardStreams:(function(){if(Module["stdin"]){FS.createDevice("/dev","stdin",Module["stdin"]);}else {FS.symlink("/dev/tty","/dev/stdin");}if(Module["stdout"]){FS.createDevice("/dev","stdout",null,Module["stdout"]);}else {FS.symlink("/dev/tty","/dev/stdout");}if(Module["stderr"]){FS.createDevice("/dev","stderr",null,Module["stderr"]);}else {FS.symlink("/dev/tty1","/dev/stderr");}var stdin=FS.open("/dev/stdin","r");assert(stdin.fd===0,"invalid handle for stdin ("+stdin.fd+")");var stdout=FS.open("/dev/stdout","w");assert(stdout.fd===1,"invalid handle for stdout ("+stdout.fd+")");var stderr=FS.open("/dev/stderr","w");assert(stderr.fd===2,"invalid handle for stderr ("+stderr.fd+")");}),ensureErrnoError:(function(){if(FS.ErrnoError)return;FS.ErrnoError=function ErrnoError(errno,node){this.node=node;this.setErrno=(function(errno){this.errno=errno;for(var key in ERRNO_CODES){if(ERRNO_CODES[key]===errno){this.code=key;break}}});this.setErrno(errno);this.message=ERRNO_MESSAGES[errno];if(this.stack)Object.defineProperty(this,"stack",{value:(new Error).stack});};FS.ErrnoError.prototype=new Error;FS.ErrnoError.prototype.constructor=FS.ErrnoError;[ERRNO_CODES.ENOENT].forEach((function(code){FS.genericErrors[code]=new FS.ErrnoError(code);FS.genericErrors[code].stack="<generic error, no stack>";}));}),staticInit:(function(){FS.ensureErrnoError();FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={"MEMFS":MEMFS,"IDBFS":IDBFS,"NODEFS":NODEFS,"WORKERFS":WORKERFS};}),init:(function(input,output,error){assert(!FS.init.initialized,"FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");FS.init.initialized=true;FS.ensureErrnoError();Module["stdin"]=input||Module["stdin"];Module["stdout"]=output||Module["stdout"];Module["stderr"]=error||Module["stderr"];FS.createStandardStreams();}),quit:(function(){FS.init.initialized=false;var fflush=Module["_fflush"];if(fflush)fflush(0);for(var i=0;i<FS.streams.length;i++){var stream=FS.streams[i];if(!stream){continue}FS.close(stream);}}),getMode:(function(canRead,canWrite){var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode}),joinPath:(function(parts,forceRelative){var path=PATH.join.apply(null,parts);if(forceRelative&&path[0]=="/")path=path.substr(1);return path}),absolutePath:(function(relative,base){return PATH.resolve(base,relative)}),standardizePath:(function(path){return PATH.normalize(path)}),findObject:(function(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(ret.exists){return ret.object}else {___setErrNo(ret.error);return null}}),analyzePath:(function(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path;}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/";}catch(e){ret.error=e.errno;}return ret}),createFolder:(function(parent,name,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.mkdir(path,mode)}),createPath:(function(parent,path,canRead,canWrite){parent=typeof parent==="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current);}catch(e){}parent=current;}return current}),createFile:(function(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.create(path,mode)}),createDataFile:(function(parent,name,data,canRead,canWrite,canOwn){var path=name?PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name):parent;var mode=FS.getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data==="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr;}FS.chmod(node,mode|146);var stream=FS.open(node,"w");FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode);}return node}),createDevice:(function(parent,name,input,output){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(!!input,!!output);if(!FS.createDevice.major)FS.createDevice.major=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open:(function(stream){stream.seekable=false;}),close:(function(stream){if(output&&output.buffer&&output.buffer.length){output(10);}}),read:(function(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input();}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead}),write:(function(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i]);}catch(e){throw new FS.ErrnoError(ERRNO_CODES.EIO)}}if(length){stream.node.timestamp=Date.now();}return i})});return FS.mkdev(path,mode,dev)}),createLink:(function(parent,name,target,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);return FS.symlink(target,path)}),forceLoadFile:(function(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;var success=true;if(typeof XMLHttpRequest!=="undefined"){throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else if(Module["read"]){try{obj.contents=intArrayFromString(Module["read"](obj.url),true);obj.usedBytes=obj.contents.length;}catch(e){success=false;}}else {throw new Error("Cannot load without read() or XMLHttpRequest.")}if(!success)___setErrNo(ERRNO_CODES.EIO);return success}),createLazyFile:(function(parent,name,url,canRead,canWrite){function LazyUint8Array(){this.lengthKnown=false;this.chunks=[];}LazyUint8Array.prototype.get=function LazyUint8Array_get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]};LazyUint8Array.prototype.setDataGetter=function LazyUint8Array_setDataGetter(getter){this.getter=getter;};LazyUint8Array.prototype.cacheLength=function LazyUint8Array_cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(function(from,to){if(from>to)throw new Error("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)throw new Error("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);if(typeof Uint8Array!="undefined")xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined");}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}else {return intArrayFromString(xhr.responseText||"",true)}});var lazyArray=this;lazyArray.setDataGetter((function(chunkNum){var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]==="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end);}if(typeof lazyArray.chunks[chunkNum]==="undefined")throw new Error("doXHR failed!");return lazyArray.chunks[chunkNum]}));if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;console.log("LazyFiles on gzip forces download of the whole file when length is accessed");}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true;};if(typeof XMLHttpRequest!=="undefined"){if(!ENVIRONMENT_IS_WORKER)throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var lazyArray=new LazyUint8Array;Object.defineProperties(lazyArray,{length:{get:(function(){if(!this.lengthKnown){this.cacheLength();}return this._length})},chunkSize:{get:(function(){if(!this.lengthKnown){this.cacheLength();}return this._chunkSize})}});var properties={isDevice:false,contents:lazyArray};}else {var properties={isDevice:false,url:url};}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents;}else if(properties.url){node.contents=null;node.url=properties.url;}Object.defineProperties(node,{usedBytes:{get:(function(){return this.contents.length})}});var stream_ops={};var keys=Object.keys(node.stream_ops);keys.forEach((function(key){var fn=node.stream_ops[key];stream_ops[key]=function forceLoadLazyFile(){if(!FS.forceLoadFile(node)){throw new FS.ErrnoError(ERRNO_CODES.EIO)}return fn.apply(null,arguments)};}));stream_ops.read=function stream_ops_read(stream,buffer,offset,length,position){if(!FS.forceLoadFile(node)){throw new FS.ErrnoError(ERRNO_CODES.EIO)}var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);assert(size>=0);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i];}}else {for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i);}}return size};node.stream_ops=stream_ops;return node}),createPreloadedFile:(function(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish){Browser.init();var fullname=name?PATH.resolve(PATH.join2(parent,name)):parent;function processData(byteArray){function finish(byteArray){if(preFinish)preFinish();if(!dontCreateFile){FS.createDataFile(parent,name,byteArray,canRead,canWrite,canOwn);}if(onload)onload();removeRunDependency();}var handled=false;Module["preloadPlugins"].forEach((function(plugin){if(handled)return;if(plugin["canHandle"](fullname)){plugin["handle"](byteArray,fullname,finish,(function(){if(onerror)onerror();removeRunDependency();}));handled=true;}}));if(!handled)finish(byteArray);}addRunDependency();if(typeof url=="string"){Browser.asyncLoad(url,(function(byteArray){processData(byteArray);}),onerror);}else {processData(url);}}),indexedDB:(function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB}),DB_NAME:(function(){return "EM_FS_"+window.location.pathname}),DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:(function(paths,onload,onerror){onload=onload||(function(){});onerror=onerror||(function(){});var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=function openRequest_onupgradeneeded(){console.log("creating db");var db=openRequest.result;db.createObjectStore(FS.DB_STORE_NAME);};openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;var transaction=db.transaction([FS.DB_STORE_NAME],"readwrite");var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach((function(path){var putRequest=files.put(FS.analyzePath(path).object.contents,path);putRequest.onsuccess=function putRequest_onsuccess(){ok++;if(ok+fail==total)finish();};putRequest.onerror=function putRequest_onerror(){fail++;if(ok+fail==total)finish();};}));transaction.onerror=onerror;};openRequest.onerror=onerror;}),loadFilesFromDB:(function(paths,onload,onerror){onload=onload||(function(){});onerror=onerror||(function(){});var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=onerror;openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;try{var transaction=db.transaction([FS.DB_STORE_NAME],"readonly");}catch(e){onerror(e);return}var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach((function(path){var getRequest=files.get(path);getRequest.onsuccess=function getRequest_onsuccess(){if(FS.analyzePath(path).exists){FS.unlink(path);}FS.createDataFile(PATH.dirname(path),PATH.basename(path),getRequest.result,true,true,true);ok++;if(ok+fail==total)finish();};getRequest.onerror=function getRequest_onerror(){fail++;if(ok+fail==total)finish();};}));transaction.onerror=onerror;};openRequest.onerror=onerror;})};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:(function(dirfd,path){if(path[0]!=="/"){var dir;if(dirfd===-100){dir=FS.cwd();}else {var dirstream=FS.getStream(dirfd);if(!dirstream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);dir=dirstream.path;}path=PATH.join2(dir,path);}return path}),doStat:(function(func,path,buf){try{var stat=func(path);}catch(e){if(e&&e.node&&PATH.normalize(path)!==PATH.normalize(FS.getPath(e.node))){return -ERRNO_CODES.ENOTDIR}throw e}HEAP32[buf>>2]=stat.dev;HEAP32[buf+4>>2]=0;HEAP32[buf+8>>2]=stat.ino;HEAP32[buf+12>>2]=stat.mode;HEAP32[buf+16>>2]=stat.nlink;HEAP32[buf+20>>2]=stat.uid;HEAP32[buf+24>>2]=stat.gid;HEAP32[buf+28>>2]=stat.rdev;HEAP32[buf+32>>2]=0;HEAP32[buf+36>>2]=stat.size;HEAP32[buf+40>>2]=4096;HEAP32[buf+44>>2]=stat.blocks;HEAP32[buf+48>>2]=stat.atime.getTime()/1e3|0;HEAP32[buf+52>>2]=0;HEAP32[buf+56>>2]=stat.mtime.getTime()/1e3|0;HEAP32[buf+60>>2]=0;HEAP32[buf+64>>2]=stat.ctime.getTime()/1e3|0;HEAP32[buf+68>>2]=0;HEAP32[buf+72>>2]=stat.ino;return 0}),doMsync:(function(addr,stream,len,flags){var buffer=new Uint8Array(HEAPU8.subarray(addr,addr+len));FS.msync(stream,buffer,0,len,flags);}),doMkdir:(function(path,mode){path=PATH.normalize(path);if(path[path.length-1]==="/")path=path.substr(0,path.length-1);FS.mkdir(path,mode,0);return 0}),doMknod:(function(path,mode,dev){switch(mode&61440){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -ERRNO_CODES.EINVAL}FS.mknod(path,mode,dev);return 0}),doReadlink:(function(path,buf,bufsize){if(bufsize<=0)return -ERRNO_CODES.EINVAL;var ret=FS.readlink(path);var len=Math.min(bufsize,lengthBytesUTF8(ret));var endChar=HEAP8[buf+len];stringToUTF8(ret,buf,bufsize+1);HEAP8[buf+len]=endChar;return len}),doAccess:(function(path,amode){if(amode&~7){return -ERRNO_CODES.EINVAL}var node;var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;var perms="";if(amode&4)perms+="r";if(amode&2)perms+="w";if(amode&1)perms+="x";if(perms&&FS.nodePermissions(node,perms)){return -ERRNO_CODES.EACCES}return 0}),doDup:(function(path,flags,suggestFD){var suggest=FS.getStream(suggestFD);if(suggest)FS.close(suggest);return FS.open(path,flags,0,suggestFD,suggestFD).fd}),doReadv:(function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.read(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;if(curr<len)break}return ret}),doWritev:(function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.write(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;}return ret}),varargs:0,get:(function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret}),getStr:(function(){var ret=Pointer_stringify(SYSCALLS.get());return ret}),getStreamFromFD:(function(){var stream=FS.getStream(SYSCALLS.get());if(!stream)throw new FS.ErrnoError(ERRNO_CODES.EBADF);return stream}),getSocketFromFD:(function(){var socket=SOCKFS.getSocket(SYSCALLS.get());if(!socket)throw new FS.ErrnoError(ERRNO_CODES.EBADF);return socket}),getSocketAddress:(function(allowNull){var addrp=SYSCALLS.get(),addrlen=SYSCALLS.get();if(allowNull&&addrp===0)return null;var info=__read_sockaddr(addrp,addrlen);if(info.errno)throw new FS.ErrnoError(info.errno);info.addr=DNS.lookup_addr(info.addr)||info.addr;return info}),get64:(function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0)assert(high===0);else assert(high===-1);return low}),getZero:(function(){assert(SYSCALLS.get()===0);})};function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall145(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();return SYSCALLS.doReadv(stream,iov,iovcnt)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();return SYSCALLS.doWritev(stream,iov,iovcnt)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall54(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),op=SYSCALLS.get();switch(op){case 21505:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};case 21506:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};case 21519:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;var argp=SYSCALLS.get();HEAP32[argp>>2]=0;return 0};case 21520:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return -ERRNO_CODES.EINVAL};case 21531:{var argp=SYSCALLS.get();return FS.ioctl(stream,op,argp)};case 21523:{if(!stream.tty)return -ERRNO_CODES.ENOTTY;return 0};default:abort("bad ioctl syscall "+op);}}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___syscall91(which,varargs){SYSCALLS.varargs=varargs;try{var addr=SYSCALLS.get(),len=SYSCALLS.get();var info=SYSCALLS.mappings[addr];if(!info)return 0;if(len===info.len){var stream=FS.getStream(info.fd);SYSCALLS.doMsync(addr,stream,len,info.flags);FS.munmap(stream);SYSCALLS.mappings[addr]=null;if(info.allocated){_free(info.malloc);}}return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_STATIC);function ___unlock(){}var structRegistrations={};function runDestructors(destructors){while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr);}}function simpleReadValueFromPointer(pointer){return this["fromWireType"](HEAPU32[pointer>>2])}var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var char_0=48;var char_9=57;function makeLegalFunctionName(name){if(undefined===name){return "_unknown"}name=name.replace(/[^a-zA-Z0-9_]/g,"$");var f=name.charCodeAt(0);if(f>=char_0&&f<=char_9){return "_"+name}else {return name}}function createNamedFunction(name,body){name=makeLegalFunctionName(name);return (new Function("body","return function "+name+"() {\n"+'    "use strict";'+"    return body.apply(this, arguments);\n"+"};\n"))(body)}function extendError(baseErrorType,errorName){var errorClass=createNamedFunction(errorName,(function(message){this.name=errorName;this.message=message;var stack=(new Error(message)).stack;if(stack!==undefined){this.stack=this.toString()+"\n"+stack.replace(/^Error(:[^\n]*)?\n/,"");}}));errorClass.prototype=Object.create(baseErrorType.prototype);errorClass.prototype.constructor=errorClass;errorClass.prototype.toString=(function(){if(this.message===undefined){return this.name}else {return this.name+": "+this.message}});return errorClass}var InternalError=undefined;function throwInternalError(message){throw new InternalError(message)}function whenDependentTypesAreResolved(myTypes,dependentTypes,getTypeConverters){myTypes.forEach((function(type){typeDependencies[type]=dependentTypes;}));function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count");}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i]);}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;dependentTypes.forEach((function(dt,i){if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt];}else {unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[];}awaitingDependencies[dt].push((function(){typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters);}}));}}));if(0===unregisteredTypes.length){onComplete(typeConverters);}}function __embind_finalize_value_object(structType){var reg=structRegistrations[structType];delete structRegistrations[structType];var rawConstructor=reg.rawConstructor;var rawDestructor=reg.rawDestructor;var fieldRecords=reg.fields;var fieldTypes=fieldRecords.map((function(field){return field.getterReturnType})).concat(fieldRecords.map((function(field){return field.setterArgumentType})));whenDependentTypesAreResolved([structType],fieldTypes,(function(fieldTypes){var fields={};fieldRecords.forEach((function(field,i){var fieldName=field.fieldName;var getterReturnType=fieldTypes[i];var getter=field.getter;var getterContext=field.getterContext;var setterArgumentType=fieldTypes[i+fieldRecords.length];var setter=field.setter;var setterContext=field.setterContext;fields[fieldName]={read:(function(ptr){return getterReturnType["fromWireType"](getter(getterContext,ptr))}),write:(function(ptr,o){var destructors=[];setter(setterContext,ptr,setterArgumentType["toWireType"](destructors,o));runDestructors(destructors);})};}));return [{name:reg.name,"fromWireType":(function(ptr){var rv={};for(var i in fields){rv[i]=fields[i].read(ptr);}rawDestructor(ptr);return rv}),"toWireType":(function(destructors,o){for(var fieldName in fields){if(!(fieldName in o)){throw new TypeError("Missing field")}}var ptr=rawConstructor();for(fieldName in fields){fields[fieldName].write(ptr,o[fieldName]);}if(destructors!==null){destructors.push(rawDestructor,ptr);}return ptr}),"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:rawDestructor}]}));}function getShiftFromSize(size){switch(size){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+size)}}function embind_init_charCodes(){var codes=new Array(256);for(var i=0;i<256;++i){codes[i]=String.fromCharCode(i);}embind_charCodes=codes;}var embind_charCodes=undefined;function readLatin1String(ptr){var ret="";var c=ptr;while(HEAPU8[c]){ret+=embind_charCodes[HEAPU8[c++]];}return ret}var BindingError=undefined;function throwBindingError(message){throw new BindingError(message)}function registerType(rawType,registeredInstance,options){options=options||{};if(!("argPackAdvance"in registeredInstance)){throw new TypeError("registerType registeredInstance requires argPackAdvance")}var name=registeredInstance.name;if(!rawType){throwBindingError('type "'+name+'" must have a positive integer typeid pointer');}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return}else {throwBindingError("Cannot register type '"+name+"' twice");}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach((function(cb){cb();}));}}function __embind_register_bool(rawType,name,size,trueValue,falseValue){var shift=getShiftFromSize(size);name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":(function(wt){return !!wt}),"toWireType":(function(destructors,o){return o?trueValue:falseValue}),"argPackAdvance":8,"readValueFromPointer":(function(pointer){var heap;if(size===1){heap=HEAP8;}else if(size===2){heap=HEAP16;}else if(size===4){heap=HEAP32;}else {throw new TypeError("Unknown boolean type size: "+name)}return this["fromWireType"](heap[pointer>>shift])}),destructorFunction:null});}function ClassHandle_isAliasOf(other){if(!(this instanceof ClassHandle)){return false}if(!(other instanceof ClassHandle)){return false}var leftClass=this.$$.ptrType.registeredClass;var left=this.$$.ptr;var rightClass=other.$$.ptrType.registeredClass;var right=other.$$.ptr;while(leftClass.baseClass){left=leftClass.upcast(left);leftClass=leftClass.baseClass;}while(rightClass.baseClass){right=rightClass.upcast(right);rightClass=rightClass.baseClass;}return leftClass===rightClass&&left===right}function shallowCopyInternalPointer(o){return {count:o.count,deleteScheduled:o.deleteScheduled,preservePointerOnDelete:o.preservePointerOnDelete,ptr:o.ptr,ptrType:o.ptrType,smartPtr:o.smartPtr,smartPtrType:o.smartPtrType}}function throwInstanceAlreadyDeleted(obj){function getInstanceTypeName(handle){return handle.$$.ptrType.registeredClass.name}throwBindingError(getInstanceTypeName(obj)+" instance already deleted");}function ClassHandle_clone(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.preservePointerOnDelete){this.$$.count.value+=1;return this}else {var clone=Object.create(Object.getPrototypeOf(this),{$$:{value:shallowCopyInternalPointer(this.$$)}});clone.$$.count.value+=1;clone.$$.deleteScheduled=false;return clone}}function runDestructor(handle){var $$=handle.$$;if($$.smartPtr){$$.smartPtrType.rawDestructor($$.smartPtr);}else {$$.ptrType.registeredClass.rawDestructor($$.ptr);}}function ClassHandle_delete(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion");}this.$$.count.value-=1;var toDelete=0===this.$$.count.value;if(toDelete){runDestructor(this);}if(!this.$$.preservePointerOnDelete){this.$$.smartPtr=undefined;this.$$.ptr=undefined;}}function ClassHandle_isDeleted(){return !this.$$.ptr}var delayFunction=undefined;var deletionQueue=[];function flushPendingDeletes(){while(deletionQueue.length){var obj=deletionQueue.pop();obj.$$.deleteScheduled=false;obj["delete"]();}}function ClassHandle_deleteLater(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion");}deletionQueue.push(this);if(deletionQueue.length===1&&delayFunction){delayFunction(flushPendingDeletes);}this.$$.deleteScheduled=true;return this}function init_ClassHandle(){ClassHandle.prototype["isAliasOf"]=ClassHandle_isAliasOf;ClassHandle.prototype["clone"]=ClassHandle_clone;ClassHandle.prototype["delete"]=ClassHandle_delete;ClassHandle.prototype["isDeleted"]=ClassHandle_isDeleted;ClassHandle.prototype["deleteLater"]=ClassHandle_deleteLater;}function ClassHandle(){}var registeredPointers={};function ensureOverloadTable(proto,methodName,humanName){if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=(function(){if(!proto[methodName].overloadTable.hasOwnProperty(arguments.length)){throwBindingError("Function '"+humanName+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+proto[methodName].overloadTable+")!");}return proto[methodName].overloadTable[arguments.length].apply(this,arguments)});proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc;}}function exposePublicSymbol(name,value,numArguments){if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError("Cannot register public name '"+name+"' twice");}ensureOverloadTable(Module,name,name);if(Module.hasOwnProperty(numArguments)){throwBindingError("Cannot register multiple overloads of a function with the same number of arguments ("+numArguments+")!");}Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;if(undefined!==numArguments){Module[name].numArguments=numArguments;}}}function RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast){this.name=name;this.constructor=constructor;this.instancePrototype=instancePrototype;this.rawDestructor=rawDestructor;this.baseClass=baseClass;this.getActualType=getActualType;this.upcast=upcast;this.downcast=downcast;this.pureVirtualFunctions=[];}function upcastPointer(ptr,ptrClass,desiredClass){while(ptrClass!==desiredClass){if(!ptrClass.upcast){throwBindingError("Expected null or instance of "+desiredClass.name+", got an instance of "+ptrClass.name);}ptr=ptrClass.upcast(ptr);ptrClass=ptrClass.baseClass;}return ptr}function constNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name);}return 0}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name);}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name);}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function genericPointerToWireType(destructors,handle){var ptr;if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name);}if(this.isSmartPointer){ptr=this.rawConstructor();if(destructors!==null){destructors.push(this.rawDestructor,ptr);}return ptr}else {return 0}}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name);}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name);}if(!this.isConst&&handle.$$.ptrType.isConst){throwBindingError("Cannot convert argument of type "+(handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name)+" to parameter type "+this.name);}var handleClass=handle.$$.ptrType.registeredClass;ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);if(this.isSmartPointer){if(undefined===handle.$$.smartPtr){throwBindingError("Passing raw pointer to smart pointer is illegal");}switch(this.sharingPolicy){case 0:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr;}else {throwBindingError("Cannot convert argument of type "+(handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name)+" to parameter type "+this.name);}break;case 1:ptr=handle.$$.smartPtr;break;case 2:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr;}else {var clonedHandle=handle["clone"]();ptr=this.rawShare(ptr,__emval_register((function(){clonedHandle["delete"]();})));if(destructors!==null){destructors.push(this.rawDestructor,ptr);}}break;default:throwBindingError("Unsupporting sharing policy");}}return ptr}function nonConstNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name);}return 0}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name);}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name);}if(handle.$$.ptrType.isConst){throwBindingError("Cannot convert argument of type "+handle.$$.ptrType.name+" to parameter type "+this.name);}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function RegisteredPointer_getPointee(ptr){if(this.rawGetPointee){ptr=this.rawGetPointee(ptr);}return ptr}function RegisteredPointer_destructor(ptr){if(this.rawDestructor){this.rawDestructor(ptr);}}function RegisteredPointer_deleteObject(handle){if(handle!==null){handle["delete"]();}}function downcastPointer(ptr,ptrClass,desiredClass){if(ptrClass===desiredClass){return ptr}if(undefined===desiredClass.baseClass){return null}var rv=downcastPointer(ptr,ptrClass,desiredClass.baseClass);if(rv===null){return null}return desiredClass.downcast(rv)}function getInheritedInstanceCount(){return Object.keys(registeredInstances).length}function getLiveInheritedInstances(){var rv=[];for(var k in registeredInstances){if(registeredInstances.hasOwnProperty(k)){rv.push(registeredInstances[k]);}}return rv}function setDelayFunction(fn){delayFunction=fn;if(deletionQueue.length&&delayFunction){delayFunction(flushPendingDeletes);}}function init_embind(){Module["getInheritedInstanceCount"]=getInheritedInstanceCount;Module["getLiveInheritedInstances"]=getLiveInheritedInstances;Module["flushPendingDeletes"]=flushPendingDeletes;Module["setDelayFunction"]=setDelayFunction;}var registeredInstances={};function getBasestPointer(class_,ptr){if(ptr===undefined){throwBindingError("ptr should not be undefined");}while(class_.baseClass){ptr=class_.upcast(ptr);class_=class_.baseClass;}return ptr}function getInheritedInstance(class_,ptr){ptr=getBasestPointer(class_,ptr);return registeredInstances[ptr]}function makeClassHandle(prototype,record){if(!record.ptrType||!record.ptr){throwInternalError("makeClassHandle requires ptr and ptrType");}var hasSmartPtrType=!!record.smartPtrType;var hasSmartPtr=!!record.smartPtr;if(hasSmartPtrType!==hasSmartPtr){throwInternalError("Both smartPtrType and smartPtr must be specified");}record.count={value:1};return Object.create(prototype,{$$:{value:record}})}function RegisteredPointer_fromWireType(ptr){var rawPointer=this.getPointee(ptr);if(!rawPointer){this.destructor(ptr);return null}var registeredInstance=getInheritedInstance(this.registeredClass,rawPointer);if(undefined!==registeredInstance){if(0===registeredInstance.$$.count.value){registeredInstance.$$.ptr=rawPointer;registeredInstance.$$.smartPtr=ptr;return registeredInstance["clone"]()}else {var rv=registeredInstance["clone"]();this.destructor(ptr);return rv}}function makeDefaultHandle(){if(this.isSmartPointer){return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:rawPointer,smartPtrType:this,smartPtr:ptr})}else {return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this,ptr:ptr})}}var actualType=this.registeredClass.getActualType(rawPointer);var registeredPointerRecord=registeredPointers[actualType];if(!registeredPointerRecord){return makeDefaultHandle.call(this)}var toType;if(this.isConst){toType=registeredPointerRecord.constPointerType;}else {toType=registeredPointerRecord.pointerType;}var dp=downcastPointer(rawPointer,this.registeredClass,toType.registeredClass);if(dp===null){return makeDefaultHandle.call(this)}if(this.isSmartPointer){return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp,smartPtrType:this,smartPtr:ptr})}else {return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp})}}function init_RegisteredPointer(){RegisteredPointer.prototype.getPointee=RegisteredPointer_getPointee;RegisteredPointer.prototype.destructor=RegisteredPointer_destructor;RegisteredPointer.prototype["argPackAdvance"]=8;RegisteredPointer.prototype["readValueFromPointer"]=simpleReadValueFromPointer;RegisteredPointer.prototype["deleteObject"]=RegisteredPointer_deleteObject;RegisteredPointer.prototype["fromWireType"]=RegisteredPointer_fromWireType;}function RegisteredPointer(name,registeredClass,isReference,isConst,isSmartPointer,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor){this.name=name;this.registeredClass=registeredClass;this.isReference=isReference;this.isConst=isConst;this.isSmartPointer=isSmartPointer;this.pointeeType=pointeeType;this.sharingPolicy=sharingPolicy;this.rawGetPointee=rawGetPointee;this.rawConstructor=rawConstructor;this.rawShare=rawShare;this.rawDestructor=rawDestructor;if(!isSmartPointer&&registeredClass.baseClass===undefined){if(isConst){this["toWireType"]=constNoSmartPtrRawPointerToWireType;this.destructorFunction=null;}else {this["toWireType"]=nonConstNoSmartPtrRawPointerToWireType;this.destructorFunction=null;}}else {this["toWireType"]=genericPointerToWireType;}}function replacePublicSymbol(name,value,numArguments){if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistant public symbol");}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;Module[name].argCount=numArguments;}}function requireFunction(signature,rawFunction){signature=readLatin1String(signature);function makeDynCaller(dynCall){var args=[];for(var i=1;i<signature.length;++i){args.push("a"+i);}var name="dynCall_"+signature+"_"+rawFunction;var body="return function "+name+"("+args.join(", ")+") {\n";body+="    return dynCall(rawFunction"+(args.length?", ":"")+args.join(", ")+");\n";body+="};\n";return (new Function("dynCall","rawFunction",body))(dynCall,rawFunction)}var fp;if(Module["FUNCTION_TABLE_"+signature]!==undefined){fp=Module["FUNCTION_TABLE_"+signature][rawFunction];}else if(typeof FUNCTION_TABLE!=="undefined"){fp=FUNCTION_TABLE[rawFunction];}else {var dc=Module["asm"]["dynCall_"+signature];if(dc===undefined){dc=Module["asm"]["dynCall_"+signature.replace(/f/g,"d")];if(dc===undefined){throwBindingError("No dynCall invoker for signature: "+signature);}}fp=makeDynCaller(dc);}if(typeof fp!=="function"){throwBindingError("unknown function pointer with signature "+signature+": "+rawFunction);}return fp}var UnboundTypeError=undefined;function getTypeName(type){var ptr=___getTypeName(type);var rv=readLatin1String(ptr);_free(ptr);return rv}function throwUnboundTypeError(message,types){var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return}if(registeredTypes[type]){return}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return}unboundTypes.push(type);seen[type]=true;}types.forEach(visit);throw new UnboundTypeError(message+": "+unboundTypes.map(getTypeName).join([", "]))}function __embind_register_class(rawType,rawPointerType,rawConstPointerType,baseClassRawType,getActualTypeSignature,getActualType,upcastSignature,upcast,downcastSignature,downcast,name,destructorSignature,rawDestructor){name=readLatin1String(name);getActualType=requireFunction(getActualTypeSignature,getActualType);if(upcast){upcast=requireFunction(upcastSignature,upcast);}if(downcast){downcast=requireFunction(downcastSignature,downcast);}rawDestructor=requireFunction(destructorSignature,rawDestructor);var legalFunctionName=makeLegalFunctionName(name);exposePublicSymbol(legalFunctionName,(function(){throwUnboundTypeError("Cannot construct "+name+" due to unbound types",[baseClassRawType]);}));whenDependentTypesAreResolved([rawType,rawPointerType,rawConstPointerType],baseClassRawType?[baseClassRawType]:[],(function(base){base=base[0];var baseClass;var basePrototype;if(baseClassRawType){baseClass=base.registeredClass;basePrototype=baseClass.instancePrototype;}else {basePrototype=ClassHandle.prototype;}var constructor=createNamedFunction(legalFunctionName,(function(){if(Object.getPrototypeOf(this)!==instancePrototype){throw new BindingError("Use 'new' to construct "+name)}if(undefined===registeredClass.constructor_body){throw new BindingError(name+" has no accessible constructor")}var body=registeredClass.constructor_body[arguments.length];if(undefined===body){throw new BindingError("Tried to invoke ctor of "+name+" with invalid number of parameters ("+arguments.length+") - expected ("+Object.keys(registeredClass.constructor_body).toString()+") parameters instead!")}return body.apply(this,arguments)}));var instancePrototype=Object.create(basePrototype,{constructor:{value:constructor}});constructor.prototype=instancePrototype;var registeredClass=new RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast);var referenceConverter=new RegisteredPointer(name,registeredClass,true,false,false);var pointerConverter=new RegisteredPointer(name+"*",registeredClass,false,false,false);var constPointerConverter=new RegisteredPointer(name+" const*",registeredClass,false,true,false);registeredPointers[rawType]={pointerType:pointerConverter,constPointerType:constPointerConverter};replacePublicSymbol(legalFunctionName,constructor);return [referenceConverter,pointerConverter,constPointerConverter]}));}var emval_free_list=[];var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle){if(handle>4&&0===--emval_handle_array[handle].refcount){emval_handle_array[handle]=undefined;emval_free_list.push(handle);}}function count_emval_handles(){var count=0;for(var i=5;i<emval_handle_array.length;++i){if(emval_handle_array[i]!==undefined){++count;}}return count}function get_first_emval(){for(var i=5;i<emval_handle_array.length;++i){if(emval_handle_array[i]!==undefined){return emval_handle_array[i]}}return null}function init_emval(){Module["count_emval_handles"]=count_emval_handles;Module["get_first_emval"]=get_first_emval;}function __emval_register(value){switch(value){case undefined:{return 1}case null:{return 2}case true:{return 3}case false:{return 4}default:{var handle=emval_free_list.length?emval_free_list.pop():emval_handle_array.length;emval_handle_array[handle]={refcount:1,value:value};return handle}}}function __embind_register_emval(rawType,name){name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":(function(handle){var rv=emval_handle_array[handle].value;__emval_decref(handle);return rv}),"toWireType":(function(destructors,value){return __emval_register(value)}),"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:null});}function enumReadValueFromPointer(name,shift,signed){switch(shift){case 0:return(function(pointer){var heap=signed?HEAP8:HEAPU8;return this["fromWireType"](heap[pointer])});case 1:return(function(pointer){var heap=signed?HEAP16:HEAPU16;return this["fromWireType"](heap[pointer>>1])});case 2:return(function(pointer){var heap=signed?HEAP32:HEAPU32;return this["fromWireType"](heap[pointer>>2])});default:throw new TypeError("Unknown integer type: "+name)}}function __embind_register_enum(rawType,name,size,isSigned){var shift=getShiftFromSize(size);name=readLatin1String(name);function ctor(){}ctor.values={};registerType(rawType,{name:name,constructor:ctor,"fromWireType":(function(c){return this.constructor.values[c]}),"toWireType":(function(destructors,c){return c.value}),"argPackAdvance":8,"readValueFromPointer":enumReadValueFromPointer(name,shift,isSigned),destructorFunction:null});exposePublicSymbol(name,ctor);}function requireRegisteredType(rawType,humanName){var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(humanName+" has unknown type "+getTypeName(rawType));}return impl}function __embind_register_enum_value(rawEnumType,name,enumValue){var enumType=requireRegisteredType(rawEnumType,"enum");name=readLatin1String(name);var Enum=enumType.constructor;var Value=Object.create(enumType.constructor.prototype,{value:{value:enumValue},constructor:{value:createNamedFunction(enumType.name+"_"+name,(function(){}))}});Enum.values[enumValue]=Value;Enum[name]=Value;}function _embind_repr(v){if(v===null){return "null"}var t=typeof v;if(t==="object"||t==="array"||t==="function"){return v.toString()}else {return ""+v}}function floatReadValueFromPointer(name,shift){switch(shift){case 2:return(function(pointer){return this["fromWireType"](HEAPF32[pointer>>2])});case 3:return(function(pointer){return this["fromWireType"](HEAPF64[pointer>>3])});default:throw new TypeError("Unknown float type: "+name)}}function __embind_register_float(rawType,name,size){var shift=getShiftFromSize(size);name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":(function(value){return value}),"toWireType":(function(destructors,value){if(typeof value!=="number"&&typeof value!=="boolean"){throw new TypeError('Cannot convert "'+_embind_repr(value)+'" to '+this.name)}return value}),"argPackAdvance":8,"readValueFromPointer":floatReadValueFromPointer(name,shift),destructorFunction:null});}function new_(constructor,argumentList){if(!(constructor instanceof Function)){throw new TypeError("new_ called with constructor type "+typeof constructor+" which is not a function")}var dummy=createNamedFunction(constructor.name||"unknownFunctionName",(function(){}));dummy.prototype=constructor.prototype;var obj=new dummy;var r=constructor.apply(obj,argumentList);return r instanceof Object?r:obj}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=false;for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){needsDestructorStack=true;break}}var returns=argTypes[0].name!=="void";var argsList="";var argsListWired="";for(var i=0;i<argCount-2;++i){argsList+=(i!==0?", ":"")+"arg"+i;argsListWired+=(i!==0?", ":"")+"arg"+i+"Wired";}var invokerFnBody="return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n"+"if (arguments.length !== "+(argCount-2)+") {\n"+"throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount-2)+" args!');\n"+"}\n";if(needsDestructorStack){invokerFnBody+="var destructors = [];\n";}var dtorStack=needsDestructorStack?"destructors":"null";var args1=["throwBindingError","invoker","fn","runDestructors","retType","classParam"];var args2=[throwBindingError,cppInvokerFunc,cppTargetFunc,runDestructors,argTypes[0],argTypes[1]];if(isClassMethodFunc){invokerFnBody+="var thisWired = classParam.toWireType("+dtorStack+", this);\n";}for(var i=0;i<argCount-2;++i){invokerFnBody+="var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";args1.push("argType"+i);args2.push(argTypes[i+2]);}if(isClassMethodFunc){argsListWired="thisWired"+(argsListWired.length>0?", ":"")+argsListWired;}invokerFnBody+=(returns?"var rv = ":"")+"invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";if(needsDestructorStack){invokerFnBody+="runDestructors(destructors);\n";}else {for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){var paramName=i===1?"thisWired":"arg"+(i-2)+"Wired";if(argTypes[i].destructorFunction!==null){invokerFnBody+=paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";args1.push(paramName+"_dtor");args2.push(argTypes[i].destructorFunction);}}}if(returns){invokerFnBody+="var ret = retType.fromWireType(rv);\n"+"return ret;\n";}invokerFnBody+="}\n";args1.push(invokerFnBody);var invokerFunction=new_(Function,args1).apply(null,args2);return invokerFunction}function heap32VectorToArray(count,firstElement){var array=[];for(var i=0;i<count;i++){array.push(HEAP32[(firstElement>>2)+i]);}return array}function __embind_register_function(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn){var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=readLatin1String(name);rawInvoker=requireFunction(signature,rawInvoker);exposePublicSymbol(name,(function(){throwUnboundTypeError("Cannot call "+name+" due to unbound types",argTypes);}),argCount-1);whenDependentTypesAreResolved([],argTypes,(function(argTypes){var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn),argCount-1);return []}));}function integerReadValueFromPointer(name,shift,signed){switch(shift){case 0:return signed?function readS8FromPointer(pointer){return HEAP8[pointer]}:function readU8FromPointer(pointer){return HEAPU8[pointer]};case 1:return signed?function readS16FromPointer(pointer){return HEAP16[pointer>>1]}:function readU16FromPointer(pointer){return HEAPU16[pointer>>1]};case 2:return signed?function readS32FromPointer(pointer){return HEAP32[pointer>>2]}:function readU32FromPointer(pointer){return HEAPU32[pointer>>2]};default:throw new TypeError("Unknown integer type: "+name)}}function __embind_register_integer(primitiveType,name,size,minRange,maxRange){name=readLatin1String(name);if(maxRange===-1){maxRange=4294967295;}var shift=getShiftFromSize(size);var fromWireType=(function(value){return value});if(minRange===0){var bitshift=32-8*size;fromWireType=(function(value){return value<<bitshift>>>bitshift});}var isUnsignedType=name.indexOf("unsigned")!=-1;registerType(primitiveType,{name:name,"fromWireType":fromWireType,"toWireType":(function(destructors,value){if(typeof value!=="number"&&typeof value!=="boolean"){throw new TypeError('Cannot convert "'+_embind_repr(value)+'" to '+this.name)}if(value<minRange||value>maxRange){throw new TypeError('Passing a number "'+_embind_repr(value)+'" from JS side to C/C++ side to an argument of type "'+name+'", which is outside the valid range ['+minRange+", "+maxRange+"]!")}return isUnsignedType?value>>>0:value|0}),"argPackAdvance":8,"readValueFromPointer":integerReadValueFromPointer(name,shift,minRange!==0),destructorFunction:null});}function __embind_register_memory_view(rawType,dataTypeIndex,name){var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){handle=handle>>2;var heap=HEAPU32;var size=heap[handle];var data=heap[handle+1];return new TA(heap["buffer"],data,size)}name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":decodeMemoryView,"argPackAdvance":8,"readValueFromPointer":decodeMemoryView},{ignoreDuplicateRegistrations:true});}function __embind_register_std_string(rawType,name){name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":(function(value){var length=HEAPU32[value>>2];var a=new Array(length);for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAPU8[value+4+i]);}_free(value);return a.join("")}),"toWireType":(function(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value);}function getTAElement(ta,index){return ta[index]}function getStringElement(string,index){return string.charCodeAt(index)}var getElement;if(value instanceof Uint8Array){getElement=getTAElement;}else if(value instanceof Uint8ClampedArray){getElement=getTAElement;}else if(value instanceof Int8Array){getElement=getTAElement;}else if(typeof value==="string"){getElement=getStringElement;}else {throwBindingError("Cannot pass non-string to std::string");}var length=value.length;var ptr=_malloc(4+length);HEAPU32[ptr>>2]=length;for(var i=0;i<length;++i){var charCode=getElement(value,i);if(charCode>255){_free(ptr);throwBindingError("String has UTF-16 code units that do not fit in 8 bits");}HEAPU8[ptr+4+i]=charCode;}if(destructors!==null){destructors.push(_free,ptr);}return ptr}),"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:(function(ptr){_free(ptr);})});}function __embind_register_std_wstring(rawType,charSize,name){name=readLatin1String(name);var getHeap,shift;if(charSize===2){getHeap=(function(){return HEAPU16});shift=1;}else if(charSize===4){getHeap=(function(){return HEAPU32});shift=2;}registerType(rawType,{name:name,"fromWireType":(function(value){var HEAP=getHeap();var length=HEAPU32[value>>2];var a=new Array(length);var start=value+4>>shift;for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAP[start+i]);}_free(value);return a.join("")}),"toWireType":(function(destructors,value){var HEAP=getHeap();var length=value.length;var ptr=_malloc(4+length*charSize);HEAPU32[ptr>>2]=length;var start=ptr+4>>shift;for(var i=0;i<length;++i){HEAP[start+i]=value.charCodeAt(i);}if(destructors!==null){destructors.push(_free,ptr);}return ptr}),"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:(function(ptr){_free(ptr);})});}function __embind_register_value_object(rawType,name,constructorSignature,rawConstructor,destructorSignature,rawDestructor){structRegistrations[rawType]={name:readLatin1String(name),rawConstructor:requireFunction(constructorSignature,rawConstructor),rawDestructor:requireFunction(destructorSignature,rawDestructor),fields:[]};}function __embind_register_value_object_field(structType,fieldName,getterReturnType,getterSignature,getter,getterContext,setterArgumentType,setterSignature,setter,setterContext){structRegistrations[structType].fields.push({fieldName:readLatin1String(fieldName),getterReturnType:getterReturnType,getter:requireFunction(getterSignature,getter),getterContext:getterContext,setterArgumentType:setterArgumentType,setter:requireFunction(setterSignature,setter),setterContext:setterContext});}function __embind_register_void(rawType,name){name=readLatin1String(name);registerType(rawType,{isVoid:true,name:name,"argPackAdvance":0,"fromWireType":(function(){return undefined}),"toWireType":(function(destructors,o){return undefined})});}function __emval_incref(handle){if(handle>4){emval_handle_array[handle].refcount+=1;}}function __emval_new_array(){return __emval_register([])}var emval_symbols={};function getStringOrSymbol(address){var symbol=emval_symbols[address];if(symbol===undefined){return readLatin1String(address)}else {return symbol}}function __emval_new_cstring(v){return __emval_register(getStringOrSymbol(v))}function __emval_new_object(){return __emval_register({})}function requireHandle(handle){if(!handle){throwBindingError("Cannot use deleted val. handle = "+handle);}return emval_handle_array[handle].value}function __emval_set_property(handle,key,value){handle=requireHandle(handle);key=requireHandle(key);value=requireHandle(value);handle[key]=value;}function __emval_take_value(type,argv){type=requireRegisteredType(type,"_emval_take_value");var v=type["readValueFromPointer"](argv);return __emval_register(v)}function _abort(){Module["abort"]();}var _environ=STATICTOP;STATICTOP+=16;function ___buildEnvironment(env){var MAX_ENV_VALUES=64;var TOTAL_ENV_SIZE=1024;var poolPtr;var envPtr;if(!___buildEnvironment.called){___buildEnvironment.called=true;ENV["USER"]=ENV["LOGNAME"]="web_user";ENV["PATH"]="/";ENV["PWD"]="/";ENV["HOME"]="/home/web_user";ENV["LANG"]="C.UTF-8";ENV["_"]=Module["thisProgram"];poolPtr=allocate(TOTAL_ENV_SIZE,"i8",ALLOC_STATIC);envPtr=allocate(MAX_ENV_VALUES*4,"i8*",ALLOC_STATIC);HEAP32[envPtr>>2]=poolPtr;HEAP32[_environ>>2]=envPtr;}else {envPtr=HEAP32[_environ>>2];poolPtr=HEAP32[envPtr>>2];}var strings=[];var totalSize=0;for(var key in env){if(typeof env[key]==="string"){var line=key+"="+env[key];strings.push(line);totalSize+=line.length;}}if(totalSize>TOTAL_ENV_SIZE){throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")}var ptrSize=4;for(var i=0;i<strings.length;i++){var line=strings[i];writeAsciiToMemory(line,poolPtr);HEAP32[envPtr+i*ptrSize>>2]=poolPtr;poolPtr+=line.length+1;}HEAP32[envPtr+strings.length*ptrSize>>2]=0;}var ENV={};function _getenv(name){if(name===0)return 0;name=Pointer_stringify(name);if(!ENV.hasOwnProperty(name))return 0;if(_getenv.ret)_free(_getenv.ret);_getenv.ret=allocate(intArrayFromString(ENV[name]),"i8",ALLOC_NORMAL);return _getenv.ret}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}function _pthread_cond_destroy(){return 0}function _pthread_cond_init(){return 0}function _pthread_cond_signal(){return 0}function _pthread_cond_wait(){return 0}var PTHREAD_SPECIFIC={};function _pthread_getspecific(key){return PTHREAD_SPECIFIC[key]||0}function _pthread_join(){}var PTHREAD_SPECIFIC_NEXT_KEY=1;function _pthread_key_create(key,destructor){if(key==0){return ERRNO_CODES.EINVAL}HEAP32[key>>2]=PTHREAD_SPECIFIC_NEXT_KEY;PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY]=0;PTHREAD_SPECIFIC_NEXT_KEY++;return 0}function _pthread_mutex_destroy(){}function _pthread_mutex_init(){}function _pthread_once(ptr,func){if(!_pthread_once.seen)_pthread_once.seen={};if(ptr in _pthread_once.seen)return;Module["dynCall_v"](func);_pthread_once.seen[ptr]=1;}function _pthread_setspecific(key,value){if(!(key in PTHREAD_SPECIFIC)){return ERRNO_CODES.EINVAL}PTHREAD_SPECIFIC[key]=value;return 0}function __isLeapYear(year){return year%4===0&&(year%100!==0||year%400===0)}function __arraySum(array,index){var sum=0;for(var i=0;i<=index;sum+=array[i++]);return sum}var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date,days){var newDate=new Date(date.getTime());while(days>0){var leap=__isLeapYear(newDate.getFullYear());var currentMonth=newDate.getMonth();var daysInCurrentMonth=(leap?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR)[currentMonth];if(days>daysInCurrentMonth-newDate.getDate()){days-=daysInCurrentMonth-newDate.getDate()+1;newDate.setDate(1);if(currentMonth<11){newDate.setMonth(currentMonth+1);}else {newDate.setMonth(0);newDate.setFullYear(newDate.getFullYear()+1);}}else {newDate.setDate(newDate.getDate()+days);return newDate}}return newDate}function _strftime(s,maxsize,format,tm){var tm_zone=HEAP32[tm+40>>2];var date={tm_sec:HEAP32[tm>>2],tm_min:HEAP32[tm+4>>2],tm_hour:HEAP32[tm+8>>2],tm_mday:HEAP32[tm+12>>2],tm_mon:HEAP32[tm+16>>2],tm_year:HEAP32[tm+20>>2],tm_wday:HEAP32[tm+24>>2],tm_yday:HEAP32[tm+28>>2],tm_isdst:HEAP32[tm+32>>2],tm_gmtoff:HEAP32[tm+36>>2],tm_zone:tm_zone?Pointer_stringify(tm_zone):""};var pattern=Pointer_stringify(format);var EXPANSION_RULES_1={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S"};for(var rule in EXPANSION_RULES_1){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_1[rule]);}var WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];function leadingSomething(value,digits,character){var str=typeof value==="number"?value.toString():value||"";while(str.length<digits){str=character[0]+str;}return str}function leadingNulls(value,digits){return leadingSomething(value,digits,"0")}function compareByDay(date1,date2){function sgn(value){return value<0?-1:value>0?1:0}var compare;if((compare=sgn(date1.getFullYear()-date2.getFullYear()))===0){if((compare=sgn(date1.getMonth()-date2.getMonth()))===0){compare=sgn(date1.getDate()-date2.getDate());}}return compare}function getFirstWeekStartDate(janFourth){switch(janFourth.getDay()){case 0:return new Date(janFourth.getFullYear()-1,11,29);case 1:return janFourth;case 2:return new Date(janFourth.getFullYear(),0,3);case 3:return new Date(janFourth.getFullYear(),0,2);case 4:return new Date(janFourth.getFullYear(),0,1);case 5:return new Date(janFourth.getFullYear()-1,11,31);case 6:return new Date(janFourth.getFullYear()-1,11,30)}}function getWeekBasedYear(date){var thisDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);var janFourthThisYear=new Date(thisDate.getFullYear(),0,4);var janFourthNextYear=new Date(thisDate.getFullYear()+1,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);if(compareByDay(firstWeekStartThisYear,thisDate)<=0){if(compareByDay(firstWeekStartNextYear,thisDate)<=0){return thisDate.getFullYear()+1}else {return thisDate.getFullYear()}}else {return thisDate.getFullYear()-1}}var EXPANSION_RULES_2={"%a":(function(date){return WEEKDAYS[date.tm_wday].substring(0,3)}),"%A":(function(date){return WEEKDAYS[date.tm_wday]}),"%b":(function(date){return MONTHS[date.tm_mon].substring(0,3)}),"%B":(function(date){return MONTHS[date.tm_mon]}),"%C":(function(date){var year=date.tm_year+1900;return leadingNulls(year/100|0,2)}),"%d":(function(date){return leadingNulls(date.tm_mday,2)}),"%e":(function(date){return leadingSomething(date.tm_mday,2," ")}),"%g":(function(date){return getWeekBasedYear(date).toString().substring(2)}),"%G":(function(date){return getWeekBasedYear(date)}),"%H":(function(date){return leadingNulls(date.tm_hour,2)}),"%I":(function(date){var twelveHour=date.tm_hour;if(twelveHour==0)twelveHour=12;else if(twelveHour>12)twelveHour-=12;return leadingNulls(twelveHour,2)}),"%j":(function(date){return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900)?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,date.tm_mon-1),3)}),"%m":(function(date){return leadingNulls(date.tm_mon+1,2)}),"%M":(function(date){return leadingNulls(date.tm_min,2)}),"%n":(function(){return "\n"}),"%p":(function(date){if(date.tm_hour>=0&&date.tm_hour<12){return "AM"}else {return "PM"}}),"%S":(function(date){return leadingNulls(date.tm_sec,2)}),"%t":(function(){return "\t"}),"%u":(function(date){var day=new Date(date.tm_year+1900,date.tm_mon+1,date.tm_mday,0,0,0,0);return day.getDay()||7}),"%U":(function(date){var janFirst=new Date(date.tm_year+1900,0,1);var firstSunday=janFirst.getDay()===0?janFirst:__addDays(janFirst,7-janFirst.getDay());var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstSunday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstSundayUntilEndJanuary=31-firstSunday.getDate();var days=firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstSunday,janFirst)===0?"01":"00"}),"%V":(function(date){var janFourthThisYear=new Date(date.tm_year+1900,0,4);var janFourthNextYear=new Date(date.tm_year+1901,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);var endDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);if(compareByDay(endDate,firstWeekStartThisYear)<0){return "53"}if(compareByDay(firstWeekStartNextYear,endDate)<=0){return "01"}var daysDifference;if(firstWeekStartThisYear.getFullYear()<date.tm_year+1900){daysDifference=date.tm_yday+32-firstWeekStartThisYear.getDate();}else {daysDifference=date.tm_yday+1-firstWeekStartThisYear.getDate();}return leadingNulls(Math.ceil(daysDifference/7),2)}),"%w":(function(date){var day=new Date(date.tm_year+1900,date.tm_mon+1,date.tm_mday,0,0,0,0);return day.getDay()}),"%W":(function(date){var janFirst=new Date(date.tm_year,0,1);var firstMonday=janFirst.getDay()===1?janFirst:__addDays(janFirst,janFirst.getDay()===0?1:7-janFirst.getDay()+1);var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstMonday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstMondayUntilEndJanuary=31-firstMonday.getDate();var days=firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstMonday,janFirst)===0?"01":"00"}),"%y":(function(date){return (date.tm_year+1900).toString().substring(2)}),"%Y":(function(date){return date.tm_year+1900}),"%z":(function(date){var off=date.tm_gmtoff;var ahead=off>=0;off=Math.abs(off)/60;off=off/60*100+off%60;return (ahead?"+":"-")+String("0000"+off).slice(-4)}),"%Z":(function(date){return date.tm_zone}),"%%":(function(){return "%"})};for(var rule in EXPANSION_RULES_2){if(pattern.indexOf(rule)>=0){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_2[rule](date));}}var bytes=intArrayFromString(pattern,false);if(bytes.length>maxsize){return 0}writeArrayToMemory(bytes,s);return bytes.length-1}function _strftime_l(s,maxsize,format,tm){return _strftime(s,maxsize,format,tm)}FS.staticInit();__ATINIT__.unshift((function(){if(!Module["noFSInit"]&&!FS.init.initialized)FS.init();}));__ATMAIN__.push((function(){FS.ignorePermissions=false;}));__ATEXIT__.push((function(){FS.quit();}));Module["FS_createFolder"]=FS.createFolder;Module["FS_createPath"]=FS.createPath;Module["FS_createDataFile"]=FS.createDataFile;Module["FS_createPreloadedFile"]=FS.createPreloadedFile;Module["FS_createLazyFile"]=FS.createLazyFile;Module["FS_createLink"]=FS.createLink;Module["FS_createDevice"]=FS.createDevice;Module["FS_unlink"]=FS.unlink;__ATINIT__.unshift((function(){}));__ATEXIT__.push((function(){}));if(ENVIRONMENT_IS_NODE){var fs=require$$0;var NODEJS_PATH=require$$1;NODEFS.staticInit();}InternalError=Module["InternalError"]=extendError(Error,"InternalError");embind_init_charCodes();BindingError=Module["BindingError"]=extendError(Error,"BindingError");init_ClassHandle();init_RegisteredPointer();init_embind();UnboundTypeError=Module["UnboundTypeError"]=extendError(Error,"UnboundTypeError");init_emval();___buildEnvironment(ENV);DYNAMICTOP_PTR=Runtime.staticAlloc(4);STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=Runtime.alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;staticSealed=true;var ASSERTIONS=false;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){if(ASSERTIONS){assert(false,"Character code "+chr+" ("+String.fromCharCode(chr)+")  at offset "+i+" not in 0x00-0xFF.");}chr&=255;}ret.push(String.fromCharCode(chr));}return ret.join("")}var keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var decodeBase64=typeof atob==="function"?atob:(function(input){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");do{enc1=keyStr.indexOf(input.charAt(i++));enc2=keyStr.indexOf(input.charAt(i++));enc3=keyStr.indexOf(input.charAt(i++));enc4=keyStr.indexOf(input.charAt(i++));chr1=enc1<<2|enc2>>4;chr2=(enc2&15)<<4|enc3>>2;chr3=(enc3&3)<<6|enc4;output=output+String.fromCharCode(chr1);if(enc3!==64){output=output+String.fromCharCode(chr2);}if(enc4!==64){output=output+String.fromCharCode(chr3);}}while(i<input.length);return output});function intArrayFromBase64(s){if(typeof ENVIRONMENT_IS_NODE==="boolean"&&ENVIRONMENT_IS_NODE){var buf;try{buf=Buffer$1.from(s,"base64");}catch(_){buf=new Buffer$1(s,"base64");}return new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength)}try{var decoded=decodeBase64(s);var bytes=new Uint8Array(decoded.length);for(var i=0;i<decoded.length;++i){bytes[i]=decoded.charCodeAt(i);}return bytes}catch(_){throw new Error("Converting base64 string to bytes failed.")}}function tryParseAsDataURI(filename){var dataURIPrefix="data:application/octet-stream;base64,";if(!(String.prototype.startsWith?filename.startsWith(dataURIPrefix):filename.indexOf(dataURIPrefix)===0)){return}return intArrayFromBase64(filename.slice(dataURIPrefix.length))}function invoke_i(index){try{return Module["dynCall_i"](index)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_ii(index,a1){try{return Module["dynCall_ii"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iii(index,a1,a2){try{return Module["dynCall_iii"](index,a1,a2)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiii(index,a1,a2,a3,a4){try{return Module["dynCall_iiiii"](index,a1,a2,a3,a4)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiid(index,a1,a2,a3,a4,a5){try{return Module["dynCall_iiiiid"](index,a1,a2,a3,a4,a5)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiii(index,a1,a2,a3,a4,a5){try{return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiiid(index,a1,a2,a3,a4,a5,a6){try{return Module["dynCall_iiiiiid"](index,a1,a2,a3,a4,a5,a6)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6){try{return Module["dynCall_iiiiiii"](index,a1,a2,a3,a4,a5,a6)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7){try{return Module["dynCall_iiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8){try{return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_v(index){try{Module["dynCall_v"](index);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_vi(index,a1){try{Module["dynCall_vi"](index,a1);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_vii(index,a1,a2){try{Module["dynCall_vii"](index,a1,a2);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viii(index,a1,a2,a3){try{Module["dynCall_viii"](index,a1,a2,a3);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiii(index,a1,a2,a3,a4){try{Module["dynCall_viiii"](index,a1,a2,a3,a4);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiii(index,a1,a2,a3,a4,a5){try{Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6){try{Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7){try{Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8){try{Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9){try{Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10){try{Module["dynCall_viiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12){try{Module["dynCall_viiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}function invoke_viiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13){try{Module["dynCall_viiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0);}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity,"byteLength":byteLength};Module.asmLibraryArg={"abort":abort,"assert":assert,"enlargeMemory":enlargeMemory,"getTotalMemory":getTotalMemory,"abortOnCannotGrowMemory":abortOnCannotGrowMemory,"invoke_i":invoke_i,"invoke_ii":invoke_ii,"invoke_iii":invoke_iii,"invoke_iiii":invoke_iiii,"invoke_iiiii":invoke_iiiii,"invoke_iiiiid":invoke_iiiiid,"invoke_iiiiii":invoke_iiiiii,"invoke_iiiiiid":invoke_iiiiiid,"invoke_iiiiiii":invoke_iiiiiii,"invoke_iiiiiiii":invoke_iiiiiiii,"invoke_iiiiiiiii":invoke_iiiiiiiii,"invoke_v":invoke_v,"invoke_vi":invoke_vi,"invoke_vii":invoke_vii,"invoke_viii":invoke_viii,"invoke_viiii":invoke_viiii,"invoke_viiiii":invoke_viiiii,"invoke_viiiiii":invoke_viiiiii,"invoke_viiiiiii":invoke_viiiiiii,"invoke_viiiiiiii":invoke_viiiiiiii,"invoke_viiiiiiiii":invoke_viiiiiiiii,"invoke_viiiiiiiiii":invoke_viiiiiiiiii,"invoke_viiiiiiiiiiii":invoke_viiiiiiiiiiii,"invoke_viiiiiiiiiiiii":invoke_viiiiiiiiiiiii,"ClassHandle":ClassHandle,"ClassHandle_clone":ClassHandle_clone,"ClassHandle_delete":ClassHandle_delete,"ClassHandle_deleteLater":ClassHandle_deleteLater,"ClassHandle_isAliasOf":ClassHandle_isAliasOf,"ClassHandle_isDeleted":ClassHandle_isDeleted,"RegisteredClass":RegisteredClass,"RegisteredPointer":RegisteredPointer,"RegisteredPointer_deleteObject":RegisteredPointer_deleteObject,"RegisteredPointer_destructor":RegisteredPointer_destructor,"RegisteredPointer_fromWireType":RegisteredPointer_fromWireType,"RegisteredPointer_getPointee":RegisteredPointer_getPointee,"__ZSt18uncaught_exceptionv":__ZSt18uncaught_exceptionv,"___assert_fail":___assert_fail,"___buildEnvironment":___buildEnvironment,"___cxa_allocate_exception":___cxa_allocate_exception,"___cxa_begin_catch":___cxa_begin_catch,"___cxa_find_matching_catch":___cxa_find_matching_catch,"___cxa_pure_virtual":___cxa_pure_virtual,"___cxa_throw":___cxa_throw,"___gxx_personality_v0":___gxx_personality_v0,"___lock":___lock,"___map_file":___map_file,"___resumeException":___resumeException,"___setErrNo":___setErrNo,"___syscall140":___syscall140,"___syscall145":___syscall145,"___syscall146":___syscall146,"___syscall54":___syscall54,"___syscall6":___syscall6,"___syscall91":___syscall91,"___unlock":___unlock,"__addDays":__addDays,"__arraySum":__arraySum,"__embind_finalize_value_object":__embind_finalize_value_object,"__embind_register_bool":__embind_register_bool,"__embind_register_class":__embind_register_class,"__embind_register_emval":__embind_register_emval,"__embind_register_enum":__embind_register_enum,"__embind_register_enum_value":__embind_register_enum_value,"__embind_register_float":__embind_register_float,"__embind_register_function":__embind_register_function,"__embind_register_integer":__embind_register_integer,"__embind_register_memory_view":__embind_register_memory_view,"__embind_register_std_string":__embind_register_std_string,"__embind_register_std_wstring":__embind_register_std_wstring,"__embind_register_value_object":__embind_register_value_object,"__embind_register_value_object_field":__embind_register_value_object_field,"__embind_register_void":__embind_register_void,"__emval_decref":__emval_decref,"__emval_incref":__emval_incref,"__emval_new_array":__emval_new_array,"__emval_new_cstring":__emval_new_cstring,"__emval_new_object":__emval_new_object,"__emval_register":__emval_register,"__emval_set_property":__emval_set_property,"__emval_take_value":__emval_take_value,"__isLeapYear":__isLeapYear,"_abort":_abort,"_embind_repr":_embind_repr,"_emscripten_memcpy_big":_emscripten_memcpy_big,"_getenv":_getenv,"_pthread_cond_destroy":_pthread_cond_destroy,"_pthread_cond_init":_pthread_cond_init,"_pthread_cond_signal":_pthread_cond_signal,"_pthread_cond_wait":_pthread_cond_wait,"_pthread_getspecific":_pthread_getspecific,"_pthread_join":_pthread_join,"_pthread_key_create":_pthread_key_create,"_pthread_mutex_destroy":_pthread_mutex_destroy,"_pthread_mutex_init":_pthread_mutex_init,"_pthread_once":_pthread_once,"_pthread_setspecific":_pthread_setspecific,"_strftime":_strftime,"_strftime_l":_strftime_l,"constNoSmartPtrRawPointerToWireType":constNoSmartPtrRawPointerToWireType,"count_emval_handles":count_emval_handles,"craftInvokerFunction":craftInvokerFunction,"createNamedFunction":createNamedFunction,"downcastPointer":downcastPointer,"embind_init_charCodes":embind_init_charCodes,"ensureOverloadTable":ensureOverloadTable,"enumReadValueFromPointer":enumReadValueFromPointer,"exposePublicSymbol":exposePublicSymbol,"extendError":extendError,"floatReadValueFromPointer":floatReadValueFromPointer,"flushPendingDeletes":flushPendingDeletes,"genericPointerToWireType":genericPointerToWireType,"getBasestPointer":getBasestPointer,"getInheritedInstance":getInheritedInstance,"getInheritedInstanceCount":getInheritedInstanceCount,"getLiveInheritedInstances":getLiveInheritedInstances,"getShiftFromSize":getShiftFromSize,"getStringOrSymbol":getStringOrSymbol,"getTypeName":getTypeName,"get_first_emval":get_first_emval,"heap32VectorToArray":heap32VectorToArray,"init_ClassHandle":init_ClassHandle,"init_RegisteredPointer":init_RegisteredPointer,"init_embind":init_embind,"init_emval":init_emval,"integerReadValueFromPointer":integerReadValueFromPointer,"makeClassHandle":makeClassHandle,"makeLegalFunctionName":makeLegalFunctionName,"new_":new_,"nonConstNoSmartPtrRawPointerToWireType":nonConstNoSmartPtrRawPointerToWireType,"readLatin1String":readLatin1String,"registerType":registerType,"replacePublicSymbol":replacePublicSymbol,"requireFunction":requireFunction,"requireHandle":requireHandle,"requireRegisteredType":requireRegisteredType,"runDestructor":runDestructor,"runDestructors":runDestructors,"setDelayFunction":setDelayFunction,"shallowCopyInternalPointer":shallowCopyInternalPointer,"simpleReadValueFromPointer":simpleReadValueFromPointer,"throwBindingError":throwBindingError,"throwInstanceAlreadyDeleted":throwInstanceAlreadyDeleted,"throwInternalError":throwInternalError,"throwUnboundTypeError":throwUnboundTypeError,"upcastPointer":upcastPointer,"whenDependentTypesAreResolved":whenDependentTypesAreResolved,"DYNAMICTOP_PTR":DYNAMICTOP_PTR,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX,"cttz_i8":cttz_i8};// EMSCRIPTEN_START_ASM
		var asm=(/** @suppress {uselessCode} */ function(global,env,buffer) {
		"almost asm";var a=global.Int8Array;var b=new a(buffer);var c=global.Int16Array;var d=new c(buffer);var e=global.Int32Array;var f=new e(buffer);var g=global.Uint8Array;var h=new g(buffer);var i=global.Uint16Array;var j=new i(buffer);var k=global.Uint32Array;new k(buffer);var m=global.Float32Array;var n=new m(buffer);var o=global.Float64Array;var p=new o(buffer);var q=global.byteLength;var r=env.DYNAMICTOP_PTR|0;var s=env.tempDoublePtr|0;env.ABORT|0;var u=env.STACKTOP|0;env.STACK_MAX|0;var w=env.cttz_i8|0;var B=global.NaN,C=global.Infinity;var I=0;var J=global.Math.floor;var K=global.Math.abs;global.Math.sqrt;global.Math.pow;global.Math.cos;global.Math.sin;global.Math.tan;global.Math.acos;global.Math.asin;global.Math.atan;global.Math.atan2;global.Math.exp;global.Math.log;var W=global.Math.ceil;var X=global.Math.imul;global.Math.min;global.Math.max;var _=global.Math.clz32;var $=env.abort;env.assert;var ba=env.enlargeMemory;var ca=env.getTotalMemory;var da=env.abortOnCannotGrowMemory;env.invoke_i;env.invoke_ii;env.invoke_iii;env.invoke_iiii;env.invoke_iiiii;env.invoke_iiiiid;env.invoke_iiiiii;env.invoke_iiiiiid;env.invoke_iiiiiii;env.invoke_iiiiiiii;env.invoke_iiiiiiiii;env.invoke_v;env.invoke_vi;env.invoke_vii;env.invoke_viii;env.invoke_viiii;env.invoke_viiiii;env.invoke_viiiiii;env.invoke_viiiiiii;env.invoke_viiiiiiii;env.invoke_viiiiiiiii;env.invoke_viiiiiiiiii;env.invoke_viiiiiiiiiiii;env.invoke_viiiiiiiiiiiii;env.ClassHandle;env.ClassHandle_clone;env.ClassHandle_delete;env.ClassHandle_deleteLater;env.ClassHandle_isAliasOf;env.ClassHandle_isDeleted;env.RegisteredClass;env.RegisteredPointer;env.RegisteredPointer_deleteObject;env.RegisteredPointer_destructor;env.RegisteredPointer_fromWireType;env.RegisteredPointer_getPointee;var Oa=env.__ZSt18uncaught_exceptionv;var Pa=env.___assert_fail;env.___buildEnvironment;var Ra=env.___cxa_allocate_exception;env.___cxa_begin_catch;env.___cxa_find_matching_catch;var Ua=env.___cxa_pure_virtual;var Va=env.___cxa_throw;env.___gxx_personality_v0;var Xa=env.___lock;var Ya=env.___map_file;env.___resumeException;var _a=env.___setErrNo;var $a=env.___syscall140;var ab=env.___syscall145;var bb=env.___syscall146;var cb=env.___syscall54;var db=env.___syscall6;var eb=env.___syscall91;var fb=env.___unlock;env.__addDays;env.__arraySum;var ib=env.__embind_finalize_value_object;var jb=env.__embind_register_bool;var kb=env.__embind_register_class;var lb=env.__embind_register_emval;var mb=env.__embind_register_enum;var nb=env.__embind_register_enum_value;var ob=env.__embind_register_float;var pb=env.__embind_register_function;var qb=env.__embind_register_integer;var rb=env.__embind_register_memory_view;var sb=env.__embind_register_std_string;var tb=env.__embind_register_std_wstring;var ub=env.__embind_register_value_object;var vb=env.__embind_register_value_object_field;var wb=env.__embind_register_void;var xb=env.__emval_decref;var yb=env.__emval_incref;var zb=env.__emval_new_array;var Ab=env.__emval_new_cstring;var Bb=env.__emval_new_object;env.__emval_register;var Db=env.__emval_set_property;var Eb=env.__emval_take_value;env.__isLeapYear;var Gb=env._abort;env._embind_repr;var Ib=env._emscripten_memcpy_big;var Jb=env._getenv;var Kb=env._pthread_cond_destroy;var Lb=env._pthread_cond_init;var Mb=env._pthread_cond_signal;var Nb=env._pthread_cond_wait;var Ob=env._pthread_getspecific;var Pb=env._pthread_join;var Qb=env._pthread_key_create;var Rb=env._pthread_mutex_destroy;var Sb=env._pthread_mutex_init;var Tb=env._pthread_once;var Ub=env._pthread_setspecific;env._strftime;var Wb=env._strftime_l;env.constNoSmartPtrRawPointerToWireType;env.count_emval_handles;env.craftInvokerFunction;env.createNamedFunction;env.downcastPointer;env.embind_init_charCodes;env.ensureOverloadTable;env.enumReadValueFromPointer;env.exposePublicSymbol;env.extendError;env.floatReadValueFromPointer;env.flushPendingDeletes;env.genericPointerToWireType;env.getBasestPointer;env.getInheritedInstance;env.getInheritedInstanceCount;env.getLiveInheritedInstances;env.getShiftFromSize;env.getStringOrSymbol;env.getTypeName;env.get_first_emval;env.heap32VectorToArray;env.init_ClassHandle;env.init_RegisteredPointer;env.init_embind;env.init_emval;env.integerReadValueFromPointer;env.makeClassHandle;env.makeLegalFunctionName;env.new_;env.nonConstNoSmartPtrRawPointerToWireType;env.readLatin1String;env.registerType;env.replacePublicSymbol;env.requireFunction;env.requireHandle;env.requireRegisteredType;env.runDestructor;env.runDestructors;env.setDelayFunction;env.shallowCopyInternalPointer;env.simpleReadValueFromPointer;env.throwBindingError;env.throwInstanceAlreadyDeleted;env.throwInternalError;env.throwUnboundTypeError;env.upcastPointer;env.whenDependentTypesAreResolved;function Sc(newBuffer){if(q(newBuffer)&16777215||q(newBuffer)<=16777215||q(newBuffer)>2147483648)return false;b=new a(newBuffer);d=new c(newBuffer);f=new e(newBuffer);h=new g(newBuffer);j=new i(newBuffer);new k(newBuffer);n=new m(newBuffer);p=new o(newBuffer);buffer=newBuffer;return true}
		// EMSCRIPTEN_START_FUNCS
		function BD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+224|0;q=w+198|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;zD(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(JB(e,KA()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=LA(b[e>>0]|0)|0;if(fD(e&255,x,a,s,w,b[r>>0]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+1;LA(b[e>>0]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=CD(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=LA(b[a>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function CD(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0;j=u;h=u=u+31&-32;u=u+16|0;do if((a|0)==(c|0)){f[d>>2]=4;a=0;}else {if((b[a>>0]|0)==45){f[d>>2]=4;a=0;break}i=Xx()|0;i=f[i>>2]|0;g=Xx()|0;f[g>>2]=0;a=Hy(a,h,e,gD()|0)|0;e=I;g=Xx()|0;g=f[g>>2]|0;if(!g){k=Xx()|0;f[k>>2]=i;}do if((f[h>>2]|0)==(c|0))if(e>>>0>0|(e|0)==0&a>>>0>4294967295|(g|0)==34){f[d>>2]=4;a=-1;break}else break;else {f[d>>2]=4;a=0;}while(0)}while(0);u=j;return a|0}function DD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+224|0;q=w+198|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;zD(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(JB(e,KA()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=LA(b[e>>0]|0)|0;if(fD(e&255,x,a,s,w,b[r>>0]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+1;LA(b[e>>0]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=ED(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=LA(b[a>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function ED(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0;j=u;h=u=u+31&-32;u=u+16|0;do if((a|0)==(c|0)){f[d>>2]=4;a=0;}else {if((b[a>>0]|0)==45){f[d>>2]=4;a=0;break}i=Xx()|0;i=f[i>>2]|0;g=Xx()|0;f[g>>2]=0;a=Hy(a,h,e,gD()|0)|0;e=I;g=Xx()|0;g=f[g>>2]|0;if(!g){k=Xx()|0;f[k>>2]=i;}do if((f[h>>2]|0)==(c|0))if(e>>>0>0|(e|0)==0&a>>>0>4294967295|(g|0)==34){f[d>>2]=4;a=-1;break}else break;else {f[d>>2]=4;a=0;}while(0)}while(0);u=j;return a|0}function FD(a,c,e,g,h,i){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;C=u;x=u=u+31&-32;u=u+224|0;r=x+198|0;s=x+196|0;A=x+184|0;B=x+172|0;t=x+168|0;v=x+8|0;w=x+4|0;y=yD(g)|0;zD(A,g,r,s);f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}p=B+11|0;q=B+8|0;if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(B,a,0);a=(b[p>>0]|0)<0?f[B>>2]|0:B;f[t>>2]=a;f[w>>2]=v;f[x>>2]=0;o=B+4|0;k=f[c>>2]|0;j=k;a:while(1){if(j){g=f[j+12>>2]|0;if((g|0)==(f[j+16>>2]|0))g=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else g=LA(b[g>>0]|0)|0;if(JB(g,KA()|0)|0){f[c>>2]=0;n=0;k=0;l=1;}else {n=j;l=0;}}else {n=0;k=0;l=1;}j=f[e>>2]|0;do if(j){g=f[j+12>>2]|0;if((g|0)==(f[j+16>>2]|0))g=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else g=LA(b[g>>0]|0)|0;if(!(JB(g,KA()|0)|0))if(l)break;else break a;else {f[e>>2]=0;D=19;break}}else D=19;while(0);if((D|0)==19){D=0;if(l){j=0;break}else j=0;}g=b[p>>0]|0;g=g<<24>>24<0?f[o>>2]|0:g&255;if((f[t>>2]|0)==(a+g|0)){OL(B,g<<1,0);if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(B,a,0);a=(b[p>>0]|0)<0?f[B>>2]|0:B;f[t>>2]=a+g;}l=n+12|0;g=f[l>>2]|0;m=n+16|0;if((g|0)==(f[m>>2]|0))g=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else g=LA(b[g>>0]|0)|0;if(fD(g&255,y,a,t,x,b[s>>0]|0,A,v,w,r)|0)break;g=f[l>>2]|0;if((g|0)==(f[m>>2]|0)){Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;j=n;continue}else {f[l>>2]=g+1;LA(b[g>>0]|0)|0;j=n;continue}}s=b[A+11>>0]|0;if((s<<24>>24<0?f[A+4>>2]|0:s&255)|0?(z=f[w>>2]|0,(z-v|0)<160):0){x=f[x>>2]|0;f[w>>2]=z+4;f[z>>2]=x;}z=GD(a,f[t>>2]|0,h,y)|0;d[i>>1]=z;sD(A,v,f[w>>2]|0,h);if(n){a=f[n+12>>2]|0;if((a|0)==(f[n+16>>2]|0))a=Uc[f[(f[k>>2]|0)+36>>2]&127](n)|0;else a=LA(b[a>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;g=1;}else g=0;}else g=1;do if(j){a=f[j+12>>2]|0;if((a|0)==(f[j+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(g)break;else {D=49;break}else {f[e>>2]=0;D=47;break}}else D=47;while(0);if((D|0)==47?g:0)D=49;if((D|0)==49)f[h>>2]=f[h>>2]|2;D=f[c>>2]|0;HL(B);HL(A);u=C;return D|0}function GD(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0;j=u;h=u=u+31&-32;u=u+16|0;do if((a|0)==(c|0)){f[d>>2]=4;a=0;}else {if((b[a>>0]|0)==45){f[d>>2]=4;a=0;break}i=Xx()|0;i=f[i>>2]|0;g=Xx()|0;f[g>>2]=0;a=Hy(a,h,e,gD()|0)|0;e=I;g=Xx()|0;g=f[g>>2]|0;if(!g){k=Xx()|0;f[k>>2]=i;}do if((f[h>>2]|0)==(c|0))if(e>>>0>0|(e|0)==0&a>>>0>65535|(g|0)==34){f[d>>2]=4;a=-1;break}else {a=a&65535;break}else {f[d>>2]=4;a=0;}while(0)}while(0);u=j;return a|0}function HD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+224|0;q=w+198|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;zD(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(JB(e,KA()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=LA(b[e>>0]|0)|0;if(fD(e&255,x,a,s,w,b[r>>0]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+1;LA(b[e>>0]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=ID(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;f[h+4>>2]=I;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=LA(b[a>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function ID(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0;i=u;g=u=u+31&-32;u=u+16|0;if((a|0)==(b|0)){f[c>>2]=4;d=0;a=0;}else {h=Xx()|0;h=f[h>>2]|0;e=Xx()|0;f[e>>2]=0;a=Ky(a,g,d,gD()|0)|0;d=I;e=Xx()|0;e=f[e>>2]|0;if(!e){j=Xx()|0;f[j>>2]=h;}if((f[g>>2]|0)==(b|0)){if((e|0)==34){f[c>>2]=4;d=(d|0)>0|(d|0)==0&a>>>0>0;a=d?-1:0;d=d?2147483647:-2147483648;}}else {f[c>>2]=4;a=0;d=0;}}I=d;u=i;return a|0}function JD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+224|0;q=w+198|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;zD(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(JB(e,KA()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=LA(b[e>>0]|0)|0;if(fD(e&255,x,a,s,w,b[r>>0]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+1;LA(b[e>>0]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=KD(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=LA(b[a>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function KD(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0;i=u;g=u=u+31&-32;u=u+16|0;if((a|0)==(b|0)){f[c>>2]=4;a=0;}else {h=Xx()|0;h=f[h>>2]|0;e=Xx()|0;f[e>>2]=0;a=Ky(a,g,d,gD()|0)|0;d=I;e=Xx()|0;e=f[e>>2]|0;if(!e){j=Xx()|0;f[j>>2]=h;}a:do if((f[g>>2]|0)==(b|0)){do if((e|0)==34){f[c>>2]=4;if((d|0)>0|(d|0)==0&a>>>0>0){a=2147483647;break a}}else {if((d|0)<-1|(d|0)==-1&a>>>0<2147483648){f[c>>2]=4;break}if((d|0)>0|(d|0)==0&a>>>0>2147483647){f[c>>2]=4;a=2147483647;break a}else break a}while(0);a=-2147483648;}else {f[c>>2]=4;a=0;}while(0)}u=i;return a|0}function LD(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;y=u;k=u=u+31&-32;u=u+112|0;l=(e-d|0)/12|0;if(l>>>0>100){k=Lx(l)|0;if(!k)zL();else {j=k;w=k;}}else {j=k;w=0;}n=d;o=j;k=0;while(1){if((n|0)==(e|0))break;m=b[n+11>>0]|0;if(m<<24>>24<0)m=f[n+4>>2]|0;else m=m&255;if(!m){b[o>>0]=2;l=l+-1|0;k=k+1|0;}else b[o>>0]=1;n=n+12|0;o=o+1|0;}v=0;s=k;a:while(1){k=f[a>>2]|0;do if(k){m=f[k+12>>2]|0;if((m|0)==(f[k+16>>2]|0))k=Uc[f[(f[k>>2]|0)+36>>2]&127](k)|0;else k=LA(b[m>>0]|0)|0;if(JB(k,KA()|0)|0){f[a>>2]=0;o=1;break}else {o=(f[a>>2]|0)==0;break}}else o=1;while(0);m=f[c>>2]|0;if(m){k=f[m+12>>2]|0;if((k|0)==(f[m+16>>2]|0))k=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else k=LA(b[k>>0]|0)|0;if(JB(k,KA()|0)|0){f[c>>2]=0;m=0;k=1;}else k=0;}else {m=0;k=1;}n=f[a>>2]|0;if(!((l|0)!=0&(o^k)))break;k=f[n+12>>2]|0;if((k|0)==(f[n+16>>2]|0))k=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else k=LA(b[k>>0]|0)|0;k=k&255;if(!i)k=Vc[f[(f[g>>2]|0)+12>>2]&31](g,k)|0;t=v+1|0;q=d;p=0;r=j;while(1){if((q|0)==(e|0))break;do if((b[r>>0]|0)==1){n=q+11|0;if((b[n>>0]|0)<0)m=f[q>>2]|0;else m=q;m=b[m+v>>0]|0;if(!i)m=Vc[f[(f[g>>2]|0)+12>>2]&31](g,m)|0;o=l+-1|0;if(k<<24>>24!=m<<24>>24){b[r>>0]=0;m=p;n=s;l=o;break}m=b[n>>0]|0;if(m<<24>>24<0)m=f[q+4>>2]|0;else m=m&255;if((m|0)==(t|0)){b[r>>0]=2;m=1;n=s+1|0;l=o;}else {m=1;n=s;}}else {m=p;n=s;}while(0);q=q+12|0;p=m;r=r+1|0;s=n;}if(!p){v=t;continue}k=f[a>>2]|0;m=k+12|0;n=f[m>>2]|0;if((n|0)==(f[k+16>>2]|0))Uc[f[(f[k>>2]|0)+40>>2]&127](k)|0;else {f[m>>2]=n+1;LA(b[n>>0]|0)|0;}if((s+l|0)>>>0>1){n=d;o=j;k=s;}else {v=t;continue}while(1){if((n|0)==(e|0)){v=t;s=k;continue a}if((b[o>>0]|0)==2){m=b[n+11>>0]|0;if(m<<24>>24<0)m=f[n+4>>2]|0;else m=m&255;if((m|0)!=(t|0)){b[o>>0]=0;k=k+-1|0;}}n=n+12|0;o=o+1|0;}}do if(n){k=f[n+12>>2]|0;if((k|0)==(f[n+16>>2]|0))k=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else k=LA(b[k>>0]|0)|0;if(JB(k,KA()|0)|0){f[a>>2]=0;l=1;break}else {l=(f[a>>2]|0)==0;break}}else l=1;while(0);do if(m){k=f[m+12>>2]|0;if((k|0)==(f[m+16>>2]|0))k=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else k=LA(b[k>>0]|0)|0;if(!(JB(k,KA()|0)|0))if(l)break;else {x=77;break}else {f[c>>2]=0;x=41;break}}else x=41;while(0);if((x|0)==41)if(l)x=77;if((x|0)==77)f[h>>2]=f[h>>2]|2;while(1){if((d|0)==(e|0)){x=81;break}if((b[j>>0]|0)==2)break;d=d+12|0;j=j+1|0;}if((x|0)==81){f[h>>2]=f[h>>2]|4;d=e;}Mx(w);u=y;return d|0}function MD(a){return}function ND(a){a=a|0;xL(a);return}function OD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;o=u;m=u=u+31&-32;u=u+48|0;i=m+40|0;n=m+16|0;j=m+8|0;k=m+12|0;l=m+4|0;if(!(f[e+4>>2]&1)){f[j>>2]=-1;m=f[(f[a>>2]|0)+16>>2]|0;f[k>>2]=f[c>>2];f[l>>2]=f[d>>2];f[n>>2]=f[k>>2];f[i>>2]=f[l>>2];n=$c[m&63](a,n,i,e,g,j)|0;f[c>>2]=n;switch(f[j>>2]|0){case 0:{b[h>>0]=0;break}case 1:{b[h>>0]=1;break}default:{b[h>>0]=1;f[g>>2]=4;}}i=f[c>>2]|0;}else {KB(i,e);l=dD(i,61076)|0;eD(i);KB(i,e);a=dD(i,61084)|0;eD(i);ed[f[(f[a>>2]|0)+24>>2]&63](n,a);ed[f[(f[a>>2]|0)+28>>2]&63](n+12|0,a);f[m>>2]=f[d>>2];a=n+24|0;f[i>>2]=f[m>>2];i=(kE(c,i,n,a,l,g,1)|0)==(n|0)&1;b[h>>0]=i;i=f[c>>2]|0;do{a=a+-12|0;UL(a);}while((a|0)!=(n|0))}u=o;return i|0}function PD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=jE(a,j,i,d,e,g)|0;u=h;return g|0}function QD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=iE(a,j,i,d,e,g)|0;u=h;return g|0}function RD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=hE(a,j,i,d,e,g)|0;u=h;return g|0}function SD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=gE(a,j,i,d,e,g)|0;u=h;return g|0}function TD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=fE(a,j,i,d,e,g)|0;u=h;return g|0}function UD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=dE(a,j,i,d,e,g)|0;u=h;return g|0}function VD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=cE(a,j,i,d,e,g)|0;u=h;return g|0}function WD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=bE(a,j,i,d,e,g)|0;u=h;return g|0}function XD(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=_D(a,j,i,d,e,g)|0;u=h;return g|0}function YD(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0;z=u;s=u=u+31&-32;u=u+320|0;w=s;t=s+208|0;x=s+192|0;y=s+180|0;v=s+176|0;q=s+16|0;r=s+8|0;s=s+4|0;f[x>>2]=0;f[x+4>>2]=0;f[x+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[x+(a<<2)>>2]=0;a=a+1|0;}KB(y,e);a=dD(y,61076)|0;Xc[f[(f[a>>2]|0)+48>>2]&7](a,55232,55258,t)|0;eD(y);f[y>>2]=0;f[y+4>>2]=0;f[y+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[y+(a<<2)>>2]=0;a=a+1|0;}p=y+11|0;o=y+8|0;if((b[p>>0]|0)<0)a=(f[o>>2]&2147483647)+-1|0;else a=10;OL(y,a,0);a=(b[p>>0]|0)<0?f[y>>2]|0:y;f[v>>2]=a;f[r>>2]=q;f[s>>2]=0;n=y+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;A=22;break}}else A=22;while(0);if((A|0)==22){A=0;if(k){i=0;break}else i=0;}e=b[p>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[v>>2]|0)==(a+e|0)){OL(y,e<<1,0);if((b[p>>0]|0)<0)a=(f[o>>2]&2147483647)+-1|0;else a=10;OL(y,a,0);a=(b[p>>0]|0)<0?f[y>>2]|0:y;f[v>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,16,a,v,s,0,x,q,r,t)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}OL(y,(f[v>>2]|0)-a|0,0);t=(b[p>>0]|0)<0?f[y>>2]|0:y;v=gD()|0;f[w>>2]=h;if((hD(t,v,55265,w)|0)!=1)f[g>>2]=4;if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {A=51;break}else {f[d>>2]=0;A=49;break}}else A=49;while(0);if((A|0)==49?e:0)A=51;if((A|0)==51)f[g>>2]=f[g>>2]|2;A=f[c>>2]|0;HL(y);HL(x);u=z;return A|0}function ZD(a,c,d,e,g,h,i,j,k,l){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0;o=f[e>>2]|0;p=(o|0)==(d|0);do if(p){m=(f[l+96>>2]|0)==(a|0);if(!m?(f[l+100>>2]|0)!=(a|0):0){n=5;break}f[e>>2]=d+1;b[d>>0]=m?43:45;f[g>>2]=0;m=0;}else n=5;while(0);a:do if((n|0)==5){n=b[i+11>>0]|0;if((a|0)==(h|0)?((n<<24>>24<0?f[i+4>>2]|0:n&255)|0)!=0:0){m=f[k>>2]|0;if((m-j|0)>=160){m=0;break}e=f[g>>2]|0;f[k>>2]=m+4;f[m>>2]=e;f[g>>2]=0;m=0;break}i=l+104|0;h=0;while(1){m=l+(h<<2)|0;if((h|0)==26){m=i;break}if((f[m>>2]|0)==(a|0))break;else h=h+1|0;}m=m-l|0;h=m>>2;if((m|0)>92)m=-1;else {i=55232+h|0;switch(c|0){case 10:case 8:{if((h|0)>=(c|0)){m=-1;break a}break}case 16:{if((m|0)>=88){if(p){m=-1;break a}if((o-d|0)>=3){m=-1;break a}if((b[o+-1>>0]|0)!=48){m=-1;break a}f[g>>2]=0;m=b[i>>0]|0;f[e>>2]=o+1;b[o>>0]=m;m=0;break a}break}}m=b[i>>0]|0;f[e>>2]=o+1;b[o>>0]=m;f[g>>2]=(f[g>>2]|0)+1;m=0;}}while(0);return m|0}function _D(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0;E=u;r=u=u+31&-32;u=u+352|0;s=r+208|0;t=r+200|0;v=r+196|0;D=r+184|0;C=r+172|0;w=r+168|0;x=r+8|0;y=r+4|0;z=r;A=r+337|0;r=r+336|0;$D(D,e,s,t,v);f[C>>2]=0;f[C+4>>2]=0;f[C+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[C+(a<<2)>>2]=0;a=a+1|0;}o=C+11|0;q=C+8|0;if((b[o>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[o>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a;f[y>>2]=x;f[z>>2]=0;b[A>>0]=1;b[r>>0]=69;n=C+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;F=19;break}}else F=19;while(0);if((F|0)==19){F=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[w>>2]|0)==(a+e|0)){OL(C,e<<1,0);if((b[o>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[o>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(aE(e,A,r,a,w,f[t>>2]|0,f[v>>2]|0,D,x,y,z,s)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}v=b[D+11>>0]|0;if(!((b[A>>0]|0)==0?1:((v<<24>>24<0?f[D+4>>2]|0:v&255)|0)==0)?(B=f[y>>2]|0,(B-x|0)<160):0){A=f[z>>2]|0;f[y>>2]=B+4;f[B>>2]=A;}G=+rD(a,f[w>>2]|0,g);p[h>>3]=G;sD(D,x,f[y>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {F=49;break}else {f[d>>2]=0;F=47;break}}else F=47;while(0);if((F|0)==47?e:0)F=49;if((F|0)==49)f[g>>2]=f[g>>2]|2;F=f[c>>2]|0;HL(C);HL(D);u=E;return F|0}function $D(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0;g=u;h=u=u+31&-32;u=u+16|0;KB(h,b);b=dD(h,61076)|0;Xc[f[(f[b>>2]|0)+48>>2]&7](b,55232,55264,c)|0;c=dD(h,61084)|0;b=Uc[f[(f[c>>2]|0)+12>>2]&127](c)|0;f[d>>2]=b;d=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;f[e>>2]=d;ed[f[(f[c>>2]|0)+20>>2]&63](a,c);eD(h);u=g;return}function aE(a,c,d,e,g,h,i,j,k,l,m,n){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0;p=k;a:do if((a|0)==(h|0))if(b[c>>0]|0){b[c>>0]=0;d=f[g>>2]|0;f[g>>2]=d+1;b[d>>0]=46;g=b[j+11>>0]|0;if(((g<<24>>24<0?f[j+4>>2]|0:g&255)|0)!=0?(o=f[l>>2]|0,(o-p|0)<160):0){k=f[m>>2]|0;f[l>>2]=o+4;f[o>>2]=k;k=0;}else k=0;}else k=-1;else {if((a|0)==(i|0)?(i=b[j+11>>0]|0,(i<<24>>24<0?f[j+4>>2]|0:i&255)|0):0){if(!(b[c>>0]|0)){k=-1;break}k=f[l>>2]|0;if((k-p|0)>=160){k=0;break}g=f[m>>2]|0;f[l>>2]=k+4;f[k>>2]=g;f[m>>2]=0;k=0;break}h=n+128|0;o=0;while(1){k=n+(o<<2)|0;if((o|0)==32){k=h;break}if((f[k>>2]|0)==(a|0))break;else o=o+1|0;}o=k-n|0;k=o>>2;if((o|0)<=124){h=b[55232+k>>0]|0;switch(k|0){case 24:case 25:{k=f[g>>2]|0;if((k|0)!=(e|0)?(b[k+-1>>0]&95)!=(b[d>>0]&127):0){k=-1;break a}f[g>>2]=k+1;b[k>>0]=h;k=0;break a}case 23:case 22:{b[d>>0]=80;break}default:{k=h&95;if((((k|0)==(b[d>>0]|0)?(b[d>>0]=k|128,b[c>>0]|0):0)?(b[c>>0]=0,d=b[j+11>>0]|0,(d<<24>>24<0?f[j+4>>2]|0:d&255)|0):0)?(q=f[l>>2]|0,(q-p|0)<160):0){d=f[m>>2]|0;f[l>>2]=q+4;f[q>>2]=d;}}}l=f[g>>2]|0;f[g>>2]=l+1;b[l>>0]=h;if((o|0)>84)k=0;else {f[m>>2]=(f[m>>2]|0)+1;k=0;}}else k=-1;}while(0);return k|0}function bE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0;E=u;r=u=u+31&-32;u=u+352|0;s=r+208|0;t=r+200|0;v=r+196|0;D=r+184|0;C=r+172|0;w=r+168|0;x=r+8|0;y=r+4|0;z=r;A=r+337|0;r=r+336|0;$D(D,e,s,t,v);f[C>>2]=0;f[C+4>>2]=0;f[C+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[C+(a<<2)>>2]=0;a=a+1|0;}o=C+11|0;q=C+8|0;if((b[o>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[o>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a;f[y>>2]=x;f[z>>2]=0;b[A>>0]=1;b[r>>0]=69;n=C+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;F=19;break}}else F=19;while(0);if((F|0)==19){F=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[w>>2]|0)==(a+e|0)){OL(C,e<<1,0);if((b[o>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[o>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(aE(e,A,r,a,w,f[t>>2]|0,f[v>>2]|0,D,x,y,z,s)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}v=b[D+11>>0]|0;if(!((b[A>>0]|0)==0?1:((v<<24>>24<0?f[D+4>>2]|0:v&255)|0)==0)?(B=f[y>>2]|0,(B-x|0)<160):0){A=f[z>>2]|0;f[y>>2]=B+4;f[B>>2]=A;}G=+uD(a,f[w>>2]|0,g);p[h>>3]=G;sD(D,x,f[y>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {F=49;break}else {f[d>>2]=0;F=47;break}}else F=47;while(0);if((F|0)==47?e:0)F=49;if((F|0)==49)f[g>>2]=f[g>>2]|2;F=f[c>>2]|0;HL(C);HL(D);u=E;return F|0}function cE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0;E=u;r=u=u+31&-32;u=u+352|0;s=r+208|0;t=r+200|0;v=r+196|0;D=r+184|0;C=r+172|0;w=r+168|0;x=r+8|0;y=r+4|0;z=r;A=r+337|0;r=r+336|0;$D(D,e,s,t,v);f[C>>2]=0;f[C+4>>2]=0;f[C+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[C+(a<<2)>>2]=0;a=a+1|0;}p=C+11|0;q=C+8|0;if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[p>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a;f[y>>2]=x;f[z>>2]=0;b[A>>0]=1;b[r>>0]=69;o=C+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;F=19;break}}else F=19;while(0);if((F|0)==19){F=0;if(k){i=0;break}else i=0;}e=b[p>>0]|0;e=e<<24>>24<0?f[o>>2]|0:e&255;if((f[w>>2]|0)==(a+e|0)){OL(C,e<<1,0);if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(C,a,0);a=(b[p>>0]|0)<0?f[C>>2]|0:C;f[w>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(aE(e,A,r,a,w,f[t>>2]|0,f[v>>2]|0,D,x,y,z,s)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}v=b[D+11>>0]|0;if(!((b[A>>0]|0)==0?1:((v<<24>>24<0?f[D+4>>2]|0:v&255)|0)==0)?(B=f[y>>2]|0,(B-x|0)<160):0){A=f[z>>2]|0;f[y>>2]=B+4;f[B>>2]=A;}G=+wD(a,f[w>>2]|0,g);n[h>>2]=G;sD(D,x,f[y>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {F=49;break}else {f[d>>2]=0;F=47;break}}else F=47;while(0);if((F|0)==47?e:0)F=49;if((F|0)==49)f[g>>2]=f[g>>2]|2;F=f[c>>2]|0;HL(C);HL(D);u=E;return F|0}function dE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+304|0;q=w+200|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;eE(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,x,a,s,w,f[r>>2]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=AD(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;f[h+4>>2]=I;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function eE(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0;e=u;g=u=u+31&-32;u=u+16|0;KB(g,b);b=dD(g,61076)|0;Xc[f[(f[b>>2]|0)+48>>2]&7](b,55232,55258,c)|0;c=dD(g,61084)|0;b=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;f[d>>2]=b;ed[f[(f[c>>2]|0)+20>>2]&63](a,c);eD(g);u=e;return}function fE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+304|0;q=w+200|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;eE(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,x,a,s,w,f[r>>2]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=CD(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function gE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+304|0;q=w+200|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;eE(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,x,a,s,w,f[r>>2]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=ED(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function hE(a,c,e,g,h,i){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;C=u;x=u=u+31&-32;u=u+304|0;r=x+200|0;s=x+196|0;A=x+184|0;B=x+172|0;t=x+168|0;v=x+8|0;w=x+4|0;y=yD(g)|0;eE(A,g,r,s);f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}p=B+11|0;q=B+8|0;if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(B,a,0);a=(b[p>>0]|0)<0?f[B>>2]|0:B;f[t>>2]=a;f[w>>2]=v;f[x>>2]=0;o=B+4|0;k=f[c>>2]|0;j=k;a:while(1){if(j){g=f[j+12>>2]|0;if((g|0)==(f[j+16>>2]|0))g=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else g=bB(f[g>>2]|0)|0;if(LB(g,aB()|0)|0){f[c>>2]=0;n=0;k=0;l=1;}else {n=j;l=0;}}else {n=0;k=0;l=1;}j=f[e>>2]|0;do if(j){g=f[j+12>>2]|0;if((g|0)==(f[j+16>>2]|0))g=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else g=bB(f[g>>2]|0)|0;if(!(LB(g,aB()|0)|0))if(l)break;else break a;else {f[e>>2]=0;D=19;break}}else D=19;while(0);if((D|0)==19){D=0;if(l){j=0;break}else j=0;}g=b[p>>0]|0;g=g<<24>>24<0?f[o>>2]|0:g&255;if((f[t>>2]|0)==(a+g|0)){OL(B,g<<1,0);if((b[p>>0]|0)<0)a=(f[q>>2]&2147483647)+-1|0;else a=10;OL(B,a,0);a=(b[p>>0]|0)<0?f[B>>2]|0:B;f[t>>2]=a+g;}l=n+12|0;g=f[l>>2]|0;m=n+16|0;if((g|0)==(f[m>>2]|0))g=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else g=bB(f[g>>2]|0)|0;if(ZD(g,y,a,t,x,f[s>>2]|0,A,v,w,r)|0)break;g=f[l>>2]|0;if((g|0)==(f[m>>2]|0)){Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;j=n;continue}else {f[l>>2]=g+4;bB(f[g>>2]|0)|0;j=n;continue}}s=b[A+11>>0]|0;if((s<<24>>24<0?f[A+4>>2]|0:s&255)|0?(z=f[w>>2]|0,(z-v|0)<160):0){x=f[x>>2]|0;f[w>>2]=z+4;f[z>>2]=x;}z=GD(a,f[t>>2]|0,h,y)|0;d[i>>1]=z;sD(A,v,f[w>>2]|0,h);if(n){a=f[n+12>>2]|0;if((a|0)==(f[n+16>>2]|0))a=Uc[f[(f[k>>2]|0)+36>>2]&127](n)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;g=1;}else g=0;}else g=1;do if(j){a=f[j+12>>2]|0;if((a|0)==(f[j+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(g)break;else {D=49;break}else {f[e>>2]=0;D=47;break}}else D=47;while(0);if((D|0)==47?g:0)D=49;if((D|0)==49)f[h>>2]=f[h>>2]|2;D=f[c>>2]|0;HL(B);HL(A);u=C;return D|0}function iE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+304|0;q=w+200|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;eE(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,x,a,s,w,f[r>>2]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=ID(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;f[h+4>>2]=I;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function jE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=u;w=u=u+31&-32;u=u+304|0;q=w+200|0;r=w+196|0;z=w+184|0;A=w+172|0;s=w+168|0;t=w+8|0;v=w+4|0;x=yD(e)|0;eE(z,e,q,r);f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}o=A+11|0;p=A+8|0;if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a;f[v>>2]=t;f[w>>2]=0;n=A+4|0;j=f[c>>2]|0;i=j;a:while(1){if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(LB(e,aB()|0)|0){f[c>>2]=0;m=0;j=0;k=1;}else {m=i;k=0;}}else {m=0;j=0;k=1;}i=f[d>>2]|0;do if(i){e=f[i+12>>2]|0;if((e|0)==(f[i+16>>2]|0))e=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else e=bB(f[e>>2]|0)|0;if(!(LB(e,aB()|0)|0))if(k)break;else break a;else {f[d>>2]=0;C=19;break}}else C=19;while(0);if((C|0)==19){C=0;if(k){i=0;break}else i=0;}e=b[o>>0]|0;e=e<<24>>24<0?f[n>>2]|0:e&255;if((f[s>>2]|0)==(a+e|0)){OL(A,e<<1,0);if((b[o>>0]|0)<0)a=(f[p>>2]&2147483647)+-1|0;else a=10;OL(A,a,0);a=(b[o>>0]|0)<0?f[A>>2]|0:A;f[s>>2]=a+e;}k=m+12|0;e=f[k>>2]|0;l=m+16|0;if((e|0)==(f[l>>2]|0))e=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else e=bB(f[e>>2]|0)|0;if(ZD(e,x,a,s,w,f[r>>2]|0,z,t,v,q)|0)break;e=f[k>>2]|0;if((e|0)==(f[l>>2]|0)){Uc[f[(f[m>>2]|0)+40>>2]&127](m)|0;i=m;continue}else {f[k>>2]=e+4;bB(f[e>>2]|0)|0;i=m;continue}}r=b[z+11>>0]|0;if((r<<24>>24<0?f[z+4>>2]|0:r&255)|0?(y=f[v>>2]|0,(y-t|0)<160):0){w=f[w>>2]|0;f[v>>2]=y+4;f[y>>2]=w;}y=KD(a,f[s>>2]|0,g,x)|0;f[h>>2]=y;sD(z,t,f[v>>2]|0,g);if(m){a=f[m+12>>2]|0;if((a|0)==(f[m+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](m)|0;else a=bB(f[a>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;e=1;}else e=0;}else e=1;do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(e)break;else {C=49;break}else {f[d>>2]=0;C=47;break}}else C=47;while(0);if((C|0)==47?e:0)C=49;if((C|0)==49)f[g>>2]=f[g>>2]|2;C=f[c>>2]|0;HL(A);HL(z);u=B;return C|0}function kE(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;y=u;k=u=u+31&-32;u=u+112|0;l=(e-d|0)/12|0;if(l>>>0>100){k=Lx(l)|0;if(!k)zL();else {j=k;w=k;}}else {j=k;w=0;}k=0;n=d;o=j;while(1){if((n|0)==(e|0))break;m=b[n+8+3>>0]|0;if(m<<24>>24<0)m=f[n+4>>2]|0;else m=m&255;if(!m){b[o>>0]=2;k=k+1|0;l=l+-1|0;}else b[o>>0]=1;n=n+12|0;o=o+1|0;}v=0;s=k;a:while(1){k=f[a>>2]|0;do if(k){m=f[k+12>>2]|0;if((m|0)==(f[k+16>>2]|0))k=Uc[f[(f[k>>2]|0)+36>>2]&127](k)|0;else k=bB(f[m>>2]|0)|0;if(LB(k,aB()|0)|0){f[a>>2]=0;o=1;break}else {o=(f[a>>2]|0)==0;break}}else o=1;while(0);m=f[c>>2]|0;if(m){k=f[m+12>>2]|0;if((k|0)==(f[m+16>>2]|0))k=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else k=bB(f[k>>2]|0)|0;if(LB(k,aB()|0)|0){f[c>>2]=0;m=0;k=1;}else k=0;}else {m=0;k=1;}n=f[a>>2]|0;if(!((l|0)!=0&(o^k)))break;k=f[n+12>>2]|0;if((k|0)==(f[n+16>>2]|0))k=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else k=bB(f[k>>2]|0)|0;if(!i)k=Vc[f[(f[g>>2]|0)+28>>2]&31](g,k)|0;t=v+1|0;q=d;p=0;r=j;while(1){if((q|0)==(e|0))break;do if((b[r>>0]|0)==1){n=q+8+3|0;if((b[n>>0]|0)<0)m=f[q>>2]|0;else m=q;m=f[m+(v<<2)>>2]|0;if(!i)m=Vc[f[(f[g>>2]|0)+28>>2]&31](g,m)|0;o=l+-1|0;if((k|0)!=(m|0)){b[r>>0]=0;m=p;n=s;l=o;break}m=b[n>>0]|0;if(m<<24>>24<0)m=f[q+4>>2]|0;else m=m&255;if((m|0)==(t|0)){b[r>>0]=2;m=1;n=s+1|0;l=o;}else {m=1;n=s;}}else {m=p;n=s;}while(0);q=q+12|0;p=m;r=r+1|0;s=n;}if(!p){v=t;continue}k=f[a>>2]|0;m=k+12|0;n=f[m>>2]|0;if((n|0)==(f[k+16>>2]|0))Uc[f[(f[k>>2]|0)+40>>2]&127](k)|0;else {f[m>>2]=n+4;bB(f[n>>2]|0)|0;}if((s+l|0)>>>0>1){n=d;o=j;k=s;}else {v=t;continue}while(1){if((n|0)==(e|0)){v=t;s=k;continue a}if((b[o>>0]|0)==2){m=b[n+8+3>>0]|0;if(m<<24>>24<0)m=f[n+4>>2]|0;else m=m&255;if((m|0)!=(t|0)){b[o>>0]=0;k=k+-1|0;}}n=n+12|0;o=o+1|0;}}do if(n){k=f[n+12>>2]|0;if((k|0)==(f[n+16>>2]|0))k=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else k=bB(f[k>>2]|0)|0;if(LB(k,aB()|0)|0){f[a>>2]=0;l=1;break}else {l=(f[a>>2]|0)==0;break}}else l=1;while(0);do if(m){k=f[m+12>>2]|0;if((k|0)==(f[m+16>>2]|0))k=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else k=bB(f[k>>2]|0)|0;if(!(LB(k,aB()|0)|0))if(l)break;else {x=77;break}else {f[c>>2]=0;x=41;break}}else x=41;while(0);if((x|0)==41)if(l)x=77;if((x|0)==77)f[h>>2]=f[h>>2]|2;while(1){if((d|0)==(e|0)){x=81;break}if((b[j>>0]|0)==2)break;d=d+12|0;j=j+1|0;}if((x|0)==81){f[h>>2]=f[h>>2]|4;d=e;}Mx(w);u=y;return d|0}function lE(a){return}function mE(a){a=a|0;xL(a);return}function nE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;l=u;h=u=u+31&-32;u=u+16|0;k=h+4|0;if(!(f[d+4>>2]&1)){j=f[(f[a>>2]|0)+24>>2]|0;f[h>>2]=f[c>>2];f[k>>2]=f[h>>2];a=Zc[j&31](a,k,d,e,g&1)|0;}else {KB(k,d);a=dD(k,61060)|0;eD(k);d=f[a>>2]|0;if(g)ed[f[d+24>>2]&63](k,a);else ed[f[d+28>>2]&63](k,a);i=k+11|0;a=b[i>>0]|0;if(a<<24>>24<0){d=a;a=f[k>>2]|0;j=8;}else g=k;while(1){if((j|0)==8){g=a;a=d;}j=a<<24>>24<0;if((g|0)==((j?f[k>>2]|0:k)+(j?f[k+4>>2]|0:a&255)|0))break;a=b[g>>0]|0;d=f[c>>2]|0;if(d|0){e=d+24|0;h=f[e>>2]|0;if((h|0)==(f[d+28>>2]|0)){j=f[(f[d>>2]|0)+52>>2]|0;a=LA(a)|0;a=Vc[j&31](d,a)|0;}else {f[e>>2]=h+1;b[h>>0]=a;a=LA(a)|0;}if(JB(a,KA()|0)|0)f[c>>2]=0;}d=b[i>>0]|0;a=g+1|0;j=8;}a=f[c>>2]|0;HL(k);}u=l;return a|0}function oE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;a=u;j=u=u+31&-32;u=u+64|0;i=j;m=j+52|0;n=j+39|0;h=j+16|0;l=j+12|0;k=j+4|0;j=j+8|0;b[m>>0]=b[55486]|0;b[m+1>>0]=b[55487]|0;b[m+2>>0]=b[55488]|0;b[m+3>>0]=b[55489]|0;b[m+4>>0]=b[55490]|0;b[m+5>>0]=b[55491]|0;AE(m+1|0,55492,1,f[d+4>>2]|0);o=gD()|0;f[i>>2]=g;g=n+(vE(n,13,o,m,i)|0)|0;m=wE(n,g,d)|0;KB(i,d);BE(n,m,g,h,l,k,i);eD(i);f[j>>2]=f[c>>2];c=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ge(i,h,c,g,d,e)|0;u=a;return g|0}function pE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;a=u;j=u=u+31&-32;u=u+96|0;i=j+8|0;n=j;m=j+71|0;h=j+28|0;l=j+24|0;k=j+16|0;j=j+20|0;o=n;f[o>>2]=37;f[o+4>>2]=0;AE(n+1|0,55483,1,f[c+4>>2]|0);o=gD()|0;p=i;f[p>>2]=e;f[p+4>>2]=g;e=m+(vE(m,23,o,n,i)|0)|0;g=wE(m,e,c)|0;KB(i,c);BE(m,g,e,h,l,k,i);eD(i);f[j>>2]=f[b>>2];e=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ge(i,h,e,g,c,d)|0;u=a;return g|0}function qE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;a=u;j=u=u+31&-32;u=u+64|0;i=j;m=j+52|0;n=j+40|0;h=j+16|0;l=j+12|0;k=j+4|0;j=j+8|0;b[m>>0]=b[55486]|0;b[m+1>>0]=b[55487]|0;b[m+2>>0]=b[55488]|0;b[m+3>>0]=b[55489]|0;b[m+4>>0]=b[55490]|0;b[m+5>>0]=b[55491]|0;AE(m+1|0,55492,0,f[d+4>>2]|0);o=gD()|0;f[i>>2]=g;g=n+(vE(n,12,o,m,i)|0)|0;m=wE(n,g,d)|0;KB(i,d);BE(n,m,g,h,l,k,i);eD(i);f[j>>2]=f[c>>2];c=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ge(i,h,c,g,d,e)|0;u=a;return g|0}function rE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;a=u;j=u=u+31&-32;u=u+96|0;i=j+8|0;n=j;m=j+71|0;h=j+28|0;l=j+24|0;k=j+16|0;j=j+20|0;o=n;f[o>>2]=37;f[o+4>>2]=0;AE(n+1|0,55483,0,f[c+4>>2]|0);o=gD()|0;p=i;f[p>>2]=e;f[p+4>>2]=g;e=m+(vE(m,23,o,n,i)|0)|0;g=wE(m,e,c)|0;KB(i,c);BE(m,g,e,h,l,k,i);eD(i);f[j>>2]=f[b>>2];e=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ge(i,h,e,g,c,d)|0;u=a;return g|0}function sE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0;w=u;t=u=u+31&-32;u=u+176|0;r=t+72|0;l=t+48|0;k=t+32|0;h=t+24|0;g=t+8|0;j=t;n=t+134|0;m=t+68|0;o=t+76|0;v=t+64|0;s=t+60|0;t=t+56|0;i=j;f[i>>2]=37;f[i+4>>2]=0;i=xE(j+1|0,81470,f[c+4>>2]|0)|0;f[m>>2]=n;a=gD()|0;if(i){f[g>>2]=f[c+8>>2];p[g+8>>3]=e;a=vE(n,30,a,j,g)|0;}else {p[h>>3]=e;a=vE(n,30,a,j,h)|0;}if((a|0)>29){a=gD()|0;if(i){f[k>>2]=f[c+8>>2];p[k+8>>3]=e;g=yE(m,a,j,k)|0;}else {p[l>>3]=e;g=yE(m,a,j,l)|0;}a=f[m>>2]|0;if(!a)zL();else {q=g;z=a;A=a;}}else {q=a;z=0;A=f[m>>2]|0;}g=A+q|0;h=wE(A,g,c)|0;if((A|0)!=(n|0)){a=Lx(q<<1)|0;if(!a)zL();else {x=a;y=a;}}else {x=o;y=0;}KB(r,c);zE(A,h,g,x,v,s,r);eD(r);f[t>>2]=f[b>>2];b=f[v>>2]|0;A=f[s>>2]|0;f[r>>2]=f[t>>2];A=ge(r,x,b,A,c,d)|0;Mx(y);Mx(z);u=w;return A|0}function tE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0;w=u;t=u=u+31&-32;u=u+176|0;r=t+72|0;l=t+48|0;k=t+32|0;h=t+24|0;g=t+8|0;j=t;n=t+134|0;m=t+68|0;o=t+76|0;v=t+64|0;s=t+60|0;t=t+56|0;i=j;f[i>>2]=37;f[i+4>>2]=0;i=xE(j+1|0,55481,f[c+4>>2]|0)|0;f[m>>2]=n;a=gD()|0;if(i){f[g>>2]=f[c+8>>2];p[g+8>>3]=e;a=vE(n,30,a,j,g)|0;}else {p[h>>3]=e;a=vE(n,30,a,j,h)|0;}if((a|0)>29){a=gD()|0;if(i){f[k>>2]=f[c+8>>2];p[k+8>>3]=e;g=yE(m,a,j,k)|0;}else {p[l>>3]=e;g=yE(m,a,j,l)|0;}a=f[m>>2]|0;if(!a)zL();else {q=g;z=a;A=a;}}else {q=a;z=0;A=f[m>>2]|0;}g=A+q|0;h=wE(A,g,c)|0;if((A|0)!=(n|0)){a=Lx(q<<1)|0;if(!a)zL();else {x=a;y=a;}}else {x=o;y=0;}KB(r,c);zE(A,h,g,x,v,s,r);eD(r);f[t>>2]=f[b>>2];b=f[v>>2]|0;A=f[s>>2]|0;f[r>>2]=f[t>>2];A=ge(r,x,b,A,c,d)|0;Mx(y);Mx(z);u=w;return A|0}function uE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;a=u;m=u=u+31&-32;u=u+80|0;l=m;k=m+68|0;h=m+48|0;j=m+8|0;m=m+4|0;b[k>>0]=b[55475]|0;b[k+1>>0]=b[55476]|0;b[k+2>>0]=b[55477]|0;b[k+3>>0]=b[55478]|0;b[k+4>>0]=b[55479]|0;b[k+5>>0]=b[55480]|0;i=gD()|0;f[l>>2]=g;g=vE(h,20,i,k,l)|0;k=h+g|0;i=wE(h,k,d)|0;KB(l,d);n=dD(l,61044)|0;eD(l);Xc[f[(f[n>>2]|0)+32>>2]&7](n,h,k,j)|0;g=j+g|0;f[m>>2]=f[c>>2];f[l>>2]=f[m>>2];g=ge(l,j,(i|0)==(k|0)?g:j+(i-h)|0,g,d,e)|0;u=a;return g|0}function vE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0;g=u;h=u=u+31&-32;u=u+16|0;f[h>>2]=e;e=aA(c)|0;c=rz(a,b,d,h)|0;if(e|0)aA(e)|0;u=g;return c|0}function wE(a,c,d){a=a|0;c=c|0;d=d|0;var e=0;a:do switch((f[d+4>>2]&176)<<24>>24){case 16:{d=b[a>>0]|0;e=a+1|0;switch(d<<24>>24){case 43:case 45:{a=e;break a}}if((c-a|0)>1&d<<24>>24==48){switch(b[e>>0]|0){case 88:case 120:break;default:{break a}}a=a+2|0;}break}case 32:{a=c;break}}while(0);return a|0}function xE(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if(d&2048){b[a>>0]=43;a=a+1|0;}if(d&1024){b[a>>0]=35;a=a+1|0;}h=d&260;e=(d&16384|0)!=0;f=(h|0)==260;if(f)g=0;else {b[a>>0]=46;b[a+1>>0]=42;g=1;a=a+2|0;}while(1){d=b[c>>0]|0;if(!(d<<24>>24))break;b[a>>0]=d;c=c+1|0;a=a+1|0;}a:do switch(h&511){case 4:{d=e?70:102;break}case 256:{d=e?69:101;break}default:if(f){d=e?65:97;break a}else {d=e?71:103;break a}}while(0);b[a>>0]=d;return g|0}function yE(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0;e=u;g=u=u+31&-32;u=u+16|0;f[g>>2]=d;d=aA(b)|0;b=Gz(a,c,g)|0;if(d|0)aA(d)|0;u=e;return b|0}function zE(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;w=u;s=u=u+31&-32;u=u+16|0;t=dD(i,61044)|0;r=dD(i,61060)|0;ed[f[(f[r>>2]|0)+20>>2]&63](s,r);f[h>>2]=e;i=b[a>>0]|0;switch(i<<24>>24){case 43:case 45:{q=Vc[f[(f[t>>2]|0)+28>>2]&31](t,i)|0;j=f[h>>2]|0;f[h>>2]=j+1;b[j>>0]=q;j=a+1|0;break}default:j=a;}q=d;a:do if((q-j|0)>1?(b[j>>0]|0)==48:0){i=j+1|0;switch(b[i>>0]|0){case 88:case 120:break;default:{i=j;v=10;break a}}o=Vc[f[(f[t>>2]|0)+28>>2]&31](t,48)|0;p=f[h>>2]|0;f[h>>2]=p+1;b[p>>0]=o;j=j+2|0;p=Vc[f[(f[t>>2]|0)+28>>2]&31](t,b[i>>0]|0)|0;i=f[h>>2]|0;f[h>>2]=i+1;b[i>>0]=p;i=j;while(1){if(i>>>0>=d>>>0)break a;p=b[i>>0]|0;if(!(cA(p,gD()|0)|0))break a;i=i+1|0;}}else {i=j;v=10;}while(0);b:do if((v|0)==10)while(1){v=0;if(i>>>0>=d>>>0)break b;p=b[i>>0]|0;if(!(hA(p,gD()|0)|0))break b;i=i+1|0;v=10;}while(0);m=s+11|0;l=b[m>>0]|0;n=s+4|0;o=j;p=a;c:do if((l<<24>>24<0?f[n>>2]|0:l&255)|0){d:do if((j|0)!=(i|0)){a=i;k=j;while(1){a=a+-1|0;if(k>>>0>=a>>>0)break d;l=b[k>>0]|0;b[k>>0]=b[a>>0]|0;b[a>>0]=l;k=k+1|0;}}while(0);l=Uc[f[(f[r>>2]|0)+16>>2]&127](r)|0;k=0;a=0;while(1){if(j>>>0>=i>>>0)break;x=b[((b[m>>0]|0)<0?f[s>>2]|0:s)+a>>0]|0;if(x<<24>>24>0&(k|0)==(x<<24>>24|0)){k=f[h>>2]|0;f[h>>2]=k+1;b[k>>0]=l;k=b[m>>0]|0;a=(a>>>0<((k<<24>>24<0?f[n>>2]|0:k&255)+-1|0)>>>0&1)+a|0;k=0;}y=Vc[f[(f[t>>2]|0)+28>>2]&31](t,b[j>>0]|0)|0;x=f[h>>2]|0;f[h>>2]=x+1;b[x>>0]=y;j=j+1|0;k=k+1|0;}a=e+(o-p)|0;j=f[h>>2]|0;if((a|0)==(j|0))a=t;else while(1){j=j+-1|0;if(a>>>0>=j>>>0){a=t;break c}y=b[a>>0]|0;b[a>>0]=b[j>>0]|0;b[j>>0]=y;a=a+1|0;}}else {Xc[f[(f[t>>2]|0)+32>>2]&7](t,j,i,f[h>>2]|0)|0;f[h>>2]=(f[h>>2]|0)+(i-o);a=t;}while(0);while(1){if(i>>>0>=d>>>0)break;j=b[i>>0]|0;i=i+1|0;if(j<<24>>24==46){v=29;break}x=Vc[f[(f[a>>2]|0)+28>>2]&31](t,j)|0;y=f[h>>2]|0;f[h>>2]=y+1;b[y>>0]=x;}if((v|0)==29){x=Uc[f[(f[r>>2]|0)+12>>2]&127](r)|0;y=f[h>>2]|0;f[h>>2]=y+1;b[y>>0]=x;}Xc[f[(f[t>>2]|0)+32>>2]&7](t,i,d,f[h>>2]|0)|0;y=(f[h>>2]|0)+(q-i)|0;f[h>>2]=y;f[g>>2]=(c|0)==(d|0)?y:e+(c-p)|0;HL(s);u=w;return}function AE(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var f=0;if(e&2048){b[a>>0]=43;a=a+1|0;}if(!(e&512))f=a;else {b[a>>0]=35;f=a+1|0;}while(1){a=b[c>>0]|0;if(!(a<<24>>24))break;b[f>>0]=a;c=c+1|0;f=f+1|0;}switch(e&74){case 64:{a=111;break}case 8:{a=e&16384|0?88:120;break}default:a=d?100:117;}b[f>>0]=a;return}function BE(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;r=u;q=u=u+31&-32;u=u+16|0;o=dD(i,61044)|0;k=dD(i,61060)|0;ed[f[(f[k>>2]|0)+20>>2]&63](q,k);m=q+11|0;l=b[m>>0]|0;n=q+4|0;p=a;j=d;if((l<<24>>24<0?f[n>>2]|0:l&255)|0){f[h>>2]=e;i=b[a>>0]|0;switch(i<<24>>24){case 43:case 45:{i=Vc[f[(f[o>>2]|0)+28>>2]&31](o,i)|0;l=f[h>>2]|0;f[h>>2]=l+1;b[l>>0]=i;a=a+1|0;break}}a:do if((j-a|0)>1?(b[a>>0]|0)==48:0){i=a+1|0;switch(b[i>>0]|0){case 88:case 120:break;default:break a}l=Vc[f[(f[o>>2]|0)+28>>2]&31](o,48)|0;j=f[h>>2]|0;f[h>>2]=j+1;b[j>>0]=l;j=Vc[f[(f[o>>2]|0)+28>>2]&31](o,b[i>>0]|0)|0;l=f[h>>2]|0;f[h>>2]=l+1;b[l>>0]=j;a=a+2|0;}while(0);b:do if((a|0)!=(d|0)){i=d;j=a;while(1){i=i+-1|0;if(j>>>0>=i>>>0)break b;l=b[j>>0]|0;b[j>>0]=b[i>>0]|0;b[i>>0]=l;j=j+1|0;}}while(0);l=Uc[f[(f[k>>2]|0)+16>>2]&127](k)|0;k=a;i=0;j=0;while(1){if(k>>>0>=d>>>0)break;s=b[((b[m>>0]|0)<0?f[q>>2]|0:q)+i>>0]|0;if(s<<24>>24!=0&(j|0)==(s<<24>>24|0)){j=f[h>>2]|0;f[h>>2]=j+1;b[j>>0]=l;j=b[m>>0]|0;i=(i>>>0<((j<<24>>24<0?f[n>>2]|0:j&255)+-1|0)>>>0&1)+i|0;j=0;}t=Vc[f[(f[o>>2]|0)+28>>2]&31](o,b[k>>0]|0)|0;s=f[h>>2]|0;f[h>>2]=s+1;b[s>>0]=t;k=k+1|0;j=j+1|0;}i=e+(a-p)|0;a=f[h>>2]|0;if((i|0)!=(a|0)){while(1){a=a+-1|0;if(i>>>0>=a>>>0)break;t=b[i>>0]|0;b[i>>0]=b[a>>0]|0;b[a>>0]=t;i=i+1|0;}i=f[h>>2]|0;}}else {Xc[f[(f[o>>2]|0)+32>>2]&7](o,a,d,e)|0;i=e+(j-p)|0;f[h>>2]=i;}f[g>>2]=(c|0)==(d|0)?i:e+(c-p)|0;HL(q);u=r;return}function CE(a){return}function DE(a){a=a|0;xL(a);return}function EE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;l=u;h=u=u+31&-32;u=u+16|0;k=h+4|0;if(!(f[d+4>>2]&1)){j=f[(f[a>>2]|0)+24>>2]|0;f[h>>2]=f[c>>2];f[k>>2]=f[h>>2];a=Zc[j&31](a,k,d,e,g&1)|0;}else {KB(k,d);a=dD(k,61084)|0;eD(k);d=f[a>>2]|0;if(g)ed[f[d+24>>2]&63](k,a);else ed[f[d+28>>2]&63](k,a);i=k+8+3|0;a=b[i>>0]|0;d=f[k>>2]|0;j=k+4|0;g=a<<24>>24<0?d:k;while(1){h=a<<24>>24<0;if((g|0)==((h?d:k)+((h?f[j>>2]|0:a&255)<<2)|0))break;a=f[g>>2]|0;d=f[c>>2]|0;if(d|0){e=d+24|0;h=f[e>>2]|0;if((h|0)==(f[d+28>>2]|0)){h=f[(f[d>>2]|0)+52>>2]|0;a=bB(a)|0;a=Vc[h&31](d,a)|0;}else {f[e>>2]=h+4;f[h>>2]=a;a=bB(a)|0;}if(LB(a,aB()|0)|0)f[c>>2]=0;}g=g+4|0;a=b[i>>0]|0;d=f[k>>2]|0;}a=f[c>>2]|0;UL(k);}u=l;return a|0}function FE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;a=u;j=u=u+31&-32;u=u+128|0;i=j;m=j+122|0;n=j+108|0;h=j+16|0;l=j+12|0;k=j+4|0;j=j+8|0;b[m>>0]=b[55486]|0;b[m+1>>0]=b[55487]|0;b[m+2>>0]=b[55488]|0;b[m+3>>0]=b[55489]|0;b[m+4>>0]=b[55490]|0;b[m+5>>0]=b[55491]|0;AE(m+1|0,55492,1,f[d+4>>2]|0);o=gD()|0;f[i>>2]=g;g=n+(vE(n,13,o,m,i)|0)|0;m=wE(n,g,d)|0;KB(i,d);PE(n,m,g,h,l,k,i);eD(i);f[j>>2]=f[c>>2];c=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ME(i,h,c,g,d,e)|0;u=a;return g|0}function GE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;a=u;j=u=u+31&-32;u=u+224|0;i=j+8|0;n=j;m=j+200|0;h=j+28|0;l=j+24|0;k=j+16|0;j=j+20|0;o=n;f[o>>2]=37;f[o+4>>2]=0;AE(n+1|0,55483,1,f[c+4>>2]|0);o=gD()|0;p=i;f[p>>2]=e;f[p+4>>2]=g;e=m+(vE(m,23,o,n,i)|0)|0;g=wE(m,e,c)|0;KB(i,c);PE(m,g,e,h,l,k,i);eD(i);f[j>>2]=f[b>>2];e=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ME(i,h,e,g,c,d)|0;u=a;return g|0}function HE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;a=u;j=u=u+31&-32;u=u+128|0;i=j;m=j+112|0;n=j+100|0;h=j+16|0;l=j+12|0;k=j+4|0;j=j+8|0;b[m>>0]=b[55486]|0;b[m+1>>0]=b[55487]|0;b[m+2>>0]=b[55488]|0;b[m+3>>0]=b[55489]|0;b[m+4>>0]=b[55490]|0;b[m+5>>0]=b[55491]|0;AE(m+1|0,55492,0,f[d+4>>2]|0);o=gD()|0;f[i>>2]=g;g=n+(vE(n,12,o,m,i)|0)|0;m=wE(n,g,d)|0;KB(i,d);PE(n,m,g,h,l,k,i);eD(i);f[j>>2]=f[c>>2];c=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ME(i,h,c,g,d,e)|0;u=a;return g|0}function IE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;a=u;j=u=u+31&-32;u=u+224|0;i=j+8|0;n=j;m=j+200|0;h=j+28|0;l=j+24|0;k=j+16|0;j=j+20|0;o=n;f[o>>2]=37;f[o+4>>2]=0;AE(n+1|0,55483,0,f[c+4>>2]|0);o=gD()|0;p=i;f[p>>2]=e;f[p+4>>2]=g;e=m+(vE(m,23,o,n,i)|0)|0;g=wE(m,e,c)|0;KB(i,c);PE(m,g,e,h,l,k,i);eD(i);f[j>>2]=f[b>>2];e=f[l>>2]|0;g=f[k>>2]|0;f[i>>2]=f[j>>2];g=ME(i,h,e,g,c,d)|0;u=a;return g|0}function JE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;y=u;t=u=u+31&-32;u=u+336|0;r=t+300|0;l=t+48|0;k=t+32|0;h=t+24|0;g=t+8|0;j=t;n=t+304|0;m=t+296|0;o=t+68|0;v=t+64|0;s=t+60|0;t=t+56|0;i=j;f[i>>2]=37;f[i+4>>2]=0;i=xE(j+1|0,81470,f[c+4>>2]|0)|0;f[m>>2]=n;a=gD()|0;if(i){f[g>>2]=f[c+8>>2];p[g+8>>3]=e;a=vE(n,30,a,j,g)|0;}else {p[h>>3]=e;a=vE(n,30,a,j,h)|0;}if((a|0)>29){a=gD()|0;if(i){f[k>>2]=f[c+8>>2];p[k+8>>3]=e;g=yE(m,a,j,k)|0;}else {p[l>>3]=e;g=yE(m,a,j,l)|0;}a=f[m>>2]|0;if(!a)zL();else {q=g;A=a;x=a;}}else {q=a;A=0;x=f[m>>2]|0;}g=x+q|0;h=wE(x,g,c)|0;do if((x|0)!=(n|0)){a=Lx(q<<3)|0;if(!a)zL();else {w=a;z=0;B=a;break}}else {w=o;z=1;B=0;}while(0);KB(r,c);OE(x,h,g,w,v,s,r);eD(r);f[t>>2]=f[b>>2];x=f[v>>2]|0;a=f[s>>2]|0;f[r>>2]=f[t>>2];a=ME(r,w,x,a,c,d)|0;f[b>>2]=a;if(!z)Mx(B);Mx(A);u=y;return a|0}function KE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;y=u;t=u=u+31&-32;u=u+336|0;r=t+300|0;l=t+48|0;k=t+32|0;h=t+24|0;g=t+8|0;j=t;n=t+304|0;m=t+296|0;o=t+68|0;v=t+64|0;s=t+60|0;t=t+56|0;i=j;f[i>>2]=37;f[i+4>>2]=0;i=xE(j+1|0,55481,f[c+4>>2]|0)|0;f[m>>2]=n;a=gD()|0;if(i){f[g>>2]=f[c+8>>2];p[g+8>>3]=e;a=vE(n,30,a,j,g)|0;}else {p[h>>3]=e;a=vE(n,30,a,j,h)|0;}if((a|0)>29){a=gD()|0;if(i){f[k>>2]=f[c+8>>2];p[k+8>>3]=e;g=yE(m,a,j,k)|0;}else {p[l>>3]=e;g=yE(m,a,j,l)|0;}a=f[m>>2]|0;if(!a)zL();else {q=g;A=a;x=a;}}else {q=a;A=0;x=f[m>>2]|0;}g=x+q|0;h=wE(x,g,c)|0;do if((x|0)!=(n|0)){a=Lx(q<<3)|0;if(!a)zL();else {w=a;z=0;B=a;break}}else {w=o;z=1;B=0;}while(0);KB(r,c);OE(x,h,g,w,v,s,r);eD(r);f[t>>2]=f[b>>2];x=f[v>>2]|0;a=f[s>>2]|0;f[r>>2]=f[t>>2];a=ME(r,w,x,a,c,d)|0;f[b>>2]=a;if(!z)Mx(B);Mx(A);u=y;return a|0}function LE(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;a=u;m=u=u+31&-32;u=u+192|0;l=m;k=m+176|0;h=m+156|0;j=m+4|0;m=m+152|0;b[k>>0]=b[55475]|0;b[k+1>>0]=b[55476]|0;b[k+2>>0]=b[55477]|0;b[k+3>>0]=b[55478]|0;b[k+4>>0]=b[55479]|0;b[k+5>>0]=b[55480]|0;i=gD()|0;f[l>>2]=g;g=vE(h,20,i,k,l)|0;k=h+g|0;i=wE(h,k,d)|0;KB(l,d);n=dD(l,61076)|0;eD(l);Xc[f[(f[n>>2]|0)+48>>2]&7](n,h,k,j)|0;g=j+(g<<2)|0;f[m>>2]=f[c>>2];f[l>>2]=f[m>>2];g=ME(l,j,(i|0)==(k|0)?g:j+(i-h<<2)|0,g,d,e)|0;u=a;return g|0}function ME(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;r=u;q=u=u+31&-32;u=u+16|0;p=q+12|0;i=f[a>>2]|0;a:do if(!i)i=0;else {s=c;j=e-s>>2;l=g+12|0;k=f[l>>2]|0;j=(k|0)>(j|0)?k-j|0:0;k=d;s=k-s|0;g=s>>2;if((s|0)>0?(Wc[f[(f[i>>2]|0)+48>>2]&63](i,c,g)|0)!=(g|0):0){f[a>>2]=0;i=0;break}do if((j|0)>0){f[q>>2]=0;f[q+4>>2]=0;f[q+8>>2]=0;if(j>>>0>1073741807)EL();do if(j>>>0>=2){g=j+4&2147483644;if(g>>>0>1073741823)Gb();else {m=vL(g<<2)|0;f[q>>2]=m;n=q+8|0;f[n>>2]=g|-2147483648;f[q+4>>2]=j;n=n+3|0;o=q;break}}else {n=q+8+3|0;b[n>>0]=j;m=q;o=q;}while(0);NE(m,j,h)|0;f[p>>2]=0;RC(m+(j<<2)|0,p);if((Wc[f[(f[i>>2]|0)+48>>2]&63](i,(b[n>>0]|0)<0?f[q>>2]|0:o,j)|0)==(j|0)){UL(q);break}else {f[a>>2]=0;UL(q);i=0;break a}}while(0);s=e-k|0;e=s>>2;if((s|0)>0?(Wc[f[(f[i>>2]|0)+48>>2]&63](i,d,e)|0)!=(e|0):0){f[a>>2]=0;i=0;break}f[l>>2]=0;}while(0);u=r;return i|0}function NE(a,b,c){a=a|0;b=b|0;c=c|0;if(b)Vz(a,c,b)|0;return a|0}function OE(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0;y=u;v=u=u+31&-32;u=u+16|0;w=dD(i,61076)|0;s=dD(i,61084)|0;ed[f[(f[s>>2]|0)+20>>2]&63](v,s);f[h>>2]=e;i=b[a>>0]|0;switch(i<<24>>24){case 43:case 45:{t=Vc[f[(f[w>>2]|0)+44>>2]&31](w,i)|0;i=f[h>>2]|0;f[h>>2]=i+4;f[i>>2]=t;i=a+1|0;break}default:i=a;}t=d;a:do if((t-i|0)>1?(b[i>>0]|0)==48:0){j=i+1|0;switch(b[j>>0]|0){case 88:case 120:break;default:{j=i;x=10;break a}}q=Vc[f[(f[w>>2]|0)+44>>2]&31](w,48)|0;r=f[h>>2]|0;f[h>>2]=r+4;f[r>>2]=q;i=i+2|0;r=Vc[f[(f[w>>2]|0)+44>>2]&31](w,b[j>>0]|0)|0;j=f[h>>2]|0;f[h>>2]=j+4;f[j>>2]=r;j=i;while(1){if(j>>>0>=d>>>0)break a;r=b[j>>0]|0;if(!(cA(r,gD()|0)|0))break a;j=j+1|0;}}else {j=i;x=10;}while(0);b:do if((x|0)==10)while(1){x=0;if(j>>>0>=d>>>0)break b;r=b[j>>0]|0;if(!(hA(r,gD()|0)|0))break b;j=j+1|0;x=10;}while(0);o=v+11|0;n=b[o>>0]|0;p=v+4|0;q=i;r=a;c:do if((n<<24>>24<0?f[p>>2]|0:n&255)|0){d:do if((i|0)!=(j|0)){a=j;k=i;while(1){a=a+-1|0;if(k>>>0>=a>>>0)break d;n=b[k>>0]|0;b[k>>0]=b[a>>0]|0;b[a>>0]=n;k=k+1|0;}}while(0);n=Uc[f[(f[s>>2]|0)+16>>2]&127](s)|0;a=0;k=0;while(1){if(i>>>0>=j>>>0)break;l=b[o>>0]|0;m=l<<24>>24<0;z=b[(m?f[v>>2]|0:v)+a>>0]|0;if(z<<24>>24>0&(k|0)==(z<<24>>24|0)){k=f[h>>2]|0;f[h>>2]=k+4;f[k>>2]=n;a=(a>>>0<((m?f[p>>2]|0:l&255)+-1|0)>>>0&1)+a|0;k=0;}m=Vc[f[(f[w>>2]|0)+44>>2]&31](w,b[i>>0]|0)|0;z=f[h>>2]|0;f[h>>2]=z+4;f[z>>2]=m;i=i+1|0;k=k+1|0;}i=e+(q-r<<2)|0;k=f[h>>2]|0;if((i|0)==(k|0))a=w;else {a=k;while(1){a=a+-4|0;if(i>>>0>=a>>>0){a=w;i=k;break c}z=f[i>>2]|0;f[i>>2]=f[a>>2];f[a>>2]=z;i=i+4|0;}}}else {Xc[f[(f[w>>2]|0)+48>>2]&7](w,i,j,f[h>>2]|0)|0;i=(f[h>>2]|0)+(j-q<<2)|0;f[h>>2]=i;a=w;}while(0);while(1){if(j>>>0>=d>>>0)break;i=b[j>>0]|0;j=j+1|0;if(i<<24>>24==46){x=29;break}q=Vc[f[(f[a>>2]|0)+44>>2]&31](w,i)|0;z=f[h>>2]|0;i=z+4|0;f[h>>2]=i;f[z>>2]=q;}if((x|0)==29){x=Uc[f[(f[s>>2]|0)+12>>2]&127](s)|0;z=f[h>>2]|0;i=z+4|0;f[h>>2]=i;f[z>>2]=x;}Xc[f[(f[w>>2]|0)+48>>2]&7](w,j,d,i)|0;z=(f[h>>2]|0)+(t-j<<2)|0;f[h>>2]=z;f[g>>2]=(c|0)==(d|0)?z:e+(c-r<<2)|0;HL(v);u=y;return}function PE(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0;t=u;s=u=u+31&-32;u=u+16|0;q=dD(i,61076)|0;k=dD(i,61084)|0;ed[f[(f[k>>2]|0)+20>>2]&63](s,k);o=s+11|0;n=b[o>>0]|0;p=s+4|0;r=a;j=d;if((n<<24>>24<0?f[p>>2]|0:n&255)|0){f[h>>2]=e;i=b[a>>0]|0;switch(i<<24>>24){case 43:case 45:{m=Vc[f[(f[q>>2]|0)+44>>2]&31](q,i)|0;n=f[h>>2]|0;f[h>>2]=n+4;f[n>>2]=m;a=a+1|0;break}}a:do if((j-a|0)>1?(b[a>>0]|0)==48:0){i=a+1|0;switch(b[i>>0]|0){case 88:case 120:break;default:break a}n=Vc[f[(f[q>>2]|0)+44>>2]&31](q,48)|0;m=f[h>>2]|0;f[h>>2]=m+4;f[m>>2]=n;m=Vc[f[(f[q>>2]|0)+44>>2]&31](q,b[i>>0]|0)|0;n=f[h>>2]|0;f[h>>2]=n+4;f[n>>2]=m;a=a+2|0;}while(0);b:do if((a|0)!=(d|0)){i=d;j=a;while(1){i=i+-1|0;if(j>>>0>=i>>>0)break b;n=b[j>>0]|0;b[j>>0]=b[i>>0]|0;b[i>>0]=n;j=j+1|0;}}while(0);n=Uc[f[(f[k>>2]|0)+16>>2]&127](k)|0;m=a;i=0;j=0;while(1){if(m>>>0>=d>>>0)break;k=b[o>>0]|0;l=k<<24>>24<0;v=b[(l?f[s>>2]|0:s)+i>>0]|0;if(v<<24>>24!=0&(j|0)==(v<<24>>24|0)){j=f[h>>2]|0;f[h>>2]=j+4;f[j>>2]=n;i=(i>>>0<((l?f[p>>2]|0:k&255)+-1|0)>>>0&1)+i|0;j=0;}l=Vc[f[(f[q>>2]|0)+44>>2]&31](q,b[m>>0]|0)|0;v=f[h>>2]|0;f[h>>2]=v+4;f[v>>2]=l;m=m+1|0;j=j+1|0;}i=e+(a-r<<2)|0;a=f[h>>2]|0;if((i|0)!=(a|0)){while(1){a=a+-4|0;if(i>>>0>=a>>>0)break;v=f[i>>2]|0;f[i>>2]=f[a>>2];f[a>>2]=v;i=i+4|0;}i=f[h>>2]|0;}}else {Xc[f[(f[q>>2]|0)+48>>2]&7](q,a,d,e)|0;i=e+(j-r<<2)|0;f[h>>2]=i;}f[g>>2]=(c|0)==(d|0)?i:e+(c-r<<2)|0;HL(s);u=t;return}function QE(a){return}function RE(a){a=a|0;xL(a);return}function SE(a){return 2}function TE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=jF(a,j,i,d,e,g,56011,56019)|0;u=h;return g|0}function UE(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;i=u;l=u=u+31&-32;u=u+16|0;j=l+12|0;k=l+8|0;m=l+4|0;n=a+8|0;n=Uc[f[(f[n>>2]|0)+20>>2]&127](n)|0;f[m>>2]=f[c>>2];f[l>>2]=f[d>>2];d=b[n+11>>0]|0;o=d<<24>>24<0;c=o?f[n>>2]|0:n;d=c+(o?f[n+4>>2]|0:d&255)|0;f[k>>2]=f[m>>2];f[j>>2]=f[l>>2];h=jF(a,k,j,e,g,h,c,d)|0;u=i;return h|0}function VE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61044)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];hF(a,g+24|0,b,i,e,d);u=h;return f[b>>2]|0}function WE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61044)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];iF(a,g+16|0,b,i,e,d);u=h;return f[b>>2]|0}function XE(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61044)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];uF(a,g+20|0,b,i,e,d);u=h;return f[b>>2]|0}function YE(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;X=u;O=u=u+31&-32;u=u+144|0;k=O+128|0;j=O+112|0;V=O+124|0;W=O+120|0;l=O+116|0;m=O+108|0;n=O+104|0;o=O+100|0;p=O+96|0;q=O+92|0;r=O+88|0;s=O+84|0;t=O+80|0;v=O+76|0;w=O+72|0;x=O+68|0;y=O+64|0;z=O+60|0;A=O+56|0;B=O+52|0;C=O+48|0;D=O+44|0;E=O+40|0;F=O+36|0;G=O+32|0;H=O+28|0;I=O+24|0;J=O+20|0;K=O+16|0;L=O+12|0;M=O+8|0;N=O+4|0;f[g>>2]=0;KB(k,e);P=dD(k,61044)|0;eD(k);Q=h+8|0;R=h+20|0;S=h+16|0;T=h+24|0;U=a+8|0;do switch(i<<24>>24|0){case 65:case 97:{f[V>>2]=f[d>>2];f[k>>2]=f[V>>2];hF(a,T,c,k,g,P);Y=26;break}case 104:case 66:case 98:{f[W>>2]=f[d>>2];f[k>>2]=f[W>>2];iF(a,S,c,k,g,P);Y=26;break}case 99:{W=Uc[f[(f[U>>2]|0)+12>>2]&127](U)|0;f[l>>2]=f[c>>2];f[m>>2]=f[d>>2];Y=b[W+11>>0]|0;d=Y<<24>>24<0;i=d?f[W>>2]|0:W;Y=i+(d?f[W+4>>2]|0:Y&255)|0;f[j>>2]=f[l>>2];f[k>>2]=f[m>>2];Y=jF(a,j,k,e,g,h,i,Y)|0;f[c>>2]=Y;Y=26;break}case 101:case 100:{f[n>>2]=f[d>>2];f[k>>2]=f[n>>2];kF(a,h+12|0,c,k,g,P);Y=26;break}case 68:{f[o>>2]=f[c>>2];f[p>>2]=f[d>>2];f[j>>2]=f[o>>2];f[k>>2]=f[p>>2];Y=jF(a,j,k,e,g,h,55971,55979)|0;f[c>>2]=Y;Y=26;break}case 70:{f[q>>2]=f[c>>2];f[r>>2]=f[d>>2];f[j>>2]=f[q>>2];f[k>>2]=f[r>>2];Y=jF(a,j,k,e,g,h,55979,55987)|0;f[c>>2]=Y;Y=26;break}case 72:{f[s>>2]=f[d>>2];f[k>>2]=f[s>>2];lF(a,Q,c,k,g,P);Y=26;break}case 73:{f[t>>2]=f[d>>2];f[k>>2]=f[t>>2];mF(a,Q,c,k,g,P);Y=26;break}case 106:{f[v>>2]=f[d>>2];f[k>>2]=f[v>>2];nF(a,h+28|0,c,k,g,P);Y=26;break}case 109:{f[w>>2]=f[d>>2];f[k>>2]=f[w>>2];oF(a,S,c,k,g,P);Y=26;break}case 77:{f[x>>2]=f[d>>2];f[k>>2]=f[x>>2];pF(a,h+4|0,c,k,g,P);Y=26;break}case 116:case 110:{f[y>>2]=f[d>>2];f[k>>2]=f[y>>2];qF(a,c,k,g,P);Y=26;break}case 112:{f[z>>2]=f[d>>2];f[k>>2]=f[z>>2];rF(a,Q,c,k,g,P);Y=26;break}case 114:{f[A>>2]=f[c>>2];f[B>>2]=f[d>>2];f[j>>2]=f[A>>2];f[k>>2]=f[B>>2];Y=jF(a,j,k,e,g,h,55987,55998)|0;f[c>>2]=Y;Y=26;break}case 82:{f[C>>2]=f[c>>2];f[D>>2]=f[d>>2];f[j>>2]=f[C>>2];f[k>>2]=f[D>>2];Y=jF(a,j,k,e,g,h,55998,56003)|0;f[c>>2]=Y;Y=26;break}case 83:{f[E>>2]=f[d>>2];f[k>>2]=f[E>>2];sF(a,h,c,k,g,P);Y=26;break}case 84:{f[F>>2]=f[c>>2];f[G>>2]=f[d>>2];f[j>>2]=f[F>>2];f[k>>2]=f[G>>2];Y=jF(a,j,k,e,g,h,56003,56011)|0;f[c>>2]=Y;Y=26;break}case 119:{f[H>>2]=f[d>>2];f[k>>2]=f[H>>2];tF(a,T,c,k,g,P);Y=26;break}case 120:{i=f[(f[a>>2]|0)+20>>2]|0;f[I>>2]=f[c>>2];f[J>>2]=f[d>>2];f[j>>2]=f[I>>2];f[k>>2]=f[J>>2];j=$c[i&63](a,j,k,e,g,h)|0;break}case 88:{W=Uc[f[(f[U>>2]|0)+24>>2]&127](U)|0;f[K>>2]=f[c>>2];f[L>>2]=f[d>>2];Y=b[W+11>>0]|0;d=Y<<24>>24<0;i=d?f[W>>2]|0:W;Y=i+(d?f[W+4>>2]|0:Y&255)|0;f[j>>2]=f[K>>2];f[k>>2]=f[L>>2];Y=jF(a,j,k,e,g,h,i,Y)|0;f[c>>2]=Y;Y=26;break}case 121:{f[M>>2]=f[d>>2];f[k>>2]=f[M>>2];uF(a,R,c,k,g,P);Y=26;break}case 89:{f[N>>2]=f[d>>2];f[k>>2]=f[N>>2];vF(a,R,c,k,g,P);Y=26;break}case 37:{f[O>>2]=f[d>>2];f[k>>2]=f[O>>2];wF(a,c,k,g,P);Y=26;break}default:{f[g>>2]=f[g>>2]|4;Y=26;}}while(0);if((Y|0)==26)j=f[c>>2]|0;u=X;return j|0}function ZE(a){if((b[58440]|0)==0?YM(58440)|0:0){gF();f[15479]=61748;}return f[15479]|0}function _E(a){if((b[58424]|0)==0?YM(58424)|0:0){fF();f[15436]=61456;}return f[15436]|0}function $E(a){if((b[58408]|0)==0?YM(58408)|0:0){eF();f[15363]=61164;}return f[15363]|0}function aF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;c=u=u+31&-32;u=u+16|0;if((b[58400]|0)==0?YM(58400)|0:0){f[15288]=0;f[15289]=0;f[15290]=0;d=FB(55729)|0;if(d>>>0>4294967279)EL();if(d>>>0<11){b[61163]=d;a=61152;}else {g=d+16&-16;a=vL(g)|0;f[15288]=a;f[15290]=g|-2147483648;f[15289]=d;}MA(a,55729,d)|0;b[c>>0]=0;GB(a+d|0,c);}u=e;return 61152}function bF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;c=u=u+31&-32;u=u+16|0;if((b[58392]|0)==0?YM(58392)|0:0){f[15285]=0;f[15286]=0;f[15287]=0;d=FB(55717)|0;if(d>>>0>4294967279)EL();if(d>>>0<11){b[61151]=d;a=61140;}else {g=d+16&-16;a=vL(g)|0;f[15285]=a;f[15287]=g|-2147483648;f[15286]=d;}MA(a,55717,d)|0;b[c>>0]=0;GB(a+d|0,c);}u=e;return 61140}function cF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;c=u=u+31&-32;u=u+16|0;if((b[58384]|0)==0?YM(58384)|0:0){f[15282]=0;f[15283]=0;f[15284]=0;d=FB(55708)|0;if(d>>>0>4294967279)EL();if(d>>>0<11){b[61139]=d;a=61128;}else {g=d+16&-16;a=vL(g)|0;f[15282]=a;f[15284]=g|-2147483648;f[15283]=d;}MA(a,55708,d)|0;b[c>>0]=0;GB(a+d|0,c);}u=e;return 61128}function dF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;c=u=u+31&-32;u=u+16|0;if((b[58376]|0)==0?YM(58376)|0:0){f[15279]=0;f[15280]=0;f[15281]=0;d=FB(55699)|0;if(d>>>0>4294967279)EL();if(d>>>0<11){b[61127]=d;a=61116;}else {g=d+16&-16;a=vL(g)|0;f[15279]=a;f[15281]=g|-2147483648;f[15280]=d;}MA(a,55699,d)|0;b[c>>0]=0;GB(a+d|0,c);}u=e;return 61116}function eF(){var a=0,c=0;if((b[58416]|0)==0?YM(58416)|0:0){c=61164;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=61452)}NL(61164,55750)|0;NL(61176,55753)|0;return}function fF(){var a=0,c=0;if((b[58432]|0)==0?YM(58432)|0:0){c=61456;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=61744)}NL(61456,55756)|0;NL(61468,55764)|0;NL(61480,55773)|0;NL(61492,55779)|0;NL(61504,55785)|0;NL(61516,55789)|0;NL(61528,55794)|0;NL(61540,55799)|0;NL(61552,55806)|0;NL(61564,55816)|0;NL(61576,55824)|0;NL(61588,55833)|0;NL(61600,55842)|0;NL(61612,55846)|0;NL(61624,55850)|0;NL(61636,55854)|0;NL(61648,55785)|0;NL(61660,55858)|0;NL(61672,55862)|0;NL(61684,55866)|0;NL(61696,55870)|0;NL(61708,55874)|0;NL(61720,55878)|0;NL(61732,55882)|0;return}function gF(){var a=0,c=0;if((b[58448]|0)==0?YM(58448)|0:0){c=61748;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=61916)}NL(61748,55886)|0;NL(61760,55893)|0;NL(61772,55900)|0;NL(61784,55908)|0;NL(61796,55918)|0;NL(61808,55927)|0;NL(61820,55934)|0;NL(61832,55943)|0;NL(61844,55947)|0;NL(61856,55951)|0;NL(61868,55955)|0;NL(61880,55959)|0;NL(61892,55963)|0;NL(61904,55967)|0;return}function hF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;a=a+8|0;a=Uc[f[f[a>>2]>>2]&127](a)|0;f[j>>2]=f[d>>2];f[i>>2]=f[j>>2];a=(LD(c,i,a,a+168|0,g,e,0)|0)-a|0;if((a|0)<168)f[b>>2]=((a|0)/12|0|0)%7|0;u=h;return}function iF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;a=a+8|0;a=Uc[f[(f[a>>2]|0)+4>>2]&127](a)|0;f[j>>2]=f[d>>2];f[i>>2]=f[j>>2];a=(LD(c,i,a,a+288|0,g,e,0)|0)-a|0;if((a|0)<288)f[b>>2]=((a|0)/12|0|0)%12|0;u=h;return}function jF(a,c,e,g,h,i,j,k){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=u;z=u=u+31&-32;u=u+16|0;t=z+12|0;s=z+8|0;y=z+4|0;KB(t,g);v=dD(t,61044)|0;eD(t);f[h>>2]=0;w=v+8|0;l=0;a:while(1){r=(j|0)!=(k|0);m=l;while(1){l=f[c>>2]|0;if(!(r&(m|0)==0))break a;n=l;if(l){m=f[l+12>>2]|0;if((m|0)==(f[l+16>>2]|0))m=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else m=LA(b[m>>0]|0)|0;if(JB(m,KA()|0)|0){f[c>>2]=0;l=0;p=1;q=0;}else {p=0;q=n;}}else {l=0;p=1;q=n;}o=f[e>>2]|0;m=o;do if(o){n=f[o+12>>2]|0;if((n|0)==(f[o+16>>2]|0))n=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else n=LA(b[n>>0]|0)|0;if(!(JB(n,KA()|0)|0))if(p)break;else {A=61;break a}else {f[e>>2]=0;m=0;A=16;break}}else A=16;while(0);if((A|0)==16){A=0;if(p){A=61;break a}else o=0;}if((Wc[f[(f[v>>2]|0)+36>>2]&63](v,b[j>>0]|0,0)|0)<<24>>24==37){A=19;break}m=b[j>>0]|0;if(m<<24>>24>-1?(x=f[w>>2]|0,d[x+(m<<24>>24<<1)>>1]&8192):0){A=27;break}n=l+12|0;m=f[n>>2]|0;o=l+16|0;if((m|0)==(f[o>>2]|0))m=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else m=LA(b[m>>0]|0)|0;q=Vc[f[(f[v>>2]|0)+12>>2]&31](v,m&255)|0;if(q<<24>>24==(Vc[f[(f[v>>2]|0)+12>>2]&31](v,b[j>>0]|0)|0)<<24>>24){A=57;break}f[h>>2]=4;m=4;}b:do if((A|0)==19){A=0;p=j+1|0;if((p|0)==(k|0)){A=61;break a}n=Wc[f[(f[v>>2]|0)+36>>2]&63](v,b[p>>0]|0,0)|0;switch(n<<24>>24){case 48:case 69:{j=j+2|0;if((j|0)==(k|0)){A=61;break a}o=n;l=Wc[f[(f[v>>2]|0)+36>>2]&63](v,b[j>>0]|0,0)|0;j=p;break}default:{o=0;l=n;}}r=f[(f[a>>2]|0)+36>>2]|0;f[y>>2]=q;f[z>>2]=m;f[s>>2]=f[y>>2];f[t>>2]=f[z>>2];r=bd[r&15](a,s,t,g,h,i,l,o)|0;f[c>>2]=r;j=j+2|0;}else if((A|0)==27){while(1){A=0;j=j+1|0;if((j|0)==(k|0)){j=k;break}m=b[j>>0]|0;if(m<<24>>24<=-1)break;if(!(d[x+(m<<24>>24<<1)>>1]&8192))break;else A=27;}m=o;while(1){if(l){n=f[l+12>>2]|0;if((n|0)==(f[l+16>>2]|0))n=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else n=LA(b[n>>0]|0)|0;if(JB(n,KA()|0)|0){f[c>>2]=0;p=1;l=0;}else p=0;}else {p=1;l=0;}do if(o){n=f[o+12>>2]|0;if((n|0)==(f[o+16>>2]|0))n=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else n=LA(b[n>>0]|0)|0;if(!(JB(n,KA()|0)|0))if(p^(m|0)==0){q=m;o=m;break}else break b;else {f[e>>2]=0;m=0;A=43;break}}else A=43;while(0);if((A|0)==43){A=0;if(p)break b;else {q=m;o=0;}}n=l+12|0;m=f[n>>2]|0;p=l+16|0;if((m|0)==(f[p>>2]|0))m=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else m=LA(b[m>>0]|0)|0;if((m&255)<<24>>24<=-1)break b;if(!(d[(f[w>>2]|0)+(m<<24>>24<<1)>>1]&8192))break b;m=f[n>>2]|0;if((m|0)==(f[p>>2]|0)){Uc[f[(f[l>>2]|0)+40>>2]&127](l)|0;m=q;continue}else {f[n>>2]=m+1;LA(b[m>>0]|0)|0;m=q;continue}}}else if((A|0)==57){A=0;j=j+1|0;m=f[n>>2]|0;if((m|0)==(f[o>>2]|0)){Uc[f[(f[l>>2]|0)+40>>2]&127](l)|0;break}else {f[n>>2]=m+1;LA(b[m>>0]|0)|0;break}}while(0);l=f[h>>2]|0;}if((A|0)==61)f[h>>2]=4;if(l){j=f[l+12>>2]|0;if((j|0)==(f[l+16>>2]|0))j=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else j=LA(b[j>>0]|0)|0;if(JB(j,KA()|0)|0){f[c>>2]=0;l=0;n=1;}else n=0;}else {l=0;n=1;}j=f[e>>2]|0;do if(j){m=f[j+12>>2]|0;if((m|0)==(f[j+16>>2]|0))j=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else j=LA(b[m>>0]|0)|0;if(!(JB(j,KA()|0)|0))if(n)break;else {A=76;break}else {f[e>>2]=0;A=74;break}}else A=74;while(0);if((A|0)==74?n:0)A=76;if((A|0)==76)f[h>>2]=f[h>>2]|2;u=B;return l|0}function kF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a+-1|0)>>>0<31&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function lF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<24&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function mF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a+-1|0)>>>0<12&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function nF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,3)|0;c=f[e>>2]|0;if((a|0)<366&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function oF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<13&(c&4|0)==0)f[b>>2]=a+-1;else f[e>>2]=c|4;u=h;return}function pF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<60&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function qF(a,c,e,g,h){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0;j=h+8|0;a:while(1){a=f[c>>2]|0;do if(a){h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;i=1;break}else {i=(f[c>>2]|0)==0;break}}else i=1;while(0);h=f[e>>2]|0;do if(h){a=f[h+12>>2]|0;if((a|0)==(f[h+16>>2]|0))a=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(i){i=h;break}else {i=h;break a}else {f[e>>2]=0;k=15;break}}else k=15;while(0);if((k|0)==15){k=0;if(i){i=0;break}else i=0;}a=f[c>>2]|0;h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if((a&255)<<24>>24<=-1)break;if(!(d[(f[j>>2]|0)+(a<<24>>24<<1)>>1]&8192))break;a=f[c>>2]|0;h=a+12|0;i=f[h>>2]|0;if((i|0)==(f[a+16>>2]|0)){Uc[f[(f[a>>2]|0)+40>>2]&127](a)|0;continue}else {f[h>>2]=i+1;LA(b[i>>0]|0)|0;continue}}a=f[c>>2]|0;do if(a){h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;h=1;break}else {h=(f[c>>2]|0)==0;break}}else h=1;while(0);do if(i){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(h)break;else {k=40;break}else {f[e>>2]=0;k=38;break}}else k=38;while(0);if((k|0)==38?h:0)k=40;if((k|0)==40)f[g>>2]=f[g>>2]|2;return}function rF(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;m=u;l=u=u+31&-32;u=u+16|0;k=l+4|0;j=a+8|0;j=Uc[f[(f[j>>2]|0)+8>>2]&127](j)|0;a=b[j+11>>0]|0;if(a<<24>>24<0)i=f[j+4>>2]|0;else i=a&255;a=b[j+12+11>>0]|0;if(a<<24>>24<0)a=f[j+16>>2]|0;else a=a&255;do if((i|0)!=(0-a|0)){f[l>>2]=f[e>>2];f[k>>2]=f[l>>2];a=(LD(d,k,j,j+24|0,h,g,0)|0)-j|0;i=f[c>>2]|0;if((i|0)==12&(a|0)==0){f[c>>2]=0;break}if((i|0)<12&(a|0)==12)f[c>>2]=i+12;}else f[g>>2]=f[g>>2]|4;while(0);u=m;return}function sF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<61&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function tF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,1)|0;c=f[e>>2]|0;if((a|0)<7&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function uF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,4)|0;if(!(f[e>>2]&4)){if((a|0)<69)a=a+2e3|0;else a=(a|0)<100?a+1900|0:a;f[b>>2]=a+-1900;}u=h;return}function vF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=xF(c,a,e,g,4)|0;if(!(f[e>>2]&4))f[b>>2]=a+-1900;u=h;return}function wF(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0;a=f[c>>2]|0;do if(a){h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;i=1;break}else {i=(f[c>>2]|0)==0;break}}else i=1;while(0);h=f[d>>2]|0;do if(h){a=f[h+12>>2]|0;if((a|0)==(f[h+16>>2]|0))a=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(i){j=h;k=16;break}else {a=6;k=38;break}else {f[d>>2]=0;k=14;break}}else k=14;while(0);if((k|0)==14)if(i){a=6;k=38;}else {j=0;k=16;}a:do if((k|0)==16){a=f[c>>2]|0;h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if((Wc[f[(f[g>>2]|0)+36>>2]&63](g,a&255,0)|0)<<24>>24==37){a=f[c>>2]|0;h=a+12|0;i=f[h>>2]|0;if((i|0)==(f[a+16>>2]|0))Uc[f[(f[a>>2]|0)+40>>2]&127](a)|0;else {f[h>>2]=i+1;LA(b[i>>0]|0)|0;}a=f[c>>2]|0;do if(a){h=f[a+12>>2]|0;if((h|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[h>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;h=1;break}else {h=(f[c>>2]|0)==0;break}}else h=1;while(0);do if(j|0){a=f[j+12>>2]|0;if((a|0)==(f[j+16>>2]|0))a=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(h)break a;else {a=2;k=38;break a}else {f[d>>2]=0;break}}while(0);if(h){a=2;k=38;}}else {a=4;k=38;}}while(0);if((k|0)==38)f[e>>2]=f[e>>2]|a;return}function xF(a,c,e,g,h){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;i=f[a>>2]|0;do if(i){j=f[i+12>>2]|0;if((j|0)==(f[i+16>>2]|0))i=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else i=LA(b[j>>0]|0)|0;if(JB(i,KA()|0)|0){f[a>>2]=0;k=1;break}else {k=(f[a>>2]|0)==0;break}}else k=1;while(0);j=f[c>>2]|0;do if(j){i=f[j+12>>2]|0;if((i|0)==(f[j+16>>2]|0))i=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else i=LA(b[i>>0]|0)|0;if(!(JB(i,KA()|0)|0))if(k){s=17;break}else {s=16;break}else {f[c>>2]=0;s=14;break}}else s=14;while(0);if((s|0)==14)if(k)s=16;else {j=0;s=17;}a:do if((s|0)==16){f[e>>2]=f[e>>2]|6;i=0;}else if((s|0)==17){i=f[a>>2]|0;k=f[i+12>>2]|0;if((k|0)==(f[i+16>>2]|0))i=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else i=LA(b[k>>0]|0)|0;k=i&255;if(k<<24>>24>-1?(r=g+8|0,d[(f[r>>2]|0)+(i<<24>>24<<1)>>1]&2048):0){i=(Wc[f[(f[g>>2]|0)+36>>2]&63](g,k,0)|0)<<24>>24;k=f[a>>2]|0;l=k+12|0;m=f[l>>2]|0;if((m|0)==(f[k+16>>2]|0)){Uc[f[(f[k>>2]|0)+40>>2]&127](k)|0;n=j;l=j;}else {f[l>>2]=m+1;LA(b[m>>0]|0)|0;n=j;l=j;}while(1){i=i+-48|0;q=h+-1|0;j=f[a>>2]|0;do if(j){k=f[j+12>>2]|0;if((k|0)==(f[j+16>>2]|0))j=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else j=LA(b[k>>0]|0)|0;if(JB(j,KA()|0)|0){f[a>>2]=0;m=1;break}else {m=(f[a>>2]|0)==0;break}}else m=1;while(0);do if(l){j=f[l+12>>2]|0;if((j|0)==(f[l+16>>2]|0))j=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else j=LA(b[j>>0]|0)|0;if(JB(j,KA()|0)|0){f[c>>2]=0;p=0;j=1;o=0;break}else {p=n;j=(n|0)==0;o=n;break}}else {p=n;j=1;o=0;}while(0);k=f[a>>2]|0;if(!((h|0)>1&(m^j)))break;j=f[k+12>>2]|0;if((j|0)==(f[k+16>>2]|0))j=Uc[f[(f[k>>2]|0)+36>>2]&127](k)|0;else j=LA(b[j>>0]|0)|0;k=j&255;if(k<<24>>24<=-1)break a;if(!(d[(f[r>>2]|0)+(j<<24>>24<<1)>>1]&2048))break a;i=((Wc[f[(f[g>>2]|0)+36>>2]&63](g,k,0)|0)<<24>>24)+(i*10|0)|0;j=f[a>>2]|0;k=j+12|0;l=f[k>>2]|0;if((l|0)==(f[j+16>>2]|0)){Uc[f[(f[j>>2]|0)+40>>2]&127](j)|0;h=q;n=p;l=o;continue}else {f[k>>2]=l+1;LA(b[l>>0]|0)|0;h=q;n=p;l=o;continue}}do if(k){j=f[k+12>>2]|0;if((j|0)==(f[k+16>>2]|0))j=Uc[f[(f[k>>2]|0)+36>>2]&127](k)|0;else j=LA(b[j>>0]|0)|0;if(JB(j,KA()|0)|0){f[a>>2]=0;k=1;break}else {k=(f[a>>2]|0)==0;break}}else k=1;while(0);do if(p){j=f[p+12>>2]|0;if((j|0)==(f[p+16>>2]|0))j=Uc[f[(f[p>>2]|0)+36>>2]&127](p)|0;else j=LA(b[j>>0]|0)|0;if(!(JB(j,KA()|0)|0))if(k)break a;else break;else {f[c>>2]=0;s=62;break}}else s=62;while(0);if((s|0)==62?!k:0)break;f[e>>2]=f[e>>2]|2;break}f[e>>2]=f[e>>2]|4;i=0;}while(0);return i|0}function yF(a){return}function zF(a){a=a|0;xL(a);return}function AF(a){return 2}function BF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;k=u=u+31&-32;u=u+16|0;i=k+12|0;j=k+8|0;l=k+4|0;f[l>>2]=f[b>>2];f[k>>2]=f[c>>2];f[j>>2]=f[l>>2];f[i>>2]=f[k>>2];g=UF(a,j,i,d,e,g,16764,16796)|0;u=h;return g|0}function CF(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;i=u;l=u=u+31&-32;u=u+16|0;j=l+12|0;k=l+8|0;m=l+4|0;n=a+8|0;n=Uc[f[(f[n>>2]|0)+20>>2]&127](n)|0;f[m>>2]=f[c>>2];f[l>>2]=f[d>>2];d=b[n+8+3>>0]|0;o=d<<24>>24<0;c=o?f[n>>2]|0:n;d=c+((o?f[n+4>>2]|0:d&255)<<2)|0;f[k>>2]=f[m>>2];f[j>>2]=f[l>>2];h=UF(a,k,j,e,g,h,c,d)|0;u=i;return h|0}function DF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61076)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];SF(a,g+24|0,b,i,e,d);u=h;return f[b>>2]|0}function EF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61076)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];TF(a,g+16|0,b,i,e,d);u=h;return f[b>>2]|0}function FF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;KB(i,d);d=dD(i,61076)|0;eD(i);f[j>>2]=f[c>>2];f[i>>2]=f[j>>2];dG(a,g+20|0,b,i,e,d);u=h;return f[b>>2]|0}function GF(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;X=u;O=u=u+31&-32;u=u+144|0;k=O+128|0;j=O+112|0;V=O+124|0;W=O+120|0;l=O+116|0;m=O+108|0;n=O+104|0;o=O+100|0;p=O+96|0;q=O+92|0;r=O+88|0;s=O+84|0;t=O+80|0;v=O+76|0;w=O+72|0;x=O+68|0;y=O+64|0;z=O+60|0;A=O+56|0;B=O+52|0;C=O+48|0;D=O+44|0;E=O+40|0;F=O+36|0;G=O+32|0;H=O+28|0;I=O+24|0;J=O+20|0;K=O+16|0;L=O+12|0;M=O+8|0;N=O+4|0;f[g>>2]=0;KB(k,e);P=dD(k,61076)|0;eD(k);Q=h+8|0;R=h+20|0;S=h+16|0;T=h+24|0;U=a+8|0;do switch(i<<24>>24|0){case 65:case 97:{f[V>>2]=f[d>>2];f[k>>2]=f[V>>2];SF(a,T,c,k,g,P);Y=26;break}case 104:case 66:case 98:{f[W>>2]=f[d>>2];f[k>>2]=f[W>>2];TF(a,S,c,k,g,P);Y=26;break}case 99:{W=Uc[f[(f[U>>2]|0)+12>>2]&127](U)|0;f[l>>2]=f[c>>2];f[m>>2]=f[d>>2];Y=b[W+8+3>>0]|0;d=Y<<24>>24<0;i=d?f[W>>2]|0:W;Y=i+((d?f[W+4>>2]|0:Y&255)<<2)|0;f[j>>2]=f[l>>2];f[k>>2]=f[m>>2];Y=UF(a,j,k,e,g,h,i,Y)|0;f[c>>2]=Y;Y=26;break}case 101:case 100:{f[n>>2]=f[d>>2];f[k>>2]=f[n>>2];VF(a,h+12|0,c,k,g,P);Y=26;break}case 68:{f[o>>2]=f[c>>2];f[p>>2]=f[d>>2];f[j>>2]=f[o>>2];f[k>>2]=f[p>>2];Y=UF(a,j,k,e,g,h,16604,16636)|0;f[c>>2]=Y;Y=26;break}case 70:{f[q>>2]=f[c>>2];f[r>>2]=f[d>>2];f[j>>2]=f[q>>2];f[k>>2]=f[r>>2];Y=UF(a,j,k,e,g,h,16636,16668)|0;f[c>>2]=Y;Y=26;break}case 72:{f[s>>2]=f[d>>2];f[k>>2]=f[s>>2];WF(a,Q,c,k,g,P);Y=26;break}case 73:{f[t>>2]=f[d>>2];f[k>>2]=f[t>>2];XF(a,Q,c,k,g,P);Y=26;break}case 106:{f[v>>2]=f[d>>2];f[k>>2]=f[v>>2];YF(a,h+28|0,c,k,g,P);Y=26;break}case 109:{f[w>>2]=f[d>>2];f[k>>2]=f[w>>2];ZF(a,S,c,k,g,P);Y=26;break}case 77:{f[x>>2]=f[d>>2];f[k>>2]=f[x>>2];_F(a,h+4|0,c,k,g,P);Y=26;break}case 116:case 110:{f[y>>2]=f[d>>2];f[k>>2]=f[y>>2];$F(a,c,k,g,P);Y=26;break}case 112:{f[z>>2]=f[d>>2];f[k>>2]=f[z>>2];aG(a,Q,c,k,g,P);Y=26;break}case 114:{f[A>>2]=f[c>>2];f[B>>2]=f[d>>2];f[j>>2]=f[A>>2];f[k>>2]=f[B>>2];Y=UF(a,j,k,e,g,h,16668,16712)|0;f[c>>2]=Y;Y=26;break}case 82:{f[C>>2]=f[c>>2];f[D>>2]=f[d>>2];f[j>>2]=f[C>>2];f[k>>2]=f[D>>2];Y=UF(a,j,k,e,g,h,16712,16732)|0;f[c>>2]=Y;Y=26;break}case 83:{f[E>>2]=f[d>>2];f[k>>2]=f[E>>2];bG(a,h,c,k,g,P);Y=26;break}case 84:{f[F>>2]=f[c>>2];f[G>>2]=f[d>>2];f[j>>2]=f[F>>2];f[k>>2]=f[G>>2];Y=UF(a,j,k,e,g,h,16732,16764)|0;f[c>>2]=Y;Y=26;break}case 119:{f[H>>2]=f[d>>2];f[k>>2]=f[H>>2];cG(a,T,c,k,g,P);Y=26;break}case 120:{i=f[(f[a>>2]|0)+20>>2]|0;f[I>>2]=f[c>>2];f[J>>2]=f[d>>2];f[j>>2]=f[I>>2];f[k>>2]=f[J>>2];j=$c[i&63](a,j,k,e,g,h)|0;break}case 88:{W=Uc[f[(f[U>>2]|0)+24>>2]&127](U)|0;f[K>>2]=f[c>>2];f[L>>2]=f[d>>2];Y=b[W+8+3>>0]|0;d=Y<<24>>24<0;i=d?f[W>>2]|0:W;Y=i+((d?f[W+4>>2]|0:Y&255)<<2)|0;f[j>>2]=f[K>>2];f[k>>2]=f[L>>2];Y=UF(a,j,k,e,g,h,i,Y)|0;f[c>>2]=Y;Y=26;break}case 121:{f[M>>2]=f[d>>2];f[k>>2]=f[M>>2];dG(a,R,c,k,g,P);Y=26;break}case 89:{f[N>>2]=f[d>>2];f[k>>2]=f[N>>2];eG(a,R,c,k,g,P);Y=26;break}case 37:{f[O>>2]=f[d>>2];f[k>>2]=f[O>>2];fG(a,c,k,g,P);Y=26;break}default:{f[g>>2]=f[g>>2]|4;Y=26;}}while(0);if((Y|0)==26)j=f[c>>2]|0;u=X;return j|0}function HF(a){if((b[58520]|0)==0?YM(58520)|0:0){RF();f[15682]=62560;}return f[15682]|0}function IF(a){if((b[58504]|0)==0?YM(58504)|0:0){QF();f[15639]=62268;}return f[15639]|0}function JF(a){if((b[58488]|0)==0?YM(58488)|0:0){PF();f[15566]=61976;}return f[15566]|0}function KF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;a=u=u+31&-32;u=u+16|0;if((b[58480]|0)==0?YM(58480)|0:0){f[15491]=0;f[15492]=0;f[15493]=0;d=OF(15636)|0;if(d>>>0>1073741807)EL();do if(d>>>0>=2){c=d+4&-4;if(c>>>0>1073741823)Gb();else {g=vL(c<<2)|0;f[15491]=g;f[15493]=c|-2147483648;f[15492]=d;break}}else {b[61975]=d;g=61964;}while(0);cB(g,15636,d)|0;f[a>>2]=0;RC(g+(d<<2)|0,a);}u=e;return 61964}function LF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;a=u=u+31&-32;u=u+16|0;if((b[58472]|0)==0?YM(58472)|0:0){f[15488]=0;f[15489]=0;f[15490]=0;d=OF(15588)|0;if(d>>>0>1073741807)EL();do if(d>>>0>=2){c=d+4&-4;if(c>>>0>1073741823)Gb();else {g=vL(c<<2)|0;f[15488]=g;f[15490]=c|-2147483648;f[15489]=d;break}}else {b[61963]=d;g=61952;}while(0);cB(g,15588,d)|0;f[a>>2]=0;RC(g+(d<<2)|0,a);}u=e;return 61952}function MF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;a=u=u+31&-32;u=u+16|0;if((b[58464]|0)==0?YM(58464)|0:0){f[15485]=0;f[15486]=0;f[15487]=0;d=OF(15552)|0;if(d>>>0>1073741807)EL();do if(d>>>0>=2){c=d+4&-4;if(c>>>0>1073741823)Gb();else {g=vL(c<<2)|0;f[15485]=g;f[15487]=c|-2147483648;f[15486]=d;break}}else {b[61951]=d;g=61940;}while(0);cB(g,15552,d)|0;f[a>>2]=0;RC(g+(d<<2)|0,a);}u=e;return 61940}function NF(a){a=a|0;var c=0,d=0,e=0,g=0;e=u;a=u=u+31&-32;u=u+16|0;if((b[58456]|0)==0?YM(58456)|0:0){f[15482]=0;f[15483]=0;f[15484]=0;d=OF(15516)|0;if(d>>>0>1073741807)EL();do if(d>>>0>=2){c=d+4&-4;if(c>>>0>1073741823)Gb();else {g=vL(c<<2)|0;f[15482]=g;f[15484]=c|-2147483648;f[15483]=d;break}}else {b[61939]=d;g=61928;}while(0);cB(g,15516,d)|0;f[a>>2]=0;RC(g+(d<<2)|0,a);}u=e;return 61928}function OF(a){a=a|0;return tz(a)|0}function PF(){var a=0,c=0;if((b[58496]|0)==0?YM(58496)|0:0){c=61976;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=62264)}ZL(61976,15720)|0;ZL(61988,15732)|0;return}function QF(){var a=0,c=0;if((b[58512]|0)==0?YM(58512)|0:0){c=62268;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=62556)}ZL(62268,15744)|0;ZL(62280,15776)|0;ZL(62292,15812)|0;ZL(62304,15836)|0;ZL(62316,15860)|0;ZL(62328,15876)|0;ZL(62340,15896)|0;ZL(62352,15916)|0;ZL(62364,15944)|0;ZL(62376,15984)|0;ZL(62388,16016)|0;ZL(62400,16052)|0;ZL(62412,16088)|0;ZL(62424,16104)|0;ZL(62436,16120)|0;ZL(62448,16136)|0;ZL(62460,15860)|0;ZL(62472,16152)|0;ZL(62484,16168)|0;ZL(62496,16184)|0;ZL(62508,16200)|0;ZL(62520,16216)|0;ZL(62532,16232)|0;ZL(62544,16248)|0;return}function RF(){var a=0,c=0;if((b[58528]|0)==0?YM(58528)|0:0){c=62560;do{f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}c=c+12|0;}while((c|0)!=62728)}ZL(62560,16264)|0;ZL(62572,16292)|0;ZL(62584,16320)|0;ZL(62596,16352)|0;ZL(62608,16392)|0;ZL(62620,16428)|0;ZL(62632,16456)|0;ZL(62644,16492)|0;ZL(62656,16508)|0;ZL(62668,16524)|0;ZL(62680,16540)|0;ZL(62692,16556)|0;ZL(62704,16572)|0;ZL(62716,16588)|0;return}function SF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;a=a+8|0;a=Uc[f[f[a>>2]>>2]&127](a)|0;f[j>>2]=f[d>>2];f[i>>2]=f[j>>2];a=(kE(c,i,a,a+168|0,g,e,0)|0)-a|0;if((a|0)<168)f[b>>2]=((a|0)/12|0|0)%7|0;u=h;return}function TF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0;h=u;j=u=u+31&-32;u=u+16|0;i=j+4|0;a=a+8|0;a=Uc[f[(f[a>>2]|0)+4>>2]&127](a)|0;f[j>>2]=f[d>>2];f[i>>2]=f[j>>2];a=(kE(c,i,a,a+288|0,g,e,0)|0)-a|0;if((a|0)<288)f[b>>2]=((a|0)/12|0|0)%12|0;u=h;return}function UF(a,b,c,d,e,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0;x=u;v=u=u+31&-32;u=u+16|0;r=v+12|0;q=v+8|0;t=v+4|0;KB(r,d);s=dD(r,61076)|0;eD(r);f[e>>2]=0;j=0;a:while(1){p=(h|0)!=(i|0);k=j;while(1){j=f[b>>2]|0;if(!(p&(k|0)==0))break a;l=j;if(j){k=f[j+12>>2]|0;if((k|0)==(f[j+16>>2]|0))k=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else k=bB(f[k>>2]|0)|0;if(LB(k,aB()|0)|0){f[b>>2]=0;j=0;n=1;o=0;}else {n=0;o=l;}}else {j=0;n=1;o=l;}m=f[c>>2]|0;k=m;do if(m){l=f[m+12>>2]|0;if((l|0)==(f[m+16>>2]|0))l=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else l=bB(f[l>>2]|0)|0;if(!(LB(l,aB()|0)|0))if(n)break;else {w=58;break a}else {f[c>>2]=0;k=0;w=16;break}}else w=16;while(0);if((w|0)==16){w=0;if(n){w=58;break a}else m=0;}if((Wc[f[(f[s>>2]|0)+52>>2]&63](s,f[h>>2]|0,0)|0)<<24>>24==37){w=19;break}if(Wc[f[(f[s>>2]|0)+12>>2]&63](s,8192,f[h>>2]|0)|0){w=26;break}l=j+12|0;k=f[l>>2]|0;m=j+16|0;if((k|0)==(f[m>>2]|0))k=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else k=bB(f[k>>2]|0)|0;o=Vc[f[(f[s>>2]|0)+28>>2]&31](s,k)|0;if((o|0)==(Vc[f[(f[s>>2]|0)+28>>2]&31](s,f[h>>2]|0)|0)){w=54;break}f[e>>2]=4;k=4;}b:do if((w|0)==19){w=0;n=h+4|0;if((n|0)==(i|0)){w=58;break a}l=Wc[f[(f[s>>2]|0)+52>>2]&63](s,f[n>>2]|0,0)|0;switch(l<<24>>24){case 48:case 69:{h=h+8|0;if((h|0)==(i|0)){w=58;break a}m=l;j=Wc[f[(f[s>>2]|0)+52>>2]&63](s,f[h>>2]|0,0)|0;h=n;break}default:{m=0;j=l;}}p=f[(f[a>>2]|0)+36>>2]|0;f[t>>2]=o;f[v>>2]=k;f[q>>2]=f[t>>2];f[r>>2]=f[v>>2];p=bd[p&15](a,q,r,d,e,g,j,m)|0;f[b>>2]=p;h=h+8|0;}else if((w|0)==26){while(1){w=0;h=h+4|0;if((h|0)==(i|0)){h=i;break}if(Wc[f[(f[s>>2]|0)+12>>2]&63](s,8192,f[h>>2]|0)|0)w=26;else break}k=m;while(1){if(j){l=f[j+12>>2]|0;if((l|0)==(f[j+16>>2]|0))l=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else l=bB(f[l>>2]|0)|0;if(LB(l,aB()|0)|0){f[b>>2]=0;n=1;j=0;}else n=0;}else {n=1;j=0;}do if(m){l=f[m+12>>2]|0;if((l|0)==(f[m+16>>2]|0))l=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;else l=bB(f[l>>2]|0)|0;if(!(LB(l,aB()|0)|0))if(n^(k|0)==0){o=k;m=k;break}else break b;else {f[c>>2]=0;k=0;w=41;break}}else w=41;while(0);if((w|0)==41){w=0;if(n)break b;else {o=k;m=0;}}l=j+12|0;k=f[l>>2]|0;n=j+16|0;if((k|0)==(f[n>>2]|0))k=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else k=bB(f[k>>2]|0)|0;if(!(Wc[f[(f[s>>2]|0)+12>>2]&63](s,8192,k)|0))break b;k=f[l>>2]|0;if((k|0)==(f[n>>2]|0)){Uc[f[(f[j>>2]|0)+40>>2]&127](j)|0;k=o;continue}else {f[l>>2]=k+4;bB(f[k>>2]|0)|0;k=o;continue}}}else if((w|0)==54){w=0;h=h+4|0;k=f[l>>2]|0;if((k|0)==(f[m>>2]|0)){Uc[f[(f[j>>2]|0)+40>>2]&127](j)|0;break}else {f[l>>2]=k+4;bB(f[k>>2]|0)|0;break}}while(0);j=f[e>>2]|0;}if((w|0)==58)f[e>>2]=4;if(j){h=f[j+12>>2]|0;if((h|0)==(f[j+16>>2]|0))h=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else h=bB(f[h>>2]|0)|0;if(LB(h,aB()|0)|0){f[b>>2]=0;j=0;l=1;}else l=0;}else {j=0;l=1;}h=f[c>>2]|0;do if(h){k=f[h+12>>2]|0;if((k|0)==(f[h+16>>2]|0))h=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else h=bB(f[k>>2]|0)|0;if(!(LB(h,aB()|0)|0))if(l)break;else {w=73;break}else {f[c>>2]=0;w=71;break}}else w=71;while(0);if((w|0)==71?l:0)w=73;if((w|0)==73)f[e>>2]=f[e>>2]|2;u=x;return j|0}function VF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a+-1|0)>>>0<31&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function WF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<24&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function XF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a+-1|0)>>>0<12&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function YF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,3)|0;c=f[e>>2]|0;if((a|0)<366&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function ZF(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<13&(c&4|0)==0)f[b>>2]=a+-1;else f[e>>2]=c|4;u=h;return}function _F(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<60&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function $F(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0;a:while(1){a=f[b>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(LB(a,aB()|0)|0){f[b>>2]=0;h=1;break}else {h=(f[b>>2]|0)==0;break}}else h=1;while(0);g=f[c>>2]|0;do if(g){a=f[g+12>>2]|0;if((a|0)==(f[g+16>>2]|0))a=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(h){h=g;break}else {h=g;break a}else {f[c>>2]=0;i=15;break}}else i=15;while(0);if((i|0)==15){i=0;if(h){h=0;break}else h=0;}a=f[b>>2]|0;g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(!(Wc[f[(f[e>>2]|0)+12>>2]&63](e,8192,a)|0))break;a=f[b>>2]|0;g=a+12|0;h=f[g>>2]|0;if((h|0)==(f[a+16>>2]|0)){Uc[f[(f[a>>2]|0)+40>>2]&127](a)|0;continue}else {f[g>>2]=h+4;bB(f[h>>2]|0)|0;continue}}a=f[b>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(LB(a,aB()|0)|0){f[b>>2]=0;g=1;break}else {g=(f[b>>2]|0)==0;break}}else g=1;while(0);do if(h){a=f[h+12>>2]|0;if((a|0)==(f[h+16>>2]|0))a=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(g)break;else {i=39;break}else {f[c>>2]=0;i=37;break}}else i=37;while(0);if((i|0)==37?g:0)i=39;if((i|0)==39)f[d>>2]=f[d>>2]|2;return}function aG(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;m=u;l=u=u+31&-32;u=u+16|0;k=l+4|0;j=a+8|0;j=Uc[f[(f[j>>2]|0)+8>>2]&127](j)|0;a=b[j+8+3>>0]|0;if(a<<24>>24<0)i=f[j+4>>2]|0;else i=a&255;a=b[j+20+3>>0]|0;if(a<<24>>24<0)a=f[j+16>>2]|0;else a=a&255;do if((i|0)!=(0-a|0)){f[l>>2]=f[e>>2];f[k>>2]=f[l>>2];a=(kE(d,k,j,j+24|0,h,g,0)|0)-j|0;i=f[c>>2]|0;if((i|0)==12&(a|0)==0){f[c>>2]=0;break}if((i|0)<12&(a|0)==12)f[c>>2]=i+12;}else f[g>>2]=f[g>>2]|4;while(0);u=m;return}function bG(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,2)|0;c=f[e>>2]|0;if((a|0)<61&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function cG(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,1)|0;c=f[e>>2]|0;if((a|0)<7&(c&4|0)==0)f[b>>2]=a;else f[e>>2]=c|4;u=h;return}function dG(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,4)|0;if(!(f[e>>2]&4)){if((a|0)<69)a=a+2e3|0;else a=(a|0)<100?a+1900|0:a;f[b>>2]=a+-1900;}u=h;return}function eG(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=u;i=u=u+31&-32;u=u+16|0;a=i+4|0;f[i>>2]=f[d>>2];f[a>>2]=f[i>>2];a=gG(c,a,e,g,4)|0;if(!(f[e>>2]&4))f[b>>2]=a+-1900;u=h;return}function fG(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0;a=f[b>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(LB(a,aB()|0)|0){f[b>>2]=0;h=1;break}else {h=(f[b>>2]|0)==0;break}}else h=1;while(0);g=f[c>>2]|0;do if(g){a=f[g+12>>2]|0;if((a|0)==(f[g+16>>2]|0))a=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(h){i=g;j=16;break}else {a=6;j=38;break}else {f[c>>2]=0;j=14;break}}else j=14;while(0);if((j|0)==14)if(h){a=6;j=38;}else {i=0;j=16;}a:do if((j|0)==16){a=f[b>>2]|0;g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if((Wc[f[(f[e>>2]|0)+52>>2]&63](e,a,0)|0)<<24>>24==37){a=f[b>>2]|0;g=a+12|0;h=f[g>>2]|0;if((h|0)==(f[a+16>>2]|0))Uc[f[(f[a>>2]|0)+40>>2]&127](a)|0;else {f[g>>2]=h+4;bB(f[h>>2]|0)|0;}a=f[b>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(LB(a,aB()|0)|0){f[b>>2]=0;g=1;break}else {g=(f[b>>2]|0)==0;break}}else g=1;while(0);do if(i|0){a=f[i+12>>2]|0;if((a|0)==(f[i+16>>2]|0))a=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(g)break a;else {a=2;j=38;break a}else {f[c>>2]=0;break}}while(0);if(g){a=2;j=38;}}else {a=4;j=38;}}while(0);if((j|0)==38)f[d>>2]=f[d>>2]|a;return}function gG(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=f[a>>2]|0;do if(g){h=f[g+12>>2]|0;if((h|0)==(f[g+16>>2]|0))g=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else g=bB(f[h>>2]|0)|0;if(LB(g,aB()|0)|0){f[a>>2]=0;i=1;break}else {i=(f[a>>2]|0)==0;break}}else i=1;while(0);h=f[b>>2]|0;do if(h){g=f[h+12>>2]|0;if((g|0)==(f[h+16>>2]|0))g=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else g=bB(f[g>>2]|0)|0;if(!(LB(g,aB()|0)|0))if(i){p=17;break}else {p=16;break}else {f[b>>2]=0;p=14;break}}else p=14;while(0);if((p|0)==14)if(i)p=16;else {h=0;p=17;}a:do if((p|0)==16){f[c>>2]=f[c>>2]|6;g=0;}else if((p|0)==17){g=f[a>>2]|0;i=f[g+12>>2]|0;if((i|0)==(f[g+16>>2]|0))g=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else g=bB(f[i>>2]|0)|0;if(!(Wc[f[(f[d>>2]|0)+12>>2]&63](d,2048,g)|0)){f[c>>2]=f[c>>2]|4;g=0;break}g=(Wc[f[(f[d>>2]|0)+52>>2]&63](d,g,0)|0)<<24>>24;i=f[a>>2]|0;j=i+12|0;k=f[j>>2]|0;if((k|0)==(f[i+16>>2]|0)){Uc[f[(f[i>>2]|0)+40>>2]&127](i)|0;l=h;j=h;}else {f[j>>2]=k+4;bB(f[k>>2]|0)|0;l=h;j=h;}while(1){g=g+-48|0;o=e+-1|0;h=f[a>>2]|0;do if(h){i=f[h+12>>2]|0;if((i|0)==(f[h+16>>2]|0))h=Uc[f[(f[h>>2]|0)+36>>2]&127](h)|0;else h=bB(f[i>>2]|0)|0;if(LB(h,aB()|0)|0){f[a>>2]=0;k=1;break}else {k=(f[a>>2]|0)==0;break}}else k=1;while(0);do if(j){h=f[j+12>>2]|0;if((h|0)==(f[j+16>>2]|0))h=Uc[f[(f[j>>2]|0)+36>>2]&127](j)|0;else h=bB(f[h>>2]|0)|0;if(LB(h,aB()|0)|0){f[b>>2]=0;n=0;h=1;m=0;break}else {n=l;h=(l|0)==0;m=l;break}}else {n=l;h=1;m=0;}while(0);i=f[a>>2]|0;if(!((e|0)>1&(k^h)))break;h=f[i+12>>2]|0;if((h|0)==(f[i+16>>2]|0))h=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else h=bB(f[h>>2]|0)|0;if(!(Wc[f[(f[d>>2]|0)+12>>2]&63](d,2048,h)|0))break a;g=((Wc[f[(f[d>>2]|0)+52>>2]&63](d,h,0)|0)<<24>>24)+(g*10|0)|0;h=f[a>>2]|0;i=h+12|0;j=f[i>>2]|0;if((j|0)==(f[h+16>>2]|0)){Uc[f[(f[h>>2]|0)+40>>2]&127](h)|0;e=o;l=n;j=m;continue}else {f[i>>2]=j+4;bB(f[j>>2]|0)|0;e=o;l=n;j=m;continue}}do if(i){h=f[i+12>>2]|0;if((h|0)==(f[i+16>>2]|0))h=Uc[f[(f[i>>2]|0)+36>>2]&127](i)|0;else h=bB(f[h>>2]|0)|0;if(LB(h,aB()|0)|0){f[a>>2]=0;i=1;break}else {i=(f[a>>2]|0)==0;break}}else i=1;while(0);do if(n){h=f[n+12>>2]|0;if((h|0)==(f[n+16>>2]|0))h=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else h=bB(f[h>>2]|0)|0;if(!(LB(h,aB()|0)|0))if(i)break a;else break;else {f[b>>2]=0;p=60;break}}else p=60;while(0);if((p|0)==60?!i:0)break;f[c>>2]=f[c>>2]|2;}while(0);return g|0}function hG(a){a=a|0;mG(a+8|0);return}function iG(a){a=a|0;mG(a+8|0);xL(a);return}function jG(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0;j=u;e=u=u+31&-32;u=u+112|0;d=e+4|0;f[e>>2]=d+100;kG(a+8|0,d,e,g,h,i);i=f[e>>2]|0;h=d;d=f[c>>2]|0;while(1){if((h|0)==(i|0))break;e=b[h>>0]|0;if(!d)d=0;else {a=d+24|0;g=f[a>>2]|0;if((g|0)==(f[d+28>>2]|0)){c=f[(f[d>>2]|0)+52>>2]|0;e=LA(e)|0;e=Vc[c&31](d,e)|0;}else {f[a>>2]=g+1;b[g>>0]=e;e=LA(e)|0;}c=JB(e,KA()|0)|0;d=c?0:d;}h=h+1|0;}u=j;return d|0}function kG(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0;l=u;i=u=u+31&-32;u=u+16|0;b[i>>0]=37;j=i+1|0;b[j>>0]=g;k=i+2|0;b[k>>0]=h;b[i+3>>0]=0;if(h<<24>>24){b[j>>0]=h;b[k>>0]=g;}k=lG(c,f[d>>2]|0)|0;k=c+(Wb(c|0,k|0,i|0,e|0,f[a>>2]|0)|0)|0;f[d>>2]=k;u=l;return}function lG(a,b){a=a|0;b=b|0;return b-a|0}function mG(a){a=a|0;var b=0;b=f[a>>2]|0;if((b|0)!=(gD()|0))jA(f[a>>2]|0);return}function nG(a){a=a|0;mG(a+8|0);return}function oG(a){a=a|0;mG(a+8|0);xL(a);return}function pG(a,b,c,d,e,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0;i=u;d=u=u+31&-32;u=u+416|0;c=d+8|0;f[d>>2]=c+400;qG(a+8|0,c,d,e,g,h);h=f[d>>2]|0;g=c;c=f[b>>2]|0;while(1){if((g|0)==(h|0))break;d=f[g>>2]|0;if(!c)c=0;else {a=c+24|0;e=f[a>>2]|0;if((e|0)==(f[c+28>>2]|0)){b=f[(f[c>>2]|0)+52>>2]|0;d=bB(d)|0;d=Vc[b&31](c,d)|0;}else {f[a>>2]=e+4;f[e>>2]=d;d=bB(d)|0;}b=LB(d,aB()|0)|0;c=b?0:c;}g=g+4|0;}u=i;return c|0}function qG(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=u;j=u=u+31&-32;u=u+128|0;k=j+16|0;l=j+12|0;i=j;j=j+8|0;f[l>>2]=k+100;kG(a,k,l,d,e,g);d=i;f[d>>2]=0;f[d+4>>2]=0;f[j>>2]=k;d=rG(b,f[c>>2]|0)|0;a=aA(f[a>>2]|0)|0;d=iy(b,j,d,i)|0;if(a|0)aA(a)|0;if((d|0)==-1)sG();else {f[c>>2]=b+(d<<2);u=h;return}}function rG(a,b){a=a|0;b=b|0;return b-a>>2|0}function sG(a){Gb();}function tG(a){return}function uG(a){a=a|0;xL(a);return}function vG(a){return 127}function wG(a){return 127}function xG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function yG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function zG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function AG(a,c){a=a|0;c=c|0;var d=0;c=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b[a+11>>0]=1;EG(a,1,45)|0;b[d>>0]=0;GB(a+1|0,d);u=c;return}function BG(a){return 0}function CG(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function DG(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function EG(a,b,c){a=a|0;b=b|0;c=c|0;if(b|0)qN(a|0,(LA(c)|0)&255|0,b|0)|0;return a|0}function FG(a){return}function GG(a){a=a|0;xL(a);return}function HG(a){return 127}function IG(a){return 127}function JG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function KG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function LG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function MG(a,c){a=a|0;c=c|0;var d=0;c=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b[a+11>>0]=1;EG(a,1,45)|0;b[d>>0]=0;GB(a+1|0,d);u=c;return}function NG(a){return 0}function OG(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function PG(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function QG(a){return}function RG(a){a=a|0;xL(a);return}function SG(a){return 2147483647}function TG(a){return 2147483647}function UG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function VG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function WG(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function XG(a,c){a=a|0;c=c|0;var d=0;c=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b[a+8+3>>0]=1;NE(a,1,45)|0;f[d>>2]=0;RC(a+4|0,d);u=c;return}function YG(a){return 0}function ZG(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function _G(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function $G(a){return}function aH(a){a=a|0;xL(a);return}function bH(a){return 2147483647}function cH(a){return 2147483647}function dH(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function eH(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function fH(a,b){a=a|0;b=b|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b=0;while(1){if((b|0)==3)break;f[a+(b<<2)>>2]=0;b=b+1|0;}return}function gH(a,c){a=a|0;c=c|0;var d=0;c=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b[a+8+3>>0]=1;NE(a,1,45)|0;f[d>>2]=0;RC(a+4|0,d);u=c;return}function hH(a){return 0}function iH(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function jH(a,c){a=a|0;b[a>>0]=2;b[a+1>>0]=3;b[a+2>>0]=0;b[a+3>>0]=4;return}function kH(a){return}function lH(a){a=a|0;xL(a);return}function mH(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;x=u;o=u=u+31&-32;u=u+240|0;n=o+24|0;q=o;m=o+140|0;w=o+16|0;p=o+12|0;s=o+8|0;j=o+136|0;y=o+4|0;o=o+36|0;f[w>>2]=m;v=w+4|0;f[v>>2]=456;KB(s,g);a=dD(s,61044)|0;b[j>>0]=0;f[y>>2]=f[d>>2];l=f[g+4>>2]|0;f[n>>2]=f[y>>2];if(pH(c,n,e,s,l,h,j,a,w,p,m+100|0)|0){Xc[f[(f[a>>2]|0)+32>>2]&7](a,56536,56546,n)|0;l=f[p>>2]|0;e=f[w>>2]|0;a=l-e|0;if((a|0)>98){a=Lx(a+2|0)|0;if(!a)zL();else {k=a;r=a;}}else {k=o;r=0;}if(!(b[j>>0]|0))a=k;else {b[k>>0]=45;a=k+1|0;}k=n+10|0;m=n;j=e;g=a;a=l;while(1){if(j>>>0>=a>>>0)break;e=b[j>>0]|0;a=n;while(1){if((a|0)==(k|0)){a=k;break}if((b[a>>0]|0)==e<<24>>24)break;a=a+1|0;}b[g>>0]=b[56536+(a-m)>>0]|0;j=j+1|0;g=g+1|0;a=f[p>>2]|0;}b[g>>0]=0;f[q>>2]=i;if((Hz(o,56547,q)|0)!=1)sG();if(r|0)Mx(r);}a=f[c>>2]|0;do if(a){e=f[a+12>>2]|0;if((e|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[e>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;g=1;break}else {g=(f[c>>2]|0)==0;break}}else g=1;while(0);a=f[d>>2]|0;do if(a){e=f[a+12>>2]|0;if((e|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[e>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(g)break;else {t=34;break}else {f[d>>2]=0;t=32;break}}else t=32;while(0);if((t|0)==32?g:0)t=34;if((t|0)==34)f[h>>2]=f[h>>2]|2;e=f[c>>2]|0;eD(s);a=f[w>>2]|0;f[w>>2]=0;if(a|0)dd[f[v>>2]&511](a);u=x;return e|0}function nH(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=u;n=u=u+31&-32;u=u+144|0;j=n+24|0;a=n+32|0;s=n+16|0;m=n+8|0;p=n;k=n+28|0;n=n+4|0;f[s>>2]=a;r=s+4|0;f[r>>2]=456;KB(p,g);l=dD(p,61044)|0;b[k>>0]=0;o=f[d>>2]|0;f[n>>2]=o;g=f[g+4>>2]|0;f[j>>2]=f[n>>2];n=o;if(pH(c,j,e,p,g,h,k,l,s,m,a+100|0)|0){a=i+11|0;if((b[a>>0]|0)<0){e=f[i>>2]|0;b[j>>0]=0;GB(e,j);f[i+4>>2]=0;}else {b[j>>0]=0;GB(i,j);b[a>>0]=0;}if(b[k>>0]|0)SL(i,Vc[f[(f[l>>2]|0)+28>>2]&31](l,45)|0);k=Vc[f[(f[l>>2]|0)+28>>2]&31](l,48)|0;g=f[m>>2]|0;j=g+-1|0;a=f[s>>2]|0;while(1){if(a>>>0>=j>>>0)break;if((b[a>>0]|0)!=k<<24>>24)break;a=a+1|0;}qH(i,a,g)|0;}a=f[c>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=LA(b[g>>0]|0)|0;if(JB(a,KA()|0)|0){f[c>>2]=0;g=1;break}else {g=(f[c>>2]|0)==0;break}}else g=1;while(0);do if(o){a=f[n+12>>2]|0;if((a|0)==(f[n+16>>2]|0))a=Uc[f[(f[o>>2]|0)+36>>2]&127](n)|0;else a=LA(b[a>>0]|0)|0;if(!(JB(a,KA()|0)|0))if(g)break;else {q=27;break}else {f[d>>2]=0;q=25;break}}else q=25;while(0);if((q|0)==25?g:0)q=27;if((q|0)==27)f[h>>2]=f[h>>2]|2;g=f[c>>2]|0;eD(p);a=f[s>>2]|0;f[s>>2]=0;if(a|0)dd[f[r>>2]&511](a);u=t;return g|0}function oH(a){return}function pH(a,c,e,g,i,j,k,l,m,n,o){a=a|0;c=c|0;e=e|0;g=g|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;_=u;S=u=u+31&-32;u=u+512|0;J=S+88|0;P=S+96|0;Z=S+80|0;R=S+72|0;K=S+68|0;L=S+500|0;M=S+497|0;N=S+496|0;T=S+56|0;U=S+44|0;V=S+32|0;W=S+20|0;X=S+8|0;O=S+4|0;f[J>>2]=o;f[Z>>2]=P;Y=Z+4|0;f[Y>>2]=456;f[R>>2]=P;f[K>>2]=P+400;f[T>>2]=0;f[T+4>>2]=0;f[T+8>>2]=0;o=0;while(1){if((o|0)==3)break;f[T+(o<<2)>>2]=0;o=o+1|0;}f[U>>2]=0;f[U+4>>2]=0;f[U+8>>2]=0;o=0;while(1){if((o|0)==3)break;f[U+(o<<2)>>2]=0;o=o+1|0;}f[V>>2]=0;f[V+4>>2]=0;f[V+8>>2]=0;o=0;while(1){if((o|0)==3)break;f[V+(o<<2)>>2]=0;o=o+1|0;}f[W>>2]=0;f[W+4>>2]=0;f[W+8>>2]=0;o=0;while(1){if((o|0)==3)break;f[W+(o<<2)>>2]=0;o=o+1|0;}f[X>>2]=0;f[X+4>>2]=0;f[X+8>>2]=0;o=0;while(1){if((o|0)==3)break;f[X+(o<<2)>>2]=0;o=o+1|0;}sH(e,g,L,M,N,T,U,V,W,O);f[n>>2]=f[m>>2];E=l+8|0;F=V+11|0;G=V+4|0;H=W+11|0;I=W+4|0;w=(i&512|0)!=0;x=U+11|0;y=U+4|0;z=X+11|0;A=X+4|0;B=L+3|0;C=T+11|0;D=T+4|0;P=0;v=0;a:while(1){l=(P|0)!=0;if(v>>>0>=4){Q=234;break}o=f[a>>2]|0;do if(o){e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if(JB(o,KA()|0)|0){f[a>>2]=0;g=1;break}else {g=(f[a>>2]|0)==0;break}}else g=1;while(0);e=f[c>>2]|0;do if(e){o=f[e+12>>2]|0;if((o|0)==(f[e+16>>2]|0))o=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else o=LA(b[o>>0]|0)|0;if(!(JB(o,KA()|0)|0))if(g){t=e;break}else {Q=234;break a}else {f[c>>2]=0;Q=31;break}}else Q=31;while(0);if((Q|0)==31){Q=0;if(g){Q=234;break}else t=0;}o=(v|0)!=3;b:do switch(b[L+v>>0]|0){case 1:{if(o){o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if((o&255)<<24>>24<=-1){Q=44;break a}if(!(d[(f[E>>2]|0)+(o<<24>>24<<1)>>1]&8192)){Q=44;break a}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;else {f[e>>2]=g+1;o=LA(b[g>>0]|0)|0;}SL(X,o&255);o=t;l=t;Q=46;}else o=P;break}case 0:{if(o){o=t;l=t;Q=46;}else o=P;break}case 3:{o=b[F>>0]|0;o=o<<24>>24<0?f[G>>2]|0:o&255;l=b[H>>0]|0;l=l<<24>>24<0?f[I>>2]|0:l&255;if((o|0)==(0-l|0))o=P;else {i=(o|0)==0;o=f[a>>2]|0;e=f[o+12>>2]|0;g=(e|0)==(f[o+16>>2]|0);if(i|(l|0)==0){if(g)o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;o=o&255;if(i){if(o<<24>>24!=(b[((b[H>>0]|0)<0?f[W>>2]|0:W)>>0]|0)){o=P;break b}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0))Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;else {f[e>>2]=g+1;LA(b[g>>0]|0)|0;}b[k>>0]=1;o=b[H>>0]|0;o=(o<<24>>24<0?f[I>>2]|0:o&255)>>>0>1?W:P;break b}if(o<<24>>24!=(b[((b[F>>0]|0)<0?f[V>>2]|0:V)>>0]|0)){b[k>>0]=1;o=P;break b}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0))Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;else {f[e>>2]=g+1;LA(b[g>>0]|0)|0;}o=b[F>>0]|0;o=(o<<24>>24<0?f[G>>2]|0:o&255)>>>0>1?V:P;break b}if(g)o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;e=f[a>>2]|0;g=e+12|0;l=f[g>>2]|0;i=(l|0)==(f[e+16>>2]|0);if((o&255)<<24>>24==(b[((b[F>>0]|0)<0?f[V>>2]|0:V)>>0]|0)){if(i)Uc[f[(f[e>>2]|0)+40>>2]&127](e)|0;else {f[g>>2]=l+1;LA(b[l>>0]|0)|0;}o=b[F>>0]|0;o=(o<<24>>24<0?f[G>>2]|0:o&255)>>>0>1?V:P;break b}if(i)o=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else o=LA(b[l>>0]|0)|0;if((o&255)<<24>>24!=(b[((b[H>>0]|0)<0?f[W>>2]|0:W)>>0]|0)){Q=103;break a}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0))Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;else {f[e>>2]=g+1;LA(b[g>>0]|0)|0;}b[k>>0]=1;o=b[H>>0]|0;o=(o<<24>>24<0?f[I>>2]|0:o&255)>>>0>1?W:P;}break}case 2:{if(!(v>>>0<2|l)?!(w|(v|0)==2&(b[B>>0]|0)!=0):0){o=0;break b}e=b[x>>0]|0;o=e<<24>>24<0;r=f[U>>2]|0;g=o?r:U;q=g;c:do if((v|0)!=0?(h[L+(v+-1)>>0]|0)<2:0){o=g+(o?f[y>>2]|0:e&255)|0;p=q;while(1){l=p;if((l|0)==(o|0))break;i=b[l>>0]|0;if(i<<24>>24<=-1)break;if(!(d[(f[E>>2]|0)+(i<<24>>24<<1)>>1]&8192))break;p=l+1|0;}i=p-q|0;l=b[z>>0]|0;o=l<<24>>24<0;l=o?f[A>>2]|0:l&255;if(i>>>0<=l>>>0){l=(o?f[X>>2]|0:X)+l|0;o=l+(0-i)|0;while(1){if((o|0)==(l|0)){s=t;g=p;o=r;l=t;break c}if((b[o>>0]|0)!=(b[g>>0]|0)){s=t;g=q;o=r;l=t;break c}g=g+1|0;o=o+1|0;}}else {s=t;g=q;o=r;l=t;}}else {s=t;g=q;o=r;l=t;}while(0);d:while(1){p=e<<24>>24<0;o=(p?o:U)+(p?f[y>>2]|0:e&255)|0;p=g;if((p|0)==(o|0))break;o=f[a>>2]|0;do if(o){e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if(JB(o,KA()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);do if(l){o=f[l+12>>2]|0;if((o|0)==(f[l+16>>2]|0))o=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else o=LA(b[o>>0]|0)|0;if(!(JB(o,KA()|0)|0))if(e^(s|0)==0){o=s;i=s;break}else {o=p;break d}else {f[c>>2]=0;o=0;Q=132;break}}else {o=s;Q=132;}while(0);if((Q|0)==132){Q=0;if(e){o=p;break}else i=0;}e=f[a>>2]|0;g=f[e+12>>2]|0;if((g|0)==(f[e+16>>2]|0))e=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else e=LA(b[g>>0]|0)|0;if((e&255)<<24>>24!=(b[p>>0]|0)){o=p;break}e=f[a>>2]|0;g=e+12|0;l=f[g>>2]|0;if((l|0)==(f[e+16>>2]|0))Uc[f[(f[e>>2]|0)+40>>2]&127](e)|0;else {f[g>>2]=l+1;LA(b[l>>0]|0)|0;}s=o;g=p+1|0;e=b[x>>0]|0;o=f[U>>2]|0;l=i;}if(w?(t=b[x>>0]|0,s=t<<24>>24<0,(o|0)!=((s?f[U>>2]|0:U)+(s?f[y>>2]|0:t&255)|0)):0){Q=144;break a}else o=P;break}case 4:{q=0;o=t;l=t;e:while(1){e=f[a>>2]|0;do if(e){g=f[e+12>>2]|0;if((g|0)==(f[e+16>>2]|0))e=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else e=LA(b[g>>0]|0)|0;if(JB(e,KA()|0)|0){f[a>>2]=0;g=1;break}else {g=(f[a>>2]|0)==0;break}}else g=1;while(0);do if(l){e=f[l+12>>2]|0;if((e|0)==(f[l+16>>2]|0))e=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(g^(o|0)==0){i=o;p=o;break}else {l=o;break e}else {f[c>>2]=0;o=0;Q=158;break}}else Q=158;while(0);if((Q|0)==158){Q=0;if(g){l=o;break}else {i=o;p=0;}}o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;e=o&255;if(e<<24>>24>-1?(d[(f[E>>2]|0)+(o<<24>>24<<1)>>1]&2048)!=0:0){o=f[n>>2]|0;if((o|0)==(f[J>>2]|0)){tH(m,n,J);o=f[n>>2]|0;}f[n>>2]=o+1;b[o>>0]=e;o=q+1|0;}else {t=b[C>>0]|0;if(!(e<<24>>24==(b[N>>0]|0)&(q|0?((t<<24>>24<0?f[D>>2]|0:t&255)|0)!=0:0))){l=i;break}o=f[R>>2]|0;if((o|0)==(f[K>>2]|0)){uH(Z,R,K);o=f[R>>2]|0;}f[R>>2]=o+4;f[o>>2]=q;o=0;}e=f[a>>2]|0;g=e+12|0;l=f[g>>2]|0;if((l|0)==(f[e+16>>2]|0)){Uc[f[(f[e>>2]|0)+40>>2]&127](e)|0;q=o;o=i;l=p;continue}else {f[g>>2]=l+1;LA(b[l>>0]|0)|0;q=o;o=i;l=p;continue}}o=f[R>>2]|0;if(q|0?(f[Z>>2]|0)!=(o|0):0){if((o|0)==(f[K>>2]|0)){uH(Z,R,K);o=f[R>>2]|0;}f[R>>2]=o+4;f[o>>2]=q;}f:do if((f[O>>2]|0)>0){o=f[a>>2]|0;do if(o){e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if(JB(o,KA()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);do if(l){o=f[l+12>>2]|0;if((o|0)==(f[l+16>>2]|0))o=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else o=LA(b[o>>0]|0)|0;if(!(JB(o,KA()|0)|0))if(e)break;else {Q=232;break a}else {f[c>>2]=0;Q=193;break}}else Q=193;while(0);if((Q|0)==193){Q=0;if(e){Q=232;break a}else l=0;}o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if((o&255)<<24>>24!=(b[M>>0]|0)){Q=232;break a}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0)){Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;o=l;}else {f[e>>2]=g+1;LA(b[g>>0]|0)|0;o=l;}while(1){if((f[O>>2]|0)<=0)break f;e=f[a>>2]|0;do if(e){g=f[e+12>>2]|0;if((g|0)==(f[e+16>>2]|0))e=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else e=LA(b[g>>0]|0)|0;if(JB(e,KA()|0)|0){f[a>>2]=0;g=1;break}else {g=(f[a>>2]|0)==0;break}}else g=1;while(0);do if(l){e=f[l+12>>2]|0;if((e|0)==(f[l+16>>2]|0))e=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(g^(o|0)==0){i=o;l=o;break}else {Q=232;break a}else {f[c>>2]=0;o=0;Q=216;break}}else Q=216;while(0);if((Q|0)==216){Q=0;if(g){Q=232;break a}else {i=o;l=0;}}o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if((o&255)<<24>>24<=-1){Q=232;break a}if(!(d[(f[E>>2]|0)+(o<<24>>24<<1)>>1]&2048)){Q=232;break a}if((f[n>>2]|0)==(f[J>>2]|0))tH(m,n,J);o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;e=f[n>>2]|0;f[n>>2]=e+1;b[e>>0]=o;f[O>>2]=(f[O>>2]|0)+-1;o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0)){Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;o=i;continue}else {f[e>>2]=g+1;LA(b[g>>0]|0)|0;o=i;continue}}}while(0);if((f[n>>2]|0)==(f[m>>2]|0)){Q=232;break a}else o=P;break}default:o=P;}while(0);g:do if((Q|0)==46)while(1){Q=0;e=f[a>>2]|0;do if(e){g=f[e+12>>2]|0;if((g|0)==(f[e+16>>2]|0))e=Uc[f[(f[e>>2]|0)+36>>2]&127](e)|0;else e=LA(b[g>>0]|0)|0;if(JB(e,KA()|0)|0){f[a>>2]=0;g=1;break}else {g=(f[a>>2]|0)==0;break}}else g=1;while(0);do if(l){e=f[l+12>>2]|0;if((e|0)==(f[l+16>>2]|0))e=Uc[f[(f[l>>2]|0)+36>>2]&127](l)|0;else e=LA(b[e>>0]|0)|0;if(!(JB(e,KA()|0)|0))if(g^(o|0)==0){i=o;l=o;break}else {o=P;break g}else {f[c>>2]=0;o=0;Q=59;break}}else Q=59;while(0);if((Q|0)==59){Q=0;if(g){o=P;break g}else {i=o;l=0;}}o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if((o&255)<<24>>24<=-1){o=P;break g}if(!(d[(f[E>>2]|0)+(o<<24>>24<<1)>>1]&8192)){o=P;break g}o=f[a>>2]|0;e=o+12|0;g=f[e>>2]|0;if((g|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+40>>2]&127](o)|0;else {f[e>>2]=g+1;o=LA(b[g>>0]|0)|0;}SL(X,o&255);o=i;Q=46;}while(0);P=o;v=v+1|0;}h:do if((Q|0)==44){f[j>>2]=f[j>>2]|4;e=0;}else if((Q|0)==103){f[j>>2]=f[j>>2]|4;e=0;}else if((Q|0)==144){f[j>>2]=f[j>>2]|4;e=0;}else if((Q|0)==232){f[j>>2]=f[j>>2]|4;e=0;}else if((Q|0)==234){i:do if(l){i=P+11|0;p=P+4|0;l=1;j:while(1){o=b[i>>0]|0;if(o<<24>>24<0)o=f[p>>2]|0;else o=o&255;if(l>>>0>=o>>>0)break i;o=f[a>>2]|0;do if(o){e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if(JB(o,KA()|0)|0){f[a>>2]=0;g=1;break}else {g=(f[a>>2]|0)==0;break}}else g=1;while(0);o=f[c>>2]|0;do if(o){e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if(!(JB(o,KA()|0)|0))if(g)break;else break j;else {f[c>>2]=0;Q=253;break}}else Q=253;while(0);if((Q|0)==253?(Q=0,g):0)break;o=f[a>>2]|0;e=f[o+12>>2]|0;if((e|0)==(f[o+16>>2]|0))o=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else o=LA(b[e>>0]|0)|0;if((b[i>>0]|0)<0)e=f[P>>2]|0;else e=P;if((o&255)<<24>>24!=(b[e+l>>0]|0))break;o=l+1|0;e=f[a>>2]|0;g=e+12|0;l=f[g>>2]|0;if((l|0)==(f[e+16>>2]|0)){Uc[f[(f[e>>2]|0)+40>>2]&127](e)|0;l=o;continue}else {f[g>>2]=l+1;LA(b[l>>0]|0)|0;l=o;continue}}f[j>>2]=f[j>>2]|4;e=0;break h}while(0);e=f[Z>>2]|0;o=f[R>>2]|0;if((e|0)!=(o|0)){f[S>>2]=0;sD(T,e,o,S);if(!(f[S>>2]|0)){e=1;break}else {f[j>>2]=f[j>>2]|4;e=0;break}}else e=1;}while(0);HL(X);HL(W);HL(V);HL(U);HL(T);o=f[Z>>2]|0;f[Z>>2]=0;if(o|0)dd[f[Y>>2]&511](o);u=_;return e|0}function qH(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;p=u;i=u=u+31&-32;u=u+16|0;k=c;o=i+12|0;n=a+11|0;g=b[n>>0]|0;e=g<<24>>24<0;if(e){l=f[a+4>>2]|0;j=(f[a+8>>2]&2147483647)+-1|0;}else {l=g&255;j=10;}m=d-k|0;do if(m|0){if(e){g=f[a>>2]|0;h=g;e=f[a+4>>2]|0;}else {h=a;e=g&255;g=a;}if(rH(c,g,h+e|0)|0){f[i>>2]=0;f[i+4>>2]=0;f[i+8>>2]=0;if(m>>>0>4294967279)EL();if(m>>>0<11){b[i+11>>0]=m;g=i;}else {n=m+16&-16;g=vL(n)|0;f[i>>2]=g;f[i+8>>2]=n|-2147483648;f[i+4>>2]=m;}e=g;while(1){if((c|0)==(d|0))break;GB(e,c);c=c+1|0;e=e+1|0;}b[o>>0]=0;GB(g+m|0,o);o=b[i+11>>0]|0;d=o<<24>>24<0;RL(a,d?f[i>>2]|0:i,d?f[i+4>>2]|0:o&255)|0;HL(i);break}i=l+m|0;if((j-l|0)>>>0<m>>>0)QL(a,j,i-j|0,l,l,0,0);if((b[n>>0]|0)<0)h=f[a>>2]|0;else h=a;g=d+(l-k)|0;e=h+l|0;while(1){if((c|0)==(d|0))break;GB(e,c);e=e+1|0;c=c+1|0;}b[o>>0]=0;GB(h+g|0,o);if((b[n>>0]|0)<0){f[a+4>>2]=i;break}else {b[n>>0]=i;break}}while(0);u=p;return a|0}function rH(a,b,c){a=a|0;b=b|0;c=c|0;return b>>>0<=a>>>0&a>>>0<c>>>0|0}function sH(a,c,d,e,g,h,i,j,k,l){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;o=u;n=u=u+31&-32;u=u+16|0;m=n+12|0;if(a){c=dD(c,62764)|0;ed[f[(f[c>>2]|0)+44>>2]&63](m,c);a=f[m>>2]|0;b[d>>0]=a;b[d+1>>0]=a>>8;b[d+2>>0]=a>>16;b[d+3>>0]=a>>24;ed[f[(f[c>>2]|0)+32>>2]&63](n,c);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[m>>0]=0;GB(a,m);f[k+4>>2]=0;a=k;}else {b[m>>0]=0;GB(k,m);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+28>>2]&63](n,c);a=j+11|0;if((b[a>>0]|0)<0){a=f[j>>2]|0;b[m>>0]=0;GB(a,m);f[j+4>>2]=0;a=j;}else {b[m>>0]=0;GB(j,m);b[a>>0]=0;a=j;}ML(j,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);a=Uc[f[(f[c>>2]|0)+12>>2]&127](c)|0;b[e>>0]=a;a=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;b[g>>0]=a;ed[f[(f[c>>2]|0)+20>>2]&63](n,c);a=h+11|0;if((b[a>>0]|0)<0){a=f[h>>2]|0;b[m>>0]=0;GB(a,m);f[h+4>>2]=0;a=h;}else {b[m>>0]=0;GB(h,m);b[a>>0]=0;a=h;}ML(h,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+24>>2]&63](n,c);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[m>>0]=0;GB(a,m);f[i+4>>2]=0;a=i;}else {b[m>>0]=0;GB(i,m);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);a=Uc[f[(f[c>>2]|0)+36>>2]&127](c)|0;}else {c=dD(c,62756)|0;ed[f[(f[c>>2]|0)+44>>2]&63](m,c);a=f[m>>2]|0;b[d>>0]=a;b[d+1>>0]=a>>8;b[d+2>>0]=a>>16;b[d+3>>0]=a>>24;ed[f[(f[c>>2]|0)+32>>2]&63](n,c);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[m>>0]=0;GB(a,m);f[k+4>>2]=0;a=k;}else {b[m>>0]=0;GB(k,m);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+28>>2]&63](n,c);a=j+11|0;if((b[a>>0]|0)<0){a=f[j>>2]|0;b[m>>0]=0;GB(a,m);f[j+4>>2]=0;a=j;}else {b[m>>0]=0;GB(j,m);b[a>>0]=0;a=j;}ML(j,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);a=Uc[f[(f[c>>2]|0)+12>>2]&127](c)|0;b[e>>0]=a;a=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;b[g>>0]=a;ed[f[(f[c>>2]|0)+20>>2]&63](n,c);a=h+11|0;if((b[a>>0]|0)<0){a=f[h>>2]|0;b[m>>0]=0;GB(a,m);f[h+4>>2]=0;a=h;}else {b[m>>0]=0;GB(h,m);b[a>>0]=0;a=h;}ML(h,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+24>>2]&63](n,c);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[m>>0]=0;GB(a,m);f[i+4>>2]=0;a=i;}else {b[m>>0]=0;GB(i,m);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);a=Uc[f[(f[c>>2]|0)+36>>2]&127](c)|0;}f[l>>2]=a;u=o;return}function tH(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,g=0,h=0,i=0;i=a+4|0;e=(f[i>>2]|0)!=456;d=f[a>>2]|0;g=(f[c>>2]|0)-d|0;g=g>>>0<2147483647?g<<1:-1;g=(g|0)==0?1:g;h=(f[b>>2]|0)-d|0;d=Nx(e?d:0,g)|0;if(!d)zL();if(!e){e=f[a>>2]|0;f[a>>2]=d;if(e){dd[f[i>>2]&511](e);d=f[a>>2]|0;}}else f[a>>2]=d;f[i>>2]=457;f[b>>2]=d+h;f[c>>2]=(f[a>>2]|0)+g;return}function uH(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,g=0,h=0,i=0;i=a+4|0;e=(f[i>>2]|0)!=456;d=f[a>>2]|0;g=(f[c>>2]|0)-d|0;g=g>>>0<2147483647?g<<1:-1;g=(g|0)==0?4:g;h=(f[b>>2]|0)-d>>2;d=Nx(e?d:0,g)|0;if(!d)zL();if(!e){e=f[a>>2]|0;f[a>>2]=d;if(e){dd[f[i>>2]&511](e);d=f[a>>2]|0;}}else f[a>>2]=d;f[i>>2]=457;f[b>>2]=d+(h<<2);f[c>>2]=(f[a>>2]|0)+(g>>>2<<2);return}function vH(a){return}function wH(a){a=a|0;xL(a);return}function xH(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;x=u;o=u=u+31&-32;u=u+576|0;n=o+424|0;q=o;m=o+24|0;w=o+16|0;p=o+12|0;s=o+8|0;j=o+564|0;y=o+4|0;o=o+464|0;f[w>>2]=m;v=w+4|0;f[v>>2]=456;KB(s,g);a=dD(s,61076)|0;b[j>>0]=0;f[y>>2]=f[d>>2];l=f[g+4>>2]|0;f[n>>2]=f[y>>2];if(zH(c,n,e,s,l,h,j,a,w,p,m+400|0)|0){Xc[f[(f[a>>2]|0)+48>>2]&7](a,56646,56656,n)|0;l=f[p>>2]|0;e=f[w>>2]|0;a=l-e|0;if((a|0)>392){a=Lx((a>>>2)+2|0)|0;if(!a)zL();else {k=a;r=a;}}else {k=o;r=0;}if(!(b[j>>0]|0))a=k;else {b[k>>0]=45;a=k+1|0;}k=n+40|0;m=n;j=e;g=a;a=l;while(1){if(j>>>0>=a>>>0)break;e=f[j>>2]|0;a=n;while(1){if((a|0)==(k|0)){a=k;break}if((f[a>>2]|0)==(e|0))break;a=a+4|0;}b[g>>0]=b[56646+(a-m>>2)>>0]|0;j=j+4|0;g=g+1|0;a=f[p>>2]|0;}b[g>>0]=0;f[q>>2]=i;if((Hz(o,56547,q)|0)!=1)sG();if(r|0)Mx(r);}a=f[c>>2]|0;do if(a){e=f[a+12>>2]|0;if((e|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[e>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;g=1;break}else {g=(f[c>>2]|0)==0;break}}else g=1;while(0);a=f[d>>2]|0;do if(a){e=f[a+12>>2]|0;if((e|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[e>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(g)break;else {t=34;break}else {f[d>>2]=0;t=32;break}}else t=32;while(0);if((t|0)==32?g:0)t=34;if((t|0)==34)f[h>>2]=f[h>>2]|2;e=f[c>>2]|0;eD(s);a=f[w>>2]|0;f[w>>2]=0;if(a|0)dd[f[v>>2]&511](a);u=x;return e|0}function yH(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=u;n=u=u+31&-32;u=u+432|0;j=n+424|0;a=n+24|0;s=n+16|0;m=n+8|0;p=n;k=n+428|0;n=n+4|0;f[s>>2]=a;r=s+4|0;f[r>>2]=456;KB(p,g);l=dD(p,61076)|0;b[k>>0]=0;o=f[d>>2]|0;f[n>>2]=o;g=f[g+4>>2]|0;f[j>>2]=f[n>>2];n=o;if(zH(c,j,e,p,g,h,k,l,s,m,a+400|0)|0){a=i+8+3|0;if((b[a>>0]|0)<0){e=f[i>>2]|0;f[j>>2]=0;RC(e,j);f[i+4>>2]=0;}else {f[j>>2]=0;RC(i,j);b[a>>0]=0;}if(b[k>>0]|0)aM(i,Vc[f[(f[l>>2]|0)+44>>2]&31](l,45)|0);k=Vc[f[(f[l>>2]|0)+44>>2]&31](l,48)|0;g=f[m>>2]|0;j=g+-4|0;a=f[s>>2]|0;while(1){if(a>>>0>=j>>>0)break;if((f[a>>2]|0)!=(k|0))break;a=a+4|0;}AH(i,a,g)|0;}a=f[c>>2]|0;do if(a){g=f[a+12>>2]|0;if((g|0)==(f[a+16>>2]|0))a=Uc[f[(f[a>>2]|0)+36>>2]&127](a)|0;else a=bB(f[g>>2]|0)|0;if(LB(a,aB()|0)|0){f[c>>2]=0;g=1;break}else {g=(f[c>>2]|0)==0;break}}else g=1;while(0);do if(o){a=f[n+12>>2]|0;if((a|0)==(f[n+16>>2]|0))a=Uc[f[(f[o>>2]|0)+36>>2]&127](n)|0;else a=bB(f[a>>2]|0)|0;if(!(LB(a,aB()|0)|0))if(g)break;else {q=27;break}else {f[d>>2]=0;q=25;break}}else q=25;while(0);if((q|0)==25?g:0)q=27;if((q|0)==27)f[h>>2]=f[h>>2]|2;g=f[c>>2]|0;eD(p);a=f[s>>2]|0;f[s>>2]=0;if(a|0)dd[f[r>>2]&511](a);u=t;return g|0}function zH(a,c,d,e,g,i,j,k,l,m,n){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;Y=u;Q=u=u+31&-32;u=u+512|0;H=Q+96|0;N=Q+104|0;X=Q+88|0;P=Q+80|0;I=Q+76|0;J=Q+504|0;K=Q+72|0;L=Q+68|0;R=Q+56|0;S=Q+44|0;T=Q+32|0;U=Q+20|0;V=Q+8|0;M=Q+4|0;f[H>>2]=n;f[X>>2]=N;W=X+4|0;f[W>>2]=456;f[P>>2]=N;f[I>>2]=N+400;f[R>>2]=0;f[R+4>>2]=0;f[R+8>>2]=0;n=0;while(1){if((n|0)==3)break;f[R+(n<<2)>>2]=0;n=n+1|0;}f[S>>2]=0;f[S+4>>2]=0;f[S+8>>2]=0;n=0;while(1){if((n|0)==3)break;f[S+(n<<2)>>2]=0;n=n+1|0;}f[T>>2]=0;f[T+4>>2]=0;f[T+8>>2]=0;n=0;while(1){if((n|0)==3)break;f[T+(n<<2)>>2]=0;n=n+1|0;}f[U>>2]=0;f[U+4>>2]=0;f[U+8>>2]=0;n=0;while(1){if((n|0)==3)break;f[U+(n<<2)>>2]=0;n=n+1|0;}f[V>>2]=0;f[V+4>>2]=0;f[V+8>>2]=0;n=0;while(1){if((n|0)==3)break;f[V+(n<<2)>>2]=0;n=n+1|0;}CH(d,e,J,K,L,R,S,T,U,M);f[m>>2]=f[l>>2];D=T+8+3|0;E=T+4|0;F=U+8+3|0;G=U+4|0;v=(g&512|0)!=0;w=S+8+3|0;x=S+4|0;y=V+8+3|0;z=V+4|0;A=J+3|0;B=R+11|0;C=R+4|0;N=0;t=0;a:while(1){g=(N|0)!=0;if(t>>>0>=4){O=229;break}n=f[a>>2]|0;do if(n){d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(LB(n,aB()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);d=f[c>>2]|0;do if(d){n=f[d+12>>2]|0;if((n|0)==(f[d+16>>2]|0))n=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else n=bB(f[n>>2]|0)|0;if(!(LB(n,aB()|0)|0))if(e){s=d;break}else {O=229;break a}else {f[c>>2]=0;O=31;break}}else O=31;while(0);if((O|0)==31){O=0;if(e){O=229;break}else s=0;}n=(t|0)!=3;b:do switch(b[J+t>>0]|0){case 1:{if(n){n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(!(Wc[f[(f[k>>2]|0)+12>>2]&63](k,8192,n)|0)){O=43;break a}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;else {f[d>>2]=e+4;n=bB(f[e>>2]|0)|0;}aM(V,n);n=s;g=s;O=45;}else n=N;break}case 0:{if(n){n=s;g=s;O=45;}else n=N;break}case 3:{n=b[D>>0]|0;n=n<<24>>24<0?f[E>>2]|0:n&255;g=b[F>>0]|0;g=g<<24>>24<0?f[G>>2]|0:g&255;if((n|0)==(0-g|0))n=N;else {o=(n|0)==0;n=f[a>>2]|0;d=f[n+12>>2]|0;e=(d|0)==(f[n+16>>2]|0);if(o|(g|0)==0){if(e)n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(o){if((n|0)!=(f[((b[F>>0]|0)<0?f[U>>2]|0:U)>>2]|0)){n=N;break b}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0))Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;else {f[d>>2]=e+4;bB(f[e>>2]|0)|0;}b[j>>0]=1;n=b[F>>0]|0;n=(n<<24>>24<0?f[G>>2]|0:n&255)>>>0>1?U:N;break b}if((n|0)!=(f[((b[D>>0]|0)<0?f[T>>2]|0:T)>>2]|0)){b[j>>0]=1;n=N;break b}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0))Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;else {f[d>>2]=e+4;bB(f[e>>2]|0)|0;}n=b[D>>0]|0;n=(n<<24>>24<0?f[E>>2]|0:n&255)>>>0>1?T:N;break b}if(e)n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;d=f[a>>2]|0;e=d+12|0;g=f[e>>2]|0;o=(g|0)==(f[d+16>>2]|0);if((n|0)==(f[((b[D>>0]|0)<0?f[T>>2]|0:T)>>2]|0)){if(o)Uc[f[(f[d>>2]|0)+40>>2]&127](d)|0;else {f[e>>2]=g+4;bB(f[g>>2]|0)|0;}n=b[D>>0]|0;n=(n<<24>>24<0?f[E>>2]|0:n&255)>>>0>1?T:N;break b}if(o)n=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else n=bB(f[g>>2]|0)|0;if((n|0)!=(f[((b[F>>0]|0)<0?f[U>>2]|0:U)>>2]|0)){O=101;break a}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0))Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;else {f[d>>2]=e+4;bB(f[e>>2]|0)|0;}b[j>>0]=1;n=b[F>>0]|0;n=(n<<24>>24<0?f[G>>2]|0:n&255)>>>0>1?U:N;}break}case 2:{if(!(t>>>0<2|g)?!(v|(t|0)==2&(b[A>>0]|0)!=0):0){n=0;break b}e=b[w>>0]|0;g=f[S>>2]|0;n=e<<24>>24<0?g:S;c:do if((t|0)!=0?(h[J+(t+-1)>>0]|0)<2:0){while(1){r=e<<24>>24<0;d=n;if((d|0)==((r?g:S)+((r?f[x>>2]|0:e&255)<<2)|0))break;if(!(Wc[f[(f[k>>2]|0)+12>>2]&63](k,8192,f[d>>2]|0)|0)){O=108;break}n=d+4|0;e=b[w>>0]|0;g=f[S>>2]|0;}if((O|0)==108){O=0;e=b[w>>0]|0;g=f[S>>2]|0;}o=e<<24>>24<0?g:S;r=o;q=n-r>>2;p=b[y>>0]|0;d=p<<24>>24<0;p=d?f[z>>2]|0:p&255;if(q>>>0>p>>>0){q=s;d=r;o=s;}else {p=(d?f[V>>2]|0:V)+(p<<2)|0;d=p+(0-q<<2)|0;while(1){if((d|0)==(p|0)){q=s;d=n;o=s;break c}if((f[d>>2]|0)!=(f[o>>2]|0)){q=s;d=r;o=s;break c}o=o+4|0;d=d+4|0;}}}else {q=s;d=n;o=s;}while(0);d:while(1){n=e<<24>>24<0;n=(n?g:S)+((n?f[x>>2]|0:e&255)<<2)|0;p=d;if((p|0)==(n|0))break;n=f[a>>2]|0;do if(n){d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(LB(n,aB()|0)|0){f[a>>2]=0;d=1;break}else {d=(f[a>>2]|0)==0;break}}else d=1;while(0);do if(o){n=f[o+12>>2]|0;if((n|0)==(f[o+16>>2]|0))n=Uc[f[(f[o>>2]|0)+36>>2]&127](o)|0;else n=bB(f[n>>2]|0)|0;if(!(LB(n,aB()|0)|0))if(d^(q|0)==0){n=q;o=q;break}else {n=p;break d}else {f[c>>2]=0;n=0;O=129;break}}else {n=q;O=129;}while(0);if((O|0)==129){O=0;if(d){n=p;break}else o=0;}d=f[a>>2]|0;e=f[d+12>>2]|0;if((e|0)==(f[d+16>>2]|0))d=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else d=bB(f[e>>2]|0)|0;if((d|0)!=(f[p>>2]|0)){n=p;break}d=f[a>>2]|0;e=d+12|0;g=f[e>>2]|0;if((g|0)==(f[d+16>>2]|0))Uc[f[(f[d>>2]|0)+40>>2]&127](d)|0;else {f[e>>2]=g+4;bB(f[g>>2]|0)|0;}q=n;d=p+4|0;e=b[w>>0]|0;g=f[S>>2]|0;}if(v?(s=b[w>>0]|0,r=s<<24>>24<0,(n|0)!=((r?f[S>>2]|0:S)+((r?f[x>>2]|0:s&255)<<2)|0)):0){O=141;break a}else n=N;break}case 4:{q=0;n=s;g=s;e:while(1){d=f[a>>2]|0;do if(d){e=f[d+12>>2]|0;if((e|0)==(f[d+16>>2]|0))d=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else d=bB(f[e>>2]|0)|0;if(LB(d,aB()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);do if(g){d=f[g+12>>2]|0;if((d|0)==(f[g+16>>2]|0))d=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else d=bB(f[d>>2]|0)|0;if(!(LB(d,aB()|0)|0))if(e^(n|0)==0){o=n;p=n;break}else {g=n;break e}else {f[c>>2]=0;n=0;O=155;break}}else O=155;while(0);if((O|0)==155){O=0;if(e){g=n;break}else {o=n;p=0;}}n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))d=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else d=bB(f[d>>2]|0)|0;if(Wc[f[(f[k>>2]|0)+12>>2]&63](k,2048,d)|0){n=f[m>>2]|0;if((n|0)==(f[H>>2]|0)){DH(l,m,H);n=f[m>>2]|0;}f[m>>2]=n+4;f[n>>2]=d;n=q+1|0;}else {s=b[B>>0]|0;if(!((d|0)==(f[L>>2]|0)&(q|0?((s<<24>>24<0?f[C>>2]|0:s&255)|0)!=0:0))){g=o;break}n=f[P>>2]|0;if((n|0)==(f[I>>2]|0)){uH(X,P,I);n=f[P>>2]|0;}f[P>>2]=n+4;f[n>>2]=q;n=0;}d=f[a>>2]|0;e=d+12|0;g=f[e>>2]|0;if((g|0)==(f[d+16>>2]|0)){Uc[f[(f[d>>2]|0)+40>>2]&127](d)|0;q=n;n=o;g=p;continue}else {f[e>>2]=g+4;bB(f[g>>2]|0)|0;q=n;n=o;g=p;continue}}n=f[P>>2]|0;if(q|0?(f[X>>2]|0)!=(n|0):0){if((n|0)==(f[I>>2]|0)){uH(X,P,I);n=f[P>>2]|0;}f[P>>2]=n+4;f[n>>2]=q;}f:do if((f[M>>2]|0)>0){n=f[a>>2]|0;do if(n){d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(LB(n,aB()|0)|0){f[a>>2]=0;d=1;break}else {d=(f[a>>2]|0)==0;break}}else d=1;while(0);do if(g){n=f[g+12>>2]|0;if((n|0)==(f[g+16>>2]|0))n=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else n=bB(f[n>>2]|0)|0;if(!(LB(n,aB()|0)|0))if(d)break;else {O=227;break a}else {f[c>>2]=0;O=189;break}}else O=189;while(0);if((O|0)==189){O=0;if(d){O=227;break a}else g=0;}n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if((n|0)!=(f[K>>2]|0)){O=227;break a}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0)){Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;n=g;}else {f[d>>2]=e+4;bB(f[e>>2]|0)|0;n=g;}while(1){if((f[M>>2]|0)<=0)break f;d=f[a>>2]|0;do if(d){e=f[d+12>>2]|0;if((e|0)==(f[d+16>>2]|0))d=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else d=bB(f[e>>2]|0)|0;if(LB(d,aB()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);do if(g){d=f[g+12>>2]|0;if((d|0)==(f[g+16>>2]|0))d=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else d=bB(f[d>>2]|0)|0;if(!(LB(d,aB()|0)|0))if(e^(n|0)==0){o=n;g=n;break}else {O=227;break a}else {f[c>>2]=0;n=0;O=212;break}}else O=212;while(0);if((O|0)==212){O=0;if(e){O=227;break a}else {o=n;g=0;}}n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(!(Wc[f[(f[k>>2]|0)+12>>2]&63](k,2048,n)|0)){O=227;break a}if((f[m>>2]|0)==(f[H>>2]|0))DH(l,m,H);n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;d=f[m>>2]|0;f[m>>2]=d+4;f[d>>2]=n;f[M>>2]=(f[M>>2]|0)+-1;n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0)){Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;n=o;continue}else {f[d>>2]=e+4;bB(f[e>>2]|0)|0;n=o;continue}}}while(0);if((f[m>>2]|0)==(f[l>>2]|0)){O=227;break a}else n=N;break}default:n=N;}while(0);g:do if((O|0)==45)while(1){O=0;d=f[a>>2]|0;do if(d){e=f[d+12>>2]|0;if((e|0)==(f[d+16>>2]|0))d=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;else d=bB(f[e>>2]|0)|0;if(LB(d,aB()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);do if(g){d=f[g+12>>2]|0;if((d|0)==(f[g+16>>2]|0))d=Uc[f[(f[g>>2]|0)+36>>2]&127](g)|0;else d=bB(f[d>>2]|0)|0;if(!(LB(d,aB()|0)|0))if(e^(n|0)==0){o=n;g=n;break}else {n=N;break g}else {f[c>>2]=0;n=0;O=58;break}}else O=58;while(0);if((O|0)==58){O=0;if(e){n=N;break g}else {o=n;g=0;}}n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(!(Wc[f[(f[k>>2]|0)+12>>2]&63](k,8192,n)|0)){n=N;break g}n=f[a>>2]|0;d=n+12|0;e=f[d>>2]|0;if((e|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+40>>2]&127](n)|0;else {f[d>>2]=e+4;n=bB(f[e>>2]|0)|0;}aM(V,n);n=o;O=45;}while(0);N=n;t=t+1|0;}h:do if((O|0)==43){f[i>>2]=f[i>>2]|4;d=0;}else if((O|0)==101){f[i>>2]=f[i>>2]|4;d=0;}else if((O|0)==141){f[i>>2]=f[i>>2]|4;d=0;}else if((O|0)==227){f[i>>2]=f[i>>2]|4;d=0;}else if((O|0)==229){i:do if(g){o=N+8+3|0;p=N+4|0;g=1;j:while(1){n=b[o>>0]|0;if(n<<24>>24<0)n=f[p>>2]|0;else n=n&255;if(g>>>0>=n>>>0)break i;n=f[a>>2]|0;do if(n){d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(LB(n,aB()|0)|0){f[a>>2]=0;e=1;break}else {e=(f[a>>2]|0)==0;break}}else e=1;while(0);n=f[c>>2]|0;do if(n){d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if(!(LB(n,aB()|0)|0))if(e)break;else break j;else {f[c>>2]=0;O=248;break}}else O=248;while(0);if((O|0)==248?(O=0,e):0)break;n=f[a>>2]|0;d=f[n+12>>2]|0;if((d|0)==(f[n+16>>2]|0))n=Uc[f[(f[n>>2]|0)+36>>2]&127](n)|0;else n=bB(f[d>>2]|0)|0;if((b[o>>0]|0)<0)d=f[N>>2]|0;else d=N;if((n|0)!=(f[d+(g<<2)>>2]|0))break;n=g+1|0;d=f[a>>2]|0;e=d+12|0;g=f[e>>2]|0;if((g|0)==(f[d+16>>2]|0)){Uc[f[(f[d>>2]|0)+40>>2]&127](d)|0;g=n;continue}else {f[e>>2]=g+4;bB(f[g>>2]|0)|0;g=n;continue}}f[i>>2]=f[i>>2]|4;d=0;break h}while(0);d=f[X>>2]|0;n=f[P>>2]|0;if((d|0)!=(n|0)){f[Q>>2]=0;sD(R,d,n,Q);if(!(f[Q>>2]|0)){d=1;break}else {f[i>>2]=f[i>>2]|4;d=0;break}}else d=1;}while(0);UL(V);UL(U);UL(T);UL(S);HL(R);n=f[X>>2]|0;f[X>>2]=0;if(n|0)dd[f[W>>2]&511](n);u=Y;return d|0}function AH(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;r=u;n=u=u+31&-32;u=u+16|0;q=n+12|0;e=a+8|0;p=e+3|0;i=b[p>>0]|0;g=i<<24>>24<0;if(g){o=f[a+4>>2]|0;j=(f[e>>2]&2147483647)+-1|0;}else {o=i&255;j=1;}m=d-c>>2;do if(m|0){if(g){g=f[a>>2]|0;h=g;e=f[a+4>>2]|0;}else {h=a;e=i&255;g=a;}if(BH(c,g,h+(e<<2)|0)|0){f[n>>2]=0;f[n+4>>2]=0;f[n+8>>2]=0;if(m>>>0>1073741807)EL();do if(m>>>0>=2){e=m+4&-4;if(e>>>0>1073741823)Gb();else {l=vL(e<<2)|0;f[n>>2]=l;f[n+8>>2]=e|-2147483648;f[n+4>>2]=m;k=c;break}}else {b[n+8+3>>0]=m;k=c;l=n;}while(0);while(1){if((k|0)==(d|0))break;RC(l,k);k=k+4|0;l=l+4|0;}f[q>>2]=0;RC(l,q);q=b[n+8+3>>0]|0;d=q<<24>>24<0;$L(a,d?f[n>>2]|0:n,d?f[n+4>>2]|0:q&255)|0;UL(n);break}g=o+m|0;if((j-o|0)>>>0<m>>>0)_L(a,j,g-j|0,o,o,0,0);if((b[p>>0]|0)<0)e=f[a>>2]|0;else e=a;e=e+(o<<2)|0;while(1){if((c|0)==(d|0))break;RC(e,c);e=e+4|0;c=c+4|0;}f[q>>2]=0;RC(e,q);if((b[p>>0]|0)<0){f[a+4>>2]=g;break}else {b[p>>0]=g;break}}while(0);u=r;return a|0}function BH(a,b,c){a=a|0;b=b|0;c=c|0;return b>>>0<=a>>>0&a>>>0<c>>>0|0}function CH(a,c,d,e,g,h,i,j,k,l){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;o=u;n=u=u+31&-32;u=u+16|0;m=n+12|0;if(a){c=dD(c,62780)|0;ed[f[(f[c>>2]|0)+44>>2]&63](m,c);a=f[m>>2]|0;b[d>>0]=a;b[d+1>>0]=a>>8;b[d+2>>0]=a>>16;b[d+3>>0]=a>>24;ed[f[(f[c>>2]|0)+32>>2]&63](n,c);a=k+8+3|0;if((b[a>>0]|0)<0){d=f[k>>2]|0;f[m>>2]=0;RC(d,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);ed[f[(f[c>>2]|0)+28>>2]&63](n,c);a=j+8+3|0;if((b[a>>0]|0)<0){k=f[j>>2]|0;f[m>>2]=0;RC(k,m);f[j+4>>2]=0;}else {f[m>>2]=0;RC(j,m);b[a>>0]=0;}YL(j,0);f[j>>2]=f[n>>2];f[j+4>>2]=f[n+4>>2];f[j+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[c>>2]|0)+12>>2]&127](c)|0;f[e>>2]=a;a=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;f[g>>2]=a;ed[f[(f[c>>2]|0)+20>>2]&63](n,c);a=h+11|0;if((b[a>>0]|0)<0){a=f[h>>2]|0;b[m>>0]=0;GB(a,m);f[h+4>>2]=0;a=h;}else {b[m>>0]=0;GB(h,m);b[a>>0]=0;a=h;}ML(h,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+24>>2]&63](n,c);a=i+8+3|0;if((b[a>>0]|0)<0){h=f[i>>2]|0;f[m>>2]=0;RC(h,m);f[i+4>>2]=0;}else {f[m>>2]=0;RC(i,m);b[a>>0]=0;}YL(i,0);f[i>>2]=f[n>>2];f[i+4>>2]=f[n+4>>2];f[i+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[c>>2]|0)+36>>2]&127](c)|0;}else {c=dD(c,62772)|0;ed[f[(f[c>>2]|0)+44>>2]&63](m,c);a=f[m>>2]|0;b[d>>0]=a;b[d+1>>0]=a>>8;b[d+2>>0]=a>>16;b[d+3>>0]=a>>24;ed[f[(f[c>>2]|0)+32>>2]&63](n,c);a=k+8+3|0;if((b[a>>0]|0)<0){d=f[k>>2]|0;f[m>>2]=0;RC(d,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);ed[f[(f[c>>2]|0)+28>>2]&63](n,c);a=j+8+3|0;if((b[a>>0]|0)<0){k=f[j>>2]|0;f[m>>2]=0;RC(k,m);f[j+4>>2]=0;}else {f[m>>2]=0;RC(j,m);b[a>>0]=0;}YL(j,0);f[j>>2]=f[n>>2];f[j+4>>2]=f[n+4>>2];f[j+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[c>>2]|0)+12>>2]&127](c)|0;f[e>>2]=a;a=Uc[f[(f[c>>2]|0)+16>>2]&127](c)|0;f[g>>2]=a;ed[f[(f[c>>2]|0)+20>>2]&63](n,c);a=h+11|0;if((b[a>>0]|0)<0){a=f[h>>2]|0;b[m>>0]=0;GB(a,m);f[h+4>>2]=0;a=h;}else {b[m>>0]=0;GB(h,m);b[a>>0]=0;a=h;}ML(h,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[c>>2]|0)+24>>2]&63](n,c);a=i+8+3|0;if((b[a>>0]|0)<0){h=f[i>>2]|0;f[m>>2]=0;RC(h,m);f[i+4>>2]=0;}else {f[m>>2]=0;RC(i,m);b[a>>0]=0;}YL(i,0);f[i>>2]=f[n>>2];f[i+4>>2]=f[n+4>>2];f[i+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[c>>2]|0)+36>>2]&127](c)|0;}f[l>>2]=a;u=o;return}function DH(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,g=0,h=0,i=0;i=a+4|0;e=(f[i>>2]|0)!=456;d=f[a>>2]|0;g=(f[c>>2]|0)-d|0;g=g>>>0<2147483647?g<<1:-1;g=(g|0)==0?4:g;h=(f[b>>2]|0)-d>>2;d=Nx(e?d:0,g)|0;if(!d)zL();if(!e){e=f[a>>2]|0;f[a>>2]=d;if(e){dd[f[i>>2]&511](e);d=f[a>>2]|0;}}else f[a>>2]=d;f[i>>2]=457;f[b>>2]=d+(h<<2);f[c>>2]=(f[a>>2]|0)+(g>>>2<<2);return}function EH(a){return}function FH(a){a=a|0;xL(a);return}function GH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=+h;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;F=u;x=u=u+31&-32;u=u+384|0;q=x+8|0;j=x;a=x+284|0;k=x+72|0;i=x+184|0;E=x+68|0;r=x+180|0;s=x+177|0;t=x+176|0;B=x+56|0;C=x+44|0;D=x+32|0;n=x+28|0;o=x+76|0;v=x+24|0;w=x+16|0;x=x+20|0;f[k>>2]=a;p[q>>3]=h;a=qz(a,100,56752,q)|0;if(a>>>0>99){a=gD()|0;p[j>>3]=h;a=yE(k,a,56752,j)|0;i=f[k>>2]|0;if(!i)zL();j=Lx(a)|0;if(!j)zL();else {y=j;A=a;H=j;I=i;}}else {y=i;A=a;H=0;I=0;}KB(E,e);m=dD(E,61044)|0;l=f[k>>2]|0;Xc[f[(f[m>>2]|0)+32>>2]&7](m,l,l+A|0,y)|0;if(!A)l=0;else l=(b[f[k>>2]>>0]|0)==45;f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}f[C>>2]=0;f[C+4>>2]=0;f[C+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[C+(a<<2)>>2]=0;a=a+1|0;}f[D>>2]=0;f[D+4>>2]=0;f[D+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[D+(a<<2)>>2]=0;a=a+1|0;}IH(d,l,E,r,s,t,B,C,D,n);k=f[n>>2]|0;if((A|0)>(k|0)){i=b[D+11>>0]|0;j=b[C+11>>0]|0;a=1;i=(i<<24>>24<0?f[D+4>>2]|0:i&255)+(A-k<<1)|0;j=j<<24>>24<0?f[C+4>>2]|0:j&255;}else {j=b[D+11>>0]|0;i=b[C+11>>0]|0;a=2;i=i<<24>>24<0?f[C+4>>2]|0:i&255;j=j<<24>>24<0?f[D+4>>2]|0:j&255;}a=j+k+i+a|0;if(a>>>0>100){a=Lx(a)|0;if(!a)zL();else {z=a;G=a;}}else {z=o;G=0;}JH(z,v,w,f[e+4>>2]|0,y,y+A|0,m,l,r,b[s>>0]|0,b[t>>0]|0,B,C,D,k);f[x>>2]=f[c>>2];c=f[v>>2]|0;a=f[w>>2]|0;f[q>>2]=f[x>>2];a=ge(q,z,c,a,e,g)|0;if(G|0)Mx(G);HL(D);HL(C);HL(B);eD(E);if(H|0)Mx(H);if(I|0)Mx(I);u=F;return a|0}function HH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;D=u;s=u=u+31&-32;u=u+176|0;p=s+56|0;C=s+52|0;v=s+164|0;w=s+161|0;x=s+160|0;z=s+40|0;A=s+28|0;B=s+16|0;l=s+12|0;n=s+60|0;q=s+8|0;r=s+4|0;KB(C,e);t=dD(C,61044)|0;i=h+11|0;o=b[i>>0]|0;a=o<<24>>24<0;j=h+4|0;if(!((a?f[j>>2]|0:o&255)|0))o=0;else {o=b[(a?f[h>>2]|0:h)>>0]|0;o=o<<24>>24==(Vc[f[(f[t>>2]|0)+28>>2]&31](t,45)|0)<<24>>24;}f[z>>2]=0;f[z+4>>2]=0;f[z+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[z+(a<<2)>>2]=0;a=a+1|0;}f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}IH(d,o,C,v,w,x,z,A,B,l);k=b[i>>0]|0;m=k<<24>>24<0;k=m?f[j>>2]|0:k&255;j=f[l>>2]|0;if((k|0)>(j|0)){i=b[B+11>>0]|0;d=b[A+11>>0]|0;a=1;i=(i<<24>>24<0?f[B+4>>2]|0:i&255)+(k-j<<1)|0;d=d<<24>>24<0?f[A+4>>2]|0:d&255;}else {d=b[B+11>>0]|0;i=b[A+11>>0]|0;a=2;i=i<<24>>24<0?f[A+4>>2]|0:i&255;d=d<<24>>24<0?f[B+4>>2]|0:d&255;}a=d+j+i+a|0;if(a>>>0>100){a=Lx(a)|0;if(!a)zL();else {y=a;E=a;}}else {y=n;E=0;}h=m?f[h>>2]|0:h;JH(y,q,r,f[e+4>>2]|0,h,h+k|0,t,o,v,b[w>>0]|0,b[x>>0]|0,z,A,B,j);f[s>>2]=f[c>>2];h=f[q>>2]|0;a=f[r>>2]|0;f[p>>2]=f[s>>2];a=ge(p,y,h,a,e,g)|0;if(E|0)Mx(E);HL(B);HL(A);HL(z);eD(C);u=D;return a|0}function IH(a,c,d,e,g,h,i,j,k,l){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0;p=u;o=u=u+31&-32;u=u+16|0;n=o+12|0;if(a){m=dD(d,62764)|0;if(c){ed[f[(f[m>>2]|0)+44>>2]&63](n,m);a=f[n>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[m>>2]|0)+32>>2]&63](o,m);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[n>>0]=0;GB(a,n);f[k+4>>2]=0;a=k;}else {b[n>>0]=0;GB(k,n);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);d=m;}else {ed[f[(f[m>>2]|0)+40>>2]&63](n,m);a=f[n>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[m>>2]|0)+28>>2]&63](o,m);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[n>>0]=0;GB(a,n);f[k+4>>2]=0;a=k;}else {b[n>>0]=0;GB(k,n);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);d=m;}a=Uc[f[(f[m>>2]|0)+12>>2]&127](m)|0;b[g>>0]=a;a=Uc[f[(f[m>>2]|0)+16>>2]&127](m)|0;b[h>>0]=a;ed[f[(f[d>>2]|0)+20>>2]&63](o,m);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[n>>0]=0;GB(a,n);f[i+4>>2]=0;a=i;}else {b[n>>0]=0;GB(i,n);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);ed[f[(f[d>>2]|0)+24>>2]&63](o,m);a=j+11|0;if((b[a>>0]|0)<0){a=f[j>>2]|0;b[n>>0]=0;GB(a,n);f[j+4>>2]=0;a=j;}else {b[n>>0]=0;GB(j,n);b[a>>0]=0;a=j;}ML(j,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);a=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;}else {m=dD(d,62756)|0;if(c){ed[f[(f[m>>2]|0)+44>>2]&63](n,m);a=f[n>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[m>>2]|0)+32>>2]&63](o,m);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[n>>0]=0;GB(a,n);f[k+4>>2]=0;a=k;}else {b[n>>0]=0;GB(k,n);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);d=m;}else {ed[f[(f[m>>2]|0)+40>>2]&63](n,m);a=f[n>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[m>>2]|0)+28>>2]&63](o,m);a=k+11|0;if((b[a>>0]|0)<0){a=f[k>>2]|0;b[n>>0]=0;GB(a,n);f[k+4>>2]=0;a=k;}else {b[n>>0]=0;GB(k,n);b[a>>0]=0;a=k;}ML(k,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);d=m;}a=Uc[f[(f[m>>2]|0)+12>>2]&127](m)|0;b[g>>0]=a;a=Uc[f[(f[m>>2]|0)+16>>2]&127](m)|0;b[h>>0]=a;ed[f[(f[d>>2]|0)+20>>2]&63](o,m);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[n>>0]=0;GB(a,n);f[i+4>>2]=0;a=i;}else {b[n>>0]=0;GB(i,n);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);ed[f[(f[d>>2]|0)+24>>2]&63](o,m);a=j+11|0;if((b[a>>0]|0)<0){a=f[j>>2]|0;b[n>>0]=0;GB(a,n);f[j+4>>2]=0;a=j;}else {b[n>>0]=0;GB(j,n);b[a>>0]=0;a=j;}ML(j,0);f[a>>2]=f[o>>2];f[a+4>>2]=f[o+4>>2];f[a+8>>2]=f[o+8>>2];a=0;while(1){if((a|0)==3)break;f[o+(a<<2)>>2]=0;a=a+1|0;}HL(o);a=Uc[f[(f[m>>2]|0)+36>>2]&127](m)|0;}f[l>>2]=a;u=p;return}function JH(a,c,e,g,h,i,j,k,l,m,n,o,p,q,r){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f[e>>2]=a;z=q+11|0;H=q+4|0;A=p+11|0;B=p+4|0;C=(g&512|0)==0;D=j+8|0;E=(r|0)>0;F=o+11|0;G=o+4|0;y=0;while(1){if((y|0)==4)break;a:do switch(b[l+y>>0]|0){case 0:{f[c>>2]=f[e>>2];break}case 1:{f[c>>2]=f[e>>2];w=Vc[f[(f[j>>2]|0)+28>>2]&31](j,32)|0;x=f[e>>2]|0;f[e>>2]=x+1;b[x>>0]=w;break}case 3:{x=b[z>>0]|0;s=x<<24>>24<0;if((s?f[H>>2]|0:x&255)|0){w=b[(s?f[q>>2]|0:q)>>0]|0;x=f[e>>2]|0;f[e>>2]=x+1;b[x>>0]=w;}break}case 2:{t=b[A>>0]|0;s=t<<24>>24<0;t=s?f[B>>2]|0:t&255;if(!(C|(t|0)==0)){x=s?f[p>>2]|0:p;u=x+t|0;s=f[e>>2]|0;t=x;while(1){if((t|0)==(u|0))break;b[s>>0]=b[t>>0]|0;s=s+1|0;t=t+1|0;}f[e>>2]=s;}break}case 4:{t=f[e>>2]|0;h=k?h+1|0:h;u=h;while(1){if(u>>>0>=i>>>0)break;s=b[u>>0]|0;if(s<<24>>24<=-1)break;if(!(d[(f[D>>2]|0)+(s<<24>>24<<1)>>1]&2048))break;u=u+1|0;}if(E){v=r;while(1){s=(v|0)>0;if(!(u>>>0>h>>>0&s))break;x=u+-1|0;s=b[x>>0]|0;w=f[e>>2]|0;f[e>>2]=w+1;b[w>>0]=s;v=v+-1|0;u=x;}if(s)w=Vc[f[(f[j>>2]|0)+28>>2]&31](j,48)|0;else w=0;s=v;while(1){v=f[e>>2]|0;f[e>>2]=v+1;if((s|0)<=0)break;b[v>>0]=w;s=s+-1|0;}b[v>>0]=m;}b:do if((u|0)==(h|0)){w=Vc[f[(f[j>>2]|0)+28>>2]&31](j,48)|0;x=f[e>>2]|0;f[e>>2]=x+1;b[x>>0]=w;}else {x=b[F>>0]|0;s=x<<24>>24<0;if(!((s?f[G>>2]|0:x&255)|0)){w=-1;v=0;x=0;}else {w=b[(s?f[o>>2]|0:o)>>0]|0;v=0;x=0;}while(1){if((u|0)==(h|0))break b;if((x|0)==(w|0)){w=f[e>>2]|0;f[e>>2]=w+1;b[w>>0]=n;v=v+1|0;w=b[F>>0]|0;s=w<<24>>24<0;if(v>>>0<(s?f[G>>2]|0:w&255)>>>0){w=b[(s?f[o>>2]|0:o)+v>>0]|0;w=w<<24>>24==127?-1:w<<24>>24;s=0;}else {w=x;s=0;}}else s=x;I=u+-1|0;J=b[I>>0]|0;x=f[e>>2]|0;f[e>>2]=x+1;b[x>>0]=J;x=s+1|0;u=I;}}while(0);s=f[e>>2]|0;if((t|0)!=(s|0))while(1){s=s+-1|0;if(t>>>0>=s>>>0)break a;J=b[t>>0]|0;b[t>>0]=b[s>>0]|0;b[s>>0]=J;t=t+1|0;}break}}while(0);y=y+1|0;}h=b[z>>0]|0;s=h<<24>>24<0;h=s?f[H>>2]|0:h&255;if(h>>>0>1){J=s?f[q>>2]|0:q;t=J+h|0;s=f[e>>2]|0;h=J;while(1){h=h+1|0;if((h|0)==(t|0))break;b[s>>0]=b[h>>0]|0;s=s+1|0;}f[e>>2]=s;}switch((g&176)<<24>>24){case 32:{f[c>>2]=f[e>>2];break}case 16:break;default:f[c>>2]=a;}return}function KH(a){return}function LH(a){a=a|0;xL(a);return}function MH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=+h;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;F=u;x=u=u+31&-32;u=u+1008|0;q=x+8|0;j=x;a=x+896|0;k=x+888|0;i=x+488|0;E=x+480|0;r=x+892|0;s=x+476|0;t=x+472|0;B=x+460|0;C=x+448|0;D=x+436|0;n=x+432|0;o=x+32|0;v=x+24|0;w=x+16|0;x=x+20|0;f[k>>2]=a;p[q>>3]=h;a=qz(a,100,56752,q)|0;if(a>>>0>99){a=gD()|0;p[j>>3]=h;a=yE(k,a,56752,j)|0;i=f[k>>2]|0;if(!i)zL();j=Lx(a<<2)|0;if(!j)zL();else {y=j;A=a;H=j;I=i;}}else {y=i;A=a;H=0;I=0;}KB(E,e);m=dD(E,61076)|0;l=f[k>>2]|0;Xc[f[(f[m>>2]|0)+48>>2]&7](m,l,l+A|0,y)|0;if(!A)l=0;else l=(b[f[k>>2]>>0]|0)==45;f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}f[C>>2]=0;f[C+4>>2]=0;f[C+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[C+(a<<2)>>2]=0;a=a+1|0;}f[D>>2]=0;f[D+4>>2]=0;f[D+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[D+(a<<2)>>2]=0;a=a+1|0;}OH(d,l,E,r,s,t,B,C,D,n);k=f[n>>2]|0;if((A|0)>(k|0)){i=b[D+8+3>>0]|0;j=b[C+8+3>>0]|0;a=1;i=(i<<24>>24<0?f[D+4>>2]|0:i&255)+(A-k<<1)|0;j=j<<24>>24<0?f[C+4>>2]|0:j&255;}else {j=b[D+8+3>>0]|0;i=b[C+8+3>>0]|0;a=2;i=i<<24>>24<0?f[C+4>>2]|0:i&255;j=j<<24>>24<0?f[D+4>>2]|0:j&255;}a=j+k+i+a|0;if(a>>>0>100){a=Lx(a<<2)|0;if(!a)zL();else {z=a;G=a;}}else {z=o;G=0;}PH(z,v,w,f[e+4>>2]|0,y,y+(A<<2)|0,m,l,r,f[s>>2]|0,f[t>>2]|0,B,C,D,k);f[x>>2]=f[c>>2];c=f[v>>2]|0;a=f[w>>2]|0;f[q>>2]=f[x>>2];a=ME(q,z,c,a,e,g)|0;if(G|0)Mx(G);UL(D);UL(C);HL(B);eD(E);if(H|0)Mx(H);if(I|0)Mx(I);u=F;return a|0}function NH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;D=u;s=u=u+31&-32;u=u+480|0;p=s+468|0;C=s+464|0;v=s+472|0;w=s+460|0;x=s+456|0;z=s+444|0;A=s+432|0;B=s+420|0;l=s+416|0;n=s+16|0;q=s+8|0;r=s+4|0;KB(C,e);t=dD(C,61076)|0;i=h+8+3|0;o=b[i>>0]|0;a=o<<24>>24<0;j=h+4|0;if(!((a?f[j>>2]|0:o&255)|0))o=0;else {o=f[(a?f[h>>2]|0:h)>>2]|0;o=(o|0)==(Vc[f[(f[t>>2]|0)+44>>2]&31](t,45)|0);}f[z>>2]=0;f[z+4>>2]=0;f[z+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[z+(a<<2)>>2]=0;a=a+1|0;}f[A>>2]=0;f[A+4>>2]=0;f[A+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[A+(a<<2)>>2]=0;a=a+1|0;}f[B>>2]=0;f[B+4>>2]=0;f[B+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[B+(a<<2)>>2]=0;a=a+1|0;}OH(d,o,C,v,w,x,z,A,B,l);k=b[i>>0]|0;m=k<<24>>24<0;k=m?f[j>>2]|0:k&255;j=f[l>>2]|0;if((k|0)>(j|0)){i=b[B+8+3>>0]|0;d=b[A+8+3>>0]|0;a=1;i=(i<<24>>24<0?f[B+4>>2]|0:i&255)+(k-j<<1)|0;d=d<<24>>24<0?f[A+4>>2]|0:d&255;}else {d=b[B+8+3>>0]|0;i=b[A+8+3>>0]|0;a=2;i=i<<24>>24<0?f[A+4>>2]|0:i&255;d=d<<24>>24<0?f[B+4>>2]|0:d&255;}a=d+j+i+a|0;if(a>>>0>100){a=Lx(a<<2)|0;if(!a)zL();else {y=a;E=a;}}else {y=n;E=0;}h=m?f[h>>2]|0:h;PH(y,q,r,f[e+4>>2]|0,h,h+(k<<2)|0,t,o,v,f[w>>2]|0,f[x>>2]|0,z,A,B,j);f[s>>2]=f[c>>2];h=f[q>>2]|0;a=f[r>>2]|0;f[p>>2]=f[s>>2];a=ME(p,y,h,a,e,g)|0;if(E|0)Mx(E);UL(B);UL(A);HL(z);eD(C);u=D;return a|0}function OH(a,c,d,e,g,h,i,j,k,l){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;o=u;n=u=u+31&-32;u=u+16|0;m=n+12|0;if(a){d=dD(d,62780)|0;if(c){ed[f[(f[d>>2]|0)+44>>2]&63](m,d);a=f[m>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[d>>2]|0)+32>>2]&63](n,d);a=k+8+3|0;if((b[a>>0]|0)<0){e=f[k>>2]|0;f[m>>2]=0;RC(e,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);}else {ed[f[(f[d>>2]|0)+40>>2]&63](m,d);a=f[m>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[d>>2]|0)+28>>2]&63](n,d);a=k+8+3|0;if((b[a>>0]|0)<0){e=f[k>>2]|0;f[m>>2]=0;RC(e,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);}a=Uc[f[(f[d>>2]|0)+12>>2]&127](d)|0;f[g>>2]=a;a=Uc[f[(f[d>>2]|0)+16>>2]&127](d)|0;f[h>>2]=a;ed[f[(f[d>>2]|0)+20>>2]&63](n,d);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[m>>0]=0;GB(a,m);f[i+4>>2]=0;a=i;}else {b[m>>0]=0;GB(i,m);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[d>>2]|0)+24>>2]&63](n,d);a=j+8+3|0;if((b[a>>0]|0)<0){i=f[j>>2]|0;f[m>>2]=0;RC(i,m);f[j+4>>2]=0;}else {f[m>>2]=0;RC(j,m);b[a>>0]=0;}YL(j,0);f[j>>2]=f[n>>2];f[j+4>>2]=f[n+4>>2];f[j+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;}else {d=dD(d,62772)|0;if(c){ed[f[(f[d>>2]|0)+44>>2]&63](m,d);a=f[m>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[d>>2]|0)+32>>2]&63](n,d);a=k+8+3|0;if((b[a>>0]|0)<0){e=f[k>>2]|0;f[m>>2]=0;RC(e,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);}else {ed[f[(f[d>>2]|0)+40>>2]&63](m,d);a=f[m>>2]|0;b[e>>0]=a;b[e+1>>0]=a>>8;b[e+2>>0]=a>>16;b[e+3>>0]=a>>24;ed[f[(f[d>>2]|0)+28>>2]&63](n,d);a=k+8+3|0;if((b[a>>0]|0)<0){e=f[k>>2]|0;f[m>>2]=0;RC(e,m);f[k+4>>2]=0;}else {f[m>>2]=0;RC(k,m);b[a>>0]=0;}YL(k,0);f[k>>2]=f[n>>2];f[k+4>>2]=f[n+4>>2];f[k+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);}a=Uc[f[(f[d>>2]|0)+12>>2]&127](d)|0;f[g>>2]=a;a=Uc[f[(f[d>>2]|0)+16>>2]&127](d)|0;f[h>>2]=a;ed[f[(f[d>>2]|0)+20>>2]&63](n,d);a=i+11|0;if((b[a>>0]|0)<0){a=f[i>>2]|0;b[m>>0]=0;GB(a,m);f[i+4>>2]=0;a=i;}else {b[m>>0]=0;GB(i,m);b[a>>0]=0;a=i;}ML(i,0);f[a>>2]=f[n>>2];f[a+4>>2]=f[n+4>>2];f[a+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}HL(n);ed[f[(f[d>>2]|0)+24>>2]&63](n,d);a=j+8+3|0;if((b[a>>0]|0)<0){i=f[j>>2]|0;f[m>>2]=0;RC(i,m);f[j+4>>2]=0;}else {f[m>>2]=0;RC(j,m);b[a>>0]=0;}YL(j,0);f[j>>2]=f[n>>2];f[j+4>>2]=f[n+4>>2];f[j+8>>2]=f[n+8>>2];a=0;while(1){if((a|0)==3)break;f[n+(a<<2)>>2]=0;a=a+1|0;}UL(n);a=Uc[f[(f[d>>2]|0)+36>>2]&127](d)|0;}f[l>>2]=a;u=o;return}function PH(a,c,d,e,g,h,i,j,k,l,m,n,o,p,q){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f[d>>2]=a;B=p+8+3|0;I=p+4|0;C=o+8+3|0;D=o+4|0;E=(e&512|0)==0;F=(q|0)>0;G=n+11|0;H=n+4|0;A=0;while(1){if((A|0)==4)break;a:do switch(b[k+A>>0]|0){case 0:{f[c>>2]=f[d>>2];break}case 1:{f[c>>2]=f[d>>2];y=Vc[f[(f[i>>2]|0)+44>>2]&31](i,32)|0;z=f[d>>2]|0;f[d>>2]=z+4;f[z>>2]=y;break}case 3:{z=b[B>>0]|0;r=z<<24>>24<0;if((r?f[I>>2]|0:z&255)|0){y=f[(r?f[p>>2]|0:p)>>2]|0;z=f[d>>2]|0;f[d>>2]=z+4;f[z>>2]=y;}break}case 2:{v=b[C>>0]|0;r=v<<24>>24<0;v=r?f[D>>2]|0:v&255;if(!(E|(v|0)==0)){u=r?f[o>>2]|0:o;s=u+(v<<2)|0;t=f[d>>2]|0;r=t;while(1){if((u|0)==(s|0))break;f[r>>2]=f[u>>2];r=r+4|0;u=u+4|0;}f[d>>2]=t+(v<<2);}break}case 4:{s=f[d>>2]|0;g=j?g+4|0:g;r=g;while(1){if(r>>>0>=h>>>0)break;if(!(Wc[f[(f[i>>2]|0)+12>>2]&63](i,2048,f[r>>2]|0)|0))break;r=r+4|0;}if(F){u=q;while(1){t=(u|0)>0;if(!(r>>>0>g>>>0&t))break;z=r+-4|0;x=f[z>>2]|0;y=f[d>>2]|0;f[d>>2]=y+4;f[y>>2]=x;u=u+-1|0;r=z;}if(t)w=Vc[f[(f[i>>2]|0)+44>>2]&31](i,48)|0;else w=0;v=f[d>>2]|0;while(1){t=v+4|0;if((u|0)<=0)break;f[v>>2]=w;u=u+-1|0;v=t;}f[d>>2]=t;f[v>>2]=l;}if((r|0)==(g|0)){y=Vc[f[(f[i>>2]|0)+44>>2]&31](i,48)|0;z=f[d>>2]|0;r=z+4|0;f[d>>2]=r;f[z>>2]=y;}else {z=b[G>>0]|0;y=z<<24>>24<0;z=z&255;if(!((y?f[H>>2]|0:z)|0)){v=-1;t=0;w=0;}else {v=b[(y?f[n>>2]|0:n)>>0]|0;t=0;w=0;}while(1){if((r|0)==(g|0))break;u=f[d>>2]|0;if((w|0)==(v|0)){x=u+4|0;f[d>>2]=x;f[u>>2]=m;t=t+1|0;if(t>>>0<(y?f[H>>2]|0:z)>>>0){v=b[(y?f[n>>2]|0:n)+t>>0]|0;v=v<<24>>24==127?-1:v<<24>>24;w=0;u=x;}else {v=w;w=0;u=x;}}x=r+-4|0;J=f[x>>2]|0;f[d>>2]=u+4;f[u>>2]=J;w=w+1|0;r=x;}r=f[d>>2]|0;}if((s|0)!=(r|0))while(1){r=r+-4|0;if(s>>>0>=r>>>0)break a;J=f[s>>2]|0;f[s>>2]=f[r>>2];f[r>>2]=J;s=s+4|0;}break}}while(0);A=A+1|0;}g=b[B>>0]|0;r=g<<24>>24<0;g=r?f[I>>2]|0:g&255;if(g>>>0>1){r=r?f[p>>2]|0:p;u=r+4|0;r=r+(g<<2)|0;s=f[d>>2]|0;t=r-u|0;g=s;while(1){if((u|0)==(r|0))break;f[g>>2]=f[u>>2];g=g+4|0;u=u+4|0;}f[d>>2]=s+(t>>>2<<2);}switch((e&176)<<24>>24){case 32:{f[c>>2]=f[d>>2];break}case 16:break;default:f[c>>2]=a;}return}function QH(a){return}function RH(a){a=a|0;xL(a);return}function SH(a,c,d){c=c|0;d=d|0;d=iA((b[c+11>>0]|0)<0?f[c>>2]|0:c)|0;return d>>>((d|0)!=(-1|0)&1)|0}function TH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0;j=u;i=u=u+31&-32;u=u+16|0;f[i>>2]=0;f[i+4>>2]=0;f[i+8>>2]=0;c=0;while(1){if((c|0)==3)break;f[i+(c<<2)>>2]=0;c=c+1|0;}k=b[h+11>>0]|0;l=k<<24>>24<0;c=l?f[h>>2]|0:h;h=c+(l?f[h+4>>2]|0:k&255)|0;while(1){if(c>>>0>=h>>>0)break;SL(i,b[c>>0]|0);c=c+1|0;}c=(b[i+11>>0]|0)<0?f[i>>2]|0:i;d=dA((d|0)==-1?-1:d<<1,e,g,c)|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;h=0;while(1){if((h|0)==3)break;f[a+(h<<2)>>2]=0;h=h+1|0;}h=c+(ky(d)|0)|0;while(1){if(c>>>0>=h>>>0)break;SL(a,b[c>>0]|0);c=c+1|0;}HL(i);u=j;return}function UH(a,b){return}function VH(a){return}function WH(a){a=a|0;xL(a);return}function XH(a,c,d){c=c|0;d=d|0;d=iA((b[c+11>>0]|0)<0?f[c>>2]|0:c)|0;return d>>>((d|0)!=(-1|0)&1)|0}function YH(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=u;o=u=u+31&-32;u=u+176|0;p=o+168|0;q=o+40|0;r=o+36|0;s=o+32|0;n=o;l=o+24|0;o=o+16|0;f[n>>2]=0;f[n+4>>2]=0;f[n+8>>2]=0;c=0;while(1){if((c|0)==3)break;f[n+(c<<2)>>2]=0;c=c+1|0;}f[l+4>>2]=0;f[l>>2]=17252;j=b[h+8+3>>0]|0;k=j<<24>>24<0;c=k?f[h>>2]|0:h;j=c+((k?f[h+4>>2]|0:j&255)<<2)|0;k=q+32|0;h=c;c=0;while(1){if(!((c|0)!=2&h>>>0<j>>>0))break;f[s>>2]=h;i=bd[f[(f[l>>2]|0)+12>>2]&15](l,p,h,j,s,q,k,r)|0;if((i|0)==2?1:(f[s>>2]|0)==(h|0)){m=7;break}else c=q;while(1){if(c>>>0>=(f[r>>2]|0)>>>0)break;SL(n,b[c>>0]|0);c=c+1|0;}h=f[s>>2]|0;c=i;}if((m|0)==7)sG();i=(b[n+11>>0]|0)<0?f[n>>2]|0:n;h=dA((d|0)==-1?-1:d<<1,e,g,i)|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;c=0;while(1){if((c|0)==3)break;f[a+(c<<2)>>2]=0;c=c+1|0;}f[o+4>>2]=0;f[o>>2]=17300;j=i+(ky(h)|0)|0;k=j;l=q+128|0;h=i;c=0;while(1){if(!((c|0)!=2&h>>>0<j>>>0)){m=21;break}f[s>>2]=h;i=bd[f[(f[o>>2]|0)+16>>2]&15](o,p,h,(k-h|0)>32?h+32|0:j,s,q,l,r)|0;if((i|0)==2?1:(f[s>>2]|0)==(h|0)){m=17;break}else c=q;while(1){if(c>>>0>=(f[r>>2]|0)>>>0)break;aM(a,f[c>>2]|0);c=c+4|0;}h=f[s>>2]|0;c=i;}if((m|0)==17)sG();else if((m|0)==21){HL(n);u=t;return}}function ZH(a,b){return}function _H(a){a=a|0;xL(a);return}function $H(a,b,c,d,e,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0;b=u;a=u=u+31&-32;u=u+16|0;j=a+4|0;f[j>>2]=c;f[a>>2]=g;h=iI(c,d,j,g,h,a,1114111,0)|0;f[e>>2]=f[j>>2];f[i>>2]=f[a>>2];u=b;return h|0}function aI(a,b,c,d,e,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0;b=u;a=u=u+31&-32;u=u+16|0;j=a+4|0;f[j>>2]=c;f[a>>2]=g;h=hI(c,d,j,g,h,a,1114111,0)|0;f[e>>2]=f[j>>2];f[i>>2]=f[a>>2];u=b;return h|0}function bI(a,b,c,d,e){c=c|0;e=e|0;f[e>>2]=c;return 3}function cI(a){return 0}function dI(a){return 0}function eI(a,b,c,d,e){c=c|0;d=d|0;e=e|0;return gI(c,d,e,1114111,0)|0}function fI(a){return 4}function gI(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;o=c;p=a;if(((o-p|0)>2&(f&4|0)!=0?(b[a>>0]|0)==-17:0)?(b[a+1>>0]|0)==-69:0){n=0;a=(b[a+2>>0]|0)==-65?a+3|0:a;}else n=0;a:while(1){if(!(n>>>0<d>>>0&a>>>0<c>>>0)){break}k=b[a>>0]|0;m=k&255;g=a+1|0;do if(k<<24>>24>-1)if(m>>>0>e>>>0){break a}else a=g;else {if((k&255)<194){break a}i=a+2|0;l=a;f=o-l|0;if((k&255)<224){if((f|0)<2){break a}f=h[g>>0]|0;if((f&192|0)!=128){break a}if((f&63|m<<6&1984)>>>0>e>>>0){break a}else {a=i;break}}j=a+3|0;if((k&255)<240){if((f|0)<3){break a}i=b[i>>0]|0;g=h[g>>0]|0;f=g&224;switch(k<<24>>24){case -32:{if((f|0)!=160){a=l;break a}break}case -19:{if((f|0)!=128){a=l;break a}break}default:if((g&192|0)!=128){a=l;break a}}f=i&255;if((f&192|0)!=128){break a}if((g<<6&4032|m<<12&61440|f&63)>>>0>e>>>0){break a}else {a=j;break}}if((f|0)<4|(k&255)>244){break a}g=b[g>>0]|0;f=b[i>>0]|0;i=b[j>>0]|0;j=g&255;switch(k<<24>>24){case -16:{if((g+112&255)>=48){a=l;break a}break}case -12:{if((j&240|0)!=128){a=l;break a}break}default:if((j&192|0)!=128){a=l;break a}}g=f&255;if((g&192|0)!=128){break a}f=i&255;if((f&192|0)!=128){break a}if((j<<12&258048|m<<18&1835008|g<<6&4032|f&63)>>>0>e>>>0){break a}else a=a+4|0;}while(0);n=n+1|0;}return a-p|0}function hI(a,c,d,e,g,i,j,k){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0;f[d>>2]=a;f[i>>2]=e;q=c;if((((k&4|0?(l=f[d>>2]|0,(q-l|0)>2):0)?(b[l>>0]|0)==-17:0)?(b[l+1>>0]|0)==-69:0)?(b[l+2>>0]|0)==-65:0)f[d>>2]=l+3;a:while(1){m=f[d>>2]|0;if(m>>>0>=c>>>0){a=0;break}p=f[i>>2]|0;if(p>>>0>=g>>>0){a=1;break}n=b[m>>0]|0;o=n&255;a=m+1|0;do if(n<<24>>24>-1){if(o>>>0>j>>>0){a=2;break a}f[p>>2]=o;}else {if((n&255)<194){a=2;break a}l=m+2|0;e=q-m|0;if((n&255)<224){if((e|0)<2){a=1;break a}a=h[a>>0]|0;if((a&192|0)!=128){a=2;break a}a=a&63|o<<6&1984;if(a>>>0>j>>>0){a=2;break a}f[p>>2]=a;a=l;break}k=m+3|0;if((n&255)<240){if((e|0)<3){a=1;break a}e=b[l>>0]|0;l=h[a>>0]|0;a=l&224;switch(n<<24>>24){case -32:{if((a|0)!=160){a=2;break a}break}case -19:{if((a|0)!=128){a=2;break a}break}default:if((l&192|0)!=128){a=2;break a}}a=e&255;if((a&192|0)!=128){a=2;break a}a=l<<6&4032|o<<12&61440|a&63;if(a>>>0>j>>>0){a=2;break a}f[p>>2]=a;a=k;break}if((n&255)>=245){a=2;break a}if((e|0)<4){a=1;break a}e=b[a>>0]|0;a=b[l>>0]|0;l=b[k>>0]|0;k=e&255;switch(n<<24>>24){case -16:{if((e+112&255)>=48){a=2;break a}break}case -12:{if((k&240|0)!=128){a=2;break a}break}default:if((k&192|0)!=128){a=2;break a}}e=a&255;if((e&192|0)!=128){a=2;break a}a=l&255;if((a&192|0)!=128){a=2;break a}a=k<<12&258048|o<<18&1835008|e<<6&4032|a&63;if(a>>>0>j>>>0){a=2;break a}f[p>>2]=a;a=m+4|0;}while(0);f[d>>2]=a;f[i>>2]=(f[i>>2]|0)+4;}return a|0}function iI(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0;f[d>>2]=a;f[h>>2]=e;if(j&2)if((g-e|0)<3)a=1;else {f[h>>2]=e+1;b[e>>0]=-17;k=f[h>>2]|0;f[h>>2]=k+1;b[k>>0]=-69;k=f[h>>2]|0;f[h>>2]=k+1;b[k>>0]=-65;k=4;}else k=4;a:do if((k|0)==4){a=f[d>>2]|0;while(1){if(a>>>0>=c>>>0){a=0;break a}m=f[a>>2]|0;if(m>>>0>i>>>0|(m&-2048|0)==55296){a=2;break a}do if(m>>>0>=128){l=(m&63|128)&255;if(m>>>0<2048){a=f[h>>2]|0;if((g-a|0)<2){a=1;break a}f[h>>2]=a+1;b[a>>0]=m>>>6|192;m=f[h>>2]|0;f[h>>2]=m+1;b[m>>0]=l;break}a=f[h>>2]|0;e=g-a|0;j=a+1|0;k=(m>>>6&63|128)&255;if(m>>>0<65536){if((e|0)<3){a=1;break a}f[h>>2]=j;b[a>>0]=m>>>12|224;m=f[h>>2]|0;f[h>>2]=m+1;b[m>>0]=k;m=f[h>>2]|0;f[h>>2]=m+1;b[m>>0]=l;break}else {if((e|0)<4){a=1;break a}f[h>>2]=j;b[a>>0]=m>>>18|240;j=f[h>>2]|0;f[h>>2]=j+1;b[j>>0]=m>>>12&63|128;m=f[h>>2]|0;f[h>>2]=m+1;b[m>>0]=k;m=f[h>>2]|0;f[h>>2]=m+1;b[m>>0]=l;break}}else {a=f[h>>2]|0;if((g-a|0)<1){a=1;break a}f[h>>2]=a+1;b[a>>0]=m;}while(0);a=(f[d>>2]|0)+4|0;f[d>>2]=a;}}while(0);return a|0}function jI(a){a=a|0;xL(a);return}function kI(a,b,c,d,e,g,h,i){c=c|0;e=e|0;g=g|0;i=i|0;f[e>>2]=c;f[i>>2]=g;return 3}function lI(a,b,c,d,e,g,h,i){c=c|0;e=e|0;g=g|0;i=i|0;f[e>>2]=c;f[i>>2]=g;return 3}function mI(a,b,c,d,e){c=c|0;e=e|0;f[e>>2]=c;return 3}function nI(a){return 1}function oI(a){return 1}function pI(a,b,c,d,e){c=c|0;d=d|0;e=e|0;d=d-c|0;return (d>>>0<e>>>0?d:e)|0}function qI(a){return 1}function rI(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;q=u;n=u=u+31&-32;u=u+16|0;p=n;n=n+8|0;k=d;while(1){if((k|0)==(e|0)){k=e;break}if(!(f[k>>2]|0))break;k=k+4|0;}f[j>>2]=h;f[g>>2]=d;m=i;o=a+8|0;a:while(1){if((h|0)==(i|0)|(d|0)==(e|0)){k=35;break}r=c;l=f[r+4>>2]|0;a=p;f[a>>2]=f[r>>2];f[a+4>>2]=l;a=aA(f[o>>2]|0)|0;l=py(h,g,k-d>>2,m-h|0,c)|0;if(a|0)aA(a)|0;switch(l|0){case -1:{k=10;break a}case 0:{d=1;k=32;break a}}h=(f[j>>2]|0)+l|0;f[j>>2]=h;if((h|0)==(i|0)){k=33;break}if((k|0)==(e|0)){k=e;d=f[g>>2]|0;}else {h=aA(f[o>>2]|0)|0;d=dy(n,0,c)|0;if(h|0)aA(h)|0;if((d|0)==-1){d=2;k=31;break}if(d>>>0>(m-(f[j>>2]|0)|0)>>>0){d=1;k=31;break}else h=n;while(1){if(!d)break;l=b[h>>0]|0;r=f[j>>2]|0;f[j>>2]=r+1;b[r>>0]=l;h=h+1|0;d=d+-1|0;}d=(f[g>>2]|0)+4|0;f[g>>2]=d;k=d;while(1){if((k|0)==(e|0)){k=e;break}if(!(f[k>>2]|0))break;k=k+4|0;}h=f[j>>2]|0;}}if((k|0)==10){f[j>>2]=h;while(1){if((d|0)==(f[g>>2]|0))break;r=f[d>>2]|0;k=aA(f[o>>2]|0)|0;h=dy(h,r,p)|0;if(k|0)aA(k)|0;if((h|0)==-1)break;h=(f[j>>2]|0)+h|0;f[j>>2]=h;d=d+4|0;}f[g>>2]=d;d=2;k=32;}else if((k|0)==31)k=32;else if((k|0)==33){d=f[g>>2]|0;k=35;}if((k|0)!=32)if((k|0)==35)d=(d|0)!=(e|0)&1;u=q;return d|0}function sI(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=u;p=u=u+31&-32;u=u+16|0;k=d;while(1){if((k|0)==(e|0)){k=e;break}if(!(b[k>>0]|0))break;k=k+1|0;}f[j>>2]=h;f[g>>2]=d;n=i;o=a+8|0;a=h;while(1){if((a|0)==(i|0)|(d|0)==(e|0)){a=32;break}l=c;h=f[l+4>>2]|0;m=p;f[m>>2]=f[l>>2];f[m+4>>2]=h;m=k;h=aA(f[o>>2]|0)|0;l=hy(a,g,m-d|0,n-a>>2,c)|0;if(h|0)aA(h)|0;if((l|0)==-1){k=a;a=10;break}a=(f[j>>2]|0)+(l<<2)|0;f[j>>2]=a;if((a|0)==(i|0)){a=29;break}d=f[g>>2]|0;if((k|0)==(e|0))k=e;else {k=aA(f[o>>2]|0)|0;d=fy(a,d,1,c)|0;if(k|0)aA(k)|0;if(d|0){d=2;a=28;break}f[j>>2]=(f[j>>2]|0)+4;d=(f[g>>2]|0)+1|0;f[g>>2]=d;k=d;while(1){if((k|0)==(e|0)){k=e;break}if(!(b[k>>0]|0))break;k=k+1|0;}a=f[j>>2]|0;}}do if((a|0)==10){a:while(1){f[j>>2]=k;if((d|0)==(f[g>>2]|0)){a=18;break}a=aA(f[o>>2]|0)|0;k=fy(k,d,m-d|0,p)|0;if(a|0)aA(a)|0;switch(k|0){case -1:{a=15;break a}case -2:{a=16;break a}case 0:{k=1;break}}d=d+k|0;k=(f[j>>2]|0)+4|0;a=10;}if((a|0)==15){f[g>>2]=d;d=2;a=28;break}else if((a|0)==16){f[g>>2]=d;d=1;a=28;break}else if((a|0)==18){f[g>>2]=d;d=(d|0)!=(e|0)&1;a=28;break}}else if((a|0)==29){d=f[g>>2]|0;a=32;}while(0);if((a|0)!=28)if((a|0)==32)d=(d|0)!=(e|0)&1;u=q;return d|0}function tI(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;i=u;h=u=u+31&-32;u=u+16|0;f[g>>2]=d;d=aA(f[a+8>>2]|0)|0;a=dy(h,0,c)|0;if(d|0)aA(d)|0;a:do switch(a|0){case 0:case -1:{a=2;break}default:{a=a+-1|0;if(a>>>0>(e-(f[g>>2]|0)|0)>>>0)a=1;else while(1){if(!a){a=0;break a}c=b[h>>0]|0;e=f[g>>2]|0;f[g>>2]=e+1;b[e>>0]=c;h=h+1|0;a=a+-1|0;}}}while(0);u=i;return a|0}function uI(a){a=a|0;var b=0,c=0;a=a+8|0;b=aA(f[a>>2]|0)|0;c=by(0,0,4)|0;if(b|0)aA(b)|0;if(!c){a=f[a>>2]|0;if(!a)a=1;else {b=aA(a)|0;a=Pz()|0;if(b|0)aA(b)|0;return (a|0)==1|0}}else a=-1;return a|0}function vI(a){return 0}function wI(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0;k=d;j=a+8|0;h=0;i=0;a:while(1){if((c|0)==(d|0)|h>>>0>=e>>>0)break;g=aA(f[j>>2]|0)|0;a=ly(c,k-c|0,b)|0;if(g|0)aA(g)|0;switch(a|0){case -2:case -1:break a;case 0:{a=1;break}}h=h+1|0;i=a+i|0;c=c+a|0;}return i|0}function xI(a){a=a|0;var b=0;a=f[a+8>>2]|0;if(a){b=aA(a)|0;a=Pz()|0;if(b)aA(b)|0;}else a=1;return a|0}function yI(a){a=a|0;var b=0,c=0;f[a>>2]=17348;b=a+8|0;c=f[b>>2]|0;if((c|0)!=(gD()|0))jA(f[b>>2]|0);return}function zI(a){a=a|0;yI(a);xL(a);return}function AI(a,b,c,d,e,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0;b=u;a=u=u+31&-32;u=u+16|0;j=a+4|0;f[j>>2]=c;f[a>>2]=g;h=JI(c,d,j,g,h,a,1114111,0)|0;f[e>>2]=f[j>>2];f[i>>2]=f[a>>2];u=b;return h|0}function BI(a,b,c,d,e,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0;b=u;a=u=u+31&-32;u=u+16|0;j=a+4|0;f[j>>2]=c;f[a>>2]=g;h=II(c,d,j,g,h,a,1114111,0)|0;f[e>>2]=f[j>>2];f[i>>2]=f[a>>2];u=b;return h|0}function CI(a,b,c,d,e){c=c|0;e=e|0;f[e>>2]=c;return 3}function DI(a){return 0}function EI(a){return 0}function FI(a,b,c,d,e){c=c|0;d=d|0;e=e|0;return HI(c,d,e,1114111,0)|0}function GI(a){return 4}function HI(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;p=c;q=a;if(((p-q|0)>2&(f&4|0)!=0?(b[a>>0]|0)==-17:0)?(b[a+1>>0]|0)==-69:0){o=0;a=(b[a+2>>0]|0)==-65?a+3|0:a;}else o=0;a:while(1){if(!(o>>>0<d>>>0&a>>>0<c>>>0)){break}k=b[a>>0]|0;n=k&255;if(n>>>0>e>>>0){break}i=a+1|0;do if(k<<24>>24<=-1){if((k&255)<194){break a}j=a+2|0;l=a;f=p-l|0;if((k&255)<224){if((f|0)<2){break a}f=h[i>>0]|0;if((f&192|0)!=128){break a}if((f&63|n<<6&1984)>>>0>e>>>0){break a}else {f=o;a=j;break}}m=a+3|0;if((k&255)<240){if((f|0)<3){break a}g=b[j>>0]|0;i=h[i>>0]|0;f=i&224;switch(k<<24>>24){case -32:{if((f|0)!=160){a=l;break a}break}case -19:{if((f|0)!=128){a=l;break a}break}default:if((i&192|0)!=128){a=l;break a}}f=g&255;if((f&192|0)!=128){break a}if((i<<6&4032|n<<12&61440|f&63)>>>0>e>>>0){break a}else {f=o;a=m;break}}if((k&255)>=245){break a}if((d-o|0)>>>0<2|(f|0)<4){break a}g=b[i>>0]|0;f=b[j>>0]|0;i=b[m>>0]|0;j=g&255;switch(k<<24>>24){case -16:{if((g+112&255)>=48){a=l;break a}break}case -12:{if((j&240|0)!=128){a=l;break a}break}default:if((j&192|0)!=128){a=l;break a}}g=f&255;if((g&192|0)!=128){break a}f=i&255;if((f&192|0)!=128){break a}if((j<<12&258048|n<<18&1835008|g<<6&4032|f&63)>>>0>e>>>0){break a}else {f=o+1|0;a=a+4|0;}}else {f=o;a=i;}while(0);o=f+1|0;}return a-q|0}function II(a,c,e,g,i,j,k,l){a=a|0;c=c|0;e=e|0;g=g|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f[e>>2]=a;f[j>>2]=g;s=c;if((((l&4|0?(m=f[e>>2]|0,(s-m|0)>2):0)?(b[m>>0]|0)==-17:0)?(b[m+1>>0]|0)==-69:0)?(b[m+2>>0]|0)==-65:0)f[e>>2]=m+3;r=i;a:while(1){g=f[e>>2]|0;a=g>>>0<c>>>0;if(!a){t=40;break}q=f[j>>2]|0;if(q>>>0>=i>>>0){t=40;break}o=b[g>>0]|0;p=o&255;if(p>>>0>k>>>0){a=2;break}a=g+1|0;do if(o<<24>>24>-1)d[q>>1]=o&255;else {if((o&255)<194){a=2;break a}m=s-g|0;l=g+2|0;if((o&255)<224){if((m|0)<2){a=1;break a}a=h[a>>0]|0;if((a&192|0)!=128){a=2;break a}a=a&63|p<<6&1984;if(a>>>0>k>>>0){a=2;break a}d[q>>1]=a;a=l;break}n=g+3|0;if((o&255)<240){if((m|0)<3){a=1;break a}g=b[l>>0]|0;m=h[a>>0]|0;a=m&224;switch(o<<24>>24){case -32:{if((a|0)!=160){a=2;break a}break}case -19:{if((a|0)!=128){a=2;break a}break}default:if((m&192|0)!=128){a=2;break a}}a=g&255;if((a&192|0)!=128){a=2;break a}a=m<<6&4032|p<<12|a&63;if((a&65535)>>>0>k>>>0){a=2;break a}d[q>>1]=a;a=n;break}if((o&255)>=245){a=2;break a}if((m|0)<4){a=1;break a}m=b[a>>0]|0;a=b[l>>0]|0;g=b[n>>0]|0;n=m&255;switch(o<<24>>24){case -16:{if((m+112&255)>=48){a=2;break a}break}case -12:{if((n&240|0)!=128){a=2;break a}break}default:if((n&192|0)!=128){a=2;break a}}l=a&255;if((l&192|0)!=128){a=2;break a}a=g&255;if((a&192|0)!=128){a=2;break a}if((r-q|0)<4){a=1;break a}g=p&7;m=l<<6;a=a&63;if((n<<12&258048|g<<18|m&4032|a)>>>0>k>>>0){a=2;break a}d[q>>1]=n<<2&60|l>>>4&3|((n>>>4&3|g<<2)<<6)+16320|55296;q=q+2|0;f[j>>2]=q;d[q>>1]=a|m&960|56320;a=(f[e>>2]|0)+4|0;}while(0);f[e>>2]=a;f[j>>2]=(f[j>>2]|0)+2;}if((t|0)==40)a=a&1;return a|0}function JI(a,c,e,g,h,i,k,l){a=a|0;c=c|0;e=e|0;g=g|0;h=h|0;i=i|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0;f[e>>2]=a;f[i>>2]=g;if(l&2)if((h-g|0)<3)a=1;else {f[i>>2]=g+1;b[g>>0]=-17;m=f[i>>2]|0;f[i>>2]=m+1;b[m>>0]=-69;m=f[i>>2]|0;f[i>>2]=m+1;b[m>>0]=-65;m=4;}else m=4;a:do if((m|0)==4){q=c;a=f[e>>2]|0;while(1){if(a>>>0>=c>>>0){a=0;break a}g=d[a>>1]|0;p=g&65535;if(p>>>0>k>>>0){a=2;break a}do if((g&65535)<128){a=f[i>>2]|0;if((h-a|0)<1){a=1;break a}f[i>>2]=a+1;b[a>>0]=g;}else {n=p&63;o=(n|128)&255;if((g&65535)<2048){a=f[i>>2]|0;if((h-a|0)<2){a=1;break a}f[i>>2]=a+1;b[a>>0]=p>>>6|192;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=o;break}l=(p>>>12|224)&255;m=(p>>>6&63|128)&255;if((g&65535)<55296){a=f[i>>2]|0;if((h-a|0)<3){a=1;break a}f[i>>2]=a+1;b[a>>0]=l;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=m;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=o;break}if((g&65535)>=56320){if((g&65535)<57344){a=2;break a}a=f[i>>2]|0;if((h-a|0)<3){a=1;break a}f[i>>2]=a+1;b[a>>0]=l;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=m;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=o;break}if((q-a|0)<4){a=1;break a}a=a+2|0;g=j[a>>1]|0;if((g&64512|0)!=56320){a=2;break a}if((h-(f[i>>2]|0)|0)<4){a=1;break a}l=p&960;if(((l<<10)+65536|n<<10|g&1023)>>>0>k>>>0){a=2;break a}f[e>>2]=a;n=(l>>>6)+1|0;o=f[i>>2]|0;f[i>>2]=o+1;b[o>>0]=n>>>2|240;o=f[i>>2]|0;f[i>>2]=o+1;b[o>>0]=p>>>2&15|n<<4&48|128;o=f[i>>2]|0;f[i>>2]=o+1;b[o>>0]=p<<4&48|g>>>6&15|128;p=f[i>>2]|0;f[i>>2]=p+1;b[p>>0]=g&63|128;}while(0);a=(f[e>>2]|0)+2|0;f[e>>2]=a;}}while(0);return a|0}function KI(a){a=a|0;var b=0,c=0,d=0,e=0;f[a>>2]=17396;d=a+8|0;e=a+12|0;c=0;while(1){b=f[d>>2]|0;if(c>>>0>=(f[e>>2]|0)-b>>2>>>0)break;b=f[b+(c<<2)>>2]|0;if(b|0)lL(b)|0;c=c+1|0;}HL(a+144|0);MI(d);return}function LI(a){a=a|0;KI(a);xL(a);return}function MI(a){a=a|0;var c=0,d=0,e=0,g=0;c=f[a>>2]|0;do if(c|0){d=a+4|0;e=f[d>>2]|0;while(1){if((e|0)==(c|0))break;g=e+-4|0;f[d>>2]=g;e=g;}if((a+16|0)==(c|0)){b[a+128>>0]=0;break}else {xL(c);break}}while(0);return}function NI(a){a=a|0;var c=0;f[a>>2]=17416;c=f[a+8>>2]|0;if(c|0?b[a+12>>0]|0:0)yL(c);return}function OI(a){a=a|0;NI(a);xL(a);return}function PI(a,b){b=b|0;if(b<<24>>24>-1){b=(YI()|0)+((b&255)<<2)|0;b=f[b>>2]&255;}return b|0}function QI(a,c,d){a=a|0;c=c|0;d=d|0;while(1){if((c|0)==(d|0))break;a=b[c>>0]|0;if(a<<24>>24>-1){a=YI()|0;a=f[a+(b[c>>0]<<2)>>2]&255;}b[c>>0]=a;c=c+1|0;}return d|0}function RI(a,b){b=b|0;if(b<<24>>24>-1){b=(XI()|0)+(b<<24>>24<<2)|0;b=f[b>>2]&255;}return b|0}function SI(a,c,d){a=a|0;c=c|0;d=d|0;while(1){if((c|0)==(d|0))break;a=b[c>>0]|0;if(a<<24>>24>-1){a=XI()|0;a=f[a+(b[c>>0]<<2)>>2]&255;}b[c>>0]=a;c=c+1|0;}return d|0}function TI(a,b){b=b|0;return b|0}function UI(a,c,d,e){c=c|0;d=d|0;e=e|0;while(1){if((c|0)==(d|0))break;b[e>>0]=b[c>>0]|0;e=e+1|0;c=c+1|0;}return d|0}function VI(a,b,c){b=b|0;c=c|0;return (b<<24>>24>-1?b:c)|0}function WI(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;while(1){if((c|0)==(d|0))break;a=b[c>>0]|0;b[f>>0]=a<<24>>24>-1?a:e;f=f+1|0;c=c+1|0;}return d|0}function XI(){var a=0;a=Mz()|0;return f[a>>2]|0}function YI(){var a=0;a=Rz()|0;return f[a>>2]|0}function ZI(){var a=0;a=Nz()|0;return f[a>>2]|0}function _I(a){a=a|0;f[a>>2]=17468;HL(a+12|0);return}function $I(a){a=a|0;_I(a);xL(a);return}function aJ(a){a=a|0;return b[a+8>>0]|0}function bJ(a){a=a|0;return b[a+9>>0]|0}function cJ(a,b){a=a|0;b=b|0;GL(a,b+12|0);return}function dJ(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0;g=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;e=FB(57329)|0;if(e>>>0>4294967279)EL();if(e>>>0<11){b[a+11>>0]=e;c=a;}else {h=e+16&-16;c=vL(h)|0;f[a>>2]=c;f[a+8>>2]=h|-2147483648;f[a+4>>2]=e;}MA(c,57329,e)|0;b[d>>0]=0;GB(c+e|0,d);u=g;return}function eJ(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0;g=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;e=FB(57323)|0;if(e>>>0>4294967279)EL();if(e>>>0<11){b[a+11>>0]=e;c=a;}else {h=e+16&-16;c=vL(h)|0;f[a>>2]=c;f[a+8>>2]=h|-2147483648;f[a+4>>2]=e;}MA(c,57323,e)|0;b[d>>0]=0;GB(c+e|0,d);u=g;return}function fJ(a){a=a|0;f[a>>2]=17508;HL(a+16|0);return}function gJ(a){a=a|0;fJ(a);xL(a);return}function hJ(a){a=a|0;return f[a+8>>2]|0}function iJ(a){a=a|0;return f[a+12>>2]|0}function jJ(a,b){a=a|0;b=b|0;GL(a,b+16|0);return}function kJ(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0;g=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;e=OF(17564)|0;if(e>>>0>1073741807)EL();do if(e>>>0>=2){c=e+4&-4;if(c>>>0>1073741823)Gb();else {h=vL(c<<2)|0;f[a>>2]=h;f[a+8>>2]=c|-2147483648;f[a+4>>2]=e;break}}else {b[a+8+3>>0]=e;h=a;}while(0);cB(h,17564,e)|0;f[d>>2]=0;RC(h+(e<<2)|0,d);u=g;return}function lJ(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0;g=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;e=OF(17540)|0;if(e>>>0>1073741807)EL();do if(e>>>0>=2){c=e+4&-4;if(c>>>0>1073741823)Gb();else {h=vL(c<<2)|0;f[a>>2]=h;f[a+8>>2]=c|-2147483648;f[a+4>>2]=e;break}}else {b[a+8+3>>0]=e;h=a;}while(0);cB(h,17540,e)|0;f[d>>2]=0;RC(h+(e<<2)|0,d);u=g;return}function mJ(a){a=a|0;xL(a);return}function nJ(a){a=a|0;xL(a);return}function oJ(a,b,c){a=a|0;b=b|0;c=c|0;if(c>>>0<128){a=(ZI()|0)+(c<<1)|0;a=(d[a>>1]&b)<<16>>16!=0;}else a=0;return a|0}function pJ(a,b,c,e){a=a|0;b=b|0;c=c|0;e=e|0;while(1){if((b|0)==(c|0))break;if((f[b>>2]|0)>>>0<128){a=ZI()|0;a=j[a+(f[b>>2]<<1)>>1]|0;}else a=0;d[e>>1]=a;e=e+2|0;b=b+4|0;}return c|0}function qJ(a,b,c,e){a=a|0;b=b|0;c=c|0;e=e|0;while(1){if((c|0)==(e|0)){c=e;break}if((f[c>>2]|0)>>>0<128?(a=ZI()|0,(d[a+(f[c>>2]<<1)>>1]&b)<<16>>16):0)break;c=c+4|0;}return c|0}function rJ(a,b,c,e){a=a|0;b=b|0;c=c|0;e=e|0;while(1){if((c|0)==(e|0)){c=e;break}if((f[c>>2]|0)>>>0>=128)break;a=ZI()|0;if(!((d[a+(f[c>>2]<<1)>>1]&b)<<16>>16))break;c=c+4|0;}return c|0}function sJ(a,b){b=b|0;if(b>>>0<128){b=(YI()|0)+(b<<2)|0;b=f[b>>2]|0;}return b|0}function tJ(a,b,c){a=a|0;b=b|0;c=c|0;while(1){if((b|0)==(c|0))break;a=f[b>>2]|0;if(a>>>0<128){a=YI()|0;a=f[a+(f[b>>2]<<2)>>2]|0;}f[b>>2]=a;b=b+4|0;}return c|0}function uJ(a,b){b=b|0;if(b>>>0<128){b=(XI()|0)+(b<<2)|0;b=f[b>>2]|0;}return b|0}function vJ(a,b,c){a=a|0;b=b|0;c=c|0;while(1){if((b|0)==(c|0))break;a=f[b>>2]|0;if(a>>>0<128){a=XI()|0;a=f[a+(f[b>>2]<<2)>>2]|0;}f[b>>2]=a;b=b+4|0;}return c|0}function wJ(a,b){b=b|0;return b<<24>>24|0}function xJ(a,c,d,e){c=c|0;d=d|0;e=e|0;while(1){if((c|0)==(d|0))break;f[e>>2]=b[c>>0];e=e+4|0;c=c+1|0;}return d|0}function yJ(a,b,c){b=b|0;c=c|0;return (b>>>0<128?b&255:c)|0}function zJ(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=(d-c|0)>>>2;a=g;g=c;while(1){if((g|0)==(d|0))break;i=f[g>>2]|0;b[a>>0]=i>>>0<128?i&255:e;a=a+1|0;g=g+4|0;}return c+(h<<2)|0}function AJ(a){a=a|0;xL(a);return}function BJ(a){a=a|0;xL(a);return}function CJ(a){a=a|0;xL(a);return}function DJ(a){a=a|0;f[a>>2]=17824;return}function EJ(a){a=a|0;f[a>>2]=17860;return}function FJ(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;f[a+4>>2]=e+-1;f[a>>2]=17416;e=a+8|0;f[e>>2]=c;b[a+12>>0]=d&1;if(!c){d=ZI()|0;f[e>>2]=d;}return}function GJ(a){Gb();}function HJ(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0;h=u;g=u=u+31&-32;u=u+16|0;f[a+4>>2]=c+-1;f[a>>2]=17396;d=a+8|0;IJ(d,28);c=a+144|0;f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;e=FB(55268)|0;if(e>>>0>4294967279)EL();if(e>>>0<11)b[c+11>>0]=e;else {j=e+16&-16;i=vL(j)|0;f[c>>2]=i;f[a+152>>2]=j|-2147483648;f[a+148>>2]=e;c=i;}MA(c,55268,e)|0;b[g>>0]=0;GB(c+e|0,g);c=f[d>>2]|0;d=a+12|0;e=f[d>>2]|0;while(1){if((e|0)==(c|0))break;j=e+-4|0;f[d>>2]=j;e=j;}JJ();KJ(a,58536);LJ();MJ(a,58544);NJ();OJ(a,58552);PJ();QJ(a,58568);RJ();SJ(a,58576);TJ();UJ(a,58584);VJ();WJ(a,58600);XJ();YJ(a,58608);ZJ();_J(a,58616);$J();aK(a,58640);bK();cK(a,58672);dK();eK(a,58680);fK();gK(a,58688);hK();iK(a,58696);jK();kK(a,58704);lK();mK(a,58712);nK();oK(a,58720);pK();qK(a,58728);rK();sK(a,58736);tK();uK(a,58744);vK();wK(a,58752);xK();yK(a,58760);zK();AK(a,58768);BK();CK(a,58784);DK();EK(a,58800);FK();GK(a,58816);HK();IK(a,58832);JK();KK(a,58840);u=h;return}function IJ(a,c){a=a|0;c=c|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;b[a+128>>0]=0;if(c|0){XK(a,c);OK(a,c);}return}function JJ(){f[14635]=0;f[14634]=15060;return}function KJ(a,b){a=a|0;b=b|0;LK(a,b,iD(61028)|0);return}function LJ(){f[14637]=0;f[14636]=15092;return}function MJ(a,b){a=a|0;b=b|0;LK(a,b,iD(61036)|0);return}function NJ(){FJ(58552,0,0,1);return}function OJ(a,b){a=a|0;b=b|0;LK(a,b,iD(61044)|0);return}function PJ(){f[14643]=0;f[14642]=17612;return}function QJ(a,b){a=a|0;b=b|0;LK(a,b,iD(61076)|0);return}function RJ(){f[14645]=0;f[14644]=17680;return}function SJ(a,b){a=a|0;b=b|0;LK(a,b,iD(62836)|0);return}function TJ(){WK(58584,1);return}function UJ(a,b){a=a|0;b=b|0;LK(a,b,iD(62844)|0);return}function VJ(){f[14651]=0;f[14650]=17728;return}function WJ(a,b){a=a|0;b=b|0;LK(a,b,iD(62852)|0);return}function XJ(){f[14653]=0;f[14652]=17776;return}function YJ(a,b){a=a|0;b=b|0;LK(a,b,iD(62860)|0);return}function ZJ(){VK(58616,1);return}function _J(a,b){a=a|0;b=b|0;LK(a,b,iD(61060)|0);return}function $J(){UK(58640,1);return}function aK(a,b){a=a|0;b=b|0;LK(a,b,iD(61084)|0);return}function bK(){f[14669]=0;f[14668]=15124;return}function cK(a,b){a=a|0;b=b|0;LK(a,b,iD(61068)|0);return}function dK(){f[14671]=0;f[14670]=15188;return}function eK(a,b){a=a|0;b=b|0;LK(a,b,iD(61092)|0);return}function fK(){f[14673]=0;f[14672]=15252;return}function gK(a,b){a=a|0;b=b|0;LK(a,b,iD(61100)|0);return}function hK(){f[14675]=0;f[14674]=15304;return}function iK(a,b){a=a|0;b=b|0;LK(a,b,iD(61108)|0);return}function jK(){f[14677]=0;f[14676]=16852;return}function kK(a,b){a=a|0;b=b|0;LK(a,b,iD(62756)|0);return}function lK(){f[14679]=0;f[14678]=16908;return}function mK(a,b){a=a|0;b=b|0;LK(a,b,iD(62764)|0);return}function nK(){f[14681]=0;f[14680]=16964;return}function oK(a,b){a=a|0;b=b|0;LK(a,b,iD(62772)|0);return}function pK(){f[14683]=0;f[14682]=17020;return}function qK(a,b){a=a|0;b=b|0;LK(a,b,iD(62780)|0);return}function rK(){f[14685]=0;f[14684]=17076;return}function sK(a,b){a=a|0;b=b|0;LK(a,b,iD(62788)|0);return}function tK(){f[14687]=0;f[14686]=17104;return}function uK(a,b){a=a|0;b=b|0;LK(a,b,iD(62796)|0);return}function vK(){f[14689]=0;f[14688]=17132;return}function wK(a,b){a=a|0;b=b|0;LK(a,b,iD(62804)|0);return}function xK(){f[14691]=0;f[14690]=17160;return}function yK(a,b){a=a|0;b=b|0;LK(a,b,iD(62812)|0);return}function zK(){f[14693]=0;f[14692]=17592;DJ(58776);f[14692]=15356;f[14694]=15404;return}function AK(a,b){a=a|0;b=b|0;LK(a,b,iD(61920)|0);return}function BK(){f[14697]=0;f[14696]=17592;EJ(58792);f[14696]=15440;f[14698]=15488;return}function CK(a,b){a=a|0;b=b|0;LK(a,b,iD(62732)|0);return}function DK(){var a=0;f[14701]=0;f[14700]=17592;a=gD()|0;f[14702]=a;f[14700]=16804;return}function EK(a,b){a=a|0;b=b|0;LK(a,b,iD(62740)|0);return}function FK(){var a=0;f[14705]=0;f[14704]=17592;a=gD()|0;f[14706]=a;f[14704]=16828;return}function GK(a,b){a=a|0;b=b|0;LK(a,b,iD(62748)|0);return}function HK(){f[14709]=0;f[14708]=17188;return}function IK(a,b){a=a|0;b=b|0;LK(a,b,iD(62820)|0);return}function JK(){f[14711]=0;f[14710]=17220;return}function KK(a,b){a=a|0;b=b|0;LK(a,b,iD(62828)|0);return}function LK(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;jL(b);e=a+8|0;d=f[e>>2]|0;if((f[a+12>>2]|0)-d>>2>>>0>c>>>0)a=e;else {MK(e,c+1|0);a=e;d=f[e>>2]|0;}d=f[d+(c<<2)>>2]|0;if(d|0)lL(d)|0;f[(f[a>>2]|0)+(c<<2)>>2]=b;return}function MK(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,g=0;g=a+4|0;c=f[g>>2]|0;e=f[a>>2]|0;d=c-e>>2;a:do if(d>>>0>=b>>>0){if(d>>>0>b>>>0){a=e+(b<<2)|0;while(1){if((c|0)==(a|0))break a;e=c+-4|0;f[g>>2]=e;c=e;}}}else NK(a,b-d|0);while(0);return}function NK(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,g=0,h=0,i=0,j=0,k=0;i=u;e=u=u+31&-32;u=u+32|0;g=a+8|0;h=a+4|0;c=f[h>>2]|0;do if((f[g>>2]|0)-c>>2>>>0<b>>>0){c=(c-(f[a>>2]|0)>>2)+b|0;d=PK()|0;if(d>>>0<c>>>0)GJ();else {j=f[a>>2]|0;k=(f[g>>2]|0)-j|0;g=k>>1;QK(e,k>>2>>>0<d>>>1>>>0?(g>>>0<c>>>0?c:g):d,(f[h>>2]|0)-j>>2,a+16|0);RK(e,b);SK(a,e);TK(e);break}}else OK(a,b);while(0);u=i;return}function OK(a,b){a=a|0;b=b|0;var c=0;c=a+4|0;a=b;b=f[c>>2]|0;do{f[b>>2]=0;b=(f[c>>2]|0)+4|0;f[c>>2]=b;a=a+-1|0;}while((a|0)!=0);return}function PK(a){return 1073741823}function QK(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0;f[a+12>>2]=0;f[a+16>>2]=e;do if(c){g=e+112|0;if(c>>>0<29&(b[g>>0]|0)==0){b[g>>0]=1;break}else {e=vL(c<<2)|0;break}}else e=0;while(0);f[a>>2]=e;d=e+(d<<2)|0;f[a+8>>2]=d;f[a+4>>2]=d;f[a+12>>2]=e+(c<<2);return}function RK(a,b){a=a|0;b=b|0;var c=0;c=a+8|0;a=b;b=f[c>>2]|0;do{f[b>>2]=0;b=(f[c>>2]|0)+4|0;f[c>>2]=b;a=a+-1|0;}while((a|0)!=0);return}function SK(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,g=0,h=0;d=f[a>>2]|0;h=a+4|0;g=b+4|0;e=(f[h>>2]|0)-d|0;c=(f[g>>2]|0)+(0-(e>>2)<<2)|0;f[g>>2]=c;if((e|0)>0){oN(c|0,d|0,e|0)|0;d=g;c=f[g>>2]|0;}else d=g;g=f[a>>2]|0;f[a>>2]=c;f[d>>2]=g;g=b+8|0;e=f[h>>2]|0;f[h>>2]=f[g>>2];f[g>>2]=e;g=a+8|0;h=b+12|0;a=f[g>>2]|0;f[g>>2]=f[h>>2];f[h>>2]=a;f[b>>2]=f[d>>2];return}function TK(a){a=a|0;var c=0,d=0,e=0,g=0;c=f[a+4>>2]|0;d=a+8|0;e=f[d>>2]|0;while(1){if((e|0)==(c|0))break;g=e+-4|0;f[d>>2]=g;e=g;}d=f[a>>2]|0;do if(d|0){c=f[a+16>>2]|0;if((c|0)==(d|0)){b[c+112>>0]=0;break}else {xL(d);break}}while(0);return}function UK(a,b){a=a|0;b=b|0;f[a+4>>2]=b+-1;f[a>>2]=17508;f[a+8>>2]=46;f[a+12>>2]=44;b=a+16|0;f[b>>2]=0;f[b+4>>2]=0;f[b+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[b+(a<<2)>>2]=0;a=a+1|0;}return}function VK(a,c){a=a|0;c=c|0;f[a+4>>2]=c+-1;f[a>>2]=17468;b[a+8>>0]=46;b[a+9>>0]=44;c=a+12|0;f[c>>2]=0;f[c+4>>2]=0;f[c+8>>2]=0;a=0;while(1){if((a|0)==3)break;f[c+(a<<2)>>2]=0;a=a+1|0;}return}function WK(a,b){a=a|0;b=b|0;f[a+4>>2]=b+-1;f[a>>2]=17348;b=gD()|0;f[a+8>>2]=b;return}function XK(a,c){a=a|0;c=c|0;var d=0;if((PK()|0)>>>0<c>>>0)GJ();d=a+128|0;if(c>>>0<29&(b[d>>0]|0)==0){b[d>>0]=1;d=a+16|0;}else d=vL(c<<2)|0;f[a+4>>2]=d;f[a>>2]=d;f[a+8>>2]=d+(c<<2);return}function YK(){if((b[58848]|0)==0?YM(58848)|0:0){ZK()|0;f[15718]=62868;}return f[15718]|0}function ZK(){_K();f[15717]=58856;return 62868}function _K(){HJ(58856,1);return}function $K(){aL(62876,YK()|0);return 62876}function aL(a,b){a=a|0;b=b|0;b=f[b>>2]|0;f[a>>2]=b;jL(b);return}function bL(){if((b[59016]|0)==0?YM(59016)|0:0){$K()|0;f[15720]=62876;}return f[15720]|0}function cL(a){a=a|0;var b=0;b=bL()|0;b=f[b>>2]|0;f[a>>2]=b;jL(b);return}function dL(a,b,c){a=a|0;b=b|0;c=c|0;if(!c)a=0;else a=Uz(a,b,c)|0;return a|0}function fL(a,b){return 0}function gL(a){return}function hL(a){a=a|0;xL(a);return}function iL(a){return 57431}function jL(a){a=a|0;kL(a+4|0);return}function kL(a){a=a|0;f[a>>2]=(f[a>>2]|0)+1;return}function lL(a){a=a|0;if((mL(a+4|0)|0)==-1){dd[f[(f[a>>2]|0)+8>>2]&511](a);a=1;}else a=0;return a|0}function mL(a){a=a|0;var b=0;b=f[a>>2]|0;f[a>>2]=b+-1;return b+-1|0}function nL(a){a=a|0;jL(a);return}function oL(a){a=a|0;kL(a+8|0);return}function pL(a){a=a|0;if(lL(a)|0)qL(a);return}function qL(a){a=a|0;var b=0;b=a+8|0;if(!((f[b>>2]|0)!=0?(mL(b)|0)!=-1:0))dd[f[(f[a>>2]|0)+16>>2]&511](a);return}function rL(a){a=a|0;var b=0,c=0,d=0;c=a+4|0;b=f[c>>2]|0;while(1){if((b|0)==-1){a=0;break}d=f[c>>2]|0;if((d|0)==(b|0))f[c>>2]=b+1;if((d|0)==(b|0))break;b=d;}return a|0}function sL(a){a=a|0;a=sN()|0;if(!a)return;else bM();}function uL(a,b,c){a=a|0;b=b|0;c=c|0;while(1){if((f[a>>2]|0)!=1)break;Nb(62912,62884)|0;}if(!(f[a>>2]|0)){f[a>>2]=1;dd[c&511](b);f[a>>2]=-1;}return}function vL(a){a=a|0;var b=0;b=(a|0)==0?1:a;while(1){a=Lx(b)|0;if(a|0)break;a=_M()|0;if(!a){a=0;break}cd[a&7]();}return a|0}function wL(a){a=a|0;return vL(a)|0}function xL(a){a=a|0;Mx(a);return}function yL(a){a=a|0;xL(a);return}function zL(){Gb();}function AL(a,b){a=a|0;b=b|0;var c=0,d=0;d=ky(b)|0;c=vL(d+13|0)|0;f[c>>2]=d;f[c+4>>2]=d;f[c+8>>2]=0;c=BL(c)|0;oN(c|0,b|0,d+1|0)|0;f[a>>2]=c;return}function BL(a){a=a|0;return a+12|0}function CL(a,b){a=a|0;b=b|0;f[a>>2]=18e3;AL(a+4|0,b);return}function EL(a){Gb();}function FL(a){Gb();}function GL(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0;g=u;d=u=u+31&-32;u=u+16|0;f[a>>2]=0;f[a+4>>2]=0;f[a+8>>2]=0;if((b[c+11>>0]|0)<0){e=f[c>>2]|0;c=f[c+4>>2]|0;if(c>>>0>4294967279)EL();if(c>>>0<11)b[a+11>>0]=c;else {i=c+16&-16;h=vL(i)|0;f[a>>2]=h;f[a+8>>2]=i|-2147483648;f[a+4>>2]=c;a=h;}MA(a,e,c)|0;b[d>>0]=0;GB(a+c|0,d);}else {f[a>>2]=f[c>>2];f[a+4>>2]=f[c+4>>2];f[a+8>>2]=f[c+8>>2];}u=g;return}function HL(a){a=a|0;if((b[a+11>>0]|0)<0)xL(f[a>>2]|0);return}function IL(a,c){a=a|0;c=c|0;var d=0,e=0;if((a|0)!=(c|0)){d=b[c+11>>0]|0;e=d<<24>>24<0;JL(a,e?f[c>>2]|0:c,e?f[c+4>>2]|0:d&255)|0;}return a|0}function JL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0;k=u;i=u=u+31&-32;u=u+16|0;j=a+11|0;e=b[j>>0]|0;g=e<<24>>24<0;if(g)h=(f[a+8>>2]&2147483647)+-1|0;else h=10;do if(h>>>0>=d>>>0){if(g)e=f[a>>2]|0;else e=a;KL(e,c,d)|0;b[i>>0]=0;GB(e+d|0,i);if((b[j>>0]|0)<0){f[a+4>>2]=d;break}else {b[j>>0]=d;break}}else {if(g)e=f[a+4>>2]|0;else e=e&255;LL(a,h,d-h|0,e,0,e,d,c);}while(0);u=k;return a|0}function KL(a,b,c){a=a|0;b=b|0;c=c|0;if(c|0)pN(a|0,b|0,c|0)|0;return a|0}function LL(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;o=u;n=u=u+31&-32;u=u+16|0;if((-18-c|0)>>>0<d>>>0)EL();if((b[a+11>>0]|0)<0)m=f[a>>2]|0;else m=a;if(c>>>0<2147483623){k=d+c|0;l=c<<1;k=k>>>0<l>>>0?l:k;k=k>>>0<11?11:k+16&-16;}else k=-17;l=vL(k)|0;if(g|0)MA(l,m,g)|0;if(i|0)MA(l+g|0,j,i)|0;d=e-h|0;e=d-g|0;if(e|0)MA(l+g+i|0,m+g+h|0,e)|0;if((c|0)!=10)xL(m);f[a>>2]=l;f[a+8>>2]=k|-2147483648;i=d+i|0;f[a+4>>2]=i;b[n>>0]=0;GB(l+i|0,n);u=o;return}function ML(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0;if(c>>>0>4294967279)EL();i=a+11|0;e=b[i>>0]|0;g=e<<24>>24<0;if(g){j=f[a+4>>2]|0;d=(f[a+8>>2]&2147483647)+-1|0;}else {j=e&255;d=10;}h=j>>>0>c>>>0?j:c;c=h>>>0<11;h=c?10:(h+16&-16)+-1|0;do if((h|0)!=(d|0)){do if(c){c=f[a>>2]|0;if(g){g=0;d=c;c=a;e=13;}else {MA(a,c,(e&255)+1|0)|0;xL(c);e=15;}}else {c=vL(h+1|0)|0;if(g){g=1;d=f[a>>2]|0;e=13;break}else {MA(c,a,(e&255)+1|0)|0;e=14;break}}while(0);if((e|0)==13){MA(c,d,(f[a+4>>2]|0)+1|0)|0;xL(d);if(g)e=14;else e=15;}if((e|0)==14){f[a+8>>2]=h+1|-2147483648;f[a+4>>2]=j;f[a>>2]=c;break}else if((e|0)==15){b[i>>0]=j;break}}while(0);return}function NL(a,b){a=a|0;b=b|0;return JL(a,b,FB(b)|0)|0}function OL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0;j=u;g=u=u+31&-32;u=u+16|0;h=a+11|0;e=b[h>>0]|0;i=e<<24>>24<0;if(i)e=f[a+4>>2]|0;else e=e&255;do if(e>>>0>=c>>>0)if(i){i=(f[a>>2]|0)+c|0;b[g>>0]=0;GB(i,g);f[a+4>>2]=c;break}else {b[g>>0]=0;GB(a+c|0,g);b[h>>0]=c;break}else PL(a,c-e|0,d)|0;while(0);u=j;return}function PL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0;l=u;j=u=u+31&-32;u=u+16|0;if(c|0){k=a+11|0;e=b[k>>0]|0;if(e<<24>>24<0){h=f[a+4>>2]|0;g=(f[a+8>>2]&2147483647)+-1|0;}else {h=e&255;g=10;}i=h+c|0;if((g-h|0)>>>0<c>>>0){QL(a,g,i-g|0,h,h,0,0);e=b[k>>0]|0;}if(e<<24>>24<0)e=f[a>>2]|0;else e=a;EG(e+h|0,c,d)|0;if((b[k>>0]|0)<0)f[a+4>>2]=i;else b[k>>0]=i;b[j>>0]=0;GB(e+i|0,j);}u=l;return a|0}function QL(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0;if((-17-c|0)>>>0<d>>>0)EL();if((b[a+11>>0]|0)<0)l=f[a>>2]|0;else l=a;if(c>>>0<2147483623){j=d+c|0;k=c<<1;j=j>>>0<k>>>0?k:j;j=j>>>0<11?11:j+16&-16;}else j=-17;k=vL(j)|0;if(g|0)MA(k,l,g)|0;d=e-h-g|0;if(d|0)MA(k+g+i|0,l+g+h|0,d)|0;if((c|0)!=10)xL(l);f[a>>2]=k;f[a+8>>2]=j|-2147483648;return}function RL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0;l=u;j=u=u+31&-32;u=u+16|0;k=a+11|0;e=b[k>>0]|0;i=e<<24>>24<0;if(i){g=f[a+4>>2]|0;e=(f[a+8>>2]&2147483647)+-1|0;}else {g=e&255;e=10;}h=g+d|0;if((e-g|0)>>>0>=d>>>0){if(d|0){if(i)e=f[a>>2]|0;else e=a;MA(e+g|0,c,d)|0;if((b[k>>0]|0)<0)f[a+4>>2]=h;else b[k>>0]=h;b[j>>0]=0;GB(e+h|0,j);}}else LL(a,e,h-e|0,g,g,0,d,c);u=l;return a|0}function SL(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0;j=u;i=u=u+31&-32;u=u+16|0;h=i;i=i+1|0;b[h>>0]=c;e=a+11|0;c=b[e>>0]|0;d=c<<24>>24<0;if(d){g=f[a+4>>2]|0;c=(f[a+8>>2]&2147483647)+-1|0;}else {g=c&255;c=10;}if((g|0)==(c|0)){QL(a,c,1,c,c,0,0);c=c+1|0;if((b[e>>0]|0)<0)d=8;else d=7;}else {c=g+1|0;if(d)d=8;else d=7;}if((d|0)==7){b[e>>0]=c;c=a;}else if((d|0)==8){e=f[a>>2]|0;f[a+4>>2]=c;c=e;}a=c+g|0;GB(a,h);b[i>>0]=0;GB(a+1|0,i);u=j;return}function TL(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;h=b[a+11>>0]|0;i=h<<24>>24<0;if(i)h=f[a+4>>2]|0;else h=h&255;if((g|0)==-1|h>>>0<c>>>0)FL();h=h-c|0;d=h>>>0<d>>>0?h:d;if(i)a=f[a>>2]|0;h=d>>>0>g>>>0;a=dL(a+c|0,e,h?g:d)|0;if(!a)return (d>>>0<g>>>0?-1:h&1)|0;else return a|0;}function UL(a){a=a|0;if((b[a+8+3>>0]|0)<0)xL(f[a>>2]|0);return}function VL(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0;l=u;j=u=u+31&-32;u=u+16|0;e=a+8|0;k=e+3|0;h=b[k>>0]|0;i=h<<24>>24<0;if(i)g=(f[e>>2]&2147483647)+-1|0;else g=1;do if(g>>>0>=d>>>0){if(i)e=f[a>>2]|0;else e=a;WL(e,c,d)|0;f[j>>2]=0;RC(e+(d<<2)|0,j);if((b[k>>0]|0)<0){f[a+4>>2]=d;break}else {b[k>>0]=d;break}}else {if(i)e=f[a+4>>2]|0;else e=h&255;XL(a,g,d-g|0,e,0,e,d,c);}while(0);u=l;return a|0}function WL(a,b,c){a=a|0;b=b|0;c=c|0;if(c)Yz(a,b,c)|0;return a|0}function XL(a,c,d,e,g,h,i,j){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;p=u;o=u=u+31&-32;u=u+16|0;if((1073741806-c|0)>>>0<d>>>0)EL();l=a+8|0;if((b[l+3>>0]|0)<0)n=f[a>>2]|0;else n=a;if(c>>>0<536870887){d=d+c|0;k=c<<1;d=d>>>0<k>>>0?k:d;d=d>>>0<2?2:d+4&-4;if(d>>>0>1073741823)Gb();else m=d;}else m=1073741807;k=vL(m<<2)|0;if(g|0)cB(k,n,g)|0;if(i|0)cB(k+(g<<2)|0,j,i)|0;d=e-h|0;e=d-g|0;if(e|0)cB(k+(g<<2)+(i<<2)|0,n+(g<<2)+(h<<2)|0,e)|0;if((c|0)!=1)xL(n);f[a>>2]=k;f[l>>2]=m|-2147483648;i=d+i|0;f[a+4>>2]=i;f[o>>2]=0;RC(k+(i<<2)|0,o);u=p;return}function YL(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0,k=0;if(c>>>0>1073741807)EL();k=a+8|0;i=k+3|0;e=b[i>>0]|0;g=e<<24>>24<0;if(g){j=f[a+4>>2]|0;d=(f[k>>2]&2147483647)+-1|0;}else {j=e&255;d=1;}h=j>>>0>c>>>0?j:c;c=h>>>0<2;h=c?1:(h+4&-4)+-1|0;do if((h|0)!=(d|0)){do if(c){c=f[a>>2]|0;if(g){g=0;d=c;c=a;e=15;}else {cB(a,c,(e&255)+1|0)|0;xL(c);e=17;}}else {c=h+1|0;if(c>>>0>1073741823)Gb();c=vL(c<<2)|0;if(g){g=1;d=f[a>>2]|0;e=15;break}else {cB(c,a,(e&255)+1|0)|0;e=16;break}}while(0);if((e|0)==15){cB(c,d,(f[a+4>>2]|0)+1|0)|0;xL(d);if(g)e=16;else e=17;}if((e|0)==16){f[k>>2]=h+1|-2147483648;f[a+4>>2]=j;f[a>>2]=c;break}else if((e|0)==17){b[i>>0]=j;break}}while(0);return}function ZL(a,b){a=a|0;b=b|0;return VL(a,b,OF(b)|0)|0}function _L(a,c,d,e,g,h,i){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0;if((1073741807-c|0)>>>0<d>>>0)EL();m=a+8|0;if((b[m+3>>0]|0)<0)l=f[a>>2]|0;else l=a;if(c>>>0<536870887){d=d+c|0;j=c<<1;d=d>>>0<j>>>0?j:d;d=d>>>0<2?2:d+4&-4;if(d>>>0>1073741823)Gb();else k=d;}else k=1073741807;j=vL(k<<2)|0;if(g|0)cB(j,l,g)|0;d=e-h-g|0;if(d|0)cB(j+(g<<2)+(i<<2)|0,l+(g<<2)+(h<<2)|0,d)|0;if((c|0)!=1)xL(l);f[a>>2]=j;f[m>>2]=k|-2147483648;return}function $L(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0,j=0,k=0,l=0;l=u;j=u=u+31&-32;u=u+16|0;g=a+8|0;k=g+3|0;e=b[k>>0]|0;i=e<<24>>24<0;if(i){h=f[a+4>>2]|0;e=(f[g>>2]&2147483647)+-1|0;}else {h=e&255;e=1;}g=h+d|0;if((e-h|0)>>>0>=d>>>0){if(d|0){if(i)e=f[a>>2]|0;else e=a;cB(e+(h<<2)|0,c,d)|0;if((b[k>>0]|0)<0)f[a+4>>2]=g;else b[k>>0]=g;f[j>>2]=0;RC(e+(g<<2)|0,j);}}else XL(a,e,g-e|0,h,h,0,d,c);u=l;return a|0}function aM(a,c){a=a|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0,k=0;k=u;j=u=u+31&-32;u=u+16|0;i=j;j=j+4|0;f[i>>2]=c;d=a+8|0;g=d+3|0;c=b[g>>0]|0;e=c<<24>>24<0;if(e){h=f[a+4>>2]|0;c=(f[d>>2]&2147483647)+-1|0;}else {h=c&255;c=1;}if((h|0)==(c|0)){_L(a,c,1,c,c,0,0);c=c+1|0;if((b[g>>0]|0)<0)d=8;else d=7;}else {c=h+1|0;if(e)d=8;else d=7;}if((d|0)==7){b[g>>0]=c;c=a;}else if((d|0)==8){g=f[a>>2]|0;f[a+4>>2]=c;c=g;}a=c+(h<<2)|0;RC(a,i);f[j>>2]=0;RC(a+4|0,j);u=k;return}function bM(a,b){Gb();}function cM(){var a=0,b=0,c=0,d=0,e=0,g=0,h=0,i=0;e=u=u+31&-32;u=u+48|0;h=e+32|0;c=e+24|0;i=e+16|0;g=e;e=e+36|0;a=dM()|0;if(a|0?(d=f[a>>2]|0,d|0):0){a=d+48|0;b=f[a>>2]|0;a=f[a+4>>2]|0;if(!((b&-256|0)==1126902528&(a|0)==1129074247)){f[c>>2]=57764;eM(57714,c);}if((b|0)==1126902529&(a|0)==1129074247)a=f[d+44>>2]|0;else a=d+80|0;f[e>>2]=a;d=f[d>>2]|0;a=f[d+4>>2]|0;if(Wc[f[(f[1002]|0)+16>>2]&63](4008,d,e)|0){i=f[e>>2]|0;i=Uc[f[(f[i>>2]|0)+8>>2]&127](i)|0;f[g>>2]=57764;f[g+4>>2]=a;f[g+8>>2]=i;eM(57628,g);}else {f[i>>2]=57764;f[i+4>>2]=a;eM(57673,i);}}eM(57752,h);}function dM(){var a=0,b=0;a=u;b=u=u+31&-32;u=u+16|0;if(!(Tb(62960,5)|0)){b=Ob(f[15741]|0)|0;u=a;return b|0}else eM(57903,b);return 0}function eM(a,b){a=a|0;b=b|0;var c=0;c=u=u+31&-32;u=u+16|0;f[c>>2]=b;b=f[2709]|0;Uy(b,a,c)|0;oz(10,b)|0;Gb();}function fM(a){return}function gM(a){a=a|0;xL(a);return}function hM(a){return}function iM(a){return}function jM(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,g=0,h=0;h=u;e=u=u+31&-32;u=u+64|0;if(!(nM(a,b)|0))if((b|0)!=0?(g=rM(b,4032,4016,0)|0,(g|0)!=0):0){b=e+4|0;d=b+52|0;do{f[b>>2]=0;b=b+4|0;}while((b|0)<(d|0));f[e>>2]=g;f[e+8>>2]=a;f[e+12>>2]=-1;f[e+48>>2]=1;gd[f[(f[g>>2]|0)+28>>2]&31](g,e,f[c>>2]|0,1);if((f[e+24>>2]|0)==1){f[c>>2]=f[e+16>>2];b=1;}else b=0;}else b=0;else b=1;u=h;return b|0}function kM(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;if(nM(a,f[b+8>>2]|0)|0)qM(0,b,c,d,e);return}function lM(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;var h=0;do if(!(nM(a,f[c+8>>2]|0)|0)){if(nM(a,f[c>>2]|0)|0){a=c+32|0;if((f[c+16>>2]|0)!=(d|0)?(h=c+20|0,(f[h>>2]|0)!=(d|0)):0){f[a>>2]=e;f[h>>2]=d;e=c+40|0;f[e>>2]=(f[e>>2]|0)+1;if((f[c+36>>2]|0)==1?(f[c+24>>2]|0)==2:0)b[c+54>>0]=1;f[c+44>>2]=4;break}if((e|0)==1)f[a>>2]=1;}}else pM(0,c,d,e);while(0);return}function mM(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(nM(a,f[b+8>>2]|0)|0)oM(0,b,c,d);return}function nM(a,b,c){a=a|0;b=b|0;return (a|0)==(b|0)|0}function oM(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0;a=c+16|0;g=f[a>>2]|0;h=c+36|0;i=c+24|0;do if(g){if((g|0)!=(d|0)){f[h>>2]=(f[h>>2]|0)+1;f[i>>2]=2;b[c+54>>0]=1;break}if((f[i>>2]|0)==2)f[i>>2]=e;}else {f[a>>2]=d;f[i>>2]=e;f[h>>2]=1;}while(0);return}function pM(a,b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((f[b+4>>2]|0)==(c|0)?(e=b+28|0,(f[e>>2]|0)!=1):0)f[e>>2]=d;return}function qM(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0;b[c+53>>0]=1;do if((f[c+4>>2]|0)==(e|0)){b[c+52>>0]=1;e=c+16|0;h=f[e>>2]|0;j=c+54|0;k=c+48|0;i=c+24|0;a=c+36|0;if(!h){f[e>>2]=d;f[i>>2]=g;f[a>>2]=1;if(!((f[k>>2]|0)==1&(g|0)==1))break;b[j>>0]=1;break}if((h|0)!=(d|0)){f[a>>2]=(f[a>>2]|0)+1;b[j>>0]=1;break}a=f[i>>2]|0;if((a|0)==2){f[i>>2]=g;a=g;}if((f[k>>2]|0)==1&(a|0)==1)b[j>>0]=1;}while(0);return}function rM(a,c,e,g){a=a|0;c=c|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;p=u;n=u=u+31&-32;u=u+64|0;m=f[a>>2]|0;o=a+(f[m+-8>>2]|0)|0;m=f[m+-4>>2]|0;f[n>>2]=e;f[n+4>>2]=a;f[n+8>>2]=c;f[n+12>>2]=g;a=n+16|0;c=n+20|0;g=n+24|0;h=n+28|0;i=n+32|0;j=n+40|0;k=a;l=k+36|0;do{f[k>>2]=0;k=k+4|0;}while((k|0)<(l|0));d[a+36>>1]=0;b[a+38>>0]=0;a:do if(nM(m,e)|0){f[n+48>>2]=1;id[f[(f[m>>2]|0)+20>>2]&15](m,n,o,o,1,0);a=(f[g>>2]|0)==1?o:0;}else {hd[f[(f[m>>2]|0)+24>>2]&63](m,n,o,1,0);switch(f[n+36>>2]|0){case 0:{a=(f[j>>2]|0)==1&(f[h>>2]|0)==1&(f[i>>2]|0)==1?f[c>>2]|0:0;break a}case 1:break;default:{a=0;break a}}if((f[g>>2]|0)!=1?!((f[j>>2]|0)==0&(f[h>>2]|0)==1&(f[i>>2]|0)==1):0){a=0;break}a=f[a>>2]|0;}while(0);u=p;return a|0}function sM(a){a=a|0;xL(a);return}function tM(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;if(nM(a,f[b+8>>2]|0)|0)qM(0,b,c,d,e);else {a=f[a+8>>2]|0;id[f[(f[a>>2]|0)+20>>2]&15](a,b,c,d,e,g);}return}function uM(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0;do if(!(nM(a,f[c+8>>2]|0)|0)){h=a+8|0;if(!(nM(a,f[c>>2]|0)|0)){j=f[h>>2]|0;hd[f[(f[j>>2]|0)+24>>2]&63](j,c,d,e,g);break}a=c+32|0;if((f[c+16>>2]|0)!=(d|0)?(i=c+20|0,(f[i>>2]|0)!=(d|0)):0){f[a>>2]=e;e=c+44|0;if((f[e>>2]|0)==4)break;a=c+52|0;b[a>>0]=0;k=c+53|0;b[k>>0]=0;h=f[h>>2]|0;id[f[(f[h>>2]|0)+20>>2]&15](h,c,d,d,1,g);if(b[k>>0]|0)if(!(b[a>>0]|0)){a=3;j=11;}else a=3;else {a=4;j=11;}if((j|0)==11){f[i>>2]=d;k=c+40|0;f[k>>2]=(f[k>>2]|0)+1;if((f[c+36>>2]|0)==1?(f[c+24>>2]|0)==2:0)b[c+54>>0]=1;}f[e>>2]=a;break}if((e|0)==1)f[a>>2]=1;}else pM(0,c,d,e);while(0);return}function vM(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if(nM(a,f[b+8>>2]|0)|0)oM(0,b,c,d);else {a=f[a+8>>2]|0;gd[f[(f[a>>2]|0)+28>>2]&31](a,b,c,d);}return}function xM(){var a=0,b=0;a=u;b=u=u+31&-32;u=u+16|0;if(!(Qb(62964,458)|0)){u=a;return}else eM(57952,b);}function yM(a){a=a|0;var b=0,c=0;b=u;c=u=u+31&-32;u=u+16|0;Mx(a);if(!(Ub(f[15741]|0,0)|0)){u=b;return}else eM(58002,c);}function DM(a){a=a|0;f[a>>2]=18e3;HM(a+4|0);return}function EM(a){a=a|0;DM(a);xL(a);return}function FM(a){a=a|0;return GM(a+4|0)|0}function GM(a){a=a|0;return f[a>>2]|0}function HM(a){a=a|0;var b=0,c=0;if((b=IM(f[a>>2]|0)|0,c=b+8|0,a=f[c>>2]|0,f[c>>2]=a+-1,(a+-1|0)<0))xL(b);return}function IM(a){a=a|0;return a+-12|0}function JM(a){a=a|0;DM(a);xL(a);return}function KM(a){a=a|0;xL(a);return}function LM(a,b,c){a=a|0;b=b|0;return nM(a,b)|0}function MM(a){a=a|0;xL(a);return}function NM(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,g=0,h=0,i=0,j=0;j=u;h=u=u+31&-32;u=u+64|0;f[c>>2]=f[f[c>>2]>>2];if(!(OM(a,b)|0))if(((b|0)!=0?(d=rM(b,4032,4120,0)|0,(d|0)!=0):0)?(f[d+8>>2]&~f[a+8>>2]|0)==0:0){a=a+12|0;b=d+12|0;if(!(nM(f[a>>2]|0,f[b>>2]|0)|0)?!(nM(f[a>>2]|0,4152)|0):0){a=f[a>>2]|0;if((((a|0)!=0?(g=rM(a,4032,4016,0)|0,(g|0)!=0):0)?(e=f[b>>2]|0,(e|0)!=0):0)?(i=rM(e,4032,4016,0)|0,(i|0)!=0):0){a=h+4|0;b=a+52|0;do{f[a>>2]=0;a=a+4|0;}while((a|0)<(b|0));f[h>>2]=i;f[h+8>>2]=g;f[h+12>>2]=-1;f[h+48>>2]=1;gd[f[(f[i>>2]|0)+28>>2]&31](i,h,f[c>>2]|0,1);if((f[h+24>>2]|0)==1){f[c>>2]=f[h+16>>2];a=1;}else a=0;}else a=0;}else a=1;}else a=0;else a=1;u=j;return a|0}function OM(a,b,c){a=a|0;b=b|0;if(nM(a,b)|0)a=1;else a=nM(b,4160)|0;return a|0}function PM(a){a=a|0;xL(a);return}function QM(a,b,c){a=a|0;b=b|0;return nM(a,b)|0}function RM(a){a=a|0;xL(a);return}function SM(a,c,d,e,g,h){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if(nM(a,f[c+8>>2]|0)|0)qM(0,c,d,e,g);else {p=c+52|0;i=b[p>>0]|0;j=c+53|0;k=b[j>>0]|0;o=f[a+12>>2]|0;l=a+16+(o<<3)|0;b[p>>0]=0;b[j>>0]=0;WM(a+16|0,c,d,e,g,h);a:do if((o|0)>1){m=c+24|0;n=c+54|0;o=a+8|0;a=a+24|0;do{if(b[n>>0]|0)break a;if(!(b[p>>0]|0)){if(b[j>>0]|0?(f[o>>2]&1|0)==0:0)break a}else {if((f[m>>2]|0)==1)break a;if(!(f[o>>2]&2))break a}b[p>>0]=0;b[j>>0]=0;WM(a,c,d,e,g,h);a=a+8|0;}while(a>>>0<l>>>0)}while(0);b[p>>0]=i;b[j>>0]=k;}return}function TM(a,c,d,e,g){a=a|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a:do if(!(nM(a,f[c+8>>2]|0)|0)){i=a+12|0;q=c+24|0;r=c+36|0;s=c+54|0;o=a+8|0;m=a+16|0;if(!(nM(a,f[c>>2]|0)|0)){p=f[i>>2]|0;j=a+16+(p<<3)|0;XM(m,c,d,e,g);h=a+24|0;if((p|0)<=1)break;i=f[o>>2]|0;if((i&2|0)==0?(f[r>>2]|0)!=1:0){if(!(i&1))while(1){if(b[s>>0]|0)break a;if((f[r>>2]|0)==1)break a;XM(h,c,d,e,g);h=h+8|0;if(h>>>0>=j>>>0)break a}while(1){if(b[s>>0]|0)break a;if((f[r>>2]|0)==1?(f[q>>2]|0)==1:0)break a;XM(h,c,d,e,g);h=h+8|0;if(h>>>0>=j>>>0)break a}}while(1){if(b[s>>0]|0)break a;XM(h,c,d,e,g);h=h+8|0;if(h>>>0>=j>>>0)break a}}h=c+32|0;if((f[c+16>>2]|0)!=(d|0)?(p=c+20|0,(f[p>>2]|0)!=(d|0)):0){f[h>>2]=e;n=c+44|0;if((f[n>>2]|0)==4)break;e=a+16+(f[i>>2]<<3)|0;k=c+52|0;l=c+53|0;h=0;a=m;j=0;b:while(1){if(a>>>0>=e>>>0){i=18;break}b[k>>0]=0;b[l>>0]=0;WM(a,c,d,d,1,g);if(b[s>>0]|0){i=18;break}do if(b[l>>0]|0){if(!(b[k>>0]|0))if(!(f[o>>2]&1)){h=1;i=18;break b}else {h=1;i=j;break}if((f[q>>2]|0)==1){i=23;break b}if(!(f[o>>2]&2)){i=23;break b}else {h=1;i=1;}}else i=j;while(0);a=a+8|0;j=i;}do if((i|0)==18){if((!j?(f[p>>2]=d,d=c+40|0,f[d>>2]=(f[d>>2]|0)+1,(f[r>>2]|0)==1):0)?(f[q>>2]|0)==2:0){b[s>>0]=1;if(h){i=23;break}else {h=4;break}}if(h)i=23;else h=4;}while(0);if((i|0)==23)h=3;f[n>>2]=h;break}if((e|0)==1)f[h>>2]=1;}else pM(0,c,d,e);while(0);return}function UM(a,c,d,e){a=a|0;c=c|0;d=d|0;e=e|0;var g=0,h=0;a:do if(!(nM(a,f[c+8>>2]|0)|0)){h=f[a+12>>2]|0;g=a+16+(h<<3)|0;VM(a+16|0,c,d,e);if((h|0)>1){h=c+54|0;a=a+24|0;do{VM(a,c,d,e);if(b[h>>0]|0)break a;a=a+8|0;}while(a>>>0<g>>>0)}}else oM(0,c,d,e);while(0);return}function VM(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0;g=f[a+4>>2]|0;e=g>>8;if(g&1)e=f[(f[c>>2]|0)+e>>2]|0;a=f[a>>2]|0;gd[f[(f[a>>2]|0)+28>>2]&31](a,b,c+e|0,g&2|0?d:2);return}function WM(a,b,c,d,e,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;g=g|0;var h=0,i=0;i=f[a+4>>2]|0;h=i>>8;if(i&1)h=f[(f[d>>2]|0)+h>>2]|0;a=f[a>>2]|0;id[f[(f[a>>2]|0)+20>>2]&15](a,b,c,d+h|0,i&2|0?e:2,g);return}function XM(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0;h=f[a+4>>2]|0;g=h>>8;if(h&1)g=f[(f[c>>2]|0)+g>>2]|0;a=f[a>>2]|0;hd[f[(f[a>>2]|0)+24>>2]&63](a,b,c+g|0,h&2|0?d:2,e);return}function YM(a){a=a|0;if((b[a>>0]|0)==1)a=0;else {b[a>>0]=1;a=1;}return a|0}function _M(){var a=0;a=f[15742]|0;f[15742]=a+0;return a|0}
		function $M(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=u;d=u=u+31&-32;u=u+16|0;f[d>>2]=f[c>>2];a=Wc[f[(f[a>>2]|0)+16>>2]&63](a,b,d)|0;if(a)f[c>>2]=f[d>>2];u=e;return a&1|0}function aN(a){a=a|0;if(!a)a=0;else a=(rM(a,4032,4120,0)|0)!=0;return a&1|0}function bN(){}function cN(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;e=b&65535;c=X(e,f)|0;d=a>>>16;a=(c>>>16)+(X(e,d)|0)|0;e=b>>>16;b=X(e,f)|0;return (I=(a>>>16)+(X(e,d)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|c&65535|0)|0}function dN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;c=cN(e,f)|0;a=I;return (I=(X(b,f)|0)+(X(d,e)|0)+a|a&0,c|0|0)|0}function eN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (I=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function fN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;d=b-d-(c>>>0>a>>>0|0)>>>0;return (I=d,a-c>>>0|0)|0}function gN(a){a=a|0;var c=0;c=b[w+(a&255)>>0]|0;if((c|0)<8)return c|0;c=b[w+(a>>8&255)>>0]|0;if((c|0)<8)return c+8|0;c=b[w+(a>>16&255)>>0]|0;if((c|0)<8)return c+16|0;return (b[w+(a>>>24)>>0]|0)+24|0}function hN(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;l=a;j=b;k=j;h=c;n=d;i=n;if(!k){g=(e|0)!=0;if(!i){if(g){f[e>>2]=(l>>>0)%(h>>>0);f[e+4>>2]=0;}n=0;e=(l>>>0)/(h>>>0)>>>0;return (I=n,e)|0}else {if(!g){n=0;e=0;return (I=n,e)|0}f[e>>2]=a|0;f[e+4>>2]=b&0;n=0;e=0;return (I=n,e)|0}}g=(i|0)==0;do if(h){if(!g){g=(_(i|0)|0)-(_(k|0)|0)|0;if(g>>>0<=31){m=g+1|0;i=31-g|0;b=g-31>>31;h=m;a=l>>>(m>>>0)&b|k<<i;b=k>>>(m>>>0)&b;g=0;i=l<<i;break}if(!e){n=0;e=0;return (I=n,e)|0}f[e>>2]=a|0;f[e+4>>2]=j|b&0;n=0;e=0;return (I=n,e)|0}g=h-1|0;if(g&h|0){i=(_(h|0)|0)+33-(_(k|0)|0)|0;p=64-i|0;m=32-i|0;j=m>>31;o=i-32|0;b=o>>31;h=i;a=m-1>>31&k>>>(o>>>0)|(k<<m|l>>>(i>>>0))&b;b=b&k>>>(i>>>0);g=l<<p&j;i=(k<<p|l>>>(o>>>0))&j|l<<m&i-33>>31;break}if(e|0){f[e>>2]=g&l;f[e+4>>2]=0;}if((h|0)==1){o=j|b&0;p=a|0|0;return (I=o,p)|0}else {p=gN(h|0)|0;o=k>>>(p>>>0)|0;p=k<<32-p|l>>>(p>>>0)|0;return (I=o,p)|0}}else {if(g){if(e|0){f[e>>2]=(k>>>0)%(h>>>0);f[e+4>>2]=0;}o=0;p=(k>>>0)/(h>>>0)>>>0;return (I=o,p)|0}if(!l){if(e|0){f[e>>2]=0;f[e+4>>2]=(k>>>0)%(i>>>0);}o=0;p=(k>>>0)/(i>>>0)>>>0;return (I=o,p)|0}g=i-1|0;if(!(g&i)){if(e|0){f[e>>2]=a|0;f[e+4>>2]=g&k|b&0;}o=0;p=k>>>((gN(i|0)|0)>>>0);return (I=o,p)|0}g=(_(i|0)|0)-(_(k|0)|0)|0;if(g>>>0<=30){b=g+1|0;i=31-g|0;h=b;a=k<<i|l>>>(b>>>0);b=k>>>(b>>>0);g=0;i=l<<i;break}if(!e){o=0;p=0;return (I=o,p)|0}f[e>>2]=a|0;f[e+4>>2]=j|b&0;o=0;p=0;return (I=o,p)|0}while(0);if(!h){k=i;j=0;i=0;}else {m=c|0|0;l=n|d&0;k=eN(m|0,l|0,-1,-1)|0;c=I;j=i;i=0;do{d=j;j=g>>>31|j<<1;g=i|g<<1;d=a<<1|d>>>31|0;n=a>>>31|b<<1|0;fN(k|0,c|0,d|0,n|0)|0;p=I;o=p>>31|((p|0)<0?-1:0)<<1;i=o&1;a=fN(d|0,n|0,o&m|0,(((p|0)<0?-1:0)>>31|((p|0)<0?-1:0)<<1)&l|0)|0;b=I;h=h-1|0;}while((h|0)!=0);k=j;j=0;}h=0;if(e|0){f[e>>2]=a;f[e+4>>2]=b;}o=(g|0)>>>31|(k|h)<<1|(h<<1|g>>>31)&0|j;p=(g<<1|0>>>31)&-2|i;return (I=o,p)|0}function iN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return hN(a,b,c,d,0)|0}function jN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,g=0;g=u;u=u+16|0;e=g|0;hN(a,b,c,d,e)|0;u=g;return (I=f[e+4>>2]|0,f[e>>2]|0)|0}function kN(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){I=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}I=(b|0)<0?-1:0;return b>>c-32|0}function lN(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){I=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}I=0;return b>>>c-32|0}function mN(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){I=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}I=a<<c-32;return 0}function nN(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function oN(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0;if((d|0)>=8192)return Ib(a|0,c|0,d|0)|0;h=a|0;g=a+d|0;if((a&3)==(c&3)){while(a&3){if(!d)return h|0;b[a>>0]=b[c>>0]|0;a=a+1|0;c=c+1|0;d=d-1|0;}d=g&-4|0;e=d-64|0;while((a|0)<=(e|0)){f[a>>2]=f[c>>2];f[a+4>>2]=f[c+4>>2];f[a+8>>2]=f[c+8>>2];f[a+12>>2]=f[c+12>>2];f[a+16>>2]=f[c+16>>2];f[a+20>>2]=f[c+20>>2];f[a+24>>2]=f[c+24>>2];f[a+28>>2]=f[c+28>>2];f[a+32>>2]=f[c+32>>2];f[a+36>>2]=f[c+36>>2];f[a+40>>2]=f[c+40>>2];f[a+44>>2]=f[c+44>>2];f[a+48>>2]=f[c+48>>2];f[a+52>>2]=f[c+52>>2];f[a+56>>2]=f[c+56>>2];f[a+60>>2]=f[c+60>>2];a=a+64|0;c=c+64|0;}while((a|0)<(d|0)){f[a>>2]=f[c>>2];a=a+4|0;c=c+4|0;}}else {d=g-4|0;while((a|0)<(d|0)){b[a>>0]=b[c>>0]|0;b[a+1>>0]=b[c+1>>0]|0;b[a+2>>0]=b[c+2>>0]|0;b[a+3>>0]=b[c+3>>0]|0;a=a+4|0;c=c+4|0;}}while((a|0)<(g|0)){b[a>>0]=b[c>>0]|0;a=a+1|0;c=c+1|0;}return h|0}function pN(a,c,d){a=a|0;c=c|0;d=d|0;var e=0;if((c|0)<(a|0)&(a|0)<(c+d|0)){e=a;c=c+d|0;a=a+d|0;while((d|0)>0){a=a-1|0;c=c-1|0;d=d-1|0;b[a>>0]=b[c>>0]|0;}a=e;}else oN(a,c,d)|0;return a|0}function qN(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,g=0,h=0,i=0;h=a+d|0;c=c&255;if((d|0)>=67){while(a&3){b[a>>0]=c;a=a+1|0;}e=h&-4|0;g=e-64|0;i=c|c<<8|c<<16|c<<24;while((a|0)<=(g|0)){f[a>>2]=i;f[a+4>>2]=i;f[a+8>>2]=i;f[a+12>>2]=i;f[a+16>>2]=i;f[a+20>>2]=i;f[a+24>>2]=i;f[a+28>>2]=i;f[a+32>>2]=i;f[a+36>>2]=i;f[a+40>>2]=i;f[a+44>>2]=i;f[a+48>>2]=i;f[a+52>>2]=i;f[a+56>>2]=i;f[a+60>>2]=i;a=a+64|0;}while((a|0)<(e|0)){f[a>>2]=i;a=a+4|0;}}while((a|0)<(h|0)){b[a>>0]=c;a=a+1|0;}return h-d|0}function rN(a){return 0}function sN(a){return 0}function tN(a){return 0}function uN(a){a=+a;return a>=0.0?+J(a+.5):+W(a-.5)}function vN(a){a=a|0;var b=0,c=0;c=a+15&-16|0;b=f[r>>2]|0;a=b+c|0;if((c|0)>0&(a|0)<(b|0)|(a|0)<0){da()|0;_a(12);return -1}f[r>>2]=a;if((a|0)>(ca()|0)?(ba()|0)==0:0){f[r>>2]=b;_a(12);return -1}return b|0}function wN(a){a=a|0;return Tc[a&7]()|0}function xN(a,b){a=a|0;b=b|0;return Uc[a&127](b|0)|0}function yN(a,b,c){a=a|0;b=b|0;c=c|0;return Vc[a&31](b|0,c|0)|0}function zN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Wc[a&63](b|0,c|0,d|0)|0}function AN(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Xc[a&7](b|0,c|0,d|0,e|0)|0}function BN(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;return Yc[a&7](b|0,c|0,d|0,e|0,+f)|0}function CN(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return Zc[a&31](b|0,c|0,d|0,e|0,f|0)|0}function DN(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;return _c[a&3](b|0,c|0,d|0,e|0,f|0,+g)|0}function EN(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;return $c[a&63](b|0,c|0,d|0,e|0,f|0,g|0)|0}function FN(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;return ad[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0)|0}function GN(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return bd[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function HN(a){a=a|0;cd[a&7]();}function IN(a,b){a=a|0;b=b|0;dd[a&511](b|0);}function JN(a,b,c){a=a|0;b=b|0;c=c|0;ed[a&63](b|0,c|0);}function KN(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;fd[a&127](b|0,c|0,d|0);}function LN(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;gd[a&31](b|0,c|0,d|0,e|0);}function MN(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;hd[a&63](b|0,c|0,d|0,e|0,f|0);}function NN(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;id[a&15](b|0,c|0,d|0,e|0,f|0,g|0);}function ON(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;jd[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0);}function PN(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;kd[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0);}function QN(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;ld[a&3](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0);}function RN(a,b,c,d,e,f,g,h,i,j,k){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;md[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0,k|0);}function SN(a,b,c,d,e,f,g,h,i,j,k,l,m){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;nd[a&1](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0,k|0,l|0,m|0);}function TN(a,b,c,d,e,f,g,h,i,j,k,l,m,n){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;od[a&1](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0,k|0,l|0,m|0,n|0);}function UN(){$(0);return 0}function VN(a){$(1);return 0}function WN(a,b){$(2);return 0}function XN(a,b,c){$(3);return 0}function YN(a,b,c,d){$(4);return 0}function ZN(a,b,c,d,e){$(5);return 0}function _N(a,b,c,d,e){$(6);return 0}function $N(a,b,c,d,e,f){$(7);return 0}function aO(a,b,c,d,e,f){$(8);return 0}function bO(a,b,c,d,e,f,g){$(9);return 0}function cO(a,b,c,d,e,f,g,h){$(10);return 0}function dO(){$(11);}function eO(){Ua();}function fO(a){$(12);}function gO(a,b){$(13);}function hO(a,b,c){$(14);}function iO(a,b,c,d){$(15);}function jO(a,b,c,d,e){$(16);}function kO(a,b,c,d,e,f){$(17);}function lO(a,b,c,d,e,f,g){$(18);}function mO(a,b,c,d,e,f,g,h){$(19);}function nO(a,b,c,d,e,f,g,h,i){$(20);}function oO(a,b,c,d,e,f,g,h,i,j){$(21);}function pO(a,b,c,d,e,f,g,h,i,j,k,l){$(22);}function qO(a,b,c,d,e,f,g,h,i,j,k,l,m){$(23);}

		// EMSCRIPTEN_END_FUNCS
		var Tc=[UN,Tp,al,cl,yl,UN,UN,UN];var Uc=[VN,yd,CA,DA,me,GA,yf,pf,Wp,Tx,FA,UA,VA,XA,YA,gC,nC,uC,vC,BC,CC,SE,ZE,_E,$E,aF,bF,cF,dF,AF,HF,IF,JF,KF,LF,MF,NF,vG,wG,BG,HG,IG,NG,SG,TG,YG,bH,cH,hH,cI,dI,fI,uI,vI,xI,aJ,bJ,hJ,iJ,nI,oI,qI,DI,EI,GI,iL,FM,$k,bl,dl,il,sl,ul,wl,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN,VN];var Vc=[WN,ne,oe,fL,vq,wq,HA,JA,ZA,$A,iC,pC,wC,DC,PI,RI,TI,sJ,uJ,wJ,jl,ll,Al,Cl,WN,WN,WN,WN,WN,WN,WN,WN];var Wc=[XN,zd,Ad,Bd,zA,EA,IA,zx,Ax,Ux,Vx,_x,ay,sz,RA,WA,_A,hC,oC,KC,QC,SH,XH,QI,SI,VI,oJ,tJ,vJ,yJ,jM,LM,NM,QM,hl,nl,Ez,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN,XN];var Xc=[YN,st,UI,pJ,qJ,rJ,xJ,pl];var Yc=[ZN,sE,tE,JE,KE,ZN,ZN,ZN];var Zc=[_N,IC,OC,nE,oE,qE,uE,EE,FE,HE,LE,bI,eI,tI,wI,WI,zJ,mI,pI,CI,FI,_N,_N,_N,_N,_N,_N,_N,_N,_N,_N,_N];var _c=[$N,GH,MH,$N];var $c=[aO,UC,VC,WC,XC,YC,ZC,_C,$C,aD,bD,cD,OD,PD,QD,RD,SD,TD,UD,VD,WD,XD,YD,pE,rE,GE,IE,TE,UE,VE,WE,XE,BF,CF,DF,EF,FF,HH,NH,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO,aO];var ad=[bO,jG,pG,mH,nH,xH,yH,bO];var bd=[cO,YE,GF,$H,aI,rI,sI,kI,lI,AI,BI,cO,cO,cO,cO,cO];var cd=[dO,Up,Vp,eO,cM,xM,dO,dO];var dd=[fO,wd,xd,$d,ae,pe,qe,re,se,ie,je,te,ue,xe,Ae,Be,Ge,Ne,Oe,Pe,Qe,Re,Se,eB,fB,gB,hB,yB,zB,AB,BB,CB,DB,oB,pB,qB,rB,pj,qj,rj,sj,lj,mj,nj,oj,hj,ij,jj,kj,cj,dj,_i,$i,aj,bj,Vi,Yi,Ri,Si,Ti,Ui,Hi,Ii,Li,Di,Ei,Fi,Gi,yi,Bi,ui,vi,wi,xi,oi,pi,si,ki,li,mi,ni,hi,di,ei,fi,gi,ai,Yh,Zh,_h,$h,Ph,Qh,Th,Lh,Mh,Nh,Oh,Hh,Dh,Eh,Fh,Gh,yh,zh,uh,vh,wh,xh,rh,nh,oh,ph,qh,kh,gh,hh,ih,jh,ch,_g,$g,ah,bh,Sg,Tg,Wg,Og,Pg,Qg,Rg,Hg,Ig,Dg,Eg,Fg,Gg,yg,zg,ug,vg,wg,xg,pg,qg,lg,mg,ng,og,eg,fg,ag,bg,cg,dg,Zf,Vf,Wf,Xf,Yf,Rf,Nf,Of,Pf,Qf,Jf,Kf,Ff,Gf,Hf,If,ff,gf,bf,cf,df,ef,Ye,Ze,Ue,Ve,We,Xe,Bf,Cf,Df,Ef,wf,xf,sf,tf,uf,vf,nf,of,ck,dk,ek,fk,Kk,Lk,Mk,Nk,Ol,Pl,Ql,Rl,hm,im,jm,km,xm,ym,zm,Am,sm,tm,um,vm,Pm,Qm,Rm,Sm,Nm,Om,Wm,Xm,$m,cn,fn,jn,mn,pn,sn,vn,yn,Bn,En,Hn,Kn,Nn,Qn,Fp,Gp,Hp,Ip,Bp,Cp,Dp,Ep,yp,up,vp,wp,xp,rp,np,op,pp,qp,jp,kp,lp,mp,fp,gp,hp,ip,bp,cp,dp,ep,Zo,_o,$o,ap,Vo,Wo,Xo,Yo,Ro,So,To,Uo,No,Oo,Po,Qo,Jo,Ko,Lo,Mo,Fo,Go,Ho,Io,Bo,Co,Do,Eo,xo,yo,zo,Ao,uo,qo,ro,so,to,no,jo,ko,lo,mo,fo,go,ho,io,ao,bo,co,eo,Yn,Zn,_n,$n,Yp,tq,uq,Aq,Bq,Hq,Iq,Jq,Kq,Mq,Nq,Oq,Pq,Rq,Sq,Tq,Uq,Au,Bu,Cu,Ou,Pu,fv,gv,Lw,Mw,sA,uA,wA,xA,OA,PA,jB,kB,lB,mB,tB,uB,vB,wB,dC,eC,kC,lC,rC,sC,yC,zC,FC,GC,HC,MC,NC,SC,TC,MD,ND,lE,mE,CE,DE,QE,RE,yF,zF,hG,iG,nG,oG,tG,uG,FG,GG,QG,RG,$G,aH,kH,lH,vH,wH,EH,FH,KH,LH,QH,RH,VH,WH,LC,jI,_H,yI,zI,KI,LI,NI,OI,_I,$I,fJ,gJ,mJ,nJ,AJ,BJ,CJ,gL,hL,fM,gM,hM,iM,sM,DM,EM,JM,KM,MM,PM,RM,_k,el,ql,tl,vl,xl,zl,kD,mD,oH,Mx,yM,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO,fO];var ed=[gO,yA,Xp,Rp,Du,Qu,hv,Nw,QA,fC,mC,tC,AC,xG,yG,zG,AG,CG,DG,JG,KG,LG,MG,OG,PG,UG,VG,WG,XG,ZG,_G,dH,eH,fH,gH,iH,jH,UH,ZH,cJ,dJ,eJ,jJ,kJ,lJ,fl,kl,rl,Gr,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO];var fd=[hO,be,ve,we,ye,Ce,De,Ee,He,Ie,ej,fj,gj,Wi,Xi,Zi,Ji,Ki,Mi,zi,Ai,Ci,qi,ri,ti,ii,ji,bi,ci,Rh,Sh,Uh,Ih,Jh,Kh,Ah,Bh,Ch,sh,th,lh,mh,dh,eh,fh,Ug,Vg,Xg,Jg,Kg,Lg,Ag,Bg,Cg,rg,sg,tg,gg,hg,_f,$f,Sf,Tf,Lf,Mf,hf,jf,kf,_e,$e,af,zf,Af,qf,rf,_p,tt,gl,ml,Bl,Dl,wr,Fr,Cr,Br,Hr,Qr,Sr,Tr,Ur,Jr,_r,as,bs,cs,es,fs,gs,hs,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO,hO];var gd=[iO,le,Zp,BA,TA,JC,PC,mM,vM,UM,ol,Ar,zr,xr,Ir,Vr,Xr,Yr,Zr,Kr,Mr,Nr,Or,Pr,iO,iO,iO,iO,iO,iO,iO,iO];var hd=[jO,Ym,Zm,an,bn,dn,en,gn,hn,kn,ln,nn,on,qn,rn,tn,un,wn,xn,zn,An,Cn,Dn,Fn,Gn,In,Jn,Ln,Mn,On,Pn,Rn,Sn,zp,Ap,sp,tp,vo,wo,oo,po,lM,uM,TM,ur,vr,Er,Dr,yr,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO,jO];var id=[kO,ke,AA,SA,TH,YH,kM,tM,SM,is,kO,kO,kO,kO,kO,kO];var jd=[lO,ls,ms,us,ws,ys,zs,As,Bs,Cs,Ds,Es,Fs,Gs,Hs,Is,Js,Ks,Ls,lO,lO,lO,lO,lO,lO,lO,lO,lO,lO,lO,lO,lO];var kd=[mO,ps,vs,Ms,Os,Ps,Qs,Rs,Ss,Ts,Us,Vs,Ws,Xs,Ys,Zs,_s,$s,mO,mO,mO,mO,mO,mO,mO,mO,mO,mO,mO,mO,mO,mO];var ld=[nO,js,qs,nO];var md=[oO,ns,ss,rs,ts,oO,oO,oO];var nd=[pO,ks];var od=[qO,os];return {__GLOBAL__I_000101:XB,__GLOBAL__sub_I_bind_cpp:Ix,__GLOBAL__sub_I_box_cc:tj,__GLOBAL__sub_I_heif_cc:Sk,__GLOBAL__sub_I_heif_plugin_registry_cc:Tm,__GLOBAL__sub_I_iostream_cpp:YB,___cxa_can_catch:$M,___cxa_is_pointer_type:aN,___errno_location:Xx,___getTypeName:Kx,___muldi3:dN,___udivdi3:iN,___uremdi3:jN,_bitshift64Ashr:kN,_bitshift64Lshr:lN,_bitshift64Shl:mN,_emscripten_get_global_libc:Sx,_emscripten_replace_memory:Sc,_free:Mx,_i64Add:eN,_i64Subtract:fN,_llvm_bswap_i32:nN,_malloc:Lx,_memcpy:oN,_memmove:pN,_memset:qN,_pthread_cond_broadcast:rN,_pthread_mutex_lock:sN,_pthread_mutex_unlock:tN,_roundf:uN,_sbrk:vN,dynCall_i:wN,dynCall_ii:xN,dynCall_iii:yN,dynCall_iiii:zN,dynCall_iiiii:AN,dynCall_iiiiid:BN,dynCall_iiiiii:CN,dynCall_iiiiiid:DN,dynCall_iiiiiii:EN,dynCall_iiiiiiii:FN,dynCall_iiiiiiiii:GN,dynCall_v:HN,dynCall_vi:IN,dynCall_vii:JN,dynCall_viii:KN,dynCall_viiii:LN,dynCall_viiiii:MN,dynCall_viiiiii:NN,dynCall_viiiiiii:ON,dynCall_viiiiiiii:PN,dynCall_viiiiiiiii:QN,dynCall_viiiiiiiiii:RN,dynCall_viiiiiiiiiiii:SN,dynCall_viiiiiiiiiiiii:TN,establishStackSpace:sd,getTempRet0:vd,runPostSets:bN,setTempRet0:ud,setThrew:td,stackAlloc:pd,stackRestore:rd,stackSave:qd}})


		// EMSCRIPTEN_END_ASM
		(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var __GLOBAL__I_000101=Module["__GLOBAL__I_000101"]=asm["__GLOBAL__I_000101"];var __GLOBAL__sub_I_bind_cpp=Module["__GLOBAL__sub_I_bind_cpp"]=asm["__GLOBAL__sub_I_bind_cpp"];var __GLOBAL__sub_I_box_cc=Module["__GLOBAL__sub_I_box_cc"]=asm["__GLOBAL__sub_I_box_cc"];var __GLOBAL__sub_I_heif_cc=Module["__GLOBAL__sub_I_heif_cc"]=asm["__GLOBAL__sub_I_heif_cc"];var __GLOBAL__sub_I_heif_plugin_registry_cc=Module["__GLOBAL__sub_I_heif_plugin_registry_cc"]=asm["__GLOBAL__sub_I_heif_plugin_registry_cc"];var __GLOBAL__sub_I_iostream_cpp=Module["__GLOBAL__sub_I_iostream_cpp"]=asm["__GLOBAL__sub_I_iostream_cpp"];Module["___cxa_can_catch"]=asm["___cxa_can_catch"];Module["___cxa_is_pointer_type"]=asm["___cxa_is_pointer_type"];Module["___errno_location"]=asm["___errno_location"];var ___getTypeName=Module["___getTypeName"]=asm["___getTypeName"];Module["___muldi3"]=asm["___muldi3"];Module["___udivdi3"]=asm["___udivdi3"];Module["___uremdi3"]=asm["___uremdi3"];Module["_bitshift64Ashr"]=asm["_bitshift64Ashr"];Module["_bitshift64Lshr"]=asm["_bitshift64Lshr"];Module["_bitshift64Shl"]=asm["_bitshift64Shl"];Module["_emscripten_get_global_libc"]=asm["_emscripten_get_global_libc"];var _emscripten_replace_memory=Module["_emscripten_replace_memory"]=asm["_emscripten_replace_memory"];var _free=Module["_free"]=asm["_free"];Module["_i64Add"]=asm["_i64Add"];Module["_i64Subtract"]=asm["_i64Subtract"];Module["_llvm_bswap_i32"]=asm["_llvm_bswap_i32"];var _malloc=Module["_malloc"]=asm["_malloc"];Module["_memcpy"]=asm["_memcpy"];Module["_memmove"]=asm["_memmove"];Module["_memset"]=asm["_memset"];Module["_pthread_cond_broadcast"]=asm["_pthread_cond_broadcast"];Module["_pthread_mutex_lock"]=asm["_pthread_mutex_lock"];Module["_pthread_mutex_unlock"]=asm["_pthread_mutex_unlock"];Module["_roundf"]=asm["_roundf"];Module["_sbrk"]=asm["_sbrk"];Module["establishStackSpace"]=asm["establishStackSpace"];Module["getTempRet0"]=asm["getTempRet0"];Module["runPostSets"]=asm["runPostSets"];Module["setTempRet0"]=asm["setTempRet0"];Module["setThrew"]=asm["setThrew"];Module["stackAlloc"]=asm["stackAlloc"];Module["stackRestore"]=asm["stackRestore"];Module["stackSave"]=asm["stackSave"];Module["dynCall_i"]=asm["dynCall_i"];Module["dynCall_ii"]=asm["dynCall_ii"];Module["dynCall_iii"]=asm["dynCall_iii"];Module["dynCall_iiii"]=asm["dynCall_iiii"];Module["dynCall_iiiii"]=asm["dynCall_iiiii"];Module["dynCall_iiiiid"]=asm["dynCall_iiiiid"];Module["dynCall_iiiiii"]=asm["dynCall_iiiiii"];Module["dynCall_iiiiiid"]=asm["dynCall_iiiiiid"];Module["dynCall_iiiiiii"]=asm["dynCall_iiiiiii"];Module["dynCall_iiiiiiii"]=asm["dynCall_iiiiiiii"];Module["dynCall_iiiiiiiii"]=asm["dynCall_iiiiiiiii"];Module["dynCall_v"]=asm["dynCall_v"];Module["dynCall_vi"]=asm["dynCall_vi"];Module["dynCall_vii"]=asm["dynCall_vii"];Module["dynCall_viii"]=asm["dynCall_viii"];Module["dynCall_viiii"]=asm["dynCall_viiii"];Module["dynCall_viiiii"]=asm["dynCall_viiiii"];Module["dynCall_viiiiii"]=asm["dynCall_viiiiii"];Module["dynCall_viiiiiii"]=asm["dynCall_viiiiiii"];Module["dynCall_viiiiiiii"]=asm["dynCall_viiiiiiii"];Module["dynCall_viiiiiiiii"]=asm["dynCall_viiiiiiiii"];Module["dynCall_viiiiiiiiii"]=asm["dynCall_viiiiiiiiii"];Module["dynCall_viiiiiiiiiiii"]=asm["dynCall_viiiiiiiiiiii"];Module["dynCall_viiiiiiiiiiiii"]=asm["dynCall_viiiiiiiiiiiii"];Runtime.stackAlloc=Module["stackAlloc"];Runtime.stackSave=Module["stackSave"];Runtime.stackRestore=Module["stackRestore"];Runtime.establishStackSpace=Module["establishStackSpace"];Runtime.setTempRet0=Module["setTempRet0"];Runtime.getTempRet0=Module["getTempRet0"];Module["asm"]=asm;if(memoryInitializer){if(typeof Module["locateFile"]==="function"){memoryInitializer=Module["locateFile"](memoryInitializer);}else if(Module["memoryInitializerPrefixURL"]){memoryInitializer=Module["memoryInitializerPrefixURL"]+memoryInitializer;}if(ENVIRONMENT_IS_NODE||ENVIRONMENT_IS_SHELL){var data=Module["readBinary"](memoryInitializer);HEAPU8.set(data,Runtime.GLOBAL_BASE);}else {addRunDependency();var applyMemoryInitializer=(function(data){if(data.byteLength)data=new Uint8Array(data);HEAPU8.set(data,Runtime.GLOBAL_BASE);if(Module["memoryInitializerRequest"])delete Module["memoryInitializerRequest"].response;removeRunDependency();});function doBrowserLoad(){Module["readAsync"](memoryInitializer,applyMemoryInitializer,(function(){throw "could not load memory initializer "+memoryInitializer}));}var memoryInitializerBytes=tryParseAsDataURI(memoryInitializer);if(memoryInitializerBytes){applyMemoryInitializer(memoryInitializerBytes.buffer);}else if(Module["memoryInitializerRequest"]){function useRequest(){var request=Module["memoryInitializerRequest"];var response=request.response;if(request.status!==200&&request.status!==0){var data=tryParseAsDataURI(Module["memoryInitializerRequestURL"]);if(data){response=data.buffer;}else {console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: "+request.status+", retrying "+memoryInitializer);doBrowserLoad();return}}applyMemoryInitializer(response);}if(Module["memoryInitializerRequest"].response){setTimeout(useRequest,0);}else {Module["memoryInitializerRequest"].addEventListener("load",useRequest);}}else {doBrowserLoad();}}}function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status;}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller;};function run(args){args=args||Module["arguments"];if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("");}),1);doRun();}),1);}else {doRun();}}Module["run"]=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]&&status===0){return}if(Module["noExitRuntime"]);else {ABORT=true;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status);}if(ENVIRONMENT_IS_NODE){browser$1["exit"](status);}Module["quit"](status,new ExitStatus(status));}Module["exit"]=exit;var abortDecorators=[];function abort(what){if(Module["onAbort"]){Module["onAbort"](what);}if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what);}else {what="";}ABORT=true;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what);}));}throw output}Module["abort"]=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}Module["noExitRuntime"]=true;run();function StringToArrayBuffer(str){var buf=new ArrayBuffer(str.length);var bufView=new Uint8Array(buf);for(var i=0,strLen=str.length;i<strLen;i++){bufView[i]=str.charCodeAt(i);}return buf}var HeifImage=(function(handle){this.handle=handle;this.img=null;});HeifImage.prototype.free=(function(){if(this.handle){libheif.heif_image_handle_release(this.handle);this.handle=null;}});HeifImage.prototype._ensureImage=(function(){if(this.img){return}var img=libheif.heif_js_decode_image(this.handle,libheif.heif_colorspace_YCbCr,libheif.heif_chroma_420);if(!img||img.code){console.log("Decoding image failed",this.handle,img);return}this.data=new Uint8Array(StringToArrayBuffer(img.data));delete img.data;this.img=img;});HeifImage.prototype.get_width=(function(){this._ensureImage();return this.img.width});HeifImage.prototype.get_height=(function(){this._ensureImage();return this.img.height});HeifImage.prototype.is_primary=(function(){this._ensureImage();return !!this.img.is_primary});HeifImage.prototype.display=(function(image_data,callback){var w=this.get_width();var h=this.get_height();setTimeout((function(){this._ensureImage();if(!this.img){callback(null);return}var yval;var uval;var vval;var xpos=0;var ypos=0;var yoffset=0;var uoffset=0;var voffset=0;var x2;var i=0;var maxi=w*h;var stridey=w;var strideu=Math.ceil(w/2);var stridev=Math.ceil(w/2);var h2=Math.ceil(h/2);var y=this.data;var u=this.data.subarray(stridey*h,stridey*h+strideu*h2);var v=this.data.subarray(stridey*h+strideu*h2,stridey*h+strideu*h2+stridev*h2);var dest=image_data.data;while(i<maxi){x2=xpos>>1;yval=1.164*(y[yoffset+xpos]-16);uval=u[uoffset+x2]-128;vval=v[voffset+x2]-128;dest[(i<<2)+0]=yval+1.596*vval;dest[(i<<2)+1]=yval-.813*vval-.391*uval;dest[(i<<2)+2]=yval+2.018*uval;dest[(i<<2)+3]=255;i++;xpos++;if(xpos<w){yval=1.164*(y[yoffset+xpos]-16);dest[(i<<2)+0]=yval+1.596*vval;dest[(i<<2)+1]=yval-.813*vval-.391*uval;dest[(i<<2)+2]=yval+2.018*uval;dest[(i<<2)+3]=255;i++;xpos++;}if(xpos===w){xpos=0;ypos++;yoffset+=stridey;uoffset=(ypos>>1)*strideu;voffset=(ypos>>1)*stridev;}}callback(image_data);}).bind(this),0);});var HeifDecoder=(function(){this.decoder=null;});HeifDecoder.prototype.decode=(function(buffer){if(this.decoder){libheif.heif_context_free(this.decoder);}this.decoder=libheif.heif_context_alloc();if(!this.decoder){console.log("Could not create HEIF context");return []}var error=libheif.heif_context_read_from_memory(this.decoder,buffer);if(error.code!==libheif.heif_error_Ok){console.log("Could not parse HEIF file",error);return []}var ids=libheif.heif_js_context_get_list_of_top_level_image_IDs(this.decoder);if(!ids||ids.code){console.log("Error loading image ids",ids);return []}else if(!ids.length){console.log("No images found");return []}var result=[];for(var i=0;i<ids.length;i++){var handle=libheif.heif_js_context_get_image_handle(this.decoder,ids[i]);if(!handle||handle.code){console.log("Could not get image data for id",ids[i],handle);continue}result.push(new HeifImage(handle));}return result});var libheif={HeifDecoder:HeifDecoder,fourcc:(function(s){return s.charCodeAt(0)<<24|s.charCodeAt(1)<<16|s.charCodeAt(2)<<8|s.charCodeAt(3)})};var key;var enums={"heif_error_code":true,"heif_suberror_code":true,"heif_compression_format":true,"heif_chroma":true,"heif_colorspace":true,"heif_channel":true};var e;for(e in enums){if(!enums.hasOwnProperty(e)){continue}for(key in Module[e]){if(!Module[e].hasOwnProperty(key)||key==="values"){continue}libheif[key]=Module[e][key];}}for(key in Module){if(enums.hasOwnProperty(key)||key.indexOf("heif_")!==0){continue}libheif[key]=Module[key];}delete this["Module"];function createNamedFunction(name,body){if(!name){name="function_"+new Date;}name=makeLegalFunctionName(name);return (new Function("body","return function "+name+"() {\n"+'    "use strict";'+"    return body.apply(this, arguments);\n"+"};\n"))(body)}{if(module.exports){exports=module.exports=libheif;}exports.libheif=libheif;}})).call(commonjsGlobal);
	} (libheif$1, libheif$1.exports));

	const libheif = libheif$1.exports;

	const uint8ArrayUtf8ByteString = (array, start, end) => {
	  return String.fromCharCode(...array.slice(start, end));
	};

	// brands explained: https://github.com/strukturag/libheif/issues/83
	// code adapted from: https://github.com/sindresorhus/file-type/blob/6f901bd82b849a85ca4ddba9c9a4baacece63d31/core.js#L428-L438
	const isHeic = (buffer) => {
	  const brandMajor = uint8ArrayUtf8ByteString(buffer, 8, 12).replace('\0', ' ').trim();

	  switch (brandMajor) {
	    case 'mif1':
	      return true; // {ext: 'heic', mime: 'image/heif'};
	    case 'msf1':
	      return true; // {ext: 'heic', mime: 'image/heif-sequence'};
	    case 'heic':
	    case 'heix':
	      return true; // {ext: 'heic', mime: 'image/heic'};
	    case 'hevc':
	    case 'hevx':
	      return true; // {ext: 'heic', mime: 'image/heic-sequence'};
	  }

	  return false;
	};

	const decodeImage = async (image) => {
	  const width = image.get_width();
	  const height = image.get_height();

	  const arrayBuffer = await new Promise((resolve, reject) => {
	    image.display({ data: new Uint8ClampedArray(width*height*4), width, height }, (displayData) => {
	      if (!displayData) {
	        return reject(new Error('HEIF processing error'));
	      }

	      // get the ArrayBuffer from the Uint8Array
	      resolve(displayData.data.buffer);
	    });
	  });

	  return { width, height, data: arrayBuffer };
	};

	const decodeBuffer = async ({ buffer, all }) => {
	  if (!isHeic(buffer)) {
	    throw new TypeError('input buffer is not a HEIC image');
	  }

	  const decoder = new libheif.HeifDecoder();
	  const data = decoder.decode(buffer);

	  if (!data.length) {
	    throw new Error('HEIF image not found');
	  }

	  if (!all) {
	    return await decodeImage(data[0]);
	  }

	  return data.map(image => {
	    return {
	      decode: async () => await decodeImage(image)
	    };
	  });
	};

	heicDecode.exports = async ({ buffer }) => await decodeBuffer({ buffer, all: false });
	heicDecode.exports.all = async ({ buffer }) => await decodeBuffer({ buffer, all: true });

	const to = {
	  JPEG: ({ data, width, height, quality }) => jpegJs.encode({ data, width, height }, quality).data,
	  PNG: ({ data, width, height }) => {
	    const png = new PNG_1({ width, height });
	    png.data = data;

	    return PNG_1.sync.write(png, {
	      width: width,
	      height: height,
	      deflateLevel: 9,
	      deflateStrategy: 3,
	      filterType: -1,
	      colorType: 6,
	      inputHasAlpha: true
	    });
	  }
	};

	const convertImage = async ({ image, format, quality }) => {
	  return await to[format]({
	    width: image.width,
	    height: image.height,
	    data: Buffer.from(image.data),
	    quality: Math.floor(quality * 100)
	  });
	};

	const convertImpl = async ({ buffer, format, quality, all }) => {
	  if (!to[format]) {
	    throw new Error(`output format needs to be one of [${Object.keys(to)}]`);
	  }

	  if (!all) {
	    const image = await heicDecode.exports({ buffer });
	    return await convertImage({ image, format, quality });
	  }

	  const images = await heicDecode.exports.all({ buffer });

	  return images.map(image => {
	    return {
	      convert: async () => await convertImage({
	        image: await image.decode(),
	        format,
	        quality
	      })
	    };
	  });
	};

	const heicConvert = async ({ buffer, format, quality = 0.92 }) => await convertImpl({ buffer, format, quality, all: false });
	heicConvert.all = async ({ buffer, format, quality = 0.92 }) => await convertImpl({ buffer, format, quality, all: true });

	exports.heicConvert = heicConvert;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({});