"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MODELS, type LlmProvider } from "@argumentor/agents/credentials";
import {
  clearLlmSettings,
  defaultLlmSettings,
  loadLlmSettings,
  saveLlmSettings,
  type StoredLlmSettings,
} from "@/lib/llm-settings";

const PROVIDERS: Array<{ id: LlmProvider; label: string; hint: string }> = [
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "One key for many models. Get a key at openrouter.ai/keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    hint: "Direct Claude access. Get a key at console.anthropic.com",
  },
  {
    id: "openai",
    label: "OpenAI",
    hint: "Direct OpenAI access. Get a key at platform.openai.com/api-keys",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoredLlmSettings>(() => defaultLlmSettings());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadLlmSettings());
    setHydrated(true);
  }, []);

  function onProviderChange(provider: LlmProvider) {
    const models = DEFAULT_MODELS[provider];
    setSettings((current) => ({
      ...current,
      provider,
      primaryModel: models.primary,
      analysisModel: models.analysis,
    }));
    setSaved(false);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    saveLlmSettings({
      ...settings,
      apiKey: settings.apiKey.trim(),
      primaryModel: settings.primaryModel.trim() || DEFAULT_MODELS[settings.provider].primary,
      analysisModel:
        settings.analysisModel.trim() || DEFAULT_MODELS[settings.provider].analysis,
    });
    setSaved(true);
  }

  function onClear() {
    clearLlmSettings();
    setSettings(defaultLlmSettings(settings.provider));
    setSaved(false);
  }

  const providerMeta = PROVIDERS.find((p) => p.id === settings.provider) ?? PROVIDERS[0];

  return (
    <section className="section stack">
      <div>
        <h2>Settings</h2>
        <p className="support">
          ArguMentor uses your key to call the model you choose. Keys stay in this browser
          and are never stored in the app database.
        </p>
      </div>

      <form className="panel stack" onSubmit={onSave}>
        <label className="field">
          Provider
          <select
            value={settings.provider}
            onChange={(e) => onProviderChange(e.target.value as LlmProvider)}
          >
            {PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">{providerMeta?.hint}</p>

        <label className="field">
          API key
          <div className="key-row">
            <input
              type={showKey ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={hydrated ? settings.apiKey : ""}
              onChange={(e) => {
                setSettings({ ...settings, apiKey: e.target.value });
                setSaved(false);
              }}
              placeholder="Paste your API key"
            />
            <button
              className="btn ghost"
              type="button"
              onClick={() => setShowKey((value) => !value)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="field">
          Primary model
          <input
            value={settings.primaryModel}
            onChange={(e) => {
              setSettings({ ...settings, primaryModel: e.target.value });
              setSaved(false);
            }}
            placeholder={DEFAULT_MODELS[settings.provider].primary}
          />
        </label>
        <p className="muted">Used for the opponent, judge, coach, and research brief.</p>

        <label className="field">
          Analysis model
          <input
            value={settings.analysisModel}
            onChange={(e) => {
              setSettings({ ...settings, analysisModel: e.target.value });
              setSaved(false);
            }}
            placeholder={DEFAULT_MODELS[settings.provider].analysis}
          />
        </label>
        <p className="muted">Used for per-turn analysis. A faster, cheaper model is fine.</p>

        <div className="row">
          <button className="btn" type="submit">
            Save in this browser
          </button>
          <button className="btn ghost" type="button" onClick={onClear}>
            Clear key
          </button>
        </div>
        {saved ? <p className="muted">Saved on this device.</p> : null}
      </form>
    </section>
  );
}
