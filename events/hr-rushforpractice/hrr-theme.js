// HR:Rush light/dark switch. Each page sets its default in <html data-theme>; a saved choice wins and is shared across pages.
(() => {
  const root = document.documentElement, KEY = 'hrr-theme';
  try { const saved = localStorage.getItem(KEY); if (saved === 'light' || saved === 'dark') root.dataset.theme = saved; } catch (e) {}
  addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.hrr-theme-toggle{position:fixed;right:22px;bottom:78px;z-index:20;width:44px;height:44px;border-radius:50%;border:1px solid rgba(128,145,170,.45);background:rgba(255,255,255,.92);color:#182238;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 8px 24px rgba(10,20,40,.18);display:grid;place-items:center}[data-theme=dark] .hrr-theme-toggle{background:rgba(13,28,48,.92);color:#ffd166}.hrr-theme-toggle:hover{transform:translateY(-2px)}@media(max-width:750px){.hrr-theme-toggle{right:12px;bottom:64px;width:40px;height:40px;font-size:18px}}';
    document.head.append(style);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hrr-theme-toggle';
    const paint = () => { const dark = root.dataset.theme === 'dark'; button.textContent = dark ? '☀' : '☾'; button.title = dark ? 'Светъл режим' : 'Тъмен режим'; button.setAttribute('aria-label', button.title); };
    button.onclick = () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, root.dataset.theme); } catch (e) {} paint(); };
    paint();
    document.body.append(button);
  });
})();
