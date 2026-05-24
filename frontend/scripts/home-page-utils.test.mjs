import assert from "node:assert/strict";
import {
  CONTACT_COORDS,
  buildMapEmbedSrc,
  buildMapHref,
  getCarouselState,
  getFeaturedNews,
  getNewsAuthorHref,
  getNewsAuthorLabel,
  getNewsDescription,
  getNewsHref,
  getNewsImage,
} from "../src/pages/homePageUtils.js";

const latestNews = {
  id: 42,
  slug: "latest-news",
  title: "Последняя опубликованная новость",
  lead: "Короткий анонс из базы данных.",
  cover_image_url: "/static/articles/covers/latest.jpg",
  published_at: "2026-05-23T08:15:00+08:00",
  author_name: "Иванова Мария Сергеевна",
};

assert.equal(getFeaturedNews([latestNews])?.slug, "latest-news");
assert.equal(getNewsImage(latestNews), "/static/articles/covers/latest.jpg");
assert.equal(getNewsDescription(latestNews), "Короткий анонс из базы данных.");
assert.equal(getNewsHref(latestNews), "/article/latest-news");
assert.equal(getNewsAuthorLabel(latestNews), "Иванова Мария Сергеевна");
assert.equal(getNewsAuthorLabel({
  last_name: "Петрова",
  first_name: "Ольга",
  middle_name: "Сергеевна",
  author_name: "tpmpk_operator",
}), "Петрова Ольга Сергеевна");
assert.equal(getNewsAuthorLabel({ author_name: "abramova_iv", author_id: 7 }), "Редакция ИМЦРО");
assert.equal(getNewsAuthorLabel({ author_name: "editor@example.test" }), "Редакция ИМЦРО");
assert.equal(getNewsAuthorLabel({ author: "Автор #7" }), "Редакция ИМЦРО");
assert.equal(getNewsAuthorHref({ authorKey: "id-7", author_id: 7 }), "/authors/id-7/");
assert.equal(getNewsAuthorHref({ author_key: "id-8", author_id: 8 }), "/authors/id-8/");

assert.deepEqual(CONTACT_COORDS, { lat: 52.281732, lon: 104.280948 });
assert.ok(buildMapHref(CONTACT_COORDS).includes("52.281732"));
assert.ok(buildMapHref(CONTACT_COORDS).includes("104.280948"));
assert.ok(buildMapEmbedSrc(CONTACT_COORDS).includes("yandex.ru/map-widget"));
assert.ok(buildMapEmbedSrc(CONTACT_COORDS).includes("pt=104.280948%2C52.281732"));

const startState = getCarouselState({
  scrollLeft: 0,
  scrollWidth: 2400,
  clientWidth: 600,
  pageCount: 4,
});
assert.equal(startState.activeIndex, 0);
assert.equal(startState.canPrev, false);
assert.equal(startState.canNext, true);

const middleState = getCarouselState({
  scrollLeft: 900,
  scrollWidth: 2400,
  clientWidth: 600,
  pageCount: 4,
});
assert.equal(middleState.activeIndex, 2);
assert.equal(middleState.canPrev, true);
assert.equal(middleState.canNext, true);

const endState = getCarouselState({
  scrollLeft: 1800,
  scrollWidth: 2400,
  clientWidth: 600,
  pageCount: 4,
});
assert.equal(endState.activeIndex, 3);
assert.equal(endState.canPrev, true);
assert.equal(endState.canNext, false);
