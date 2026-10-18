(() => {
  'use strict';

  const USERS_KEY = 'senaoane_users';
  const CURRENT_USER_KEY = 'senaoane_current_user';
  const POSTS_KEY = 'senaoane_posts';
  const DB_NAME = 'senaoane-community-forum';
  const STORE_NAME = 'posts';

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function makeId() {
    return window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Forum request failed.'));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Forum storage failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('Forum storage was interrupted.'));
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('This browser does not support local forum storage.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open forum storage.'));
      request.onblocked = () => reject(new Error('Forum storage is busy in another tab.'));
    });
  }

  function categoryKey(value) {
    const text = String(value || 'GENERAL').toUpperCase();
    for (const key of ['SPORTS', 'COMMUNITY', 'JOBS', 'EVENTS', 'NEWS']) {
      if (text.includes(key)) return key;
    }
    return 'GENERAL';
  }

  function categoryLabel(value) {
    const labels = {
      GENERAL: 'General',
      SPORTS: 'Sports',
      COMMUNITY: 'Community',
      JOBS: 'Jobs',
      EVENTS: 'Events',
      NEWS: 'News'
    };
    return labels[categoryKey(value)] || 'General';
  }

  const DB = {
    saveUser(input) {
      const fullName = String(input.full_name || '').trim().replace(/\s+/g, ' ');
      const phone = String(input.phone || '').trim();
      const phoneDigits = phone.replace(/\D/g, '');
      const area = String(input.area || '').trim().replace(/\s+/g, ' ');
      const interest = String(input.interest || '').trim();
      if (fullName.length < 2) throw new Error('Please enter your name.');
      if (phoneDigits.length < 7) throw new Error('Please enter a valid phone number.');
      if (!area) throw new Error('Please enter your area.');
      if (!interest) throw new Error('Please choose an interest.');

      const users = readJson(USERS_KEY, []);
      const previous = Array.isArray(users) ? users.find(item => item.phone_digits === phoneDigits) : null;
      const user = {
        id: previous ? previous.id : makeId(),
        full_name: fullName,
        phone,
        phone_digits: phoneDigits,
        area,
        interest,
        created_at: previous ? previous.created_at : new Date().toISOString()
      };
      const nextUsers = Array.isArray(users) ? users.filter(item => item.phone_digits !== phoneDigits) : [];
      nextUsers.unshift(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers.slice(0, 50)));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    },

    currentUser() {
      const user = readJson(CURRENT_USER_KEY, null);
      return user && user.id && user.full_name ? user : null;
    },

    logout() {
      localStorage.removeItem(CURRENT_USER_KEY);
    },

    async getPosts() {
      const fallback = readJson(POSTS_KEY, []);
      try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const done = transactionDone(tx);
        const rows = await requestResult(tx.objectStore(STORE_NAME).getAll());
        await done;
        db.close();
        return Array.isArray(rows) && rows.length ? rows : (Array.isArray(fallback) ? fallback : []);
      } catch (_) {
        return Array.isArray(fallback) ? fallback : [];
      }
    },

    async savePost(input) {
      const user = this.currentUser();
      if (!user) throw new Error('Create a forum profile before posting.');
      const post = {
        id: makeId(),
        category: categoryKey(input.category),
        title: String(input.title || '').trim(),
        description: String(input.description || '').trim(),
        youtube_id: String(input.youtube_id || '').trim(),
        image_data: String(input.image_data || ''),
        author_id: user.id,
        user_name: user.full_name,
        area: user.area,
        created_at: new Date().toISOString(),
        comments: []
      };
      if (!post.title) throw new Error('Please add a title to your post.');

      try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        tx.objectStore(STORE_NAME).put(post);
        await done;
        db.close();
      } catch (error) {
        const posts = readJson(POSTS_KEY, []);
        if (!Array.isArray(posts)) throw error;
        posts.unshift(post);
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts.slice(0, 100)));
      }
      return post;
    },

    async addComment(postId, body, author) {
      const comment = {
        id: makeId(),
        body: String(body || '').trim(),
        author_name: String(author.full_name || 'Community member'),
        created_at: new Date().toISOString()
      };
      if (!comment.body) throw new Error('Write a reply before submitting.');

      try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        const store = tx.objectStore(STORE_NAME);
        const post = await requestResult(store.get(postId));
        if (!post) {
          tx.abort();
          await done.catch(() => {});
          db.close();
          throw new Error('That post could not be found. Refresh the forum and try again.');
        }
        post.comments = Array.isArray(post.comments) ? post.comments : [];
        post.comments.push(comment);
        store.put(post);
        await done;
        db.close();
        return comment;
      } catch (error) {
        const posts = readJson(POSTS_KEY, []);
        const post = Array.isArray(posts) ? posts.find(item => item.id === postId) : null;
        if (!post) throw error;
        post.comments = Array.isArray(post.comments) ? post.comments : [];
        post.comments.push(comment);
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
        return comment;
      }
    }
  };

  function formatDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return 'Recently';
    return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function addText(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function addMedia(card, post) {
    const media = document.createElement('div');
    media.className = 'post-media';
    if (post.image_data && post.image_data.startsWith('data:image/')) {
      const image = document.createElement('img');
      image.src = post.image_data;
      image.alt = `Image attached to ${post.title || 'community post'}`;
      image.loading = 'lazy';
      media.appendChild(image);
    } else if (post.youtube_id && /^[A-Za-z0-9_-]{11}$/.test(post.youtube_id)) {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(post.youtube_id)}`;
      frame.title = `YouTube video: ${post.title || 'Community post'}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      media.appendChild(frame);
    }
    if (media.childElementCount) card.appendChild(media);
  }

  function addComments(card, post, targetId, filter, authorId) {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const details = document.createElement('details');
    details.className = 'reply-box';
    const summary = document.createElement('summary');
    summary.textContent = `Replies (${comments.length})`;
    details.appendChild(summary);

    const list = document.createElement('div');
    list.className = 'comment-list';
    comments.forEach(comment => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      addText(item, 'strong', 'comment-author', comment.author_name || 'Community member');
      addText(item, 'span', 'comment-date', formatDate(comment.created_at));
      addText(item, 'p', 'comment-body', comment.body || '');
      list.appendChild(item);
    });
    if (comments.length) details.appendChild(list);

    const user = DB.currentUser();
    if (!user) {
      const link = document.createElement('a');
      link.className = 'reply-link';
      link.href = 'register.html?next=forum.html';
      link.textContent = 'Create a profile to reply';
      details.appendChild(link);
    } else {
      const form = document.createElement('form');
      form.className = 'reply-form';
      const textarea = document.createElement('textarea');
      textarea.className = 'input';
      textarea.name = 'reply';
      textarea.rows = 2;
      textarea.maxLength = 1000;
      textarea.required = true;
      textarea.placeholder = 'Write a helpful reply…';
      const button = document.createElement('button');
      button.className = 'btn btn-dark';
      button.type = 'submit';
      button.textContent = 'Post reply';
      form.append(textarea, button);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        button.disabled = true;
        try {
          await DB.addComment(post.id, textarea.value, user);
          await window.renderPosts(targetId, filter, authorId);
        } catch (error) {
          window.showForumMessage('forum-message', error.message || 'Could not save your reply.', 'error');
          button.disabled = false;
        }
      });
      details.appendChild(form);
    }
    card.appendChild(details);
  }

  function buildPostCard(post, targetId, filter, authorId) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const top = document.createElement('div');
    top.className = 'post-card-top';
    addText(top, 'span', 'category-badge', categoryLabel(post.category));
    addText(top, 'time', 'post-date', formatDate(post.created_at || post.createdAt));
    card.appendChild(top);

    addText(card, 'h2', 'post-title', post.title || 'Community post');
    const author = [post.user_name || post.author_name || 'Community member', post.area].filter(Boolean).join(' · ');
    addText(card, 'p', 'post-author', author);
    if (post.description) addText(card, 'p', 'post-description', post.description);
    addMedia(card, post);
    addComments(card, post, targetId, filter, authorId);
    return card;
  }

  async function renderPosts(targetId, filter = 'ALL', authorId = null) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.replaceChildren();
    addText(container, 'p', 'loading-note', 'Loading posts…');

    try {
      const posts = await DB.getPosts();
      const category = String(filter || 'ALL').toUpperCase();
      document.querySelectorAll('.filter-bar [data-filter]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.filter === category));
      });
      const visible = posts
        .filter(post => !authorId || post.author_id === authorId)
        .filter(post => category === 'ALL' || categoryKey(post.category) === category)
        .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
      container.replaceChildren();

      const counter = document.getElementById('post-count');
      if (counter && targetId === 'forum-feed') counter.textContent = `${visible.length} ${visible.length === 1 ? 'post' : 'posts'}`;

      if (!visible.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        addText(empty, 'h2', '', authorId ? 'No posts from this profile yet' : 'No posts here yet');
        addText(empty, 'p', '', authorId ? 'Your posts will appear here after you publish.' : 'Start a discussion with a title, a short message, or optional media.');
        const link = document.createElement('a');
        link.className = 'btn btn-red';
        link.href = authorId ? 'forum.html' : 'upload.html';
        link.textContent = authorId ? 'Back to forum' : 'Create the first post';
        empty.appendChild(link);
        container.appendChild(empty);
        return;
      }
      visible.forEach(post => container.appendChild(buildPostCard(post, targetId, category, authorId)));
    } catch (_) {
      container.replaceChildren();
      addText(container, 'p', 'error-note', 'The forum could not load posts in this browser. Refresh the page and try again.');
    }
  }

  function showForumMessage(id, text, type = 'info') {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = text;
    element.className = `form-message ${type === 'error' ? 'is-error' : 'is-success'}`;
    element.hidden = false;
  }

  function extractYouTubeID(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    try {
      const url = new URL(text);
      const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
      let id = '';
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || '';
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
    } catch (_) {
      return '';
    }
  }

  function requireAuth() {
    const user = DB.currentUser();
    if (user) return user;
    window.location.replace('register.html?next=upload.html');
    return null;
  }

  window.DB = DB;
  window.renderPosts = renderPosts;
  window.extractYouTubeID = extractYouTubeID;
  window.requireAuth = requireAuth;
  window.showForumMessage = showForumMessage;
})();
