import React, { useEffect, useRef, useState } from "react";
import VideoTimeline from "./VideoTimeline";
import { Transcriber } from "../hooks/useTranscriber";
import Transcript from "./Transcript";
import useEditVideoFile from "../hooks/useEditVideoFile";
import { useAppContext } from "../hooks/useAppContext";
import { setupControls } from "../videostudio/controls";
import { setupTimeline } from "../videostudio/timeline";
import "../videostudio/index.css";
import * as core from "@diffusionstudio/core";

let rendered = false;

async function getComposition(videoUrl: string, cuts: [number, number][]) {
    const composition = new core.Composition();
    const video = await core.Source.from<core.VideoSource>(videoUrl);
    composition.duration = video.duration;

    // Sort cuts by start time to ensure proper ordering
    cuts.sort((a, b) => a[0] - b[0]);

    let currentTime = 0;
    // Create and add a clip for each cut
    for (const [start, end] of cuts) {
        const clip = new core.VideoClip(video, {
            position: "center",
            height: "100%"
        });
        
        // Convert time to frames (assuming 30fps)
        const startFrame = Math.floor(start * 30);
        const endFrame = Math.floor(end * 30);
        const duration = endFrame - startFrame;
        
      
        await composition.add(clip.offset(-currentTime).subclip(startFrame, endFrame));
        
        // Update the current time for the next clip
        currentTime += duration;
    }

    // Update the composition duration to match the total length of all clips
    composition.duration = currentTime;

    return composition;
}

export default function VideoPlayer(props: { videoUrl: string; mimeType: string; transcriber?: Transcriber }) {
    const videoPlayer = useRef<HTMLVideoElement>(null);
    const videoSource = useRef<HTMLSourceElement>(null);
    const videoPlayerDiv = useRef<HTMLDivElement>(null);
    const ffmpeg = useEditVideoFile(videoSource.current, videoPlayer.current);
    const [videoHtml, setVideoHtml] = useState<HTMLVideoElement>();
    const context = useAppContext();

    useEffect(() => {
        if (videoPlayer.current && videoSource.current) {
            videoSource.current.src = props.videoUrl;
            setVideoHtml(videoPlayer.current);
            videoPlayer.current.load();
        }
        if (videoPlayerDiv.current && !rendered) {
            rendered = true;
            const cuts: [number, number][] = [
                [0, 5],    // First 5 seconds
                [10, 15],  // 10-15 seconds
                [20, 25]   // 20-25 seconds
            ];
            getComposition(props.videoUrl, cuts).then((composition) => {
                setupTimeline(composition);
                setupControls(composition);
            });
        }
    }, [props.videoUrl]);

    return (
        <>
            <div className='flex relative z-10 p-4 w-full'>
                <div id={"app"}>
                    <div id='player-container' className={"flex relative z-10 p-4 w-full"}>
                        <div
                            id='player'
                            ref={videoPlayerDiv}
                            style={{ height: "0px", width: 0 }}
                            className={"rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10"}
                        ></div>
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
                <video
                    id={"video-player"}
                    style={{ display: "none" }}
                    height='360'
                    ref={videoPlayer}
                    controls
                    className='rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                >
                    <source ref={videoSource} type={props.mimeType}></source>
                </video>
            </div>
            <div className="className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'">{videoPlayerDiv && <VideoTimeline videoHtml={videoHtml} />}</div>
            <div className="className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'">
                <button
                    className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center'
                    onClick={async () => {
                        const regions = context.wordTimestamps.map((word) => {
                            return [word.timestamp[0], word.timestamp[1]];
                        });

                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        regions.sort((a, b) => a[0] - b[0]);

                        // const blobVideo = await ffmpeg.wrapper.current.removeSegmentsVideo(
                        //     regions,
                        // );

                        const blobVideo = await ffmpeg.wrapper.current.removeSegmentsVideo([
                            [1, 5],
                            [10, 15],
                            [20, 25],
                            [31, 36],
                        ]);
                        // @ts-ignore
                        videoSource.current.src = blobVideo;
                        // @ts-ignore
                        videoPlayer.current.load();
                    }}
                >
                    Save video
                </button>
            </div>
            <Transcript
                transcribedData={props.transcriber?.output}
                // transcribedData={{
                //     isBusy: false,
                //     text: "",
                //     chunks: [
                //         { text: "hello", timestamp: [0, 1] },
                //         { text: "world", timestamp: [1, 2] },
                //         { text: "!", timestamp: [2, 3] },
                //     ],
                // }}
            />
        </>
    );
}
