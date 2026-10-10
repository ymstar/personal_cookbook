"use client";

import { useState, useMemo, useEffect } from "react";
import type { Recipe } from "@/lib/types";
import { Markdown } from "./Markdown";
import { Lightbox, type LightboxImage } from "./Lightbox";

const CAT_ORDER = [
  "🥚 蛋类",
  "🥩 肉类",
  "🦐 虾 · 海鲜",
  "🥬 素菜",
  "🍲 炖 · 一锅",
  "🍜 主食",
  "🍰 甜点",
];

export function RecipeList({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
    title: string;
  } | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(recipes.map((r) => r.category).filter(Boolean))];
    cats.sort((a, b) => {
      const ia = CAT_ORDER.indexOf(a);
      const ib = CAT_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return cats;
  }, [recipes]);

  const totalImages = useMemo(
    () => new Set(recipes.flatMap((r) => r.images.map((im) => im.url))).size,
    [recipes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const hay = (
        r.title +
        " " +
        r.category +
        " " +
        r.steps +
        " " +
        r.notes +
        " " +
        r.ingredients.map((i) => i.name + " " + i.quantity).join(" ")
      ).toLowerCase();
      return (!q || hay.includes(q)) && (!activeCat || r.category === activeCat);
    });
  }, [recipes, query, activeCat]);

  if (!recipes.length) {
    return (
      <div
        className="rounded-2xl p-6 text-center text-sm"
        style={{
          background: "var(--card)",
          color: "var(--muted)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="mb-2 text-3xl">🍳</div>
        还没有菜谱。去「管理」页面添加第一道菜吧！
      </div>
    );
  }

  return (
    <>
      {/* 搜索栏 */}
      <div className="mb-3 flex gap-2">
        <input
          type="search"
          placeholder="搜菜名、食材、做法…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 text-base outline-none transition-colors"
          style={{
            borderColor: "var(--line)",
            background: "var(--card)",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* 分类筛选 */}
      <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto px-0.5 pb-1">
        <CatChip
          label="全部"
          active={activeCat === ""}
          onClick={() => setActiveCat("")}
        />
        {categories.map((c) => (
          <CatChip
            key={c}
            label={c}
            active={activeCat === c}
            onClick={() => setActiveCat(c)}
          />
        ))}
      </div>

      {/* 计数 */}
      <div className="mb-3 px-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {query || activeCat
          ? `找到 ${filtered.length} / ${recipes.length} 道菜`
          : `${recipes.length} 道菜 · ${totalImages} 张成果图`}
      </div>

      {/* 菜谱卡片网格 */}
      <div className="recipe-grid">
        {filtered.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            onClick={() => setSelected(r)}
          />
        ))}
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <RecipeDetailModal
          recipe={selected}
          onClose={() => setSelected(null)}
          onImageClick={(images, idx) =>
            setLightbox({ images, index: idx, title: selected.title })
          }
        />
      )}

      {/* 图片灯箱 */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all"
      style={
        active
          ? {
              background: "var(--accent)",
              borderColor: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
            }
          : {
              borderColor: "var(--line)",
              background: "var(--card)",
              color: "var(--muted)",
            }
      }
    >
      {label}
    </button>
  );
}

/* ── 统一尺寸的菜谱卡片 ── */
function RecipeCard({
  recipe,
  onClick,
}: {
  recipe: Recipe;
  onClick: () => void;
}) {
  const cover = recipe.images[0]?.url;

  return (
    <article className="rc" onClick={onClick}>
      <div className="rc-img-wrap">
        {cover ? (
          <img
            className="rc-img"
            src={cover}
            alt={recipe.title}
            loading="lazy"
          />
        ) : (
          <div className="rc-placeholder">🍽️</div>
        )}
      </div>
      <div className="rc-info">
        <h3 className="rc-title">{recipe.title}</h3>
        <div className="rc-meta">
          {recipe.category && (
            <span className="rc-badge">{recipe.category}</span>
          )}
          <span className="rc-count">
            📷 {recipe.images.length || 0}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── 详情弹窗 ── */
function RecipeDetailModal({
  recipe,
  onClose,
  onImageClick,
}: {
  recipe: Recipe;
  onClose: () => void;
  onImageClick: (images: LightboxImage[], idx: number) => void;
}) {
  const images: LightboxImage[] = recipe.images.map((im) => ({
    src: im.url,
    alt: im.alt,
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="rc-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rc-modal">
        {/* 头部 */}
        <div
          className="flex items-start gap-3 px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              {recipe.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {recipe.category && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent-deep)",
                  }}
                >
                  {recipe.category}
                </span>
              )}
              {recipe.last_practice && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs"
                  style={{
                    background: "var(--mine-bg)",
                    color: "var(--good)",
                  }}
                >
                  {recipe.last_practice}
                </span>
              )}
              <span
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                {images.length ? `${images.length} 张成果图` : "待配图"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg transition-colors"
            style={{ background: "var(--accent-soft)", color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-5 py-4">
          {/* 图片画廊 */}
          {images.length > 0 && (
            <div
              className="mb-4 grid gap-2"
              style={{
                gridTemplateColumns:
                  images.length === 1
                    ? "1fr"
                    : images.length === 2
                      ? "repeat(2,1fr)"
                      : "repeat(3,1fr)",
              }}
            >
              {images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => onImageClick(images, i)}
                  className="relative aspect-square overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
                  style={{ background: "var(--line)" }}
                >
                  <img
                    src={im.src}
                    alt={im.alt || `${recipe.title} 第 ${i + 1} 张`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 食材清单 */}
          {recipe.ingredients.length > 0 && (
            <section className="mb-4">
              <h4
                className="mb-2 text-sm font-bold tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                🧺 食材
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="rounded-lg px-2.5 py-1 text-sm"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--ink)",
                    }}
                  >
                    {ing.name}
                    {ing.quantity && (
                      <span style={{ color: "var(--muted)" }}>
                        {" "}
                        {ing.quantity}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 标准做法 */}
          {recipe.steps?.trim() && (
            <section className="mb-4">
              <h4
                className="mb-2 text-sm font-bold tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                📝 标准做法
              </h4>
              <Markdown>{recipe.steps}</Markdown>
            </section>
          )}

          {/* 我的做法 */}
          {recipe.notes?.trim() && (
            <section
              className="mb-4 rounded-xl border p-3"
              style={{
                background: "var(--mine-bg)",
                borderColor: "var(--mine-line)",
              }}
            >
              <h4
                className="mb-2 text-sm font-bold tracking-wide"
                style={{ color: "var(--good)" }}
              >
                ✍️ 我的做法
              </h4>
              <Markdown>{recipe.notes}</Markdown>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
