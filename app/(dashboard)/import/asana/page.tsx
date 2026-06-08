'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Upload, Eye, Shuffle, AlertTriangle, Play, CheckCircle, ChevronRight } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Upload', icon: Upload },
  { id: 2, label: 'Pré-visualização', icon: Eye },
  { id: 3, label: 'Mapeamento', icon: Shuffle },
  { id: 4, label: 'Validação', icon: AlertTriangle },
  { id: 5, label: 'Importação', icon: Play },
  { id: 6, label: 'Relatório', icon: CheckCircle },
]

interface ParsedData {
  projects: number; tasks: number; users: string[]; customFields: string[]; sections: string[]
}

interface ImportResult {
  imported: number; skipped: number; errors: number; warnings: string[]; projectIds: string[]
}

export default function AsanaImportPage() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'csv' | 'json' | 'zip'>('csv')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importId, setImportId] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
  }

  async function processFile() {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)

    const res = await fetch('/api/import/asana/parse', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.data) {
      setParsedData(data.data)
      setImportId(data.importId)
      setStep(2)
    }
  }

  async function runValidation() {
    if (!importId) return
    const res = await fetch('/api/import/asana/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId, mappings }),
    })
    const data = await res.json()
    setValidationWarnings(data.warnings ?? [])
    setStep(4)
  }

  async function runImport() {
    if (!importId) return
    setImporting(true)
    const res = await fetch('/api/import/asana/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId, mappings }),
    })
    const data = await res.json()
    setResult(data.result)
    setStep(6)
    setImporting(false)
  }

  async function rollback() {
    if (!importId) return
    await fetch('/api/import/asana/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId }),
    })
    alert('Importação revertida com sucesso.')
    setStep(1)
    setResult(null)
    setImportId(null)
    setParsedData(null)
  }

  return (
    <div>
      <Header title="Importar do Asana" subtitle="Importação de projetos, tarefas e dados do Asana" />
      <div className="p-6">
        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === s.id ? 'bg-blue-600 text-white' :
                step > s.id ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                <s.icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etapa 1: Upload do Arquivo</h2>
            <p className="text-sm text-gray-500 mb-6">Faça upload do arquivo exportado do Asana. Suportamos CSV, JSON e ZIP com múltiplos CSVs.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de Arquivo</label>
                <div className="flex gap-3">
                  {(['csv', 'json', 'zip'] as const).map(t => (
                    <button key={t} onClick={() => setFileType(t)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors uppercase font-mono ${
                        fileType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="file" id="fileInput" className="hidden"
                  accept={fileType === 'csv' ? '.csv' : fileType === 'json' ? '.json' : '.zip'}
                  onChange={handleFileUpload}
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  {file ? (
                    <div>
                      <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-700">{file.name}</p>
                      <p className="text-xs text-green-600 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">Clique para selecionar ou arraste o arquivo</p>
                      <p className="text-xs text-gray-400 mt-1">Suporte a {fileType.toUpperCase()} exportado do Asana</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">O que será importado:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Workspaces, times e projetos</li>
                  <li>Seções, tarefas e subtarefas</li>
                  <li>Responsáveis, datas e status</li>
                  <li>Tags, campos personalizados e comentários</li>
                  <li>Dependências e portfólios</li>
                </ul>
              </div>

              <button onClick={processFile} disabled={!file}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                Processar Arquivo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && parsedData && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etapa 2: Pré-visualização</h2>
            <p className="text-sm text-gray-500 mb-6">Dados encontrados no arquivo do Asana.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Projetos', value: parsedData.projects },
                { label: 'Tarefas', value: parsedData.tasks },
                { label: 'Usuários', value: parsedData.users.length },
                { label: 'Campos Personalizados', value: parsedData.customFields.length },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            {parsedData.users.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Usuários Encontrados</p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.users.map(u => (
                    <span key={u} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{u}</span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStep(3)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Configurar Mapeamento
            </button>
          </div>
        )}

        {/* Step 3: Mapping */}
        {step === 3 && parsedData && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etapa 3: Mapeamento</h2>
            <p className="text-sm text-gray-500 mb-6">Configure como os dados do Asana serão mapeados para o PixelSAV WorkOS.</p>

            <div className="space-y-5">
              <MappingSection title="Projetos" description="Como os projetos do Asana serão importados">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-xs text-gray-500 font-medium">Asana</div>
                  <div className="text-xs text-gray-500 font-medium">PixelSAV WorkOS</div>
                  {['project_name', 'project_status', 'due_date', 'assignee'].map(field => (
                    <>
                      <div key={`a-${field}`} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{field}</div>
                      <select key={`b-${field}`} className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                        value={mappings[field] || ''}
                        onChange={e => setMappings(p => ({ ...p, [field]: e.target.value }))}>
                        <option value="">Selecione campo...</option>
                        <option value="name">Nome do Projeto</option>
                        <option value="status">Status</option>
                        <option value="eventDate">Data do Evento</option>
                        <option value="commercialLeadId">Responsável</option>
                        <option value="ignore">Ignorar</option>
                      </select>
                    </>
                  ))}
                </div>
              </MappingSection>

              <MappingSection title="Usuários" description="Mapear usuários do Asana para usuários do sistema">
                <div className="space-y-2">
                  {parsedData.users.slice(0, 10).map(u => (
                    <div key={u} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 flex-1 bg-gray-50 px-3 py-1.5 rounded-lg">{u}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <input type="text" placeholder="E-mail do usuário no sistema"
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                        onChange={e => setMappings(p => ({ ...p, [`user_${u}`]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </MappingSection>

              <button onClick={runValidation} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                Validar Mapeamento
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Validation */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etapa 4: Validação</h2>
            {validationWarnings.length === 0 ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <CheckCircle size={20} className="text-green-500" />
                <p className="text-green-700 font-medium">Nenhum problema encontrado. Pronto para importar!</p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  <p className="text-sm font-medium text-gray-900">{validationWarnings.length} aviso(s) encontrado(s)</p>
                </div>
                <div className="space-y-2">
                  {validationWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} className="text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-yellow-700">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStep(5)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Prosseguir com a Importação
            </button>
          </div>
        )}

        {/* Step 5: Importing */}
        {step === 5 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etapa 5: Importação</h2>
            <p className="text-sm text-gray-500 mb-8">Clique para iniciar a importação dos dados do Asana.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-700">
              <p className="font-medium mb-1">O que acontecerá:</p>
              <ul className="text-xs text-left list-disc list-inside space-y-0.5">
                <li>Projetos serão criados no PixelSAV WorkOS</li>
                <li>Tarefas e subtarefas serão vinculadas</li>
                <li>IDs originais do Asana serão preservados</li>
                <li>Um log completo será gerado</li>
                <li>Rollback disponível após a importação</li>
              </ul>
            </div>
            <button onClick={runImport} disabled={importing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {importing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Importando...</>
              ) : (
                <><Play size={16} />Iniciar Importação</>
              )}
            </button>
          </div>
        )}

        {/* Step 6: Report */}
        {step === 6 && result && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={32} className="text-green-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Importação Concluída</h2>
                <p className="text-sm text-gray-500">Confira o relatório abaixo</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                <p className="text-xs text-green-600 mt-1">Importados</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                <p className="text-xs text-yellow-600 mt-1">Ignorados</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                <p className="text-xs text-red-600 mt-1">Erros</p>
              </div>
            </div>
            {result.warnings.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Avisos</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg mb-1">{w}</p>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              {result.projectIds.length > 0 && (
                <a href="/projects" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors text-center">
                  Ver Projetos Importados
                </a>
              )}
              <button onClick={rollback} className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-lg text-sm transition-colors">
                Reverter Importação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MappingSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <h4 className="font-medium text-gray-900 mb-0.5">{title}</h4>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      {children}
    </div>
  )
}
