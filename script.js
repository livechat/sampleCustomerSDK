const chatContainer = document.querySelector(".chat_container");
const chatContent = document.querySelector(".chat_content");
const status = document.querySelector("#status");
const floater = document.querySelector(".floater");
const textarea = document.querySelector("#textarea");
const title = document.querySelector(".title");
const rate_chat = document.querySelector('.rate')
var authors = [];
var chatId = undefined;
var chatStatus = undefined;
var agent = {};
var c = console.log
const config = {
  licenseId: 13346586,
  clientId: "41b41631fe4cdfe8ec7c8f4887f563fa",
};

//Additional comma in the Documentation
const sdk = CustomerSDK.init(config);

sdk.on("connected", async (p) => {
  console.log(p);
  status.innerHTML = p.availability;
  if (p.availability === "offline") floater.style.display = "none";
  else {
    let listChats = await sdk.listChats();
    console.log(listChats);
    if (listChats.chatsSummary.length > 0) {
      chatId = listChats.chatsSummary[0].id;
      chatStatus = listChats.chatsSummary[0].active;
      agent = listChats.users[1];
      let chats = await sdk.getChat({ chatId: chatId });
      let customerData = await sdk.getCustomer();
      authors[0] = customerData.id;
      getAuthors(chats.thread.events);
      c(authors);
      title.innerHTML = "Chat with " + agent.name;
      chats.thread.events.forEach((event) => {
        addMessage(event);
        c(event);
      });
    }
  }
});

sdk.on("incoming_event", (r) => {
  
  if (r.event.type === "message") {
    title.innerHTML = "Chat with " + agent.name;
    addResponseAgent(r.event);
    
  }
  else if (r.event.type === "system_message") addMessage(r.event);
});

function addMessage(event) {
  let messageBox = document.createElement("div");
  if (event.authorId === authors[0]) messageBox.className = "m1";
  else if (event.authorId === authors[1]) messageBox.className = "m2";
  else if (event.authorId === "system") messageBox.className = "system";
  messageBox.innerHTML = event.text;
  chatContent.append(messageBox);
  var a = chatContent.querySelectorAll("div");
  a[a.length - 1].scrollIntoView();
}

function addResponse(event) {
  let messageBox = document.createElement("div");
  messageBox.className = "m1";
  messageBox.innerHTML = event.text;
  chatContent.append(messageBox);
  var a = chatContent.querySelectorAll("div");
  a[a.length - 1].scrollIntoView();
}

function addResponseAgent(event) {
   if(chatContainer.style.display === "none" || document.hidden){
      document.querySelector('#notify').play()
    }
  let messageBox = document.createElement("div");
  messageBox.className = "m2";
  messageBox.innerHTML = event.text;
  chatContent.append(messageBox);
  var a = chatContent.querySelectorAll("div");
  a[a.length - 1].scrollIntoView();
}

function getAuthors(events) {
  events.forEach((event) => {
    if (event.authorId === "system") {
    } else if (!authors[0]) authors[0] = event.authorId;
    else if (!authors[1] && event.authorId != authors[0])
      authors[1] = event.authorId;
    else return;
  });
}

chatContainer.addEventListener("click", () => {
  seen()
})

floater.addEventListener("click", function () {
  seen()
  if (chatContainer.style.display === "none") {
    chatContainer.style.display = "flex";
    var e = chatContainer.querySelectorAll("div");
    e[e.length - 1].scrollIntoView();
  } else chatContainer.style.display = "none";
});

function sendMessage() {
  sdk
    .sendEvent({
      chatId,
      event: {
        type: "message",
        text: textarea.value,
      },
    })
    .then((response) => {
      addResponse(response);
    })
    .catch((error) => {
      console.log(error);
    });
}

textarea.addEventListener("keyup", async function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var listChats = await sdk.listChats();
    if (listChats.chatsSummary.length > 0) {
      chatStatus = listChats.chatsSummary[0].active;
      agent = listChats.users[1];
      title.innerHTML = "Chat with " + agent.name;

    } 
    if (!chatId) {
      console.log("starting");
      var chat = await sdk.startChat();
      chatId = chat.chat.id;
      console.log(chat.chat.id, chatId);
      console.log(chat);
    } else if (chatStatus === false) {
      console.log("chat resumed");
      sdk.resumeChat({ chat: { id: chatId } });
    }

    sendMessage();
    textarea.value = null;
  }
});

sdk.on("incoming_typing_indicator", (payload) => {
  var indicator = document.createElement("div");
  indicator.innerHTML = "agent is typing...";
  indicator.id = "typingIndicator";
  if (payload.typingIndicator.isTyping) {
    var m = document.querySelector("#typingIndicator");
    if (m) return;
    console.log("typing");
    chatContent.appendChild(indicator);
  } else {
    console.log("not typing");
    indicator = document.querySelector("#typingIndicator");
    if (indicator) indicator.remove();
  }
});

//methods
const output = document.querySelector("#output");
const method = document.querySelector("#methodName");

var seen = () => {
   var date = new Date().toISOString()
  var i = date.lastIndexOf("Z")
  date = date.substr(0,i) + "000" + date.substr(i)
  c(date)
  
  sdk
  .markEventsAsSeen({
    chatId: chatId,
    seenUpTo: date
  })
  .then(response => {
    // console.log(response)
  })
  .catch(error => {
    console.log(error)
  })
}


var rateChat = () => {
  var rating = document.querySelector("input[name='rate']:checked").value
  c(rating)
  rating= parseInt(rating)
  var comment = document.querySelector("#rateComment").value
  sdk
  .rateChat({
    chatId: chatId,
    rating: {
      score: rating ,
      comment: comment,
    },
  })
  .then(() => {
    console.log('Rating has been set')
  })
  .catch(error => {
    console.log(error)
  })
}

document.querySelector('#sendRate').addEventListener('click', () => {
  rateChat()
  document.querySelector('.rate').style.display="none"
})

document.querySelector('#rateBtn').addEventListener('click', () => {
  c(rate_chat.style.display)
  if(rate_chat.style.display === "block") rate_chat.style.display = "none"
  else rate_chat.style.display = "block"
})
document
  .querySelector("#getCustomer")
  .addEventListener("click", async function (event) {
    var data = await sdk.getCustomer();
    print(data, this);
  });

document
  .querySelector("#showAgent")
  .addEventListener("click", async function (event) {
    var listChats = await sdk.listChats();
    if (listChats.chatsSummary.length > 0) {
      chatStatus = listChats.chatsSummary[0].active;
      agent = listChats.users[1];
    }
    print(agent, this);
  });

document
  .querySelector("#getChat")
  .addEventListener("click", async function (event) {
    var data = await sdk.getChat({ chatId: chatId });
    print(data, this);
  });

document
  .querySelector("#listChats")
  .addEventListener("click", async function (event) {
    var data = await sdk.listChats();
    print(data, this);
  });

document
  .querySelector("#deactivateChat")
  .addEventListener("click", async function (event) {
    var data = await sdk.deactivateChat({ id: chatId });
    print(data, this);
  });

document.querySelector("#readAll").addEventListener('click', async function(event) {
  seen()
  print({message:"all messages marked as read!"}, this)
})

var print = (data, button) => {
  method.innerHTML = button.innerHTML;
  var outputString = JSON.stringify(data, null, 4);
  outputString = outputString.replace(/[{}]/g, "");
  output.innerHTML = outputString;
};
