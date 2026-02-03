//FID
var FIDUn = document.body.innerHTML.match(/<[^<]+data-fid=['"]([^'"]+)['"][^>]+>/);
if (FIDUn && FIDUn.length > 0) {
      var FID = FIDUn[1];
} else {
      let FIDurlPart = window.location.href.indexOf("0x");
      if (FIDurlPart) {
            let part = window.location.href.substring(FIDurlPart);
            let endPart = part.indexOf("!");
            var FID = part.substring(0, endPart);
      } else {
            var FID = '0';
      }
}

//PLACE ID from html source
var placeIDUn = document.body.innerHTML.match(/<[^<]+data-pid=['"](Ch[^'"]+)['"][^>]+>/);
if (placeIDUn && placeIDUn.length > 0) {
      var placeID = placeIDUn[1];
} else {
      var placeID = '0';
}

var currentURL = window.location.href;

if (placeID !== '0') {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=google_posts_analyze&pid=1&url=' + encodeURIComponent(placeID), "_blank");

} else if (FID !== '0') {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=google_posts_analyze&pid=1&url=' + encodeURIComponent(FID), "_blank");

} else {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=google_posts_analyze&url=' + encodeURIComponent(currentURL), "_blank");

}
win.focus(); 