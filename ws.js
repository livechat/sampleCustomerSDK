var c = console.log;
var customer = {
  name: "anonymous",
  email: "anonymous@anonymous.com"
};
var j = JSON.stringify;
var cookie = {};
var chat_id;
var users = {}

c(
  "%c Real Time Messaging CLI",
  "font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113)"
);

c(
  "A simple dev tools Real Time Messaging CLI for livechat \n available methods:\n init() - initialize customer token \n setCustomer(name, email) - set customer data (string, string) \n connect() - connect via web socket \n startChat() - start new Chat \n resumeChat() - resume previous chat \n m(content) - send a message \n licenseId = intiger (change license) \n cookie - view cookie data"
);

var licenseId = 13346586;
var url =
  "wss://api.livechatinc.com/v3.3/customer/rtm/ws?license_id=" + licenseId;
var webSocket;

var init = () => {
  getCookieData();
  console.log("cookie set, ready to start the connection!")
};

var connect = () => {
  webSocket = new WebSocket(url);

  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        action: "login",
        payload: { token: "Bearer " + cookie.access_token, customer: customer },
      })
    );

    c("connection open");

    setInterval(() => {
      webSocket.send(
        JSON.stringify({
          action: "ping",
          payload: {},
        })
      );
    }, 15000);
  };

  webSocket.onmessage = (e) => {
    var m = JSON.parse(e.data);
    // c(m);
    if (m.action === "login" && m.success) {
      c("logged in successfully");
      listChats();
    }
    if (m.action === "list_chats") {
      c(
        "total chats: ",
        m.payload.total_chats,
        "active: ",
        m.payload.chats_summary[0].active
      );
      if (m.payload.total_chats > 0) {
        chat_id = m.payload.chats_summary[0].id
        getChat()
        users = m.payload.chats_summary[0].users
      };
    }

    if (m.action === "incoming_event" && m.payload.event.type === "message") {
      c(m.payload.event.text);
    }
    
    if (m.action === "incoming_chat" && m.payload.event.type === "message") {
      c.payload.chat.thread.events.forEach(event => c(event.text));
    }
    
    if(m.action === "get_chat") {
      // c(m.payload)
      c("%c Previous communication is listed below", "color:red")
      m.payload.thread.events.forEach(event => c(getUsernameById(event.author_id), ": ", event.text))
    }
  };
};

var getUsernameById = (id) => {
  if(users.length<1) listChats()
  if(id === users[0].id) return users[0].name
  else return users[1].name
  
}

var listChats = () => {
  send(j({ action: "list_chats", payload: {} }));
};

var listArchives = () => {
  send(j({ action: "list_archives", payload: {} }));
};
var setCustomer = (name, mail) => {
  customer = { name: name, email: mail };
  c(customer)
};

function startChat() {
  send(j({ action: "start_chat" }));
}

function resumeChat() {
  send(j({ action: "resume_chat", payload: { chat: {id:chat_id } }} ));
}

function getChat() {
  send(j({ action: "get_chat", payload: { chat_id: chat_id }}));
}


var m = (content) => {
  send(
    j({
      action: "send_event",
      payload: { chat_id: chat_id, event: { type: "message", text: content} },
    })
  );
};
var send = (c) => {
  webSocket.send(c);
};

var getCookieData = () => {
  var cookieData = getCookie("livechatCookie");
  if (!cookieData) {
    fetch("https://accounts.livechat.com/customer/token", {
      method: "post",
      body: JSON.stringify({
        grant_type: "cookie",
        client_id: "41b41631fe4cdfe8ec7c8f4887f563fa",
        response_type: "token",
        license_id: 13346586,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        cookie = data;
        setCookie("livechatCookie", JSON.stringify(cookie), 365);
      });
  } else {
    cookie = JSON.parse(getCookie("livechatCookie"));
  }
};

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
