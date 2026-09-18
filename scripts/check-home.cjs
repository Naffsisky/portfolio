// Start the site on port 3000, then run with Playwright available through NODE_PATH:
// npm exec --yes --package=playwright -c 'NODE_PATH="$(dirname "$(dirname "$(command -v playwright)")")" node scripts/check-home.cjs'
const assert = require('node:assert/strict')
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH })
  const base = process.env.BASE_URL || 'http://localhost:3000'
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    // Keep the check independent of analytics, remote storage, and video availability.
    await page.route('https://**/*', route => route.abort())
    await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
    await page.getByRole('heading', { name: 'Cybersecurity enthusiast', exact: true }).waitFor()
    await page.getByRole('heading', { name: 'System analyst enthusiast', exact: true }).waitFor()
    const focus = page.getByRole('region', { name: 'More than infrastructure.' })
    assert.equal(await focus.locator('article').count(), 3)
    assert.equal(await focus.getByRole('heading', { name: 'Software developer', exact: true }).count(), 1)
    assert.equal(await focus.getByRole('link').count(), 3)
    const pause = page.getByRole('button', { name: 'Pause animation' })
    await pause.click()
    await page.locator('button[aria-pressed="true"]').waitFor()
    const packet = page.locator('svg path[pathLength="100"]').first()
    assert.equal(await packet.evaluate(el => getComputedStyle(el).animationPlayState), 'paused')
    await pause.click()
    await page.locator('button[aria-pressed="false"]').waitFor()
    assert.equal(await packet.evaluate(el => getComputedStyle(el).animationPlayState), 'running')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await packet.evaluate(el => getComputedStyle(el).animationName), 'none')

    await page.goto(base + '/about', { waitUntil: 'networkidle' })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const security = page.getByRole('img', { name: /Illustrative defensive cloud security/ })
    const securityPackets = security.locator('path[pathLength="100"]')
    assert.equal(await securityPackets.count(), 5)
    const securityPause = page.getByRole('button', { name: 'Pause security animation' })
    await securityPause.press('Enter')
    await page.getByRole('button', { name: 'Pause security animation', pressed: true }).waitFor()
    assert.ok(await securityPackets.evaluateAll(paths => paths.every(path => getComputedStyle(path).animationPlayState === 'paused')))
    await securityPause.press('Enter')
    await page.getByRole('button', { name: 'Pause security animation', pressed: false }).waitFor()
    assert.ok(await securityPackets.evaluateAll(paths => paths.every(path => getComputedStyle(path).animationPlayState === 'running')))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.ok(await securityPackets.evaluateAll(paths => paths.every(path => getComputedStyle(path).animationName === 'none')))

    for (const path of ['/', '/about', '/projects', '/projects/portainer', '/certificates', '/cv', '/blog', '/blog/jenkins-cicd-k3s-part-1', '/missing-page', '/projects/missing-project', '/blog/missing-post', '/nonton']) {
      const response = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 })
      if (path.includes('missing-')) {
        // Next.js may stream the not-found UI after sending a 200 response.
        assert.ok([200, 404].includes(response.status()), path)
        await page.getByRole('heading', { name: 'This route leads nowhere.' }).waitFor()
      } else {
        assert.equal(response.status(), 200, path)
      }
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path + ' overflows at ' + width)
        const toggle = page.getByRole('button', { name: 'Open menu' })
        if (width <= 850) {
          await toggle.waitFor()
          assert.equal(await page.getByRole('banner').getByRole('link').count(), 0)
          assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
          await toggle.press('Enter')
          assert.equal(await page.getByRole('button', { name: 'Close menu' }).getAttribute('aria-expanded'), 'true')
        } else {
          await page.getByRole('navigation', { name: 'Main navigation' }).waitFor()
          assert.equal(await toggle.isVisible(), false)
        }
        assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).count(), 1, path)
        const header = page.getByRole('banner')
        assert.equal(await header.getByRole('link', { name: 'Prinafsika home' }).count(), 0)
        assert.equal(await header.getByRole('link').count(), 6)
        assert.equal(await header.evaluate(el => getComputedStyle(el).position), 'sticky')
        assert.ok(await header.getByRole('link', { name: 'Home', exact: true }).evaluate(el => Math.abs(el.getBoundingClientRect().left - el.closest('nav').getBoundingClientRect().left) < 1))
        if (width <= 850) {
          await header.getByRole('link', { name: 'Home', exact: true }).focus()
          await page.keyboard.press('Escape')
          assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
          assert.ok(await toggle.evaluate(el => el === document.activeElement))
        }
        await page.evaluate(() => window.scrollTo(0, 500))
        assert.ok(Math.abs((await header.boundingBox()).y) < 1, path + ' header must remain visible while scrolling')
        await page.evaluate(() => window.scrollTo(0, 0))
        assert.equal(await page.locator('main').count(), 1, path)
        assert.equal(await page.getByText('Nap Menu', { exact: true }).count(), 0, path)
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light', path)
      }
      if (path === '/projects/portainer') {
        assert.equal(await page.locator('header nav a[href="/projects"]').getAttribute('aria-current'), 'page')
      }
      if (path === '/certificates') {
        await page.getByText('Image unavailable', { exact: true }).first().waitFor()
      }
    }

    await page.goto(base + '/projects', { waitUntil: 'networkidle' })
    const programming = page.getByRole('img', { name: /Illustrative programming workflow/ })
    const programmingAnimations = programming.locator('code, path[pathLength="100"]')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.getByRole('button', { name: 'Pause programming animation' }).press('Enter')
    await page.getByRole('button', { name: 'Pause programming animation', pressed: true }).waitFor()
    assert.ok(await programmingAnimations.evaluateAll(elements => elements.every(el => getComputedStyle(el).animationPlayState === 'paused')))
    await page.getByRole('button', { name: 'Pause programming animation' }).press('Enter')
    await page.getByRole('button', { name: 'Pause programming animation', pressed: false }).waitFor()
    assert.ok(await programmingAnimations.evaluateAll(elements => elements.every(el => getComputedStyle(el).animationPlayState === 'running')))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.ok(await programmingAnimations.evaluateAll(elements => elements.every(el => getComputedStyle(el).animationName === 'none')))
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      const filters = page.locator('[aria-label="Project categories"]')
      assert.ok(await filters.evaluate(el => el.getBoundingClientRect().top >= el.previousElementSibling.getBoundingClientRect().bottom))
      assert.equal(await filters.evaluate(el => el.getBoundingClientRect().width), await filters.evaluate(el => el.parentElement.getBoundingClientRect().width))
      const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
      const diagram = await programming.boundingBox()
      assert.ok(width > 850 ? diagram.x > heading.x + heading.width : diagram.y > heading.y + heading.height)
    }
    assert.equal(await page.locator('main a[href^="/projects/"]').count(), 6)
    await page.getByRole('button', { name: 'Load more projects' }).click()
    await page.waitForFunction(() => document.querySelectorAll('main a[href^="/projects/"]').length === 12)
    await page.getByRole('button', { name: 'Docker', exact: true }).click()
    await page.getByRole('button', { name: 'Docker', exact: true, pressed: true }).waitFor()
    assert.equal(await page.locator('main a[href^="/projects/"]').count(), 1)
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.waitForFunction(() => document.querySelectorAll('main a[href^="/projects/"]').length === 6)

    await page.goto(base + '/blog?page=2', { waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('navigation', { name: 'Blog pagination' }).getByRole('link', { name: '2', exact: true }).getAttribute('aria-current'), 'page')
    await page.goto(base + '/blog?category=Technology', { waitUntil: 'networkidle' })
    await page.getByRole('searchbox', { name: 'Search blog' }).fill('kubernetes')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.waitForURL('**/blog?q=kubernetes&category=Technology')
    assert.ok(await page.locator('main li').count() > 0)
    await page.getByRole('searchbox', { name: 'Search blog' }).fill('no-matching-post-12345')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.getByText('Tidak ada blog yang cocok dengan filter atau kata kunci pencarian.').waitFor()
    await page.getByRole('link', { name: 'Reset', exact: true }).click()
    await page.waitForURL(base + '/blog?category=All')
    await page.waitForFunction(() => document.querySelector('#blog-search')?.value === '')
    assert.equal(await page.getByRole('searchbox', { name: 'Search blog' }).inputValue(), '')
    await page.getByRole('link', { name: 'Daily Life', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Blog categories"] a[aria-current]')?.textContent === 'Daily Life')
    await page.getByRole('link', { name: 'All', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Blog categories"] a[aria-current]')?.textContent === 'All')
    assert.equal(await page.locator('main li').count(), 10)
    await page.getByRole('link', { name: 'Daily Life', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Blog categories"] a[aria-current]')?.textContent === 'Daily Life')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Blog', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Blog categories"] a[aria-current]')?.textContent === 'All')
    assert.equal(await page.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded'), 'false')

    await page.goto(base + '/blog/jenkins-cicd-k3s-part-1', { waitUntil: 'networkidle' })
    assert.ok(await page.locator('article h2[id]').count() > 0, 'Markdown heading anchors missing')
    assert.ok(await page.locator('article pre code').count() > 0, 'Code blocks missing')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true }).click()
    const firstNote = page.locator('details').first()
    assert.equal(await firstNote.evaluate(el => el.open), true)
    await firstNote.locator('summary').click()
    assert.equal(await firstNote.evaluate(el => el.open), false)
    await firstNote.locator('summary').press('Enter')
    assert.equal(await firstNote.evaluate(el => el.open), true)
    for (const note of await page.locator('details').all()) {
      if (!await note.evaluate(el => el.open)) await note.locator('summary').press('Space')
      assert.equal(await note.locator('p').isVisible(), true)
      assert.equal(await note.locator('p').evaluate(el => getComputedStyle(el.parentElement).animationName), 'none')
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Expanded accordion overflows on mobile')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Home', exact: true }).click()
    await page.getByRole('heading', { level: 1, name: /Good code/ }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded'), 'false')
    assert.equal(await page.locator('header nav[aria-label="Main navigation"]').count(), 1)
    assert.deepEqual(errors, [])
    console.log('Site checks passed: all routes at 320–1440px, navigation, animation, project filters, blog search/pagination, image fallback, and article rendering.')
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
