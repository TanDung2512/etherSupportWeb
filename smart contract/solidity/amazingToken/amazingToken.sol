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
