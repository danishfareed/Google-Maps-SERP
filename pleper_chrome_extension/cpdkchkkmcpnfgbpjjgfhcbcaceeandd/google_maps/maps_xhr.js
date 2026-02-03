(function (xhr) {
      var XHR = XMLHttpRequest.prototype;
      var open = XHR.open;
      var send = XHR.send;
      var setRequestHeader = XHR.setRequestHeader;
      XHR.open = function (method, url) {

            this._method = method;
            this._url = url;
            this._requestHeaders = {};
            this._startTime = (new Date()).toISOString();
            return open.apply(this, arguments);
      };
      XHR.setRequestHeader = function (header, value) {
            this._requestHeaders[header] = value;
            return setRequestHeader.apply(this, arguments);
      };
      XHR.send = function (postData) {
            var myUrl2 = this._url ? this._url.toLowerCase() : this._url;
            this.addEventListener('progress', function () {
                  var myUrl = this._url ? this._url.toLowerCase() : this._url;

                  if (myUrl) {
                        if (postData) {
                              if (typeof postData === 'string') {
                                    try {
                                          // here you get the REQUEST HEADERS, in JSON format, so you can also use JSON.parse
                                          this._requestHeaders = postData;
                                    } catch (err) {
                                          //console.log('Request Header JSON decode failed, transfer_encoding field could be base64');
                                          //console.log(err);
                                    }
                              }
                        }

                        var responseHeaders = this.getAllResponseHeaders();
                        
                        
                        //Google maps search request
                        var n = myUrl.startsWith("/search?tbm=map");
                        //Check if it is finishing on "   /*""*/    "
                        if (n && this.responseText.endsWith('/*""*/')) {
                              var toSend = encodeURIComponent(myUrl) + '||||' + encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(this.responseText);
                              setTimeout(function () {
                                    document.dispatchEvent(new CustomEvent('PLP_maps_search_results', {
                                          detail: toSend
                                    }));
                              }, 0);
                        } else {
                              //console.log('Not Search  ' + myUrl);
                        }
                  }
            });
            this.addEventListener('loadend', function () {

                  var myUrl = this._url ? this._url.toLowerCase() : this._url;
                  if (myUrl) {
                        if (postData) {
                              if (typeof postData === 'string') {
                                    try {
                                          // here you get the REQUEST HEADERS, in JSON format, so you can also use JSON.parse
                                          this._requestHeaders = postData;
                                    } catch (err) {
                                          //console.log('Request Header JSON decode failed, transfer_encoding field could be base64');
                                          //console.log(err);
                                    }
                              }
                        }

                        
                        var responseHeaders = this.getAllResponseHeaders();
                        
                        
                        //Google maps search request
                        var n = myUrl.startsWith("/search?tbm=map");
                        //Check if it is finishing on "   /*""*/    "
                        if (n && this.responseText.endsWith('/*""*/')) {
                              var toSend = encodeURIComponent(myUrl) + '||||' + encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(this.responseText);
                              setTimeout(function () {
                                    document.dispatchEvent(new CustomEvent('PLP_maps_search_results', {
                                          detail: toSend
                                    }));
                              }, 0);
                        } 
                        
                        // Single place information from maps
                        var n = myUrl.startsWith("/maps/preview/place");
                        var n2 = myUrl.startsWith("/maps/?cid=");
                        if (n || n2) {
                              var the_respones = this.responseText.replace("\)\]\}\'", '');
                              var json_result = JSON.parse(the_respones);
                              setTimeout(function () {
                                    document.dispatchEvent(new CustomEvent('PLP_single_place_from_maps', {
                                          detail: json_result
                                    }));
                              }, 0);
                        }
                        
                        
                        //Not sure what was this doing : (
                        /*
                        var n = myUrl.startsWith("/maps/preview/reveal");
                        if (n) {
                              var the_respones = this.responseText.replace("\)\]\}\'", '');
                              var json_result = JSON.parse(the_respones);
                              setTimeout(function () {
                                    document.dispatchEvent(new CustomEvent('PLP_maps_reveal', {
                                          detail: json_result
                                    }));
                              }, 0);
                        } else {
                              //console.log('Not Singel listing  ' + myUrl);
                        }
                         */

                        //Single place in local finder
                        var n = myUrl.startsWith("/async/lcl_akp");
                        if (n) {
                              const urlParams = new URLSearchParams(myUrl);
                              const myParam = urlParams.get('async');
                              var res = myParam.replace("ludocids:", "");
                              var cid_expl = res.split(",");
                              var local_finder_place_cid = cid_expl[0];
                              
                              var xhr = new XMLHttpRequest();
                              xhr.open("GET", "https://" + window.location.host + "/maps/?cid=" + local_finder_place_cid);
                              xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                              xhr.send(postData);
                              xhr.onreadystatechange = function () {
                                    if (xhr.readyState === 4) {
                                          var toSend = encodeURIComponent(xhr.response);
                                          if (toSend.indexOf("window.APP_INITIALIZATION_STATE") !== -1) {
                                                //Should cut part of the response
                                                var splited = toSend.split("window.APP_INITIALIZATION_STATE");
                                                if (splited.length === 2) {
                                                      toSend = "window.APP_INITIALIZATION_STATE" + splited[1];
                                                }
                                          }
                                          setTimeout(function () {
                                                document.dispatchEvent(new CustomEvent('PLP_single_place_local_finder_connectExtension', {
                                                      detail: toSend
                                                }));
                                          }, 0);
                                    }
                              }
                        }

                        //New service local finder - search results
                        //The New localservices design
                        var tbms = myUrl.indexOf("adshomeservicesconsumerui/data/batchexecute?rpcids=ps3v0");
                        if (tbms !== -1) {
                              var the_respones = this.responseText.replace("\)\]\}\'", '');
                              var lines = this.responseText.split(/\r?\n/);
                              if (lines.length === 9) {
                                    var json_result = JSON.parse(lines[3]);
                              } else {
                                    var json_result = JSON.parse(lines[5]);
                              }
                              var json_result_d = JSON.parse(json_result[0][2]);
                              if (json_result_d[1][0]) {
                                    var to_send = [];
                                    for (i = 0; i < json_result_d[1][0].length; i++) {
                                          //CID - tF?!?
                                          to_send.push(json_result_d[1][0][i][21][0][1][1]);
//                                          console.log('CID: ' + json_result_d[1][0][i][21][0][1][1]);
                                    }
                              }
                              if (2 && 1 == to_send) {
                                    setTimeout(function () {
                                          document.dispatchEvent(new CustomEvent('PLP_local_finder_analyze_results_next_page', {
                                                detail: to_send
                                          }));
                                    }, 0);
                              }
                        }


                        //New EU search results
                        var tbm = myUrl.indexOf("/_/visualfrontendui/data/batchexecute?rpcids=dd0mfd");
                        if (tbm !== -1) {
                              var decoded_post_data = decodeURI(postData);
                              var fact_id_start = decoded_post_data.indexOf('"0x');
                              var fact_id_end = fact_id_start + 40;
                              var fact_id = decoded_post_data.substring(fact_id_start + 1, fact_id_end);
                              if (fact_id) {
                                    var xhr = new XMLHttpRequest();
                                    xhr.open("GET", "https://" + window.location.host + "/maps/?ftid=" + fact_id.replace("%3A", ':'));
                                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                                    xhr.send(postData);
                                    xhr.onreadystatechange = function () {
                                          if (xhr.readyState === 4) {
                                                var toSend = encodeURIComponent(xhr.response);
                                                if (toSend.indexOf("window.APP_INITIALIZATION_STATE") !== -1) {
                                                      //Should cut part of the response
                                                      var splited = toSend.split("window.APP_INITIALIZATION_STATE");
                                                      if (splited.length === 2) {
                                                            toSend = "window.APP_INITIALIZATION_STATE" + splited[1];
                                                      }
                                                }
                                                setTimeout(function () {
                                                      document.dispatchEvent(new CustomEvent('PLP_single_place_local_finder_connectExtension', {
                                                            detail: toSend
                                                      }));
                                                }, 0);
                                          }
                                    }
                              }
                        }


                        //New service local finder - Single Listing
                        //The New localservices design
                        var tbm = myUrl.indexOf("/_/adshomeservicesconsumerui/data/batchexecute?rpcids=vtc");
                        if (tbm !== -1) {
                              var the_respones = this.responseText.replace("\)\]\}\'", '');
                              var lines = this.responseText.split(/\r?\n/);
                              if (lines.length === 9) {
                                    var json_result = JSON.parse(lines[3]);
                              } else {
                                    var json_result = JSON.parse(lines[5]);
                              }
                              var json_result = JSON.parse(lines[3]);
                              var json_result_d = JSON.parse(json_result[0][2]);
                              let localservices_cid = json_result_d[0][6][0][1];
                              if (localservices_cid) {
                                    var xhr = new XMLHttpRequest();
                                    xhr.open("GET", "https://" + window.location.host + "/maps/?cid=" + localservices_cid);
                                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                                    xhr.send(postData);
                                    xhr.onreadystatechange = function () {
                                          if (xhr.readyState === 4) {
                                                var toSend = encodeURIComponent(xhr.response);
                                                if (toSend.indexOf("window.APP_INITIALIZATION_STATE") !== -1) {
                                                      //Should cut part of the response
                                                      var splited = toSend.split("window.APP_INITIALIZATION_STATE");
                                                      if (splited.length === 2) {
                                                            toSend = "window.APP_INITIALIZATION_STATE" + splited[1];
                                                      }
                                                }
                                                setTimeout(function () {
                                                      document.dispatchEvent(new CustomEvent('PLP_single_place_local_finder_connectExtension', {
                                                            detail: toSend
                                                      }));
                                                }, 0);
                                          }
                                    }
                              }
                        }

                        //Local Finder next page
                        var tbm = myUrl.indexOf("tbm=lcl");
                        var n = myUrl.startsWith("/search?");

                        if (n && tbm !== -1) {
                              let lastRequest = 601;
                              if (window.XHRstartTime) {
                                    lastRequest = (new Date()).getTime() - window.XHRstartTime;
                              }
                              window.XHRstartTime = (new Date()).getTime();
                              if (lastRequest > 600) {
                                    var toSend = this.responseText;
                                    setTimeout(function () {
                                          document.dispatchEvent(new CustomEvent('PLP_local_finder_analyze_results_next_page', {
                                                detail: toSend
                                          }));
                                    }, 0);
                              }
                        }

                        //Photos in maps
                        var n = myUrl.startsWith("/maps/photometa");
                        if (n) {
                              var toSend = this.responseText;
                              setTimeout(function () {
                                    document.dispatchEvent(new CustomEvent('PLP_photos_in_maps', {
                                          detail: toSend
                                    }));
                              }, 0);
                        }

//                        var n = myUrl.startsWith("/local.js?q=");
//                        if (n) {
//                              var toSend = this.responseText;
//                              setTimeout(function () {
//                                    document.dispatchEvent(new CustomEvent('PLP_duckduckgo_maps_results', {
//                                          detail: toSend
//                                    }));
//                              }, 0);
//                        }
                  }
            });
            return send.apply(this, arguments);
      };
})(XMLHttpRequest);
setTimeout(function () {
      //First Load of the search results
      try {
            if (typeof window.APP_INITIALIZATION_STATE !== 'undefined' && typeof window.APP_INITIALIZATION_STATE !== null) {
                  if (window.APP_INITIALIZATION_STATE[3] !== null && typeof window.APP_INITIALIZATION_STATE[3]['ug'][2] !== 'undefined' && window.APP_INITIALIZATION_STATE[3]['ug'][2] !== null && window.APP_INITIALIZATION_STATE[3]['ug'][2] !== null) {
                        var toSend = encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(window.APP_INITIALIZATION_STATE[3]['ug'][2]);
                        //console.log(toSend);
                        document.dispatchEvent(new CustomEvent('PLP_maps_search_results', {
                              detail: toSend
                        }));
                  } else if (window.APP_INITIALIZATION_STATE[3] !== null && typeof window.APP_INITIALIZATION_STATE[3][2] !== 'undefined' && window.APP_INITIALIZATION_STATE[3][2] !== null && window.APP_INITIALIZATION_STATE[3][2] !== null) {
                        var toSend = encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(window.location.href) + '||||' + encodeURIComponent(window.APP_INITIALIZATION_STATE[3][2]);
                        //console.log(toSend);
                        document.dispatchEvent(new CustomEvent('PLP_maps_search_results', {
                              detail: toSend
                        }));
                  } else {
                        var toSend = encodeURIComponent(window.APP_INITIALIZATION_STATE);

                        document.dispatchEvent(new CustomEvent('PLP_single_place_from_maps', {
                              detail: toSend
                        }));
                  }
            }
      } catch (err) {
            console.log('PLP Error: First Load of the search results: ');
            console.log(err);
      }
}, 5500);
