/* =========================================================
   Carlos Tau — Personal Portfolio
   Small, dependency-free interactions.
   ========================================================= */

(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Clock (Asia/Shanghai)
     --------------------------------------------------------- */
  const heroClock = $('#local-clock');
  const footerClock = $('#footer-clock');

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const shortTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const updateClock = () => {
    const now = new Date();
    if (heroClock) {
      const value = timeFormatter.format(now);
      heroClock.textContent = value;
      heroClock.setAttribute('datetime', now.toISOString());
    }
    if (footerClock) {
      const value = shortTimeFormatter.format(now);
      footerClock.textContent = value;
      footerClock.setAttribute('datetime', now.toISOString());
    }
  };

  updateClock();
  window.setInterval(updateClock, 1000);

  /* ---------------------------------------------------------
     Header, scroll progress, active navigation
     --------------------------------------------------------- */
  const header = $('#site-header');
  const progressBar = $('.scroll-progress span');
  const sections = ['about', 'agents', 'projects']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$('[data-nav]');

  let scrollTicking = false;

  const updateScrollUI = () => {
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle('is-scrolled', top > 10);

    if (progressBar) {
      const progress = max > 0 ? Math.min(top / max, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    // Use a reading line at 38% of the viewport to choose the active chapter.
    const marker = top + window.innerHeight * 0.38;
    let activeId = '';
    sections.forEach((section) => {
      if (section.offsetTop <= marker) activeId = section.id;
    });

    // Once the closing section fills the lower viewport, none of 01–03 is active.
    const outro = document.getElementById('outro');
    if (outro && top + window.innerHeight * 0.7 > outro.offsetTop) activeId = '';

    navLinks.forEach((link) => {
      const isActive = link.dataset.nav === activeId;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    scrollTicking = false;
  };

  const onScroll = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  };

  updateScrollUI();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const menuLabel = $('.menu-label');
  const mobileMenuLinks = $$('a', mobileMenu || document.createElement('div'));
  let lastFocusedElement = null;

  const setMenu = (open, restoreFocus = false) => {
    if (!menuToggle || !mobileMenu) return;

    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));

    if (menuLabel) menuLabel.textContent = open ? '关闭' : '菜单';

    if (open) {
      lastFocusedElement = document.activeElement;
    } else if (restoreFocus) {
      (lastFocusedElement instanceof HTMLElement ? lastFocusedElement : menuToggle).focus({
        preventScroll: true
      });
    }
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('menu-open');
    setMenu(!isOpen);
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false, true);
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 861px)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches && document.body.classList.contains('menu-open')) {
      setMenu(false);
    }
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealItems = $$('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -2% 0px', threshold: 0.05 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------------------------------------------------------
     Agent card spotlight
     --------------------------------------------------------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    $$('.agent-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--spot-x', '50%');
        card.style.setProperty('--spot-y', '0%');
      });
    });
  }

  /* ---------------------------------------------------------
     Project detail dialog
     --------------------------------------------------------- */
  const projectData = {
    portfolio: {
      index: 'PROJECT 01 / 2026',
      en: 'PERSONAL PORTFOLIO',
      title: '个人作品集网站',
      intro:
        '一个从零开始的个人网站，也是一次完整的 Agent 协作实验：从信息架构、视觉方向到代码实现，它既是一件作品，也是这件作品的说明书。',
      meta: [
        ['类型', '课程作业 / 个人网站'],
        ['角色', '创意 · 设计 · 前端'],
        ['Agent', 'DeepSeek Harness'],
        ['状态', '已完成']
      ],
      sections: [
        {
          title: 'THE BRIEF / 起点',
          body:
            '课程要求用网站介绍个人信息、使用过的 Agent，以及用 Agent 完成的项目。难点不在于“放什么”，而在于怎样让三个部分像同一个人说的话，而不是三块彼此无关的拼贴。'
        },
        {
          title: 'HOW WE MADE IT / 过程',
          list: [
            '先把需求拆成清晰的信息层级：关于我、Agent、项目。',
            '确定视觉方向：纸张质感、编辑感排版、荧光绿与橙色的点缀，让技术主题保留人的温度。',
            '与 Agent 一起写 HTML、CSS 和 JavaScript，逐轮调整字号、间距、层级与响应式断点。',
            '在真实浏览器里检查桌面和手机视图，修掉溢出、对比度和交互细节的问题。'
          ]
        },
        {
          title: 'THE RESULT / 结果',
          note:
            '一个零依赖、双击即可打开的单页网站；也是一次完整经历“提出目标 → 执行 → 检查 → 迭代”的 Agent 协作流程。'
        }
      ],
      extra: null
    },
    playbook: {
      index: 'PROJECT 02 / 2026',
      en: 'AGENT PLAYBOOK',
      title: 'Agent 协作方法卡',
      intro:
        '把“怎样和 Agent 说清楚一件事”整理成六张可以反复使用的小卡片。它们不是万能提示词，而是一套在每次对话前快速自检的思考顺序。',
      meta: [
        ['类型', '信息设计 / 方法整理'],
        ['角色', '概念 · 文案 · 设计'],
        ['Agent', 'DeepSeek Harness'],
        ['状态', '已完成']
      ],
      sections: [
        {
          title: 'THE PROBLEM / 问题',
          body:
            '和 Agent 协作时，最浪费时间的往往不是执行，而是返工。答案不够好，通常是因为背景、目标或完成标准没有被交代清楚。'
        },
        {
          title: 'SIX CARDS / 六张卡',
          list: [
            '给上下文：你是谁、为谁做、现在已经有什么。',
            '说目标：交付物是什么，成功的状态长什么样。',
            '划边界：必须保留什么、绝对不能做什么。',
            '定格式：文件类型、结构、篇幅、语言与语气。',
            '要验证：运行它、检查它，并明确报告失败。',
            '保留判断：事实核查、个人声音和最终取舍仍然属于我。'
          ]
        },
        {
          title: 'THE RESULT / 结果',
          note:
            '这套方法卡直接指导了本网站的开发。完整版整理成一份可下载的 Markdown 文档，方便贴在笔记软件里随时查看。'
        }
      ],
      extra: {
        label: '下载方法卡',
        href: 'agent-playbook.md'
      }
    },
    signal: {
      index: 'PROJECT 03 / 2026',
      en: 'SIGNAL / VISUAL STUDY',
      title: 'Signal 动态视觉系统',
      intro:
        '一个关于“人机协作信号”的视觉实验：用轨道、网格、等宽字体和有限的动效，把看不见的沟通过程变成可以感知的图形。',
      meta: [
        ['类型', '视觉实验 / 创意编程'],
        ['角色', '视觉 · 动效 · 前端'],
        ['Agent', 'DeepSeek Harness'],
        ['状态', '已完成']
      ],
      sections: [
        {
          title: 'THE IDEA / 想法',
          body:
            '页面需要一点科技感，但不能像通用的 AI 模板：不要发光渐变堆满全屏，不要无意义的粒子。希望它更像一本被工程师做过标注的设计杂志。'
        },
        {
          title: 'THE SYSTEM / 系统',
          list: [
            '以纸张底色和黑色网格作为稳定的“人”的基底。',
            '用轨道、节点和旋转文字表示 Agent 的介入与循环。',
            '让荧光绿承担注意力，让橙色承担动作，让淡紫色承担实验性。',
            '所有动画都尊重 prefers-reduced-motion，不以动效掩盖内容。'
          ]
        },
        {
          title: 'THE RESULT / 结果',
          note:
            '一套贯穿首屏、Agent 卡片与项目封面的视觉语言。它不依赖图片素材，完全由 HTML、CSS 与 SVG 构成，因此加载快，也容易继续生长。'
        }
      ],
      extra: null
    }
  };

  const dialog = $('#project-dialog');
  const dialogIndex = $('#dialog-index');
  const dialogEn = $('#dialog-en');
  const dialogTitle = $('#dialog-title');
  const dialogIntro = $('#dialog-intro');
  const dialogMeta = $('#dialog-meta');
  const dialogSections = $('#dialog-sections');
  const dialogExtra = $('#dialog-extra');
  const dialogClose = $('.dialog-close');
  const dialogReturn = $('.dialog-return');
  let dialogTrigger = null;

  const openDialog = (projectKey, trigger) => {
    if (!dialog) return;
    const project = projectData[projectKey];
    if (!project) return;

    dialogTrigger = trigger || null;

    dialogIndex.textContent = project.index;
    dialogEn.textContent = project.en;
    dialogTitle.textContent = project.title;
    dialogIntro.textContent = project.intro;

    dialogMeta.replaceChildren();
    project.meta.forEach(([label, value]) => {
      const item = document.createElement('div');
      const dt = document.createElement('span');
      const dd = document.createElement('strong');
      dt.textContent = label;
      dd.textContent = value;
      item.append(dt, dd);
      dialogMeta.append(item);
    });

    dialogSections.replaceChildren();
    project.sections.forEach((section) => {
      const article = document.createElement('section');
      article.className = 'dialog-section';

      const heading = document.createElement('h3');
      heading.textContent = section.title;
      article.append(heading);

      if (section.body) {
        const paragraph = document.createElement('p');
        paragraph.textContent = section.body;
        article.append(paragraph);
      }

      if (section.list) {
        const list = document.createElement('ul');
        section.list.forEach((text) => {
          const item = document.createElement('li');
          item.textContent = text;
          list.append(item);
        });
        article.append(list);
      }

      if (section.note) {
        const note = document.createElement('p');
        note.className = 'result-note';
        note.textContent = section.note;
        article.append(note);
      }

      dialogSections.append(article);
    });

    if (project.extra) {
      dialogExtra.hidden = false;
      dialogExtra.textContent = project.extra.label;
      dialogExtra.setAttribute('href', project.extra.href);
      dialogExtra.setAttribute('download', '');
    } else {
      dialogExtra.hidden = true;
      dialogExtra.removeAttribute('href');
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    document.body.classList.add('modal-open');
    $('.dialog-body', dialog)?.scrollTo({ top: 0 });
    dialogClose?.focus({ preventScroll: true });
  };

  const closeDialog = () => {
    if (!dialog || !dialog.open) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
      document.body.classList.remove('modal-open');
    }
  };

  $$('.project-open').forEach((button) => {
    button.addEventListener('click', () => {
      openDialog(button.dataset.project, button);
    });
  });

  dialogClose?.addEventListener('click', closeDialog);
  dialogReturn?.addEventListener('click', closeDialog);

  dialog?.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (dialogTrigger) {
      dialogTrigger.focus({ preventScroll: true });
      dialogTrigger = null;
    }
  });

  dialog?.addEventListener('click', (event) => {
    if (event.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!isInside) closeDialog();
  });

})();
