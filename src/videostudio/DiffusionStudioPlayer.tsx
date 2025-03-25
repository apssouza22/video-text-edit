import { setupTimeline } from "./timeline";
import "./index.css";
import * as core from "@diffusionstudio/core";
import { useEffect, useRef, useState } from "react";
import VideoControls from "./VideoControls";
import { useAppContext } from "../hooks/useAppContext";

export default function DiffusionStudioPlayer(props: { videoUrl: string }) {
    const playerRef = useRef<HTMLDivElement>(null);
    const [composition, setComposition] = useState<core.Composition>();
    const context = useAppContext();

    useEffect(() => {
        const regions = context.wordTimestamps.map((word) => {
            return [word.timestamp[0], word.timestamp[1]] as [number, number];
        });
        regions.sort((a, b) => a[0] - b[0]);

        if (playerRef.current) {
            getComposition(props.videoUrl, regions).then((composition) => {
                composition.unmount();
                setComposition(composition);
                setupTimeline(composition);
            });
        }
    }, [props.videoUrl, context]);

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
            {composition && <VideoControls composition={composition} />}
        </div>
    );
}

async function removeSegmentsVideo(excludeSegments: Array<[number, number]>, duration: number): Promise<Array<[number, number]>> {
    const segments: Array<[number, number]> = [];
    let newStart = 0;
    console.log("excludeSegments", excludeSegments);
    const queue = excludeSegments.map(([startPos, endPos], index) => {
        if (index === 0) {
            segments.push([0, startPos]);
            newStart = endPos;
            segments.push([newStart, duration]);
            return;
        }
        if (index === excludeSegments.length - 1) {
            segments.push([newStart, startPos]);
            segments.push([endPos, duration]);
            return;
        }

        segments.push([newStart, startPos]);
        newStart = endPos;
    });

    await Promise.all(queue);
    console.log("segments", segments);
    return segments;
}

async function getComposition(videoUrl: string, segments: [number, number][]) {
    const composition = new core.Composition();
    const video = await core.Source.from<core.VideoSource>(videoUrl);
    const cuts = await removeSegmentsVideo(segments, video.duration?.seconds ?? 0);
    console.log("cuts", cuts);
    composition.duration = video.duration;
    if (!cuts.length) {
        const clip = new core.VideoClip(video, {
            position: "center",
            height: "100%",
        });
        await composition.add(clip);
        return composition;
    }
    cuts.sort((a, b) => a[0] - b[0]);

    let currentTime = 0;
    for (const [start, end] of cuts) {
        const clip = new core.VideoClip(video, {
            position: "center",
            height: "100%",
        });

        // Convert time to frames (assuming 30fps)
        const startFrame = Math.floor(start * 30);
        const endFrame = Math.floor(end! * 30);
        const duration = endFrame - startFrame;

        await composition.add(clip.offset(-currentTime).subclip(startFrame, endFrame));
        currentTime += duration;
    }

    composition.duration = currentTime;
    return composition;
}
