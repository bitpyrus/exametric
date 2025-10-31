import { Mic, Square, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
}

export const AudioRecorder = ({ onAudioRecorded }: AudioRecorderProps) => {
  const { isRecording, audioBlob, audioURL, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleReset = () => {
    resetRecording();
  };

  const handleSave = () => {
    if (audioBlob) {
      onAudioRecorded(audioBlob);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} variant="default" size="lg">
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
            <Button onClick={handleReset} variant="outline" size="icon">
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
        <Button onClick={handleSave} variant="default" className="w-full">
          Save Answer
        </Button>
      )}
    </div>
  );
};
