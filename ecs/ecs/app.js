const express = require('express')
const app = express()

app.get('/', (req, res) => res.send("Let's run a multi-architecture container!"))
app.listen(80, () => console.log('Server ready'))