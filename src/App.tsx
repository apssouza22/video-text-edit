import { FileManager } from "./components/FileManager";
import Transcript from "./components/Transcript";
import { useTranscriber } from "./hooks/useTranscriber";
import React, { useState } from "react";
import VideoWave from "./components/VideoWave";

function App() {
    const transcriber = useTranscriber();

    return (
        <div className='min-h-screen w-full flex items-center justify-center bg-gray-50'>
            <div id='main-container' className='w-full px-4 py-8'>
                <div className='flex flex-col items-center space-y-6'>
                    <h1 className='text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl text-center'>Video text editing</h1>
                    <h2 className='text-center text-1xl font-semibold tracking-tight text-slate-900 sm:text-2xl'>AI-powered video editing text based directly in your browser</h2>
                    <div className='flex flex-col justify-center items-center 0'>
                        <p style={{ color: "#000" }}>Select the word, press backspace, and it will be removed from the video.</p>
                    </div>
                    <FileManager transcriber={transcriber} />
                </div>
            </div>
        </div>
    );
}

export default App;
