const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({ name: "session", keys: ["this is a key", "this is another key"]}));
app.use(bodyParser.urlencoded());
app.set("view engine", "ejs");
app.use(methodOverride('_method')); 

// - Tracking cookie
// app.use((req, res, next) => {
//   console.log("HERE");
//   req.session.views = (req.session.views || 0) + 1;

//   res.end(req.session.views + ' views')
// })

// DATABASE
const user_data = {
  "userRandomID": { id: "userRandomID", email: "testemail@gmail.com", password: "$2a$04$kcqFKEbdS0LgBO/sTgCH3.H3zvERfkWOULYAmrV5rRe0hOIEwWQU6" }
};

const urlDatabase = { 
  "userRandomID": { "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com" }
};

// FUNCTIONS
const randomLength = 6;
const acceptableChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateRandomString(length, chars) { 
  let shortName = "";
  
  for (let i = 0; i < length; i++) {
    let randomIndex = Math.floor(Math.random() * chars.length);
    shortName += chars[randomIndex];
  }

  return shortName;
 }

// LISTENERS
app.get("/", (req, res) => {
  const user_id = req.session.user_id; // NOTE: this code gets the user_id and email from the cookie using 'cookie-session'
  const email = req.session.email;

  req.session.views = (req.session.views || 0) + 1;

  const views = req.session.views;

  const templateVars = { user_id: user_id, email: email, views: views };

  res.render("urls_home", templateVars);
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const email = req.session.email;
  const templateVars = { urls: urlDatabase[user_id], user_id: user_id, email: email };
  
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req,res) => {
  // /urls/new must be placed above /urls/:shortURL
  const user_id = req.session.user_id;
  const email = req.session.email;
  const templateVars = { user_id: user_id, email: email };
  
  res.render("urls_new", templateVars);
});

// -- ADD
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = generateRandomString(randomLength, acceptableChars);
  const longURL = req.body.longURL;
  urlDatabase[user_id][shortURL] = longURL;
  
  res.redirect("/urls");
});

// -- DELETE
app.delete("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  delete urlDatabase[user_id][shortURL];
  res.redirect("/urls/");
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const email = req.session.email;
  const shortURL = req.params.shortURL;

// TEST - set cookie for each time this shortURL page is visited
  // req.cookie('cookie name', value)
  // req.session({ name: shortURL }) = (req.session({ name: shortURL }) || 0) + 1;
  // const views = req.session({ name: shortURL });

  // req.cookies(shortURL) = (req.cookies(shortURL) || 0) +1;
  // const views = req.cookies(shortURL);

  // const templateVars = { user_id: user_id, email: email, shortURL: shortURL, longURL: urlDatabase[user_id][shortURL], views: views };
  
  const templateVars = { user_id: user_id, email: email, shortURL: shortURL, longURL: urlDatabase[user_id][shortURL] };

  if (urlDatabase[user_id][shortURL] === undefined) {
    res.send("Page not found - 404", 404);
  } else {
    res.render("urls_show", templateVars);
 } 
});

// -- EDIT
app.put("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const newURL = req.body.newUrl; 
  const shortURL = req.params.shortURL;

  urlDatabase[user_id][shortURL] = newURL;

  res.redirect("/urls/");
});

// Redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  for (let item in urlDatabase) {
    if (urlDatabase[item][shortURL]) { 
      let longURL = urlDatabase[item][shortURL];

      res.redirect(longURL);
      return;
    }
  }
  
  res.send("Page not found - 404", 404);
});

app.get("/login", (req, res) => {
  const templateVars = { message: "" };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let item in user_data) { 

    if (user_data[item].email === email) { 
      
      if (bcrypt.compareSync(password, user_data[item].password)) {
   
        // SET cookies
        req.session.user_id = user_data[item].id;
        req.session.email = email;

        res.redirect("/urls");
        
        return;

      } else {

        const templateVars = { message: "The password is incorrect" };
        res.status(403).render("urls_login", templateVars);
        
        return;
      }
    }
  }

  const templateVars = { message: "That user account does not exist" };
  res.status(403).render("urls_login", templateVars);
  
  return;
}); 

app.post("/logout", (req, res) => {
  // CLEAR cookies
  req.session.user_id = "";
  req.session.email = "";

  res.redirect("/");
});

app.get("/register", (req, res) => {
  let templateVars = { message: undefined };
  
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, salt);
  const templateVars = { message: undefined, email: email };

  for (let item in user_data) { 
    if (user_data[item].email === email) {
      templateVars["message"] = "An account already exists for that email address. Please use a different one.";
      
      res.status(400).render("urls_register", templateVars);
      return; 
    }
  }

  if (email === "" || password === "") {
    templateVars["message"] = "Email and password cannot be blank";
    
    res.status(400).render("urls_register", templateVars);
    return;
  }

  const user_id = generateRandomString(10, acceptableChars);
  
  // SET cookies for new registrant - signs them in after registration
  req.session.user_id = user_id;
  req.session.email = email;
  user_data[user_id] = { id: user_id, email: email, password: hashed_password };
  urlDatabase[user_id] = {};
  
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
