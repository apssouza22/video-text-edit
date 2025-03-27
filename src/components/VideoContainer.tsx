import React, { useEffect, useRef, useState } from "react";
import VideoTimeline from "./VideoTimeline";
import { Transcriber } from "../hooks/useTranscriber";
import Transcript from "./Transcript";
import useEditVideoFile from "../hooks/useEditVideoFile";
import { useAppContext } from "../hooks/useAppContext";
import DiffusionStudioPlayer from "../videostudio/DiffusionStudioPlayer";
import { TranscribeButton } from "./TranscribeButton";
import TranscribeModel from "./TranscribeModel";

export default function VideoContainer(props: { videoUrl: string; mimeType: string; transcriber: Transcriber, audioBuffer?: AudioBuffer }) {
    const videoPlayer = useRef<HTMLVideoElement>(null);
    const videoSource = useRef<HTMLSourceElement>(null);
    const videoPlayerDiv = useRef<HTMLDivElement>(null);
    const [videoHtml, setVideoHtml] = useState<HTMLVideoElement>();

    useEffect(() => {
        if (videoPlayer.current && videoSource.current) {
            videoSource.current.src = props.videoUrl;
            setVideoHtml(videoPlayer.current);
            videoPlayer.current.load();
        }
    }, [props.videoUrl]);

    return (
        <>
            <div className='flex relative z-10 p-4 w-full'>
                {props.videoUrl && DiffusionStudioPlayer({ videoUrl: props.videoUrl })}
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

            {props.transcriber?.output && <Transcript transcribedData={props.transcriber?.output}
            // transcribedData={{
            //     isBusy: false,
            //     text: "",
            //     chunks: [
            //         { text: "hello", timestamp: [0, 1] },
            //         { text: "world", timestamp: [1, 2] },
            //         { text: "!", timestamp: [2, 3] },
            //     ],
            // }}
            />}
            {props.audioBuffer && <TranscribeModel transcriber={props.transcriber} audioBuffer={props.audioBuffer} />}
            
            <div className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto">{videoPlayerDiv && <VideoTimeline videoHtml={videoHtml} />}</div>
        </>
    );
}
