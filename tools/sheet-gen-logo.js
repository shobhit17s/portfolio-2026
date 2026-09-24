const {chromium}=require('playwright');
const CSS=`*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#222;width:1800px;padding:60px}
h1{font-size:38px;margin-bottom:10px}.sub{font-size:21px;color:#555;margin-bottom:10px}
.rule{font-size:17px;color:#777;margin-bottom:30px;max-width:1500px}
.row{display:flex;gap:40px;align-items:stretch}
.box{flex:1;border:2px solid #dcdcdc;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.head{padding:18px 22px;background:#fafafa;border-bottom:2px solid #eee}
.t{font-size:23px}.d{font-size:16px;color:#777;margin-top:8px;line-height:1.5}
.art{position:relative;height:800px}
.sq{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;border:2px dashed #dadada}
.circ{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;border:2px dashed #ead9b4;border-radius:50%}
.cx{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:0;border-top:1px dashed #efefef}
.cy{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:700px;width:0;border-left:1px dashed #efefef}
.cap{position:absolute;left:0;right:0;bottom:18px;text-align:center;font-size:14px;color:#aaa}
.real{margin-top:44px;border:2px solid #dcdcdc;border-radius:10px;padding:26px 30px 30px;background:#fbfbfb}
.real h2{font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:8px}
.real p{font-size:16px;color:#777;margin-bottom:24px;max-width:1400px}
.mocks{display:flex;gap:80px;align-items:flex-start}
.mock{background:#12211d;border-radius:8px;padding:13px 18px;display:flex;align-items:center;gap:12px}
.lg{border:1.5px dashed #7d9689;border-radius:3px;flex:0 0 auto}
.nm{font-family:'Shobhit Regal',Georgia,serif;color:#e8eee9;line-height:1.2}
.nm small{display:block;color:#9fb3a7;font-family:Georgia,serif}
.mklab{font-size:14px;color:#999;margin-top:12px}`;

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="http://localhost:8777/common/type.css">
<style>${CSS}</style><body>
<h1>SHEET C &mdash; THE MARK</h1>
<div class="sub">One drawing, in one of two flavours. Pick the flavour first, because it changes what you draw.</div>
<div class="rule"><b>Send this sheet back as a PNG with transparency</b> &mdash; your drawing layer alone, at this exact canvas size, with the printed sheet hidden. Then there is nothing for me to subtract and nothing of mine can come along with your ink.<br><br>Draw inside the square. Keep it roughly centred and leave a little air all round &mdash; the mark is fitted inside a square slot, so anything touching the edge will look cramped next to the name. The pale circle is not a crop; it is there in case you want the mark to work as a badge later.</div>

<div class="row">
  <div class="box">
    <div class="head">
      <div class="t">A &mdash; FULL COLOUR &nbsp;<span style="color:#888;font-size:17px">(logo.png)</span></div>
      <div class="d">Draw it finished, exactly as you want it seen. Whatever colours you use are the colours it has, in light mode and dark mode alike.<br><b>Simplest.</b> Choose this unless you want it to change colour.</div>
    </div>
    <div class="art">
      <div class="cx"></div><div class="cy"></div>
      <div class="circ"></div><div class="sq"></div>
      <div class="cap">square &middot; transparent background &middot; 512&times;512 or larger</div>
    </div>
  </div>

  <div class="box">
    <div class="head">
      <div class="t">B &mdash; STENCIL &nbsp;<span style="color:#888;font-size:17px">(logo-mask.png)</span></div>
      <div class="d">Draw it in FLAT BLACK on transparent &mdash; a solid shape, no colour, no shading, no white. The page then fills that shape with the colour of whichever world you are on: green on About, yellow on Work, pink on Play, coral on Contact.<br><b>Same trick the sun and moon in the switch already use.</b></div>
    </div>
    <div class="art">
      <div class="cx"></div><div class="cy"></div>
      <div class="circ"></div><div class="sq"></div>
      <div class="cap">square &middot; transparent background &middot; flat black only &middot; 512&times;512 or larger</div>
    </div>
  </div>
</div>

<div class="real">
  <h2>How big it actually gets &mdash; shown here at 1:1</h2>
  <p>This is the real masthead at real size. The mark is about 47 pixels on a desktop and 34 on a phone &mdash; roughly the height of the two lines of the name. That is the whole design brief: it has to read at the size of a fingernail. Anything with fine internal detail will turn to mush. One or two strokes, one clear silhouette.</p>
  <div class="mocks">
    <div>
      <div class="mock"><div class="lg" style="width:47px;height:47px"></div>
        <div class="nm" style="font-size:23px">Shobhit Kenath<small style="font-size:20px">UX Design, pencil first</small></div></div>
      <div class="mklab">desktop &mdash; 47&times;47</div>
    </div>
    <div>
      <div class="mock"><div class="lg" style="width:34px;height:34px"></div>
        <div class="nm" style="font-size:16px">Shobhit Kenath<small style="font-size:14px">UX Design, pencil first</small></div></div>
      <div class="mklab">phone &mdash; 34&times;34</div>
    </div>
  </div>
</div>
</body>`;

(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1800,height:1200}});
await p.setContent(html);await p.waitForTimeout(1500);
await p.screenshot({path:(process.argv[2]||'.')+'/sheet-logo.png',fullPage:true});
await b.close();console.log('ok');})();


