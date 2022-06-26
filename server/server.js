const mongoose = require('mongoose');
const Document = require('./Document');
const express = require('express');
require('dotenv').config();
const PORT = process.env.PORT || '3001';
const USER_NAME = process.env.USER_NAME;
const PASS = process.env.PASS;
const app = express();
const server = require('http').createServer(app);

mongoose.connect(`mongodb+srv://${USER_NAME}:${PASS}@cluster0.f4tqsj5.mongodb.net/?retryWrites=true&w=majority`,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
});


const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
});
  
server.listen(PORT, () => {
    console.log('server running at 3001');
});
  
app.get('/', (req, res) => {
    res.send("I'm working");
});
  
io.on("connection", socket => {
    socket.on("get-document", async documentId => {
        const document = await findOrCreateDocument(documentId);

        socket.join(documentId)
        socket.emit('load-document', document.data);

        socket.on("send-changes", delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data });
        })
    })
});

const findOrCreateDocument = async (id) => {
    if (!id) return;
    const defaultValue = '';

    const document = await Document.findById(id);
    if (document) return document;

    return await Document.create({ _id: id, data: defaultValue })
}