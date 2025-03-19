import { useCallback, useEffect, useRef, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { TranscriptionData } from "../utils/TranscriptionUtils";
import { useAppContext } from "../hooks/useAppContext";
import { Action } from "../context/AppContext";

type SetUseState = (value: ((prevState: any) => any) | any) => void;

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const { dispatch } = useAppContext();
    const [chunk, setChunk] = useState<{
        text: string;
        timestamp: [number, number | null];
    }>();

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key !== "Backspace") {
                return;
            }
            let querySelector = document.querySelector(".text-chunks .cursor-here");
            if (!querySelector) {
                return;
            }
            let previousSibling = querySelector.previousElementSibling;
            if (previousSibling) {
                // @ts-ignore
                previousSibling.click();
            }

            dispatch({ type: "ADD_WORD_TIMESTEP", payload: chunk });

            // @ts-ignore
            querySelector.remove();
        },
        [chunk],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [chunk]);

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(divRef.current.offsetHeight + divRef.current.scrollTop - divRef.current.scrollHeight);

            if (diff <= 64) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    return (
        <div ref={divRef} className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'>
            {transcribedData?.chunks && TextWithTimestamps(transcribedData.chunks ?? [], setChunk, dispatch)}
        </div>
    );
}

const TextWithTimestamps = (chunks: TranscriptionData, setChunk: SetUseState, dispatch: (value: Action) => void) => {
    return (
        <div className={"text-chunks"}>
            {chunks.map((chunk, index) => (
                <span
                    key={index}
                    onClick={(e) => {
                        let element = e.target as HTMLElement;
                        document.querySelectorAll(".cursor-here").forEach((el) => {
                            el.classList.remove("cursor-here");
                        });
                        element.classList.add("cursor-here");
                        dispatch({ type: "ADD_SELECTED_WORD", payload: chunk });
                        setChunk(chunk);
                    }}
                    style={{ cursor: "pointer", marginRight: "5px" }}
                >
                    {chunk.text}
                </span>
            ))}
        </div>
    );
};
