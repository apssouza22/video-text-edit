import { useCallback, useState } from 'react';

interface VideoEditorState {
    isCutting: boolean;
    progress: number;
    error: string | null;
}

export function useVideoEditor() {
    const [state, setState] = useState<VideoEditorState>({
        isCutting: false,
        progress: 0,
        error: null,
    });

    const cutVideo = useCallback(async (videoElement: HTMLVideoElement, startTime: number, endTime: number) => {
        try {
            setState(prev => ({ ...prev, isCutting: true, error: null }));

            const mediaRecorder = new MediaRecorder(videoElement.captureStream());
            const chunks: Blob[] = [];

            return new Promise<Blob>((resolve, reject) => {
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    setState(prev => ({ ...prev, isCutting: false, progress: 100 }));
                    resolve(blob);
                };

                mediaRecorder.onerror = (event) => {
                    setState(prev => ({ ...prev, isCutting: false, error: 'Failed to cut video' }));
                    reject(event.error);
                };

                videoElement.currentTime = startTime;
                mediaRecorder.start();

                videoElement.play();
                const stopRecording = () => {
                    if (videoElement.currentTime >= endTime) {
                        videoElement.pause();
                        mediaRecorder.stop();
                        videoElement.currentTime = 0;
                    } else {
                        setState(prev => ({
                            ...prev,
                            progress: ((videoElement.currentTime - startTime) / (endTime - startTime)) * 100
                        }));
                        requestAnimationFrame(stopRecording);
                    }
                };
                requestAnimationFrame(stopRecording);
            });
        } catch (error) {
            setState(prev => ({ ...prev, isCutting: false, error: 'Failed to initialize video cutting' }));
            throw error;
        }
    }, []);

    const downloadVideo = useCallback((blob: Blob, filename: string = 'cut-video.webm') => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    return {
        ...state,
        cutVideo,
        downloadVideo
    };
}