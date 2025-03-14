import { useEffect, useRef } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { TranscriptionData } from "../utils/TranscriptionUtils";

type SetTimelineRegion = (value: ((prevState: any) => any) | any) => void;

interface Props {
    transcribedData: TranscriberData | undefined;
    setTimelineRegion: SetTimelineRegion;
}

export default function Transcript({
    transcribedData,
    setTimelineRegion,
}: Props) {
    const divRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                    divRef.current.scrollTop -
                    divRef.current.scrollHeight,
            );

            if (diff <= 64) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    return (
        <div
            ref={divRef}
            className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'
        >
            {transcribedData?.chunks &&
                TextWithTimestamps(transcribedData.chunks ?? [], setTimelineRegion)}

        </div>
    );
}

const handleWordClick = (timestamp: [number, number | null], setTimelineRegion:SetTimelineRegion) => {
    setTimelineRegion({ start: timestamp[0], end: timestamp[1] });
    // const videoElement = document.getElementById("video-player");
    // if (videoElement) {
    //     // @ts-ignore
    //     videoElement.currentTime = timestamp[0];
    // }
};

const TextWithTimestamps = (chunks: TranscriptionData, setTimelineRegion:SetTimelineRegion) => {
    return (
        <div>
            {chunks.map((chunk, index) => (
                <span
                    key={index}
                    onClick={() => handleWordClick(chunk.timestamp, setTimelineRegion)}
                    style={{ cursor: "pointer", marginRight: "5px" }}
                >
                    {chunk.text}
                </span>
            ))}
        </div>
    );
};
