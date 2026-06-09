import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, ClipboardCheck, MessageSquareText, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { API_URL } from '../config';
import { getCurrentUser } from '../auth';

interface CandidateProfile {
  attempt_id: number;
  name: string;
  phone: string;
  completed_at: string | null;
  status_label: string;
  hr_note: string;
  best_match: { job_id: number; job_title: string; match_percentage: number } | null;
  recommendations: Array<{ job_id: number; job_title: string; match_percentage: number }>;
  skills: Array<{ name: string; category: string; score: number }>;
  strengths: string[];
  risks: string[];
  interview_questions: string[];
  match_summary: string;
  answers: Array<string | { question_index: number; answer: string }>;
}

export function CandidatePage() {
  const { attemptId } = useParams({ from: '/candidates/$attemptId' });
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();

    fetch(`${API_URL}/api/candidates/${attemptId}`, {
      headers: user ? { 'X-Demo-Role': user.role } : {},
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('candidate not found');
        }
        return response.json();
      })
      .then(setCandidate)
      .catch(() => setError('Не удалось загрузить профиль кандидата'));
  }, [attemptId]);

  if (error) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">
        {error}
      </section>
    );
  }

  if (!candidate) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-6 font-bold text-slate-500">Загрузка профиля...</section>;
  }

  return (
    <section className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700">
        <ArrowLeft size={18} strokeWidth={3} />
        Назад в дашборд
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Профиль кандидата</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-black leading-none tracking-tight">{candidate.name}</h2>
            <p className="mt-3 font-bold text-slate-500">{candidate.phone || 'Телефон не указан'} · {candidate.status_label}</p>
          </div>
          {candidate.best_match && (
            <div className="rounded-2xl bg-blue-50 px-5 py-4 text-right">
              <p className="text-xs font-black uppercase tracking-widest text-blue-500">Лучший матч</p>
              <p className="mt-1 text-2xl font-black text-blue-700">{candidate.best_match.match_percentage}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="Объяснение скоринга" icon={Trophy}>
          <p className="mb-4 font-bold leading-6 text-slate-500">{candidate.match_summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoList title="Сильные стороны" items={candidate.strengths} tone="green" />
            <InfoList title="Риски" items={candidate.risks} tone="amber" />
          </div>
        </Panel>

        <Panel title="Вопросы для интервью" icon={MessageSquareText}>
          <ul className="space-y-3">
            {candidate.interview_questions.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">{item}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Навыки и позиции" icon={ClipboardCheck}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            {candidate.skills.map((skill) => (
              <ScoreRow key={skill.name} title={`${skill.name} (${skill.category})`} value={Math.min(skill.score * 10, 100)} />
            ))}
          </div>
          <div className="space-y-3">
            {candidate.recommendations.map((recommendation) => (
              <ScoreRow key={recommendation.job_id} title={recommendation.job_title} value={recommendation.match_percentage} />
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Trophy; children: React.ReactNode }) {
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

function InfoList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' }) {
  const className = tone === 'green' ? 'border-green-100 bg-green-50 text-green-800' : 'border-amber-100 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className="mb-3 text-xs font-black uppercase tracking-widest">{title}</p>
      <ul className="space-y-2 text-sm font-bold leading-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function ScoreRow({ title, value }: { title: string; value: number }) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-black text-slate-900">{title}</span>
        <span className="font-black text-blue-700">{Math.round(normalizedValue)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}
