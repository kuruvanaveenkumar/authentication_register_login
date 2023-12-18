const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

app.use(express.json());
const bcrypt = require("bcrypt");

let dataBase = null;
const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const details = request.body;
  const { username, name, password, gender, location } = details;

  const hashedPassword = await bcrypt.hash(password, 10);

  const queryData = `SELECT * FROM user WHERE username = '${username}';`;
  const getData = await dataBase.get(queryData);

  if (getData === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addQuery = `INSERT INTO user
                            (username, name, password, gender, location)
                            VALUES(
                                '${username}',
                                 '${name}',
                                 '${hashedPassword}',
                                 '${gender}',
                                 '${location}'
                    
                            );`;
      await dataBase.run(addQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const credentials = request.body;
  const { username, password } = credentials;
  const queryData = `SELECT * FROM user WHERE username = '${username}';`;
  const getData = await dataBase.get(queryData);

  if (getData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, getData.password);
    if (comparePassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const queryData = `SELECT * FROM user WHERE username = '${username}';`;
  const getData = await dataBase.get(queryData);

  if (getData !== undefined) {
    const currentPassword = await bcrypt.compare(oldPassword, getData.password);

    if (currentPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await dataBase.run(updatePasswordQuery);

        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
