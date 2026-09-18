# Senaoane Online - Community Website (GitHub Pages Ready)

Live community platform for Senaoane, Soweto. Built to run 100% on GitHub Pages with no server.

### Features
- **Registration before uploading** - Local auth (ready to swap to Firebase/Supabase)
- **Database**: JSON files in /data + GitHub Issues as CMS
- **Video Uploads**: Paste original YouTube link -> streamed via embed on community page (keeps original on YouTube, plays on your site)
- **Image Uploads**: Upload images to forum/blog (stored as Base64 in localStorage for demo, instructions for Cloudinary/Supabase Storage for production)
- **Blog / Community Forum**: Users can post after registration
- **Announcement Categories**: Sports, Community Meetings, Jobs, Events, News
- **WhatsApp Integration**: 0765269828

### How it works on GitHub (No Backend)
1. GitHub Pages hosts static files
2. Registration: Saves user in browser localStorage (key: senaoane_users). In production, connect to Firebase Auth or Supabase Auth.
3. Posts: Saved to localStorage (senaoane_posts) + you can sync to /data/posts.json via GitHub Actions
4. YouTube: User pastes YouTube URL, we extract ID and create embed. Original video stays on YouTube, streamed on your site.
5. Images: Uploaded via <input type=file>, previewed and saved. For real hosting, use Cloudinary (free) - instructions below.

### Deploy in 3 steps
1. Create new GitHub repo: `senaoane-website`
2. Push this folder:
```
git init
git add .
git commit -m "Initial Senaoane community site"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/senaoane-website.git
git push -u origin main
```
3. GitHub -> Settings -> Pages -> Source: main branch / root -> Save. Site live in 2 mins.

### Upgrade to Real Database (Recommended)
- **Option A - Supabase (Free, best for you):**
  1. Create project at supabase.com
  2. Create tables: users, posts (sql in /data/schema.sql)
  3. Replace localStorage code in js/app.js with supabase-js calls (example commented in file)
- **Option B - Firebase**
  - Similar, use Firebase Auth + Firestore + Storage

### YouTube Streaming Explained
- User enters: https://www.youtube.com/watch?v=XXXX
- We store original_link
- We display: <iframe src="https://www.youtube.com/embed/XXXX">
- This keeps views on original YouTube channel but streams from your community page (allowed by YouTube TOS)

### File Structure
- index.html - Under construction + community feed
- register.html - Registration form -> database
- upload.html - Upload YouTube link + images (requires login)
- forum.html - Blog / community forum
- js/app.js - All logic
- data/posts.json - Sample database
- data/schema.sql - Supabase schema

Contact: WhatsApp 0765269828
