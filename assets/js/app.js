/* ==============================
 * Fliaping's Blog — interactions
 * 主题切换 / 导航 / TOC / 阅读进度 / 代码复制
 * ============================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 主题切换 ---------- */
  function initTheme() {
    var toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    var root = document.documentElement;
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function resolved() {
      var set = root.getAttribute('data-theme');
      if (set) return set;
      return systemDark.matches ? 'dark' : 'light';
    }

    function sync() {
      var mode = resolved();
      toggle.setAttribute('data-resolved', mode);
      toggle.setAttribute(
        'aria-label',
        mode === 'dark' ? '切换到浅色模式' : '切换到深色模式'
      );
    }

    toggle.addEventListener('click', function () {
      var next = resolved() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      sync();
    });

    // 未手动选择时跟随系统变化
    var onSystemChange = function () {
      var stored = null;
      try {
        stored = localStorage.getItem('theme');
      } catch (e) {}
      if (!stored) sync();
    };

    if (systemDark.addEventListener) {
      systemDark.addEventListener('change', onSystemChange);
    } else if (systemDark.addListener) {
      systemDark.addListener(onSystemChange);
    }

    sync();
  }

  /* ---------- 移动端导航 ---------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    }

    toggle.addEventListener('click', function () {
      setOpen(nav.getAttribute('data-open') !== 'true');
    });

    // 点击外部关闭
    document.addEventListener('click', function (e) {
      if (nav.getAttribute('data-open') !== 'true') return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    // Esc 关闭并归还焦点
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // 视口变大时重置
    window.matchMedia('(min-width: 861px)').addEventListener?.('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- 头部滚动感应 ---------- */
  function initMasthead() {
    var head = document.querySelector('[data-masthead]');
    if (!head) return;

    var ticking = false;
    function update() {
      head.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 阅读进度 ---------- */
  function initProgress() {
    var bar = document.querySelector('[data-progress]');
    var article = document.querySelector('[data-article-body]');
    if (!bar || !article) return;

    var ticking = false;
    function update() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var scrolled = -rect.top;
      var pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- TOC 高亮当前章节 ---------- */
  function initToc() {
    var toc = document.querySelector('[data-toc]');
    if (!toc) return;

    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var map = {};
    var targets = [];

    links.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      map[id] = link;
      targets.push(el);
    });

    if (!targets.length) return;

    var current = null;
    function setActive(link) {
      if (current === link) return;
      if (current) current.classList.remove('is-active');
      if (link) link.classList.add('is-active');
      current = link;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        // 取当前视口内最靠上的标题
        var visible = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });

        if (visible.length) {
          setActive(map[visible[0].target.id]);
          return;
        }

        // 无可见标题时，回退到最后一个已滚过的
        var passed = targets.filter(function (t) {
          return t.getBoundingClientRect().top < 120;
        });
        if (passed.length) setActive(map[passed[passed.length - 1].id]);
      },
      { rootMargin: '-96px 0px -68% 0px', threshold: 0 }
    );

    targets.forEach(function (t) {
      observer.observe(t);
    });
  }

  /* ---------- 代码块复制 ---------- */
  function initCopy() {
    var blocks = document.querySelectorAll('.prose pre, .prose .highlight');
    if (!blocks.length) return;

    Array.prototype.forEach.call(blocks, function (block) {
      // .highlight 内的 pre 交由外层处理，避免重复
      if (block.tagName === 'PRE' && block.closest('.highlight')) return;
      if (block.parentNode.classList.contains('code-wrap')) return;

      var wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      block.parentNode.insertBefore(wrap, block);
      wrap.appendChild(block);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制代码');
      wrap.appendChild(btn);

      btn.addEventListener('click', function () {
        // 行号表格：只取代码列
        var codeCell = block.querySelector('.lntd:last-child');
        var source = codeCell || block.querySelector('code') || block;
        var text = source.innerText.replace(/\n$/, '');

        var done = function (ok) {
          btn.textContent = ok ? '已复制' : '复制失败';
          setTimeout(function () {
            btn.textContent = '复制';
          }, 1800);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () {
              done(true);
            },
            function () {
              done(false);
            }
          );
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try {
            ok = document.execCommand('copy');
          } catch (e) {}
          document.body.removeChild(ta);
          done(ok);
        }
      });
    });
  }

  /* ---------- 回到顶部 ---------- */
  function initToTop() {
    var btn = document.querySelector('[data-to-top]');
    if (!btn) return;

    var ticking = false;
    function update() {
      btn.setAttribute(
        'data-visible',
        window.scrollY > window.innerHeight * 0.6 ? 'true' : 'false'
      );
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    btn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });

    update();
  }

  /* ---------- 入场动画（错峰） ---------- */
  function initReveal() {
    if (reduceMotion) return;
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (el, i) {
      el.classList.add('rise');
      el.style.animationDelay = Math.min(i * 55, 440) + 'ms';
    });
  }

  /* ---------- 外部链接安全属性 ---------- */
  function initExternalLinks() {
    var links = document.querySelectorAll('.prose a[href^="http"]');
    Array.prototype.forEach.call(links, function (a) {
      if (a.hostname === window.location.hostname) return;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function boot() {
    initTheme();
    initNav();
    initMasthead();
    initProgress();
    initToc();
    initCopy();
    initToTop();
    initReveal();
    initExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
