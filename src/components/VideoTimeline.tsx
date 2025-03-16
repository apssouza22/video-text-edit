import React, { useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

type Region = { start: number; end: number };

interface VideoTimelineProps {
    videoHtml?: HTMLVideoElement | undefined;
    region: Region;
}

const handleVideoLoad = (videoHtml: HTMLVideoElement, region: Region) => {
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
            start: region.start,
            end: region.end,
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

const VideoTimeline = ({ videoHtml, region }: VideoTimelineProps) => {
    useEffect(() => {
        if (!videoHtml) return;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        videoHtml.addEventListener("loadeddata", () => {
            handleVideoLoad(videoHtml, region);
        });
    }, [videoHtml]);

    useEffect(() => {
        if (!videoHtml) return;
        regions.clearRegions();
        regions.addRegion({
            start: region.start,
            end: region.end,
            content: "",
            color: `rgba(95, 80, 155, 0.5)`,
            drag: true,
            resize: true,
        });
    }, [region]);
    return <div className='video-waver' />;
};

export default VideoTimeline;
