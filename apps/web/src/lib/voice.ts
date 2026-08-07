"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Push-to-talk speech recognition using the Web Speech API (Phase 2 voice).
 * Gracefully no-ops when unsupported.
 */
export function usePushToTalk(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SpeechRecognitionCtor) return;
    setSupported(true);
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) onTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onTranscript]);

  function start() {
    if (!recognitionRef.current || listening) return;
    setListening(true);
    recognitionRef.current.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, start, stop };
}

export function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.02;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

const TTS_STORAGE_KEY = "argumentor.ttsEnabled";

/** Persisted TTS preference; defaults to off. */
export function useTtsPreference() {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    try {
      setEnabledState(localStorage.getItem(TTS_STORAGE_KEY) === "true");
    } catch {
      // ignore
    }
  }, []);

  function setEnabled(next: boolean) {
    setEnabledState(next);
    if (!next) stopSpeaking();
    try {
      localStorage.setItem(TTS_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }

  return { enabled, setEnabled };
}
