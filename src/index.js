document.getElementById("endSuccess").style.visibility = "hidden";


document.querySelector("form").addEventListener("submit", event => {
  event.preventDefault();

  const { path } = document.getElementById("filePicker").files[0];

  window.api.receiveFromD((event,  data) => {
    document.getElementById("endSuccess").textContent="Success. Document saved here : "+data.path;
    document.getElementById("endSuccess").style.visibility = "visible";

  });

  window.api.sendToA(path, document.getElementById("messageInput").value);


});


