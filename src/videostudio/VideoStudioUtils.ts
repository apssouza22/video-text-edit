import * as core from "@diffusionstudio/core";

export const composition = new core.Composition();

// fetch video asset
const video = await core.Source.from<core.VideoSource>("./drone_footage_1080p_25fps.mp4");
const video2 = await core.Source.from<core.VideoSource>("./sample_aac_.mp4");

// limit composition duration to video duration
const timestamp = new core.Timestamp(0, 9, 0, 0); // will be added

composition.duration = timestamp;

// add a background video
// let clip = new core.VideoClip(video).subclip(0, 50);
// let clip2 = new core.VideoClip(video2).offset(-50).subclip(100, 200);
// let clip3 = new core.VideoClip(video2).offset(-100).subclip(250, 300);

const _3Secs = new core.Timestamp(0, 3, 0, 0);
const _6Secs = new core.Timestamp(0, 6, 0, 0);

const clip = new core.VideoClip(video).subclip(0, _6Secs);
const clip2 = new core.VideoClip(video2).offset(_3Secs).subclip(0, _6Secs);
const clip3 = new core.VideoClip(video).subclip(_6Secs, video2.duration?.frames ?? 0);

await composition.add(clip);
await composition.add(clip2);
await composition.add(clip3);
