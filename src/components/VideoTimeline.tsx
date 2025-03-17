import React, { useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { useAppContext } from "../hooks/useAppContext";

interface VideoTimelineProps {
    videoHtml?: HTMLVideoElement | undefined;
}

const handleVideoLoad = (videoHtml: HTMLVideoElement) => {
    const ws = WaveSurfer.create({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        container: document.querySelector(".video-waver"),
        waveColor: "rgb(200, 0, 200)",
        progressColor: "rgb(100, 0, 100)",
        media: videoHtml,
        height: 100,
        width: 1000,
        plugins: [regions],
    });

    ws.on("decode", () => {
        regions.addRegion({
            start: 0,
            end: 1,
            content: "",
            color: `rgba(95, 80, 155, 0.5)`,
            drag: true,
            resize: true,
        });
    });
};

const regions = RegionsPlugin.create();
regions.enableDragSelection({
    color: "rgba(255, 0, 0, 0.1)",
});

const VideoTimeline = ({ videoHtml }: VideoTimelineProps) => {
    const context = useAppContext();

    useEffect(() => {
        if (!videoHtml) return;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        videoHtml.addEventListener("loadeddata", () => {
            handleVideoLoad(videoHtml);
        });
    }, [videoHtml]);

    useEffect(() => {
        if (!videoHtml) return;
        regions.clearRegions();
        if(!context.selectedWord){
            return;
        }
        regions.addRegion({
            start:  context.selectedWord?.timestamp[0],
            end: context.selectedWord?.timestamp[1],
            content: context.selectedWord?.text,
            color: `rgba(95, 80, 155, 0.5)`,
            drag: true,
            resize: true,
        });
    }, [context]);
    return <div className='video-waver' />;
};

export default VideoTimeline;
