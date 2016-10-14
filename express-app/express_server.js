var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
// use res.cookie to set values on the cookie [in EXPRESS]
// use cookie-parser to read values from the cookie [in cookie-parser]
 
// MIDDLEWARE
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded());
app.set("view engine", "ejs");

// DATABASE
const data = {
  "1exampleID": { id: "userRandomID", email: "testemail@gmail.com", password: "$2a$04$kcqFKEbdS0LgBO/sTgCH3.H3zvERfkWOULYAmrV5rRe0hOIEwWQU6" }
};

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// FUNCTIONS
var randomLength = 6;
var acceptableChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateRandomString(length, chars) {
  var shortName = "";
  
  for (i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * chars.length);
    shortName += chars[randomIndex];
  };
  return shortName;
 };

// console.log(generateRandomString(randomLength, acceptableChars));



// method-override is needed to be able to do an app.put call
// in the form action, append '?_method=PUT' to the end of the URL.
// This code below will look for that ?_method=PUT attribute and execute app.put instead of app.post
app.use(methodOverride('_method')); 


// ROUTING
// 
// BREAD
// Browse
// Read
// Edit
// Add
// Delete


// CHANGE THIS - make a welcome page - ask what you want to do. See existing URLs or create a new shortURL
app.get("/", (req, res) => {
  let user_id = req.cookies.user_id;
  let email = req.cookies.email;

  console.log("in /, user_id: " + user_id);
  console.log("in /, email: " + email);

  var templateVars = { user_id: user_id, email: email };

  res.render("urls_home", templateVars);
});

app.get("/urls", (req, res) => {
  let user_id = req.cookies.user_id;
  let email = req.cookies.email;
  let templateVars = { urls: urlDatabase, user_id: user_id, email: email };
  res.render("urls_index", templateVars);
});

// /urls/new must be above /urls/:id, otherwise the routing 
// to /urls/:id/ will think that the 'new' part is the name of an 'id'

app.get("/urls/new", (req,res) => {
  let user_id = req.cookies.user_id;
  let email = req.cookies.email;
  let templateVars = { user_id: user_id, email: email };
  res.render("urls_new", templateVars);
});

// ADD
app.post("/urls", (req, res) => {
  var shortURL = generateRandomString(randomLength, acceptableChars);
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  // console.log("in POST: " + urlDatabase[shortURL]);
  res.redirect(`/urls/${shortURL}`); // every post must have a redirect afterwards
});

// DELETE
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls/");
});


app.get("/urls/:id", (req, res) => {
  let user_id = req.cookies.user_id;
  let email = req.cookies.email;
  let shortURL = req.params.id;
  let templateVars = { user_id: user_id, email: email, shortURL: shortURL, longURL: urlDatabase[shortURL] };

  if (urlDatabase[shortURL] == undefined) {
    res.send("Page not found - 404", 404);
  } else {
    res.render("urls_show", templateVars);
 };  
});

// EDIT
// the following 'app.put' call is possible because of the method-override package
// To use the app.put call, be sure to append ?_method=PUT to the end of the action URL
// in the form field in the appropriate view
app.put("/urls/:id", (req, res) => {
  // use 'bodyparser' package to parse the BODY of the POST call
  // to get the data sent in the post request
  let newURL = req.body.newUrl;
  let shortURL = req.params.id;
  urlDatabase[shortURL] = newURL;
  res.redirect("/urls/");
});

// redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  templateVars = { message: "" };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  console.log("At POST /login");
  let email = req.body.email;
  let password = req.body.password;

  console.log("@LOGIN email: " + email);
  console.log("@LOGIN data: " + JSON.stringify(data));

  for (var item in data) { 
    console.log("@LOGIN data[item].email " + data[item].email);

    if (data[item].email === email) {
      console.log("Email exists in database");
      
      // if (data[item].password === password) {
      if (bcrypt.compareSync(password, data[item].password)) {
        res.cookie("user_id", data[item].id); // sets cookie to user_id;
        res.cookie("email", email); // sets cookie to user_id;
        
        res.redirect("/");

      } else {
        console.log("AT THE 403 LOGIN REDIRECT - password doesn't match");

        templateVars = { message: "The password is incorrect" };
        res.status(403).render("urls_login", templateVars);
        return next();
      }
    }
  }
        console.log("AT THE 403 LOGIN REDIRECT - email doesn't match");

      templateVars = { message: "That user account does not exist" };
      res.status(403).render("urls_login", templateVars);
      return next();
}) 

app.post("/logout", (req, res) => {
  res.cookie("user_id", "");
  res.cookie("email", "");
  console.log("Data: " + JSON.stringify(data));
  res.redirect("/");
})

app.get("/register", (req, res) => {
  let templateVars = { message: undefined };
  res.render("urls_register", templateVars);
})

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const hashed_password = bcrypt.hashSync(password, salt);

  let templateVars = { message: undefined, email: email };

  const keys = Object.keys(data);

  console.log("email: " + email);
  console.log("hashed_password: " + hashed_password);

  for (var item in data) { 
    if (data[item].email === email) {
      // console.log(JSON.stringify(data));
      console.log("AT THE 400 REDIRECT - EMAIL ALREADY USED");

      templateVars["message"] = "An account already exists for that email address. Please use a different one.";
      res.status(400).render("urls_register", templateVars);
      return next(); // need to do this since using middleware
    }
  }

  if (email === "" || password === "") {
    templateVars["message"] = "Email and password cannot be blank";
    res.status(400).render("urls_register", templateVars);
    return next();
  }

  let user_id = generateRandomString(10, acceptableChars); // Randomly generate a user id
  
  res.cookie("user_id", user_id); // create user_id cookie 
  res.cookie("email", email); // puts email in the cookie
  data[user_id] = { id: user_id, email: email, password: hashed_password };
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



