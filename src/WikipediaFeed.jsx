import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, ExternalLink } from 'lucide-react';

/* ---------- НАСТРОЙКИ ---------- */
const PAGE_BATCH = 10;            // статей за «скролл»
const WIKI_LANG = 'ru';           // язык Википедии
const API_URL = `https://${WIKI_LANG}.wikipedia.org/api/rest_v1/page/random/summary`;
const PAGE_URL = title =>
  `https://${WIKI_LANG}.wikipedia.org/wiki/${encodeURIComponent(title)}`;

/* ---------- МОДАЛКА: ПОЛНАЯ СТАТЬЯ ---------- */
const ArticleModal = ({ article, onClose }) => {
  const [html, setHtml] = useState(null);
  const contentRef = useRef(null);

  /* 1. Загружаем всю статью (HTML) */
  useEffect(() => {
    if (!article) return;

    setHtml('Загрузка…');

    const PARSE_URL =
      `https://${WIKI_LANG}.wikipedia.org/w/api.php` +
      `?action=parse&format=json&prop=text&formatversion=2&origin=*` +
      `&page=${encodeURIComponent(article.title)}`;

    fetch(PARSE_URL)
      .then(r => r.json())
      .then(d => setHtml(d.parse?.text || 'Статья не найдена.'))   // ← без обрезки
      .catch(() => setHtml('Не удалось загрузить статью.'));
  }, [article]);

  /* 2. Делаем «Краткие факты» раскрывающимися */
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current
      .querySelectorAll('button[aria-expanded]')
      .forEach(btn => {
        btn.onclick = () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', !expanded);
          const next = btn.nextElementSibling;
          if (next) next.style.display = expanded ? 'none' : '';
        };
      });
  }, [html]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      <button className="self-end p-4 text-white" onClick={onClose} aria-label="Закрыть">
        <X size={28} />
      </button>

      <div className="flex-1 overflow-y-auto bg-white rounded-t-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>

        <article
          ref={contentRef}
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <Button asChild className="gap-2 mt-6" variant="outline" size="lg">
          <a href={PAGE_URL(article.title)} target="_blank" rel="noopener noreferrer">
            Перейти на страницу Википедии <ExternalLink size={18} />
          </a>
        </Button>
      </div>
    </div>
  );
};

/* ---------- КАРТОЧКА В ЛЕНТЕ ---------- */
const WikiCard = ({ article, onRead }) => {
  const [liked, setLiked] = useState(false);

  return (
    <Card className="w-full max-w-lg mx-auto mb-6 shadow-lg rounded-2xl overflow-hidden">
      {article.thumbnail?.source && (
        <img
          src={article.thumbnail.source}
          alt={article.title}
          className="w-full h-60 object-cover"
        />
      )}

      <CardContent className="p-4 space-y-4">
        <h2 className="text-xl font-semibold leading-snug">{article.title}</h2>
        <p className="text-base leading-relaxed text-muted-foreground line-clamp-5">
          {article.extract}
        </p>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setLiked(!liked)}
            aria-label="Like"
          >
            <Heart size={20} className={liked ? 'fill-current' : 'stroke-current'} />
            {liked ? 'Liked' : 'Like'}
          </Button>

          <Button variant="link" size="sm" onClick={() => onRead(article)}>
            Читать полностью →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ---------- ЛЕНТА СТАТЕЙ ---------- */
const WikipediaFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);
  const loaderRef = useRef(null);

  /* загрузка новой порции */
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const batch = Array.from({ length: PAGE_BATCH }).map(() =>
        fetch(API_URL).then(r => r.json()),
      );
      const results = await Promise.all(batch);
      setArticles(prev => [...prev, ...results]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  /* бесконечный скролл */
  useEffect(() => {
    const obs = new IntersectionObserver(
      e => e[0].isIntersecting && !loading && fetchArticles(),
      { threshold: 1 },
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [fetchArticles, loading]);

  return (
    <div className="flex flex-col items-center py-8">
      {articles.map((a, i) => (
        <WikiCard key={`${a.pageid}-${i}`} article={a} onRead={setOpenArticle} />
      ))}

      <span ref={loaderRef} className="h-8" />
      {loading && <p className="text-base mt-4">Загрузка…</p>}

      <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
    </div>
  );
};

export default WikipediaFeed;
