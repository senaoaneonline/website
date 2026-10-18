(() => {
  if (document.getElementById('senaoane-site-nav')) return;

  const links = [
    ['Home', 'https://senaoanesoweto.webflow.io/'],
    ['News', 'Senaoane-News-Page.html'],
    ['Notice Board', 'Senaoane-Notice-Board.html'],
    ['Events', 'Senaoane-Events-Page.html'],
    ['Community', 'Senaoane-Community-Hub-Events-Jobs-Tips.html'],
    ['Resources', 'Senaoane-Resource-Hub.html'],
    ['Forum', 'forum.html'],
    ['Business', 'senaoane-business-bizzybee2.html']
  ];

  const style = document.createElement('style');
  style.textContent = `
    :root { --senaoane-nav-height: 60px; }
    #senaoane-site-nav { position: sticky; top: 0; z-index: 2147483000; width: 100%; background: #0a0a0a; color: #fff; border-bottom: 3px solid #e30613; font: 600 14px/1.2 Inter, Arial, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.18); }
    #senaoane-site-nav * { box-sizing: border-box; }
    #senaoane-site-nav .sna-inner { max-width: 1280px; min-height: var(--senaoane-nav-height); margin: auto; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    #senaoane-site-nav .sna-brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-weight: 900; letter-spacing: .04em; white-space: nowrap; }
    #senaoane-site-nav .sna-mark { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: #e30613; color: #fff; font-size: 13px; }
    #senaoane-site-nav .sna-links { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
    #senaoane-site-nav .sna-links a { color: #eee; text-decoration: none; padding: 10px 11px; border-radius: 999px; white-space: nowrap; transition: background .15s ease, color .15s ease; }
    #senaoane-site-nav .sna-links a:hover, #senaoane-site-nav .sna-links a[aria-current="page"] { background: #e30613; color: white; }
    #senaoane-site-nav .sna-toggle { display: none; border: 1px solid #ffffff55; border-radius: 999px; padding: 9px 13px; background: transparent; color: #fff; font: inherit; cursor: pointer; }
    body:has(#senaoane-site-nav) .sticky, body:has(#senaoane-site-nav) [style*="position:sticky"], body:has(#senaoane-site-nav) [style*="position: sticky"] { top: var(--senaoane-nav-height) !important; }
    @media (max-width: 850px) {
      :root { --senaoane-nav-height: 56px; }
      #senaoane-site-nav .sna-inner { min-height: var(--senaoane-nav-height); padding: 7px 12px; }
      #senaoane-site-nav .sna-toggle { display: inline-flex; align-items: center; gap: 7px; }
      #senaoane-site-nav .sna-links { display: none; position: absolute; top: 100%; left: 0; right: 0; padding: 8px 12px 14px; background: #0a0a0a; border-bottom: 3px solid #e30613; box-shadow: 0 10px 18px rgba(0,0,0,.2); flex-direction: column; align-items: stretch; }
      #senaoane-site-nav .sna-links.sna-open { display: flex; }
      #senaoane-site-nav .sna-links a { padding: 12px 14px; border-radius: 10px; }
    }
    @media (prefers-reduced-motion: reduce) { #senaoane-site-nav *, #senaoane-site-nav *::before, #senaoane-site-nav *::after { transition: none !important; } }
  `;
  document.head.appendChild(style);

  const nav = document.createElement('header');
  nav.id = 'senaoane-site-nav';
  nav.innerHTML = `
    <div class="sna-inner">
      <a class="sna-brand" href="https://senaoanesoweto.webflow.io/" aria-label="Senaoane Online home"><span class="sna-mark">SN</span><span>SENAOANE ONLINE</span></a>
      <button class="sna-toggle" type="button" aria-expanded="false" aria-controls="sna-navigation"><span aria-hidden="true">☰</span><span>Menu</span></button>
      <nav class="sna-links" id="sna-navigation" aria-label="Main navigation"></nav>
    </div>`;

  const currentFile = location.pathname.split('/').pop() || 'index.html';
  const menu = nav.querySelector('.sna-links');
  links.forEach(([label, href]) => {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = /^https?:\/\//i.test(href) ? href : `./${href}`;
    if (currentFile.toLowerCase() === href.toLowerCase()) link.setAttribute('aria-current', 'page');
    menu.appendChild(link);
  });

  const toggle = nav.querySelector('.sna-toggle');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('sna-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '✕' : '☰';
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menu.classList.remove('sna-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('span').textContent = '☰';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      menu.classList.remove('sna-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('span').textContent = '☰';
    }
  });
  document.body.insertBefore(nav, document.body.firstChild);
})();
