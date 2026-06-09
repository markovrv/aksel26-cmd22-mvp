import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Factory, Image as ImageIcon, MapPin } from 'lucide-react';

import { API_URL } from '../config';

interface Excursion {
  id: number;
  title: string;
  location: string;
  tag: string;
  desc: string;
  date: string;
  images: string[];
}

export function ExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/excursions`)
      .then((res) => res.json())
      .then((data) => {
        setExcursions(data);
        setExpandedId((currentId) => currentId ?? data[0]?.id ?? null);
      })
      .catch((err) => console.error('Ошибка загрузки:', err));
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <header className="mb-10 text-left sm:mb-14 md:mb-16">
        <div className="mb-6 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
          Промышленные экскурсии 2026
        </div>
        <h2 className="mb-5 text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-6xl lg:tracking-tighter">
          Найди работу <br className="hidden sm:block" /> <span className="text-blue-600 italic">в реальности.</span>
        </h2>
        <p className="max-w-2xl text-base leading-7 text-slate-500 sm:text-xl sm:text-slate-400">
          Записывайся на экскурсии, изучай производство изнутри и проходи AI-тестирование прямо на месте.
        </p>
      </header>

      <div className="space-y-5 sm:space-y-8">
        {excursions.map((exc) => (
          <div key={exc.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 sm:rounded-[40px]">
            <div className="relative flex flex-col items-stretch justify-between gap-5 p-5 sm:p-8 md:flex-row md:items-center lg:p-10">
              <div className="flex items-start gap-3 pr-9 sm:items-center sm:gap-8 sm:pr-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-20 sm:w-20 sm:rounded-3xl">
                  <Factory size={28} className="sm:h-10 sm:w-10" />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-start gap-2 sm:items-center sm:gap-3">
                    <h3 className="text-[26px] font-black leading-[1.08] tracking-tight sm:text-3xl">{exc.title}</h3>
                    <CheckCircle2 size={20} className="mt-1 hidden shrink-0 text-green-500 sm:block" />
                  </div>
                  <div className="flex items-start text-sm font-bold leading-5 text-slate-400 sm:items-center">
                    <MapPin size={15} className="mr-2 mt-0.5 shrink-0 sm:mt-0 sm:h-4 sm:w-4" /> {exc.location}
                  </div>
                </div>
              </div>
              <CheckCircle2 size={20} className="absolute right-5 top-5 text-green-500 sm:hidden" />

              <button
                onClick={() => toggleExpand(exc.id)}
                className={`flex h-12 w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-black transition-all sm:text-lg md:w-auto ${
                  expandedId === exc.id ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                }`}
              >
                {expandedId === exc.id ? (
                  <>
                    <span>Закрыть</span> <ChevronUp size={22} />
                  </>
                ) : (
                  <>
                    <span>Подробнее</span> <ChevronDown size={22} />
                  </>
                )}
              </button>
            </div>

            {expandedId === exc.id && (
              <div className="space-y-7 px-5 pb-5 sm:space-y-10 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10">
                <div className="h-px w-full bg-slate-100" />

                <div className="grid gap-5 md:grid-cols-3 md:gap-10">
                  <div className="space-y-4 md:col-span-1 md:space-y-6">
                    <div className="rounded-2xl bg-blue-50/50 p-5 sm:rounded-3xl sm:p-6">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-400">Статус</p>
                      <p className="font-bold text-blue-900">{exc.tag}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 sm:rounded-3xl sm:p-6">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-500">Дата события</p>
                      <p className="font-bold text-amber-900">{exc.date}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-base italic leading-7 text-slate-500 sm:text-xl sm:leading-relaxed">«{exc.desc}»</p>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <ImageIcon size={20} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 sm:text-sm">
                      Галерея производства ({exc.images.length} фото)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                    {exc.images.map((img, index) => (
                      <div key={img} className="group aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:rounded-[24px]">
                        <img
                          src={img}
                          alt={`Slide ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/survey"
                  className="block w-full rounded-3xl bg-slate-900 px-5 py-5 text-center text-lg font-black leading-tight text-white transition-all hover:bg-blue-600 active:scale-[0.98] sm:rounded-[32px] sm:py-6 sm:text-2xl"
                >
                  Записаться и получить тест
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
