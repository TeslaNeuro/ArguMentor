export {};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  // Minimal DOM typings for browsers that expose SpeechRecognition
  // without requiring @types/dom-speech-recognition.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var SpeechRecognition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var webkitSpeechRecognition: any;
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}
