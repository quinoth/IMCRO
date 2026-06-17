import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const appSource = source("src/App.jsx");
const authPageSource = source("src/pages/AuthPage.jsx");
const megaMenuSource = source("src/features/nav/MegaMenu.jsx");

assert.ok(
  appSource.includes('path="/sveden/*"'),
  "canonical /sveden/* route remains available",
);
assert.ok(
  appSource.includes('path="/svedeniya/*"'),
  "public /svedeniya/* alias is registered",
);
assert.ok(
  appSource.includes('path="/bezopasnost/"'),
  "standalone Security page route is registered",
);
assert.ok(
  appSource.includes('replace(/^\\/svedeniya\\/?/, "/sveden/")'),
  "/svedeniya/* alias preserves the nested path when redirecting to /sveden/*",
);

assert.ok(
  !appSource.includes('if (!article) return <Navigate to="/" replace />;'),
  "direct /article/:id no longer silently redirects to the home page",
);
assert.ok(
  appSource.includes("function ArticleNotFoundPage("),
  "ArticleRoute has a public not-found state for missing articles",
);
assert.ok(
  appSource.includes('onBack={() => navigate("/novosti/")}'),
  "ArticlePage back action returns to the news page",
);

for (const forbiddenColor of ["#EF4444", "#F59E0B", "#10B981"]) {
  assert.ok(
    !authPageSource.includes(forbiddenColor),
    `password strength indicator does not use ${forbiddenColor}`,
  );
}
assert.ok(
  authPageSource.includes("getPasswordStrengthColor"),
  "password strength indicator uses a palette helper",
);
assert.ok(
  authPageSource.includes('"#477799"') && authPageSource.includes('"#1F5073"'),
  "password strength indicator uses the public IMCRO palette",
);

assert.ok(
  megaMenuSource.includes("width: min(1180px, calc(100% - 32px))"),
  "MegaMenu desktop width is constrained to the requested 1120-1200px range",
);
