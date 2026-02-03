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

var currentURL = window.location.href;

if (FID == 0) {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=maps&url=' + currentURL, "_blank");
} else {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=maps&url=' + FID, "_blank");
}
win.focus();