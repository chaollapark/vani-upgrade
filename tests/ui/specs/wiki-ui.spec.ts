import { test, expect } from "@playwright/test";

type Wiki = {
  key: string;
  name: string;
  port: number;
  vaniSkin: boolean;
};

const WIKIS: Wiki[] = [
  { key: "vanisource", name: "Vanisource", port: 8082, vaniSkin: true },
  { key: "vaniquotes", name: "Vaniquotes", port: 8083, vaniSkin: true },
  { key: "vanipedia", name: "Vanipedia", port: 8084, vaniSkin: true },
  { key: "vanitest", name: "Vanitest", port: 8085, vaniSkin: true },
  { key: "vanimedia", name: "Vanimedia", port: 8086, vaniSkin: true },
  { key: "vanibooks", name: "Vanibooks", port: 8087, vaniSkin: false },
  { key: "vanictionary", name: "Vanictionary", port: 8088, vaniSkin: false },
  { key: "vaniversity", name: "Vaniversity", port: 8089, vaniSkin: false }
];

const fatalPattern = /Fatal error|ParseError:|Uncaught Error:|Backtrace:|ERROR_SCHEMA_INVALID_KEY|Stack trace:/i;

async function collectRuntimeIssues(page: any) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (err: Error) => {
    pageErrors.push(err.message);
  });

  page.on("console", (msg: any) => {
    if (msg.type() !== "error") {
      return;
    }
    const text = msg.text();
    consoleErrors.push(text);
  });

  return { pageErrors, consoleErrors };
}

for (const wiki of WIKIS) {
  test.describe(`${wiki.key} UI`, () => {
    test(`${wiki.key}: main page desktop/mobile smoke`, async ({ page }, testInfo) => {
      const runtime = await collectRuntimeIssues(page);
      const url = `http://localhost:${wiki.port}/wiki/Main_Page`;

      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(response, "Main page should respond").not.toBeNull();
      expect((response as any).status(), "Main page status should be < 500").toBeLessThan(500);

      await page.waitForSelector("body", { timeout: 10_000 });
      const html = await page.content();
      expect(html).not.toMatch(fatalPattern);

      const title = await page.title();
      expect(title).toContain(wiki.name);

      const screenshotName = `${wiki.key}-${testInfo.project.name}-main.png`;
      await page.screenshot({ path: `artifacts/${screenshotName}`, fullPage: false });

      await testInfo.attach("console-errors", {
        body: Buffer.from(runtime.consoleErrors.join("\n"), "utf8"),
        contentType: "text/plain"
      });

      expect(runtime.pageErrors, "No uncaught runtime errors on main page").toEqual([]);
    });

    test(`${wiki.key}: special pages render without fatal`, async ({ page }) => {
      const runtime = await collectRuntimeIssues(page);
      const specialPagesUrl = `http://localhost:${wiki.port}/wiki/Special:SpecialPages`;
      const spResp = await page.goto(specialPagesUrl, { waitUntil: "domcontentloaded" });
      expect(spResp, "Special:SpecialPages should respond").not.toBeNull();
      expect((spResp as any).status(), "Special:SpecialPages status should be < 500").toBeLessThan(500);
      expect(await page.content()).not.toMatch(fatalPattern);

      const recentUrl = `http://localhost:${wiki.port}/wiki/Special:RecentChanges`;
      const rcResp = await page.goto(recentUrl, { waitUntil: "domcontentloaded" });
      expect(rcResp, "Special:RecentChanges should respond").not.toBeNull();
      const rcStatus = (rcResp as any).status();
      expect([200, 302, 404], `RecentChanges status ${rcStatus} should be expected`).toContain(rcStatus);
      const rcBody = await page.content();
      if (rcStatus === 404) {
        expect(rcBody).toContain("No changes during the given period match these criteria.");
      }
      expect(rcBody).not.toMatch(fatalPattern);

      expect(runtime.pageErrors, "No uncaught runtime errors on special pages").toEqual([]);
    });

    test(`${wiki.key}: menu interactions (${wiki.vaniSkin ? "VaniSkin" : "Vector"})`, async ({ page }, testInfo) => {
      const runtime = await collectRuntimeIssues(page);
      await page.goto(`http://localhost:${wiki.port}/wiki/Main_Page`, { waitUntil: "domcontentloaded" });

      if (wiki.vaniSkin) {
        const topBar = page.locator(".top-bar").first();
        await expect(topBar).toBeVisible({ timeout: 10_000 });

        if (testInfo.project.name.includes("mobile")) {
          const toggle = page.locator(".toggle-topbar.menu-icon a").first();
          await expect(toggle).toBeVisible({ timeout: 10_000 });
          await toggle.click();
          await expect(topBar).toHaveClass(/expanded/);

          const firstDropdownAnchor = page
            .locator(".top-bar-section li.has-dropdown > a")
            .first();
          if (await firstDropdownAnchor.count()) {
            await firstDropdownAnchor.click();
            const index = await topBar.evaluate((el) => {
              const jq = (window as any).jQuery;
              if (!jq) return 0;
              return Number(jq(el).data("index") || 0);
            });
            expect(index).toBeGreaterThanOrEqual(1);
          }
        } else {
          const firstDropdown = page.locator(".top-bar-section li.has-dropdown").first();
          await expect(firstDropdown).toBeVisible({ timeout: 10_000 });
          await firstDropdown.hover();
          const dropdownMenu = firstDropdown.locator("ul.dropdown").first();
          await expect(dropdownMenu).toBeVisible({ timeout: 10_000 });
        }

        const accordionRoot = page.locator("[data-accordion], .accordion").first();
        if (await accordionRoot.count()) {
          const trigger = accordionRoot.locator("a").first();
          if (await trigger.count()) {
            await trigger.click({ force: true });
          }
        }
      } else {
        await expect(page.locator("#mw-content-text")).toBeVisible({ timeout: 10_000 });
        const searchInput = page.locator("#searchInput, #p-search input[name=search]").first();
        if (await searchInput.count()) {
          await expect(searchInput).toBeVisible();
          await searchInput.fill("Krishna");
        }
      }

      expect(runtime.pageErrors, "No uncaught runtime errors during UI interaction").toEqual([]);
    });
  });
}
