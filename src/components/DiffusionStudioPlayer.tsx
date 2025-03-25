import { setupControls } from "../videostudio/controls";
import { setupTimeline } from "../videostudio/timeline";
import "../videostudio/index.css";
import * as core from "@diffusionstudio/core";
import { useEffect, useRef } from "react";

let rendered = false;
export default function DiffusionStudioPlayer(props: { videoUrl: string }) {
    const playerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (playerRef.current && !rendered) {
            rendered = true;
            const cuts: [number, number][] = [
                [0, 5], // First 5 seconds
                [10, 15], // 10-15 seconds
                [20, 25], // 20-25 seconds
            ];
            getComposition(props.videoUrl, cuts).then((composition) => {
                setupTimeline(composition);
                setupControls(composition);
            });
        }
    }, [props.videoUrl]);

    return (
        <div id={"app"}>
            <div id='player-container' className={"flex relative z-10 p-4 w-full"}>
                <div id='player' ref={playerRef} style={{ height: "0px", width: 0 }} className={"rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10"}></div>
                <div id='progress' style={{ display: "none" }}>
                    <h1>0%</h1>
                </div>
            </div>
            <div id='timeline'>
                <div></div>
            </div>
            <div id='controls'>
                <div id='playback'>
                    <i data-lucide='skip-back'>skip-back</i>
                    <i data-lucide='play'>play</i>
                    <i data-lucide='pause' style={{ display: "none" }}>
                        pause
                    </i>
                    <i data-lucide='skip-forward'>skip-forward</i>
                </div>
                <span id='time'>00:00 / 00:00</span>
                <i data-lucide='sliders-vertical'></i>
                <button id='export' type='button'>
                    <div className='loader' style={{ display: "none" }}></div>
                    Export
                </button>
            </div>
        </div>
    );
}

async function getComposition(videoUrl: string, cuts: [number, number][]) {
    const composition = new core.Composition();
    const video = await core.Source.from<core.VideoSource>(videoUrl);
    composition.duration = video.duration;
    cuts.sort((a, b) => a[0] - b[0]);

    let currentTime = 0;
    for (const [start, end] of cuts) {
        const clip = new core.VideoClip(video, {
            position: "center",
            height: "100%",
        });

        // Convert time to frames (assuming 30fps)
        const startFrame = Math.floor(start * 30);
        const endFrame = Math.floor(end * 30);
        const duration = endFrame - startFrame;

        await composition.add(clip.offset(-currentTime).subclip(startFrame, endFrame));
        currentTime += duration;
    }

    composition.duration = currentTime;
    return composition;
}
