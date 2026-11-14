import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Captions, Check, Clapperboard, Download, Film,
  ImagePlus, Music2, Scissors, Sparkles, Upload, Video,
  WandSparkles, X
} from 'lucide-react';

type TabId = 'edit' | 'reels' | 'captions' | 'audio' | 'effects' | 'storyboard' | 'export';

interface VideoStudioProps {
  onBack: () => void;
  onShowToast?: (message: string) => void;
}

type VideoTrackId = 'V1' | 'V2' | 'V3';

interface TimelineClip {
  id: string;
  track: VideoTrackId;
  file: File;
  url: string;
  duration: number;
  start: number;
  end: number;
  timelineStart: number;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'edit', label: 'Auto Edit', icon: Scissors },
  { id: 'reels', label: 'Reels & Shorts', icon: Film },
  { id: 'captions', label: 'Captions', icon: Captions },
  { id: 'audio', label: 'Beat Sync', icon: Music2 },
  { id: 'effects', label: 'Effects', icon: WandSparkles },
  { id: 'storyboard', label: 'Storyboard', icon: Clapperboard },
  { id: 'export', label: 'Export', icon: Download },
];

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#090910] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#D8B34E]/70';
const panelClass = 'rounded-2xl border border-white/10 bg-[#11111A]';

export const VideoStudio: React.FC<VideoStudioProps> = ({ onBack, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<TabId>('edit');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [ratio, setRatio] = useState('9:16');
  const [resolution, setResolution] = useState('1080p');
  const [format, setFormat] = useState('MP4');
  const [captionText, setCaptionText] = useState('Your story. Your style. Created with VIJAY VISUALS.');
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [transition, setTransition] = useState('Smooth fade');
  const [musicVolume, setMusicVolume] = useState(70);
  const [storyboard, setStoryboard] = useState('Scene 1 — Opening wide shot\nScene 2 — Main subject close-up\nScene 3 — Detail shots and movement\nScene 4 — Brand reveal / call to action');
  const [projectName, setProjectName] = useState('My First AI Video Project');
  const [planReady, setPlanReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const clipsInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGraphRef = useRef(new WeakMap<HTMLMediaElement, { gain: GainNode }>());

  useEffect(() => {
    if (!videoFile) { setVideoUrl(''); return; }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    if (!musicFile) { setMusicUrl(''); return; }
    const url = URL.createObjectURL(musicFile);
    setMusicUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [musicFile]);

  useEffect(() => {
    if (duration > 0) {
      setTrimEnd(duration);
      setTrimStart(0);
    }
  }, [duration]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const clipLength = useMemo(() => Math.max(0, trimEnd - trimStart), [trimEnd, trimStart]);

  const seek = (value: number) => {
    const safe = Math.min(Math.max(value, 0), duration || 0);
    setCurrentTime(safe);
    if (videoRef.current) videoRef.current.currentTime = safe;
  };

  const notify = (message: string) => onShowToast?.(message);

  const createProjectPlan = () => {
    const project = {
      product: 'VIJAY VISUALS AI Video Studio',
      projectName,
      sourceVideo: videoFile ? { name: videoFile.name, sizeBytes: videoFile.size, type: videoFile.type, durationSeconds: duration, track: 'V1', timelineStartSeconds: 0 } : null,
      timeline: [
        ...(videoFile ? [{ name: videoFile.name, startSeconds: trimStart, endSeconds: trimEnd, durationSeconds: clipLength }] : []),
        ...timelineClips.map((clip, index) => ({ name: clip.file.name, track: clip.track, order: index + 1, timelineStartSeconds: clip.timelineStart, startSeconds: clip.start, endSeconds: clip.end, durationSeconds: clip.end - clip.start }))
      ],
      musicTrack: musicFile ? { name: musicFile.name, sizeBytes: musicFile.size, type: musicFile.type } : null,
      edit: { trimStartSeconds: trimStart, trimEndSeconds: trimEnd, clipLengthSeconds: clipLength, aspectRatio: ratio, transition, captionsEnabled, captionText, musicVolume },
      export: { resolution, format },
      storyboard: storyboard.split('\n').filter(Boolean),
      note: 'This JSON file stores the edit settings. Use Render Video in the Export panel to create the video file.'
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(projectName.trim() || 'vijay-video-project').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-edit-plan.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setPlanReady(true);
    notify('Your editable video project plan has been downloaded.');
  };

  const addTimelineFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter(file => file.type.startsWith('video/'));
    if (!accepted.length) { notify('Choose one or more video files.'); return; }
    const additions = await Promise.all(accepted.map(file => new Promise<TimelineClip | null>(resolve => {
      const url = URL.createObjectURL(file);
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        const clipDuration = Number.isFinite(probe.duration) ? probe.duration : 0;
        const clip: TimelineClip = { id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, track: 'V1', file, url, duration: clipDuration, start: 0, end: clipDuration, timelineStart: 0 };
        probe.removeAttribute('src');
        probe.load();
        resolve(clip);
      };
      probe.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      probe.src = url;
    })));
    const validAdditions = additions.filter((clip): clip is TimelineClip => !!clip && clip.duration > 0);
    if (!validAdditions.length) { notify('Could not read those video files. Try MP4 or WebM clips.'); return; }
    setTimelineClips(current => [...current, ...validAdditions]);
    setPlanReady(false);
    notify(`${validAdditions.length} clip${validAdditions.length === 1 ? '' : 's'} added to the timeline.`);
  };

  const updateTimelineClip = (id: string, patch: Partial<Pick<TimelineClip, 'start' | 'end' | 'timelineStart'>>) => {
    setTimelineClips(current => current.map(clip => {
      if (clip.id !== id) return clip;
      const start = patch.start ?? clip.start;
      const end = patch.end ?? clip.end;
      return { ...clip, start: Math.min(start, end - 0.1), end: Math.max(end, start + 0.1), timelineStart: Math.max(0, patch.timelineStart ?? clip.timelineStart) };
    }));
    setPlanReady(false);
  };

  const updateTimelineClipTrack = (id: string, track: VideoTrackId) => {
    setTimelineClips(current => current.map(clip => clip.id === id ? { ...clip, track } : clip));
    setPlanReady(false);
  };

  const moveTimelineClip = (index: number, direction: -1 | 1) => {
    setTimelineClips(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPlanReady(false);
  };

  const removeTimelineClip = (id: string) => {
    setTimelineClips(current => {
      const removed = current.find(clip => clip.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter(clip => clip.id !== id);
    });
    setPlanReady(false);
  };


  const draftEditPlan = () => {
    if (!videoFile) {
      notify('Upload a video first to prepare an edit plan.');
      setActiveTab('edit');
      return;
    }
    const end = duration || 30;
    setTrimStart(0);
    setTrimEnd(Math.min(end, 30));
    setRatio('9:16');
    setTransition('Smooth fade');
    setPlanReady(false);
    notify('A starter edit setup is ready. Adjust it to your footage.');
  };

  const drawCaption = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!captionsEnabled || !captionText.trim()) return;
    const fontSize = Math.max(22, Math.round(width * 0.035));
    ctx.save();
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxWidth = width * 0.86;
    const words = captionText.trim().split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    const lineHeight = fontSize * 1.28;
    const paddingX = fontSize * 0.65;
    const paddingY = fontSize * 0.38;
    const boxHeight = lines.length * lineHeight + paddingY * 2;
    const y = height - height * 0.075 - boxHeight;
    const boxWidth = Math.min(maxWidth + paddingX * 2, Math.max(...lines.map(value => ctx.measureText(value).width)) + paddingX * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    const x = (width - boxWidth) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, Math.max(8, fontSize * 0.22));
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    lines.forEach((value, index) => ctx.fillText(value, width / 2, y + paddingY + lineHeight * (index + 0.5), maxWidth));
    ctx.restore();
  };

  const renderVideo = async () => {
    if (!videoFile || !duration || trimEnd <= trimStart) {
      notify('Upload a video and set a valid In/Out range first.');
      setActiveTab('edit');
      return;
    }
    if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) {
      notify('This browser does not support local video rendering. Use the latest Chrome or Edge.');
      return;
    }

    type RenderLayer = { url: string; name: string; track: VideoTrackId; sequenceStart: number; sourceStart: number; sourceEnd: number; element: HTMLVideoElement; started: boolean };
    const makeVideo = (url: string) => {
      const element = document.createElement('video');
      element.src = url;
      element.preload = 'auto';
      element.playsInline = true;
      element.crossOrigin = 'anonymous';
      element.muted = false;
      return element;
    };
    const layers: RenderLayer[] = [
      { url: videoUrl, name: videoFile.name, track: 'V1', sequenceStart: 0, sourceStart: trimStart, sourceEnd: trimEnd, element: makeVideo(videoUrl), started: false },
      ...timelineClips.map(clip => ({ url: clip.url, name: clip.file.name, track: clip.track, sequenceStart: clip.timelineStart, sourceStart: clip.start, sourceEnd: clip.end, element: makeVideo(clip.url), started: false }))
    ].sort((a, b) => ['V1','V2','V3'].indexOf(a.track) - ['V1','V2','V3'].indexOf(b.track));
    const totalRenderDuration = Math.max(...layers.map(layer => layer.sequenceStart + layer.sourceEnd - layer.sourceStart));
    if (!Number.isFinite(totalRenderDuration) || totalRenderDuration <= 0) { notify('The timeline has no renderable duration.'); return; }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing layered video renderer…');
    let canvasStream: MediaStream | null = null;
    let outputStream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let animationFrame = 0;
    let audioContext: AudioContext | null = null;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    const connectedGains: GainNode[] = [];
    let allowDownload = true;
    let actualFormat: 'MP4' | 'WebM' = format === 'MP4' ? 'MP4' : 'WebM';

    const waitForData = (element: HTMLVideoElement, name: string) => new Promise<void>((resolve, reject) => {
      if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) { resolve(); return; }
      const timeout = window.setTimeout(() => finish(new Error(`Timed out loading ${name}.`)), 30000);
      const cleanup = () => { window.clearTimeout(timeout); element.removeEventListener('loadeddata', onLoaded); element.removeEventListener('error', onError); };
      const finish = (error?: Error) => { cleanup(); error ? reject(error) : resolve(); };
      const onLoaded = () => finish();
      const onError = () => finish(new Error(`Could not load ${name}.`));
      element.addEventListener('loadeddata', onLoaded, { once: true });
      element.addEventListener('error', onError, { once: true });
      element.load();
    });
    const seekElement = (element: HTMLVideoElement, time: number, name: string) => new Promise<void>((resolve, reject) => {
      if (Math.abs(element.currentTime - time) < 0.04) { resolve(); return; }
      const timeout = window.setTimeout(() => finish(new Error(`Timed out seeking ${name}.`)), 15000);
      const cleanup = () => { window.clearTimeout(timeout); element.removeEventListener('seeked', onSeeked); element.removeEventListener('error', onError); };
      const finish = (error?: Error) => { cleanup(); error ? reject(error) : resolve(); };
      const onSeeked = () => finish();
      const onError = () => finish(new Error(`Could not seek ${name}.`));
      element.addEventListener('seeked', onSeeked, { once: true });
      element.addEventListener('error', onError, { once: true });
      element.currentTime = time;
    });

    try {
      const dimensions: Record<string, { portrait: [number, number]; landscape: [number, number]; square: [number, number] }> = {
        '720p': { portrait: [720, 1280], landscape: [1280, 720], square: [720, 720] },
        '1080p': { portrait: [1080, 1920], landscape: [1920, 1080], square: [1080, 1080] },
        '2K': { portrait: [1440, 2560], landscape: [2560, 1440], square: [1440, 1440] },
        '4K': { portrait: [2160, 3840], landscape: [3840, 2160], square: [2160, 2160] },
      };
      const selected = dimensions[resolution] || dimensions['1080p'];
      const [width, height] = ratio === '9:16' ? selected.portrait : ratio === '1:1' ? selected.square : selected.landscape;
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Could not create the video render canvas.');
      await Promise.all(layers.map(layer => waitForData(layer.element, layer.name)));
      await Promise.all(layers.map(layer => seekElement(layer.element, layer.sourceStart, layer.name)));

      const drawLayer = (element: HTMLVideoElement) => {
        if (!element.videoWidth || !element.videoHeight || element.readyState < 2) return;
        const scale = Math.max(width / element.videoWidth, height / element.videoHeight);
        const sourceWidth = width / scale, sourceHeight = height / scale;
        const sourceX = (element.videoWidth - sourceWidth) / 2, sourceY = (element.videoHeight - sourceHeight) / 2;
        context.drawImage(element, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
      };
      const drawComposite = (sequenceTime: number) => {
        context.fillStyle = '#000'; context.fillRect(0, 0, width, height);
        // Lower tracks render first; V3 is composited on top of V2 and V1.
        layers.forEach(layer => {
          const localTime = sequenceTime - layer.sequenceStart;
          const active = localTime >= 0 && localTime < (layer.sourceEnd - layer.sourceStart);
          if (active) drawLayer(layer.element);
        });
        drawCaption(context, width, height);
      };
      drawComposite(0);
      canvasStream = canvas.captureStream(30);
      const tracks = [...canvasStream.getVideoTracks()];
      const AudioContextConstructor = window.AudioContext;
      if (AudioContextConstructor) {
        audioContext = audioContextRef.current || new AudioContextConstructor();
        audioContextRef.current = audioContext;
        await audioContext.resume();
        audioDestination = audioContext.createMediaStreamDestination();
        layers.forEach(layer => {
          const element = layer.element;
          let graph = audioGraphRef.current.get(element);
          if (!graph) {
            const source = audioContext!.createMediaElementSource(element);
            const gain = audioContext!.createGain();
            source.connect(gain); gain.connect(audioContext!.destination);
            graph = { gain }; audioGraphRef.current.set(element, graph);
          }
          graph.gain.gain.value = 1;
          graph.gain.connect(audioDestination!);
          connectedGains.push(graph.gain);
        });
        if (musicAudioRef.current && musicUrl) {
          const music = musicAudioRef.current;
          music.currentTime = 0; music.loop = true;
          let graph = audioGraphRef.current.get(music);
          if (!graph) {
            const source = audioContext.createMediaElementSource(music);
            const gain = audioContext.createGain(); source.connect(gain); gain.connect(audioContext.destination);
            graph = { gain }; audioGraphRef.current.set(music, graph);
          }
          graph.gain.gain.value = musicVolume / 100;
          graph.gain.connect(audioDestination);
          connectedGains.push(graph.gain);
        }
        tracks.push(...audioDestination.stream.getAudioTracks());
      }
      outputStream = new MediaStream(tracks);
      const mp4Types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4'];
      const webmTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const supportedMp4 = mp4Types.find(type => MediaRecorder.isTypeSupported(type));
      const supportedWebm = webmTypes.find(type => MediaRecorder.isTypeSupported(type));
      let mimeType = '';
      if (format === 'MP4' && supportedMp4) { mimeType = supportedMp4; actualFormat = 'MP4'; }
      else if (supportedWebm) { mimeType = supportedWebm; actualFormat = 'WebM'; if (format === 'MP4') notify('MP4 recording is unavailable here; exporting WebM instead.'); }
      else if (supportedMp4) { mimeType = supportedMp4; actualFormat = 'MP4'; }
      else throw new Error('This browser cannot record MP4 or WebM. Use the latest Chrome or Edge.');
      const bitrate = resolution === '4K' ? 18000000 : resolution === '2K' ? 12000000 : resolution === '720p' ? 5000000 : 8500000;
      recorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: bitrate });
      const chunks: BlobPart[] = [];
      const recorderFinished = new Promise<void>((resolve, reject) => {
        recorder!.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder!.onerror = () => reject(new Error('The browser recorder stopped unexpectedly.'));
        recorder!.onstop = () => {
          if (!allowDownload) { resolve(); return; }
          const blob = new Blob(chunks, { type: mimeType });
          if (!blob.size) { reject(new Error('The rendered video was empty.')); return; }
          const downloadUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          const safeName = (projectName.trim() || 'vijay-visuals-video').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
          anchor.href = downloadUrl; anchor.download = `${safeName}-multitrack.${actualFormat === 'MP4' ? 'mp4' : 'webm'}`;
          document.body.appendChild(anchor); anchor.click(); anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
          resolve();
        };
      });
      setExportStatus(`Compositing ${layers.length} video layer(s) · ${resolution} ${ratio}…`);
      recorder.start(1000);
      if (musicAudioRef.current && musicUrl) { try { await musicAudioRef.current.play(); } catch { notify('Music playback was blocked; continuing without music.'); } }
      const startedAt = performance.now();
      await new Promise<void>((resolve, reject) => {
        const frame = async () => {
          try {
            const sequenceTime = Math.min(totalRenderDuration, (performance.now() - startedAt) / 1000);
            for (const layer of layers) {
              const localTime = sequenceTime - layer.sequenceStart;
              const active = localTime >= 0 && localTime < (layer.sourceEnd - layer.sourceStart);
              if (active && !layer.started) {
                await seekElement(layer.element, layer.sourceStart + localTime, layer.name);
                layer.started = true;
                try { await layer.element.play(); } catch { throw new Error(`Playback was blocked for ${layer.name}.`); }
              } else if (!active && layer.started) {
                layer.element.pause(); layer.started = false;
              }
            }
            drawComposite(sequenceTime);
            setExportProgress(Math.min(99, Math.round(sequenceTime / totalRenderDuration * 100)));
            if (sequenceTime >= totalRenderDuration) { layers.forEach(layer => layer.element.pause()); resolve(); return; }
            animationFrame = requestAnimationFrame(() => { void frame().catch(reject); });
          } catch (error) { reject(error); }
        };
        animationFrame = requestAnimationFrame(() => { void frame().catch(reject); });
      });
      if (recorder.state === 'recording') recorder.stop();
      await recorderFinished;
      setExportProgress(100); setExportStatus(`Finished · layered ${actualFormat} video downloaded`);
      notify(`Layered ${actualFormat} export completed. Check Downloads.`);
    } catch (error) {
      allowDownload = false;
      if (recorder?.state === 'recording') recorder.stop();
      const message = error instanceof Error ? error.message : 'Multi-track export failed.';
      setExportStatus(message); notify(message);
    } finally {
      cancelAnimationFrame(animationFrame);
      layers.forEach(layer => { layer.element.pause(); layer.element.removeAttribute('src'); layer.element.load(); });
      musicAudioRef.current?.pause();
      connectedGains.forEach(gain => { try { if (audioDestination) gain.disconnect(audioDestination); } catch { /* already disconnected */ } });
      canvasStream?.getTracks().forEach(track => track.stop());
      outputStream?.getTracks().forEach(track => track.stop());
      audioDestination?.stream.getTracks().forEach(track => track.stop());
      setIsExporting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#08080C] text-[#F4F1E8]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08080C]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => { if (!isExporting) onBack(); }} disabled={isExporting} className="rounded-xl border border-white/10 p-2 text-white/70 hover:border-[#D8B34E]/50 hover:text-[#E7C66D]" aria-label="Back to Vijay Visuals">
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0D17A] to-[#9C7627] text-[#111] shadow-lg shadow-[#D8B34E]/10">
              <Video size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-[0.16em] text-white">VIJAY <span className="text-[#E4C36B]">AI VIDEO STUDIO</span></p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">2050 Creator Ecosystem · Workspace Preview</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Local editing workspace</span>
            <button onClick={createProjectPlan} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8C86E] to-[#B78D31] px-4 py-2.5 text-xs font-bold text-[#17130A] hover:brightness-110"><Download size={14} /> Save Edit Plan</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D9B653]"><Sparkles size={14} /> Creator AI Suite · Module 01</p>
            <h1 className="font-luxury text-3xl font-bold text-white sm:text-4xl">Your video. Your vision.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Bring footage into one workspace, shape a short-form edit, prepare captions and export settings, then save your project plan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => videoInputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-[#D8B34E]/40 bg-[#D8B34E]/10 px-4 py-3 text-xs font-bold text-[#E8CB7B] hover:bg-[#D8B34E]/20"><Upload size={15} /> Upload Video</button>
            <button onClick={draftEditPlan} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black hover:bg-[#E8CB7B]"><WandSparkles size={15} /> Quick Edit Setup</button>
          </div>
        </div>

        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setVideoFile(file); setPlanReady(false); } e.currentTarget.value = ''; }} />
        <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setMusicFile(file); setPlanReady(false); } e.currentTarget.value = ''; }} />
        <input ref={clipsInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => { void addTimelineFiles(e.target.files); e.currentTarget.value = ''; }} />
        {musicUrl && <audio ref={musicAudioRef} controls src={musicUrl} className="mb-4 w-full max-w-md" />}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Film size={16} className="text-[#D9B653]" /> Preview Monitor</div>
              <div className="flex items-center gap-2 text-[11px] text-white/40"><span>{ratio}</span><span>·</span><span>{resolution}</span></div>
            </div>
            <div className="flex min-h-[300px] items-center justify-center bg-[radial-gradient(ellipse_at_center,_#24202a_0%,_#0a0a0e_68%)] p-4 sm:min-h-[430px]">
              {videoUrl ? (
                <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl ${ratio === '9:16' ? 'h-[390px] max-w-full aspect-[9/16]' : ratio === '1:1' ? 'w-full max-w-[430px] aspect-square' : 'w-full max-w-[760px] aspect-video'}`}>
                  <video ref={videoRef} src={videoUrl} controls className="h-full w-full object-contain" onLoadedMetadata={(e) => { const d = e.currentTarget.duration || 0; setDuration(d); setCurrentTime(0); }} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} />
                  {captionsEnabled && captionText.trim() && <div className="pointer-events-none absolute bottom-12 left-3 right-3 text-center"><span className="rounded-md bg-black/70 px-3 py-1.5 text-sm font-bold text-white [text-shadow:0_1px_3px_#000]">{captionText}</span></div>}
                </div>
              ) : (
                <button onClick={() => videoInputRef.current?.click()} className="flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed border-[#D8B34E]/35 bg-black/20 px-6 py-12 text-center transition hover:border-[#D8B34E]/70 hover:bg-[#D8B34E]/5">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8B34E]/10 text-[#E7C66D]"><Upload size={27} /></div>
                  <span className="text-base font-bold text-white">Drop your footage into the studio</span>
                  <span className="mt-2 text-xs text-white/40">Choose a video from your device · MP4, MOV, WebM</span>
                  <span className="mt-5 rounded-lg bg-[#E8C86E] px-4 py-2 text-xs font-bold text-black">Browse Videos</span>
                </button>
              )}
            </div>
            <div className="border-t border-white/10 p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/45"><span>PLAYHEAD</span><span className="font-mono text-[#E7C66D]">{formatTime(currentTime)} / {formatTime(duration)}</span></div>
              <input aria-label="Seek video timeline" type="range" min={0} max={Math.max(duration, 1)} step="0.1" value={Math.min(currentTime, Math.max(duration, 1))} onChange={(e) => seek(Number(e.target.value))} disabled={!videoUrl} className="w-full accent-[#D8B34E]" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-white/50"><span className="h-2 w-2 rounded-full bg-[#D8B34E]" /> {videoFile ? videoFile.name : 'No video selected'}</div>
                <div className="flex gap-2"><button disabled={!videoUrl} onClick={() => seek(trimStart)} className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/70 disabled:opacity-30">Go to In</button><button disabled={!videoUrl} onClick={() => seek(trimEnd)} className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/70 disabled:opacity-30">Go to Out</button></div>
              </div>
            </div>
          </section>

          <aside className={`${panelClass} min-w-0`}>
            <div className="border-b border-white/10 px-4 py-3"><p className="text-sm font-semibold">Studio Controls</p><p className="mt-1 text-[11px] text-white/40">Seven tools · One creative workspace</p></div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 xl:grid-cols-2">
              {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${activeTab === tab.id ? 'border-[#D8B34E]/50 bg-[#D8B34E]/10 text-[#E8CB7B]' : 'border-white/5 bg-black/20 text-white/55 hover:border-white/15 hover:text-white'}`}><Icon size={15} />{tab.label}</button>; })}
            </div>
            <div className="border-t border-white/10 p-4">
              {activeTab === 'edit' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Trim your footage</h3><p className="mt-1 text-xs text-white/40">Set the clip's in and out points.</p></div><label className="block text-xs text-white/55">Project name<input className={`${fieldClass} mt-2`} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs text-white/55">Start (sec)<input className={`${fieldClass} mt-2`} type="number" min={0} max={duration || undefined} value={trimStart} onChange={(e) => setTrimStart(Math.max(0, Math.min(Number(e.target.value), trimEnd)))} /></label><label className="text-xs text-white/55">End (sec)<input className={`${fieldClass} mt-2`} type="number" min={trimStart} max={duration || undefined} value={trimEnd} onChange={(e) => setTrimEnd(Math.max(trimStart, Math.min(Number(e.target.value), duration || Number(e.target.value))))} /></label></div><div className="rounded-xl bg-black/30 p-3"><div className="mb-2 flex justify-between text-xs"><span className="text-white/45">Selected clip length</span><strong className="text-[#E7C66D]">{formatTime(clipLength)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#E8C86E] to-[#A77C24]" style={{ width: `${duration ? Math.min(100, (clipLength / duration) * 100) : 0}%` }} /></div></div><button disabled={!videoUrl} onClick={draftEditPlan} className="w-full rounded-xl bg-[#E8C86E] py-3 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">Prepare Starter Edit</button></div>}
              {activeTab === 'reels' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Format for every platform</h3><p className="mt-1 text-xs text-white/40">Choose the canvas for your final composition.</p></div><div className="grid grid-cols-3 gap-2">{['9:16', '16:9', '1:1'].map((value) => <button key={value} onClick={() => setRatio(value)} className={`rounded-xl border p-3 text-center ${ratio === value ? 'border-[#D8B34E] bg-[#D8B34E]/10 text-[#E8CB7B]' : 'border-white/10 text-white/55'}`}><div className={`mx-auto mb-2 border-2 ${ratio === value ? 'border-[#E8C86E]' : 'border-white/40'} ${value === '9:16' ? 'h-9 w-5' : value === '1:1' ? 'h-7 w-7' : 'h-5 w-9'}`} /><span className="text-xs font-bold">{value}</span></button>)}</div><div className="rounded-xl border border-white/10 p-3 text-xs text-white/50">Selected canvas: <strong className="text-white">{ratio === '9:16' ? 'Reels, Shorts & Stories' : ratio === '16:9' ? 'YouTube & widescreen' : 'Square social posts'}</strong></div></div>}
              {activeTab === 'captions' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Caption workspace</h3><p className="mt-1 text-xs text-white/40">Edit the caption overlay for your preview.</p></div><label className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-xs text-white/70">Show caption overlay<input type="checkbox" checked={captionsEnabled} onChange={(e) => setCaptionsEnabled(e.target.checked)} className="h-4 w-4 accent-[#D8B34E]" /></label><textarea className={`${fieldClass} min-h-32 resize-y`} value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Type your caption here..." /><div className="rounded-xl bg-black/30 p-3 text-[11px] text-white/45">Automatic speech recognition and word-by-word subtitle timing are not connected yet. This is a manual caption overlay preview.</div></div>}
              {activeTab === 'audio' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Music & audio track</h3><p className="mt-1 text-xs text-white/40">Add a local audio file and set its mix level.</p></div><button onClick={() => musicInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8B34E]/40 p-4 text-xs font-semibold text-[#E8CB7B]"><Music2 size={16} /> Add Music Track</button>{musicFile && <div className="flex items-center justify-between gap-2 rounded-xl bg-black/30 p-3 text-xs"><span className="truncate text-white/70">{musicFile.name}</span><button onClick={() => setMusicFile(null)} aria-label="Remove music"><X size={14} /></button></div>}<label className="block text-xs text-white/55">Music volume · {musicVolume}%<input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="mt-3 w-full accent-[#D8B34E]" /></label></div>}
              {activeTab === 'effects' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Transitions & look</h3><p className="mt-1 text-xs text-white/40">Choose an edit direction for your plan.</p></div><label className="block text-xs text-white/55">Transition style<select className={`${fieldClass} mt-2`} value={transition} onChange={(e) => setTransition(e.target.value)}><option>Smooth fade</option><option>Clean cut</option><option>Slide</option><option>Zoom in</option><option>Whip pan</option></select></label><div className="rounded-xl border border-white/10 p-3 text-xs leading-5 text-white/45">Effect selection is saved into your project plan. Visual effect rendering and GPU processing are not connected in this prototype.</div></div>}
              {activeTab === 'storyboard' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Scene-by-scene storyboard</h3><p className="mt-1 text-xs text-white/40">Plan the story before editing.</p></div><textarea className={`${fieldClass} min-h-48 resize-y leading-6`} value={storyboard} onChange={(e) => setStoryboard(e.target.value)} /><div className="flex items-center gap-2 text-[11px] text-white/40"><ImagePlus size={14} /> Add scene references in a future update.</div></div>}
              {activeTab === 'export' && <div className="space-y-4"><div><h3 className="text-sm font-bold">Render & export video</h3><p className="mt-1 text-xs text-white/40">Create a real video file from the selected In/Out range.</p></div><label className="block text-xs text-white/55">Resolution<select className={`${fieldClass} mt-2`} value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isExporting}><option>720p</option><option>1080p</option><option>2K</option><option>4K</option></select></label><label className="block text-xs text-white/55">Container format<select className={`${fieldClass} mt-2`} value={format} onChange={(e) => setFormat(e.target.value)} disabled={isExporting}><option>MP4</option><option>WebM</option></select></label><div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-white/55">Export includes the selected trim, {ratio} crop, chosen resolution{captionsEnabled ? ', manual caption overlay' : ''}{musicUrl ? ' and your music track' : ''}. Some browsers cannot record MP4; when that happens, this studio exports WebM and names it correctly.</div><button disabled={!videoUrl || isExporting || clipLength <= 0} onClick={renderVideo} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8C86E] to-[#B78D31] py-3 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"><Download size={15} /> {isExporting ? 'Rendering video…' : 'Render & Download Video'}</button>{isExporting && <div className="space-y-2"><div className="flex justify-between text-[11px] text-white/55"><span>{exportStatus}</span><strong className="text-[#E7C66D]">{exportProgress}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#E8C86E] to-[#A77C24] transition-[width]" style={{ width: `${exportProgress}%` }} /></div></div>}{!isExporting && exportStatus && <p className={`text-xs ${exportProgress === 100 ? 'text-emerald-300' : 'text-amber-200/80'}`}>{exportStatus}</p>}<button onClick={createProjectPlan} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-xs font-semibold text-white/70 hover:border-[#D8B34E]/40"><Download size={15} /> Download Edit Plan (JSON)</button>{planReady && <p className="flex items-center gap-2 text-xs text-emerald-300"><Check size={14} /> Project plan downloaded.</p>}<p className="text-[11px] leading-5 text-white/35">Rendering happens locally in this browser. Long clips and 4K settings need more memory and processing power. Automatic AI edits, speech-to-text captions, beat detection and advanced effects are still separate future features.</p></div>}
            </div>
          </aside>
        </div>

        <section className={`${panelClass} mt-5 p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="flex items-center gap-2 text-sm font-bold"><Film size={16} className="text-[#D9B653]" /> Multi-track timeline · Phase 3B</p><p className="mt-1 text-xs text-white/40">Set each clip's sequence start and layer. Higher video lanes composite above lower lanes during export.</p></div>
            <button onClick={() => clipsInputRef.current?.click()} disabled={!videoFile || isExporting} className="flex items-center gap-2 rounded-xl border border-[#D8B34E]/40 bg-[#D8B34E]/10 px-4 py-2.5 text-xs font-bold text-[#E8CB7B] disabled:opacity-40"><Upload size={14} /> Add Clips</button>
          </div>
          <div className="space-y-3">
            {(['V1', 'V2', 'V3'] as VideoTrackId[]).map(track => {
              const clipsOnTrack = timelineClips.filter(clip => clip.track === track);
              return <div key={track} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold tracking-wider text-[#E8CB7B]">{track} · VIDEO TRACK</span><span className="text-[10px] text-white/35">{track === 'V1' && videoFile ? clipsOnTrack.length + 1 : clipsOnTrack.length} clip(s)</span></div>
                {track === 'V1' && videoFile && <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-[#D8B34E]/30 bg-[#D8B34E]/[0.06] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#D8B34E]/15 text-[10px] font-black text-[#E8CB7B]">M</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{videoFile.name}</p><p className="mt-1 text-[10px] text-white/40">Main source · {formatTime(trimStart)} – {formatTime(trimEnd)}</p></div>
                  <span className="text-[10px] text-[#E8CB7B]">MAIN CLIP</span>
                </div>}
                {clipsOnTrack.length === 0 && !(track === 'V1' && videoFile) && <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[10px] text-white/30">Empty track · Assign an imported clip below</p>}
                {clipsOnTrack.map(clip => <div key={clip.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#171722] p-3 last:mb-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-black text-white/60">{String(timelineClips.findIndex(item => item.id === clip.id) + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{clip.file.name}</p><p className="mt-1 text-[10px] text-white/40">Source In/Out · {formatTime(clip.start)} – {formatTime(clip.end)} · Seq {formatTime(clip.timelineStart)} · {formatTime(clip.end - clip.start)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-[10px] text-white/40">Track <select aria-label={`Track for ${clip.file.name}`} value={clip.track} disabled={isExporting} onChange={event => updateTimelineClipTrack(clip.id, event.target.value as VideoTrackId)} className="ml-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white"><option value="V1">V1</option><option value="V2">V2</option><option value="V3">V3</option></select></label>
                      <label className="text-[10px] text-white/40">In <input aria-label={`In point for ${clip.file.name}`} type="number" min={0} max={clip.end - 0.1} step="0.1" value={clip.start} disabled={isExporting} onChange={event => updateTimelineClip(clip.id, { start: Math.max(0, Math.min(Number(event.target.value), clip.end - 0.1)) })} className="ml-1 w-16 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white" /></label>
                      <label className="text-[10px] text-white/40">Out <input aria-label={`Out point for ${clip.file.name}`} type="number" min={clip.start + 0.1} max={clip.duration} step="0.1" value={clip.end} disabled={isExporting} onChange={event => updateTimelineClip(clip.id, { end: Math.max(clip.start + 0.1, Math.min(Number(event.target.value), clip.duration)) })} className="ml-1 w-16 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white" /></label>
                      <label className="text-[10px] text-white/40">Timeline start <input aria-label={`Timeline start for ${clip.file.name}`} type="number" min={0} step="0.1" value={clip.timelineStart} disabled={isExporting} onChange={event => updateTimelineClip(clip.id, { timelineStart: Number(event.target.value) })} className="ml-1 w-16 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white" /></label>
                    </div>
                  </div>
                  <div className="flex items-center gap-1"><button onClick={() => moveTimelineClip(timelineClips.findIndex(item => item.id === clip.id), -1)} disabled={isExporting || timelineClips.findIndex(item => item.id === clip.id) === 0} aria-label={`Move ${clip.file.name} earlier`} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 disabled:opacity-20">↑</button><button onClick={() => moveTimelineClip(timelineClips.findIndex(item => item.id === clip.id), 1)} disabled={isExporting || timelineClips.findIndex(item => item.id === clip.id) === timelineClips.length - 1} aria-label={`Move ${clip.file.name} later`} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 disabled:opacity-20">↓</button><button onClick={() => removeTimelineClip(clip.id)} disabled={isExporting} aria-label={`Remove ${clip.file.name}`} className="rounded-lg border border-white/10 p-2 text-white/45 hover:border-red-400/40 hover:text-red-300 disabled:opacity-30"><X size={14} /></button></div>
                </div>)}
              </div>;
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/40"><span>{videoFile ? timelineClips.length + 1 : 0} source clip(s) · 3 video lanes</span><span>Sequence estimate: {formatTime(Math.max(clipLength, ...timelineClips.map(clip => clip.timelineStart + clip.end - clip.start), 0))}</span></div>
          <p className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/5 p-3 text-[10px] leading-5 text-amber-100/70">Phase 3B: layered V1/V2/V3 compositing is enabled in browser export. Set Timeline start to control overlap; V3 is drawn above V2, and V2 above V1. Browser recording support and real-time performance depend on your device.</p>
        </section>

        <section className={`${panelClass} mt-5 p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">Your production workflow</p><p className="mt-1 text-xs text-white/40">A local workflow from raw footage to a rendered sequence.</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/40">Prototype build</span></div>
          <div className="grid gap-3 sm:grid-cols-4">{[{n:'01',t:'Import',d:'Upload video and music'},{n:'02',t:'Shape',d:'Trim, crop and plan scenes'},{n:'03',t:'Polish',d:'Captions, audio and effects'},{n:'04',t:'Export',d:'Render and download video'}].map((item) => <div key={item.n} className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[10px] font-bold tracking-widest text-[#D9B653]">STEP {item.n}</p><p className="mt-2 text-sm font-bold text-white">{item.t}</p><p className="mt-1 text-xs text-white/40">{item.d}</p></div>)}</div>
        </section>
        <p className="mt-5 text-center text-[10px] leading-5 text-white/30">VIJAY VISUALS 2050 · Local browser video renderer. Your selected media stays on this device; rendered video and edit plan download to your device.</p>
      </main>
    </div>
  );
};
