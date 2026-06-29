#!/usr/bin/env node
/*
 * Dependency-free content-injection fixture runner.
 *
 * The extension intentionally has no npm toolchain. This runner implements the
 * small DOM subset needed by site injectors so checked-in real-page HTML
 * fixtures can catch selector/idempotence regressions in CI or local shells.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SPEC = path.join(ROOT, "tests", "content-fixtures.json");
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

class MiniText {
    constructor(text) {
        this.nodeType = 3;
        this.text = text;
        this.parentElement = null;
    }
    get textContent() { return this.text; }
}

class MiniElement {
    constructor(tagName, attrs = {}) {
        this.nodeType = 1;
        this.tagName = tagName.toLowerCase();
        this.attributes = { ...attrs };
        this.children = [];
        this.parentElement = null;
        this.shadowRoot = null;
        this.style = { cssText: "" };
        this.listeners = {};
    }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    remove() {
        if (!this.parentElement) return;
        const siblings = this.parentElement.children;
        const idx = siblings.indexOf(this);
        if (idx >= 0) siblings.splice(idx, 1);
        this.parentElement = null;
    }

    getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    removeAttribute(name) {
        delete this.attributes[name];
    }

    get textContent() {
        return this.children.map((child) => child.textContent || "").join("");
    }

    set textContent(value) {
        this.children = [new MiniText(String(value))];
        this.children[0].parentElement = this;
    }

    addEventListener(type, fn) {
        (this.listeners[type] ||= []).push(fn);
    }

    click() {
        const event = { preventDefault() {}, stopPropagation() {} };
        for (const fn of this.listeners.click || []) fn(event);
    }

    insertAdjacentElement(position, element) {
        if (position !== "afterend") throw new Error(`Unsupported insertAdjacentElement position: ${position}`);
        if (!this.parentElement) return null;
        const siblings = this.parentElement.children;
        const idx = siblings.indexOf(this);
        element.parentElement = this.parentElement;
        siblings.splice(idx + 1, 0, element);
        return element;
    }

    closest(selector) {
        let current = this;
        while (current) {
            if (current.matches(selector)) return current;
            current = current.parentElement;
        }
        return null;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const groups = splitSelectorList(selector);
        const results = [];
        for (const el of walkElements(this)) {
            if (el === this) continue;
            if (groups.some((group) => matchesComplexSelector(el, group))) results.push(el);
        }
        return results;
    }

    matches(selector) {
        return splitSelectorList(selector).some((group) => matchesComplexSelector(this, group));
    }
}

class MiniDocument extends MiniElement {
    constructor() {
        super("#document", {});
        this.documentElement = null;
        this.body = null;
    }

    createElement(tagName) {
        return new MiniElement(tagName, {});
    }
}

function parseHtml(html) {
    const doc = new MiniDocument();
    const stack = [doc];
    const tokenRe = /<!--([\s\S]*?)-->|<!doctype[^>]*>|<\/([A-Za-z0-9-]+)\s*>|<([A-Za-z0-9-]+)([^>]*)>|([^<]+)/gi;
    let match;
    while ((match = tokenRe.exec(html))) {
        if (match[2]) {
            const closing = match[2].toLowerCase();
            while (stack.length > 1) {
                const top = stack.pop();
                if (top.tagName === closing) break;
            }
            continue;
        }
        if (match[3]) {
            const tag = match[3].toLowerCase();
            const rawAttrs = match[4] || "";
            const el = new MiniElement(tag, parseAttrs(rawAttrs));
            stack[stack.length - 1].appendChild(el);
            if (tag === "html") doc.documentElement = el;
            if (tag === "body") doc.body = el;
            if (!VOID_TAGS.has(tag) && !/\/\s*$/.test(rawAttrs)) stack.push(el);
            continue;
        }
        if (match[5] && match[5].trim()) {
            stack[stack.length - 1].appendChild(new MiniText(decodeEntities(match[5])));
        }
    }
    doc.documentElement ||= doc.children.find((child) => child.tagName === "html") || doc;
    doc.body ||= doc.querySelector("body") || doc;
    return doc;
}

function parseAttrs(raw) {
    const attrs = {};
    const attrRe = /([:@A-Za-z0-9_.-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match;
    while ((match = attrRe.exec(raw))) {
        attrs[match[1]] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
    }
    return attrs;
}

function decodeEntities(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

function* walkElements(root) {
    for (const child of root.children || []) {
        if (child.nodeType !== 1) continue;
        yield child;
        yield* walkElements(child);
    }
}

function splitSelectorList(selector) {
    return splitOutside(selector, ",").map((part) => parseComplexSelector(part.trim())).filter(Boolean);
}

function parseComplexSelector(selector) {
    const tokens = [];
    let buf = "";
    let inBracket = 0;
    let quote = null;
    let pendingCombinator = "descendant";
    const flush = () => {
        const part = buf.trim();
        if (part) tokens.push({ combinator: tokens.length ? pendingCombinator : "self", simple: parseSimpleSelector(part) });
        buf = "";
        pendingCombinator = "descendant";
    };
    for (let i = 0; i < selector.length; i++) {
        const ch = selector[i];
        if (quote) {
            buf += ch;
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
        if (ch === "[") inBracket++;
        if (ch === "]") inBracket--;
        if (!inBracket && ch === ">") {
            flush();
            pendingCombinator = "child";
            continue;
        }
        if (!inBracket && /\s/.test(ch)) {
            flush();
            continue;
        }
        buf += ch;
    }
    flush();
    return tokens;
}

function parseSimpleSelector(part) {
    const nth = part.match(/:nth-child\((\d+)\)$/i);
    const nthChild = nth ? Number(nth[1]) : null;
    if (nth) part = part.slice(0, nth.index);

    const attrMatchers = [];
    part = part.replace(/\[\s*([:@A-Za-z0-9_.-]+)\s*(?:(\*=|=)\s*("([^"]*)"|'([^']*)'|([^\]\s]+))\s*(i)?\s*)?\]/gi,
        (_, name, op, _raw, dq, sq, bare, insensitive) => {
            attrMatchers.push({ name, op: op || "exists", value: dq ?? sq ?? bare ?? "", insensitive: !!insensitive });
            return "";
        });

    let tag = null;
    let id = null;
    const classes = [];
    const idRe = /#([A-Za-z0-9_-]+)/g;
    part = part.replace(idRe, (_, value) => { id = value; return ""; });
    const classRe = /\.([A-Za-z0-9_-]+)/g;
    part = part.replace(classRe, (_, cls) => { classes.push(cls); return ""; });
    const trimmed = part.trim();
    if (trimmed && trimmed !== "*") tag = trimmed.toLowerCase();
    return { tag, id, classes, attrMatchers, nthChild };
}

function matchesComplexSelector(el, tokens) {
    if (!tokens.length) return false;
    return matchToken(el, tokens, tokens.length - 1);
}

function matchToken(el, tokens, idx) {
    if (!matchesSimple(el, tokens[idx].simple)) return false;
    if (idx === 0) return true;
    const combinator = tokens[idx].combinator;
    if (combinator === "child") {
        return !!el.parentElement && matchToken(el.parentElement, tokens, idx - 1);
    }
    let parent = el.parentElement;
    while (parent) {
        if (matchToken(parent, tokens, idx - 1)) return true;
        parent = parent.parentElement;
    }
    return false;
}

function matchesSimple(el, simple) {
    if (!(el instanceof MiniElement)) return false;
    if (simple.tag && el.tagName !== simple.tag) return false;
    if (simple.id && el.getAttribute("id") !== simple.id) return false;
    if (simple.nthChild !== null) {
        if (!el.parentElement) return false;
        const elementSiblings = el.parentElement.children.filter((child) => child.nodeType === 1);
        if (elementSiblings.indexOf(el) + 1 !== simple.nthChild) return false;
    }
    const classAttr = el.getAttribute("class") || "";
    const classSet = new Set(classAttr.split(/\s+/).filter(Boolean));
    for (const cls of simple.classes) if (!classSet.has(cls)) return false;
    for (const matcher of simple.attrMatchers) {
        const attr = el.getAttribute(matcher.name);
        if (matcher.op === "exists") {
            if (attr === null) return false;
            continue;
        }
        if (attr === null) return false;
        const actual = matcher.insensitive ? attr.toLowerCase() : attr;
        const expected = matcher.insensitive ? matcher.value.toLowerCase() : matcher.value;
        if (matcher.op === "=" && actual !== expected) return false;
        if (matcher.op === "*=" && !actual.includes(expected)) return false;
    }
    return true;
}

function splitOutside(input, sep) {
    const parts = [];
    let buf = "";
    let inBracket = 0;
    let quote = null;
    for (const ch of input) {
        if (quote) {
            buf += ch;
            if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
        if (ch === "[") inBracket++;
        if (ch === "]") inBracket--;
        if (!inBracket && ch === sep) {
            parts.push(buf);
            buf = "";
        } else {
            buf += ch;
        }
    }
    parts.push(buf);
    return parts;
}

function loadVX() {
    const commonPath = path.join(ROOT, "src", "common.js");
    const sitesPath = path.join(ROOT, "src", "sites.js");
    delete require.cache[require.resolve(commonPath)];
    delete require.cache[require.resolve(sitesPath)];
    const VX = require(commonPath);
    VX.sites.length = 0;
    VX.DEFAULT_SETTINGS.sites = {};
    globalThis.VX = VX;
    require(sitesPath);
    return VX;
}

function runFixture(spec, VX) {
    const fixturePath = path.join(ROOT, spec.fixture);
    const html = fs.readFileSync(fixturePath, "utf8");
    const document = parseHtml(html);
    const copied = [];

    global.document = document;
    global.location = new URL(spec.url);

    const site = VX.sites.find((candidate) => candidate.key === spec.site);
    if (!site) throw new Error(`${spec.name}: site not registered: ${spec.site}`);

    const ctx = {
        strings: VX.getStrings("en"),
        makeBtn(label, onClick) {
            const button = document.createElement("button");
            button.textContent = label;
            button.style.cssText = "";
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                onClick();
            });
            return button;
        },
        copyUrl(url) {
            copied.push(VX.convert(url));
        },
        debugBuildId: VX.DEBUG_BUILD_ID,
        convert: (url) => VX.convert(url),
        debugConvert: (url) => VX.debugConvertDetails(url),
        debugConvertSummary: (url) => VX.debugConvertDetails(url).summary,
        toast() {}
    };

    site.inject(ctx);
    const firstCount = document.querySelectorAll(spec.buttonSelector).length;
    site.inject(ctx);
    const secondCount = document.querySelectorAll(spec.buttonSelector).length;
    const scopes = spec.scopeSelector ? document.querySelectorAll(spec.scopeSelector) : [];

    const buttons = document.querySelectorAll(spec.buttonSelector);
    buttons.forEach((button) => button.click());

    const failures = [];
    if (firstCount !== spec.expectedButtons) failures.push(`expected ${spec.expectedButtons} buttons after first inject, got ${firstCount}`);
    if (secondCount !== firstCount) failures.push(`inject is not idempotent: first=${firstCount}, second=${secondCount}`);
    if (spec.scopeSelector && scopes.length !== spec.expectedButtons) failures.push(`expected ${spec.expectedButtons} scopes (${spec.scopeSelector}), got ${scopes.length}`);
    if (JSON.stringify(copied) !== JSON.stringify(spec.expectedCopies)) {
        failures.push(`copied URLs mismatch\n  expected: ${JSON.stringify(spec.expectedCopies)}\n  actual:   ${JSON.stringify(copied)}`);
    }
    if (spec.expectedPreviousSiblingAriaLabelPattern) {
        const pattern = new RegExp(spec.expectedPreviousSiblingAriaLabelPattern);
        buttons.forEach((button, index) => {
            const siblings = button.parentElement ? button.parentElement.children : [];
            const buttonIndex = siblings.indexOf(button);
            const previous = buttonIndex > 0 ? siblings[buttonIndex - 1] : null;
            const label = previous && previous.getAttribute("aria-label");
            if (!pattern.test(label || "")) {
                failures.push(`button ${index + 1} previous sibling aria-label mismatch: expected /${spec.expectedPreviousSiblingAriaLabelPattern}/, got ${JSON.stringify(label)}`);
            }
        });
    }
    if (spec.expectedPreviousSiblingContainsAriaLabelPattern) {
        const pattern = new RegExp(spec.expectedPreviousSiblingContainsAriaLabelPattern);
        buttons.forEach((button, index) => {
            const siblings = button.parentElement ? button.parentElement.children : [];
            const buttonIndex = siblings.indexOf(button);
            const previous = buttonIndex > 0 ? siblings[buttonIndex - 1] : null;
            const labels = previous ? previous.querySelectorAll("[aria-label]").map((el) => el.getAttribute("aria-label") || "") : [];
            if (!labels.some((label) => pattern.test(label))) {
                failures.push(`button ${index + 1} previous sibling descendant aria-label mismatch: expected /${spec.expectedPreviousSiblingContainsAriaLabelPattern}/, got ${JSON.stringify(labels)}`);
            }
        });
    }
    if (spec.expectedButtonStyleIncludes) {
        buttons.forEach((button, index) => {
            const styleText = button.style && button.style.cssText || "";
            for (const expected of spec.expectedButtonStyleIncludes) {
                if (!styleText.includes(expected)) {
                    failures.push(`button ${index + 1} style missing ${JSON.stringify(expected)} in ${JSON.stringify(styleText)}`);
                }
            }
        });
    }

    return { name: spec.name, failures };
}

function main() {
    const specPath = path.resolve(process.argv[2] || DEFAULT_SPEC);
    const specs = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const VX = loadVX();
    let failed = 0;

    for (const spec of specs) {
        const result = runFixture(spec, VX);
        if (result.failures.length) {
            failed++;
            console.error(`FAIL ${result.name}`);
            result.failures.forEach((failure) => console.error(`  - ${failure}`));
        } else {
            console.log(`PASS ${result.name}`);
        }
    }

    if (failed) {
        console.error(`${failed}/${specs.length} content fixture test(s) failed`);
        process.exit(1);
    }
    console.log(`${specs.length}/${specs.length} content fixture test(s) passed`);
}

main();
