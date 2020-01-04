const bcrypt = require("bcrypt");

users = []; // TODO: replace by database

/**
 * reads all users from database
 */
exports.getAllUsers = (req, res) => {
  res.status(200).send(users);
};

/** create a new user */
exports.__createUser = async (req, res) => {
  if (
    users.find(user => user.name == req.body.name) /* TODO: Database */ != null
  ) {
    res.status(400).send("User already exists");
  }
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      name: req.body.name,
      password: hashedPassword
    };
    users.push(user); // TODO: Database
    res.status(201).send("User created");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};
exports.___createUser = async (req, res) => {
  createNewUser(req.body.name, req.body.password)
    .then(result => res.status(201).send(result))
    .catch(err => res.status(500).send(err));
};
exports.createUser = async (req, res) => {
  try{
    const result = await createNewUser(req.body.name, req.body.password)
    res.status(201).send(result)
  } catch(err) {
    res.status(500).send(err)
  }
};

async function createNewUser(name, password) {
  return new Promise((resolve, reject) => {
    if (users.find(user => user.name == name) /* TODO: Database */ != null) {
      reject("User already exists");
      return;
    }
    bcrypt.hash(password, 10)
      .then(hashedPassword => {
        const user = {
          name: name,
          password: hashedPassword
        };
        users.push(user); // TODO: Database
        resolve("User created");
      })
      .catch(err => reject(error.message));
  });
}

/** login with user and password (needs to be passed) */
exports.login = async (req, res) => {
  try {
    const user = users.find(user => user.name == req.body.name); // TODO: Database
    if (user == null) {
      res.status(400).send("Cannot find user");
    } else if (await bcrypt.compare(req.body.password, user.password)) {
      res.status(200).send("User authenticated");
    } else {
      res.status(400).send("User not authenticated");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
