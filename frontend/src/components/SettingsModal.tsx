import { useState, useEffect } from 'react';
import { Settings2, X, Check, Microscope, Zap, Rocket, FileText } from 'lucide-react';
import CustomSelect from './CustomSelect';
import type { Settings } from '../hooks/useSettings';
import type { LLMProvider } from '../types';
import { useTranslation } from '../i18n/useTranslation';

const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  ollama:      [],
  lmstudio:    [],
  openai:      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic:   ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  groq:        ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
  gemini:      ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  mistral:     ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
  deepseek:    ['deepseek-chat', 'deepseek-reasoner'],
  huggingface: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct'],
  openrouter:  ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-3-27b-it:free', 'mistralai/mistral-7b-instruct:free'],
  cohere:      ['command-r', 'command-r-plus'],
};

const LOCAL_PROVIDERS: LLMProvider[] = ['ollama', 'lmstudio'];

const PROVIDER_OPTIONS = [
  { value: 'ollama',       label: 'Ollama (local)',           group: 'Local' },
  { value: 'lmstudio',    label: 'LM Studio (local)',        group: 'Local' },
  { value: 'openai',      label: 'OpenAI',                   group: 'Cloud API' },
  { value: 'anthropic',   label: 'Anthropic (Claude)',       group: 'Cloud API' },
  { value: 'groq',        label: 'Groq (fast free tier)',    group: 'Cloud API' },
  { value: 'gemini',      label: 'Google Gemini',            group: 'Cloud API' },
  { value: 'mistral',     label: 'Mistral AI',               group: 'Cloud API' },
  { value: 'deepseek',    label: 'DeepSeek',                 group: 'Cloud API' },
  { value: 'huggingface', label: 'Hugging Face',             group: 'Cloud API' },
  { value: 'openrouter',  label: 'OpenRouter (free models)', group: 'Cloud API' },
  { value: 'cohere',      label: 'Cohere',                   group: 'Cloud API' },
];

const API_KEY_FIELD: Partial<Record<LLMProvider, keyof Settings>> = {
  openai:      'openaiKey',
  anthropic:   'anthropicKey',
  groq:        'groqKey',
  gemini:      'geminiKey',
  mistral:     'mistralKey',
  deepseek:    'deepseekKey',
  huggingface: 'huggingfaceKey',
  openrouter:  'openrouterKey',
  cohere:      'cohereKey',
};

const API_KEY_PLACEHOLDER: Partial<Record<LLMProvider, string>> = {
  openai:      'sk-…',
  anthropic:   'sk-ant-…',
  groq:        'gsk_…',
  gemini:      'AIza…',
  mistral:     'mi-…',
  deepseek:    'sk-…',
  huggingface: 'hf_…',
  openrouter:  'sk-or-…',
  cohere:      'co-…',
};

interface Props {
  open: boolean;
  initial: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ open, initial, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Settings>(initial);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [liveModels, setLiveModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => { setDraft(initial); }, [initial]);

  useEffect(() => {
    if (!open) return;
    setLiveModels([]);

    if (LOCAL_PROVIDERS.includes(draft.llmProvider)) {
      setLoadingModels(true);
      const params = new URLSearchParams({ provider: draft.llmProvider });
      if (draft.ollamaUrl) params.set('base_url', draft.ollamaUrl);
      fetch(`/api/ollama/models?${params}`)
        .then(r => r.json())
        .then((models: string[]) => {
          setLiveModels(models);
          if (models.length > 0 && !models.includes(draft.llmModel)) {
            setDraft(d => ({ ...d, llmModel: models[0] }));
          }
        })
        .catch(() => setLiveModels([]))
        .finally(() => setLoadingModels(false));

    } else if (draft.llmProvider === 'groq' && draft.groqKey) {
      setLoadingModels(true);
      fetch(`/api/groq/models?api_key=${encodeURIComponent(draft.groqKey)}`)
        .then(r => r.json())
        .then((models: string[]) => {
          setLiveModels(models);
          if (models.length > 0 && !models.includes(draft.llmModel)) {
            setDraft(d => ({ ...d, llmModel: models[0] }));
          }
        })
        .catch(() => setLiveModels(PROVIDER_MODELS.groq))
        .finally(() => setLoadingModels(false));

    } else {
      setLiveModels(PROVIDER_MODELS[draft.llmProvider] ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft.llmProvider, draft.ollamaUrl, draft.groqKey]);

  if (!open) return null;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const DEFAULT_URLS: Partial<Record<LLMProvider, string>> = {
    ollama:   'http://localhost:11434',
    lmstudio: 'http://localhost:1234',
  };

  const handleProviderChange = (p: LLMProvider) => {
    const defaultModel = PROVIDER_MODELS[p][0] ?? '';
    const autoUrl = DEFAULT_URLS[p];
    const currentUrl = draft.ollamaUrl;
    const isDefaultOfOther = Object.entries(DEFAULT_URLS).some(([k, v]) => k !== p && v === currentUrl);
    const newUrl = autoUrl && (!currentUrl || isDefaultOfOther) ? autoUrl : currentUrl;
    setDraft(d => ({ ...d, llmProvider: p, llmModel: defaultModel, ollamaUrl: newUrl }));
    setStatus('idle');
    setTestMessage('');
  };

  const isLocal = LOCAL_PROVIDERS.includes(draft.llmProvider);
  const isCloud = !isLocal;
  const apiKeyField = API_KEY_FIELD[draft.llmProvider];
  const apiKey = apiKeyField ? (draft[apiKeyField] as string) : '';
  const setApiKey = (val: string) => { if (apiKeyField) set(apiKeyField, val as never); };

  const testConnection = async () => {
    setStatus('checking');
    setTestMessage('');
    try {
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: draft.llmProvider,
          base_url: draft.ollamaUrl || '',
          model: draft.llmModel || '',
          api_key: apiKey || '',
        }),
      });
      const data = await res.json();
      setStatus(data.ok ? 'ok' : 'error');
      setTestMessage(data.message || '');
      if (data.ok && data.resolved_url && data.resolved_url !== draft.ollamaUrl) {
        setDraft(d => ({ ...d, ollamaUrl: data.resolved_url }));
      }
    } catch {
      setStatus('error');
      setTestMessage('Could not reach backend.');
    }
  };

  const modelOptions = liveModels.length > 0 ? liveModels : PROVIDER_MODELS[draft.llmProvider];
  const hasModelList = modelOptions.length > 0;
  const isLocalUnreachable = isLocal && !loadingModels && liveModels.length === 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title">
            <Settings2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('settings')}
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 28px' }}>
          <div className="settings-section">

            {/* Provider */}
            <div className="settings-row">
              <label className="settings-label">{t('llmProvider')}</label>
              <CustomSelect
                value={draft.llmProvider}
                onChange={v => handleProviderChange(v as LLMProvider)}
                options={PROVIDER_OPTIONS}
              />
            </div>

            {/* Local base URL */}
            {isLocal && (
              <div className="settings-row">
                <label className="settings-label">{t('baseUrl')}</label>
                <input
                  className="config-input"
                  value={draft.ollamaUrl}
                  onChange={e => set('ollamaUrl', e.target.value)}
                  placeholder={draft.llmProvider === 'lmstudio' ? 'http://localhost:1234/v1/' : 'http://localhost:11434'}
                />
                <div className="settings-hint">
                  {draft.llmProvider === 'lmstudio'
                    ? 'LM Studio padrão: http://localhost:1234/v1/. Inicie o "Local Server" no LM Studio primeiro.'
                    : 'Deixe em branco para usar o padrão do backend. Linux: tente http://127.0.0.1:11434 se localhost falhar.'}
                </div>
              </div>
            )}

            {/* Model */}
            <div className="settings-row">
              <label className="settings-label">
                {t('model')}
                {loadingModels && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ width: 10, height: 10, display: 'inline-block', verticalAlign: 'middle' }} /> {t('loading')}
                  </span>
                )}
                {!loadingModels && liveModels.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#4ade80' }}>
                    {liveModels.length} disponíveis
                  </span>
                )}
                {isLocalUnreachable && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#f87171' }}>
                    inacessível; digite manualmente
                  </span>
                )}
              </label>
              {hasModelList ? (
                <CustomSelect
                  value={draft.llmModel}
                  onChange={v => set('llmModel', v)}
                  options={modelOptions.map(m => ({ value: m, label: m }))}
                />
              ) : (
                <input
                  className="config-input"
                  value={draft.llmModel}
                  onChange={e => set('llmModel', e.target.value)}
                  placeholder={draft.llmProvider === 'lmstudio' ? 'nome do modelo carregado' : 'ex. qwen2.5:7b-instruct'}
                  autoComplete="off"
                />
              )}
            </div>

            {/* API Key */}
            {isCloud && apiKeyField && (
              <div className="settings-row">
                <label className="settings-label">
                  {t('apiKey')} <span className="settings-required">obrigatório</span>
                </label>
                <input
                  className="config-input"
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={API_KEY_PLACEHOLDER[draft.llmProvider] ?? 'API key…'}
                  autoComplete="off"
                />
                <div className="settings-hint">
                  Armazenada apenas no seu navegador e enviada somente à API do provedor via backend.
                </div>
              </div>
            )}

            {/* Per-step model overrides */}
            {hasModelList && (
              <div className="settings-row" style={{ marginTop: 4 }}>
                <label className="settings-label" style={{ marginBottom: 8 }}>
                  Modelos por etapa
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(
                    [
                      { key: 'evaluatorLlmModel', label: 'Avaliador' },
                      { key: 'resumeGenLlmModel',  label: 'Geração de CV' },
                      { key: 'interviewLlmModel',  label: 'Entrevista' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1 }}>
                        <CustomSelect
                          value={draft[key]}
                          onChange={v => set(key, v)}
                          options={[
                            { value: '', label: 'Mesmo modelo acima' },
                            ...modelOptions.map(m => ({ value: m, label: m })),
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="settings-hint">Deixe em branco para usar o modelo selecionado acima.</div>
              </div>
            )}

            {/* Assessment Speed */}
            <div className="settings-row" style={{ marginTop: 8 }}>
              <label className="settings-label">{t('assessmentSpeed')}</label>
              <div className="speed-mode-picker">
                {(['careful', 'balanced', 'turbo'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`speed-mode-btn ${draft.assessmentSpeed === mode ? 'active' : ''}`}
                    onClick={() => set('assessmentSpeed', mode)}
                  >
                    <span className="speed-mode-icon">
                      {mode === 'careful'  ? <Microscope size={16} strokeWidth={1.5} /> :
                       mode === 'balanced' ? <Zap size={16} strokeWidth={1.5} /> :
                                            <Rocket size={16} strokeWidth={1.5} />}
                    </span>
                    <span className="speed-mode-label">
                      {mode === 'careful' ? 'Cuidadoso' : mode === 'balanced' ? 'Balanceado' : 'Turbo'}
                    </span>
                    <span className="speed-mode-desc">
                      {mode === 'careful' ? '1 por vez' : mode === 'balanced' ? '3 paralelos' : '6 paralelos'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Generation Threshold */}
            <div className="settings-row" style={{ marginTop: 8 }}>
              <label className="settings-label">
                <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Limite para Gerar CV
                <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--gold)' }}>{draft.resumeGenThreshold}%</span>
              </label>
              <input
                type="range" min={50} max={95} step={5}
                value={draft.resumeGenThreshold}
                onChange={e => set('resumeGenThreshold', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
              <div className="settings-hint">
                Vagas com score ≥ {draft.resumeGenThreshold}% exibirão o botão "Baixar Currículo" em destaque.
                Aumente para ser mais seletivo.
              </div>
            </div>

            {/* Connection test */}
            <div style={{ marginTop: 20 }}>
              <div className="settings-row settings-row--inline">
                <button className="test-btn" onClick={testConnection} disabled={status === 'checking'}>
                  {status === 'checking'
                    ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Testando…</>
                    : t('testConnection')}
                </button>
                {status === 'ok'    && <span className="test-result ok"><Check size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{t('connected')}</span>}
                {status === 'error' && <span className="test-result error"><X size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Falhou</span>}
              </div>
              {testMessage && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                  background: status === 'ok' ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
                  border: `1px solid ${status === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  color: status === 'ok' ? '#4ade80' : '#f87171',
                }}>
                  {testMessage}
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}
            onClick={() => { onSave(draft); onClose(); }}>
            {t('save')} Settings
          </button>
        </div>

      </div>
    </div>
  );
}