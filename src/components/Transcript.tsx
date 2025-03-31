import { useCallback, useEffect, useRef, useState } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { TranscriptionData } from "../utils/TranscriptionUtils";
import { useAppContext } from "../hooks/useAppContext";
import { Action } from "../context/AppContext";

type SetUseState = (value: ((prevState: any) => any) | any) => void;

interface Props {
    transcribedData: TranscriberData | undefined;
}

function handleWordDelete(dispatch: (value: Action) => void, chunk: { text: string; timestamp: [number, number | null] } | undefined) {
    const querySelector = document.querySelector(".text-chunks .cursor-here") as HTMLElement;
    if (!querySelector) {
        return;
    }
    const previousSibling = querySelector.previousElementSibling as HTMLElement;
    if (previousSibling) {
        previousSibling.click();
    }

    dispatch({ type: "ADD_WORD_TIMESTEP", payload: chunk });

    querySelector.parentElement?.remove();
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
            handleWordDelete(dispatch, chunk);
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
        <div ref={divRef} className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto' style={{ color: "black" }}>
            {transcribedData?.chunks && TextWithTimestamps(transcribedData.chunks ?? [], setChunk, dispatch)}
        </div>
    );
}

function selectWord(element: HTMLElement, dispatch: (value: Action) => void, chunk: { text: string; timestamp: [number, number | null] }, setChunk: (value: any) => void) {
    document.querySelectorAll(".cursor-here").forEach((el) => {
        el.classList.remove("cursor-here");
    });
    element.classList.add("cursor-here");
    dispatch({ type: "ADD_SELECTED_WORD", payload: chunk });
    setChunk(chunk);
}

const TextWithTimestamps = (chunks: TranscriptionData, setChunk: SetUseState, dispatch: (value: Action) => void) => {
    return (
        <div className={"text-chunks"}>
            {chunks.map((chunk, index) => (
                <span key={index} className='inline-flex items-center' style={{ cursor: "pointer", marginRight: "5px" }}>
                    <span
                        onClick={(e) => {
                            const element = e.target as HTMLElement;
                            selectWord(element, dispatch, chunk, setChunk);
                        }}
                    >
                        {chunk.text}
                    </span>
                    <span
                        onClick={(e) => {
                            const element = e.target as HTMLElement;
                            const selector = element.previousElementSibling as HTMLElement;
                            selectWord(selector, dispatch, chunk, setChunk);
                            handleWordDelete(dispatch, chunk);
                        }}
                        className='ml-1 text-red-500 hover:text-red-700 cursor-pointer md:hidden'
                        style={{ fontSize: "0.8em" }}
                    >
                        ×
                    </span>
                </span>
            ))}
        </div>
    );
};
