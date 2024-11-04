require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
let bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

let urlSchema = mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
  },
});

let Url = mongoose.model("Url", urlSchema);

let responseObj = {};
app.post("/api/shorturl", (request, response) => {
  let inputUrl = request.body["url"];

  let validUrl = new RegExp(
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
  );

  if (!inputUrl.match(validUrl)) {
    response.json({ error: "Invalid URL" });
    return;
  }

  responseObj["original_url"] = inputUrl;

  let shortUrl = 1;

  Url.findOne({})
    .sort({ short_url: -1 })
    .exec((error, result) => {
      if (!error && result != undefined) {
        shortUrl = result.short_url + 1;
      }
      if (!error) {
        Url.findOneAndUpdate(
          { original_url: inputUrl },
          { original_url: inputUrl, short_url: shortUrl },
          { new: true, upsert: true },
          (error, savedUrl) => {
            if (!error) {
              responseObj["short_url"] = savedUrl.short_url;
              response.json(responseObj);
            }
          }
        );
      }
    });
});

app.get("/api/shorturl/:short", (request, response) => {
  let shortUrl = request.params.short;
  
  Url.findOne({ short_url: shortUrl }, (error, result) => {
    if (!error && result != undefined) {
      response.redirect(result.original_url);
    } else {
      response.json({ error: "URL Does Not Exist" });
    }
  });
});
