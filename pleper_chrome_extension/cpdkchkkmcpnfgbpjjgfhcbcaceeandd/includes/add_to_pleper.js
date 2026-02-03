var FIDUn = document.body.innerHTML.match(/<[^<]+data-fid=['"]([^'"]+)['"][^>]+>/);
if (FIDUn && FIDUn.length > 0) {
      var FID = FIDUn[1];
} else {
      var FID = '0';
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
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=add_place&pid=1&url=' + encodeURIComponent(placeID), "_blank");
} else if (FID !== '0') {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=add_place&pid=1&url=' + encodeURIComponent(FID), "_blank");

} else {
      var win = window.open('https://pleper.com/tools/bookmarklet_redir.php?redir=add_place&url=' + encodeURIComponent(currentURL), "_blank");
}

win.focus(); 