if (document.getElementById("plp_ext_near_by_search")) {
      document.getElementById("plp_ext_near_by_search").remove();
}

var node = document.createElement("div");
var innerHTML = '<form action="https://pleper.com/tools/bookmarklet_redir.php" method="get" target="_blank">';
innerHTML += '<input type="hidden" name="redir" value="nearby">';
innerHTML += '<input type="text" name="term" placeholder="Search Term" style="width:97%;border:1px solid #4d7496;padding:4px;"><br><br>';
innerHTML += '<input type="text" name="near" placeholder="Location" style="width:97%;border:1px solid #4d7496;padding:4px;"><br><br><hr>';
innerHTML += '<button type="Submit" value="Search" style="width:45%;float:left;border:1px solid #4d7496;">Search</button> ';
innerHTML += ' <button type="button" id="close_plp_ext_near_by_search" style="width:45%;float:right;border:1px solid #4d7496;">Close</button>';
innerHTML += '</form>';

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
node.setAttribute("id", "plp_ext_near_by_search");
document.body.appendChild(node);

document.getElementById('close_plp_ext_near_by_search').addEventListener('click', function () {
      if (document.getElementById('plp_ext_near_by_search') !== null) {
            document.getElementById('plp_ext_near_by_search').remove();
      }
});