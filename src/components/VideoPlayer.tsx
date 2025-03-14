import React, { useEffect, useRef, useState } from "react";
import VideoTimeline from "./VideoTimeline";
import { Region } from "wavesurfer.js/dist/plugins/regions";
import { Transcriber } from "../hooks/useTranscriber";
import Transcript from "./Transcript";

export default function VideoPlayer(props: {
    videoUrl: string;
    mimeType: string;
    transcriber?: Transcriber;
}) {
    const videoPlayer = useRef<HTMLVideoElement>(null);
    const videoSource = useRef<HTMLSourceElement>(null);
    const [videoHtml, setVideoHtml] = useState<HTMLVideoElement>();
    const [timelineRegion, setTimelineRegion] = useState<Region>({
        start: 0,
        end: 0,
    } as Region);

    // Updates src when url changes
    useEffect(() => {
        if (videoPlayer.current && videoSource.current) {
            videoSource.current.src = props.videoUrl;
            videoPlayer.current.load();
            setVideoHtml(videoPlayer.current);
        }
    }, [props.videoUrl]);

    return (
        <>
            <div className='flex relative z-10 p-4 w-full'>
                <video
                    id={"video-player"}
                    height='360'
                    ref={videoPlayer}
                    controls
                    className='rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'
                >
                    <source ref={videoSource} type={props.mimeType}></source>
                </video>
            </div>
            <div className="className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'">
                {videoPlayer && (
                    <VideoTimeline
                        videoHtml={videoHtml}
                        region={timelineRegion}
                    />
                )}
            </div>
            <div className="className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'">
                <Transcript transcribedData={props.transcriber?.output} setTimelineRegion={setTimelineRegion} />
            </div>
        </>
    );
}
