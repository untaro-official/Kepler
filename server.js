const express = require("express");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(express.static("public"))


app.get('/', (_, res) => {
    res.sendFile('public/index.html', {root: __dirname})
})

app.listen(port, () => {
    console.log("App is listening on port ", port);
})