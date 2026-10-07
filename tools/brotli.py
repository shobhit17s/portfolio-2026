"""A stand-in for the `brotli` module, which cannot be installed here.

   fontTools only needs compress()/decompress() to write and read woff2, and
   Node ships a brotli implementation in its standard library, so we shell out
   to that. MODE 2 is Brotli's font mode, which is what woff2 expects.
"""
import base64, json, subprocess

def compress(data, quality=11, mode=2, lgwin=22):
    return _node('brotliCompressSync', data, {
        'params': {'zlib.constants.BROTLI_PARAM_QUALITY': quality,
                   'zlib.constants.BROTLI_PARAM_MODE': mode,
                   'zlib.constants.BROTLI_PARAM_LGWIN': lgwin}})

def decompress(data):
    return _node('brotliDecompressSync', data, {})

def _node(fn, data, opts):
    script = r'''
const zlib=require('zlib');
let chunks=[];process.stdin.on('data',d=>chunks.push(d));
process.stdin.on('end',()=>{
  const inp=Buffer.from(Buffer.concat(chunks).toString(),'base64');
  const p={};
  p[zlib.constants.BROTLI_PARAM_QUALITY]=__Q__;
  p[zlib.constants.BROTLI_PARAM_MODE]=__M__;
  p[zlib.constants.BROTLI_PARAM_LGWIN]=__W__;
  const out=zlib.__FN__(inp, __ARGS__);
  process.stdout.write(out.toString('base64'));
});'''
    q = opts.get('params', {}).get('zlib.constants.BROTLI_PARAM_QUALITY', 11)
    m = opts.get('params', {}).get('zlib.constants.BROTLI_PARAM_MODE', 2)
    w = opts.get('params', {}).get('zlib.constants.BROTLI_PARAM_LGWIN', 22)
    args = '{params:p}' if fn == 'brotliCompressSync' else '{}'
    script = (script.replace('__FN__', fn).replace('__ARGS__', args)
                    .replace('__Q__', str(q)).replace('__M__', str(m)).replace('__W__', str(w)))
    r = subprocess.run(['node', '-e', script], input=base64.b64encode(data),
                       capture_output=True, check=True)
    return base64.b64decode(r.stdout)

# fontTools asks for these by name
MODE_GENERIC, MODE_TEXT, MODE_FONT = 0, 1, 2


