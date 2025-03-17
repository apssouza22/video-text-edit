import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useCallback, useRef, useState } from "react";

const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

interface FFmpegWrapper {
    cutVideo: (operations: Array<[number, number]>) => Promise<string | false>;
    progress: number;
    removeSegmentsVideo: (
        operations: Array<[number, number]>,
    ) => Promise<string | false>;
}

export default function useEditVideoFile(
    sourceRef: HTMLSourceElement | null,
    videoRef: HTMLVideoElement | null,
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

    const removeSegmentsVideo = useCallback(
        async function removeSegmentsVideo(
            excludeSegments: Array<[number, number]>,
        ) {
            if (!videoRef) {
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
                    segments.push([endPos, videoRef.duration]);
                    return;
                }

                segments.push([newStart, startPos]);
                newStart = endPos;
            });

            await Promise.all(queue);
            console.log(segments);

            return await cutVideo(segments);
        },
        [setIsProcessing, sourceRef],
    );

  const cutVideo = useCallback(
    async (operations: Array<[number, number]>) => {
      const ffmpeg = ffmpegRef.current;

      if (!sourceRef) {
        return false;
      }

      setIsProcessing(true);

      if (!ffmpeg.loaded) {
        await loadFFmpeg();
      }

      if (!sourceRef.src) {
        setIsProcessing(false);
        return false;
      }

      const videoSrc = await fetch(sourceRef.src);
      const videoBlob = await videoSrc.blob();

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoBlob));

      // Cut each segment and store the output filenames
      const queue = operations.map(async ([startPos, endPos], index) => {
        const outputSegment = `segment_${index}.mp4`;
        const duration = (endPos - startPos).toString();
        await ffmpeg.exec([
          "-ss",
          startPos.toString(),
          "-i",
          "input.mp4",
          "-t",
          duration,
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
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
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "output.mp4",
      ]);

      const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
      const blob = new Blob([data.buffer], { type: "video/mp4" });
      setIsProcessing(false);
      console.log("file created");
      return URL.createObjectURL(blob);
    },
    [setIsProcessing, sourceRef],
  );

    return {
        cutVideo,
        progress,
        removeSegmentsVideo,
    };
}
