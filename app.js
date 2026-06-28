let manifest = [];

async function init() {
  try {
    const res = await fetch('manifest.json');
    manifest = await res.json();
  } catch (e) {
    manifest = [];
  }
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const hash = window.location.hash.slice(1) || '/poems';
  const parts = hash.split('/').filter(Boolean);
  const section = parts[0] === 'prose' ? 'prose' : 'poems';
  const slug = parts[1] || null;

  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.section === section);
  });

  if (slug) {
    showPiece(section, slug);
  } else {
    showList(section);
  }
}

function showList(section) {
  const app = document.getElementById('app');
  const pieces = manifest
    .filter(p => p.type === section)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (pieces.length === 0) {
    app.innerHTML = '<p class="empty">Nothing here yet.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'piece-list';

  pieces.forEach(piece => {
    const li = document.createElement('li');

    const a = document.createElement('a');
    a.href = `#/${section}/${piece.slug}`;
    a.textContent = piece.title;

    const date = document.createElement('div');
    date.className = 'date';
    date.textContent = formatDate(piece.date);

    li.appendChild(a);
    li.appendChild(date);
    ul.appendChild(li);
  });

  app.innerHTML = '';
  app.appendChild(ul);
  document.querySelector('main').classList.remove('wide');
}

async function showPiece(section, slug) {
  const app = document.getElementById('app');
  const piece = manifest.find(p => p.slug === slug && p.type === section);

  if (!piece) {
    app.innerHTML = '<p class="empty">Not found.</p>';
    return;
  }

  let text = '';
  try {
    const res = await fetch(piece.file);
    text = await res.text();
  } catch (e) {
    app.innerHTML = '<p class="empty">Could not load piece.</p>';
    return;
  }

  const header = document.createElement('div');
  header.className = 'piece-header';

  const title = document.createElement('h1');
  title.className = 'piece-title';
  title.textContent = piece.title;

  const meta = document.createElement('div');
  meta.className = 'piece-meta';
  meta.textContent = formatDate(piece.date);

  header.appendChild(title);
  header.appendChild(meta);

  const body = document.createElement('div');
  body.className = section === 'poems' ? 'piece-body poem' : 'piece-body';

  if (section === 'poems') {
    body.innerHTML = renderPoem(text);
  } else {
    body.innerHTML = marked.parse(text);
  }

  app.innerHTML = '';
  app.appendChild(header);
  app.appendChild(body);
  document.querySelector('main').classList.toggle('wide', !!piece.wide);
  window.scrollTo(0, 0);
}

function renderPoem(text) {
  const stanzas = text.trim().split(/\n{2,}/);
  return stanzas
    .map(stanza => {
      const trimmed = stanza.trim();
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
        const inner = trimmed.slice(1, -1);
        const content = inner.split('\n').map(l => escapeHtml(l.trim())).join(' ');
        return `<p><em>${content}</em></p>`;
      }
      const lines = stanza.split('\n').map(l => {
        if (l.startsWith('\t')) return `<span class="indented">${escapeHtml(l.slice(1))}</span>`;
        return escapeHtml(l);
      }).join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

init();
