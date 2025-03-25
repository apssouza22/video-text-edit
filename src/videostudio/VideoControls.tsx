import * as core from "@diffusionstudio/core";
import { render } from "./render";
import { useEffect, useState, useCallback } from "react";

export default function VideoControls(props: { composition: core.Composition }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState("00:00 / 00:00");

    useEffect(() => {
        const composition = props.composition;
        
        // Setup event listeners
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(composition.time());

        composition.on("play", handlePlay);
        composition.on("pause" , handlePause);
        composition.on("currentframe", handleTimeUpdate);

        // Cleanup event listeners
        return () => {
            composition.off("play");
            composition.off("pause");
            composition.off("currentframe");
        };
    }, [props.composition]);

    const handlePlay = useCallback(() => {
        props.composition.play();
    }, [props.composition]);

    const handlePause = useCallback(() => {
        props.composition.pause();
    }, [props.composition]);

    const handleBack = useCallback(() => {
        props.composition.seek(0);
    }, [props.composition]);

    const handleForward = useCallback(() => {
        props.composition.seek(props.composition.duration.frames);
    }, [props.composition]);

    const handleExport = useCallback(() => {
        render(props.composition);
    }, [props.composition]);

    useEffect(() => {
        const container = document.querySelector('[id="player-container"]') as HTMLDivElement;
        const player = document.querySelector('[id="player"]') as HTMLDivElement;
        const composition = props.composition;

        // add canvas to dom
        composition.mount(player);

        // handle window resizes
        const observer = new ResizeObserver(() => {
            const scale = Math.min(container.clientWidth / composition.width, container.clientHeight / composition.height);

            player.style.width = `${composition.width}px`;
            player.style.height = `${composition.height}px`;
            player.style.transform = `scale(${scale})`;
            player.style.transformOrigin = "center";
        });

        observer.observe(document.body);
        setCurrentTime(composition.time());

        return () => {
            observer.disconnect();
        };
    }, [props.composition]);

    return (
        <div id='controls'>
            <div id='playback'>
                <i data-lucide='skip-back' onClick={handleBack}>skip-back</i>
                {!isPlaying ? (
                    <i data-lucide='play' onClick={handlePlay}>play</i>
                ) : (
                    <i data-lucide='pause' onClick={handlePause}>pause</i>
                )}
                <i data-lucide='skip-forward' onClick={handleForward}>skip-forward</i>
            </div>
            <span id='time'>{currentTime}</span>
            <i data-lucide='sliders-vertical'></i>
            <button id='export' type='button' onClick={handleExport}>
                <div className='loader' style={{ display: "none" }}></div>
                Export
            </button>
        </div>
    );
}
