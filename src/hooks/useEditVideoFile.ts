import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useCallback, useRef, useState } from "react";

const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
// const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm'

interface FFmpegWrapper {
    cutVideo: (operations: Array<[number, number]>) => Promise<string | false>;
    progress: number;
}

export default function useEditVideoFile(
    videoRef: HTMLSourceElement | null,
): FFmpegWrapper {
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());

    const loadFFmpeg = async () => {
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on("log", ({ message }) => {
            console.log(message);
        });

        ffmpeg.on("progress", ({ progress }) => {
            setProgress(+progress.toFixed(2) * 100);
        });

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(
                `${BASE_URL}/ffmpeg-core.js`,
                "text/javascript",
            ),
            wasmURL: await toBlobURL(
                `${BASE_URL}/ffmpeg-core.wasm`,
                "application/wasm",
            ),
        });
    };

    const cutVideo = useCallback(
        async (operations: Array<[number, number]>) => {
            const ffmpeg = ffmpegRef.current;

            if (!videoRef) {
                return false;
            }
            console.log(videoRef.src);

            setIsProcessing(true);

            if (!ffmpeg.loaded) {
                await loadFFmpeg();
            }

            if (!videoRef.src) {
                setIsProcessing(false);
                return false;
            }

            const videoSrc = await fetch(videoRef.src);
            const videoBlob = await videoSrc.blob();

            await ffmpeg.writeFile("input.mp4", await fetchFile(videoBlob));

            // Cut each segment and store the output filenames
            const queue = operations.map(async ([startPos, endPos], index) => {
                const outputSegment = `segment_${index}.mp4`;
                const duration = (endPos - startPos).toString();
                await ffmpeg.exec([
                    "-i",
                    "input.mp4",
                    "-ss",
                    startPos.toString(),
                    "-t",
                    duration,
                    "-c",
                    "copy",
                    outputSegment,
                ]);
                return outputSegment;
            });

            const segmentFiles = await Promise.all(queue);

            // Create a file listing all the segments
            const fileList = "fileList.txt";

            const fileListContent = segmentFiles
                .map((file) => `file '${file}'`)
                .join("\n");

            await ffmpeg.writeFile(
                fileList,
                new TextEncoder().encode(fileListContent),
            );

            // Concatenate all the segments
            await ffmpeg.exec([
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                fileList,
                "-c",
                "copy",
                "output.mp4",
            ]);

            const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
            const blob = new Blob([data.buffer], { type: "video/mp4" });
            setIsProcessing(false);
            console.log("file created");
            return URL.createObjectURL(blob);
        },
        [setIsProcessing, videoRef],
    );

    return {
        cutVideo,
        progress,
    };
}
