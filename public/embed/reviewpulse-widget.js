/**
 * ReviewPulse social proof embed — add to any website:
 * <div id="rp-reviews" data-slug="your-location-slug" data-origin="https://your-app.vercel.app"></div>
 * <script src="https://your-app.vercel.app/embed/reviewpulse-widget.js" async></script>
 */
;(function () {
  var root = document.getElementById('rp-reviews')
  if (!root) return
  var slug = root.getAttribute('data-slug') || ''
  if (!slug) {
    root.textContent = 'Add data-slug="your-location-slug" to #rp-reviews'
    return
  }
  var origin = root.getAttribute('data-origin') || ''
  if (!origin) {
    var s = document.currentScript
    if (s && s.src) {
      try {
        origin = new URL(s.src).origin
      } catch (e) {}
    }
  }
  if (!origin) {
    root.textContent = 'Set data-origin="https://your-domain.com" on #rp-reviews'
    return
  }

  root.innerHTML =
    '<p style="margin:0;font:14px system-ui,sans-serif;color:#64748b">Loading reviews…</p>'

  fetch(origin + '/api/public/widget/' + encodeURIComponent(slug))
    .then(function (r) {
      if (!r.ok) throw new Error('fetch')
      return r.json()
    })
    .then(function (d) {
      var stars = function (n) {
        var out = ''
        for (var i = 1; i <= 5; i++) {
          out += i <= n ? '★' : '☆'
        }
        return out
      }
      var html = ''
      html +=
        '<div style="font:600 16px system-ui,sans-serif;color:#0f172a;margin-bottom:4px">' +
        escapeHtml(d.name || 'Business') +
        '</div>'
      html +=
        '<div style="font:14px system-ui,sans-serif;color:#334155;margin-bottom:12px">' +
        (d.averageRating ? Number(d.averageRating).toFixed(1) : '—') +
        ' ★ · ' +
        (d.totalReviews || 0) +
        ' Google reviews</div>'
      ;(d.reviews || []).forEach(function (rev) {
        if (!rev.comment) return
        html += '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin-bottom:8px;background:#fff">'
        html +=
          '<div style="font:12px system-ui,sans-serif;color:#64748b">' +
          escapeHtml(rev.reviewerName || '') +
          ' · ' +
          stars(rev.rating || 0) +
          (rev.date ? ' · ' + escapeHtml(rev.date) : '') +
          '</div>'
        html +=
          '<div style="font:14px system-ui,sans-serif;color:#1e293b;margin-top:6px;line-height:1.45">' +
          escapeHtml(rev.comment) +
          '</div></div>'
      })
      html +=
        '<div style="font:11px system-ui,sans-serif;color:#94a3b8;margin-top:8px">Powered by <a href="https://reviewpulse.in" style="color:#4f46e5;text-decoration:none">ReviewPulse</a></div>'
      root.innerHTML = html
    })
    .catch(function () {
      root.innerHTML =
        '<p style="font:14px system-ui,sans-serif;color:#b91c1c">Could not load reviews. Check slug and domain.</p>'
    })

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
})()
