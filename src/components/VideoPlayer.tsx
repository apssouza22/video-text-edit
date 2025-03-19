import React, { useEffect, useRef, useState } from "react";
import VideoTimeline from "./VideoTimeline";
import { Transcriber } from "../hooks/useTranscriber";
import Transcript from "./Transcript";
import useEditVideoFile from "../hooks/useEditVideoFile";
import { useAppContext } from "../hooks/useAppContext";

export default function VideoPlayer(props: { videoUrl: string; mimeType: string; transcriber?: Transcriber }) {
    const videoPlayer = useRef<HTMLVideoElement>(null);
    const videoSource = useRef<HTMLSourceElement>(null);
    const ffmpeg = useEditVideoFile(videoSource.current, videoPlayer.current);
    const [videoHtml, setVideoHtml] = useState<HTMLVideoElement>();
    const context = useAppContext();

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
                <video id={"video-player"} height='360' ref={videoPlayer} controls className='rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10'>
                    <source ref={videoSource} type={props.mimeType}></source>
                </video>
            </div>
            <div className="className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'">{videoPlayer && <VideoTimeline videoHtml={videoHtml} />}</div>
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
