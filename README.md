# WoodHub

Euca Chips aur Euco Wood transport ke liye mobile-friendly log book &
payment tracker. Purani Excel sheet ki jagah ab ek simple web app se
naya truck/trip entry daalo, history dekho, aur ek dashboard me total
margin / pending payments / GST turant dikh jaaye.

Koi build step nahi hai — plain HTML/CSS/JavaScript hai, isliye kisi
bhi free static hosting (GitHub Pages, Vercel, Netlify) par seedha
deploy ho jata hai.

## 1. Supabase project banao (free database)

1. https://supabase.com par jaake free account banao.
2. "New project" banao (koi bhi naam, region "South Asia (Mumbai)" chuno
   for speed).
3. Project ready hone ke baad, left sidebar me **SQL Editor** kholo,
   naya query banao, is repo ki `schema.sql` file ka pura content paste
   karo, aur **Run** dabao. Isse teen tables ban jayengi: `log_entries`,
   `assessment_log`, aur zaroori security rules.
4. Left sidebar me **Authentication -> Users -> Add user** se apna
   email/password wala ek login bana lo (yahi email/password app me
   login karne ke kaam aayega).
5. Left sidebar me **Project Settings -> API** kholo. Wahan se
   **Project URL** aur **anon public key** copy kar lo.

## 2. App ko apni Supabase details se jodo

`js/config.js` file kholo aur ye do lines apni values se replace karo:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

## 3. Purana Excel data import karo (optional, ek baar)

```bash
python3 import_data.py /path/to/WoodHub.xlsx
```

Isse `import.sql` file banegi (git me commit nahi hoti — `.gitignore`
me already excluded hai, kyunki isme aapka real business data hota
hai aur ye repo public hai). Supabase ke **SQL Editor** me is file ka
content paste karke Run kar do — purani ~200 rows import ho jayengi.

## 4. Deploy karo (mobile se access ke liye)

**Sabse aasan: GitHub Pages**
1. Repo ke **Settings -> Pages** me jaao.
2. Source: "Deploy from a branch", Branch: `main` / root chuno, Save
   karo.
3. 1-2 minute me ek link milega jaise
   `https://mannavibe-sudo.github.io/WoodHub/` — yahi link phone pe
   khol lo, "Add to Home Screen" bhi kar sakte ho (app jaisa icon ban
   jayega).

**Ya phir Vercel** — vercel.com par GitHub se sign in karke ye repo
import karo, koi build command set karne ki zaroorat nahi (static
site), Deploy dabao.

## Structure

```
index.html          -- app shell (login + dashboard + forms, sab ek hi page me)
css/style.css        -- saara styling, mobile-first
js/config.js          -- Supabase URL/key (aapko fill karna hai)
js/supabase-lite.js   -- chhota REST client, koi SDK/build step nahi
js/fields.js           -- form/table fields ki definition
js/app.js              -- routing + saara app logic
schema.sql             -- Supabase/Postgres tables + security rules
import_data.py          -- purani Excel sheet se SQL banane ka script
```

## Security note

Repo public hai isliye source code kisi ko bhi dikh sakta hai — lekin
data Supabase me RLS (Row Level Security) ke peeche hai, matlab sirf
login kiya hua user hi data padh/likh sakta hai. Apna Supabase
email/password kisi ke saath share mat karo.
