import { useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

export const AudioRecorder = ({ onAudioRecorded, disabled = false }: AudioRecorderProps) => {
  const { isRecording, audioBlob, audioURL, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const [isSavingAudio, setIsSavingAudio] = useState(false);

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleReset = () => {
    resetRecording();
  };

  const handleSave = async () => {
    if (audioBlob && !isSavingAudio) {
      setIsSavingAudio(true);
      try {
        await onAudioRecorded(audioBlob);
        // Reset after successful save
        resetRecording();
      } finally {
        setIsSavingAudio(false);
      }
    }
  };

  const isDisabled = disabled || isSavingAudio;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} variant="default" size="lg" disabled={isDisabled}>
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={handleStopRecording} variant="destructive" size="lg">
            <Square className="mr-2 h-5 w-5" />
            Stop Recording
          </Button>
        )}

        {audioBlob && !isRecording && (
          <>
            <audio src={audioURL} controls className="flex-1 max-w-md" />
            <Button onClick={handleReset} variant="outline" size="icon" disabled={isDisabled}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-destructive animate-pulse">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {audioBlob && !isRecording && (
        <Button onClick={handleSave} variant="default" className="w-full" disabled={isDisabled}>
          {isSavingAudio ? 'Saving...' : 'Save Answer'}
        </Button>
      )}
    </div>
  );
};
