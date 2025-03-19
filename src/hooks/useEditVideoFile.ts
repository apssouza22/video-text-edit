import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useEffect, useRef, useState } from "react";

const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

interface FFmpegWrapper {
    wrapper: React.MutableRefObject<FFmpegWrapperImpl>;
}

class FFmpegWrapperImpl {
    private sourceRef;
    private videoRef;
    private ffmpegRef;
    public onLoadProgressFn: ((progress: number) => void) | undefined;
    public onProcessFn: ((value: ((prevState: boolean) => boolean) | boolean) => void) | undefined;

    constructor(sourceRef: HTMLSourceElement | null, videoRef: HTMLVideoElement | null, ffmpegRef: React.MutableRefObject<FFmpeg>) {
        this.sourceRef = sourceRef;
        this.videoRef = videoRef;
        this.ffmpegRef = ffmpegRef;
    }

    async cutVideo(operations: Array<[number, number]>): Promise<string | boolean> {
        const ffmpeg = this.ffmpegRef.current;
        if (!this.sourceRef) {
            return false;
        }
        if (!ffmpeg.loaded) {
            await this.loadFFmpeg();
        }
        if (!this.sourceRef.src) {
            return false;
        }

        const videoSrc = await fetch(this.sourceRef.src);
        const videoBlob = await videoSrc.blob();
        await ffmpeg.writeFile("input.mp4", await fetchFile(videoBlob));

        // Cut each segment and store the output filenames
        const queue = operations.map(async ([startPos, endPos], index) => {
            const outputSegment = `segment_${index}.mp4`;
            const duration = (endPos - startPos).toString();
            await ffmpeg.exec(["-ss", startPos.toString(), "-i", "input.mp4", "-t", duration, "-c:v", "libx264", "-c:a", "aac", outputSegment]);
            return outputSegment;
        });

        const segmentFiles = await Promise.all(queue);
        const fileList = "fileList.txt";
        const fileListContent = segmentFiles.map((file) => `file '${file}'`).join("\n");
        await ffmpeg.writeFile(fileList, new TextEncoder().encode(fileListContent));
        await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", fileList, "-c:v", "libx264", "-c:a", "aac", "output.mp4"]);

        const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
        const blob = new Blob([data.buffer], { type: "video/mp4" });
        return URL.createObjectURL(blob);
    }

    private async loadFFmpeg() {
        const ffmpeg = this.ffmpegRef.current;

        ffmpeg.on("log", ({ message }) => {
            console.log(message);
        });

        ffmpeg.on("progress", ({ progress }) => {
            if (this.onLoadProgressFn) {
                this.onLoadProgressFn(+progress.toFixed(2) * 100);
            }
        });

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
        });
    }

    async removeSegmentsVideo(excludeSegments: Array<[number, number]>): Promise<string | boolean> {
        if (!this.videoRef) {
            return false;
        }

        const segments: Array<[number, number]> = [];
        let newStart = 0;

        const queue = excludeSegments.map(([startPos, endPos], index) => {
            if (index === 0) {
                segments.push([0, startPos]);
                newStart = endPos;
                return;
            }
            if (index === excludeSegments.length - 1) {
                segments.push([newStart, startPos]);
                segments.push([endPos, this.videoRef!.duration]);
                return;
            }

            segments.push([newStart, startPos]);
            newStart = endPos;
        });

        await Promise.all(queue);

        return await this.cutVideo(segments);
    }
}

export default function useEditVideoFile(sourceRef: HTMLSourceElement | null, videoRef: HTMLVideoElement | null): FFmpegWrapper {
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const wrapper = useRef(new FFmpegWrapperImpl(sourceRef, videoRef, ffmpegRef));

    useEffect(() => {
        wrapper.current = new FFmpegWrapperImpl(sourceRef, videoRef, ffmpegRef);
        wrapper.current.onLoadProgressFn = setProgress;
        wrapper.current.onProcessFn = setIsProcessing;
    }, [videoRef]);

    return {
        wrapper,
    };
}
