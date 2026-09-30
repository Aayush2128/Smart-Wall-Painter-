"""Smart Wall Paint Visualizer - Streamlit app.

Loads the interactive canvas visualizer (paint_visualizer.html) inside Streamlit.
"""
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Smart Wall Paint Visualizer", page_icon="🎨", layout="wide")

st.title("🎨 Smart Wall Paint Visualizer")
st.caption("Upload a photo of your room, select a wall, and preview paint colours before you paint.")

html = (Path(__file__).parent / "paint_visualizer.html").read_text(encoding="utf-8")
components.html(html, height=1100, scrolling=True)

with st.expander("How to use"):
    st.markdown(
        "1. Enter a name and click **Enter** (choose *Admin* to manage colours).\n"
        "2. Upload a JPG/PNG photo of your own room.\n"
        "3. Choose **Polygon** (click the wall corners) or **Brush** (drag over the wall).\n"
        "4. Click a colour to paint the selected area; adjust opacity; use the Before/After slider.\n"
        "5. **Save design** or **Download PNG**."
    )
    st.info("Results are a preview only. Real colour varies with lighting, screen calibration and wall texture.")
