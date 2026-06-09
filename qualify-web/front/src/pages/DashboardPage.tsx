import { Link } from '@tanstack/react-router';
import {
  BarChart3,
  ClipboardCheck,
  LucideIcon,
  RefreshCw,
  Save,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { getCurrentUser, useCurrentUser } from '../auth';
import { API_URL } from '../config';
import { ROLE_LABELS } from '../data/users';

interface Recommendation {
  job_id: number;
  job_title: string;
  match_percentage: number;
}

interface SkillScore {
  name: string;
  category: string;
  score: number;
}

interface CandidateCard {
  attempt_id: number;
  vk_id: number;
  name: string;
  phone: string;
  completed_at: string | null;
  status: string;
  status_label: string;
  hr_note: string;
  target_job_id: number | null;
  target_job_title: string | null;
  best_match: Recommendation | null;
  recommendations: Recommendation[];
  skills: SkillScore[];
}

interface HrDashboardData {
  jobs: Array<{ id: number; title: string }>;
  status_options: Array<{ value: string; label: string }>;
  candidates: CandidateCard[];
}

const fallbackCandidate: CandidateCard = {
  attempt_id: 1,
  vk_id: 900001,
  name: 'Никита Морозов',
  phone: '+7 912 345-67-89',
  completed_at: null,
  status: 'invited',
  status_label: 'Приглашен',
  hr_note: 'Сильный кандидат на линию литья, можно звать на смену.',
  target_job_id: 1,
  target_job_title: 'Оператор производственной линии',
  best_match: { job_id: 1, job_title: 'Оператор производственной линии', match_percentage: 86 },
  recommendations: [
    { job_id: 1, job_title: 'Оператор производственной линии', match_percentage: 86 },
    { job_id: 2, job_title: 'Контролер качества обуви', match_percentage: 74 },
    { job_id: 3, job_title: 'Мастер участка', match_percentage: 61 },
  ],
  skills: [
    { name: 'Производственные операции', category: 'Hard', score: 8.4 },
    { name: 'Безопасность и условия труда', category: 'Safety', score: 8 },
    { name: 'Надежность и мотивация', category: 'Soft', score: 7.1 },
    { name: 'Обучаемость и технологичность', category: 'Theory', score: 6.8 },
  ],
};

const fallbackHr: HrDashboardData = {
  jobs: [
    { id: 1, title: 'Оператор производственной линии' },
    { id: 2, title: 'Контролер качества обуви' },
    { id: 3, title: 'Мастер участка' },
  ],
  status_options: [
    { value: 'new', label: 'Новый' },
    { value: 'review', label: 'На проверке' },
    { value: 'invited', label: 'Приглашен' },
    { value: 'rejected', label: 'Не подходит' },
  ],
  candidates: [
    fallbackCandidate,
    {
      ...fallbackCandidate,
      attempt_id: 2,
      vk_id: 900002,
      name: 'Екатерина Лебедева',
      phone: '+7 922 104-33-18',
      status: 'review',
      status_label: 'На проверке',
      target_job_id: 2,
      target_job_title: 'Контролер качества обуви',
      best_match: { job_id: 2, job_title: 'Контролер качества обуви', match_percentage: 82 },
      hr_note: 'Хорошо подходит на контроль качества после короткой стажировки.',
    },
    {
      ...fallbackCandidate,
      attempt_id: 3,
      vk_id: 900003,
      name: 'Дмитрий Кузнецов',
      phone: '+7 953 442-10-05',
      status: 'new',
      status_label: 'Новый',
      target_job_id: 1,
      target_job_title: 'Оператор производственной линии',
      best_match: { job_id: 1, job_title: 'Оператор производственной линии', match_percentage: 64 },
      hr_note: 'Нужна вводная стажировка и проверка по технике безопасности.',
    },
  ],
};

export function DashboardPage() {
  const user = useCurrentUser();

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
          Нужен вход
        </div>
        <h2 className="mb-4 text-4xl font-black leading-none tracking-tight">Личный кабинет закрыт</h2>
        <p className="mb-6 max-w-2xl font-bold leading-7 text-slate-500">
          Войдите под одной из демо-ролей, чтобы посмотреть кабинет соискателя или HR.
        </p>
        <Link to="/login" className="inline-flex rounded-3xl bg-slate-900 px-6 py-4 font-black text-white transition hover:bg-blue-600">
          Перейти ко входу
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      <div>
        <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
          {ROLE_LABELS[user.role]}
        </div>
        <h2 className="text-4xl font-black leading-none tracking-tight sm:text-5xl">Кабинет: {user.name}</h2>
      </div>

      {user.role === 'candidate' && <CandidateDashboard vkId={user.demoVkId ?? 900001} />}
      {user.role === 'hr' && <HrDashboard />}
    </section>
  );
}

function CandidateDashboard({ vkId }: { vkId: number }) {
  const { data, loading, refresh } = useApiData<CandidateCard>(`/api/dashboard/candidate/${vkId}`, fallbackCandidate);
  const bestMatch = data.best_match;

  return (
    <div className="space-y-5">
      <DashboardToolbar loading={loading} onRefresh={refresh} />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Trophy className="mb-5 text-blue-600" size={34} />
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Лучшее совпадение</p>
          <h3 className="mb-3 text-3xl font-black leading-tight">{bestMatch?.job_title ?? 'Позиция пока не рассчитана'}</h3>
          <p className="mb-5 text-sm font-bold leading-6 text-slate-500">
            Текущий статус: {data.status_label}. Рекомендации считаются по ответам анкеты и требованиям вакансий.
          </p>
          {bestMatch && <ScoreRow title="Совпадение с вакансией" value={bestMatch.match_percentage} />}
        </div>

        <Panel title="Подходящие позиции" icon={BarChart3}>
          <div className="space-y-4">
            {data.recommendations.map((item) => (
              <ScoreRow key={item.job_id} title={item.job_title} value={item.match_percentage} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Профиль навыков" icon={ClipboardCheck}>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.skills.map((skill) => (
            <div key={skill.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">{skill.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{skill.category}</p>
              <p className="mt-3 text-2xl font-black text-blue-700">{skill.score}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HrDashboard() {
  const { data, loading, refresh, setData } = useApiData<HrDashboardData>('/api/dashboard/hr', fallbackHr);
  const [selectedJobId, setSelectedJobId] = useState<number | 'all'>('all');
  const visibleCandidates = getRankedCandidates(data.candidates, selectedJobId);

  const handleStatusSaved = (updatedCandidate: CandidateCard) => {
    setData((current) => ({
      ...current,
      candidates: current.candidates.map((candidate) =>
        candidate.attempt_id === updatedCandidate.attempt_id ? updatedCandidate : candidate,
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <DashboardToolbar loading={loading} onRefresh={refresh} />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Кандидатов" value={String(data.candidates.length)} />
        <Metric title="Приглашены" value={String(data.candidates.filter((item) => item.status === 'invited').length)} />
        <Metric title="Средний скоринг" value={`${getAverageScore(data.candidates)}%`} />
      </div>

      <HrAnalytics candidates={data.candidates} statusOptions={data.status_options} />

      <HrSkillRadar candidates={data.candidates} />

      <Panel title="Шорт-лист кандидатов" icon={Users}>
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedJobId('all')}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              selectedJobId === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            Все вакансии
          </button>
          {data.jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selectedJobId === job.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {job.title}
            </button>
          ))}
        </div>
        <div className="grid gap-5">
          {visibleCandidates.map((candidate) => (
            <CandidateEditor
              key={candidate.attempt_id}
              candidate={candidate}
              jobs={data.jobs}
              statusOptions={data.status_options}
              onSaved={handleStatusSaved}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HrAnalytics({
  candidates,
  statusOptions,
}: {
  candidates: CandidateCard[];
  statusOptions: Array<{ value: string; label: string }>;
}) {
  const total = Math.max(candidates.length, 1);
  const statusStats = statusOptions.map((option) => ({
    ...option,
    count: candidates.filter((candidate) => candidate.status === option.value).length,
  }));
  const roleStats = getRoleStats(candidates);
  const topCandidate = candidates[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="Воронка рекрутера" icon={BarChart3}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">По статусам</p>
            {statusStats.map((item) => (
              <div key={item.value}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <StatusBadge status={item.value} label={item.label} />
                  <span className="text-sm font-black text-slate-500">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${getStatusBarColor(item.value)}`}
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">По целевым позициям</p>
            {roleStats.map((item) => (
              <div key={item.title}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black leading-5 text-slate-900">{item.title}</span>
                  <span className="text-sm font-black text-blue-700">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.count / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Лучший кандидат по скорингу</p>
        {topCandidate ? (
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">{topCandidate.name}</p>
              <p className="mt-2 text-sm font-bold leading-5 text-slate-500">
                {topCandidate.best_match?.job_title ?? 'Позиция не рассчитана'}
              </p>
            </div>
            <ScoreRow title="Совпадение с вакансией" value={topCandidate.best_match?.match_percentage ?? 0} />
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
              Проверь комментарий, назначь целевую позицию и переведи кандидата в следующий статус.
            </p>
          </div>
        ) : (
          <p className="text-sm font-bold leading-6 text-slate-500">Кандидатов пока нет.</p>
        )}
      </div>
    </div>
  );
}

function HrSkillRadar({ candidates }: { candidates: CandidateCard[] }) {
  const radarData = getSkillRadarData(candidates);

  return (
    <Panel title="Средний профиль кандидатов" icon={ClipboardCheck}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fontWeight: 800, fill: '#475569' }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <Radar name="Средний балл" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.24} strokeWidth={3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Интерпретация</p>
          {radarData.map((item) => (
            <div key={item.skill} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-black leading-5 text-slate-900">{item.skill}</span>
                <span className="font-black text-blue-700">{item.score}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(item.score * 10, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function CandidateEditor({
  candidate,
  jobs,
  statusOptions,
  onSaved,
}: {
  candidate: CandidateCard;
  jobs: Array<{ id: number; title: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  onSaved: (candidate: CandidateCard) => void;
}) {
  const [status, setStatus] = useState(candidate.status);
  const [targetJobId, setTargetJobId] = useState(String(candidate.target_job_id ?? candidate.best_match?.job_id ?? ''));
  const [note, setNote] = useState(candidate.hr_note);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setStatus(candidate.status);
    setTargetJobId(String(candidate.target_job_id ?? candidate.best_match?.job_id ?? ''));
    setNote(candidate.hr_note);
  }, [candidate]);

  const selectedStatusLabel = statusOptions.find((option) => option.value === status)?.label ?? candidate.status_label;
  const selectedJobTitle = jobs.find((job) => String(job.id) === targetJobId)?.title ?? candidate.target_job_title;

  const saveStatus = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/candidates/${candidate.attempt_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getDemoRoleHeader() },
        body: JSON.stringify({
          status,
          hr_note: note,
          target_job_id: targetJobId ? Number(targetJobId) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить статус');
      }

      onSaved({
        ...candidate,
        status,
        status_label: selectedStatusLabel,
        hr_note: note,
        target_job_id: targetJobId ? Number(targetJobId) : null,
        target_job_title: selectedJobTitle ?? null,
      });
      setMessage('Сохранено');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.95fr)_minmax(0,1.35fr)]">
        <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <CandidateSummary candidate={candidate} />
            <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
              {candidate.best_match?.match_percentage ?? 0}%
            </span>
          </div>

          {candidate.recommendations.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Скоринг по позициям</p>
              {candidate.recommendations.slice(0, 3).map((recommendation) => (
                <ScoreRow
                  key={recommendation.job_id}
                  title={recommendation.job_title}
                  value={recommendation.match_percentage}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Статус</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Целевая позиция</span>
              <select
                value={targetJobId}
                onChange={(event) => setTargetJobId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blue-500"
              >
                <option value="">Не выбрана</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Комментарий HR</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold leading-6 outline-none focus:border-blue-500"
            />
          </label>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveStatus}
                disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 font-black text-white transition hover:bg-blue-600 disabled:bg-slate-300"
              >
                <Save size={17} />
                {saving ? 'Сохраняю' : 'Сохранить'}
              </button>
            </div>
            <p className="min-h-5 text-sm font-black text-slate-500">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateSummary({ candidate }: { candidate: CandidateCard }) {
  return (
    <div className="min-w-0">
      <p className="text-lg font-black leading-tight text-slate-900">{candidate.name}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{candidate.phone || `VK ID ${candidate.vk_id}`}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">Анкета: {formatCompletedAt(candidate.completed_at)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold leading-5 text-slate-500">
          {candidate.best_match?.job_title ?? candidate.target_job_title ?? 'Позиция не рассчитана'}
        </span>
        <StatusBadge status={candidate.status} label={candidate.status_label} />
      </div>
      <Link
        to="/candidates/$attemptId"
        params={{ attemptId: String(candidate.attempt_id) }}
        className="mt-3 inline-flex text-sm font-black text-blue-600 transition hover:text-blue-700"
      >
        Открыть профиль
      </Link>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    new: 'border-blue-100 bg-blue-50 text-blue-700',
    review: 'border-amber-100 bg-amber-50 text-amber-700',
    invited: 'border-green-100 bg-green-50 text-green-700',
    rejected: 'border-red-100 bg-red-50 text-red-700',
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${styles[status] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}>
      {label}
    </span>
  );
}

function getStatusBarColor(status: string) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500',
    review: 'bg-amber-500',
    invited: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  return colors[status] ?? 'bg-slate-400';
}

function DashboardToolbar({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onRefresh}
        className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        Обновить
      </button>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ScoreRow({ title, value, compact = false }: { title: string; value: number; compact?: boolean }) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className={`flex items-center justify-between gap-3 ${compact ? 'mb-1.5' : 'mb-2'}`}>
        <span className={`${compact ? 'text-sm' : ''} font-black text-slate-900`}>{title}</span>
        <span className="font-black text-blue-700">{normalizedValue}%</span>
      </div>
      <div className={`${compact ? 'h-1.5' : 'h-2'} overflow-hidden rounded-full bg-slate-100`}>
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function getAverageScore(candidates: CandidateCard[]) {
  const scores = candidates.map((candidate) => candidate.best_match?.match_percentage ?? 0).filter(Boolean);
  if (!scores.length) {
    return 0;
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getRankedCandidates(candidates: CandidateCard[], jobId: number | 'all') {
  if (jobId === 'all') {
    return candidates;
  }

  return [...candidates].sort((a, b) => getJobMatch(b, jobId) - getJobMatch(a, jobId));
}

function getJobMatch(candidate: CandidateCard, jobId: number) {
  return candidate.recommendations.find((item) => item.job_id === jobId)?.match_percentage ?? 0;
}

function getRoleStats(candidates: CandidateCard[]) {
  const counts = candidates.reduce<Record<string, number>>((acc, candidate) => {
    const title = candidate.target_job_title ?? candidate.best_match?.job_title ?? 'Не выбрана';
    acc[title] = (acc[title] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);
}

function getSkillRadarData(candidates: CandidateCard[]) {
  const totals = candidates.reduce<Record<string, { total: number; count: number }>>((acc, candidate) => {
    candidate.skills.forEach((skill) => {
      acc[skill.name] = acc[skill.name] ?? { total: 0, count: 0 };
      acc[skill.name].total += skill.score;
      acc[skill.name].count += 1;
    });
    return acc;
  }, {});

  const data = Object.entries(totals).map(([skill, value]) => ({
    skill,
    score: Number((value.total / value.count).toFixed(1)),
  }));

  if (data.length > 0) {
    return data;
  }

  return [
    { skill: 'Производственные операции', score: 0 },
    { skill: 'Обучаемость', score: 0 },
    { skill: 'Безопасность', score: 0 },
    { skill: 'Надежность', score: 0 },
  ];
}

function formatCompletedAt(value: string | null) {
  if (!value) {
    return 'дата не указана';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function useApiData<T>(endpoint: string, fallbackData: T) {
  const [data, setData] = useState<T>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: getDemoRoleHeader(),
        });
        if (!response.ok) {
          throw new Error('API недоступен');
        }

        const nextData = (await response.json()) as T;
        if (!ignore) {
          setData(nextData);
        }
      } catch (error) {
        if (!ignore) {
          setData(fallbackData);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [endpoint, fallbackData, refreshIndex]);

  const refresh = useMemo(() => () => setRefreshIndex((value) => value + 1), []);

  return { data, loading, refresh, setData };
}

function getDemoRoleHeader(): Record<string, string> {
  const user = getCurrentUser();
  return user ? { 'X-Demo-Role': user.role } : {};
}
