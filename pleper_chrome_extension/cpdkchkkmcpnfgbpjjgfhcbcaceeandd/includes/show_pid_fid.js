function hexToDec(hex) {
var num = 0n;
        for (var x = 1; x <= hex.length; x++) {
var hexdigit = hex[hex.length - x];
        num += BigInt(parseInt(hexdigit, 16)) * 16n ** (BigInt(x) - 1n);
}
return num;
        }

var CID = 0;
        var FIDUn = document.body.innerHTML.match(/<[^<]+data-fid=['"]([^'"]+)['"][^>]+>/);
        if (FIDUn && FIDUn.length > 0) {
var FID = FIDUn[1];
        var CID_hexed = FID.split(":0x");
        CID = hexToDec(CID_hexed[1]);
        } else {
let FIDurlPart = window.location.href.indexOf("0x");
        if (FIDurlPart) {
let part = window.location.href.substring(FIDurlPart);
        let endPart = part.indexOf("!");
        var FID = part.substring(0, endPart);
        var CID_hexed = FID.split(":0x");
        CID = hexToDec(CID_hexed[1]).toString();
} else {
var FID = '0';
}
}

//PLACE ID from html source
var placeIDUn = document.body.innerHTML.match(/<[^<]+data-place-id=['"](Ch[^'"]+)['"][^>]+>/);
        if (placeIDUn && placeIDUn.length > 0) {
var placeID = placeIDUn[1];
        } else {
var placeID = '0';
        }

if (document.getElementById("plp_ext_show_place_id_fid_cid")) {
document.getElementById("plp_ext_show_place_id_fid_cid").remove();
        }

var node = document.createElement("div");
        var innerHTML = 'Place ID: <input type="text" style="width:97%;border:1px solid #4d7496;padding:4px;" autocomplete="off" value="' + placeID + '"><br><br>';
        innerHTML += 'FID: <input type="text" style="width:97%;border:1px solid #4d7496;padding:4px;" autocomplete="off" value="' + FID + '"><br><br>';
        innerHTML += 'CID: <input type="text" style="width:97%;border:1px solid #4d7496;padding:4px;" autocomplete="off" value="' + CID + '"><br><br><hr>';
        innerHTML += ' <button type="button" id="close_plp_ext_show_place_id_fid_cid" style="width:100%;float:left;border:1px solid #4d7496;">Close</button>';
        node.innerHTML = innerHTML;
        node.style.position = 'fixed';
        node.style.left = '40%';
        node.style.top = '20%';
        node.style.width = '350px';
        node.style.backgroundColor = '#fff';
        node.style.border = '1px solid #4d7496';
        node.style.color = '#4d7496';
        node.style.padding = '5px';
        node.style.borderRadius = '0';
        node.style.boxShadow = '-5px 5px rgb(0, 0, 0, 0.05';
        node.style.fontFamily = 'arial,sans-serif';
        node.style.zIndex = '9999';
        node.setAttribute("id", "plp_ext_show_place_id_fid_cid");
        document.body.appendChild(node);

document.getElementById('close_plp_ext_show_place_id_fid_cid').addEventListener('click', function () {
      if (document.getElementById('plp_ext_show_place_id_fid_cid') !== null) {
            document.getElementById('plp_ext_show_place_id_fid_cid').remove();
      }
});