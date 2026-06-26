/**
 * CoolLink AI 프론트 화면 자동 캡처 + PDF 생성
 *
 * 실행: npm run capture:pdf
 * 전제: 다른 터미널에서 `npm run dev`로 localhost:3000이 떠 있어야 함 (mock 모드 권장).
 *
 * - 390x844 모바일 viewport로 각 화면을 순서대로 캡처해 screenshots/*.png 저장
 * - 모든 캡처를 한 PDF(artifacts/CoolLink_AI_FE_화면공유용.pdf)로 합침
 * - PDF 각 페이지 상단에 화면 이름을 제목으로 표기
 *
 * 관리자/취약계층/건강정보/SMS·카카오 화면은 캡처 대상에서 제외(애초에 앱에 없음).
 */
import { chromium, type Browser, type Page } from "playwright";
import { promises as fs } from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const VIEWPORT = { width: 390, height: 844 };
const ROOT = process.cwd();
const SCREENSHOT_DIR = path.join(ROOT, "screenshots");
const PDF_PATH = path.join(ROOT, "artifacts", "CoolLink_AI_FE_화면공유용.pdf");

type Shot = { file: string; title: string; subtitle?: string };

/** 앱이 떠 있는지 확인 — 없으면 친절한 안내 후 종료 */
async function ensureAppRunning(): Promise<void> {
  try {
    await fetch(BASE_URL, { method: "GET" });
  } catch {
    console.error("\n❌ localhost:3000에 연결할 수 없어요.");
    console.error(
      "   먼저 다른 터미널에서 `npm run dev`로 localhost:3000을 실행해주세요.",
    );
    console.error("   (mock 모드: .env.local의 NEXT_PUBLIC_ENABLE_MOCK=true)\n");
    process.exit(1);
  }
}

/**
 * 캡처 직전 정리: 고정/스티키 요소를 흐름에 포함시키고 맨 위로 스크롤.
 * 반환한 핸들로 캡처 직후 스타일을 제거해, 이후 탭 클릭이 정상 동작하게 한다.
 */
async function prepareForCapture(page: Page) {
  // Next.js dev 인디케이터(shadow DOM의 'N' 배지/오버레이) 제거
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
  const styleHandle = await page.addStyleTag({
    content: `
      .sticky { position: static !important; }
      nav[aria-label="하단 메뉴"] {
        position: static !important;
        transform: none !important;
        left: auto !important;
      }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  return styleHandle;
}

/** 현재 온보딩 단계의 모든 선택지(라디오그룹)에서 첫 항목 선택 */
async function fillOnboardingStep(page: Page): Promise<void> {
  const groups = page.locator('[role="radiogroup"]');
  const count = await groups.count();
  for (let i = 0; i < count; i += 1) {
    await groups.nth(i).locator('[role="radio"]').first().click();
  }
}

async function run(page: Page, shots: Shot[]): Promise<void> {
  const shoot = async (file: string, title: string, subtitle?: string) => {
    const styleHandle = await prepareForCapture(page);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, file),
      fullPage: true,
    });
    await styleHandle.evaluate((el) => el.remove());
    shots.push({ file, title, subtitle });
    console.log(`  ✓ ${title}`);
  };

  const goto = (route: string) =>
    page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });

  // 1. 스플래시 / 인트로
  await goto("/");
  await page.getByText("오늘의 절약 루틴 시작하기").waitFor();
  await shoot("01-splash.png", "스플래시 / 인트로", "CoolLink AI 첫 진입 화면");

  // 2~4. 온보딩 3단계
  await goto("/onboarding");
  await page.getByRole("heading", { name: "집 환경", exact: true }).waitFor();
  await shoot("02-onboarding-home.png", "온보딩 1단계 — 집 환경");

  await fillOnboardingStep(page);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("heading", { name: "생활패턴", exact: true }).waitFor();
  await shoot("03-onboarding-lifestyle.png", "온보딩 2단계 — 생활패턴");

  await fillOnboardingStep(page);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page
    .getByRole("heading", { name: "냉난방·전기요금", exact: true })
    .waitFor();
  await page
    .getByLabel("최근 월 전기요금")
    .fill("50000")
    .catch(() => undefined);
  await shoot("04-onboarding-energy.png", "온보딩 3단계 — 냉난방·전기요금");

  // 5. 위치 설정
  await goto("/location");
  await page.getByText("현재 위치 사용하기").waitFor();
  await shoot("05-location.png", "위치 설정", "GPS 동의 또는 지역 선택");

  // 6. Today
  await goto("/today");
  await page.getByText("시간대별 절약 행동").waitFor();
  await page.locator("article").first().waitFor();
  await shoot("06-today.png", "Today — 오늘의 절약 플랜");

  // 7. 행동 카드 완료 상태 (2개 완료 후 토스트가 사라지면 캡처)
  for (let k = 0; k < 2; k += 1) {
    await page.getByRole("button", { name: "완료하기" }).first().click();
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(3000); // 토스트 자동 사라짐 대기
  await shoot("07-today-completed.png", "행동 카드 완료 상태");

  // 8. 리포트 (완료 상태 유지 위해 하단 탭으로 soft navigation)
  await page.locator('nav a[href="/report"]').click({ force: true });
  await page.getByText("총 절약액").waitFor();
  await shoot("08-report.png", "리포트 — 절약 성과");

  // 9. 시뮬레이터 (estimate 결과까지 대기)
  await goto("/simulator");
  await page.getByText("현재 설정 온도").waitFor();
  await page.getByText("실제 청구 요금은", { exact: false }).waitFor();
  await shoot("09-simulator.png", "요금 시뮬레이션");

  // 10. 설정
  await goto("/settings");
  await page.getByText("데이터 초기화").waitFor();
  await shoot("10-settings.png", "설정");
}

function readPngSize(buf: Buffer): { width: number; height: number } {
  // PNG: 8B signature + IHDR(len4 + 'IHDR'4 + width4 + height4)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/** 캡처한 PNG들을 제목과 함께 한 PDF로 합침 */
async function buildPdf(page: Page, shots: Shot[]): Promise<void> {
  const DISPLAY_W = 390;
  const SIDE_PAD = 30;
  const HEADER_H = 96;
  const BOTTOM_PAD = 30;

  let maxImgH = 0;
  const items = [];
  for (const shot of shots) {
    const buf = await fs.readFile(path.join(SCREENSHOT_DIR, shot.file));
    const { width, height } = readPngSize(buf);
    const displayH = (height / width) * DISPLAY_W;
    maxImgH = Math.max(maxImgH, displayH);
    items.push({ ...shot, dataUri: `data:image/png;base64,${buf.toString("base64")}` });
  }

  const pageW = DISPLAY_W + SIDE_PAD * 2;
  const pageH = Math.ceil(HEADER_H + maxImgH + BOTTOM_PAD);

  const pagesHtml = items
    .map(
      (it, idx) => `
      <section class="page">
        <header class="hd">
          <div class="brand">CoolLink AI · 화면 공유</div>
          <div class="title">${idx + 1}. ${escapeHtml(it.title)}</div>
          ${it.subtitle ? `<div class="subtitle">${escapeHtml(it.subtitle)}</div>` : ""}
        </header>
        <img class="shot" src="${it.dataUri}" />
      </section>`,
    )
    .join("");

  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8" /><style>
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff;
      font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif; }
    .page { width: ${pageW}px; height: ${pageH}px; padding: 26px ${SIDE_PAD}px 0;
      display: flex; flex-direction: column; align-items: center; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .hd { width: 100%; border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: .03em; color: #16a34a; }
    .title { margin-top: 4px; font-size: 21px; font-weight: 800; color: #14241a; }
    .subtitle { margin-top: 3px; font-size: 12.5px; color: #5b6b62; }
    .shot { width: ${DISPLAY_W}px; height: auto;
      border: 1px solid #e3e8e4; border-radius: 18px; box-shadow: 0 8px 30px rgba(20,36,26,.12); }
  </style></head><body>${pagesHtml}</body></html>`;

  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(
    () =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? null
            : new Promise((res) => {
                img.onload = () => res(null);
                img.onerror = () => res(null);
              }),
        ),
      ),
  );

  await page.pdf({
    path: PDF_PATH,
    printBackground: true,
    width: `${pageW}px`,
    height: `${pageH}px`,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
}

async function main(): Promise<void> {
  await ensureAppRunning();
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(PDF_PATH), { recursive: true });

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      locale: "ko-KR",
    });
    // mock 모드에서 위치 기반 화면(날씨 카드 등)이 채워지도록 기본값 주입
    await context.addInitScript(() => {
      try {
        localStorage.setItem("coollink_user_id", "mock-user-0001");
        localStorage.setItem(
          "coollink_location",
          JSON.stringify({ type: "region", region_name: "서울" }),
        );
        localStorage.setItem("coollink_mock_profile", "1");
      } catch {
        /* 무시 */
      }
    });

    const page = await context.newPage();
    page.setDefaultTimeout(20000);

    console.log("\n📸 화면 캡처 시작 (390x844)\n");
    const shots: Shot[] = [];
    await run(page, shots);

    console.log("\n📄 PDF 생성 중…");
    await buildPdf(page, shots);

    console.log(`\n✅ 완료!`);
    console.log(`   • PNG ${shots.length}장 → ${path.relative(ROOT, SCREENSHOT_DIR)}/`);
    console.log(`   • PDF → ${path.relative(ROOT, PDF_PATH)}\n`);
  } finally {
    await browser?.close();
  }
}

main().catch((error) => {
  console.error("\n❌ 캡처 중 오류가 발생했어요:");
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "\n앱이 정상적으로 떠 있는지(npm run dev), 화면이 바뀌지 않았는지 확인해주세요.\n",
  );
  process.exit(1);
});
