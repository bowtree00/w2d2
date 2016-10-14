//  const data = {
//   users: [
//     {id: "userRandomID", email: "testemail@gmail.com", password: "asdf"}
//   ]
// }

//   new_user = { id: "user_id", email: "email", password: "password" };
//   data.users.push(new_user);
//   console.log(data);
//   
//   
  
  if (user_id) {
    // console.log("data[user_id]: " + JSON.stringify(data[user_id]));
    let email = data[user_id].email;
    console.log("email: " + email);
    var templateVars = { user_id: user_id, email: email };
  } else {
  // console.log("Email: " + email);
    var templateVars = { user_id: user_id, email: undefined };
  };
  