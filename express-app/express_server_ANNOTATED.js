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
// method-override is needed to be able to do an app.put call
// in the form action, append '?_method=PUT' to the end of the URL.
// This code below will look for that ?_method=PUT attribute and execute app.put instead of app.post


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
  };

  return shortName;

 };

// LISTENERS
app.get("/", (req, res) => {
  console.log("IN GET /");
  const user_id = req.session.user_id; // NOTE: this code gets the user_id and email from the cookie using 'cookie-session'
  const email = req.session.email;
  const templateVars = { user_id: user_id, email: email };

  res.render("urls_home", templateVars);
});

app.get("/urls", (req, res) => {
  console.log("IN GET /urls");
  const user_id = req.session.user_id;
  const email = req.session.email;
  const templateVars = { urls: urlDatabase[user_id], user_id: user_id, email: email };
  
  res.render("urls_index", templateVars);
});

// /urls/new must be placed above /urls/:shortURL, otherwise the routing 
// to /urls/:shortURL/ will think that the 'new' part is the name of an 'id'

app.get("/urls/new", (req,res) => {
  console.log("IN GET /urls/new");
  const user_id = req.session.user_id;
  const email = req.session.email;
  const templateVars = { user_id: user_id, email: email };
  
  res.render("urls_new", templateVars);
});

// -- ADD
app.post("/urls", (req, res) => {
  console.log("IN POST /urls");
  const user_id = req.session.user_id;
  const shortURL = generateRandomString(randomLength, acceptableChars);
  const longURL = req.body.longURL;
  
  // DO SOME ERROR CHECKING HERE - if 'string does not start with http://' then add it
  urlDatabase[user_id][shortURL] = longURL;
  
  res.redirect("/urls");
});

// -- DELETE
app.delete("/urls/:shortURL", (req, res) => {
  console.log("IN POST /urls/:shortURL");
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  delete urlDatabase[user_id][shortURL];
  res.redirect("/urls/");
});

app.get("/urls/:shortURL", (req, res) => {
  console.log("IN GET /urls/:id");
  const user_id = req.session.user_id;
  const email = req.session.email;
  const shortURL = req.params.shortURL; // grabs the shortURL from the :shortURL parameter in the URL pattern in the GET request
  const templateVars = { user_id: user_id, email: email, shortURL: shortURL, longURL: urlDatabase[user_id][shortURL] };

  if (urlDatabase[user_id][shortURL] === undefined) {
    res.send("Page not found - 404", 404);
  } else {
    res.render("urls_show", templateVars);
 }; 
});

// -- EDIT
// the following 'app.put' call is possible because of the method-override package
// To use the app.put call, be sure to append ?_method=PUT to the end of the action URL
// in the form field in the appropriate view. Method-override will then see that query
// string and will call app.put for the specified URL pattern (rather than app.post)
app.put("/urls/:shortURL", (req, res) => {
  console.log("IN PUT /urls/:shortURL");
  // use 'bodyparser' package to parse the BODY of the POST call
  // to get the data sent in the post request. e.g., let newURL = req.body.newUrl;
  
  const user_id = req.session.user_id;
  const newURL = req.body.newUrl;       // grabs the newURL from the request body (using body-parser)
  const shortURL = req.params.shortURL; // grabs the shortURL from the :shortURL parameter in the URL pattern in the GET request

  urlDatabase[user_id][shortURL] = newURL;

  res.redirect("/urls/");
});

// Redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  console.log("IN GET /u/:shortURL");
  const shortURL = req.params.shortURL; // grabs the shortURL from the :ID parameter in the URL pattern in the GET request

  for (let item in urlDatabase) {
    if (urlDatabase[item][shortURL]) { // if short url exists, redirect to longURL
      let longURL = urlDatabase[item][shortURL];

      // add error checking here. If string does not use http:// at the
      // begining, then add it. Otherwise it will think longURL is a relative
      // path and it will not work
      res.redirect(longURL);

      return
    }
  }
  
  res.send("Page not found - 404", 404);
});

app.get("/login", (req, res) => {
  console.log("IN GET /login");

  templateVars = { message: "" };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  console.log("IN POST /login");

  const email = req.body.email;
  const password = req.body.password;

  for (let item in user_data) { 

    if (user_data[item].email === email) { // check if email exists in the database
      console.log("Email exists in database");
      
      if (bcrypt.compareSync(password, user_data[item].password)) { // check if password matches the database
   
        // SET cookies
        req.session.user_id = user_data[item].id;
        req.session.email = email;

        res.redirect("/urls");
        
        return;

      } else {

        templateVars = { message: "The password is incorrect" };
        res.status(403).render("urls_login", templateVars);
        
        return;
      }
    }
  }

  templateVars = { message: "That user account does not exist" };
  res.status(403).render("urls_login", templateVars);
  
  return;
}); 

app.post("/logout", (req, res) => {
  console.log("IN POST /logout");

  // CLEAR cookies
  req.session.user_id = "";
  req.session.email = "";

  res.redirect("/");
});

app.get("/register", (req, res) => {
  console.log("IN GET /register");

  let templateVars = { message: undefined };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  console.log("IN POST /register");
  const email = req.body.email;
  const password = req.body.password;

  const hashed_password = bcrypt.hashSync(password, salt); // create hashed password

  const templateVars = { message: undefined, email: email };

  const keys = Object.keys(user_data);

  console.log("email: " + email);
  console.log("hashed_password: " + hashed_password);

  for (let item in user_data) { 
    if (user_data[item].email === email) { // check if email already exists

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

  const user_id = generateRandomString(10, acceptableChars); // Randomly generate a user id
  
  // SET cookies for new registrant - signs them in after registration
  req.session.user_id = user_id;
  req.session.email = email;

  user_data[user_id] = { id: user_id, email: email, password: hashed_password }; // add them to the user database
  urlDatabase[user_id] = {}; // give them an empty object to start with
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



