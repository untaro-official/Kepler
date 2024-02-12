const express = require("express");
require("dotenv").config();
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static("public/build"))


app.get('/', (_, res) => {
    // res.sendFile('public/index.html', {root: __dirname})
    const indexPath = path.join(__dirname, "public", "build", "index.html");
    console.log(indexPath);
    res.sendFile(indexPath);
})

app.listen(port, () => {
    console.log("App is listening on port ", port);
})