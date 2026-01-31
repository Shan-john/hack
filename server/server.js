const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json());

// Receive data from phone
app.post("/print", (req, res) => {
  const text = req.body.text;
  console.log("Received from phone:", text);

  // Here you can send to printer later
  res.json({ status: "Received", data: text });
});

app.listen(3000, () => {
  console.log("Server running on http://0.0.0.0:3000");
});
