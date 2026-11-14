VIJAY VISUALS AI VIDEO STUDIO — PHASE 3B

What changed
- Added per-clip sequence-start positioning to the V1/V2/V3 timeline and edit-plan JSON.
- Replaced the sequential extra-clip export loop with a canvas compositor that schedules clips against one shared sequence clock.
- Compositing order is V1 (bottom), V2, then V3 (top). Clips on the same lane follow their current import/order sequence.
- Each clip's source In/Out remains separate from its sequence start.
- Browser export mixes audio from active video elements and the optional music track, subject to browser MediaRecorder/Web Audio support.

How to use
1. Import a main video, then Add Clips.
2. Assign each imported clip to V1, V2, or V3.
3. Set each clip's Timeline start (seconds). Use the same start value to overlap clips; stagger values to sequence them.
4. Export. V3 is composited above V2, and V2 above V1.

Important limitations
- This is a browser-based canvas/MediaRecorder renderer, not a native professional NLE engine or GPU-accelerated mastering pipeline.
- Preview monitor is still the original single-source preview; layered compositing currently applies to export, not interactive multi-layer preview.
- Browser scheduling is best-effort; frame-accurate professional synchronization, advanced transitions/keyframes, masks, effects, color grading, proxy media, and long-form reliability remain future milestones.
- MP4 support varies by browser; WebM fallback is used when MP4 MediaRecorder is unavailable.
- Build could not be re-run in this packaging environment because dependency installation timed out. Run `npm.cmd ci` then `npm.cmd run build` on Windows before production use.
