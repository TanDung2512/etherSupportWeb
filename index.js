const express = require('express');
const app = express();
const port = 3001;
const low = require('lowdb')
const fs = require('fs')
const bodyParser = require("body-parser");

const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
const solc = require('solc');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

var inputEscrow = {
  language: 'Solidity',
  sources: {
    'escrow.sol': {
      content:
      `
      pragma solidity ^0.5.4;

      contract AmazingTokenInterface {
          function totalSupply() public view returns (uint);
          function balanceOf(address _tokenOwner) external view returns (uint);
          function transfer(address _to, uint tokens) public returns (bool success);
          function approve(address _spender, uint tokens) public returns(bool success);
          function transferFrom(address _from, address _to, uint tokens) public returns (bool success);
          function allowance(address tokenOwner, address spender) public view returns (uint remaining);

          event Transfer(address indexed from, address indexed to, uint tokens);
          event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

      }

      contract escrow {
          address owner ;
          struct transaction {
              address payable sendEthAddress ;
              address payable sendTokenAddress ;
              uint eth_amount;
              uint token_amount;
              bool exist;
              bool approve_Eth;
              bool approve_Token;
              address addressToken;
          }

          event check(uint number_line);


          mapping (address => mapping(address=> transaction)) transactionInfo;

          constructor() public{
              owner = msg.sender;
          }

          function sendeth(address payable _from, address payable _to, uint ether_amount) payable public {

              require(msg.sender == _from && msg.value == ether_amount, "line 72");

              if(transactionInfo[_from][_to].exist == true){

                  transaction storage currentTransaction = transactionInfo[_from][_to];

                  currentTransaction.eth_amount = msg.value;
                  currentTransaction.approve_Eth = true;

                  /*
                      check whether A and B has sent Token and Eth or not
                  */
                  if(currentTransaction.approve_Eth == true && currentTransaction.approve_Token == true ){

                      //send token in smart contract to "ethereum sender"
                      AmazingTokenInterface(currentTransaction.addressToken).transfer(currentTransaction.sendEthAddress,currentTransaction.token_amount);

                      //send eth in smart contract to "token sender"
                      address payable TokenerAddress = currentTransaction.sendTokenAddress;
                      TokenerAddress.transfer(currentTransaction.eth_amount);

                      //set "A and B" 's transaction into " not exist"
                      currentTransaction.eth_amount = 0 ;
                      currentTransaction.token_amount = 0 ;
                      currentTransaction.exist = false;
                  }
              }
              else{
                  //create new transaction and because there is no token address so we will set  "token address" = null address
                  address nullAddress = address(0x0);
                  transaction memory newTransaction = transaction(_from,_to,msg.value,0,true,true,false,nullAddress);

                  transactionInfo[_from][_to] = newTransaction;
                  transactionInfo[_to][_from] = newTransaction;
              }
          }

          function sendtoken(address payable _from, address payable _to, address _tokenAddress, uint token_amount ) public {
              require(msg.sender == _from, "line 67");

              //check token approve and send token to smart contract
              uint checkAllowance = AmazingTokenInterface(_tokenAddress).allowance(_from,address(this));
              require(checkAllowance == token_amount, "line 71");
              /*
                  send token from "token sender" into smart contract
              */
              AmazingTokenInterface(_tokenAddress).transferFrom(_from, address(this), checkAllowance);

              if(transactionInfo[_from][_to].exist == true){

                  transaction storage currentTransaction = transactionInfo[_from][_to];
                  currentTransaction.addressToken = _tokenAddress;
                  currentTransaction.token_amount = checkAllowance;
                  currentTransaction.approve_Token = true;

                  /*
                      check whether A and B has sent Token and Eth or not
                  */
                  if(currentTransaction.approve_Eth == true && currentTransaction.approve_Token == true ){

                  //send token in smart contract to "ethereum sender"
                  AmazingTokenInterface(_tokenAddress).transfer(currentTransaction.sendEthAddress,currentTransaction.token_amount);

                      //send eth in smart contract to "token sender"
                      address payable TokenerAddress = currentTransaction.sendTokenAddress;
                      TokenerAddress.transfer(currentTransaction.eth_amount);

                      //set "A and B" 's transaction into " not exist"
                      currentTransaction.eth_amount = 0 ;
                      currentTransaction.token_amount = 0 ;
                      currentTransaction.exist = false;
                  }
              }
              else{


                  //create new transaction between A and B
                  transaction memory newTransaction = transaction(_to,_from,0,token_amount,true,false,true,_tokenAddress);

                  transactionInfo[_from][_to] = newTransaction;
                  transactionInfo[_to][_from] = newTransaction;
              }
          }

      }`
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': [ '*' ]
      }
    }
  }
}
var inputAmazingToken = {
	language: 'Solidity',
	sources: {
		'amazingToken.sol': {
			content:`
      pragma solidity ^0.5.4;

      contract AmazingTokenInterface {
          function transfer(address _to, uint tokens) public returns (bool success);
          function approve(address _spender, uint tokens) public returns(bool success);
          function transferFrom(address _from, address _to, uint tokens) public returns (bool success);
          function allowance(address tokenOwner, address spender) public view returns (uint remaining);

          event Transfer(address indexed from, address indexed to, uint tokens);
          event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
      }

      // token name = "amazing"
      // symbol = "AMZ"
      // decimals = 18 ;
      // owner address = msg.sender
      contract AmazingToken is AmazingTokenInterface {

          mapping (address => uint256) balances;

          mapping(address => mapping(address => uint256)) allowed;

          string public symbol;
          string public name;
          uint8 public decimals;
          uint _totalSupply;

          constructor() public {
              name = "amazing";
              symbol = "AMZ";
              decimals = 18;
              _totalSupply = 1000000000000;
              balances[msg.sender] = _totalSupply;
              emit Transfer(address(0), msg.sender, _totalSupply);
          }

          function balanceOf(address _tokenOwner) external view returns (uint) {
            return balances[_tokenOwner];
          }

          function allowance(address tokenOwner, address spender) public view returns (uint remaining){
            return allowed[tokenOwner][spender];
          }

          function approve(address _spender, uint tokens) public returns(bool success){
              allowed[msg.sender][_spender] = tokens;
              emit Approval(msg.sender,_spender, tokens);
          }

          function _transfer(address _from, address _to, uint tokens) private returns (bool success){
            balances[_from] = balances[_from] - tokens;
            balances[_to] = balances[_to] + tokens;
            emit Transfer(_from, _to,tokens);
          }

          function transfer(address _to, uint tokens) public returns (bool success){
            require(tokens <=  balances[msg.sender], "line 59 token");
            _transfer(msg.sender,_to,tokens);
          }

          function transferFrom(address _from, address _to, uint tokens) public returns (bool success){
            require(allowed[_from][_to] <= tokens, "line 64 token");
            require(msg.sender == _to, "line 65 token");
            require(tokens <= balances[_from], "line 66 token");

            allowed[_from][_to] = allowed[_from][_to] - tokens;
            _transfer(_from,_to,tokens);
          }
      }

      `
		}
	},
	settings: {
		outputSelection: {
			'*': {
				'*': [ '*' ]
			}
		}
	}
}

db.defaults({ exchange: {}})
  .write()

db.get('exchange')
    .assign({ transactions : []})
    .write()

app.use(bodyParser.urlencoded({
      extended: true
  }));

app.use(bodyParser.json());

app.set('view engine', 'pug');

app.set('views','./views');

app.get('/',(req,res) => res.render("index"));
/*
  senderName : ...
  userToken : ...
  userEth : ...
  transaction : ...
*/
app.post('/sendTransaction',(req,res) => {

    var data = db.get('exchange')
      .value();

    db.get('exchange')
      .assign({transactions : [...data.transactions,{name : req.body.senderName, transaction : req.body.transaction}]})
      .write()

    var data = db.get('exchange')
      .value();
    res.send("ok")
});

app.post('/validate',(req,res) => {
  console.log(req.body.transactions)
      fs.writeFile('/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src/test/testcases/sendEther.txt',req.body.transactions,_ => {
        var spawn = require("child_process").spawn;

        var process = spawn('python3',["/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src/run.py","run.py","test","StateGenSuite"], {cwd: '/Users/mac/PycharmProjects/EtherSupport/Ether/upload/src'});
        process.stdout.on('data',data => {
          console.log("oke");
          res.send(JSON.parse(data));
        })
      });

});

app.get('/refresh', (req,res) => {
  console.log("refresh");
  var data = db.get('exchange.transactions')
    .value()
  res.send(JSON.stringify(data));
});

app.get('/createTokenContract',(req,res) => {
  if (typeof web3 !== 'undefined') {

    let output =JSON.parse(solc.compile(JSON.stringify(inputAmazingToken)));
    // res.send(output);
    // for (var contractName in output.contracts['amazingToken.sol']) {
	  //    console.log(contractName + ': ' + output.contracts['amazingToken.sol']['AmazingToken'].evm.interface);
    //  }
    output = output.contracts['amazingToken.sol']['AmazingToken'];
    let amazing = new web3.eth.Contract(output.abi, null, {
        data: '0x' + output.evm.bytecode.object
    });
    console.log(JSON.stringify(output.abi));
    amazing.deploy().estimateGas().
    then((estimatedGas) => {
        console.log("Estimated gas: " + estimatedGas);
        gas = estimatedGas;
    }).
    catch(console.error);

    amazing.deploy().send({
    from: "0x87616A71Ae0B412e402D846fae89dBF57a32031e",
    gasPrice: 100000000000,
    gas: 4712388
    }).then((instance) => {
    console.log("Contract mined at " + instance.options.address);
    escrowInstance = instance;
    });
  }
});

app.get('/createSmartContract',(req,res) => {
  if (typeof web3 !== 'undefined') {



    let output = JSON.parse(solc.compile(JSON.stringify(inputEscrow)));
    console.log(output);

    let tokenInterface = output.contracts['escrow.sol']['AmazingTokenInterface'];
    let tokenDeploy = new web3.eth.Contract(tokenInterface.abi, null, {
        data: '0x' + tokenInterface.evm.bytecode.object
    });
    tokenDeploy.deploy().estimateGas().
    then((estimatedGas) => {
        gas = estimatedGas;
    }).
    catch(console.error);
    tokenDeploy.deploy().send({
      from: "0x87616A71Ae0B412e402D846fae89dBF57a32031e",
      gasPrice: "100000000000",
      gas: "4712388",
    });

    output =  output.contracts['escrow.sol']['escrow'];

    let escrow = new web3.eth.Contract(output.abi, null, {
        data: '0x' + output.evm.bytecode.object
    });


    console.log(JSON.stringify(output.abi));
    escrow.deploy().estimateGas().
    then((estimatedGas) => {
        console.log("Estimated gas: " + estimatedGas);
        gas = estimatedGas;
    }).
    catch(console.error);
        escrow.deploy().send({
        from: "0x87616A71Ae0B412e402D846fae89dBF57a32031e",
        gasPrice: "100000000000",
        gas: "4712388",
        }).then((instance) => {
        console.log("Contract escrow mined at " + instance.options.address);
        escrowInstance = instance;
    });
    }
}
);

app.listen(port, function(){
  console.log('server is listening on port' + port);
});
