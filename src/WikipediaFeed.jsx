import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, ExternalLink } from "lucide-react";

// Количество новых статей, подгружаемых за один «скролл»
const PAGE_BATCH = 10;

// Текущий язык Wikipedia — меняйте при необходимости
const WIKI_LANG = "ru";
const API_URL = `https://${WIKI_LANG}.wikipedia.org/api/rest_v1/page/random/summary`;
const PAGE_URL = (title) =>
  `https://${WIKI_LANG}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
const FULL_HTML_URL = (title) =>
  `https://${WIKI_LANG}.wikipedia.org/api/rest_v1/page/mobile-html/${encodeURIComponent(
    title
  )}`;

/**
 * Модальное окно: внутри ~полная статья (mobile‑html) + кнопка «Перейти в Википедию».
 */
const ArticleModal = ({ article, onClose }) => {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    if (!article) return;
    setHtml(null);
    fetch(FULL_HTML_URL(article.title))
      .then((r) => r.text())
      .then((text) => setHtml(text))
      .catch(() => setHtml("Не удалось загрузить статью."));
  }, [article]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      <button
        className="self-end p-4 text-white"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X size={28} />
      </button>

      <div className="flex-1 overflow-y-auto bg-white rounded-t-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>

        {html ? (
          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p>Загрузка…</p>
        )}

        <Button
          asChild
          className="gap-2 mt-6"
          variant="outline"
          size="lg"
        >
          <a
            href={PAGE_URL(article.title)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Перейти на страницу Википедии <ExternalLink size={18} />
          </a>
        </Button>
      </div>
    </div>
  );
};

/**
 * Карточка одной статьи Wikipedia в «инстаграм‑стиле».
 */
const WikiCard = ({ article, onRead }) => {
  const [liked, setLiked] = useState(false);

  return (
    <Card className="w-full max-w-lg mx-auto mb-6 shadow-lg rounded-2xl overflow-hidden">
      {/* Обложка, если есть */}
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
            <Heart
              size={20}
              className={liked ? "fill-current" : "stroke-current"}
            />
            {liked ? "Liked" : "Like"}
          </Button>

          <Button variant="link" size="sm" onClick={() => onRead(article)}>
            Читать полностью →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Главная лента: бесконечный скролл случайных статей Wikipedia.
 */
const WikipediaFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);

  const loaderRef = useRef(null);

  // Получает одну порцию случайных статей
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const promises = Array.from({ length: PAGE_BATCH }).map(() =>
        fetch(API_URL).then((r) => r.json())
      );
      const results = await Promise.all(promises);
      setArticles((prev) => [...prev, ...results]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первая загрузка
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Infinite scroll через IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchArticles();
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchArticles, loading]);

  return (
    <div className="flex flex-col items-center py-8">
      {articles.map((a, idx) => (
        <WikiCard key={`${a.pageid}-${idx}`} article={a} onRead={setOpenArticle} />
      ))}

      {/* «Якорь» для IntersectionObserver */}
      <span ref={loaderRef} className="h-8" />
      {loading && <p className="text-base mt-4">Загрузка…</p>}

      {/* Модалка со статьёй */}
      <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
    </div>
  );
};

export default WikipediaFeed;
