/** Original local score + rendered instrument effects. One music voice, no noise bed. */
export type SafariSound = "bait" | "pulse" | "capture" | "release" | "trap";
const FILES = [
  "fern-garden",
  "bait",
  "pulse",
  "capture",
  "release",
  "trap",
] as const;
export class SafariAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private voices = new Set<AudioBufferSourceNode>();
  private mode = "intro";
  private error = "";
  muted = false;
  musicVolume = 0.55;
  effectsVolume = 0.72;
  async unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.knee.value = 12;
        limiter.ratio.value = 3;
        limiter.attack.value = 0.006;
        limiter.release.value = 0.18;
        limiter.connect(this.context.destination);
        this.master = this.context.createGain();
        this.master.connect(limiter);
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.master);
        this.effectsGain = this.context.createGain();
        this.effectsGain.connect(this.master);
      }
      await this.context.resume();
      this.loading ??= Promise.all(
        FILES.map(async (name) => {
          const response = await fetch(
            `${import.meta.env.BASE_URL}audio/${name}.mp3`,
          );
          if (!response.ok) throw Error(`${name}: HTTP ${response.status}`);
          this.buffers.set(
            name,
            await this.context!.decodeAudioData(await response.arrayBuffer()),
          );
        }),
      ).then(() => {});
      await this.loading;
      if (!this.music) {
        const source = this.context.createBufferSource();
        source.buffer = this.buffers.get("fern-garden")!;
        source.loop = true;
        source.loopStart = 0;
        source.loopEnd = Math.min(57.6, source.buffer.duration);
        source.connect(this.musicGain!);
        source.start();
        this.music = source;
      }
      this.apply();
    } catch (error) {
      this.error = String(error);
      console.error("Safari audio unavailable", error);
    }
  }
  private ramp(node: GainNode | null, target: number, seconds = 0.3) {
    if (!node || !this.context) return;
    const time = this.context.currentTime;
    node.gain.cancelScheduledValues(time);
    node.gain.setValueAtTime(node.gain.value, time);
    node.gain.linearRampToValueAtTime(target, time + seconds);
  }
  private apply() {
    this.ramp(this.master, this.muted ? 0 : 0.9, 0.12);
    this.ramp(this.effectsGain, this.effectsVolume, 0.08);
    const level =
      this.mode === "playing"
        ? 1
        : this.mode === "caught"
          ? 0.22
          : this.mode === "complete"
            ? 0.5
            : 0;
    this.ramp(this.musicGain, this.musicVolume * level, 0.45);
  }
  setMode(mode: string) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.apply();
  }
  setMuted(value: boolean) {
    this.muted = value;
    this.apply();
  }
  setMusicVolume(value: number) {
    this.musicVolume = Math.min(1, Math.max(0, value));
    this.apply();
  }
  setEffectsVolume(value: number) {
    this.effectsVolume = Math.min(1, Math.max(0, value));
    this.apply();
  }
  play(name: SafariSound) {
    if (this.muted || this.effectsVolume === 0) return;
    void this.unlock().then(() => {
      if (!this.context || !this.effectsGain || this.muted) return;
      const buffer = this.buffers.get(name);
      if (!buffer) return;
      if (this.voices.size >= 6) {
        const oldest = this.voices.values().next().value!;
        oldest.stop();
        this.voices.delete(oldest);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.effectsGain);
      this.voices.add(source);
      source.onended = () => {
        this.voices.delete(source);
        source.disconnect();
      };
      source.start();
    });
  }
  state() {
    return {
      context: this.context?.state ?? "locked",
      loaded: this.buffers.size,
      musicVoices: this.music ? 1 : 0,
      activeEffects: this.voices.size,
      mode: this.mode,
      musicVolume: this.musicVolume,
      effectsVolume: this.effectsVolume,
      muted: this.muted,
      musicGain: this.musicGain?.gain.value ?? 0,
      masterGain: this.master?.gain.value ?? 0,
      loopSeconds: this.buffers.get("fern-garden")
        ? Math.min(57.6, this.buffers.get("fern-garden")!.duration)
        : 0,
      error: this.error,
    };
  }
}
