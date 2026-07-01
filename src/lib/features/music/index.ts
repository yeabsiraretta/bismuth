/**
 * Music feature module — public API barrel.
 * External consumers MUST import only from this path.
 * Never import internal paths: @/features/music/stores/... externally.
 */

// Types
export type {
  TrackType,
  ClipType,
  MidiNote,
  AudioClip,
  Track,
  MusicDocument,
  AudioEngineState,
  TransportState,
  StemResult,
  StemJob,
} from './types/music';

export { isMusicDocument, isAudioTrack, isMidiTrack } from './types/music';

// Stores
export {
  activeMusicDoc,
  playbackState,
  playbackPosition,
  selectedTrackId,
  selectedClipId,
  bpm,
  createMusicDocument,
  loadDocument,
  saveDocument,
  addTrack,
  addClip,
  updateTrack,
  deleteTrack,
  setPlaybackState,
  addMidiNote,
  removeMidiNote,
  updateMidiNotes,
} from './stores/musicStore';

// Audio engine store
export {
  audioEngineState,
  isPlaying,
  isPaused,
  isStopped,
  initEngine,
  play,
  pause,
  stop,
  setBpm,
  resetEngine,
} from './stores/audioEngine';

// Services — audio
export {
  getAudioContext,
  resumeAudioContext,
  disposeAudioContext,
  getCurrentTime,
  playTone,
  loadAudioBuffer,
  scheduleClip,
  clearSchedule,
  setTempo,
  startTransport,
  stopTransport,
  pauseTransport,
  initTone,
  isToneReady,
  connectTrackToOutput,
  setTrackPan,
  muteTrack,
  removeTrackNodes,
  exportWav,
} from './services/audioContext';

// Services — MIDI export
export { exportMidi } from './services/midiExport';

// Services — Demucs
export { splitStems } from './services/demucs';

// Services — ABC notation
export type { AbcBlock } from './services/abcParser';
export { findAbcBlocks, parseAbcBlockContent, sampleAbcBlock } from './services/abcParser';
export { AbcNotationWidget } from './services/abcWidget';
export { abcNotationExtension } from './services/abcExtension';

// Types — Chord sheets
export type {
  ChordInstrument,
  ChordToken,
  ChordLine,
  ChordLineType,
  ChordSheet,
  ChordFingering,
  ChordDefinition,
  ChordSheetConfig,
} from './types/chords';
export {
  NOTE_NAMES_SHARP,
  NOTE_NAMES_FLAT,
  NOTE_TO_INDEX,
  INSTRUMENT_STRING_COUNTS,
  INSTRUMENT_TUNINGS,
  DEFAULT_CHORD_CONFIG,
} from './types/chords';

// Services — Chord sheets
export {
  parseChordSymbol,
  extractChords,
  isChordLine,
  classifyLine,
  parseChordBlock,
  findChordBlocks,
  sampleChordSheet,
} from './services/chords/chordParser';
export {
  transposeNote,
  transposeChord,
  transposeChordLine,
  transposeLines,
  transposeLabel,
  transposeOptions,
} from './services/chords/chordTranspose';
export {
  lookupChord,
  parseCustomShape,
  renderChordDiagramSvg,
  getUniqueChords,
} from './services/chords/chordDiagrams';
export { ChordSheetWidget } from './services/chords/chordWidget';
export { chordSheetExtension } from './services/chords/chordExtension';

// Types — Audio player
export type {
  AudioBookmark,
  AudioPlayerStatus,
  AudioPlayerState,
  AudioPlayerBlock,
  AudioPlayerConfig,
} from './types/audioPlayer';
export { INITIAL_PLAYER_STATE, DEFAULT_AUDIO_PLAYER_CONFIG } from './types/audioPlayer';

// Stores — Audio player
export {
  audioPlayerState,
  playerStatus,
  playerPosition,
  playerDuration,
  playerVolume,
  playerBookmarks,
  playerFile,
  playerWaveform,
  loadAudio,
  playAudio,
  pauseAudio,
  stopAudio,
  seekAudio,
  setPlayerVolume,
  setPlaybackRate,
  togglePlayback,
  addBookmark,
  removeBookmark,
  setBlockBookmarks,
} from './stores/audioPlayerStore';

// Services — Audio player
export {
  parseTimestamp,
  formatTimestamp,
  parseAudioPlayerBlock,
  findAudioPlayerBlocks,
  sampleAudioPlayerBlock,
} from './services/audioPlayer/audioPlayerParser';
export { AudioPlayerWidget } from './services/audioPlayer/audioPlayerWidget';
export { audioPlayerExtension } from './services/audioPlayer/audioPlayerExtension';

// Components
export { default as MusicPanel } from './components/MusicPanel.svelte';
export { default as MusicCanvas } from './components/MusicCanvas.svelte';
export { default as TransportBar } from './components/TransportBar.svelte';
export { default as MixerPanel } from './components/MixerPanel.svelte';
export { default as PianoRoll } from './components/PianoRoll.svelte';
export { default as StemSplitterPanel } from './components/StemSplitterPanel.svelte';
export { default as MusicExportMenu } from './components/MusicExportMenu.svelte';
