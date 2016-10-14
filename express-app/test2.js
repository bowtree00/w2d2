 const data = {
  users: [
    {id: "userRandomID", email: "testemail@gmail.com", password: "asdf"}
  ]
}

  new_user = { id: "user_id", email: "email", password: "password" };
  data.users.push(new_user);
  console.log(data);