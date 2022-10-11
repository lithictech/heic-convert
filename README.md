# heic-convert

> Convert HEIC/HEIF images to JPEG and PNG

[![travis][travis.svg]][travis.link]
[![npm-downloads][npm-downloads.svg]][npm.link]
[![npm-version][npm-version.svg]][npm.link]

[travis.svg]: https://travis-ci.com/catdad-experiments/heic-convert.svg?branch=master
[travis.link]: https://travis-ci.com/catdad-experiments/heic-convert
[npm-downloads.svg]: https://img.shields.io/npm/dm/heic-convert.svg
[npm.link]: https://www.npmjs.com/package/heic-convert
[npm-version.svg]: https://img.shields.io/npm/v/heic-convert.svg

This is a fork of https://github.com/catdad-experiments/heic-convert
with build changes so it can be compiled to a distributable single file.
(I guess this could have been done with a wrapper lib)

It also has top-level function names so it's available on `window`.

## Install

There files in the `dist` folder you can use directly,
with dependencies compiled in.  So ideally use jsdelivr or your own CDN,
since HEIC conversion is LARGE (1 to 1.5mb of JS).

Since this is not the canonical heic-convert,
I don't want to deal with releases,
so we stamp our own versions into the filename itself.

```
https://cdn.jsdelivr.net/gh/lithictech/heic-convert/dist/heic-convert.js
https://cdn.jsdelivr.net/gh/lithictech/heic-convert/dist/heic-convert.min.js
https://cdn.jsdelivr.net/gh/lithictech/heic-convert/dist/heic-convert.1.3.0.js
https://cdn.jsdelivr.net/gh/lithictech/heic-convert/dist/heic-convert.1.3.0.min.js
```

## Usage

Convert the main image in a HEIC to JPEG

```javascript
const outputBuffer = await heicConvert({
  buffer: inputBuffer, // the HEIC file buffer
  format: 'JPEG',      // output format
  quality: 1           // the jpeg compression quality, between 0 and 1
});
```

Convert the main image in a HEIC to PNG

```javascript
const outputBuffer = await heicConvert({
  buffer: inputBuffer, // the HEIC file buffer
  format: 'PNG'        // output format
});
```

Convert all images in a HEIC

```javascript
const images = await heicConvert.all({
  buffer: inputBuffer, // the HEIC file buffer
  format: 'JPEG'       // output format
});

for (let idx in images) {
  const image = images[idx];
  const outputBuffer = await image.convert();
  await promisify(fs.writeFile)(`./result-${idx}.jpg`, outputBuffer);
}
```

The work to convert an image is done when calling `image.convert()`, so if you only need one of the images in a multi-image file, you can convert just that one from the `images` array and skip doing any work for the remaining images.

_Note that while the converter returns a Promise and is overall asynchronous, a lot of work is still done synchronously, so you should consider using a worker thread in order to not block the main thread in highly concurrent production environments._

## Related

* [heic-cli](https://github.com/catdad-experiments/heic-cli) - convert heic/heif images to jpeg or png from the command line
* [heic-decode](https://github.com/catdad-experiments/heic-decode) - decode heic images to raw image data
* [libheif-js](https://github.com/catdad-experiments/libheif-js) - libheif as a pure-javascript npm module
