const express = require('express');
const app = express();
const port = 3001;
const low = require('lowdb')
const fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')


app.set('view engine', 'pug');

app.set('views','./views');

app.get('/',(req,res) => res.render("index"));

app.get('/input',(req,res) => {

  console.log(req.query.contextTransactions);

  fs.writeFile('/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src/test/testcases/sendEther.txt',req.query.contextTransactions,_ => {
    var spawn = require("child_process").spawn;

    var process = spawn('python3',["/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src/run.py","run.py","test","StateGenSuite"], {cwd: '/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src'});
    process.stdout.on('data',data => {
      console.log("oke");
      res.send(JSON.parse(data));
    })

  });
});



app.listen(port, function(){
  console.log('server is listening on port' + port);
});
