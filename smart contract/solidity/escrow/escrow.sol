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

}
