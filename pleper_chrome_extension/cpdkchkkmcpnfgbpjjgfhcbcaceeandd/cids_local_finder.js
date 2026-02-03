let regex = /<[^<]+data-cid=['"]([^'"]+)['"][^>]+>/g;
let matchesss = document.body.innerHTML.matchAll(regex);
var toParse = '';
for (let match of matchesss) {
      console.log(match[1]);
      var xhr = new XMLHttpRequest();
      xhr.open("GET", 'https://www.google.com/maps/?cid=' + match[1], true);
//Send the proper header information along with the request
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.onreadystatechange = function () {
            //Call a function when the state changes.
            if (this.readyState == XMLHttpRequest.DONE) {
                  //var postResult = JSON.parse(xhr.responseText);
                  // Request finished. Do processing here.
                  if (xhr.responseText) {
                        let jsonStart = xhr.response.indexOf("window.APP_INITIALIZATION_STATE=");
                        let jsonEnd = xhr.response.indexOf("window.APP_FLAGS", jsonStart);
                        toParse += xhr.response.substring(jsonStart, jsonEnd);

                  }
                  console.log(toParse);
            }
      }
      xhr.send();
}


