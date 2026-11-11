"""font_trace_api.py — lets font-build-kk.py reuse font-trace.py.

   `font-trace.py` has a hyphen in its name, so `import font_trace` cannot
   find it. Rather than rename a working file that another script already
   depends on, this loads it by path and re-exports the one function the
   new builder needs.
"""
import importlib.util, os
_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'font-trace.py')
_s = importlib.util.spec_from_file_location('font_trace', _p)
_m = importlib.util.module_from_spec(_s)
_s.loader.exec_module(_m)

glyph_from_image = _m.glyph_from_image
contours_from_image = _m.contours_from_image

