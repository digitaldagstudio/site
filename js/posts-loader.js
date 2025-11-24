// site/js/posts-loader.js

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false; // keep order predictable
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

function initBlog() {
  const blogList    = document.getElementById("blog-list");
  const postTitle   = document.getElementById("post-title");
  const postCover   = document.getElementById("post-cover");
  const postContent = document.getElementById("post-content");

  if (!blogList) {
    console.error("[Blog] #blog-list not found.");
    return;
  }

  let postsData = window.posts || [];

  // Sort newest first (based on your MM/DD/YYYY dates)
  postsData = postsData.slice().sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    if (!isNaN(da) && !isNaN(db)) return db - da;
    return b.id - a.id;
  });

  console.log("[Blog] postsData =", postsData);

  if (!Array.isArray(postsData) || postsData.length === 0) {
    blogList.innerHTML = "<p>Blog posts coming soon.</p>";
    console.warn("[Blog] No posts to render.");
    return;
  }

  function showPost(post) {
    if (!postTitle || !postCover || !postContent) {
      console.error("[Blog] Post viewer elements missing.");
      return;
    }

    postTitle.textContent = post.title || "";
    postCover.src         = post.cover || "";
    postCover.alt         = post.title || "";
    postContent.innerHTML = post.content || "";

    const url = new URL(window.location.href);
    url.searchParams.set("post", post.id);
    history.replaceState(null, "", url.toString());

    window.location.hash = "#post-viewer";
  }

  function renderBlogList() {
    blogList.innerHTML = "";

    postsData.forEach((post) => {
      const item = document.createElement("div");
      item.className = "blog-item";

      const title = post.title || "Untitled Post";
      const date  = post.date  || "";
      const cover = post.cover || "";

      item.innerHTML = `
        <button type="button" class="blog-item-btn" data-id="${post.id}">
          ${cover ? `<img src="${cover}" alt="${title} cover" class="blog-thumb">` : ""}
          <div class="blog-item-text">
            <strong class="blog-item-title">${title}</strong>
            ${date ? `<div class="blog-item-date">${date}</div>` : ""}
          </div>
        </button>
      `;

      blogList.appendChild(item);
    });

    console.log("[Blog] Rendered items:", postsData.length);
  }

  blogList.addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id   = Number(btn.dataset.id);
    const post = postsData.find((p) => p.id === id);

    if (!post) {
      console.error("[Blog] Post not found for id:", id);
      return;
    }

    showPost(post);
  });

  function openPostFromUrlIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const postParam = params.get("post");
    if (!postParam) return;

    const id = Number(postParam);
    const post = postsData.find((p) => p.id === id);
    if (!post) {
      console.warn("[Blog] No post matched ?post=", postParam);
      return;
    }

    showPost(post);
  }

  const backLink = document.querySelector("#post-viewer a.button");
  if (backLink) {
    backLink.addEventListener("click", function () {
      const url = new URL(window.location.href);
      url.searchParams.delete("post");
      history.replaceState(null, "", url.toString());
    });
  }

  renderBlogList();
  openPostFromUrlIfNeeded();
}

// Load all post scripts, then init the blog
window.addEventListener("DOMContentLoaded", async () => {
  window.allPosts = window.allPosts || [];

  const files = window.postScriptFiles || [];
  try {
    await Promise.all(files.map(loadScript));
  } catch (err) {
    console.error("[Blog] Failed to load post scripts:", err);
  }

  // Build window.posts from the collected post objects
  window.posts = (window.allPosts || []).slice();

  console.log("[Blog] allPosts loaded =", window.allPosts);
  console.log("[Blog] window.posts =", window.posts);

  initBlog();
});
